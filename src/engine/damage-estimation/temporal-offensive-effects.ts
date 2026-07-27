import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RotationAnalysis } from '../common/types'
import type { RotationStepTiming } from '../rotations/timing'
import type { DamageComponent } from './types'

export const TEMPORAL_OFFENSIVE_EFFECT_MODEL_VERSION = '1.1.0'
export interface TemporalOffensiveEffect {
  sourceId: string
  label: string
  target: 'player'
  kind: 'more-damage' | 'increased-action-speed' | 'blocked'
  percent?: number
  appliesTo: Array<'attack' | 'spell'>
  activationTimeMs?: number
  durationMs?: number
  status: 'active-window' | 'blocked'
  evidence: 'structured-exact' | 'unresolved'
  sourceReferences: string[]
  detail: string
}
export interface TemporalOffensiveEffectResult {
  effects: TemporalOffensiveEffect[]
  appliedEffects: TemporalOffensiveEffect[]
  blockedEffects: TemporalOffensiveEffect[]
  damageMultiplier: number
  actionSpeedMultiplier: number
}

const byName = new Map<string, (typeof reference.skills)[number]>()
for (const skill of reference.skills) {
  const key = skill.name.toLocaleLowerCase('en')
  const current = byName.get(key)
  if (!current || Object.keys(skill.numericStats).length > Object.keys(current.numericStats).length) byName.set(key, skill)
}
const timingOf = (value: unknown) => (value as { timing?: RotationStepTiming } | undefined)?.timing
const blockedCandidates: Record<string, { sourceReferences: string[]; detail: string }> = {
  'Arctic Armour': {
    sourceReferences: ['arctic_armour_minimum_added_cold_damage_per_stack', 'arctic_armour_maximum_added_cold_damage_per_stack', 'maximum_number_of_arctic_armour_stationary_stacks', 'base_active_skill_buff_stack_gain_frequency_ms'],
    detail: 'Schaden pro stationärem Stapel, Stapelmaximum und Aufbauintervall sind belegt; tatsächliche stationäre Dauer und ausgelöster Treffer bleiben unbekannt.',
  },
  'Arctic Howl': {
    sourceReferences: ['wolf_warcry_buff_cold_damage_min_per_5_power_up_to_cap', 'wolf_warcry_buff_cold_damage_max_per_5_power_up_to_cap'],
    detail: 'Kälteschaden pro fünf Warcry-Power ist belegt; tatsächliche Power, Obergrenze und betroffener Folgeangriff sind nicht vollständig aufgelöst.',
  },
  'Charge Regulation': {
    sourceReferences: ['charge_mastery_skill_speed_+%_with_frenzy_charges', 'charge_mastery_crit_chance_+%_final_with_power_charges', 'consume_frenzy_power_and_endurance_charge_every_x_ms'],
    detail: 'Die Effekte je Ladungsart sind belegt; vorhandene Ladungsarten und ihre verlässliche Aufrechterhaltung sind im Buildzustand unbekannt.',
  },
  'Charged Staff': {
    sourceReferences: ['charged_staff_attack_minimum_added_lightning_damage_per_stack', 'charged_staff_attack_maximum_added_lightning_damage_per_stack'],
    detail: 'Zusätzlicher Blitzschaden pro verbrauchter Power Charge ist belegt; tatsächliche Ladungszahl, Buffdauer und betroffene Stabangriffe sind nicht vollständig belegt.',
  },
  'Elemental Conflux': {
    sourceReferences: ['skill_elemental_conflux_active_element_damage_+%_final'],
    detail: 'Der Bonus des aktiven Elements ist belegt; aktives Element, Wechselzeitpunkt und Übereinstimmung mit der Hauptschadensart sind nicht aufgelöst.',
  },
  'Emergency Reload': {
    sourceReferences: ['emergency_reload_damage_+%_final'],
    detail: 'Der Schadensbonus ist belegt, gilt aber für die nächste nachgeladene Armbrustmunition. Zielmunition, Einmalverbrauch und Wiederholungsfrequenz sind nicht vollständig belegt.',
  },
  'Infernal Cry': {
    sourceReferences: ['infernal_cry_exerted_attack_all_damage_%_to_gain_as_fire_%'],
    detail: 'Der Feuergewinn des exerted Angriffs ist belegt; Warcry-Power, Ladungsverbrauch und der konkret betroffene Folgeangriff sind nicht vollständig belegt.',
  },
  'Lunar Blessing': {
    sourceReferences: ['wolf_lunar_blessing_all_damage_%_to_gain_as_cold_damage'],
    detail: 'Der Kältegewinn ist belegt; Buffdauer, Formbedingung und aufrechterhaltbares Aktivierungsfenster sind unbekannt.',
  },
  'Mana Tempest': {
    sourceReferences: ['non_skill_base_all_damage_%_to_gain_as_lightning_with_spells_from_buff'],
    detail: 'Der Blitzgewinn für Zauber ist belegt; tatsächliche Manadauer, Abbruchbedingung und verlässliche Wirkzeit sind nicht vollständig belegt.',
  },
  'Mantra of Destruction': {
    sourceReferences: ['mantra_of_destruction_grant_all_damage_%_to_gain_as_chaos_with_attacks'],
    detail: 'Der Chaosgewinn für Angriffe ist belegt; erforderlicher Combozustand, Verbrauch und Wirkzeit sind nicht vollständig belegt.',
  },
  'Sigil of Power': {
    sourceReferences: ['circle_of_power_spell_damage_+%_final_per_stage'],
    detail: 'Der Bonus pro Stufe ist belegt, aber die tatsächlich erreichte Stufenzahl und Aufbauzeit sind nicht vollständig belegt.',
  },
  Trinity: {
    sourceReferences: ['trinity_damage_+%_final_to_grant_per_50_resonance', 'trinity_resonance_to_grant'],
    detail: 'Bonus und Resonanzgewinn sind belegt; tatsächlich gleichzeitig verfügbare Resonanz je Element und Uptime sind nicht vollständig belegt.',
  },
}

