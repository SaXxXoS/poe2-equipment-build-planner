import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const CONSIDERED_CASTING_SUPPORT_MODEL_VERSION = '1.0.0'
type NumericSkill = (typeof reference.skills)[number]

export interface ConsideredCastingSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  damagePercent: number
  damageMultiplier: number
  castSpeedPercent: number
  castSpeedMultiplier: number
  appliedSupports: Array<{supportId:string;supportName:string;family:string;damagePercent:number;castSpeedPercent:number;sourceReferences:string[]}>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_slow_cast_spell_damage_+%_final'
const castSpeedStat = 'support_slow_cast_cast_speed_+%_final'
const excludedSkillTypes = new Set(['UsedByProxy', 'Triggered', 'Persistent', 'FixedCastTime', 'HasReservation', 'ReservationBecomesCost'])
const round = (value:number) => Number(value.toFixed(8))

export function resolveConsideredCastingSupport(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[]}):ConsideredCastingSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const damagePercent = Number((numeric?.numericStats as Record<string,number>|undefined)?.[damageStat])
    const castSpeedPercent = Number((numeric?.numericStats as Record<string,number>|undefined)?.[castSpeedStat])
    return numeric?.sourceRecordId === 'SupportConsideredCastingPlayer' && Number.isFinite(damagePercent) && Number.isFinite(castSpeedPercent)
      ? [{definition,numeric,damagePercent,castSpeedPercent}] : []
  })
  const empty=(status:ConsideredCastingSupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[]):ConsideredCastingSupportModel=>({
    modelVersion:CONSIDERED_CASTING_SUPPORT_MODEL_VERSION,status,damagePercent:0,damageMultiplier:1,castSpeedPercent:0,castSpeedMultiplier:1,appliedSupports:[],blockedSupportIds,sourceReferences,detail,
  })
  if(!candidates.length)return empty('not-applicable','Bedachtes Zaubern ist nicht ausgewählt oder besitzt keine vollständige strukturierte Wirkung.')
  const sourceReferences=candidates.flatMap(value=>[`support:${value.numeric.sourceRecordId}:${damageStat}`,`support:${value.numeric.sourceRecordId}:${castSpeedStat}`])
  const compatible=input.skill.skillTypes.includes('Spell')&&input.skill.skillTypes.includes('Damage')&&!input.skill.skillTypes.some(value=>excludedSkillTypes.has(value))
  if(!compatible)return empty('blocked-incompatible-skill','Bedachtes Zaubern unterstützt nur selbst gewirkte, treffende Zauber ohne Reservierung, feste Wirkzeit oder Auslösung. Es wird kein Effekt angewandt.',candidates.map(value=>value.definition.id),sourceReferences)
  const families=candidates.map(value=>value.numeric.gemFamily[0]??value.definition.id)
  if(new Set(families).size!==families.length)return empty('blocked-duplicate-family','Mehrere Gemmen derselben Supportfamilie sind ausgewählt. Die gesamte Wirkung wird fail-closed blockiert.',candidates.map(value=>value.definition.id),sourceReferences)
  const appliedSupports=candidates.map(({definition,numeric,damagePercent,castSpeedPercent})=>({supportId:definition.id,supportName:definition.displayNameDe??definition.nameEn??numeric.name,family:numeric.gemFamily[0]??definition.id,damagePercent,castSpeedPercent,sourceReferences:[`support:${numeric.sourceRecordId}:${damageStat}`,`support:${numeric.sourceRecordId}:${castSpeedStat}`]}))
  const damageMultiplier=round(appliedSupports.reduce((value,support)=>value*(1+support.damagePercent/100),1))
  const castSpeedMultiplier=round(appliedSupports.reduce((value,support)=>value*(1+support.castSpeedPercent/100),1))
  return {modelVersion:CONSIDERED_CASTING_SUPPORT_MODEL_VERSION,status:'applied',damagePercent:round((damageMultiplier-1)*100),damageMultiplier,castSpeedPercent:round((castSpeedMultiplier-1)*100),castSpeedMultiplier,appliedSupports,blockedSupportIds:[],sourceReferences,detail:'35% mehr Zauberschaden und 15% weniger Wirkgeschwindigkeit werden aus der gepinnten PoB2-Supportdefinition exakt angewandt.'}
}

export const applyConsideredCastingDamageMultiplier=(components:DamageComponent[],model:ConsideredCastingSupportModel)=>model.status==='applied'
  ?components.map(value=>({...value,minimum:round(value.minimum*model.damageMultiplier),maximum:round(value.maximum*model.damageMultiplier)}))
  :components.map(value=>({...value}))
