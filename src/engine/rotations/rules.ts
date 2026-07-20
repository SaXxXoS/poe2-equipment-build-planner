import type { MechanicTag } from '../../domain'
import type { RotationActionType, RotationSkillRole, RotationType, RotationWeaponSet } from '../common/types'

export interface RotationRule {
  ruleId: string
  descriptionKey: string
  applicableRotationTypes: RotationType[]
  requiredSkillRoles?: RotationSkillRole[]
  requiredSkillTags?: MechanicTag[]
  excludedSkillTags?: MechanicTag[]
  requiredWeaponSet?: RotationWeaponSet
  priority: number
  actionType: RotationActionType
  beforeRoles?: RotationSkillRole[]
  afterRoles?: RotationSkillRole[]
  reasonCode: string
  enabled: boolean
}

export const ROTATION_RULES: RotationRule[] = [
  { ruleId: 'mapping-movement', descriptionKey: 'rotation.rule.mapping-movement', applicableRotationTypes: ['mapping'], requiredSkillRoles: ['movement'], priority: 10, actionType: 'move', beforeRoles: ['main-damage'], reasonCode: 'rotation-mapping-movement', enabled: true },
  { ruleId: 'setup-before-damage', descriptionKey: 'rotation.rule.setup-before-damage', applicableRotationTypes: ['mapping', 'boss'], requiredSkillRoles: ['setup'], priority: 20, actionType: 'use-skill', beforeRoles: ['main-damage'], reasonCode: 'rotation-prepare-target', enabled: true },
  { ruleId: 'debuff-before-damage', descriptionKey: 'rotation.rule.debuff-before-damage', applicableRotationTypes: ['mapping', 'boss'], requiredSkillRoles: ['debuff'], priority: 30, actionType: 'use-skill', beforeRoles: ['main-damage'], reasonCode: 'rotation-apply-debuff', enabled: true },
  { ruleId: 'buff-before-damage', descriptionKey: 'rotation.rule.buff-before-damage', applicableRotationTypes: ['mapping', 'boss'], requiredSkillRoles: ['buff'], priority: 40, actionType: 'use-skill', beforeRoles: ['main-damage'], reasonCode: 'rotation-apply-buff', enabled: true },
  { ruleId: 'main-damage', descriptionKey: 'rotation.rule.main-damage', applicableRotationTypes: ['mapping', 'boss'], requiredSkillRoles: ['main-damage'], priority: 50, actionType: 'use-skill', afterRoles: ['setup', 'debuff', 'buff'], reasonCode: 'rotation-use-main-skill', enabled: true },
  { ruleId: 'secondary-damage', descriptionKey: 'rotation.rule.secondary-damage', applicableRotationTypes: ['boss'], requiredSkillRoles: ['secondary-damage'], priority: 60, actionType: 'use-skill', afterRoles: ['main-damage'], reasonCode: 'rotation-use-secondary-skill', enabled: true },
  { ruleId: 'defensive-response', descriptionKey: 'rotation.rule.defensive-response', applicableRotationTypes: ['boss'], requiredSkillRoles: ['defensive'], priority: 70, actionType: 'defensive-response', reasonCode: 'rotation-defensive-response', enabled: true },
  { ruleId: 'repeat', descriptionKey: 'rotation.rule.repeat', applicableRotationTypes: ['mapping', 'boss'], priority: 90, actionType: 'repeat', reasonCode: 'rotation-repeat-sequence', enabled: true },
]
