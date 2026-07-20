export const syntheticExplanationFixtureScenarios = [
  { fixtureId: 'explanation-a-lightning-projectile', expectationCodes: ['equipment-synergy', 'confidence-high'] },
  { fixtureId: 'explanation-b-cold-spell', expectationCodes: ['skill', 'support', 'passive'] },
  { fixtureId: 'explanation-c-conflicting-equipment', expectationCodes: ['conflict', 'confidence-low'] },
  { fixtureId: 'explanation-d-mapping-rotation', expectationCodes: ['mapping-rotation'] },
  { fixtureId: 'explanation-e-boss-weapon-swap', expectationCodes: ['boss-rotation', 'rotation-switch-weapon-set', 'persistent-effect'] },
  { fixtureId: 'explanation-f-expiring-effect', expectationCodes: ['effect-expires-on-weapon-swap'] },
  { fixtureId: 'explanation-g-build-enabler-unique', expectationCodes: ['unique-reoptimization'] },
  { fixtureId: 'explanation-h-blocked-support', expectationCodes: ['violation'] },
  { fixtureId: 'explanation-i-unreachable-passive', expectationCodes: ['violation'] },
  { fixtureId: 'explanation-j-unknown-reason', expectationCodes: ['unresolvedReasonCodes'] },
  { fixtureId: 'explanation-k-missing-display-name', expectationCodes: ['missingDisplayNames'] },
] as const
