import type { EnemyMitigationProfile } from './types'

export const CONDITIONAL_HIT_EFFECT_MODEL_VERSION='1.0.0'

export interface AppliedConditionalHitEffect {
  sourceRecordId:string
  label:string
  kind:'more-hit-damage-per-shock-effect'
  condition:'enemy-shocked'
  conditionValue:number
  valuePerStep:number
  stepSize:number
  appliedSteps:number
  totalMoreDamagePercent:number
  damageMultiplier:number
  evidence:'structured-exact'
  sourceReference:string
  detail:string
}

export interface ConditionalHitEffectResult {
  modelVersion:string
  damageMultiplier:number
  effects:AppliedConditionalHitEffect[]
  blockedEffects:Array<{
    sourceRecordId:string
    label:string
    kind:'more-hit-damage-per-shock-effect'
    reason:'enemy-shock-effect-not-confirmed'
    evidence:'structured-exact'
    sourceReference:string
    detail:string
  }>
}

export function resolveConditionalHitEffects(input:{
  sourceRecordId:string
  skillName:string
  numericStats:Record<string,number>
  enemyProfile?:EnemyMitigationProfile
}):ConditionalHitEffectResult {
  const statId='lightning_conduit_damage_+%_final_per_5%_increased_damage_taken_from_shock'
  const valuePerStep=Number(input.numericStats[statId])
  if(input.sourceRecordId!=='LightningConduitPlayer'||!Number.isFinite(valuePerStep)||valuePerStep===0){
    return{modelVersion:CONDITIONAL_HIT_EFFECT_MODEL_VERSION,damageMultiplier:1,effects:[],blockedEffects:[]}
  }
  const shockEffect=Math.max(0,...(input.enemyProfile?.appliedEffects??[])
    .filter(effect=>effect.effectGroup==='shock'&&effect.selectionStatus!=='superseded-by-stronger')
    .map(effect=>Number(effect.effectiveValue??effect.value))
    .filter(Number.isFinite))
  const sourceReference=`${CONDITIONAL_HIT_EFFECT_MODEL_VERSION}: ${input.sourceRecordId}.${statId}`
  if(shockEffect<=0){
    return{
      modelVersion:CONDITIONAL_HIT_EFFECT_MODEL_VERSION,
      damageMultiplier:1,
      effects:[],
      blockedEffects:[{
        sourceRecordId:input.sourceRecordId,label:input.skillName,
        kind:'more-hit-damage-per-shock-effect',reason:'enemy-shock-effect-not-confirmed',
        evidence:'structured-exact',sourceReference,
        detail:'Der strukturierte Bonus von Lightning Conduit bleibt ohne eine durch die aktive Fertigkeitskette belegte Schockwirkung auf dem Ziel inaktiv.',
      }],
    }
  }
  const stepSize=5
  const appliedSteps=Math.floor(shockEffect/stepSize)
  const totalMoreDamagePercent=appliedSteps*valuePerStep
  const damageMultiplier=1+totalMoreDamagePercent/100
  return{
    modelVersion:CONDITIONAL_HIT_EFFECT_MODEL_VERSION,
    damageMultiplier,
    effects:[{
      sourceRecordId:input.sourceRecordId,label:input.skillName,
      kind:'more-hit-damage-per-shock-effect',condition:'enemy-shocked',conditionValue:shockEffect,
      valuePerStep,stepSize,appliedSteps,totalMoreDamagePercent,damageMultiplier,
      evidence:'structured-exact',sourceReference,
      detail:`${shockEffect}% belegte Schockwirkung ergeben ${appliedSteps} volle 5%-Schritte und damit ${totalMoreDamagePercent}% mehr Trefferschaden.`,
    }],
    blockedEffects:[],
  }
}
