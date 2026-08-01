import reference from '../../../generated/pob2/damage-reference.json'
import type { EquipmentEntry } from '../../domain'
import { resolveCharacterAttributes } from '../character-attributes/model'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export const CHARACTER_SURVIVABILITY_MODEL_VERSION = '1.2.0'

export interface CharacterSurvivabilityModel {
  modelVersion: typeof CHARACTER_SURVIVABILITY_MODEL_VERSION
  weaponSet: 'set-1' | 'set-2'
  status: 'exact-confirmed-components' | 'blocked-missing-level' | 'blocked-unknown-class' | 'partial-blocked-special-cases'
  life?: { baseFromLevel: number; fromStrength: number; strengthLifePerPoint: number; inherentAttributeMultiplier: number; fromDexterityPassives: number; flatFromEquipment: number; flatFromPassives: number; increasedReducedPercent: number; moreLessMultiplier: number; preOverrideMaximum: number; maximum: number; override?: 'chaos-inoculation' }
  stunThreshold?: { baseKind: 'life' | 'pre-chaos-inoculation-life' | 'energy-shield' | 'mana'; basePercent: number; baseValue: number; additionalFromEnergyShield: number; additionalFromDefences: number; additionalFromEquipmentPositions: number; flatFromAttributes: number; flatOther: number; increasedReducedPercent: number; moreLessMultiplier: number; total: number }
  ailmentThreshold?: { baseFromLife: number; additionalFromEnergyShield: number; additionalFromDefences: number; additionalFromEquipmentPositions: number; flatFromAttributes: number; flatOther: number; increasedReducedPercent: number; moreLessMultiplier: number; total: number }
  avoidance?: { stunChance: number; elementalAilmentChance: number; stunImmune: boolean; stunImmunitySource: 'none' | 'unconditional' | 'energy-shield-condition' }
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

const defenceOnEquipment = (equipment: EquipmentEntry[], slotPattern: RegExp, type: 'armour' | 'evasion' | 'energyShield') => equipment
  .filter(entry => slotPattern.test(entry.slotId))
  .reduce((sum, entry) => sum + (entry.defences?.[type] ?? 0), 0)

export function resolveCharacterSurvivabilityModel(input: { classId?: string; characterLevel?: number; equipment: EquipmentEntry[]; weaponSet: 'set-1' | 'set-2'; passiveTree?: RealPassiveTree; realPassivePlanning?: RealPassivePlanningIntegrationResult; maximumEnergyShield?: number; maximumMana?: number; totalArmour?: number; totalEvasion?: number; hasEnergyShield?: boolean }): CharacterSurvivabilityModel {
  const base = {
    modelVersion: CHARACTER_SURVIVABILITY_MODEL_VERSION as typeof CHARACTER_SURVIVABILITY_MODEL_VERSION,
    weaponSet: input.weaponSet,
    sourceNodeIds: [] as string[], sourceTexts: [] as string[], blockedLines: [] as string[],
    sourceReferences: ['generated/pob2/damage-reference.json:resourceConstants', 'PoB2 src/Modules/CalcPerform.lua:Strength grants 2 Life', 'PoB2 src/Modules/CalcSetup.lua:Ailment Threshold is 50% of Life', 'PoB2 src/Modules/CalcDefence.lua:Stun Threshold base, avoidance caps and immunity', 'PoB2 src/Modules/ModParser.lua:threshold MORE, avoidance and immunity mappings', 'data-sources/poe2-tree/raw/0.5.2/data.json'],
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
  let stunAvoidance = 0, elementalAilmentAvoidance = 0, unconditionalStunImmune = false, energyShieldStunImmune = false
  let halvesLifeFromStrength = false, noStrengthLife = false, noAttributeBonuses = false, doubledAttributeBonuses = false, chaosInoculation = false
  const thresholdBases: Array<{ kind: 'energy-shield' | 'mana'; percent: number; sourceText: string; nodeId: string }> = []
  let additionalEnergyShieldToStunPercent = 0
  let additionalEnergyShieldToAilmentPercent = 0
  let additionalArmourToStunPercent = 0, additionalArmourToAilmentPercent = 0
  let additionalEvasionToStunPercent = 0, additionalEvasionToAilmentPercent = 0
  let lowestHelmetToStun = false, lowestBootsToAilment = false, armourItemsToStunPercent = 0
  for (const node of allocatedNodes(input.passiveTree, input.realPassivePlanning, input.weaponSet)) {
    for (const sourceText of node.stats.map(stat => stat.sourceText).filter((value): value is string => Boolean(value))) {
      for (const rawLine of sourceText.split(/\r?\n/)) {
      const text = clean(rawLine)
      let matched = false
      const lifePerDex = text.match(/^\+1 Life per (\d+) Dexterity$/i)
      const stunPerDex = text.match(/^\+(\d+) to Stun Threshold per Dexterity$/i)
      const stunPerStr = text.match(/^\+(\d+) to Stun Threshold per Strength$/i)
      const ailmentPerDex = text.match(/^\+(\d+) to (?:Elemental )?Ailment Threshold per Dexterity$/i)
      const flatLifeMatch = text.match(/^\+(\d+) to (?:maximum )?Life$/i)
      const lifePercentMatch = text.match(/^(\d+(?:\.\d+)?)% (increased|reduced|more|less) maximum Life$/i)
      const flatThreshold = text.match(/^\+(\d+) to (Stun|(?:Elemental )?Ailment) Threshold$/i)
      const thresholdPercent = text.match(/^(\d+(?:\.\d+)?)% (increased|reduced|more|less) (Stun|(?:Elemental )?Ailment) Threshold$/i)
      const energyShieldBase = text.match(/^Stun Threshold is based on (?:(\d+(?:\.\d+)?)% of your )?Energy Shield instead of Life$/i)
      const manaBase = text.match(/^Stun Threshold is based on (\d+(?:\.\d+)?)% of your Mana instead of Life$/i)
      const addEnergyShield = text.match(/^(\d+(?:\.\d+)?)% of your Energy Shield is added to your Stun Threshold$/i)
      const thresholdFromEnergyShield = text.match(/^Gain additional (Stun|(?:Elemental )?Ailment) Threshold equal to (\d+(?:\.\d+)?)% of maximum Energy Shield$/i)
      const thresholdFromDefence = text.match(/^Gain (\d+(?:\.\d+)?)% of (Armour|Evasion) Rating as extra (Stun|(?:Elemental )?Ailment) Threshold$/i)
      const armourItemsToStun = text.match(/^(?:Gain additional Stun Threshold equal to )?(\d+(?:\.\d+)?)% of (?:base |item )?Armour (?:from equipment|on Equipped Armour Items)$/i)
      const avoidStun = text.match(/^(\d+(?:\.\d+)?)% chance to Avoid being Stunned$/i)
      const avoidElementalAilments = text.match(/^(\d+(?:\.\d+)?)% chance to Avoid Elemental Ailments$/i)
      if (/^Inherent Life granted by Strength is halved$/i.test(text)) { halvesLifeFromStrength = true; matched = true }
      else if (/^(?:Strength provides no (?:inherent )?bonus to maximum Life|Gain no inherent bonus(?:es)? from Strength)$/i.test(text)) { noStrengthLife = true; matched = true }
      else if (/^Gain no inherent bonuses from Attributes$/i.test(text)) { noAttributeBonuses = true; matched = true }
      else if (/^Inherent bonuses (?:from Intelligence, Strength and Dexterity|gained from Attributes) are doubled$/i.test(text)) { doubledAttributeBonuses = true; matched = true }
      else if (/^Maximum Life is 1$/i.test(text) || /^Chaos Inoculation$/i.test(node.name.sourceText ?? '')) { chaosInoculation = true; matched = true }
      else if (energyShieldBase) { thresholdBases.push({ kind: 'energy-shield', percent: Number(energyShieldBase[1] ?? 100), sourceText, nodeId: node.id }); matched = true }
      else if (manaBase) { thresholdBases.push({ kind: 'mana', percent: Number(manaBase[1]), sourceText, nodeId: node.id }); matched = true }
      else if (addEnergyShield) { additionalEnergyShieldToStunPercent += Number(addEnergyShield[1]); matched = true }
      else if (thresholdFromEnergyShield) {
        if (/stun/i.test(thresholdFromEnergyShield[1])) additionalEnergyShieldToStunPercent += Number(thresholdFromEnergyShield[2])
        else additionalEnergyShieldToAilmentPercent += Number(thresholdFromEnergyShield[2])
        matched = true
      }
      else if (thresholdFromDefence) {
        const value = Number(thresholdFromDefence[1]), armour = /armour/i.test(thresholdFromDefence[2]), stun = /stun/i.test(thresholdFromDefence[3])
        if (armour && stun) additionalArmourToStunPercent += value
        else if (armour) additionalArmourToAilmentPercent += value
        else if (stun) additionalEvasionToStunPercent += value
        else additionalEvasionToAilmentPercent += value
        matched = true
      }
      else if (/^Gain Stun Threshold equal to the lowest of Evasion and Armour on your Helmet$/i.test(text)) { lowestHelmetToStun = true; matched = true }
      else if (/^Gain (?:Elemental )?Ailment Threshold equal to the lowest of Evasion and Armour on your Boots$/i.test(text)) { lowestBootsToAilment = true; matched = true }
      else if (armourItemsToStun) { armourItemsToStunPercent += Number(armourItemsToStun[1]); matched = true }
      else if (/^(?:Your )?Stun Threshold is doubled$/i.test(text)) { stunMore *= 2; matched = true }
      else if (avoidStun) { stunAvoidance += Number(avoidStun[1]); matched = true }
      else if (avoidElementalAilments) { elementalAilmentAvoidance += Number(avoidElementalAilments[1]); matched = true }
      else if (/^(?:You )?Cannot be Stunned$/i.test(text)) { unconditionalStunImmune = true; matched = true }
      else if (/^(?:You )?Cannot be Stunned while you have Energy Shield$/i.test(text)) {
        if (input.hasEnergyShield == null) base.blockedLines.push(sourceText)
        else energyShieldStunImmune = input.hasEnergyShield
        matched = true
      }
      else if (lifePerDex) { lifePerDexterity += Math.floor(attributes.total.dexterity / Number(lifePerDex[1])); matched = true }
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
      else if (/\b(?:Life|Stun Threshold|Ailment Threshold|Avoid being Stunned|Avoid Elemental Ailments|Cannot be Stunned)\b/i.test(text)) base.blockedLines.push(sourceText)
      }
    }
  }

  const baseFromLevel = reference.resourceConstants.lifePerLevel * (level + reference.resourceConstants.lifeLevelOffset)
  const inherentAttributeMultiplier = noAttributeBonuses ? 0 : doubledAttributeBonuses ? 2 : 1
  const strengthLifePerPoint = noAttributeBonuses || noStrengthLife ? 0 : halvesLifeFromStrength ? 1 : 2
  const fromStrength = attributes.total.strength * strengthLifePerPoint * inherentAttributeMultiplier
  const flatFromEquipment = equipmentValue(input.equipment, input.weaponSet, /^(?:base_)?maximum_life$/)
  const equipmentLifePercent = equipmentValue(input.equipment, input.weaponSet, /^(?:maximum_)?life_\+%$/)
  const preOverrideMaximumLife = Math.floor((baseFromLevel + fromStrength + lifePerDexterity + flatFromEquipment + flatLife) * Math.max(0, 1 + (lifePercent + equipmentLifePercent) / 100) * Math.max(0, lifeMore))
  const maximumLife = chaosInoculation ? 1 : preOverrideMaximumLife
  const equipmentStunFlat = equipmentValue(input.equipment, input.weaponSet, /^(?:base_)?stun_threshold$/)
  const equipmentStunPercent = equipmentValue(input.equipment, input.weaponSet, /^stun_threshold_\+%$/)
  const equipmentAilmentFlat = equipmentValue(input.equipment, input.weaponSet, /^(?:base_)?(?:elemental_)?ailment_threshold$/)
  const equipmentAilmentPercent = equipmentValue(input.equipment, input.weaponSet, /^(?:elemental_)?ailment_threshold_\+%$/)
  const distinctThresholdBases = unique(thresholdBases.map(value => `${value.kind}:${value.percent}`))
  const selectedThresholdBase = distinctThresholdBases.length === 1 ? thresholdBases[0] : undefined
  if (distinctThresholdBases.length > 1) base.blockedLines.push(...thresholdBases.map(value => value.sourceText))
  let stunBaseKind: NonNullable<CharacterSurvivabilityModel['stunThreshold']>['baseKind'] = chaosInoculation ? 'pre-chaos-inoculation-life' : 'life'
  let stunBasePercent = 100
  let stunBaseValue = chaosInoculation ? preOverrideMaximumLife : maximumLife
  if (selectedThresholdBase?.kind === 'energy-shield' && input.maximumEnergyShield != null) { stunBaseKind = 'energy-shield'; stunBasePercent = selectedThresholdBase.percent; stunBaseValue = input.maximumEnergyShield * selectedThresholdBase.percent / 100 }
  else if (selectedThresholdBase?.kind === 'mana' && input.maximumMana != null) { stunBaseKind = 'mana'; stunBasePercent = selectedThresholdBase.percent; stunBaseValue = input.maximumMana * selectedThresholdBase.percent / 100 }
  else if (selectedThresholdBase) base.blockedLines.push(selectedThresholdBase.sourceText)
  const additionalFromEnergyShield = input.maximumEnergyShield == null ? 0 : input.maximumEnergyShield * additionalEnergyShieldToStunPercent / 100
  const additionalAilmentFromEnergyShield = input.maximumEnergyShield == null ? 0 : input.maximumEnergyShield * additionalEnergyShieldToAilmentPercent / 100
  if ((additionalEnergyShieldToStunPercent > 0 || additionalEnergyShieldToAilmentPercent > 0) && input.maximumEnergyShield == null) base.blockedLines.push('Additional threshold from maximum Energy Shield')
  const stunFromDefences = (input.totalArmour ?? 0) * additionalArmourToStunPercent / 100 + (input.totalEvasion ?? 0) * additionalEvasionToStunPercent / 100
  const ailmentFromDefences = (input.totalArmour ?? 0) * additionalArmourToAilmentPercent / 100 + (input.totalEvasion ?? 0) * additionalEvasionToAilmentPercent / 100
  if ((additionalArmourToStunPercent > 0 || additionalArmourToAilmentPercent > 0) && input.totalArmour == null) base.blockedLines.push('Additional threshold from Armour Rating')
  if ((additionalEvasionToStunPercent > 0 || additionalEvasionToAilmentPercent > 0) && input.totalEvasion == null) base.blockedLines.push('Additional threshold from Evasion Rating')
  const helmetArmour = defenceOnEquipment(input.equipment, /slot-helmet$/i, 'armour'), helmetEvasion = defenceOnEquipment(input.equipment, /slot-helmet$/i, 'evasion')
  const bootsArmour = defenceOnEquipment(input.equipment, /slot-boots$/i, 'armour'), bootsEvasion = defenceOnEquipment(input.equipment, /slot-boots$/i, 'evasion')
  const armourOnArmourItems = defenceOnEquipment(input.equipment, /slot-(?:helmet|gloves|boots|body-armour)$/i, 'armour')
  const stunFromEquipmentPositions = (lowestHelmetToStun ? Math.min(helmetArmour, helmetEvasion) : 0) + armourOnArmourItems * armourItemsToStunPercent / 100
  const ailmentFromEquipmentPositions = lowestBootsToAilment ? Math.min(bootsArmour, bootsEvasion) : 0
  const stunTotal = (stunBaseValue + additionalFromEnergyShield + stunFromDefences + stunFromEquipmentPositions + stunFromAttributes + stunFlat + equipmentStunFlat) * Math.max(0, 1 + (stunPercent + equipmentStunPercent) / 100) * Math.max(0, stunMore)
  const ailmentBase = maximumLife * 0.5
  const ailmentTotal = (ailmentBase + additionalAilmentFromEnergyShield + ailmentFromDefences + ailmentFromEquipmentPositions + ailmentFromAttributes + ailmentFlat + equipmentAilmentFlat) * Math.max(0, 1 + (ailmentPercent + equipmentAilmentPercent) / 100) * Math.max(0, ailmentMore)
  const stunImmune = unconditionalStunImmune || energyShieldStunImmune
  const blockedLines = unique([...base.blockedLines, ...attributes.blockedPassiveLines])
  return {
    ...base, status: blockedLines.length ? 'partial-blocked-special-cases' : 'exact-confirmed-components',
    life: { baseFromLevel, fromStrength, strengthLifePerPoint, inherentAttributeMultiplier, fromDexterityPassives: lifePerDexterity, flatFromEquipment, flatFromPassives: flatLife, increasedReducedPercent: round(lifePercent + equipmentLifePercent), moreLessMultiplier: round(lifeMore), preOverrideMaximum: preOverrideMaximumLife, maximum: maximumLife, ...(chaosInoculation ? { override: 'chaos-inoculation' as const } : {}) },
    stunThreshold: { baseKind: stunBaseKind, basePercent: stunBasePercent, baseValue: round(stunBaseValue), additionalFromEnergyShield: round(additionalFromEnergyShield), additionalFromDefences: round(stunFromDefences), additionalFromEquipmentPositions: round(stunFromEquipmentPositions), flatFromAttributes: stunFromAttributes, flatOther: stunFlat + equipmentStunFlat, increasedReducedPercent: round(stunPercent + equipmentStunPercent), moreLessMultiplier: round(stunMore), total: round(stunTotal) },
    ailmentThreshold: { baseFromLife: round(ailmentBase), additionalFromEnergyShield: round(additionalAilmentFromEnergyShield), additionalFromDefences: round(ailmentFromDefences), additionalFromEquipmentPositions: round(ailmentFromEquipmentPositions), flatFromAttributes: ailmentFromAttributes, flatOther: ailmentFlat + equipmentAilmentFlat, increasedReducedPercent: round(ailmentPercent + equipmentAilmentPercent), moreLessMultiplier: round(ailmentMore), total: round(ailmentTotal) },
    avoidance: { stunChance: stunImmune ? 100 : Math.min(100, Math.max(0, round(stunAvoidance))), elementalAilmentChance: Math.min(100, Math.max(0, round(elementalAilmentAvoidance))), stunImmune, stunImmunitySource: unconditionalStunImmune ? 'unconditional' : energyShieldStunImmune ? 'energy-shield-condition' : 'none' },
    sourceNodeIds: unique(base.sourceNodeIds), sourceTexts: unique(base.sourceTexts), blockedLines,
  }
}
