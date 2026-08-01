import type { CharacterAttributeValues } from '../../engine/character-attributes/model'

export interface BaseRequirementInput {
  requiredLevel: number | null
  requirements: {
    strength: number | null
    dexterity: number | null
    intelligence: number | null
  }
}

export interface BaseRequirementEvaluation {
  status: 'met' | 'blocked-level' | 'blocked-attributes' | 'blocked-unknown-attributes'
  missing: Partial<CharacterAttributeValues>
}

export function evaluateBaseRequirements(
  base: BaseRequirementInput,
  characterLevel: number | undefined,
  attributes: CharacterAttributeValues | undefined,
): BaseRequirementEvaluation {
  if (base.requiredLevel !== null && (characterLevel === undefined || characterLevel < base.requiredLevel)) {
    return { status: 'blocked-level', missing: {} }
  }
  const hasAttributeRequirement = Object.values(base.requirements).some(value => (value ?? 0) > 0)
  if (hasAttributeRequirement && !attributes) {
    return { status: 'blocked-unknown-attributes', missing: {} }
  }
  const missing = attributes ? {
    strength: Math.max(0, (base.requirements.strength ?? 0) - attributes.strength),
    dexterity: Math.max(0, (base.requirements.dexterity ?? 0) - attributes.dexterity),
    intelligence: Math.max(0, (base.requirements.intelligence ?? 0) - attributes.intelligence),
  } : {}
  return Object.values(missing).some(value => (value ?? 0) > 0)
    ? { status: 'blocked-attributes', missing }
    : { status: 'met', missing }
}

export const baseRequirementsMet = (
  base: BaseRequirementInput,
  characterLevel: number | undefined,
  attributes: CharacterAttributeValues | undefined,
) => evaluateBaseRequirements(base, characterLevel, attributes).status === 'met'
