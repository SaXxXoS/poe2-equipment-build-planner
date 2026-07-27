import type { BuildInput, MechanicTag, ModifierDefinition, SkillGemDefinition, SupportGemDefinition } from '../../domain'
import { supportFamilyKey, supportsDisplayedDefences } from '../../domain'
import type { BuildProfile } from '../common/types'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'

export const BUILD_EFFECT_MODEL_VERSION = '1.0.0'
export type BuildEffectDomain = 'offence' | 'defence' | 'resource' | 'utility'
export type BuildEffectSource = 'equipment' | 'skill' | 'support' | 'passive' | 'ascendancy'
export type BuildEffectEvidence = 'structured-exact' | 'structured-derived' | 'unresolved'
export type BuildEffectWeaponSet = 'set-1' | 'set-2' | 'both' | 'not-applicable'
export type BuildEffectKind = 'base-damage' | 'damage-scaling' | 'mechanic' | 'speed' | 'critical' | 'defence' | 'resource' | 'conversion' | 'compatibility' | 'restriction'

export interface BuildEffect {
  id: string
  source: BuildEffectSource
  sourceId: string
  weaponSet: BuildEffectWeaponSet
  domain: BuildEffectDomain
  kind: BuildEffectKind
  tags: MechanicTag[]
  profileField?: string
  value?: number
  range?: { minimum: number; maximum: number }
  conversion?: { from: MechanicTag; to: MechanicTag; percent: number }
  evidence: BuildEffectEvidence
  productive: boolean
  explanation: string
}
export interface BuildEffectModel {
  version: typeof BUILD_EFFECT_MODEL_VERSION
  effects: BuildEffect[]
  offenceEffects: BuildEffect[]
  defenceEffects: BuildEffect[]
  resourceEffects: BuildEffect[]
  unresolvedEffects: BuildEffect[]
  activeDamageTypes: MechanicTag[]
  activeMechanics: MechanicTag[]
  scalingAdvice: string[]
  warnings: string[]
}
export interface BuildEffectModelInput {
  input: BuildInput
  skills: SkillGemDefinition[]
  supports: SupportGemDefinition[]
  modifiers: ModifierDefinition[]
  buildProfile: BuildProfile
  realPassivePlanning?: RealPassivePlanningIntegrationResult
}

const damageTags = ['physical', 'fire', 'cold', 'lightning', 'chaos'] as const
const mechanicTags = ['attack', 'spell', 'projectile', 'melee', 'area', 'critical', 'damage-over-time', 'minion'] as const
const damageNames: Record<string, string> = { physical: 'Physischer Schaden', fire: 'Feuerschaden', cold: 'Kälteschaden', lightning: 'Blitzschaden', chaos: 'Chaosschaden' }
const mechanicNames: Record<string, string> = { attack: 'Angriffsschaden und Angriffsgeschwindigkeit', spell: 'Zauberschaden und Zaubergeschwindigkeit', projectile: 'Projektilschaden', melee: 'Nahkampfschaden', area: 'Flächenschaden', critical: 'kritische Trefferchance und kritischer Multiplikator', 'damage-over-time': 'Schaden über Zeit', minion: 'Begleiterschaden' }
const sourceNames: Record<BuildEffectSource, string> = { equipment: 'Ausrüstung', skill: 'Fertigkeit', support: 'Unterstützung', passive: 'Passivbaum', ascendancy: 'Aszendenz' }
const compare = (a: BuildEffect, b: BuildEffect) => a.id.localeCompare(b.id, 'en', { numeric: true })
const uniqueSorted = <T extends string>(values: T[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'en'))
const slotWeaponSet = (slotId: string): BuildEffectWeaponSet => /set[- ]?2/i.test(slotId) ? 'set-2' : /set[- ]?1/i.test(slotId) ? 'set-1' : 'not-applicable'

