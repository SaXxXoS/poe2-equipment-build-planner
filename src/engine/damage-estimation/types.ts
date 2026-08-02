export type DamageEstimateStatus = 'available' | 'partial' | 'unavailable'
export interface DamageComponent { type:'physical'|'fire'|'cold'|'lightning'|'chaos'; minimum:number; maximum:number }
export type EnemyResistanceType = Exclude<DamageComponent['type'],'physical'>
export type EnemyTargetRarity='normal'|'magic'|'rare'|'unique'
export type TemporalEffectUptimeStatus='permanent'|'maintainable'|'windowed'|'ramping'|'unresolved'
export interface AppliedEnemyMitigationEffect {
  source:'skill'|'support'|'passive'|'ascendancy'
  sourceId:string
  label:string
  kind:'resistance-reduction'|'penetration'|'armour-break'|'damage-taken-increased'|'critical-damage-bonus-against-target'|'freeze-buildup-more'|'electrocute-buildup-increased'
  damageTypes:Array<DamageComponent['type']>
  value:number
  evidence:'structured-exact'|'text-pattern-exact'
  sourceReference:string
  conditional:boolean
  durationMs?:number
  activationTimeMs?:number
  applicationRatePerSecond?:number
  timeToFullEffectMs?:number
  stackCount?:number
  maximumStacks?:number
  estimatedUptime?:number
  uptimeStatus:TemporalEffectUptimeStatus
  effectiveValue?:number
  state:'permanent'|'assumed-active'|'building'|'fully-active'
  stateDetail?:string
  effectGroup?:'shock'|'curse'|'exposure'|'mark'
  selectionStatus?:'selected-strongest'|'selected-stacked'|'superseded-by-stronger'
}
export interface BlockedEnemyMitigationEffect {
  source:'equipment'|'skill'|'passive'|'ascendancy'
  sourceId:string
  label:string
  kind:'fixed-shock'
  value:number
  durationMs?:number
  activationCondition:'enemy-on-shocked-ground'
  reason:'enemy-ground-occupancy-unconfirmed'
  evidence:'structured-exact'|'text-pattern-exact'
  sourceReferences:string[]
  detail:string
}
export interface EnemyMitigationProfile {
  id:string
  label:string
  source:'manual-comparison-profile'|'automatic-season-reference'
  sourceVersion?:string
  targetRarity?:EnemyTargetRarity
  monsterPower?:number
  monsterPowerEvidence?:'pinned-rarity-default'|'manual-exact'
  level?:number
  evasion?:number
  limitations?:string[]
  armour?:number
  armourBreak?:number
  resistances?:Partial<Record<EnemyResistanceType,number>>
  penetration?:Partial<Record<EnemyResistanceType,number>>
  resistanceReduction?:Partial<Record<EnemyResistanceType,number>>
  damageTakenIncreased?:Partial<Record<DamageComponent['type'],number>>
  additionalCriticalDamageBonusAgainstTarget?:number
  freezeBuildupMoreAgainstTarget?:number
  electrocuteBuildupIncreasedAgainstTarget?:number
  appliedEffects?:AppliedEnemyMitigationEffect[]
  blockedEnemyEffects?:BlockedEnemyMitigationEffect[]
  fullyBrokenArmour?:boolean
  /** Increased hit damage taken from the confirmed Fully Broken Armour state. */
  fullyBrokenArmourEffect?:Partial<Record<DamageComponent['type'],number>>
  hitsToFullyBreakArmour?:number
  timeToFullyBreakArmourMs?:number
  temporalModelVersion?:string
  lifeState?:'low-life'|'not-low-life'|'unknown'
  heavyStunned?:boolean
}
export interface MitigatedDamageComponent extends DamageComponent { effectiveDefence:number; mitigationPercent:number }
export interface DamageCalculationStage { id:'base'|'conversion'|'gain-as-extra'|'increased-damage'|'support-more-damage'|'lucky-hit-expectation'|'multiple-damage-expectation'|'prepared-next-hit'|'maximum-channelled-hit'|'maximum-charged-hit'|'temporal-active-window'|'speed'|'critical-expectation'|'enemy-mitigation';label:string;components:DamageComponent[];value?:number }
export interface AppliedLuckyHitEffect { damageType:DamageComponent['type']|'all';chancePercent:number;sourceNodeId:string;sourceText:string;condition:'unconditional'|'enemy-low-life'|'enemy-heavy-stunned';evidence:'text-pattern-exact' }
export interface BlockedLuckyHitEffect { sourceNodeId:string;sourceText:string;condition:'enemy-low-life'|'enemy-heavy-stunned';reason:'enemy-state-not-confirmed';evidence:'text-pattern-exact' }
export interface AppliedQuantitativeEffect { source:'equipment'|'passive'|'ascendancy'|'support';sourceId:string;label:string;value:number }
export interface AppliedTemporalOffensiveEffect { sourceId:string;label:string;kind:'more-damage'|'increased-action-speed'|'gain-as-lightning'|'blocked';percent?:number;activationTimeMs?:number;durationMs?:number;status:'active-window'|'blocked';detail:string }
export interface AppliedNextSkillEffect { sourceId:string;sourceLabel:string;targetSkillId?:string;targetSkillLabel?:string;kind:'more-damage'|'gain-as-fire'|'gain-as-chaos'|'repeated-projectile-sequence'|'repeated-spell-sequence'|'charge-dependent-repeats'|'blocked';percent?:number;repeatCount?:number;sequenceDamageMultiplier?:number;status:'prepared-next-hit'|'prepared-next-sequence'|'blocked';detail:string }
export interface AppliedDamageOverTimeEffect { sourceRecordId:string;sourceLabel:string;damageType:DamageComponent['type'];kind:'native-damage-over-time';status:'single-application-window';damagePerSecond:number;damagePerSecondAfterMitigation?:number;durationMs:number;totalDamagePerApplication:number;totalDamagePerApplicationAfterMitigation?:number;stackCount:1;detail:string }
export interface BlockedDamageOverTimeEffect { sourceRecordId:string;sourceLabel:string;kind:'native-damage-over-time'|'ignite'|'poison'|'bleeding';status:'blocked';detail:string }
export interface AppliedDamagingAilmentEffect { sourceRecordId:string;sourceLabel:string;kind:'bleeding'|'poison'|'ignite';damageType:'physical'|'chaos'|'fire';status:'sustained-exact-input-chain';chancePercent:number;durationMs:number;maximumStacks:number;expectedActiveStacks:number;damagePerSecond:number;damagePerSecondAfterMitigation?:number;totalDamagePerApplication:number;effectMultiplier:number;rateMultiplier:number;chanceOnHitPercent?:number;chanceOnCriticalHitPercent?:number;ailmentCriticalChancePercent?:number;weightedSourceDamage?:number;detail:string }
export interface BlockedDamagingAilmentEffect { sourceRecordId:string;sourceLabel:string;kind:'ignite'|'poison'|'bleeding';status:'blocked';detail:string }
export interface ProjectileHitMechanic { kind:'projectiles-per-action'|'chain-count'|'pierce-count'|'maximum-hit-cap';value:number;sourceReference:string;evidence:'structured-exact';damageUse:'coverage-only'|'blocked-as-damage-multiplier';detail:string }
export interface TriggerRepeatSource { sourceSkillId:string;sourceSkillName:string;kind:'meta-trigger'|'inbuilt-trigger'|'repeat-interval';condition?:string;intervalMs?:number;targetSkillId?:string;targetSkillName?:string;socketedTargetCount?:number;triggersAllSocketedSkills?:boolean;energyRequirement?:number;baseEnergyPerEvent?:number;energyGenerationModifierPercent?:number;effectiveEnergyPerEventAtMonsterPowerOne?:number;eventsRequiredAtMonsterPowerOne?:number;eventRatePerSecond?:number;energyPerSecondAtMonsterPowerOne?:number;triggerRatePerSecondAtMonsterPowerOne?:number;secondsPerTriggerAtMonsterPowerOne?:number;monsterPower?:number;enemyAilmentThreshold?:number;criticalHitDamageBeforeMitigation?:number;ailmentThresholdRatio?:number;effectiveEnergyPerEvent?:number;energyPerSecond?:number;uncappedTriggerRatePerSecond?:number;targetBaseCooldownSeconds?:number;cooldownRecoveryPercent?:number;cooldownRecoverySourceReferences?:string[];effectiveTargetCooldownSeconds?:number;targetStoredUses?:number;emptyToFullRechargeSeconds?:number;cooldownRoundedToServerTick?:boolean;serverTickRoundedCooldownSeconds?:number;cooldownRateCapPerSecond?:number;triggerRatePerSecond?:number;secondsPerTrigger?:number;targetDamageMultiplier?:number;targetExpectedHitDamage?:number;targetExpectedHitDamageAfterMitigation?:number;fullyStoredUseDamage?:number;fullyStoredUseDamageAfterMitigation?:number;normalizedTriggeredDamagePerSecondAtMonsterPowerOne?:number;normalizedTriggeredDamagePerSecondAfterMitigationAtMonsterPowerOne?:number;triggeredDamagePerSecond?:number;triggeredDamagePerSecondAfterMitigation?:number;status:'blocked-missing-target'|'blocked-incompatible-target'|'blocked-missing-trigger-source'|'blocked-missing-interval'|'normalized-event-rate-only'|'normalized-target-damage-only'|'productive-target-damage'|'interval-only';evidence:'structured-exact';sourceReferences:string[];detail:string }
export interface MinionCompanionSource { sourceSkillId:string;sourceSkillName:string;kind:'minion'|'companion'|'offering';maximumCount?:number;durationMs?:number;damageBonusPercent?:number;speedBonusPercent?:number;reservationRequired:boolean;status:'blocked-missing-offence'|'blocked-missing-count-and-uptime'|'support-only';evidence:'structured-exact';sourceReferences:string[];detail:string }
export interface ResourceSpiritSource { sourceSkillId:string;sourceSkillName:string;weaponSet:'set-1'|'set-2'|'both';kind:'spirit-reservation'|'multiple-spirit-reservations'|'mana-interaction';reservationCount?:number;reservationAmount?:number;numericEffects:Array<{statId:string;value:number}>;status:'structured-exact-reservation'|'blocked-missing-reservation-amount-and-capacity'|'blocked-missing-cost-and-pool';evidence:'structured-exact';sourceReferences:string[];detail:string }
export interface EquipmentResourceContribution { resource:'life'|'mana'|'spirit'|'mana-regeneration'|'maximum-rage';value:number;sourceItemId:string;sourceModifierId:string;sourceStatId:string;status:'partial-contribution-only' }
export interface PassiveResourceEffect { source:'passive'|'ascendancy';sourceNodeId:string;sourceText:string;kind:'flat-mana'|'maximum-mana-increased'|'maximum-mana-reduced'|'maximum-mana-less'|'mana-regeneration-increased'|'mana-cost-increased'|'mana-cost-reduced'|'mana-cost-more'|'mana-cost-less'|'mana-cost-efficiency-increased'|'cost-efficiency-increased'|'mana-cost-doubled'|'flat-spirit'|'spirit-increased'|'spirit-reduced'|'spirit-less'|'reservation-efficiency-increased'|'reservation-efficiency-reduced'|'reservation-efficiency-less'|'flat-maximum-rage'|'maximum-rage-more'|'rage-effect-increased'|'rage-effect-reduced'|'rage-effect-more'|'rage-effect-less'|'rage-effect-override'|'rage-damage-to-spells'|'rage-speed-to-cast-speed'|'rage-loss-delay'|'rage-loss-slower'|'no-inherent-rage-loss'|'no-inherent-mana-regeneration'|'no-mana'|'no-spirit';value:number;evidence:'text-pattern-exact' }
export interface SpiritReservationEntry { setupId:string;skillId:string;skillName:string;weaponSet:'set-1'|'set-2'|'both';reservationAmount:number|null;status:'structured-exact'|'blocked-missing-exact-reservation';sourceReference?:string }
export interface SpiritCapacityState { weaponSet:'set-1'|'set-2';confirmedMinimumCapacity:number;levelDerivedQuestSpirit:number;planningCapacity:number;reservationEfficiencyPercent:number;reservedSpirit:number|null;effectiveReservedSpirit:number|null;remainingSpirit:number|null;status:'fits-confirmed-minimum'|'fits-level-derived-quest-estimate'|'exceeds-confirmed-minimum'|'exceeds-level-derived-quest-estimate'|'blocked-incomplete-reservation-chain'|'no-reservations';capacityEvidence:'confirmed-minimum'|'level-derived-quest-upper-bound';passiveResourceEffects:PassiveResourceEffect[] }
export interface SkillResourceCostValue { resource:'mana'|'mana-percent'|'rage';cadence:'per-use'|'per-second';baseAmount:number;supportAdjustedAmount:number;resourceAdjustedAmount:number;sourceResource:string }
export interface AppliedSupportCostMultiplier { supportId:string;supportName:string;multiplierPercent:number;sourceReference:string }
export interface IntrinsicSkillCostEffect { statId:string;kind:'cost-increased'|'archmage-max-mana-cost'|'rage-cost-suppressed-window';value:number;additionalBaseManaCost?:number;gainAsLightningPercent?:number;sourceSkillId?:string;suppressionDurationMs?:number;ongoingRageCostPerSecond?:number;evidence:'structured-exact';sourceReference:string }
export interface BlockedIntrinsicSkillCostEffect { statId:string;value:number;reason:'requires-runtime-spend-rate'|'requires-max-mana-and-target-skill-chain'|'requires-confirmed-maximum-mana'|'requires-channel-duration-state'|'requires-valid-normal-quality';sourceReference:string }
export interface SkillResourceCostChain { setupId:string;skillId:string;skillName:string;weaponSet:'set-1'|'set-2'|'both';selectedSupportIds:string[];semanticSupportCostHints:number[];baseCosts:SkillResourceCostValue[];supportCostMultipliers:AppliedSupportCostMultiplier[];intrinsicSkillCostEffects:IntrinsicSkillCostEffect[];blockedIntrinsicSkillCostEffects:BlockedIntrinsicSkillCostEffect[];passiveResourceEffects:PassiveResourceEffect[];combinedSupportMultiplier:number|null;combinedResourceCostMultiplier:number;combinedResourceCostEfficiency:number;effectiveManaPool:number|null;effectiveManaRegenerationPerSecond:number|null;confirmedFlatSpiritContribution:number;baseCostStatus:'structured-exact-level'|'structured-exact-zero-cost'|'blocked-missing-exact-base-cost';supportMultiplierStatus:'structured-exact-all-selected-supports'|'structured-exact-no-supports'|'blocked-missing-exact-support-cost-multipliers';poolStatus:'confirmed-minimum-pool'|'confirmed-pool-with-passive-effects'|'blocked-missing-character-level';sustainStatus:'sustainable-on-confirmed-minimum'|'burst-affordable-on-confirmed-minimum'|'unusable-confirmed-zero-mana'|'blocked-missing-action-frequency'|'blocked-missing-character-level'|'blocked-missing-exact-cost-chain';actionFrequencyPerSecond:number|null;manaDemandPerSecond:number|null;rageDemandPerSecond:number|null;rageGenerationPerHit:number;rageGenerationPerSecond:number|null;rageNetDemandPerSecond:number|null;rageSuppressionDurationMs:number|null;confirmedMaximumRage:number;confirmedRageEffectAtMaximum:number;rageDamageAppliesTo:'attack'|'spell';rageSpeedAppliesTo:'attack'|'cast';maximumStartRageDurationSeconds:number|null;inherentRageLossPerSecond:number;inherentRageLossDelaySeconds:number;noGainNoHitRageDurationSeconds:number|null;secondsToFullRage:number|null;fullRageCombatStatus:'maintainable-after-ramp'|'generation-only-maintains-current-level'|'depletes-despite-generation'|'blocked-no-confirmed-generation';rageSustainStatus:'no-rage-cost'|'sustainable-with-confirmed-generation'|'initially-suppressed-then-requires-rage-pool'|'requires-rage-pool'|'requires-hit-frequency-and-rage-pool'|'blocked-missing-exact-cost-chain' }
export interface ItemValueScopeEntry { itemId:string;slotId:string;quality?:number;valueBasis:'observed-final-values'|'pinned-base-values'|'no-numeric-item-values';qualityStatus:'included-in-observed-final-values'|'blocked-missing-exact-quality-formula'|'display-only-no-applicable-value'|'not-provided';localModifierStatus:'excluded-already-in-observed-final-values'|'applied-to-pinned-base-values'|'blocked-missing-base-values'|'not-present';localModifierIds:string[];globalModifierIds:string[];productive:boolean;detail:string }
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
  accuracyAdjustedDamagePerSecond?:number
  accuracyAdjustedExpectedCriticalDamagePerSecond?:number
  accuracyAdjustedDamagePerSecondAfterMitigation?:number
  attackHitChance?:{
    modelVersion:string
    status:'exact'|'blocked-missing-character-level'|'blocked-unknown-class'
    playerAccuracy?:number
    enemyLevel?:number
    enemyEvasion?:number
    hitChancePercent?:number
    baseAccuracyFromLevel?:number
    baseDexterity?:number
    additionalDexterity?:number
    accuracyFromDexterity?:number
    flatAccuracy?:number
    increasedAccuracyPercent?:number
    comparisonDistanceMetres:number
    sourceReferences:readonly string[]
    limitations:readonly string[]
  }
  expectedCriticalHitDamage?:number
  expectedCriticalHitDamagePerSecond?:number
  enemyProfile?:EnemyMitigationProfile
  mitigatedComponents?:MitigatedDamageComponent[]
  expectedDamageAfterMitigation?:number
  expectedDamagePerSecondAfterMitigation?:number
  conditionalHitEffects?:{
    modelVersion:string
    damageMultiplier:number
    effects:Array<{sourceRecordId:string;label:string;kind:'more-hit-damage-per-shock-effect';condition:'enemy-shocked';conditionValue:number;valuePerStep:number;stepSize:number;appliedSteps:number;totalMoreDamagePercent:number;damageMultiplier:number;evidence:'structured-exact';sourceReference:string;detail:string}>
    blockedEffects:Array<{sourceRecordId:string;label:string;kind:'more-hit-damage-per-shock-effect';reason:'enemy-shock-effect-not-confirmed';evidence:'structured-exact';sourceReference:string;detail:string}>
  }
  dualWieldAttackModel?:{
    modelVersion:'1.1.0'
    status:'not-applicable'|'single-weapon'|'applied'|'blocked-unresolved-weapon'|'blocked-not-two-one-hand-weapons'|'blocked-incompatible-weapon'
    finalDamagePercent:number|null
    finalAttackSpeedPercent:number|null
    damageMultiplier:number
    attackSpeedMultiplier:number
    hitSequenceMultiplier:number
    mainHandItemId?:string
    offHandItemId?:string
    evidence:'structured-exact'|'blocked'
    sourceReference:string
    detail:string
  }
  combinedDamagePerSecond?:number
  combinedDamagePerSecondAfterMitigation?:number
  rageDamageComparison?:{
    modelVersion:string
    status:'ramped-sustained-combat-comparison'|'full-confirmed-pool-window'|'blocked-no-confirmed-rage-gain'
    inherentMoreAttackDamagePerRagePercent:number
    comparedRage:number
    effectiveRageEffect:number
    appliesTo:'attack'|'spell'
    damageMultiplier:number
    expectedHitDamageAtComparedRage?:number
    expectedDamagePerSecondAtComparedRage?:number
    expectedDamagePerSecondAfterMitigationAtComparedRage?:number
    durationWithoutFurtherHitOrGainSeconds?:number
    appliedRageScaledEffects?:Array<{
      sourceId:string
      label:string
      kind:'increased'|'more'
      percent:number
      rageDivisor:number
    }>
    detail:string
  }
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
  damageOverTime?:{modelVersion:string;effects:AppliedDamageOverTimeEffect[];blockedEffects:BlockedDamageOverTimeEffect[];totalSingleApplicationDamagePerSecond?:number;totalSingleApplicationDamagePerSecondAfterMitigation?:number;limitations:string[]}
  skillEffectDurationSupportModel?:{
    modelVersion:string
    status:'not-applicable'|'applied'|'blocked-incompatible-skill'|'blocked-duplicate-family'
    durationMultiplier:number
    appliedSupports:Array<{supportId:string;supportName:string;family:string;finalDurationPercent:number;multiplier:number;sourceReference:string}>
    blockedSupportIds:string[]
    sourceReferences:string[]
    detail:string
  }
  maximumPhysicalDamageSupportModel?:{
    modelVersion:string
    status:'not-applicable'|'applied'|'blocked-incompatible-skill'|'blocked-missing-physical-damage'|'blocked-duplicate-family'
    components:DamageComponent[]
    appliedSupports:Array<{supportId:string;supportName:string;family:string;finalMaximumPhysicalDamagePercent:number;multiplier:number;sourceReference:string}>
    blockedSupportIds:string[]
    sourceReferences:string[]
    detail:string
  }
  areaDamageSupportModel?:{
    modelVersion:string
    status:'not-applicable'|'applied'|'blocked-incompatible-skill'|'blocked-duplicate-family'
    damageMultiplier:number
    areaOfEffectMultiplier:number
    appliedSupports:Array<{supportId:string;supportName:string;family:string;finalAreaDamagePercent:number;finalAreaOfEffectPercent:number;sourceReferences:string[]}>
    blockedSupportIds:string[]
    sourceReferences:string[]
    detail:string
  }
  spellCascadeSupportModel?:{
    modelVersion:string
    status:'not-applicable'|'applied'|'blocked-incompatible-skill'|'blocked-duplicate-family'
    damageMultiplier:number
    areaOfEffectMultiplier:number
    cascadesPerSide:number
    totalCascadeAreas:number
    singleTargetOverlapMultiplier:1
    appliedSupports:Array<{supportId:string;supportName:string;family:string;finalDamagePercent:number;finalAreaOfEffectPercent:number;cascadesPerSide:number;sourceReferences:string[]}>
    blockedSupportIds:string[]
    sourceReferences:string[]
    detail:string
  }
  chainSupportModel?:{
    modelVersion:string
    status:'not-applicable'|'applied'|'blocked-incompatible-skill'|'blocked-duplicate-family'
    hitDamageMultiplier:number
    additionalChains:number
    singleTargetHitMultiplier:1
    appliedSupports:Array<{supportId:string;supportName:string;family:string;finalHitDamagePercent:number;additionalChains:number;sourceReferences:string[]}>
    blockedSupportIds:string[]
    sourceReferences:string[]
    detail:string
  }
  damagingAilments?:{modelVersion:string;effects:AppliedDamagingAilmentEffect[];blockedEffects:BlockedDamagingAilmentEffect[];totalSustainedDamagePerSecond?:number;totalSustainedDamagePerSecondAfterMitigation?:number;limitations:string[]}
  projectileHitModel?:{modelVersion:string;isProjectileSkill:boolean;projectilesPerAction:number;singleTargetHitMultiplier:1;mappingPotentialTargetContacts:number;mechanics:ProjectileHitMechanic[];bossScenario:{hitMultiplier:1;status:'single-hit-only';detail:string};mappingScenario:{potentialTargetContacts:number;status:'coverage-estimate';detail:string};limitations:string[]}
  triggerRepeatModel?:{modelVersion:string;primarySkillTriggered:boolean;productive:boolean;triggeredDamagePerSecond?:number;triggeredDamagePerSecondAfterMitigation?:number;sources:TriggerRepeatSource[];limitations:string[]}
  minionCompanionModel?:{modelVersion:string;primarySkillMinion:boolean;productive:false;sources:MinionCompanionSource[];limitations:string[]}
  resourceSpiritModel?:{modelVersion:string;productive:boolean;manaPoolKnown:false;lifePoolKnown:false;spiritCapacityKnown:false;exactSkillCostsKnown:boolean;questSpiritEstimate?:{characterLevel:number;amount:number;eligibleRewards:Array<{act:number;area:string;info:string;amount:number;areaLevel:number}>;status:'level-derived-upper-bound-not-completion-proof'};confirmedMinimumPools?:{characterLevel:number;baseLife:number;baseMana:number;life:number;mana:number;manaRegenerationPerSecond:number;status:'confirmed-minimum-only'};sources:ResourceSpiritSource[];equipmentContributions:EquipmentResourceContribution[];skillCostChains:SkillResourceCostChain[];spiritReservations:SpiritReservationEntry[];spiritCapacityByWeaponSet:SpiritCapacityState[];semanticSupportCostHints:Array<{supportId:string;value:number}>;limitations:string[]}
    gemLevelQualityModel?:{modelVersion:string;requestedSkillLevel?:number;availableSkillLevel?:number;availableSkillLevels:number[];appliedSkillLevel?:number;requestedSkillQuality?:number;appliedSkillQuality?:number;appliedQualityStats:Array<{statId:string;perQuality:number;value:number}>;skillLevelStatus:'exact'|'default-reference-level'|'blocked-level-mismatch'|'blocked-missing-reference';skillQualityStatus:'exact'|'default-zero'|'blocked-invalid-range'|'blocked-missing-reference';supportLevelStatus:'exact-level-one-reference';supportQualityStatus:'blocked-not-transported-and-no-reference';productive:boolean;sourceReferences:string[];limitations:string[]}
  itemValueScopeModel?:{modelVersion:string;entries:ItemValueScopeEntry[];blockedItemIds:string[];observedFinalValueItemIds:string[];localModifiersExcludedFromGlobalScaling:number;limitations:string[]}
  characterDefenceModel?:CharacterDefenceModel
  characterSurvivabilityModel?:CharacterSurvivabilityModel
  chargeState?:{modelVersion:string;productive:boolean;states:AppliedChargeState[];consumptions:AppliedChargeConsumption[];buffScenarios:Array<{sourceId:string;label:string;chargeType:'power'|'frenzy'|'endurance';appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';requiredCharges:number;minimumAddedDamagePerCharge:number;maximumAddedDamagePerCharge:number;damageType:'lightning';durationPerChargeMs:number;status:'per-charge-scenario-known-current-count-unknown';detail:string}>;regulationScenarios:Array<{sourceId:string;label:string;appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';frenzySkillSpeedPercent:number;powerFinalCriticalChancePercent:number;enduranceFinalDefencePercent:number;consumptionIntervalMs:number;currentChargeState:'unknown';status:'charge-effects-known-current-state-unknown';detail:string}>}
  sealState?:{modelVersion:string;productive:false;skills:Array<{skillId:string;label:string;maximumSeals:number;repeatsPerBrokenSeal:number;sealGainIntervalMs:number;fullPreparationTimeMs:number;appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';status:'capacity-known-current-state-unknown';detail:string}>}
  projectileAccumulationState?:{modelVersion:string;productive:false;skills:Array<{skillId:string;label:string;maximumProjectiles:number;releaseIntervalMs:number;effectDurationMs:number;finalDamagePerReleasedProjectilePercent:number;maximumReleaseWindowMs:number;appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';status:'capacity-known-current-state-unknown';detail:string}>}
  channelledStageState?:{modelVersion:string;productive:false;skills:Array<{skillId:string;label:string;appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';maximumStages:number;finalDamagePerStagePercent:number;fullStageMoreDamagePercent:number;fullStageDamageMultiplier:number;minimumChannelTimeMs?:number;status:'maximum-scenario-known-current-state-unknown';detail:string}>}
  maximumChannelledHitDamage?:number
  maximumChannelledHitDamageAfterMitigation?:number
  chargedSkillState?:{modelVersion:string;productive:false;skills:Array<{skillId:string;label:string;appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';maximumStages:number;additionalStages:number;fullStageDamageMultiplier?:number;gainAsFirePerStagePercent?:number;fullStageGainAsFirePercent?:number;additionalProjectilesPerAdditionalStage?:number;fullStageAdditionalProjectiles?:number;status:'maximum-scenario-known-current-state-unknown';detail:string}>}
  persistentStageState?:{modelVersion:string;productive:false;skills:Array<{skillId:string;label:string;kind:'stationary-retaliation'|'mana-built-spell-buff'|'monster-power-warcry'|'rage-extended-gain-as-cold';appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';maximumStages:number;stageGainIntervalMs?:number;fullPreparationTimeMs?:number;minimumAddedColdDamagePerStage?:number;maximumAddedColdDamagePerStage?:number;fullStageMinimumAddedColdDamage?:number;fullStageMaximumAddedColdDamage?:number;finalSpellDamagePerStagePercent?:number;fullStageMoreSpellDamagePercent?:number;fullStageSpellDamageMultiplier?:number;manaPercentSpendPerUpgrade?:number;effectDurationMs?:number;monsterPowerStep?:number;monsterPowerCap?:number;minimumColdDamagePerPowerStep?:number;maximumColdDamagePerPowerStep?:number;empoweredAttackMinimumColdDamagePerPowerStep?:number;empoweredAttackMaximumColdDamagePerPowerStep?:number;fullPowerMinimumColdDamage?:number;fullPowerMaximumColdDamage?:number;fullPowerEmpoweredAttackMinimumColdDamage?:number;fullPowerEmpoweredAttackMaximumColdDamage?:number;gainAsColdPercent?:number;durationExtensionPerRageMs?:number;status:'maximum-scenario-known-current-state-unknown';detail:string}>}
  elementalState?:{modelVersion:string;productive:false;scenarios:Array<{sourceId:string;label:string;kind:'rotating-element'|'three-element-resonance';appliedSkillLevel:number;skillLevelStatus:'exact'|'default-reference-level';finalDamagePercent?:number;effectDurationMs?:number;resonanceGrantedPerHit?:number;finalDamagePercentPer50Resonance?:number;resonanceDecayDelayMs?:number;resonanceLossPerSecond?:number;resonanceLossPerHit?:number;activeElement:null;currentResonance:null;status:'scenario-known-current-state-unknown';detail:string}>}
  maximumChargedHitDamage?:number
  maximumChargedHitDamageAfterMitigation?:number
    confirmedConversions?:Array<{from:DamageComponent['type'];to:DamageComponent['type'];percent:number;source:'skill'|'equipment'|'passive'|'ascendancy';sourceId:string}>
  confirmedGainAsExtra?:Array<{from:DamageComponent['type']|'all'|'elemental';to:DamageComponent['type'];percent:number;source:'equipment'|'passive'|'ascendancy'|'skill';sourceId:string}>
  criticalChance?:{base:number;increasedPercent:number;effective:number}
  criticalDamageBonus?:number
  criticalExpectationMultiplier?:number
  multipleDamageEffect?:{
    modelVersion:'1.0.0'
    doubleDamageChancePercent:number
    tripleDamageChancePercent:number
    effectiveDoubleDamageChancePercent:number
    expectedDamageMultiplier:number
    sources:Array<{
      sourceNodeId:string
      sourceText:string
      kind:'double'|'triple'
      rawChancePercent:number
      effectiveChanceContributionPercent:number
      condition:'unconditional'|'critical-hit'
      evidence:'text-pattern-exact'
    }>
    limitations:string[]
  }
  luckyHitEffects?:{modelVersion:'2.0.0';expectedHitDamage:number;effects:AppliedLuckyHitEffect[];blockedEffects:BlockedLuckyHitEffect[]}
  included:string[]
  excluded:string[]
  warnings:string[]
  sourceCommit:string
  calculatorVersion:string
}
import type { CharacterDefenceModel } from './character-defence-model'
import type { CharacterSurvivabilityModel } from './character-survivability-model'
