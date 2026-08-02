import type { EquipmentEntry, SkillGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { classifyPassiveText, derivePassiveTargetNodeType } from '../passive-targeting/classifier'
import { structurePassiveStatEffect } from '../passive-targeting/effect-model'
import type { DamageComponent } from './types'
import { resolveCharacterAttributes, type CharacterAttributeValues } from '../character-attributes/model'

export type QuantitativeEffectSource = 'equipment' | 'passive' | 'ascendancy'
export interface QuantitativeDamageModifier {
  id: string
  source: QuantitativeEffectSource | 'support'
  sourceId: string
  label: string
  percent: number
  appliesTo: string[]
  kind?: 'increased' | 'more'
}
export interface QuantitativeConversion {
  id: string
  source: QuantitativeEffectSource | 'skill'
  sourceId: string
  from: DamageComponent['type']
  to: DamageComponent['type']
  percent: number
}
export interface QuantitativeGainAsExtra {
  id: string
  source: QuantitativeEffectSource | 'skill'
  sourceId: string
  from: DamageComponent['type'] | 'all' | 'elemental'
  to: DamageComponent['type']
  percent: number
}
export interface RageScaledDamageModifier {
  id: string
  source: 'passive' | 'ascendancy'
  sourceId: string
  label: string
  kind: 'increased' | 'more'
  percent: number
  appliesTo: string[]
  rageDivisor: number
  effectiveRageEffect: number
}
export interface QuantitativeEffectSummary {
  damageModifiers: QuantitativeDamageModifier[]
  speedModifiers: QuantitativeDamageModifier[]
  criticalChanceModifiers: QuantitativeDamageModifier[]
  criticalMultiplierModifiers: QuantitativeDamageModifier[]
  conversions: QuantitativeConversion[]
  gainAsExtra: QuantitativeGainAsExtra[]
  warnings: string[]
}

/** Applies PoE's additive increased/reduced group before separate more/less multipliers. */
export function quantitativePercentMultiplier(
  modifiers: readonly QuantitativeDamageModifier[],
): number {
  const increasedReduced = modifiers
    .filter(effect => (effect.kind ?? 'increased') === 'increased')
    .reduce((sum, effect) => sum + effect.percent, 0)
  const moreLess = modifiers
    .filter(effect => effect.kind === 'more')
    .reduce((product, effect) => product * (1 + effect.percent / 100), 1)
  return Math.max(0, 1 + increasedReduced / 100) * Math.max(0, moreLess)
}

export function collectSkillConversions(
  skillId: string,
  numericStats: Record<string, number>,
): QuantitativeConversion[] {
  const result: QuantitativeConversion[] = []
  for (const [statId, percent] of Object.entries(numericStats)) {
    const match = statId.match(/^active_skill_base_(physical|fire|cold|lightning|chaos)_damage_%_to_convert_to_(physical|fire|cold|lightning|chaos)$/)
    if (!match || !Number.isFinite(percent) || percent <= 0) continue
    result.push({
      id: `skill:${skillId}:${statId}`,
      source: 'skill',
      sourceId: skillId,
      from: match[1] as DamageComponent['type'],
      to: match[2] as DamageComponent['type'],
      percent,
    })
  }
  return result.sort((a, b) => a.id.localeCompare(b.id, 'en'))
}

const damageTypes = ['physical', 'fire', 'cold', 'lightning', 'chaos'] as const
const conversionOrder = ['physical', 'lightning', 'cold', 'fire', 'chaos'] as const
const stripMarkup = (value: string) => value
  .replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1')
  .replace(/\[([A-Za-z][^\]]*)\]/g, '$1')
  .replace(/\s+/g, ' ')
  .trim()
const unique = <T>(values: T[]) => [...new Set(values)]
const stableNumber = (value: number) => Math.abs(value) < 1e-12 ? 0 : Number(value.toFixed(12))
const statTotal = (entry: EquipmentEntry, statId: string) =>
  entry.modifierValues.filter(value => value.isLocal !== true).flatMap(value => value.statValues ?? []).filter(value => value.statId === statId).reduce((sum, value) => sum + value.value, 0)