function equipmentEffects(input: BuildEffectModelInput): BuildEffect[] {
  const definitions = new Map(input.modifiers.map(value => [value.id, value]))
  const result: BuildEffect[] = []
  for (const entry of input.input.equipment) {
    const weaponSet = slotWeaponSet(entry.slotId)
    for (const damageType of damageTags) {
      const range = entry.weaponStats?.[`${damageType}Damage` as keyof NonNullable<typeof entry.weaponStats>]
      if (!range || typeof range !== 'object' || !('minimum' in range)) continue
      result.push({ id: `equipment:${entry.id}:weapon:${damageType}`, source: 'equipment', sourceId: entry.id, weaponSet, domain: 'offence', kind: 'base-damage', tags: ['attack', damageType], range, evidence: 'structured-exact', productive: true, explanation: `${damageNames[damageType]} ist als tatsächlicher Waffen-Grundschaden erfasst.` })
    }
    if (entry.weaponStats?.attacksPerSecond != null) result.push({ id: `equipment:${entry.id}:weapon:attack-speed`, source: 'equipment', sourceId: entry.id, weaponSet, domain: 'offence', kind: 'speed', tags: ['attack'], value: entry.weaponStats.attacksPerSecond, evidence: 'structured-exact', productive: true, explanation: 'Die tatsächlichen Angriffe pro Sekunde der Waffe sind erfasst.' })
    if (entry.weaponStats?.criticalHitChance != null) result.push({ id: `equipment:${entry.id}:weapon:critical`, source: 'equipment', sourceId: entry.id, weaponSet, domain: 'offence', kind: 'critical', tags: ['attack', 'critical'], value: entry.weaponStats.criticalHitChance, evidence: 'structured-exact', productive: true, explanation: 'Die tatsächliche kritische Trefferchance der Waffe ist erfasst.' })
    for (const [key, value] of Object.entries(supportsDisplayedDefences(entry.itemClassId) ? entry.defences ?? {} : {})) {
      if (value == null) continue
      const label = key === 'armour' ? 'Rüstung' : key === 'evasion' ? 'Ausweichwert' : 'Energieschild'
      result.push({ id: `equipment:${entry.id}:defence:${key}`, source: 'equipment', sourceId: entry.id, weaponSet: 'not-applicable', domain: 'defence', kind: 'defence', tags: ['defensive'], value, evidence: 'structured-exact', productive: true, explanation: `${label} ist ein defensiver Endwert und erzeugt keinen Waffenschaden.` })
    }
    for (const applied of entry.modifierValues) {
      const definition = definitions.get(applied.modifierId)
      if (!definition) {
        result.push({ id: `equipment:${entry.id}:modifier:${applied.id}`, source: 'equipment', sourceId: applied.modifierId, weaponSet, domain: 'utility', kind: 'restriction', tags: [], evidence: 'unresolved', productive: false, explanation: 'Für dieses Affix fehlt eine bestätigte technische Wirkung.' })
        continue
      }
      const tags = uniqueSorted(definition.relevantTags)
      const domain: BuildEffectDomain = definition.category === 'defence' || definition.category === 'resistance' || tags.includes('defensive') || tags.includes('resistance') ? 'defence' : definition.category === 'resource' ? 'resource' : definition.category === 'damage' || definition.category === 'speed' || definition.category === 'critical' || tags.some(tag => [...damageTags, ...mechanicTags].includes(tag as never)) ? 'offence' : 'utility'
      const kind: BuildEffectKind = domain === 'defence' ? 'defence' : domain === 'resource' ? 'resource' : definition.category === 'speed' ? 'speed' : definition.category === 'critical' ? 'critical' : 'damage-scaling'
      result.push({ id: `equipment:${entry.id}:modifier:${applied.id}`, source: 'equipment', sourceId: applied.modifierId, weaponSet, domain, kind, tags, evidence: 'structured-exact', productive: tags.length > 0, explanation: `${definition.displayNameDe} wirkt ausschließlich im Bereich ${domain === 'offence' ? 'Offensive' : domain === 'defence' ? 'Defensive' : domain === 'resource' ? 'Ressourcen' : 'Nützlichkeit'}.` })
    }
  }
  return result
}

function skillAndSupportEffects(input: BuildEffectModelInput): BuildEffect[] {
  const skills = new Map(input.skills.map(value => [value.id, value]))
  const supports = new Map(input.supports.map(value => [value.id, value]))
  const result: BuildEffect[] = []
  for (const setup of input.input.skillSetups) {
    const skill = skills.get(setup.skillId)
    if (!skill) continue
    const tags = uniqueSorted([...(skill.tags ?? []), ...(skill.damageTypes ?? [])])
    result.push({ id: `skill:${setup.id}:${skill.id}`, source: 'skill', sourceId: skill.id, weaponSet: setup.weaponSet, domain: 'offence', kind: 'mechanic', tags, evidence: 'structured-exact', productive: true, explanation: `${skill.displayNameDe} legt die zulässigen Schadensarten und Mechaniken dieses Setups fest.` })
    const usedFamilies = new Set<string>()
    for (const supportId of setup.supportGemIds) {
      const support = supports.get(supportId)
      if (!support) continue
      const family = supportFamilyKey(support)
      const duplicate = usedFamilies.has(family)
      usedFamilies.add(family)
      const productive = !duplicate && support.requiredTags.every(tag => tags.includes(tag)) && !support.excludedTags.some(tag => tags.includes(tag)) && !(support.excludedDamageTypes ?? []).some(tag => tags.includes(tag)) && (!(support.supportedDamageTypes?.length) || support.supportedDamageTypes.some(tag => tags.includes(tag)))
      result.push({ id: `support:${setup.id}:${support.id}`, source: 'support', sourceId: support.id, weaponSet: setup.weaponSet, domain: 'offence', kind: productive ? 'compatibility' : 'restriction', tags: uniqueSorted([...(support.ownTags ?? []), ...(support.supportedDamageTypes ?? []), ...(support.supportedMechanics ?? [])]), evidence: productive ? 'structured-derived' : 'structured-exact', productive, explanation: duplicate ? `${support.displayNameDe} ist in derselben Support-Familie bereits belegt.` : productive ? `${support.displayNameDe} erfüllt die strukturierten Voraussetzungen von ${skill.displayNameDe}.` : `${support.displayNameDe} besitzt keine belegte kompatible Wirkung auf ${skill.displayNameDe}.` })
    }
  }
  return result
}

