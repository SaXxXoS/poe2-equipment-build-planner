import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillGemDefinition, SkillSetup } from '../../domain'
import type { RotationAnalysis } from '../common/types'
import type { RotationStepTiming } from '../rotations/timing'
import type { DamageComponent } from './types'

export const TEMPORAL_OFFENSIVE_EFFECT_MODEL_VERSION = '1.0.0'
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
    if (definition.nameEn === 'Sigil of Power' && Number.isFinite(stats['circle_of_power_spell_damage_+%_final_per_stage'])) effects.push({
      sourceId: definition.id, label: definition.displayNameDe, target: 'player', kind: 'blocked',
      appliesTo: ['spell'], activationTimeMs: timing?.activationTimeMs, durationMs: timing?.effectDurationMs,
      status: 'blocked', evidence: 'unresolved',
      sourceReferences: ['circle_of_power_spell_damage_+%_final_per_stage'],
      detail: 'Der Bonus pro Stufe ist belegt, aber die tatsächlich erreichte Stufenzahl und Aufbauzeit sind nicht vollständig belegt.',
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