function equipmentSummary(equipment: EquipmentEntry[], skill: SkillGemDefinition | undefined): QuantitativeEffectSummary {
  const result: QuantitativeEffectSummary = { damageModifiers: [], speedModifiers: [], criticalChanceModifiers: [], criticalMultiplierModifiers: [], conversions: [], gainAsExtra: [], warnings: [] }
  const skillTags = new Set<string>([...(skill?.tags ?? []), ...(skill?.damageTypes ?? [])])
  for (const entry of equipment) {
    const addDamage = (statId: string, appliesTo: string[]) => {
      const percent = statTotal(entry, statId)
      if (percent) result.damageModifiers.push({ id: `equipment:${entry.id}:${statId}`, source: 'equipment', sourceId: entry.id, label: statId, percent, appliesTo })
    }
    for (const type of damageTypes) {
      addDamage(`${type}_damage_+%`, [type])
      addDamage(`global_${type}_damage_+%`, [type])
    }
    addDamage('elemental_damage_+%', ['fire', 'cold', 'lightning'])
    addDamage('global_elemental_damage_+%', ['fire', 'cold', 'lightning'])
    addDamage('damage_+%', [...damageTypes])
    addDamage('global_damage_+%', [...damageTypes])
    if (skillTags.has('attack')) addDamage('attack_damage_+%', [...damageTypes])
    if (skillTags.has('spell')) addDamage('spell_damage_+%', [...damageTypes])
    for (const mechanic of ['projectile', 'melee', 'area'] as const) if (skillTags.has(mechanic)) addDamage(`${mechanic}_damage_+%`, [...damageTypes])

    const speedIds = skillTags.has('attack') ? ['attack_speed_+%'] : ['cast_speed_+%', 'base_cast_speed_+%']
    const speed = speedIds.reduce((sum, id) => sum + statTotal(entry, id), 0)
    if (speed) result.speedModifiers.push({ id: `equipment:${entry.id}:speed`, source: 'equipment', sourceId: entry.id, label: skillTags.has('attack') ? 'Angriffsgeschwindigkeit' : 'Zaubergeschwindigkeit', percent: speed, appliesTo: [skillTags.has('attack') ? 'attack' : 'spell'] })

    const criticalChance = statTotal(entry, 'critical_strike_chance_+%') + statTotal(entry, 'spell_critical_strike_chance_+%')
    if (criticalChance) result.criticalChanceModifiers.push({ id: `equipment:${entry.id}:critical-chance`, source: 'equipment', sourceId: entry.id, label: 'Kritische Trefferchance', percent: criticalChance, appliesTo: ['critical'] })
    const criticalMultiplier = statTotal(entry, skillTags.has('attack') ? 'attack_critical_strike_multiplier_+' : 'base_spell_critical_strike_multiplier_+')
    if (criticalMultiplier) result.criticalMultiplierModifiers.push({ id: `equipment:${entry.id}:critical-multiplier`, source: 'equipment', sourceId: entry.id, label: 'Kritischer Schadensbonus', percent: criticalMultiplier, appliesTo: ['critical'] })

    for (const stat of entry.modifierValues.flatMap(value => value.statValues ?? [])) {
      const match = stat.statId.match(/^(physical|fire|cold|lightning|chaos)_damage_%_to_convert_to_(physical|fire|cold|lightning|chaos)$/)
      if (match && stat.value) result.conversions.push({ id: `equipment:${entry.id}:${stat.statId}`, source: 'equipment', sourceId: entry.id, from: match[1] as DamageComponent['type'], to: match[2] as DamageComponent['type'], percent: stat.value })
      const gain = stat.statId.match(/^(physical|fire|cold|lightning|chaos|elemental|all)_damage_%_(?:to_)?gain_as_(?:extra_)?(physical|fire|cold|lightning|chaos)_damage$/)
      if (gain && stat.value) result.gainAsExtra.push({ id: `equipment:${entry.id}:${stat.statId}`, source: 'equipment', sourceId: entry.id, from: gain[1] as QuantitativeGainAsExtra['from'], to: gain[2] as DamageComponent['type'], percent: stat.value })
    }
  }
  return result
}

