import type { EquipmentEntry } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import { classifyPassiveText, derivePassiveTargetNodeType } from '../passive-targeting/classifier'
import { structurePassiveStatEffect } from '../passive-targeting/effect-model'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export const CHARACTER_DEFENCE_MODEL_VERSION = '1.0.0'
export type CharacterDefenceType = 'armour' | 'evasion' | 'energyShield'

export interface CharacterDefenceContribution {
  type: CharacterDefenceType
  equipmentBase: number
  flatPassive: number
  increasedReducedPercent: number
  moreLessMultiplier: number
  calculatedContribution: number
  sourceNodeIds: string[]
  sourceTexts: string[]
}

export interface CharacterDefenceModel {
  modelVersion: typeof CHARACTER_DEFENCE_MODEL_VERSION
  weaponSet: 'set-1' | 'set-2'
  status: 'partial-confirmed-equipment-and-passives' | 'no-confirmed-defence-values'
  contributions: CharacterDefenceContribution[]
  excludedWeaponItemIds: string[]
  blockedPassiveLines: string[]
  limitations: string[]
}

const types: CharacterDefenceType[] = ['armour', 'evasion', 'energyShield']
const tagFor: Record<CharacterDefenceType, string> = {
  armour: 'armour',
  evasion: 'evasion',
  energyShield: 'energy-shield',
}
const isWeaponSlot = (slotId: string) => /weapon/i.test(slotId)
const round = (value: number) => Number(value.toFixed(6))
const uniqueSorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'))

function allocatedNodeIds(
  planning: RealPassivePlanningIntegrationResult | undefined,
  weaponSet: 'set-1' | 'set-2',
) {
  const selected = planning?.weaponSetPlanning?.[weaponSet] ?? planning?.pipelineResult
  return uniqueSorted([
    ...(selected?.allocatedNodeIds ?? []),
    ...(planning?.ascendancyPlanning?.allocatedNodeIds ?? []),
  ])
}

export function resolveCharacterDefenceModel(input: {
  equipment: EquipmentEntry[]
  passiveTree?: RealPassiveTree
  realPassivePlanning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
}): CharacterDefenceModel {
  const excludedWeaponItemIds = uniqueSorted(input.equipment
    .filter(item => isWeaponSlot(item.slotId) && types.some(type => (item.defences?.[type] ?? 0) !== 0))
    .map(item => item.id))
  const equipment = input.equipment.filter(item => !isWeaponSlot(item.slotId))
  const working = Object.fromEntries(types.map(type => [type, {
    type,
    equipmentBase: equipment.reduce((sum, item) => sum + (item.defences?.[type] ?? 0), 0),
    flatPassive: 0,
    increasedReducedPercent: 0,
    moreLessMultiplier: 1,
    sourceNodeIds: [] as string[],
    sourceTexts: [] as string[],
  }])) as Record<CharacterDefenceType, Omit<CharacterDefenceContribution, 'calculatedContribution'>>
  const blockedPassiveLines: string[] = []
  const nodeIds = new Set(allocatedNodeIds(input.realPassivePlanning, input.weaponSet))

  for (const node of input.passiveTree?.nodes ?? []) {
    if (!nodeIds.has(node.id)) continue
    const nodeType = derivePassiveTargetNodeType(node)
    for (const sourceText of node.stats.map(stat => stat.sourceText).filter((value): value is string => Boolean(value))) {
      const effect = structurePassiveStatEffect(classifyPassiveText(sourceText, nodeType))
      const targets = effect ? types.filter(type => effect.tags.includes(tagFor[type] as never)) : []
      if (!effect || targets.length === 0) continue
      if (effect.aggregationStatus !== 'ready') {
        blockedPassiveLines.push(sourceText)
        continue
      }
      for (const type of targets) {
        const target = working[type]
        if (effect.operator === 'flat-add') target.flatPassive += effect.value
        if (effect.operator === 'increased') target.increasedReducedPercent += effect.value
        if (effect.operator === 'reduced') target.increasedReducedPercent -= effect.value
        if (effect.operator === 'more') target.moreLessMultiplier *= 1 + effect.value / 100
        if (effect.operator === 'less') target.moreLessMultiplier *= 1 - effect.value / 100
        target.sourceNodeIds.push(node.id)
        target.sourceTexts.push(sourceText)
      }
    }
  }

  const contributions = types.map(type => {
    const value = working[type]
    return {
      ...value,
      equipmentBase: round(value.equipmentBase),
      flatPassive: round(value.flatPassive),
      increasedReducedPercent: round(value.increasedReducedPercent),
      moreLessMultiplier: round(value.moreLessMultiplier),
      calculatedContribution: round(
        (value.equipmentBase + value.flatPassive)
        * Math.max(0, 1 + value.increasedReducedPercent / 100)
        * Math.max(0, value.moreLessMultiplier),
      ),
      sourceNodeIds: uniqueSorted(value.sourceNodeIds),
      sourceTexts: uniqueSorted(value.sourceTexts),
    }
  })
  const productive = contributions.some(value => value.calculatedContribution !== 0)
  return {
    modelVersion: CHARACTER_DEFENCE_MODEL_VERSION,
    weaponSet: input.weaponSet,
    status: productive ? 'partial-confirmed-equipment-and-passives' : 'no-confirmed-defence-values',
    contributions,
    excludedWeaponItemIds,
    blockedPassiveLines: uniqueSorted(blockedPassiveLines),
    limitations: [
      'Das Ergebnis umfasst nur eingegebene endgültige Gegenstandswerte und unbedingte strukturierte Passiv- oder Aszendenzeffekte.',
      'Nicht belegte Charakter-Grundwerte, globale Rundungsregeln und bedingte Wirkungen werden nicht erfunden.',
      'Angezeigte Rüstungswerte auf Waffen werden als ungültige Eingabe ausgeschlossen.',
    ],
  }
}
