import type { MechanicTag } from '../../domain'

export type EquipmentProfileField =
  | `damageTypes.${'physical' | 'fire' | 'cold' | 'lightning' | 'chaos'}`
  | `mechanics.${'attack' | 'spell' | 'projectile' | 'melee' | 'area' | 'critical' | 'damage-over-time' | 'minion' | 'movement' | 'buff' | 'debuff'}`
  | `speed.${'attackSpeedAffinity' | 'castSpeedAffinity' | 'movementAffinity'}`
  | `defence.${'lifeAffinity' | 'armourAffinity' | 'evasionAffinity' | 'energyShieldAffinity'}`

export interface EquipmentRule {
  ruleId: string
  descriptionKey: string
  applicableModifierIds?: string[]
  applicableTags?: MechanicTag[]
  affectedProfileField: EquipmentProfileField
  weight: number
  minimumValue?: number
  maximumContribution: number
  weaponSetScope?: 'set-1' | 'set-2' | 'both'
  reasonCode: string
  evidenceType: 'direct' | 'indirect'
  enabled: boolean
}

const direct = (id: string, field: EquipmentProfileField, tags: MechanicTag[], weight = 5): EquipmentRule => ({ ruleId: `equipment-rule-${id}`, descriptionKey: `engine.equipment.rule.${id}`, applicableModifierIds: [`fixture-${id}`], applicableTags: tags, affectedProfileField: field, weight, maximumContribution: 50, reasonCode: `equipment-${id}`, evidenceType: 'direct', enabled: true })
const indirect = (id: string, field: EquipmentProfileField, tags: MechanicTag[], weight = 3): EquipmentRule => ({ ...direct(id, field, tags, weight), ruleId: `equipment-rule-${id}-${field.replace('.', '-')}`, applicableModifierIds: [`fixture-${id}`], reasonCode: `equipment-${id}-${field.replace('.', '-')}`, evidenceType: 'indirect' })

export const EQUIPMENT_RULES: EquipmentRule[] = [
  direct('physical-damage', 'damageTypes.physical', ['physical']), direct('fire-damage', 'damageTypes.fire', ['fire']), direct('cold-damage', 'damageTypes.cold', ['cold']), direct('lightning-damage', 'damageTypes.lightning', ['lightning']), direct('chaos-damage', 'damageTypes.chaos', ['chaos']),
  direct('attack-speed', 'speed.attackSpeedAffinity', ['attack']), indirect('attack-speed', 'mechanics.attack', ['attack']),
  direct('cast-speed', 'speed.castSpeedAffinity', ['spell']), indirect('cast-speed', 'mechanics.spell', ['spell']),
  direct('movement-speed', 'speed.movementAffinity', ['movement']), indirect('movement-speed', 'mechanics.movement', ['movement']),
  direct('critical-chance', 'mechanics.critical', ['critical']), direct('critical-multiplier', 'mechanics.critical', ['critical'], 4),
  direct('maximum-life', 'defence.lifeAffinity', ['defensive']), direct('armour', 'defence.armourAffinity', ['defensive']), direct('evasion', 'defence.evasionAffinity', ['defensive']), direct('energy-shield', 'defence.energyShieldAffinity', ['defensive']),
  direct('projectile-damage', 'mechanics.projectile', ['projectile']), direct('melee-damage', 'mechanics.melee', ['melee']), direct('area-damage', 'mechanics.area', ['area']), direct('minion-damage', 'mechanics.minion', ['minion']), direct('damage-over-time', 'mechanics.damage-over-time', ['damage-over-time']), direct('buff-effect', 'mechanics.buff', ['buff']), direct('debuff-effect', 'mechanics.debuff', ['debuff']),
]