function allocatedNodeIds(planning: RealPassivePlanningIntegrationResult | undefined, weaponSet: 'set-1' | 'set-2') {
  const result = planning?.weaponSetPlanning?.[weaponSet] ?? planning?.pipelineResult
  return unique([...(result?.allocatedNodeIds ?? []), ...(planning?.ascendancyPlanning?.allocatedNodeIds ?? [])])
}

function passiveSummary(tree: RealPassiveTree | undefined, planning: RealPassivePlanningIntegrationResult | undefined, weaponSet: 'set-1' | 'set-2', skill: SkillGemDefinition | undefined, attributes?: CharacterAttributeValues): QuantitativeEffectSummary {
  const result: QuantitativeEffectSummary = { damageModifiers: [], speedModifiers: [], criticalChanceModifiers: [], criticalMultiplierModifiers: [], conversions: [], gainAsExtra: [], warnings: [] }
  if (!tree || !planning) return result
  const nodes = new Map(tree.nodes.map(node => [node.id, node]))
  const skillTags = new Set<string>([...(skill?.tags ?? []), ...(skill?.damageTypes ?? [])])
  for (const nodeId of allocatedNodeIds(planning, weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    const source: QuantitativeEffectSource = node.ascendancyId ? 'ascendancy' : 'passive'
    const nodeType = derivePassiveTargetNodeType(node)
    for (const sourceText of node.stats.map(value => value.sourceText).filter((value): value is string => Boolean(value))) {
      const stat = classifyPassiveText(sourceText, nodeType)
      const text = stripMarkup(sourceText)
      const attributeScaled = attributes ? [
        { match: text.match(/^(\d+(?:\.\d+)?)% increased Damage per (\d+) Strength$/i), attribute: attributes.strength, applies: [...damageTypes], speed: false },
        { match: text.match(/^(\d+(?:\.\d+)?)% increased Spell Damage per (\d+) Strength$/i), attribute: attributes.strength, applies: skillTags.has('spell') ? [...damageTypes] : [], speed: false },
        { match: text.match(/^(\d+(?:\.\d+)?)% increased Attack Speed per (\d+) Dexterity$/i), attribute: attributes.dexterity, applies: skillTags.has('attack') ? ['attack'] : [], speed: true },
        { match: text.match(/^(\d+(?:\.\d+)?)% increased Damage per (\d+) of your lowest Attribute$/i), attribute: Math.min(attributes.strength, attributes.dexterity, attributes.intelligence), applies: [...damageTypes], speed: false },
      ].find(value => value.match) : undefined
      if (attributeScaled?.match && attributeScaled.applies.length) {
        const percent = Number(attributeScaled.match[1]) * Math.floor(attributeScaled.attribute / Number(attributeScaled.match[2]))
        if (percent > 0) {
          const modifier = { id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: `${text} (${percent}%)`, percent, appliesTo: attributeScaled.applies }
          if (attributeScaled.speed) result.speedModifiers.push(modifier)
          else result.damageModifiers.push(modifier)
        }
      }
      const effect = structurePassiveStatEffect(stat)
      if (effect?.aggregationStatus === 'ready' && effect.unit === 'percent') {
        const tagSet = new Set<string>(effect.tags)
        const mechanicTags = ['attack', 'spell', 'projectile', 'melee', 'area']
        const requiredMechanics = mechanicTags.filter(tag => tagSet.has(tag))
        const mechanicCompatible = requiredMechanics.every(tag => skillTags.has(tag))
        const hasDamageTarget = effect.targetProfileFields.some(field => field.startsWith('damageTypes.') || field.startsWith('mechanics.'))
          && (tagSet.has('generic-damage') || tagSet.has('elemental') || damageTypes.some(type => tagSet.has(type)) || requiredMechanics.length > 0)
        if (hasDamageTarget && mechanicCompatible && ['increased', 'reduced', 'more', 'less'].includes(effect.operator)) {
          const qualifier = tagSet.has('elemental') ? 'elemental' : damageTypes.find(type => tagSet.has(type))
        const appliesTo =
          !qualifier ? [...damageTypes]
          : qualifier === 'elemental' ? ['fire', 'cold', 'lightning']
          : (damageTypes as readonly string[]).includes(qualifier) ? [qualifier]
          : []
          const signed = effect.operator === 'reduced' || effect.operator === 'less' ? -effect.value : effect.value
          if (appliesTo.length) result.damageModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: signed, appliesTo, kind: effect.operator === 'more' || effect.operator === 'less' ? 'more' : 'increased' })
        }
        const signed = effect.operator === 'reduced' || effect.operator === 'less' ? -effect.value : effect.value
        const kind = effect.operator === 'more' || effect.operator === 'less' ? 'more' as const : 'increased' as const
        if (tagSet.has('attack-speed') && skillTags.has('attack')) result.speedModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: signed, appliesTo: ['attack'], kind })
        if (tagSet.has('cast-speed') && skillTags.has('spell')) result.speedModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: signed, appliesTo: ['cast'], kind })
        if (tagSet.has('critical') && /critical hit chance/i.test(text)) result.criticalChanceModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: signed, appliesTo: ['critical'], kind })
      }
      const criticalMultiplier = text.match(/^\+?(-?\d+(?:\.\d+)?)% to Critical Damage Bonus$/i)
      if (criticalMultiplier) result.criticalMultiplierModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: Number(criticalMultiplier[1]), appliesTo: ['critical'] })
      const conversion = text.match(/^(\d+(?:\.\d+)?)% of (Physical|Fire|Cold|Lightning|Chaos) Damage (?:is )?Converted to (Physical|Fire|Cold|Lightning|Chaos) Damage$/i)
      if (conversion) result.conversions.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, from: conversion[2].toLocaleLowerCase('en') as DamageComponent['type'], to: conversion[3].toLocaleLowerCase('en') as DamageComponent['type'], percent: Number(conversion[1]) })
      const gainAsExtra = text.match(/^Gain (\d+(?:\.\d+)?)% of (?:(Physical|Fire|Cold|Lightning|Chaos|Elemental) )?Damage as Extra (Physical|Fire|Cold|Lightning|Chaos) Damage$/i)
      if (gainAsExtra) {
        result.gainAsExtra.push({
          id: `${source}:${nodeId}:${text}`,
          source,
          sourceId: nodeId,
          from: (gainAsExtra[2]?.toLocaleLowerCase('en') ?? 'all') as QuantitativeGainAsExtra['from'],
          to: gainAsExtra[3].toLocaleLowerCase('en') as DamageComponent['type'],
          percent: Number(gainAsExtra[1]),
        })
      }
    }
  }
  return result
}

