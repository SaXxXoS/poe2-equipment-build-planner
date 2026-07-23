import type { CharacterConfiguration } from '../../domain'

export const createInitialCharacterConfiguration = (): CharacterConfiguration => ({
  classId: '',
  ascendancyId: '',
  level: 0,
  additionalPassivePoints: undefined,
  goalProfile: 'balanced',
})
