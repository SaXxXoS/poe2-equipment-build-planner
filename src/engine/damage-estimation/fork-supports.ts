import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain'

export const FORK_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface ForkSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied-coverage-only' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  forkEnabled: boolean
  forkedProjectileDamageMultiplier: number
  singleTargetHitMultiplier: 1
  appliedSupports: Array<{ supportId: string; supportName: string; family: string; finalDamageAfterForkPercent: number; sourceReferences: string[] }>
  blockedSupportIds: string[]
  sourceReferences: string[]
  limitations: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const forkDamageStat = 'support_fork_forked_projectile_damage_+%_final'
const round = (value: number) => Number(value.toFixed(8))

const empty = (status: ForkSupportModel['status'], detail: string, blockedSupportIds: string[] = [], sourceReferences: string[] = []): ForkSupportModel => ({
  modelVersion: FORK_SUPPORT_MODEL_VERSION, status, forkEnabled: false, forkedProjectileDamageMultiplier: 1,
  singleTargetHitMultiplier: 1, appliedSupports: [], blockedSupportIds, sourceReferences, limitations: [], detail,
})

export function resolveForkSupports(input: { skill: NumericSkill; setup?: SkillSetup; supports: SupportGemDefinition[] }): ForkSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const finalDamageAfterForkPercent = Number(numeric?.numericStats?.[forkDamageStat])
    return numeric && Number.isFinite(finalDamageAfterForkPercent) ? [{ definition, numeric, finalDamageAfterForkPercent }] : []
  })
  if (!candidates.length) return empty('not-applicable', 'Keine ausgewählte Unterstützung besitzt eine strukturierte Gabelungswirkung.')
  const sourceReferences = candidates.map(value => `support:${value.numeric.sourceRecordId}:${forkDamageStat}`)
  const skillTypes = new Set(input.skill.skillTypes)
  if (!skillTypes.has('Projectile') || skillTypes.has('ProjectileNoCollision')) return empty(
    'blocked-incompatible-skill',
    'Gabelung benötigt den strukturierten Fertigkeitstyp Projectile und ist bei ProjectileNoCollision ausgeschlossen.',
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
    'Mehrere Stufen derselben Gabelungsfamilie sind ausgewählt. Die Wirkung wird fail-closed blockiert.',
    candidates.filter(value => duplicates.has(value.numeric.gemFamily[0] ?? value.definition.id)).map(value => value.definition.id), sourceReferences,
  )
  const appliedSupports = candidates.map(({ definition, numeric, finalDamageAfterForkPercent }) => ({
    supportId: definition.id, supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
    family: numeric.gemFamily[0] ?? definition.id, finalDamageAfterForkPercent,
    sourceReferences: [`support:${numeric.sourceRecordId}:${forkDamageStat}`],
  }))
  const forkedProjectileDamageMultiplier = round(appliedSupports.reduce((value, support) => value * (1 + support.finalDamageAfterForkPercent / 100), 1))
  return {
    modelVersion: FORK_SUPPORT_MODEL_VERSION, status: 'applied-coverage-only', forkEnabled: true,
    forkedProjectileDamageMultiplier, singleTargetHitMultiplier: 1, appliedSupports, blockedSupportIds: [], sourceReferences,
    limitations: [
      'Die gepinnte Referenz belegt keine feste Zahl von Folgeprojektilen oder getroffenen Zielen.',
      'Der Schadensfaktor gilt erst nach der Gabelung und verändert weder den ersten Treffer noch den Boss-Treffermultiplikator.',
    ],
    detail: `Gabelung ist strukturiert belegt. Folgeprojektile verursachen den Faktor ${forkedProjectileDamageMultiplier}; Zielkontakte und Einzelzieltreffer bleiben mangels geschlossener Kontaktkette unverändert.`,
  }
}
