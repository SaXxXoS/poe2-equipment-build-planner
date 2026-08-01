import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry } from '../../domain'
import { resolveCharacterAttributes } from '../character-attributes/model'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export const CHARACTER_SURVIVABILITY_MODEL_VERSION = '1.0.0'

export interface CharacterSurvivabilityModel {
  modelVersion: typeof CHARACTER_SURVIVABILITY_MODEL_VERSION
  weaponSet: 'set-1' | 'set-2'
  status: 'exact-confirmed-components' | 'blocked-missing-level' | 'blocked-unknown-class' | 'partial-blocked-special-cases'
  life?: { baseFromLevel: number; fromStrength: number; fromDexterityPassives: number; flatFromEquipment: number; flatFromPassives: number; increasedReducedPercent: number; moreLessMultiplier: number; maximum: number }
  stunThreshold?: { baseFromLife: number; flatFromAttributes: number; flatOther: number; increasedReducedPercent: number; moreLessMultiplier: number; total: number }
  ailmentThreshold?: { baseFromLife: number; flatFromAttributes: number; flatOther: number; increasedReducedPercent: number; moreLessMultiplier: number; total: number }
  sourceNodeIds: string[]
  sourceTexts: string[]
  blockedLines: string[]
  sourceReferences: string[]
  limitations: string[]
}

const unique = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'))
const clean = (value: string) => value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').trim()
const appliesToSet = (entry: EquipmentEntry, set: 'set-1' | 'set-2') => {
  if (entry.slotId.includes('weapon-set-1')) return set === 'set-1'
  if (entry.slotId.includes('weapon-set-2')) return set === 'set-2'
  return true
}
const round = (value: number) => Number(value.toFixed(6))

function allocatedNodes(tree: RealPassiveTree | undefined, planning: RealPassivePlanningIntegrationResult | undefined, set: 'set-1' | 'set-2') {
  if (!tree || !planning) return []
  const ids = new Set([...(planning.weaponSetPlanning?.[set]?.allocatedNodeIds ?? planning.pipelineResult?.allocatedNodeIds ?? []), ...(planning.ascendancyPlanning?.allocatedNodeIds ?? [])])
  return tree.nodes.filter(node => ids.has(node.id))
}

const equipmentValue = (equipment: EquipmentEntry[], set: 'set-1' | 'set-2', pattern: RegExp) => equipment
  .filter(entry => appliesToSet(entry, set))
  .flatMap(entry => entry.modifierValues)
  .flatMap(modifier => modifier.statValues ?? [])
  .filter(stat => pattern.test(stat.statId))
  .reduce((sum, stat) => sum + stat.value, 0)

