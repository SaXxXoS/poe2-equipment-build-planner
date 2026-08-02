import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { EnemyMitigationProfile } from './types'

export const EXECUTE_SUPPORT_MODEL_VERSION='1.0.0'
type NumericSkill=(typeof reference.skills)[number]
export interface ExecuteSupportModel { modelVersion:string;status:'not-applicable'|'applied'|'inactive-enemy-not-low-life'|'blocked-unknown-enemy-life-state'|'blocked-incompatible-skill'|'blocked-duplicate-family';damageMultiplier:number;appliedSupports:Array<{supportId:string;supportName:string;family:string;enemyLowLifeMoreDamagePercent:number;sourceReference:string}>;blockedSupportIds:string[];blockedPlayerLowLifeEffect:boolean;sourceReferences:string[];detail:string }
const recordsByName=new Map(reference.supports.map(value=>[value.name.toLocaleLowerCase('en'),value]))
const enemyLowLifeStat='support_executioner_damage_vs_enemies_on_low_life_+%_final'
const playerLowLifeStat='support_executioner_damage_+%_final_while_on_low_life'
const ignoredOperators=new Set(['AND','NOT'])

export function resolveExecuteSupport(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[];enemyProfile?:EnemyMitigationProfile}):ExecuteSupportModel {
  const selected=new Set(input.setup?.supportGemIds??[])
  const candidates=input.supports.filter(value=>selected.has(value.id)).flatMap(definition=>{
    const numeric=recordsByName.get((definition.nameEn??'').toLocaleLowerCase('en'))
    const stats=numeric?.numericStats as Record<string,number>|undefined
    const percent=Number(stats?.[enemyLowLifeStat])
    return numeric?.gemFamily.includes('Execute')&&Number.isFinite(percent)?[{definition,numeric,percent,playerLowLifePercent:Number(stats?.[playerLowLifeStat])}]:[]
  })
  const empty=(status:ExecuteSupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[],blockedPlayerLowLifeEffect=false):ExecuteSupportModel=>({modelVersion:EXECUTE_SUPPORT_MODEL_VERSION,status,damageMultiplier:1,appliedSupports:[],blockedSupportIds,blockedPlayerLowLifeEffect,sourceReferences,detail})
  if(!candidates.length)return empty('not-applicable','Keine Execute-Unterstützung ist ausgewählt.')
  const sourceReferences=candidates.flatMap(value=>[`support:${value.numeric.sourceRecordId}:${enemyLowLifeStat}`,...(Number.isFinite(value.playerLowLifePercent)?[`support:${value.numeric.sourceRecordId}:${playerLowLifeStat}`]:[])])
  const ids=candidates.map(value=>value.definition.id)
  if(candidates.length!==1)return empty('blocked-duplicate-family','Mehrere Ränge derselben Execute-Supportfamilie sind ausgewählt; die Wirkung wird fail-closed blockiert.',ids,sourceReferences)
  const candidate=candidates[0]
  const skillTypes=new Set(input.skill.skillTypes)
  const required=candidate.numeric.requireSkillTypes.filter(value=>!ignoredOperators.has(value))
  const excluded=candidate.numeric.excludeSkillTypes.filter(value=>!ignoredOperators.has(value))
  if(!required.some(value=>skillTypes.has(value))||excluded.some(value=>skillTypes.has(value)))return empty('blocked-incompatible-skill','Execute ist laut gepinnter Definition mit dieser Fertigkeit nicht kompatibel.',ids,sourceReferences)
  const blocksPlayerLowLife=Number.isFinite(candidate.playerLowLifePercent)
  if(input.enemyProfile?.lifeState==='not-low-life'||input.enemyProfile?.lifeState==='full-life')return empty('inactive-enemy-not-low-life','Das Ziel befindet sich bestätigt nicht auf niedrigem Leben; der Execute-Bonus ist inaktiv.',[],sourceReferences,blocksPlayerLowLife)
  if(input.enemyProfile?.lifeState!=='low-life')return empty('blocked-unknown-enemy-life-state','Der Lebenszustand des Ziels ist unbekannt; der bedingte Execute-Bonus wird nicht angenommen.',ids,sourceReferences,blocksPlayerLowLife)
  return {modelVersion:EXECUTE_SUPPORT_MODEL_VERSION,status:'applied',damageMultiplier:1+candidate.percent/100,appliedSupports:[{supportId:candidate.definition.id,supportName:candidate.definition.displayNameDe??candidate.definition.nameEn??candidate.numeric.name,family:'Execute',enemyLowLifeMoreDamagePercent:candidate.percent,sourceReference:`support:${candidate.numeric.sourceRecordId}:${enemyLowLifeStat}`}],blockedSupportIds:[],blockedPlayerLowLifeEffect:blocksPlayerLowLife,sourceReferences,detail:`${candidate.percent}% mehr Trefferschaden gegen das bestätigt auf niedrigem Leben befindliche Ziel werden angewandt.${blocksPlayerLowLife?' Der separate Bonus bei niedrigem Spielerleben bleibt ohne belegten Spielerzustand blockiert.':''}`}
}
