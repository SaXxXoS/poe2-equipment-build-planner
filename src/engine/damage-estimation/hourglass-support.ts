import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const HOURGLASS_SUPPORT_MODEL_VERSION = '1.0.0'
type NumericSkill = (typeof reference.skills)[number]

export interface HourglassSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  damagePercent: number
  damageMultiplier: number
  cooldownOverrideSeconds?: number
  appliedSupports: Array<{supportId:string;supportName:string;family:string;damagePercent:number;cooldownOverrideSeconds:number;sourceReferences:string[]}>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_hourglass_damage_+%_final'
const cooldownStat = 'support_hourglass_display_cooldown_time_ms'
const ignoredOperators = new Set(['AND', 'NOT'])
const round = (value:number) => Number(value.toFixed(8))

export function resolveHourglassSupport(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[]}):HourglassSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string,number>|undefined
    const damagePercent = Number(stats?.[damageStat])
    const cooldownMs = Number(stats?.[cooldownStat])
    return numeric?.sourceRecordId === 'SupportHourglassPlayer' && Number.isFinite(damagePercent) && Number.isFinite(cooldownMs) && cooldownMs > 0
      ? [{definition,numeric,damagePercent,cooldownOverrideSeconds:cooldownMs/1000}] : []
  })
  const empty=(status:HourglassSupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[]):HourglassSupportModel=>({
    modelVersion:HOURGLASS_SUPPORT_MODEL_VERSION,status,damagePercent:0,damageMultiplier:1,appliedSupports:[],blockedSupportIds,sourceReferences,detail,
  })
  if(!candidates.length)return empty('not-applicable','Sanduhr ist nicht ausgewählt oder besitzt keine vollständige strukturierte Wirkung.')
  const sourceReferences=candidates.flatMap(value=>[`support:${value.numeric.sourceRecordId}:${damageStat}`,`support:${value.numeric.sourceRecordId}:${cooldownStat}`])
  const skillTypes=new Set(input.skill.skillTypes)
  const record=candidates[0].numeric
  const requiredAlternatives=record.requireSkillTypes.filter(value=>!ignoredOperators.has(value))
  const excluded=record.excludeSkillTypes.filter(value=>!ignoredOperators.has(value))
  const compatible=requiredAlternatives.some(value=>skillTypes.has(value))&&excluded.every(value=>!skillTypes.has(value))
  if(!compatible)return empty('blocked-incompatible-skill','Sanduhr unterstützt nur die in der gepinnten PoB2-Definition zugelassenen schädigenden Fertigkeiten ohne bestehenden Cooldown, Auslösung, Proxy oder persistente Wirkung.',candidates.map(value=>value.definition.id),sourceReferences)
  const families=candidates.map(value=>value.numeric.gemFamily[0]??value.definition.id)
  if(new Set(families).size!==families.length)return empty('blocked-duplicate-family','Mehrere Gemmen derselben Supportfamilie sind ausgewählt. Die gesamte Sanduhr-Wirkung wird fail-closed blockiert.',candidates.map(value=>value.definition.id),sourceReferences)
  const appliedSupports=candidates.map(({definition,numeric,damagePercent,cooldownOverrideSeconds})=>({supportId:definition.id,supportName:definition.displayNameDe??definition.nameEn??numeric.name,family:numeric.gemFamily[0]??definition.id,damagePercent,cooldownOverrideSeconds,sourceReferences:[`support:${numeric.sourceRecordId}:${damageStat}`,`support:${numeric.sourceRecordId}:${cooldownStat}`]}))
  const damageMultiplier=round(appliedSupports.reduce((value,support)=>value*(1+support.damagePercent/100),1))
  const cooldownOverrideSeconds=appliedSupports[0].cooldownOverrideSeconds
  return {modelVersion:HOURGLASS_SUPPORT_MODEL_VERSION,status:'applied',damagePercent:round((damageMultiplier-1)*100),damageMultiplier,cooldownOverrideSeconds,appliedSupports,blockedSupportIds:[],sourceReferences,detail:`${round((damageMultiplier-1)*100)}% mehr Schaden und ein Cooldown von ${cooldownOverrideSeconds} Sekunden werden gemeinsam aus der gepinnten PoB2-Supportdefinition angewandt.`}
}

export const applyHourglassDamageMultiplier=(components:DamageComponent[],model:HourglassSupportModel)=>model.status==='applied'
  ?components.map(value=>({...value,minimum:round(value.minimum*model.damageMultiplier),maximum:round(value.maximum*model.damageMultiplier)}))
  :components.map(value=>({...value}))
