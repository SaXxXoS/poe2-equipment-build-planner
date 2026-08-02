import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const HEAVY_SWING_SUPPORT_MODEL_VERSION = '1.0.0'
type NumericSkill = (typeof reference.skills)[number]

export interface HeavySwingSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  physicalDamagePercent: number
  physicalDamageMultiplier: number
  attackSpeedPercent: number
  attackSpeedMultiplier: number
  appliedSupports: Array<{supportId:string;supportName:string;family:string;physicalDamagePercent:number;attackSpeedPercent:number;sourceReferences:string[]}>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const damageStat = 'support_melee_physical_damage_+%_final'
const speedStat = 'support_melee_physical_damage_attack_speed_+%_final'
const round = (value:number) => Number(value.toFixed(8))

export function resolveHeavySwingSupport(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[]}):HeavySwingSupportModel {
  const selected = new Set(input.setup?.supportGemIds ?? [])
  const candidates = input.supports.filter(value => selected.has(value.id)).flatMap(definition => {
    const numeric = recordsByName.get((definition.nameEn ?? '').toLocaleLowerCase('en'))
    const stats = numeric?.numericStats as Record<string,number>|undefined
    const physicalDamagePercent = Number(stats?.[damageStat])
    const attackSpeedPercent = Number(stats?.[speedStat])
    return numeric?.sourceRecordId === 'SupportMeleePhysicalDamagePlayer' && Number.isFinite(physicalDamagePercent) && Number.isFinite(attackSpeedPercent)
      ? [{definition,numeric,physicalDamagePercent,attackSpeedPercent}] : []
  })
  const empty=(status:HeavySwingSupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[]):HeavySwingSupportModel=>({
    modelVersion:HEAVY_SWING_SUPPORT_MODEL_VERSION,status,physicalDamagePercent:0,physicalDamageMultiplier:1,attackSpeedPercent:0,attackSpeedMultiplier:1,appliedSupports:[],blockedSupportIds,sourceReferences,detail,
  })
  if(!candidates.length)return empty('not-applicable','Heavy Swing ist nicht ausgewählt oder besitzt keine vollständige strukturierte Wirkung.')
  const sourceReferences=candidates.flatMap(value=>[`support:${value.numeric.sourceRecordId}:${damageStat}`,`support:${value.numeric.sourceRecordId}:${speedStat}`])
  if(!input.skill.skillTypes.includes('Melee'))return empty('blocked-incompatible-skill','Heavy Swing unterstützt laut gepinnter Definition ausschließlich Nahkampffertigkeiten. Es wird kein Effekt angewandt.',candidates.map(value=>value.definition.id),sourceReferences)
  const families=candidates.map(value=>value.numeric.gemFamily[0]??value.definition.id)
  if(new Set(families).size!==families.length)return empty('blocked-duplicate-family','Mehrere Gemmen derselben Supportfamilie sind ausgewählt. Die gesamte Wirkung wird fail-closed blockiert.',candidates.map(value=>value.definition.id),sourceReferences)
  const appliedSupports=candidates.map(({definition,numeric,physicalDamagePercent,attackSpeedPercent})=>({supportId:definition.id,supportName:definition.displayNameDe??definition.nameEn??numeric.name,family:numeric.gemFamily[0]??definition.id,physicalDamagePercent,attackSpeedPercent,sourceReferences:[`support:${numeric.sourceRecordId}:${damageStat}`,`support:${numeric.sourceRecordId}:${speedStat}`]}))
  const physicalDamageMultiplier=round(appliedSupports.reduce((value,support)=>value*(1+support.physicalDamagePercent/100),1))
  const attackSpeedMultiplier=round(appliedSupports.reduce((value,support)=>value*(1+support.attackSpeedPercent/100),1))
  return {modelVersion:HEAVY_SWING_SUPPORT_MODEL_VERSION,status:'applied',physicalDamagePercent:round((physicalDamageMultiplier-1)*100),physicalDamageMultiplier,attackSpeedPercent:round((attackSpeedMultiplier-1)*100),attackSpeedMultiplier,appliedSupports,blockedSupportIds:[],sourceReferences,detail:'35% mehr physischer Schaden und 10% weniger Angriffsgeschwindigkeit werden aus derselben gepinnten Supportdefinition gemeinsam angewandt.'}
}

export const applyHeavySwingPhysicalDamageMultiplier=(components:DamageComponent[],model:HeavySwingSupportModel)=>model.status==='applied'
  ?components.map(value=>value.type==='physical'?{...value,minimum:round(value.minimum*model.physicalDamageMultiplier),maximum:round(value.maximum*model.physicalDamageMultiplier)}:{...value})
  :components.map(value=>({...value}))
