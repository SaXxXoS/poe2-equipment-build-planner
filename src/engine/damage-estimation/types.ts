export type DamageEstimateStatus = 'available' | 'partial' | 'unavailable'
export interface DamageComponent { type:'physical'|'fire'|'cold'|'lightning'|'chaos'; minimum:number; maximum:number }
export type EnemyResistanceType = Exclude<DamageComponent['type'],'physical'>
export type EnemyTargetRarity='normal'|'magic'|'rare'|'unique'
export type TemporalEffectUptimeStatus='permanent'|'maintainable'|'windowed'|'ramping'|'unresolved'
export interface AppliedEnemyMitigationEffect {
  source:'skill'|'passive'|'ascendancy'
  sourceId:string
  label:string
  kind:'resistance-reduction'|'penetration'|'armour-break'
  damageTypes:Array<DamageComponent['type']>
  value:number
  evidence:'structured-exact'|'text-pattern-exact'
  sourceReference:string
  conditional:boolean
  durationMs?:number
  activationTimeMs?:number
  applicationRatePerSecond?:number
  timeToFullEffectMs?:number
  estimatedUptime?:number
  uptimeStatus:TemporalEffectUptimeStatus
  effectiveValue?:number
  state:'permanent'|'assumed-active'|'building'|'fully-active'
  stateDetail?:string
}
export interface EnemyMitigationProfile {
  id:string
  label:string
  source:'manual-comparison-profile'|'automatic-season-reference'
  sourceVersion?:string
  targetRarity?:EnemyTargetRarity
  limitations?:string[]
  armour?:number
  armourBreak?:number
  resistances?:Partial<Record<EnemyResistanceType,number>>
  penetration?:Partial<Record<EnemyResistanceType,number>>
  resistanceReduction?:Partial<Record<EnemyResistanceType,number>>
  appliedEffects?:AppliedEnemyMitigationEffect[]
  fullyBrokenArmour?:boolean
  hitsToFullyBreakArmour?:number
  timeToFullyBreakArmourMs?:number
  temporalModelVersion?:string
}
export interface MitigatedDamageComponent extends DamageComponent { effectiveDefence:number; mitigationPercent:number }
export interface DamageCalculationStage { id:'base'|'conversion'|'increased-damage'|'support-more-damage'|'prepared-next-hit'|'temporal-active-window'|'speed'|'critical-expectation'|'enemy-mitigation';label:string;components:DamageComponent[];value?:number }
export interface AppliedQuantitativeEffect { source:'equipment'|'passive'|'ascendancy'|'support';sourceId:string;label:string;value:number }
export interface AppliedTemporalOffensiveEffect { sourceId:string;label:string;kind:'more-damage'|'increased-action-speed'|'blocked';percent?:number;activationTimeMs?:number;durationMs?:number;status:'active-window'|'blocked';detail:string }
export interface AppliedNextSkillEffect { sourceId:string;sourceLabel:string;targetSkillId?:string;targetSkillLabel?:string;kind:'more-damage'|'gain-as-fire'|'gain-as-chaos'|'blocked';percent?:number;status:'prepared-next-hit'|'blocked';detail:string }
export interface AppliedChargeState { type:'power'|'frenzy'|'endurance';label:string;availability:'unavailable'|'conditional-unresolved'|'available-window';count?:number;detail:string }
export interface AppliedChargeConsumption { sourceId:string;label:string;chargeTypes:Array<'power'|'frenzy'|'endurance'>;intervalMs?:number;detail:string }
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
  activeWindowDamagePerSecond?:number
  activeWindowDamagePerSecondAfterMitigation?:number
  preparedNextHitDamage?:number
  preparedNextHitDamageAfterMitigation?:number
  baseComponents?:DamageComponent[]
  components:DamageComponent[]
  stages?:DamageCalculationStage[]
  appliedDamageEffects?:AppliedQuantitativeEffect[]
  appliedSpeedEffects?:AppliedQuantitativeEffect[]
  appliedSupportEffects?:AppliedQuantitativeEffect[]
  temporalOffensiveEffects?:AppliedTemporalOffensiveEffect[]
  nextSkillEffects?:{modelVersion:string;effects:AppliedNextSkillEffect[]}
  chargeState?:{modelVersion:string;productive:boolean;states:AppliedChargeState[];consumptions:AppliedChargeConsumption[]}
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
