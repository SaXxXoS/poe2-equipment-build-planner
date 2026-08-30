import type { BuildAnalysis, Score } from '../../engine'
import type {
  BuildPackageEvaluation,
  BuildVariantCandidate,
} from './build-variant-optimizer'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)))

const average = (values: number[]) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const scoreValue = (score: Pick<Score, 'totalScore'> | undefined) =>
  clamp(score?.totalScore ?? 0)

const candidateTags = (
  candidate: BuildVariantCandidate,
  selectedSkill: BuildAnalysis['skillAnalysis']['allCandidates'][number] | undefined,
) => new Set([
  ...(candidate.skillTags ?? []),
  ...(selectedSkill?.matchedProfileFields ?? [])
    .flatMap(field => field.split('.'))
    .filter(Boolean),
])

const hasCandidateEvidence = (
  tags: Set<string>,
  matchedSkillTags: readonly string[] = [],
  matchedProfileFields: readonly string[] = [],
) => matchedSkillTags.some(tag => tags.has(tag))
  || matchedProfileFields.some(field =>
    [...tags].some(tag => field === tag || field.endsWith(`.${tag}`)),
  )

const realPassiveCoverageScore = (
  candidate: BuildVariantCandidate,
  analysis: BuildAnalysis,
): number | null => {
  const planning = analysis.realPassivePlanning
  if (!planning?.enabled) return null
  const plan = planning.weaponSetPlanning?.[candidate.mainWeaponSet]
    ?? planning.pipelineResult
  if (!plan || plan.pointBudget <= 0) return 0
  const budgetCoverage = Math.min(1, plan.usedPointBudget / plan.pointBudget)
  const feedback = planning.profileFeedback
  const setFeedback = candidate.mainWeaponSet === 'set-1'
    ? feedback?.set1
    : feedback?.set2
  const fieldDeltas = [
    ...(feedback?.shared?.fieldDeltas ?? []),
    ...(feedback?.ascendancy?.fieldDeltas ?? []),
    ...(setFeedback?.fieldDeltas ?? []),
  ]
  const tags = new Set(candidate.skillTags ?? [])
  const relevantFields = fieldDeltas.filter(delta => hasCandidateEvidence(
    tags,
    [],
    [delta.field],
  ))
  // Der reale Plan ist bereits aus demselben Buildprofil erzeugt. Seine
  // Budgetabdeckung bildet deshalb die belastbare Grundkomponente; explizit
  // passende Profilrückwirkungen erhöhen sie, ohne einen DPS-Wert zu erfinden.
  return clamp(budgetCoverage * 70 + Math.min(30, relevantFields.length * 6))
}

