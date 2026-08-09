import type { BuildAnalysis } from '../../engine'

export const productiveUniqueRecommendations = (analysis: BuildAnalysis) => {
  const source = analysis.uniqueAnalysis.eligibleCandidates.filter(item =>
    item.buildEnabler
    || item.supportsCurrentBuild
    || (item.damageScore > 0 && item.matchedSkillTags.some(tag =>
      !['attack', 'spell', 'defensive', 'resistance'].includes(tag)))
    || item.defenceScore > 0
    || item.resourceScore > 0
    || item.ascendancySynergyScore > 0
    || item.equipmentSynergyScore > 0,
  )
  const seen = new Set<string>()
  return source.filter(item => !seen.has(item.itemSlot) && seen.add(item.itemSlot)).slice(0, 5)
}
