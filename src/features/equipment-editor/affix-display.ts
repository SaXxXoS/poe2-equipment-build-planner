import type { TechnicalAffix } from '../../affixes/model'
import { classifyTechnicalAffix } from '../../affixes/analyzer-semantics'
import { germanAffixDisplay } from '../../localization/poe2-affixes-de'

const aliases: Record<string, string> = {
  life: 'Leben', mana: 'Mana', fire: 'Feuer', cold: 'Kälte', lightning: 'Blitz',
  chaos: 'Chaos', physical: 'Physisch', attack: 'Angriff', spell: 'Zauber',
  critical: 'Kritisch', defensive: 'Defensiv', speed: 'Geschwindigkeit',
}

const statSearchAliases: Array<[RegExp, string]> = [
  [/maximum_life|life_regeneration|life_recovery/, 'Leben'],
  [/maximum_mana|mana_regeneration|skill_cost/, 'Mana Ressource'],
  [/fire_damage|fire_damage_resistance/, 'Feuer'],
  [/cold_damage|cold_damage_resistance/, 'Kälte'],
  [/lightning_damage|lightning_damage_resistance/, 'Blitz'],
  [/chaos_damage|chaos_damage_resistance/, 'Chaos'],
  [/physical_damage/, 'Physisch'],
  [/accuracy_rating/, 'Genauigkeit Angriff'],
  [/energy_shield/, 'Energieschild'],
  [/evasion_rating/, 'Ausweichen'],
  [/damage_resistance|resist_all_elements/, 'Widerstand'],
]

export function cleanAffixText(value: string) {
  return value.replace(/\[([^|\]]+)\|([^\]]+)\]/g, (_match, left: string, right: string) => right || left)
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\|+/g, ' ').replace(/\s+/g, ' ').trim()
}

export function affixDisplayName(affix: TechnicalAffix) {
  const german = germanAffixDisplay(affix.affixId)
  return german?.text || cleanAffixText(affix.technicalText || affix.technicalName || 'Nicht auflösbares Affix')
}

export function affixGroupName(affix: TechnicalAffix) {
  const tag = classifyTechnicalAffix(affix).tags.find(value => aliases[value])
  return tag ? aliases[tag] : 'Weitere Affixe'
}

export function affixSearchText(affix: TechnicalAffix) {
  const tags = classifyTechnicalAffix(affix).tags
  const statIds = affix.statLines.map(line => line.statId).join(' ')
  const statAliases = statSearchAliases.filter(([pattern]) => pattern.test(statIds)).map(([, label]) => label)
  return `${affixDisplayName(affix)} ${affix.technicalName} ${statIds} ${statAliases.join(' ')} ${tags.map(value => aliases[value] ?? value).join(' ')}`.toLocaleLowerCase('de')
}