export function evaluateAnalyzedBuildPackage(
  candidate: BuildVariantCandidate,
  analysis: BuildAnalysis,
  options: { allowPlannedEquipmentRequirements?: boolean } = {},
): BuildPackageEvaluation {
  const selectedSkill = analysis.skillAnalysis.allCandidates.find(
    recommendation => recommendation.skillId === candidate.skillId,
  )
  const selectedSupports = candidate.compatibleSupportIds
    .map(id => analysis.supportAnalysis.allCandidates.find(item => item.supportId === id))
    .filter(item => item !== undefined)
  const validSupports = selectedSupports.filter(item => item.valid)
  const evidenceTags = candidateTags(candidate, selectedSkill)
  const passiveCandidates = analysis.passiveAnalysis.topDamageCandidates
    .filter(item => item.valid && hasCandidateEvidence(
      evidenceTags,
      [],
      item.matchedProfileFields,
    ))
    .slice(0, 5)
  const jewelCandidates = analysis.jewelAnalysis.topDamageJewels
    .filter(item => item.valid && item.matchedSkillTags.some(tag =>
      candidate.skillTags?.includes(tag)
      ?? selectedSkill?.matchedProfileFields.some(field => field.includes(tag)),
    ))
    .slice(0, 3)
  const uniqueCandidates = analysis.uniqueAnalysis.topDamageUniques
    .filter(item => item.valid
      && item.supportsCurrentBuild
      && hasCandidateEvidence(
        evidenceTags,
        item.matchedSkillTags,
        item.matchedProfileFields,
      ))
    .slice(0, 3)
  const relatedBlockingWarnings = analysis.warnings.filter(item => item.blocking && (
    item.sourceId === candidate.skillId
    || candidate.compatibleSupportIds.includes(item.sourceId ?? '')
  ))
  const requirementOnlyInvalid = Boolean(
    options.allowPlannedEquipmentRequirements
    && relatedBlockingWarnings.length
    && relatedBlockingWarnings.every(item =>
      item.messageKey === 'engine.skill.constraint.skill-attribute-deficit'),
  )
  const blockers = [
    ...(!selectedSkill?.valid && !requirementOnlyInvalid
      ? ['Die Hauptfertigkeit wurde vom Skill Analyzer blockiert.']
      : []),
    ...selectedSupports
      .filter(item => !item.valid)
      .map(item => `Support ${item.supportId} ist für diese Hauptfertigkeit technisch blockiert.`),
    ...relatedBlockingWarnings
      .filter(item => !(
        options.allowPlannedEquipmentRequirements
        && item.messageKey === 'engine.skill.constraint.skill-attribute-deficit'
      ))
      .map(item => item.messageKey),
  ]
  const components = {
    equipment: scoreValue(analysis.equipmentAnalysis.score),
    skill: scoreValue(selectedSkill),
    supports: clamp(average(validSupports.map(item => item.totalScore))),
    passives: realPassiveCoverageScore(candidate, analysis)
      ?? clamp(average(passiveCandidates.map(item => item.damageScore))),
    jewels: clamp(average(jewelCandidates.map(item => item.damageScore))),
    uniques: clamp(average(uniqueCandidates.map(item => item.damageScore))),
    resources: candidate.resourceStatus === 'confirmed-usable'
      ? 100
      : candidate.resourceStatus === 'usable-with-limited-sustain'
        ? 55
        : 25,
    rotation: analysis.rotationAnalysis.validPlans.length > 0
      ? clamp(100 - analysis.rotationAnalysis.validPlans[0].missingRoles.length * 20)
      : 20,
  }
  const weightedScore = clamp(
    components.equipment * 0.14
    + components.skill * 0.24
    + components.supports * 0.16
    + components.passives * 0.16
    + components.jewels * 0.07
    + components.uniques * 0.07
    + components.resources * 0.1
    + components.rotation * 0.06,
  )
  const missingCoreSections = [
    components.supports === 0 && 'Supports',
    analysis.realPassivePlanning?.enabled && components.passives === 0 && 'Passive',
  ].filter((value): value is string => Boolean(value))
  const missingOptionalSections = [
    components.jewels === 0 && 'Juwelen',
    components.uniques === 0 && 'Uniques',
  ].filter((value): value is string => Boolean(value))
  const status = blockers.length
    ? 'blocked'
    : missingCoreSections.length > 0
      ? 'limited'
      : 'coherent'
  const evidence = [
    `Gemeinsame Paketprüfung: ${weightedScore}/100.`,
    `Teilwerte – Ausrüstung ${components.equipment}, Skill ${components.skill}, Supports ${components.supports}, Passive ${components.passives}, Juwelen ${components.jewels}, Uniques ${components.uniques}, Ressourcen ${components.resources}, Rotation ${components.rotation}.`,
    ...(missingCoreSections.length
      ? [`Unvollständige Kernkette: ${missingCoreSections.join(', ')} liefern für dieses Paket noch keinen positiven Fachbeleg.`]
      : ['Hauptskill, Supports und Passive-Plan liefern gemeinsam positive Fachbelege.']),
    ...(missingOptionalSections.length
      ? [`Optionale Ausbaukandidaten fehlen noch in: ${missingOptionalSections.join(', ')}. Das erzeugt keinen unbelegten Ersatzvorschlag.`]
      : ['Juwel- und Unique-Analyzer liefern belegte optionale Ausbaukandidaten.']),
    ...(candidate.resourceStatus === 'resource-chain-unknown' && candidate.metaReferenceProfileCount
      ? [`Die lokale Ressourcenkette ist unvollständig modelliert; das vollständige Paket ist jedoch in ${candidate.metaReferenceProfileCount} gepinnten aktuellen Profilen gemeinsam belegt.`]
      : []),
  ]
  return {
    status,
    totalScore: weightedScore,
    components,
    evidence,
    blockers,
  }
}