export function collectRageScaledDamageModifiers(input: {
  passiveTree?: RealPassiveTree
  realPassivePlanning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
  skill?: SkillGemDefinition
  effectiveRageEffect: number
}): RageScaledDamageModifier[] {
  if (!input.passiveTree || !input.realPassivePlanning || input.effectiveRageEffect <= 0) return []
  const nodes = new Map(input.passiveTree.nodes.map(node => [node.id, node]))
  const skillTags = new Set<string>([...(input.skill?.tags ?? []), ...(input.skill?.damageTypes ?? [])])
  const result: RageScaledDamageModifier[] = []
  for (const nodeId of allocatedNodeIds(input.realPassivePlanning, input.weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    const source = node.ascendancyId ? 'ascendancy' as const : 'passive' as const
    for (const sourceText of node.stats.map(value => value.sourceText).filter((value): value is string => Boolean(value))) {
      const text = stripMarkup(sourceText)
      const match = text.match(/^Every(?: (\d+))? Rage also grants (\d+(?:\.\d+)?)% (increased|more) (?:(Physical|Fire|Cold|Lightning|Chaos|Elemental|Attack|Spell|Projectile|Melee|Area) )?Damage$/i)
      if (!match) continue
      const divisor = Number(match[1] ?? 1)
      if (!Number.isFinite(divisor) || divisor <= 0) continue
      const stacks = Math.floor(input.effectiveRageEffect / divisor)
      if (stacks <= 0) continue
      const qualifier = match[4]?.toLocaleLowerCase('en')
      const appliesTo =
        !qualifier ? [...damageTypes]
        : qualifier === 'elemental' ? ['fire', 'cold', 'lightning']
        : (damageTypes as readonly string[]).includes(qualifier) ? [qualifier]
        : skillTags.has(qualifier) ? [...damageTypes]
        : []
      if (!appliesTo.length) continue
      result.push({
        id: `${source}:${nodeId}:rage:${text}`,
        source,
        sourceId: nodeId,
        label: text,
        kind: match[3].toLocaleLowerCase('en') as 'increased' | 'more',
        percent: Number(match[2]) * stacks,
        appliesTo,
        rageDivisor: divisor,
        effectiveRageEffect: input.effectiveRageEffect,
      })
    }
  }
  return result.sort((a, b) => a.id.localeCompare(b.id, 'en'))
}

export function applyRageMoreDamageModifiers(
  components: DamageComponent[],
  effects: RageScaledDamageModifier[],
): DamageComponent[] {
  return components.map(value => {
    const multiplier = effects
      .filter(effect => effect.kind === 'more' && effect.appliesTo.includes(value.type))
      .reduce((product, effect) => product * (1 + effect.percent / 100), 1)
    return {
      ...value,
      minimum: stableNumber(value.minimum * multiplier),
      maximum: stableNumber(value.maximum * multiplier),
    }
  })
}

export function collectQuantitativeEffects(input: { equipment: EquipmentEntry[]; skill?: SkillGemDefinition; passiveTree?: RealPassiveTree; realPassivePlanning?: RealPassivePlanningIntegrationResult; weaponSet: 'set-1' | 'set-2'; characterClassId?: string }): QuantitativeEffectSummary {
  const equipment = equipmentSummary(input.equipment, input.skill)
  const attributes = input.characterClassId ? resolveCharacterAttributes({ classId: input.characterClassId, equipment: input.equipment, activeSet: input.weaponSet, passiveTree: input.passiveTree, realPassivePlanning: input.realPassivePlanning }) : undefined
  const passive = passiveSummary(input.passiveTree, input.realPassivePlanning, input.weaponSet, input.skill, attributes?.status === 'exact-confirmed-sources' ? attributes.total : undefined)
  const result: QuantitativeEffectSummary = {
    damageModifiers: [...equipment.damageModifiers, ...passive.damageModifiers],
    speedModifiers: [...equipment.speedModifiers, ...passive.speedModifiers],
    criticalChanceModifiers: [...equipment.criticalChanceModifiers, ...passive.criticalChanceModifiers],
    criticalMultiplierModifiers: [...equipment.criticalMultiplierModifiers, ...passive.criticalMultiplierModifiers],
    conversions: [...equipment.conversions, ...passive.conversions],
    gainAsExtra: [...equipment.gainAsExtra, ...passive.gainAsExtra],
    warnings: [],
  }
  for (const from of damageTypes) if (result.conversions.filter(value => value.from === from).reduce((sum, value) => sum + value.percent, 0) > 100) result.warnings.push(`Bestätigte Umwandlungen von ${from} überschreiten zusammen 100 % und werden auf 100 % begrenzt.`)
  return result
}

export function applyGainAsExtra(
  components: DamageComponent[],
  effects: QuantitativeGainAsExtra[],
  gainBasis: DamageComponent[] = components,
): DamageComponent[] {
  const result = new Map<DamageComponent['type'], { minimum: number; maximum: number }>(
    damageTypes.map(type => [type, { minimum: 0, maximum: 0 }]),
  )
  for (const component of components) {
    const retained = result.get(component.type)!
    retained.minimum += component.minimum
    retained.maximum += component.maximum
  }
  for (const component of gainBasis) {
    for (const effect of effects) {
      const applies =
        effect.from === 'all'
        || effect.from === component.type
        || (effect.from === 'elemental' && ['fire', 'cold', 'lightning'].includes(component.type))
      if (!applies) continue
      const target = result.get(effect.to)!
      target.minimum += component.minimum * effect.percent / 100
      target.maximum += component.maximum * effect.percent / 100
    }
  }
  return damageTypes.flatMap(type => {
    const value = result.get(type)!
    return value.minimum || value.maximum ? [{ type, minimum: stableNumber(value.minimum), maximum: stableNumber(value.maximum) }] : []
  })
}

export function applyConversions(components: DamageComponent[], conversions: QuantitativeConversion[]): DamageComponent[] {
  const result = new Map<DamageComponent['type'], { minimum: number; maximum: number }>(damageTypes.map(type => [type, { minimum: 0, maximum: 0 }]))
  for (const slice of conversionSlices(components, conversions)) {
    const target = result.get(slice.type)!
    target.minimum += slice.minimum
    target.maximum += slice.maximum
  }
  return damageTypes.flatMap(type => {
    const value = result.get(type)!
    return value.minimum || value.maximum ? [{ type, minimum: stableNumber(value.minimum), maximum: stableNumber(value.maximum) }] : []
  })
}

interface ConversionSlice extends DamageComponent {
  lineage: DamageComponent['type'][]
}

function conversionSlices(components: DamageComponent[], conversions: QuantitativeConversion[]): ConversionSlice[] {
  const slices: ConversionSlice[] = components.map(component => ({ ...component, lineage: [component.type] }))
  for (const from of conversionOrder) {
    const fromIndex = conversionOrder.indexOf(from)
    const applicable = conversions.filter(value =>
      value.from === from
      && conversionOrder.indexOf(value.to) > fromIndex
      && value.percent > 0,
    )
    if (!applicable.length) continue
    const skillConversions = applicable.filter(value => value.source === 'skill')
    const globalConversions = applicable.filter(value => value.source !== 'skill')
    const skillTotal = skillConversions.reduce((sum, value) => sum + value.percent, 0)
    const skillScale = skillTotal > 100 ? 100 / skillTotal : 1
    const skillFraction = Math.min(100, skillTotal) / 100
    const remainingAfterSkill = 1 - skillFraction
    const globalTotal = globalConversions.reduce((sum, value) => sum + value.percent, 0)
    const globalScale = globalTotal > 100 ? 100 / globalTotal : 1
    const globalFraction = Math.min(100, globalTotal) / 100
    const retainedFraction = remainingAfterSkill * (1 - globalFraction)
    const current = slices.filter(slice => slice.type === from)
    for (const slice of current) {
      const originalMinimum = slice.minimum
      const originalMaximum = slice.maximum
      slice.minimum *= retainedFraction
      slice.maximum *= retainedFraction
      for (const conversion of skillConversions) {
        const fraction = conversion.percent * skillScale / 100
        slices.push({
          type: conversion.to,
          minimum: originalMinimum * fraction,
          maximum: originalMaximum * fraction,
          lineage: unique([...slice.lineage, conversion.to]),
        })
      }
      for (const conversion of globalConversions) {
        const fraction = remainingAfterSkill * conversion.percent * globalScale / 100
        slices.push({
          type: conversion.to,
          minimum: originalMinimum * fraction,
          maximum: originalMaximum * fraction,
          lineage: unique([...slice.lineage, conversion.to]),
        })
      }
    }
  }
  return slices.filter(slice => slice.minimum || slice.maximum)
}

export function applyDamageModifiers(
  components: DamageComponent[],
  conversions: QuantitativeConversion[],
  modifiers: QuantitativeDamageModifier[],
  gainAsExtra: QuantitativeGainAsExtra[] = [],
): DamageComponent[] {
  const result = new Map<DamageComponent['type'], { minimum: number; maximum: number }>(damageTypes.map(type => [type, { minimum: 0, maximum: 0 }]))
  const add = (type: DamageComponent['type'], minimum: number, maximum: number, applicableTypes: string[]) => {
    const applicable = modifiers.filter(effect => effect.appliesTo.some(value => applicableTypes.includes(value)))
    const multiplier = quantitativePercentMultiplier(applicable)
    const target = result.get(type)!
    target.minimum += minimum * multiplier
    target.maximum += maximum * multiplier
  }
  for (const slice of conversionSlices(components, conversions)) {
    add(slice.type, slice.minimum, slice.maximum, slice.lineage)
  }
  for (const component of components) {
    for (const gain of gainAsExtra) {
      const applies =
        gain.from === 'all'
        || gain.from === component.type
        || (gain.from === 'elemental' && ['fire', 'cold', 'lightning'].includes(component.type))
      if (!applies) continue
      add(gain.to, component.minimum * gain.percent / 100, component.maximum * gain.percent / 100, [component.type, gain.to])
    }
  }
  return damageTypes.flatMap(type => {
    const value = result.get(type)!
    return value.minimum || value.maximum ? [{ type, minimum: stableNumber(value.minimum), maximum: stableNumber(value.maximum) }] : []
  })
}
