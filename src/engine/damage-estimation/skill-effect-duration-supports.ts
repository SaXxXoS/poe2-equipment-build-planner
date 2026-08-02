import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'

export const SKILL_EFFECT_DURATION_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]
type NumericSupport = (typeof reference.supports)[number]

export interface AppliedSkillEffectDurationSupport {
  supportId: string
  supportName: string
  family: string
  finalDurationPercent: number
  multiplier: number
  sourceReference: string
}

export interface SkillEffectDurationSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  durationMultiplier: number
  appliedSupports: AppliedSkillEffectDurationSupport[]
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const numericSupportsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const durationStats = [
  'support_reduced_duration_skill_effect_duration_+%_final',
  'support_more_duration_skill_effect_duration_+%_final',
] as const

const durationPercent = (support: NumericSupport) => durationStats
  .map(stat => Number((support.numericStats as Record<string, number>)[stat]))
  .find(Number.isFinite)

export function resolveSkillEffectDurationSupports(input: {
  skill: NumericSkill
  setup?: SkillSetup
  supports: SupportGemDefinition[]
}): SkillEffectDurationSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(value => {
    const numeric = numericSupportsByName.get((value.nameEn ?? '').toLocaleLowerCase('en'))
    const percent = numeric ? durationPercent(numeric) : undefined
    return numeric && percent != null ? [{ definition: value, numeric, percent }] : []
  })

  if (!candidates.length) return {
    modelVersion: SKILL_EFFECT_DURATION_SUPPORT_MODEL_VERSION,
    status: 'not-applicable', durationMultiplier: 1, appliedSupports: [], blockedSupportIds: [], sourceReferences: [],
    detail: 'Keine ausgewählte Unterstützung besitzt einen strukturiert belegten finalen Wirkungsdauer-Modifikator.',
  }
  if (!input.skill.skillTypes.includes('Duration')) return {
    modelVersion: SKILL_EFFECT_DURATION_SUPPORT_MODEL_VERSION,
    status: 'blocked-incompatible-skill', durationMultiplier: 1, appliedSupports: [],
    blockedSupportIds: candidates.map(value => value.definition.id),
    sourceReferences: candidates.map(value => `support:${value.numeric.sourceRecordId}`),
    detail: 'Die ausgewählte Fertigkeit besitzt am gepinnten PoB2-Datensatz keinen Duration-Typ. Der Support wird nicht angewandt.',
  }

  const familyCounts = new Map<string, number>()
  for (const candidate of candidates) {
    const family = candidate.numeric.gemFamily[0] ?? candidate.definition.id
    familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1)
  }
  const duplicated = new Set([...familyCounts].filter(([, count]) => count > 1).map(([family]) => family))
  if (duplicated.size) return {
    modelVersion: SKILL_EFFECT_DURATION_SUPPORT_MODEL_VERSION,
    status: 'blocked-duplicate-family', durationMultiplier: 1, appliedSupports: [],
    blockedSupportIds: candidates.filter(value => duplicated.has(value.numeric.gemFamily[0] ?? value.definition.id)).map(value => value.definition.id),
    sourceReferences: candidates.map(value => `support:${value.numeric.sourceRecordId}`),
    detail: 'Mehrere Stufen derselben Dauer-Supportfamilie sind ausgewählt. Die Wirkung wird fail-closed vollständig blockiert.',
  }

  const appliedSupports = candidates.map(({ definition, numeric, percent }) => {
    const stat = durationStats.find(value => Number.isFinite(Number((numeric.numericStats as Record<string, number>)[value])))!
    return {
      supportId: definition.id,
      supportName: definition.displayNameDe ?? definition.nameEn ?? numeric.name,
      family: numeric.gemFamily[0] ?? definition.id,
      finalDurationPercent: percent,
      multiplier: 1 + percent / 100,
      sourceReference: `support:${numeric.sourceRecordId}:${stat}`,
    }
  })
  const durationMultiplier = appliedSupports.reduce((product, value) => product * value.multiplier, 1)
  if (!(durationMultiplier > 0)) return {
    modelVersion: SKILL_EFFECT_DURATION_SUPPORT_MODEL_VERSION,
    status: 'blocked-incompatible-skill', durationMultiplier: 1, appliedSupports: [],
    blockedSupportIds: candidates.map(value => value.definition.id),
    sourceReferences: appliedSupports.map(value => value.sourceReference),
    detail: 'Der strukturierte Dauerfaktor ist nicht positiv und wird deshalb nicht angewandt.',
  }
  return {
    modelVersion: SKILL_EFFECT_DURATION_SUPPORT_MODEL_VERSION,
    status: 'applied', durationMultiplier, appliedSupports, blockedSupportIds: [],
    sourceReferences: appliedSupports.map(value => value.sourceReference),
    detail: 'Finale PoB2-Wirkungsdauerfaktoren werden multiplikativ auf die belegte Grunddauer angewandt. Der Schaden pro Sekunde bleibt unverändert; nur Dauer und Gesamtschaden einer Anwendung ändern sich.',
  }
}