export function resolveCharacterSurvivabilityModel(input: { classId?: string; characterLevel?: number; equipment: EquipmentEntry[]; weaponSet: 'set-1' | 'set-2'; passiveTree?: RealPassiveTree; realPassivePlanning?: RealPassivePlanningIntegrationResult }): CharacterSurvivabilityModel {
  const base = {
    modelVersion: CHARACTER_SURVIVABILITY_MODEL_VERSION as typeof CHARACTER_SURVIVABILITY_MODEL_VERSION,
    weaponSet: input.weaponSet,
    sourceNodeIds: [] as string[], sourceTexts: [] as string[], blockedLines: [] as string[],
    sourceReferences: ['generated/pob2/damage-reference.json:resourceConstants', 'PoB2 src/Modules/CalcPerform.lua:Strength grants 2 Life', 'PoB2 src/Modules/CalcSetup.lua:Ailment Threshold is 50% of Life', 'PoB2 src/Modules/CalcDefence.lua:Stun Threshold base is Life', 'data-sources/poe2-tree/raw/0.5.2/data.json'],
    limitations: ['Bedingte Schwellenwirkungen und alternative Schwellenbasen werden ohne bestätigten Laufzeitzustand nicht angewandt.', 'Nur technische Gegenstandswerte und exakt erkannte, unbedingte Passivtexte werden verrechnet.'],
  }
  const level = Number.isInteger(input.characterLevel) && Number(input.characterLevel) >= 1 ? Math.min(100, Number(input.characterLevel)) : undefined
  if (level == null) return { ...base, status: 'blocked-missing-level' }
  if (!input.classId) return { ...base, status: 'blocked-unknown-class' }
  const attributes = resolveCharacterAttributes({ classId: input.classId, equipment: input.equipment, activeSet: input.weaponSet, passiveTree: input.passiveTree, realPassivePlanning: input.realPassivePlanning })
  if (attributes.status !== 'exact-confirmed-sources') return { ...base, status: 'blocked-unknown-class' }

  let flatLife = 0, lifePercent = 0, lifeMore = 1, lifePerDexterity = 0
  let stunFromAttributes = 0, stunFlat = 0, stunPercent = 0, stunMore = 1
  let ailmentFromAttributes = 0, ailmentFlat = 0, ailmentPercent = 0, ailmentMore = 1
  for (const node of allocatedNodes(input.passiveTree, input.realPassivePlanning, input.weaponSet)) {
    for (const sourceText of node.stats.map(stat => stat.sourceText).filter((value): value is string => Boolean(value))) {
      const text = clean(sourceText)
      let matched = false
      const lifePerDex = text.match(/^\+1 Life per (\d+) Dexterity$/i)
      const stunPerDex = text.match(/^\+(\d+) to Stun Threshold per Dexterity$/i)
      const stunPerStr = text.match(/^\+(\d+) to Stun Threshold per Strength$/i)
      const ailmentPerDex = text.match(/^\+(\d+) to (?:Elemental )?Ailment Threshold per Dexterity$/i)
      const flatLifeMatch = text.match(/^\+(\d+) to (?:maximum )?Life$/i)
      const lifePercentMatch = text.match(/^(\d+(?:\.\d+)?)% (increased|reduced|more|less) maximum Life$/i)
      const flatThreshold = text.match(/^\+(\d+) to (Stun|(?:Elemental )?Ailment) Threshold$/i)
      const thresholdPercent = text.match(/^(\d+(?:\.\d+)?)% (increased|reduced|more|less) (Stun|(?:Elemental )?Ailment) Threshold$/i)
      if (lifePerDex) { lifePerDexterity += Math.floor(attributes.total.dexterity / Number(lifePerDex[1])); matched = true }
      else if (stunPerDex) { stunFromAttributes += Number(stunPerDex[1]) * attributes.total.dexterity; matched = true }
      else if (stunPerStr) { stunFromAttributes += Number(stunPerStr[1]) * attributes.total.strength; matched = true }
      else if (ailmentPerDex) { ailmentFromAttributes += Number(ailmentPerDex[1]) * attributes.total.dexterity; matched = true }
      else if (flatLifeMatch) { flatLife += Number(flatLifeMatch[1]); matched = true }
      else if (lifePercentMatch) {
        const value = Number(lifePercentMatch[1]), operator = lifePercentMatch[2].toLowerCase()
        if (operator === 'increased') lifePercent += value
        else if (operator === 'reduced') lifePercent -= value
        else if (operator === 'more') lifeMore *= 1 + value / 100
        else lifeMore *= 1 - value / 100
        matched = true
      } else if (flatThreshold) {
        if (/stun/i.test(flatThreshold[2])) stunFlat += Number(flatThreshold[1]); else ailmentFlat += Number(flatThreshold[1])
        matched = true
      } else if (thresholdPercent) {
        const value = Number(thresholdPercent[1]), operator = thresholdPercent[2].toLowerCase(), stun = /stun/i.test(thresholdPercent[3])
        if (operator === 'increased') { if (stun) stunPercent += value; else ailmentPercent += value }
        else if (operator === 'reduced') { if (stun) stunPercent -= value; else ailmentPercent -= value }
        else if (operator === 'more') { if (stun) stunMore *= 1 + value / 100; else ailmentMore *= 1 + value / 100 }
        else { if (stun) stunMore *= 1 - value / 100; else ailmentMore *= 1 - value / 100 }
        matched = true
      }
      if (matched) { base.sourceNodeIds.push(node.id); base.sourceTexts.push(sourceText) }
      else if (/\b(?:Life|Stun Threshold|Ailment Threshold)\b/i.test(text)) base.blockedLines.push(sourceText)
    }
  }

  const baseFromLevel = reference.resourceConstants.lifePerLevel * (level + reference.resourceConstants.lifeLevelOffset)
  const fromStrength = attributes.total.strength * 2
  const flatFromEquipment = equipmentValue(input.equipment, input.weaponSet, /^(?:base_)?maximum_life$/)
  const equipmentLifePercent = equipmentValue(input.equipment, input.weaponSet, /^(?:maximum_)?life_\+%$/)
  const maximumLife = Math.floor((baseFromLevel + fromStrength + lifePerDexterity + flatFromEquipment + flatLife) * Math.max(0, 1 + (lifePercent + equipmentLifePercent) / 100) * Math.max(0, lifeMore))
  const equipmentStunFlat = equipmentValue(input.equipment, input.weaponSet, /^(?:base_)?stun_threshold$/)
  const equipmentStunPercent = equipmentValue(input.equipment, input.weaponSet, /^stun_threshold_\+%$/)
  const equipmentAilmentFlat = equipmentValue(input.equipment, input.weaponSet, /^(?:base_)?(?:elemental_)?ailment_threshold$/)
  const equipmentAilmentPercent = equipmentValue(input.equipment, input.weaponSet, /^(?:elemental_)?ailment_threshold_\+%$/)
  const stunTotal = (maximumLife + stunFromAttributes + stunFlat + equipmentStunFlat) * Math.max(0, 1 + (stunPercent + equipmentStunPercent) / 100) * Math.max(0, stunMore)
  const ailmentBase = maximumLife * 0.5
  const ailmentTotal = (ailmentBase + ailmentFromAttributes + ailmentFlat + equipmentAilmentFlat) * Math.max(0, 1 + (ailmentPercent + equipmentAilmentPercent) / 100) * Math.max(0, ailmentMore)
  const blockedLines = unique([...base.blockedLines, ...attributes.blockedPassiveLines])
  return {
    ...base, status: blockedLines.length ? 'partial-blocked-special-cases' : 'exact-confirmed-components',
    life: { baseFromLevel, fromStrength, fromDexterityPassives: lifePerDexterity, flatFromEquipment, flatFromPassives: flatLife, increasedReducedPercent: round(lifePercent + equipmentLifePercent), moreLessMultiplier: round(lifeMore), maximum: maximumLife },
    stunThreshold: { baseFromLife: maximumLife, flatFromAttributes: stunFromAttributes, flatOther: stunFlat + equipmentStunFlat, increasedReducedPercent: round(stunPercent + equipmentStunPercent), moreLessMultiplier: round(stunMore), total: round(stunTotal) },
    ailmentThreshold: { baseFromLife: round(ailmentBase), flatFromAttributes: ailmentFromAttributes, flatOther: ailmentFlat + equipmentAilmentFlat, increasedReducedPercent: round(ailmentPercent + equipmentAilmentPercent), moreLessMultiplier: round(ailmentMore), total: round(ailmentTotal) },
    sourceNodeIds: unique(base.sourceNodeIds), sourceTexts: unique(base.sourceTexts), blockedLines,
  }
}
