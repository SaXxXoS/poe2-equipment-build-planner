import damageReference from '../../generated/pob2/damage-reference.json'
import type { SupportQuantitativeEffect } from '../domain'

export interface Pob2SupportReference {
  sourceRecordId: string
  name: string
  requireSkillTypes: string[]
  excludeSkillTypes: string[]
  numericStats: Record<string, number>
  sourceFile: string
}

const records = damageReference.supports as unknown as Pob2SupportReference[]
const recordsByName = new Map<string, Pob2SupportReference[]>()
for (const record of records) {
  const values = recordsByName.get(record.name) ?? []
  values.push(record)
  recordsByName.set(record.name, values)
}

type DamageType = NonNullable<SupportQuantitativeEffect['damageTypes']>[number]
const elemental: DamageType[] = ['fire', 'cold', 'lightning']

const exactDamageStats: Record<string, DamageType[] | undefined> = {
  'support_brutality_physical_damage_+%_final': ['physical'],
  'support_melee_physical_damage_+%_final': ['physical'],
  'support_gem_elemental_damage_+%_final': elemental,
  'support_attack_skills_elemental_damage_+%_final': elemental,
  'support_area_concentrate_area_damage_+%_final': undefined,
  'support_slow_cast_spell_damage_+%_final': undefined,
  'support_controlled_destruction_spell_damage_+%_final': undefined,
  'support_multiple_damage_+%_final': undefined,
  'support_chain_hit_damage_+%_final': undefined,
  'support_spell_cascade_damage_+%_final': undefined,
  'support_fork_forked_projectile_damage_+%_final': undefined,
  'support_spell_rapid_fire_repeat_use_damage_+%_final': undefined,
  'support_hourglass_damage_+%_final': undefined,
}

export function pob2SupportReferenceFor(nameEn: string | undefined) {
  if (!nameEn) return undefined
  const matches = recordsByName.get(nameEn)
  return matches?.length === 1 ? matches[0] : undefined
}

export function pob2QuantitativeEffectsFor(nameEn: string | undefined): SupportQuantitativeEffect[] | undefined {
  const record = pob2SupportReferenceFor(nameEn)
  if (!record) return undefined
  const effects = Object.entries(record.numericStats).flatMap(([stat, percent]) => {
    if (!(stat in exactDamageStats) || percent === 0) return []
    return [{
      kind: 'more-damage' as const,
      percent,
      damageTypes: exactDamageStats[stat],
      evidence: 'structured-exact' as const,
      sourceReference: `${damageReference.sourceRepository}@${damageReference.sourceCommit}/${record.sourceFile}#${record.sourceRecordId}:${stat}`,
    }]
  })
  return effects.length ? effects : undefined
}

export const pob2SupportReferenceCoverage = {
  totalRecords: records.length,
  uniquelyNamedRecords: [...recordsByName.values()].filter(values => values.length === 1).length,
  quantitativelyMappedRecords: records.filter(record => pob2QuantitativeEffectsFor(record.name)?.length).length,
}