function feedbackEffects(realPassivePlanning: RealPassivePlanningIntegrationResult | undefined): BuildEffect[] {
  const feedback = realPassivePlanning?.profileFeedback
  if (!feedback) return []
  const result: BuildEffect[] = []
  const append = (source: BuildEffectSource, weaponSet: BuildEffectWeaponSet, values: typeof feedback.shared) => {
    for (const delta of values?.fieldDeltas ?? []) {
      const [section, key] = delta.field.split('.')
      const tag = [...damageTags, ...mechanicTags].includes(key as never) ? key as MechanicTag : section === 'defence' ? 'defensive' as MechanicTag : section === 'requirements' ? 'resource' as MechanicTag : undefined
      const domain: BuildEffectDomain = section === 'defence' ? 'defence' : section === 'requirements' ? 'resource' : 'offence'
      result.push({ id: `${source}:${weaponSet}:${delta.field}:${delta.sourceNodeIds.join('+')}`, source, sourceId: delta.sourceNodeIds.join(','), weaponSet, domain, kind: domain === 'defence' ? 'defence' : domain === 'resource' ? 'resource' : section === 'speed' ? 'speed' : 'damage-scaling', tags: tag ? [tag] : [], profileField: delta.field, value: delta.delta, evidence: 'structured-derived', productive: delta.delta !== 0, explanation: `${source === 'ascendancy' ? 'Aszendenz' : weaponSet === 'both' ? 'Gemeinsamer Passivbaum' : weaponSet === 'set-1' ? 'Waffenset 1' : 'Waffenset 2'} verändert ${delta.field} nachweisbar um ${delta.delta}.` })
    }
  }
  append('ascendancy', 'not-applicable', feedback.ascendancy)
  append('passive', 'both', feedback.shared)
  append('passive', 'set-1', feedback.set1)
  append('passive', 'set-2', feedback.set2)
  return result
}

function scalingAdvice(effects: BuildEffect[], tags: Set<string>): string[] {
  const productive = effects.filter(effect => effect.productive && effect.domain === 'offence')
  const result: string[] = []
  for (const tag of damageTags) if (tags.has(tag)) {
    const sources = uniqueSorted(productive.filter(effect => effect.tags.includes(tag)).map(effect => sourceNames[effect.source]))
    result.push(`${damageNames[tag]} skaliert die Hauptfertigkeit. Belegte Quellen: ${sources.join(', ') || 'Fertigkeit'}.`)
  }
  for (const tag of mechanicTags) if (tags.has(tag)) {
    const sources = uniqueSorted(productive.filter(effect => effect.tags.includes(tag)).map(effect => sourceNames[effect.source]))
    if (sources.length) result.push(`${mechanicNames[tag]} ist belegt relevant. Quellen: ${sources.join(', ')}.`)
  }
  if (!tags.has('critical')) result.push('Kritische Skalierung wird nicht positiv bewertet, solange die Hauptfertigkeit sie nicht belegt.')
  return result
}

export function createBuildEffectModel(input: BuildEffectModelInput): BuildEffectModel {
  const effects = [...equipmentEffects(input), ...skillAndSupportEffects(input), ...feedbackEffects(input.realPassivePlanning)].sort(compare)
  const mainSkillId = input.input.character.desiredMainSkillId ?? input.input.skillSetups.find(value => value.role === 'main' && value.skillId)?.skillId
  const mainSkill = input.skills.find(value => value.id === mainSkillId)
  const tags = new Set<string>([...(mainSkill?.tags ?? []), ...(mainSkill?.damageTypes ?? [])])
  const unresolvedEffects = effects.filter(effect => !effect.productive || effect.evidence === 'unresolved')
  return {
    version: BUILD_EFFECT_MODEL_VERSION,
    effects,
    offenceEffects: effects.filter(effect => effect.domain === 'offence'),
    defenceEffects: effects.filter(effect => effect.domain === 'defence'),
    resourceEffects: effects.filter(effect => effect.domain === 'resource'),
    unresolvedEffects,
    activeDamageTypes: uniqueSorted([...tags].filter(value => (damageTags as readonly string[]).includes(value)) as MechanicTag[]),
    activeMechanics: uniqueSorted([...tags].filter(value => (mechanicTags as readonly string[]).includes(value)) as MechanicTag[]),
    scalingAdvice: scalingAdvice(effects, tags),
    warnings: [
      'Keine bestätigte Schadensumwandlung vorhanden; Schadensarten werden nicht automatisch miteinander verrechnet.',
      ...(unresolvedEffects.length ? [`${unresolvedEffects.length} Wirkungen bleiben ohne produktiven Bonus ungelöst oder inkompatibel.`] : []),
    ],
  }
}
