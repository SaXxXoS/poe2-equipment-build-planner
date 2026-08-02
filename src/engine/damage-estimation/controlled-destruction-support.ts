import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const CONTROLLED_DESTRUCTION_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface ControlledDestructionSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  hitDamagePercent: number
  hitDamageMultiplier: number
  preventsCriticalHits: boolean
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    hitDamagePercent: number
    sourceReferences: string[]
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_controlled_destruction_spell_damage_+%_final'
const cannotCritStat = 'global_cannot_crit'
const round = (value: number) => Number(value.toFixed(8))

export function resolveControlledDestructionSupport(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
}): ControlledDestructionSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const hitDamagePercent = Number((numeric?.numericStats as Record<string, number> | undefined)?.[damageStat])
    return numeric?.sourceRecordId === 'SupportControlledDestructionPlayer' && Number.isFinite(hitDamagePercent)
      ? [{ definition, numeric, hitDamagePercent }]
      : []
  })
  const empty = (status: ControlledDestructionSupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = []): ControlledDestructionSupportModel => ({
    modelVersion: CONTROLLED_DESTRUCTION_SUPPORT_MODEL_VERSION,
    status, hitDamagePercent: 0, hitDamageMultiplier: 1, preventsCriticalHits: false,
    appliedSupports: [], blockedSupportIds, sourceReferences, detail,
  })
  if (!candidates.length) return empty('not-applicable', 'Kontrollierte Zerstörung ist nicht ausgewählt oder besitzt keine vollständige strukturierte Wirkung.')
  const sourceReferences = candidates.flatMap(value => [
    `support:${value.numeric.sourceRecordId}:${damageStat}`,
    `support:${value.numeric.sourceRecordId}:${cannotCritStat}`,
  ])
  const compatible = input.skill.skillTypes.includes('Damage') && input.skill.skillTypes.includes('Spell')
  if (!compatible) return empty(
    'blocked-incompatible-skill',
    'Kontrollierte Zerstörung unterstützt ausschließlich schädigende Zauber. Es wird kein Effekt angewandt.',
    candidates.map(value => value.definition.id), sourceReferences,
  )
  const families = candidates.map(value => value.numeric.gemFamily[0] ?? value.definition.id)
  if (new Set(families).size !== families.length) return empty(
    'blocked-duplicate-family',
    'Mehrere Gemmen derselben Supportfamilie sind ausgewählt. Die gesamte Wirkung wird fail-closed blockiert.',
    candidates.map(value => value.definition.id), sourceReferences,
  )
  const appliedSupports = candidates.map(({ definition, numeric, hitDamagePercent }) => ({
    supportId: definition.id,
    supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id,
    hitDamagePercent,
    sourceReferences: [`support:${numeric.sourceRecordId}:${damageStat}`, `support:${numeric.sourceRecordId}:${cannotCritStat}`],
  }))
  const hitDamageMultiplier = round(appliedSupports.reduce((value, support) => value * (1 + support.hitDamagePercent / 100), 1))
  return {
    modelVersion: CONTROLLED_DESTRUCTION_SUPPORT_MODEL_VERSION,
    status: 'applied', hitDamagePercent: round((hitDamageMultiplier - 1) * 100), hitDamageMultiplier,
    preventsCriticalHits: true, appliedSupports, blockedSupportIds: [], sourceReferences,
    detail: '25% mehr Trefferschaden werden angewandt; die unterstützte Fertigkeit kann keine kritischen Treffer verursachen.',
  }
}

export const applyControlledDestructionHitMultiplier = (components: DamageComponent[], model: ControlledDestructionSupportModel) =>
  model.status === 'applied'
    ? components.map(value => ({ ...value, minimum: round(value.minimum * model.hitDamageMultiplier), maximum: round(value.maximum * model.hitDamageMultiplier) }))
    : components.map(value => ({ ...value }))
