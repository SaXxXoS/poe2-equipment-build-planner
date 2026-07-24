export type DamageEstimateStatus = 'available' | 'partial' | 'unavailable'
export interface DamageComponent { type:'physical'|'fire'|'cold'|'lightning'|'chaos'; minimum:number; maximum:number }
export interface DamageEstimate {
  status:DamageEstimateStatus
  skillId?:string
  skillName?:string
  gemLevel?:number
  weaponSet:'set-1'|'set-2'|'both'
  hitDamage?:{minimum:number;maximum:number;average:number}
  actionsPerSecond?:number
  hitDamagePerSecond?:number
  components:DamageComponent[]
  included:string[]
  excluded:string[]
  warnings:string[]
  sourceCommit:string
  calculatorVersion:string
}
