import {
  supportExclusiveKeys,
  type SkillSetup,
  type SupportGemDefinition,
} from '../../domain'

export interface RankedSupportForSkill {
  skillId: string
  supportId: string
}

export function fillRecommendedSupportSlots(
  setup: SkillSetup,
  ranked: RankedSupportForSkill[],
  definitions: SupportGemDefinition[],
  limit = 5,
): SkillSetup {
  if (!setup.skillId || setup.supportGemIds.length >= limit) return setup

  const byId = new Map(definitions.map(item => [item.id, item]))
  const selected = [...setup.supportGemIds]
  const usedKeys = new Set(selected.flatMap(id => {
    const definition = byId.get(id)
    return definition ? supportExclusiveKeys(definition) : [id]
  }))

  for (const candidate of ranked) {
    if (candidate.skillId !== setup.skillId || selected.includes(candidate.supportId)) continue
    const definition = byId.get(candidate.supportId)
    if (!definition) continue
    const keys = supportExclusiveKeys(definition)
    if (keys.some(key => usedKeys.has(key))) continue
    selected.push(candidate.supportId)
    keys.forEach(key => usedKeys.add(key))
    if (selected.length >= limit) break
  }

  return selected.length === setup.supportGemIds.length
    ? setup
    : { ...setup, supportGemIds: selected }
}
