import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { EnemyMitigationProfile } from './types'

export const BLINDSIDE_SUPPORT_MODEL_VERSION = '1.0.0'
type NumericSkill = (typeof reference.skills)[number]

export interface BlindsideSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'inactive-enemy-not-blinded' | 'blocked-unknown-enemy-blind-state' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  criticalChanceMultiplier: number
  criticalDamageBonusMultiplier: number
  appliedSupports: Array<{ supportId: string; supportName: string; family: string; moreCriticalChancePercent: number; moreCriticalDamageBonusPercent: number; sourceReferences: string[] }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const chanceStat = 'support_unseen_critical_strike_chance_+%_final_vs_blinded_enemies'
const damageStat = 'support_unseen_critical_damage_multiplier_+%_final_vs_blinded_enemies'

export function resolveBlindsideSupport(input: { skill: NumericSkill; setup?: SkillSetup; supports: SupportGemDefinition[]; enemyProfile?: EnemyMitigationProfile }): BlindsideSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const chance = Number((numeric?.numericStats as Record<string, number> | undefined)?.[chanceStat])
    const damage = Number((numeric?.numericStats as Record<string, number> | undefined)?.[damageStat])
    return numeric?.sourceRecordId === 'SupportBlindsidePlayer' && Number.isFinite(chance) && Number.isFinite(damage)
      ? [{ definition, numeric, chance, damage }]
      : []
  })
  const empty = (status: BlindsideSupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = []): BlindsideSupportModel => ({
    modelVersion: BLINDSIDE_SUPPORT_MODEL_VERSION, status, criticalChanceMultiplier: 1, criticalDamageBonusMultiplier: 1,
    appliedSupports: [], blockedSupportIds, sourceReferences, detail,
  })
  if (!candidates.length) return empty('not-applicable', 'Blindside ist nicht ausgewählt.')
  const sourceReferences = candidates.flatMap(value => [`support:${value.numeric.sourceRecordId}:${chanceStat}`, `support:${value.numeric.sourceRecordId}:${damageStat}`])
  const ids = candidates.map(value => value.definition.id)
  if (candidates.length !== 1) return empty('blocked-duplicate-family', 'Mehrere Blindside-Supports derselben Familie sind ausgewählt; die Wirkung wird fail-closed blockiert.', ids, sourceReferences)
  const candidate = candidates[0]
  const types = new Set(input.skill.skillTypes)
  if (!types.has('Attack') || (!types.has('CrossbowSkill') && !types.has('CrossbowAmmoSkill')) || types.has('DegenOnlySpellDamage')) {
    return empty('blocked-incompatible-skill', 'Blindside ist laut gepinnter Definition nur mit passenden Armbrustangriffen kompatibel.', ids, sourceReferences)
  }
  if (input.enemyProfile?.blinded === false) return empty('inactive-enemy-not-blinded', 'Das Ziel ist bestätigt nicht geblendet; der Blindside-Bonus ist inaktiv.', [], sourceReferences)
  if (input.enemyProfile?.blinded !== true) return empty('blocked-unknown-enemy-blind-state', 'Ob das Ziel geblendet ist, ist unbekannt; der bedingte Blindside-Bonus wird nicht angenommen.', ids, sourceReferences)
  return {
    modelVersion: BLINDSIDE_SUPPORT_MODEL_VERSION, status: 'applied', criticalChanceMultiplier: 1 + candidate.chance / 100,
    criticalDamageBonusMultiplier: 1 + candidate.damage / 100,
    appliedSupports: [{ supportId: candidate.definition.id, supportName: candidate.definition.displayNameDe ?? candidate.definition.nameEn ?? candidate.numeric.name, family: candidate.numeric.gemFamily[0] ?? 'Blindside', moreCriticalChancePercent: candidate.chance, moreCriticalDamageBonusPercent: candidate.damage, sourceReferences }],
    blockedSupportIds: [], sourceReferences,
    detail: `${candidate.chance}% mehr kritische Trefferchance und ${candidate.damage}% mehr kritischer Schadensbonus gegen das bestätigt geblendete Ziel werden angewandt.`,
  }
}
