import type { EquipmentEntry, SkillGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import type { DamageComponent } from './types'

export type QuantitativeEffectSource = 'equipment' | 'passive' | 'ascendancy'
export interface QuantitativeDamageModifier {
  id: string
  source: QuantitativeEffectSource
  sourceId: string
  label: string
  percent: number
  appliesTo: string[]
}
export interface QuantitativeConversion {
  id: string
  source: QuantitativeEffectSource
  sourceId: string
  from: DamageComponent['type']
  to: DamageComponent['type']
  percent: number
}
export interface QuantitativeGainAsExtra {
  id: string
  source: QuantitativeEffectSource
  sourceId: string
  from: DamageComponent['type'] | 'all' | 'elemental'
  to: DamageComponent['type']
  percent: number
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

const damageTypes = ['physical', 'fire', 'cold', 'lightning', 'chaos'] as const
const conversionOrder = ['physical', 'lightning', 'cold', 'fire', 'chaos'] as const
const stripMarkup = (value: string) => value
  .replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1')
  .replace(/\[([A-Za-z][^\]]*)\]/g, '$1')
  .replace(/\s+/g, ' ')
  .trim()
const unique = <T>(values: T[]) => [...new Set(values)]
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

function passiveSummary(tree: RealPassiveTree | undefined, planning: RealPassivePlanningIntegrationResult | undefined, weaponSet: 'set-1' | 'set-2', skill: SkillGemDefinition | undefined): QuantitativeEffectSummary {
  const result: QuantitativeEffectSummary = { damageModifiers: [], speedModifiers: [], criticalChanceModifiers: [], criticalMultiplierModifiers: [], conversions: [], gainAsExtra: [], warnings: [] }
  if (!tree || !planning) return result
  const nodes = new Map(tree.nodes.map(node => [node.id, node]))
  const skillTags = new Set<string>([...(skill?.tags ?? []), ...(skill?.damageTypes ?? [])])
  for (const nodeId of allocatedNodeIds(planning, weaponSet)) {
    const node = nodes.get(nodeId)
    if (!node) continue
    const source: QuantitativeEffectSource = node.ascendancyId ? 'ascendancy' : 'passive'
    for (const sourceText of node.stats.map(value => value.sourceText).filter((value): value is string => Boolean(value))) {
      const text = stripMarkup(sourceText)
      const damage = text.match(/^(-?\d+(?:\.\d+)?)% increased (?:(Physical|Fire|Cold|Lightning|Chaos|Elemental|Attack|Spell|Projectile|Melee|Area) )?Damage$/i)
      if (damage) {
        const qualifier = damage[2]?.toLocaleLowerCase('en')
        const appliesTo =
          !qualifier ? [...damageTypes]
          : qualifier === 'elemental' ? ['fire', 'cold', 'lightning']
          : (damageTypes as readonly string[]).includes(qualifier) ? [qualifier]
          : skillTags.has(qualifier) ? [...damageTypes]
          : []
        if (appliesTo.length) result.damageModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: Number(damage[1]), appliesTo })
        continue
      }
      const speed = text.match(/^(-?\d+(?:\.\d+)?)% increased (Attack|Cast) Speed$/i)
      if (speed && skillTags.has(speed[2].toLocaleLowerCase('en') === 'attack' ? 'attack' : 'spell')) {
        result.speedModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: Number(speed[1]), appliesTo: [speed[2].toLocaleLowerCase('en')] })
        continue
      }
      const criticalChance = text.match(/^(-?\d+(?:\.\d+)?)% increased Critical Hit Chance$/i)
      if (criticalChance) result.criticalChanceModifiers.push({ id: `${source}:${nodeId}:${text}`, source, sourceId: nodeId, label: text, percent: Number(criticalChance[1]), appliesTo: ['critical'] })
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

export function collectQuantitativeEffects(input: { equipment: EquipmentEntry[]; skill?: SkillGemDefinition; passiveTree?: RealPassiveTree; realPassivePlanning?: RealPassivePlanningIntegrationResult; weaponSet: 'set-1' | 'set-2' }): QuantitativeEffectSummary {
  const equipment = equipmentSummary(input.equipment, input.skill)
  const passive = passiveSummary(input.passiveTree, input.realPassivePlanning, input.weaponSet, input.skill)
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
    return value.minimum || value.maximum ? [{ type, minimum: value.minimum, maximum: value.maximum }] : []
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
    return value.minimum || value.maximum ? [{ type, minimum: value.minimum, maximum: value.maximum }] : []
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
    const declaredTotal = applicable.reduce((sum, value) => sum + value.percent, 0)
    const scale = declaredTotal > 100 ? 100 / declaredTotal : 1
    const retainedFraction = Math.max(0, 1 - Math.min(100, declaredTotal) / 100)
    const current = slices.filter(slice => slice.type === from)
    for (const slice of current) {
      const originalMinimum = slice.minimum
      const originalMaximum = slice.maximum
      slice.minimum *= retainedFraction
      slice.maximum *= retainedFraction
      for (const conversion of applicable) {
        const fraction = conversion.percent * scale / 100
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
    const increase = modifiers.filter(effect => effect.appliesTo.some(value => applicableTypes.includes(value))).reduce((sum, effect) => sum + effect.percent, 0)
    const multiplier = 1 + increase / 100
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
    return value.minimum || value.maximum ? [{ type, minimum: value.minimum, maximum: value.maximum }] : []
  })
}
