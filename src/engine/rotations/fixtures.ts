import { placeholderMetadata, type SkillGemDefinition } from '../../domain'

const rotationSkill = (id: string, role: NonNullable<SkillGemDefinition['rotationRoles']>[number], weaponSet: 'set-1' | 'set-2' | 'both' = 'set-1', extra: Partial<SkillGemDefinition> = {}): SkillGemDefinition => ({ ...placeholderMetadata(id, id, role === 'main-damage' ? ['area'] : role === 'movement' ? ['movement'] : role === 'debuff' ? ['debuff'] : role === 'buff' ? ['buff'] : role === 'defensive' ? ['defensive'] : []), possibleRoles: role === 'main-damage' ? ['main'] : role === 'secondary-damage' ? ['secondary'] : role === 'movement' ? ['movement'] : role === 'defensive' ? ['defensive'] : ['utility'], rotationRoles: [role], preferredWeaponSet: weaponSet, enabled: true, ...extra })

export const syntheticRotationFixtures = {
  simpleMapping: [rotationSkill('rotation-a-movement', 'movement'), rotationSkill('rotation-a-main', 'main-damage')],
  mappingWithDebuff: [rotationSkill('rotation-b-movement', 'movement'), rotationSkill('rotation-b-debuff', 'debuff'), rotationSkill('rotation-b-main', 'main-damage')],
  bossWeaponSwap: [rotationSkill('rotation-c-debuff', 'debuff', 'set-2'), rotationSkill('rotation-c-buff', 'buff', 'set-2'), rotationSkill('rotation-c-main', 'main-damage', 'set-1')],
  persistentEffect: [rotationSkill('rotation-d-setup', 'setup', 'set-2', { persistsAfterWeaponSwap: true }), rotationSkill('rotation-d-main', 'main-damage', 'set-1')],
  expiringEffect: [rotationSkill('rotation-e-setup', 'setup', 'set-2', { expiresOnWeaponSwap: true }), rotationSkill('rotation-e-main', 'main-damage', 'set-1')],
  missingMain: [rotationSkill('rotation-f-movement', 'movement')],
  missingDebuff: [rotationSkill('rotation-g-buff', 'buff'), rotationSkill('rotation-g-main', 'main-damage')],
  missingMovement: [rotationSkill('rotation-h-main', 'main-damage')],
  complex: [rotationSkill('rotation-i-setup-a', 'setup'), rotationSkill('rotation-i-setup-b', 'setup'), rotationSkill('rotation-i-setup-c', 'setup'), rotationSkill('rotation-i-debuff', 'debuff'), rotationSkill('rotation-i-buff', 'buff'), rotationSkill('rotation-i-main', 'main-damage'), rotationSkill('rotation-i-secondary', 'secondary-damage'), rotationSkill('rotation-i-defensive', 'defensive')],
  unnecessarySwap: [rotationSkill('rotation-j-debuff', 'debuff'), rotationSkill('rotation-j-main', 'main-damage')],
  bothSet: [rotationSkill('rotation-k-debuff', 'debuff', 'both'), rotationSkill('rotation-k-main', 'main-damage')],
  buildEnablerReoptimization: [rotationSkill('rotation-l-main', 'main-damage')],
} as const
