export type DamageEstimateStatus = 'available' | 'partial' | 'unavailable'
export interface DamageComponent { type:'physical'|'fire'|'cold'|'lightning'|'chaos'; minimum:number; maximum:number }
export type EnemyResistanceType = Exclude<DamageComponent['type'],'physical'>
export interface EnemyMitigationProfile {
  id:string
  label:string
  source:'manual-comparison-profile'|'automatic-season-reference'
  sourceVersion?:string
  limitations?:string[]
  armour?:number
  armourBreak?:number
  resistances?:Partial<Record<EnemyResistanceType,number>>
  penetration?:Partial<Record<EnemyResistanceType,number>>
  resistanceReduction?:Partial<Record<EnemyResistanceType,number>>
}
export interface MitigatedDamageComponent extends DamageComponent { effectiveDefence:number; mitigationPercent:number }
export interface DamageCalculationStage { id:'base'|'conversion'|'increased-damage'|'support-more-damage'|'speed'|'critical-expectation'|'enemy-mitigation';label:string;components:DamageComponent[];value?:number }
export interface AppliedQuantitativeEffect { source:'equipment'|'passive'|'ascendancy'|'support';sourceId:string;label:string;value:number }
export interface DamageEstimate {
  status:DamageEstimateStatus
  skillId?:string
  skillName?:string
  gemLevel?:number
  weaponSet:'set-1'|'set-2'|'both'
  hitDamage?:{minimum:number;maximum:number;average:number}
  actionsPerSecond?:number
  hitDamagePerSecond?:number
  expectedCriticalHitDamage?:number
  expectedCriticalHitDamagePerSecond?:number
  enemyProfile?:EnemyMitigationProfile
  mitigatedComponents?:MitigatedDamageComponent[]
  expectedDamageAfterMitigation?:number
  expectedDamagePerSecondAfterMitigation?:number
  baseComponents?:DamageComponent[]
  components:DamageComponent[]
  stages?:DamageCalculationStage[]
  appliedDamageEffects?:AppliedQuantitativeEffect[]
  appliedSpeedEffects?:AppliedQuantitativeEffect[]
  appliedSupportEffects?:AppliedQuantitativeEffect[]
  confirmedConversions?:Array<{from:DamageComponent['type'];to:DamageComponent['type'];percent:number;source:'equipment'|'passive'|'ascendancy';sourceId:string}>
  criticalChance?:{base:number;increasedPercent:number;effective:number}
  criticalDamageBonus?:number
  criticalExpectationMultiplier?:number
  included:string[]
  excluded:string[]
  warnings:string[]
  sourceCommit:string
  calculatorVersion:string
}
