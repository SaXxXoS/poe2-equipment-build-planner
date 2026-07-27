import { supportExclusiveKeys, type SkillSetup, type SupportGemDefinition } from '../../domain'

export function removeDuplicateSupportFamilies(
  setups: SkillSetup[],
  definitions: SupportGemDefinition[],
): SkillSetup[] {
  const byId = new Map(definitions.map(item => [item.id, item]))
  return setups.map(setup => {
    const seen = new Set<string>()
    const supportGemIds = setup.supportGemIds.filter(id => {
      const definition = byId.get(id)
      const keys = definition ? supportExclusiveKeys(definition) : [id]
      if (keys.some(key => seen.has(key))) return false
      keys.forEach(key => seen.add(key))
      return true
    })
    return supportGemIds.length === setup.supportGemIds.length ? setup : { ...setup, supportGemIds }
  })
}
