import { describe, expect, it } from 'vitest'
import { placeholderMetadata, type SkillSetup, type SupportGemDefinition } from '../../domain'
import { removeDuplicateSupportFamilies } from './support-selection'

const definition = (id: string, family: string): SupportGemDefinition => ({
  ...placeholderMetadata(id, id),
  supportFamilyId: family,
  requiredTags: [],
  excludedTags: [],
  ownTags: [],
})

describe('Supportfamilien pro Fertigkeit', () => {
  it('migriert gespeicherte doppelte Supportstufen deterministisch', () => {
    const setup: SkillSetup = {
      id: 'setup',
      skillId: 'skill',
      role: 'main',
      weaponSet: 'both',
      supportGemIds: ['mysticism-i', 'mysticism-ii', 'other'],
    }
    const migrated = removeDuplicateSupportFamilies(
      [setup],
      [
        definition('mysticism-i', 'mysticism'),
        definition('mysticism-ii', 'mysticism'),
        definition('other', 'other'),
      ],
    )
    expect(migrated[0].supportGemIds).toEqual(['mysticism-i', 'other'])
  })
  it('entfernt gespeicherte Supports derselben Spielkategorie', () => {
    const setup: SkillSetup = {
      id: 'setup',
      skillId: 'skill',
      role: 'main',
      weaponSet: 'both',
      supportGemIds: ['cold-mastery', 'fire-mastery', 'other'],
    }
    const cold = { ...definition('cold-mastery', 'cold-mastery'), supportCategoryIds: ['mastery'] }
    const fire = { ...definition('fire-mastery', 'fire-mastery'), supportCategoryIds: ['mastery'] }
    expect(removeDuplicateSupportFamilies([setup], [cold, fire, definition('other', 'other')])[0].supportGemIds)
      .toEqual(['cold-mastery', 'other'])
  })
})
