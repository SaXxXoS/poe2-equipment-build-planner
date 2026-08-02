import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'

export const RICOCHET_SUPPORT_MODEL_VERSION = '1.0.0'
type NumericSkill = (typeof reference.skills)[number]

export interface RicochetSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied-coverage-only' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  terrainChainChancePercent: number
  additionalTerrainChainsOnSuccess: 0 | 1
  singleTargetHitMultiplier: 1
  appliedSupports: Array<{ supportId: string; supportName: string; family: string; terrainChainChancePercent: number; sourceReferences: string[] }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  limitations: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const chanceStat = 'projectile_chance_to_chain_1_extra_time_from_terrain_%'
const empty = (status: RicochetSupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = []): RicochetSupportModel => ({
  modelVersion: RICOCHET_SUPPORT_MODEL_VERSION, status, terrainChainChancePercent: 0, additionalTerrainChainsOnSuccess: 0,
  singleTargetHitMultiplier: 1, appliedSupports: [], blockedSupportIds, sourceReferences, limitations: [], detail,
})

export function resolveRicochetSupports(input: { skill: NumericSkill; setup?: SkillSetup; supports: SupportGemDefinition[] }): RicochetSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const chance = Number(numeric?.numericStats?.[chanceStat])
    return numeric && Number.isFinite(chance) && chance > 0 ? [{ definition, numeric, chance }] : []
  })
  if (!candidates.length) return empty('not-applicable', 'Keine ausgewählte Unterstützung besitzt eine strukturierte Terrain-Abprallchance.')
  const sourceReferences = candidates.map(value => `support:${value.numeric.sourceRecordId}:${chanceStat}`)
  const skillTypes = new Set(input.skill.skillTypes)
  if (!skillTypes.has('Projectile') || skillTypes.has('CannotChain') || skillTypes.has('CannotTerrainChain')) return empty(
    'blocked-incompatible-skill',
    'Abprallen benötigt Projectile und ist bei CannotChain oder CannotTerrainChain ausgeschlossen.',
    candidates.map(value => value.definition.id), sourceReferences,
  )
  const familyCounts = new Map<string, number>()
  for (const candidate of candidates) {
    const family = candidate.numeric.gemFamily[0] ?? candidate.definition.id
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
  }
  const duplicates = new Set([...familyCounts].filter(([, count]) => count > 1).map(([family]) => family))
  if (duplicates.size) return empty(
    'blocked-duplicate-family',
    'Mehrere Stufen derselben Abprallfamilie sind ausgewählt. Die Wirkung wird fail-closed blockiert.',
    candidates.filter(value => duplicates.has(value.numeric.gemFamily[0] ?? value.definition.id)).map(value => value.definition.id), sourceReferences,
  )
  const appliedSupports = candidates.map(({ definition, numeric, chance }) => ({
    supportId: definition.id, supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id, terrainChainChancePercent: chance,
    sourceReferences: [`support:${numeric.sourceRecordId}:${chanceStat}`],
  }))
  const terrainChainChancePercent = Math.min(100, appliedSupports.reduce((sum, value) => sum + value.terrainChainChancePercent, 0))
  return {
    modelVersion: RICOCHET_SUPPORT_MODEL_VERSION, status: 'applied-coverage-only', terrainChainChancePercent,
    additionalTerrainChainsOnSuccess: 1, singleTargetHitMultiplier: 1, appliedSupports, blockedSupportIds: [], sourceReferences,
    limitations: [
      'Die Chance setzt einen geeigneten Terrainkontakt voraus; dessen Häufigkeit ist nicht Teil des Eingabeprofils.',
      'Ein möglicher zusätzlicher Terrain-Chain wird nicht als garantierter Zielkontakt oder Boss-Treffer gewertet.',
    ],
    detail: `${terrainChainChancePercent}% Chance auf genau einen zusätzlichen Terrain-Chain sind strukturiert belegt; Trefferzahl und Schaden bleiben ohne Terrainkontakt unverändert.`,
  }
}
