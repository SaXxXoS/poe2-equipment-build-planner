import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent, EnemyMitigationProfile } from './types'

export const BLOODLUST_SUPPORT_MODEL_VERSION = '1.0.0'
type NumericSkill = (typeof reference.skills)[number]

export interface BloodlustSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'inactive-enemy-not-bleeding' | 'blocked-unknown-enemy-bleeding-state' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  physicalDamageMultiplier: number
  appliedSupports: Array<{supportId:string;supportName:string;family:string;enemyBleedingMoreMeleePhysicalDamagePercent:number;sourceReference:string}>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_bloodlust_melee_physical_damage_+%_final_vs_bleeding_enemies'
const round = (value: number) => Number(value.toFixed(8))

export function resolveBloodlustSupport(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[];enemyProfile?:EnemyMitigationProfile}):BloodlustSupportModel {
  const selected=new Set(input.setup?.supportGemIds??[])
  const candidates=input.supports.filter(value=>selected.has(value.id)).flatMap(definition=>{
    const numeric=recordsByName.get((definition.nameEn??'').toLocaleLowerCase('en'))
    const percent=Number((numeric?.numericStats as Record<string,number>|undefined)?.[damageStat])
    return numeric?.sourceRecordId==='SupportBloodlustPlayer'&&Number.isFinite(percent)?[{definition,numeric,percent}]:[]
  })
  const empty=(status:BloodlustSupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[]):BloodlustSupportModel=>({modelVersion:BLOODLUST_SUPPORT_MODEL_VERSION,status,physicalDamageMultiplier:1,appliedSupports:[],blockedSupportIds,sourceReferences,detail})
  if(!candidates.length)return empty('not-applicable','Bloodlust ist nicht ausgewählt.')
  const sourceReferences=candidates.map(value=>`support:${value.numeric.sourceRecordId}:${damageStat}`)
  const ids=candidates.map(value=>value.definition.id)
  if(candidates.length!==1)return empty('blocked-duplicate-family','Mehrere Bloodlust-Supports derselben Familie sind ausgewählt; die Wirkung wird fail-closed blockiert.',ids,sourceReferences)
  const candidate=candidates[0]
  if(!input.skill.skillTypes.includes('Melee'))return empty('blocked-incompatible-skill','Bloodlust unterstützt laut gepinnter Definition ausschließlich Nahkampffertigkeiten.',ids,sourceReferences)
  if(input.enemyProfile?.ailmentStates?.bleeding===false)return empty('inactive-enemy-not-bleeding','Das Ziel ist bestätigt nicht blutend; der Bloodlust-Bonus ist inaktiv.',[],sourceReferences)
  if(input.enemyProfile?.ailmentStates?.bleeding!==true)return empty('blocked-unknown-enemy-bleeding-state','Ob das Ziel blutet, ist unbekannt; der bedingte Bloodlust-Bonus wird nicht angenommen.',ids,sourceReferences)
  return {modelVersion:BLOODLUST_SUPPORT_MODEL_VERSION,status:'applied',physicalDamageMultiplier:round(1+candidate.percent/100),appliedSupports:[{supportId:candidate.definition.id,supportName:candidate.definition.displayNameDe??candidate.definition.nameEn??candidate.numeric.name,family:candidate.numeric.gemFamily[0]??'Bloodlust',enemyBleedingMoreMeleePhysicalDamagePercent:candidate.percent,sourceReference:sourceReferences[0]}],blockedSupportIds:[],sourceReferences,detail:`${candidate.percent}% mehr physischer Nahkampfschaden gegen das bestätigt blutende Ziel werden angewandt.`}
}

export const applyBloodlustPhysicalDamageMultiplier=(components:DamageComponent[],model:BloodlustSupportModel)=>model.status==='applied'
  ?components.map(value=>value.type==='physical'?{...value,minimum:round(value.minimum*model.physicalDamageMultiplier),maximum:round(value.maximum*model.physicalDamageMultiplier)}:{...value})
  :components.map(value=>({...value}))
