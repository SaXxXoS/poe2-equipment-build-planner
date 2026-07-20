export const ROTATION_GENERATOR_VERSION = '0.2.0-synthetic'

export const ROTATION_CONFIG = {
  mappingMaximumSetupSteps: 1,
  mappingFrequentSwapCount: 2,
  bossFrequentSwapCount: 3,
  complexity: {
    mediumStepCount: 5,
    highStepCount: 9,
    highSwapCount: 2,
    highMaintenanceCount: 3,
    highSetupCount: 3,
    highDistinctSkillCount: 7,
  },
  confidence: {
    highMinimum: 75,
    mediumMinimum: 45,
    base: 100,
    lowSkillPenalty: 20,
    mediumSkillPenalty: 10,
    ambiguousRolePenalty: 8,
    ambiguousWeaponSetPenalty: 6,
    missingMetadataPenalty: 5,
    warningPenalty: 5,
    buildEnablerReoptimizationPenalty: 25,
  },
} as const
