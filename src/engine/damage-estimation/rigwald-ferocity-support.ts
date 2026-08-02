import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const RIGWALD_FEROCITY_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]
type WeaponSet = 'set-1' | 'set-2'

export interface RigwaldFerocitySupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  weaponSet: WeaponSet
  finalDamagePercent: number
  attackSpeedPercent: number
  damageMultiplier: number
  attackSpeedMultiplier: number
  appliedSupports: Array<{
    supportId: string
    supportName: string
    family: string
    finalDamagePercent: number
    attackSpeedPercent: number
    sourceReferences: string[]
  }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const statsBySet = {
  'set-1': {
    speed: 'support_rigwald_attack_speed_+%_in_weapon_set_one',
    damage: 'support_rigwald_damage_+%_final_in_weapon_set_one',
  },
  'set-2': {
    speed: 'support_rigwald_attack_speed_+%_in_weapon_set_two',
    damage: 'support_rigwald_damage_+%_final_in_weapon_set_two',
  },
} as const
const round = (value: number) => Number(value.toFixed(8))

export function resolveRigwaldFerocitySupport(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
  weaponSet: WeaponSet
}): RigwaldFerocitySupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const statKeys = statsBySet[input.weaponSet]
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string, number> | undefined
    const attackSpeedPercent = Number(stats?.[statKeys.speed])
    const finalDamagePercent = Number(stats?.[statKeys.damage])
    return numeric && Number.isFinite(attackSpeedPercent) && Number.isFinite(finalDamagePercent)
      ? [{ definition, numeric, attackSpeedPercent, finalDamagePercent }]
      : []
  })
  const empty = (status: RigwaldFerocitySupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = []): RigwaldFerocitySupportModel => ({
    modelVersion: RIGWALD_FEROCITY_SUPPORT_MODEL_VERSION,
    status, weaponSet: input.weaponSet, finalDamagePercent: 0, attackSpeedPercent: 0,
    damageMultiplier: 1, attackSpeedMultiplier: 1, appliedSupports: [], blockedSupportIds, sourceReferences, detail,
  })
  if (!candidates.length) return empty('not-applicable', 'Rigwalds Wildheit ist nicht ausgewählt oder besitzt keine vollständige strukturierte Waffenset-Wirkung.')
  const sourceReferences = candidates.flatMap(value => [
    `support:${value.numeric.sourceRecordId}:${statKeys.damage}`,
    `support:${value.numeric.sourceRecordId}:${statKeys.speed}`,
  ])
  const incompatible = !input.skill.skillTypes.includes('Attack')
    || input.skill.skillTypes.includes('NoAttackOrCastTime')
    || input.skill.skillTypes.includes('Instant')
  if (incompatible) return empty(
    'blocked-incompatible-skill',
    'Rigwalds Wildheit gilt ausschließlich für nicht-sofortige Angriffe mit normaler Wirkzeit. Es wird kein Effekt angewandt.',
    candidates.map(value => value.definition.id), sourceReferences,
  )
  const families = candidates.map(value => value.numeric.gemFamily[0] ?? value.definition.id)
  if (new Set(families).size !== families.length) return empty(
    'blocked-duplicate-family',
    'Mehrere Gemmen derselben Rigwald-Supportfamilie sind ausgewählt. Die gesamte Wirkung wird fail-closed blockiert.',
    candidates.map(value => value.definition.id), sourceReferences,
  )
  const appliedSupports = candidates.map(({ definition, numeric, attackSpeedPercent, finalDamagePercent }) => ({
    supportId: definition.id,
    supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id,
    finalDamagePercent,
    attackSpeedPercent,
    sourceReferences: [
      `support:${numeric.sourceRecordId}:${statKeys.damage}`,
      `support:${numeric.sourceRecordId}:${statKeys.speed}`,
    ],
  }))
  const damageMultiplier = round(appliedSupports.reduce((value, support) => value * (1 + support.finalDamagePercent / 100), 1))
  const attackSpeedMultiplier = round(appliedSupports.reduce((value, support) => value * (1 + support.attackSpeedPercent / 100), 1))
  return {
    modelVersion: RIGWALD_FEROCITY_SUPPORT_MODEL_VERSION,
    status: 'applied', weaponSet: input.weaponSet,
    finalDamagePercent: round((damageMultiplier - 1) * 100),
    attackSpeedPercent: round((attackSpeedMultiplier - 1) * 100),
    damageMultiplier, attackSpeedMultiplier, appliedSupports,
    blockedSupportIds: [], sourceReferences,
    detail: input.weaponSet === 'set-1'
      ? 'Waffenset 1 erhält die gepinnte höhere Angriffsgeschwindigkeit und den finalen Schadensnachteil.'
      : 'Waffenset 2 erhält den gepinnten finalen Schadensbonus und den Angriffsgeschwindigkeitsnachteil.',
  }
}

export const applyRigwaldDamageMultiplier = (components: DamageComponent[], model: RigwaldFerocitySupportModel) =>
  model.status === 'applied'
    ? components.map(value => ({ ...value, minimum: round(value.minimum * model.damageMultiplier), maximum: round(value.maximum * model.damageMultiplier) }))
    : components.map(value => ({ ...value }))