export function collectTemporalOffensiveEffects(input: {
  setups: SkillSetup[]
  skills: SkillGemDefinition[]
  mainSkill?: SkillGemDefinition
  rotationAnalysis?: RotationAnalysis
}): TemporalOffensiveEffectResult {
  const effects: TemporalOffensiveEffect[] = []
  const selected = new Set(input.setups.filter(setup => Boolean(setup.skillId)).map(setup => setup.skillId))
  const bossSteps = input.rotationAnalysis?.bossRotation.steps ?? []
  for (const definition of input.skills.filter(skill => selected.has(skill.id))) {
    const record = definition.nameEn ? byName.get(definition.nameEn.toLocaleLowerCase('en')) : undefined
    if (!record) continue
    const step = bossSteps.find(value => value.skillId === definition.id)
    const timing = timingOf(step)
    const hasActivationChain = Boolean(
      step?.activationCondition === 'once'
      && timing?.evidence === 'structured-exact'
      && timing.effectDurationMs
    )
    const stats = record.numericStats as Record<string, number>
    if (definition.nameEn === 'War Banner') {
      const damage = stats['base_skill_buff_attack_damage_+%_final_to_apply']
      const speed = stats['base_skill_buff_banner_attack_speed_+%_to_apply']
      const attackMain = input.mainSkill?.tags.includes('attack') === true
      const common = {
        sourceId: definition.id,
        label: definition.displayNameDe,
        target: 'player' as const,
        appliesTo: ['attack'] as const,
        activationTimeMs: timing?.activationTimeMs,
        durationMs: timing?.effectDurationMs,
      }
      if (hasActivationChain && attackMain && Number.isFinite(damage) && damage > 0) effects.push({
        ...common, appliesTo: [...common.appliesTo], kind: 'more-damage', percent: damage,
        status: 'active-window', evidence: 'structured-exact',
        sourceReferences: ['base_skill_buff_attack_damage_+%_final_to_apply', ...timing!.sourceReferences],
        detail: `${damage} % mehr Angriffsschaden gelten ausschließlich im belegten aktiven Bannerfenster.`,
      })
      if (hasActivationChain && attackMain && Number.isFinite(speed) && speed > 0) effects.push({
        ...common, appliesTo: [...common.appliesTo], kind: 'increased-action-speed', percent: speed,
        status: 'active-window', evidence: 'structured-exact',
        sourceReferences: ['base_skill_buff_banner_attack_speed_+%_to_apply', ...timing!.sourceReferences],
        detail: `${speed} % erhöhte Angriffsgeschwindigkeit gelten ausschließlich im belegten aktiven Bannerfenster.`,
      })
      if (!hasActivationChain || !attackMain) effects.push({
        ...common, appliesTo: [...common.appliesTo], kind: 'blocked', status: 'blocked', evidence: 'unresolved',
        sourceReferences: ['base_skill_buff_attack_damage_+%_final_to_apply', 'base_skill_buff_banner_attack_speed_+%_to_apply'],
        detail: !attackMain
          ? 'War Banner besitzt keine belegte offensive Wirkung auf eine Nicht-Angriffsfertigkeit.'
          : 'Aktivierungsregel und Wirkzeit sind nicht gemeinsam in der gewählten Bossrotation belegt.',
      })
    }
    const blocked = definition.nameEn ? blockedCandidates[definition.nameEn] : undefined
    if (blocked && blocked.sourceReferences.some(key => Number.isFinite(stats[key]))) effects.push({
      sourceId: definition.id, label: definition.displayNameDe, target: 'player', kind: 'blocked',
      appliesTo: ['attack', 'spell'], activationTimeMs: timing?.activationTimeMs, durationMs: timing?.effectDurationMs,
      status: 'blocked', evidence: 'unresolved',
      sourceReferences: blocked.sourceReferences,
      detail: blocked.detail,
    })
  }
  const appliedEffects = effects.filter(effect => effect.status === 'active-window')
  return {
    effects,
    appliedEffects,
    blockedEffects: effects.filter(effect => effect.status === 'blocked'),
    damageMultiplier: appliedEffects.filter(effect => effect.kind === 'more-damage').reduce((value, effect) => value * (1 + effect.percent! / 100), 1),
    actionSpeedMultiplier: 1 + appliedEffects.filter(effect => effect.kind === 'increased-action-speed').reduce((sum, effect) => sum + effect.percent!, 0) / 100,
  }
}

export function applyTemporalDamageWindow(components: DamageComponent[], multiplier: number): DamageComponent[] {
  return components.map(component => ({
    ...component,
    minimum: component.minimum * multiplier,
    maximum: component.maximum * multiplier,
  }))
}
