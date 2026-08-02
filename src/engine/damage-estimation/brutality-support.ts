import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const BRUTALITY_SUPPORT_MODEL_VERSION = '1.0.0'
type NumericSkill = (typeof reference.skills)[number]

export interface BrutalitySupportModel {
  modelVersion:string
  status:'not-applicable'|'applied'|'blocked-incompatible-skill'|'blocked-duplicate-family'
  physicalDamagePercent:number
  physicalDamageMultiplier:number
  physicalDamageReductionIgnoreChancePercent:number
  appliedSupports:Array<{supportId:string;supportName:string;family:string;physicalDamagePercent:number;physicalDamageReductionIgnoreChancePercent:number;sourceReferences:string[]}>
  blockedSupportIds:string[]
  sourceReferences:string[]
  detail:string
}

const supportedRecordIds=new Set(['SupportBrutalityPlayer','SupportBrutalityPlayerTwo','SupportBrutalityPlayerThree'])
const recordsByName=new Map(reference.supports.map(value=>[value.name.toLocaleLowerCase('en'),value]))
const damageStat='support_brutality_physical_damage_+%_final'
const ignoreStat='hits_ignore_enemy_monster_physical_damage_reduction_%_chance'
const round=(value:number)=>Number(value.toFixed(8))

export function resolveBrutalitySupport(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[]}):BrutalitySupportModel {
  const selected=new Set(input.setup?.supportGemIds??[])
  const candidates=input.supports.filter(value=>selected.has(value.id)).flatMap(definition=>{
    const numeric=recordsByName.get((definition.nameEn??'').toLocaleLowerCase('en'))
    const stats=numeric?.numericStats as Record<string,number>|undefined
    const physicalDamagePercent=Number(stats?.[damageStat])
    const physicalDamageReductionIgnoreChancePercent=Number(stats?.[ignoreStat]??0)
    return numeric&&supportedRecordIds.has(numeric.sourceRecordId)&&Number.isFinite(physicalDamagePercent)&&Number.isFinite(physicalDamageReductionIgnoreChancePercent)
      ?[{definition,numeric,physicalDamagePercent,physicalDamageReductionIgnoreChancePercent}]:[]
  })
  const empty=(status:BrutalitySupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[]):BrutalitySupportModel=>({
    modelVersion:BRUTALITY_SUPPORT_MODEL_VERSION,status,physicalDamagePercent:0,physicalDamageMultiplier:1,physicalDamageReductionIgnoreChancePercent:0,appliedSupports:[],blockedSupportIds,sourceReferences,detail,
  })
  if(!candidates.length)return empty('not-applicable','Brutality I–III ist nicht ausgewählt oder besitzt keine vollständige strukturierte Wirkung.')
  const sourceReferences=candidates.flatMap(value=>[
    `support:${value.numeric.sourceRecordId}:${damageStat}`,
    ...(value.physicalDamageReductionIgnoreChancePercent?[`support:${value.numeric.sourceRecordId}:${ignoreStat}`]:[]),
  ])
  const required=new Set(candidates.flatMap(value=>value.numeric.requireSkillTypes))
  if(!input.skill.skillTypes.some(value=>required.has(value)))return empty('blocked-incompatible-skill','Brutality unterstützt laut gepinnter Definition nur passende Schadens-, Angriffs-, Schaden-über-Zeit- oder Armbrustmunition-Fertigkeiten. Es wird kein Effekt angewandt.',candidates.map(value=>value.definition.id),sourceReferences)
  const families=candidates.map(value=>value.numeric.gemFamily[0]??value.definition.id)
  if(new Set(families).size!==families.length)return empty('blocked-duplicate-family','Mehrere Gemmen derselben Brutality-Supportfamilie sind ausgewählt. Die gesamte Wirkung wird fail-closed blockiert.',candidates.map(value=>value.definition.id),sourceReferences)
  const appliedSupports=candidates.map(({definition,numeric,physicalDamagePercent,physicalDamageReductionIgnoreChancePercent})=>({
    supportId:definition.id,supportName:definition.displayNameDe??definition.nameEn??numeric.name,family:numeric.gemFamily[0]??definition.id,physicalDamagePercent,physicalDamageReductionIgnoreChancePercent,
    sourceReferences:[`support:${numeric.sourceRecordId}:${damageStat}`,...(physicalDamageReductionIgnoreChancePercent?[`support:${numeric.sourceRecordId}:${ignoreStat}`]:[])],
  }))
  const physicalDamageMultiplier=round(appliedSupports.reduce((value,support)=>value*(1+support.physicalDamagePercent/100),1))
  const physicalDamageReductionIgnoreChancePercent=round(appliedSupports.reduce((value,support)=>1-(1-value)*(1-support.physicalDamageReductionIgnoreChancePercent/100),0)*100)
  return{
    modelVersion:BRUTALITY_SUPPORT_MODEL_VERSION,status:'applied',physicalDamagePercent:round((physicalDamageMultiplier-1)*100),physicalDamageMultiplier,physicalDamageReductionIgnoreChancePercent,
    appliedSupports,blockedSupportIds:[],sourceReferences,
    detail:physicalDamageReductionIgnoreChancePercent
      ?`${round((physicalDamageMultiplier-1)*100)}% mehr physischer Schaden; bei Treffern werden ${physicalDamageReductionIgnoreChancePercent}% Chance auf ignorierte gegnerische physische Schadensreduktion als Erwartungswert berücksichtigt.`
      :`${round((physicalDamageMultiplier-1)*100)}% mehr physischer Schaden werden aus der gepinnten Supportdefinition angewandt.`,
  }
}

export const applyBrutalityPhysicalDamageMultiplier=(components:DamageComponent[],model:BrutalitySupportModel)=>model.status==='applied'
  ?components.map(value=>value.type==='physical'?{...value,minimum:round(value.minimum*model.physicalDamageMultiplier),maximum:round(value.maximum*model.physicalDamageMultiplier)}:{...value})
  :components.map(value=>({...value}))
