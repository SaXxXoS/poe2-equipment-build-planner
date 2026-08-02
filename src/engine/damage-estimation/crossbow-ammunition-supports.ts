import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'

export const CROSSBOW_AMMUNITION_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface CrossbowAmmunitionSupportModel {
  modelVersion:string
  status:'not-applicable'|'applied-burst-only'|'blocked-incompatible-skill'|'blocked-duplicate-family'|'blocked-missing-base-bolts'
  baseBolts:number|null
  additionalBolts:number
  loadedBolts:number|null
  finalReloadSpeedPercent:number
  reloadSpeedMultiplier:number
  sustainedDamageMultiplier:1
  appliedSupports:Array<{supportId:string;supportName:string;family:string;additionalBolts:number;finalReloadSpeedPercent:number;sourceReferences:string[]}>
  blockedSupportIds:string[]
  sourceReferences:string[]
  limitations:string[]
  detail:string
}

const recordsByName=new Map(reference.supports.map(value=>[value.name.toLocaleLowerCase('en'),value]))
const boltStat='support_double_barrel_number_of_crossbow_bolts_+'
const reloadPenaltyStat='support_double_barrel_crossbow_reload_speed_-%_final'
const baseBoltStat='base_number_of_crossbow_bolts'
const round=(value:number)=>Number(value.toFixed(8))

const empty=(status:CrossbowAmmunitionSupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[]):CrossbowAmmunitionSupportModel=>({
  modelVersion:CROSSBOW_AMMUNITION_SUPPORT_MODEL_VERSION,status,baseBolts:null,additionalBolts:0,loadedBolts:null,
  finalReloadSpeedPercent:0,reloadSpeedMultiplier:1,sustainedDamageMultiplier:1,appliedSupports:[],blockedSupportIds,sourceReferences,
  limitations:['Ohne strukturierte absolute Nachladezeit wird aus Magazinkapazität und Nachladegeschwindigkeit keine nachhaltige DPS abgeleitet.'],detail,
})

export function resolveCrossbowAmmunitionSupports(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[]}):CrossbowAmmunitionSupportModel {
  const selected=new Set(input.setup?.supportGemIds??[])
  const candidates=input.supports.filter(value=>selected.has(value.id)).flatMap(definition=>{
    const numeric=recordsByName.get((definition.nameEn??'').toLocaleLowerCase('en'))
    const stats=numeric?.numericStats as Record<string,number>|undefined
    const additionalBolts=Number(stats?.[boltStat])
    const reloadPenalty=Number(stats?.[reloadPenaltyStat])
    return numeric&&Number.isInteger(additionalBolts)&&additionalBolts>0&&Number.isFinite(reloadPenalty)&&reloadPenalty>=0
      ? [{definition,numeric,additionalBolts,reloadPenalty}]
      : []
  })
  if(!candidates.length)return empty('not-applicable','Keine ausgewählte Unterstützung besitzt die vollständige strukturierte Doppellauf-Wirkung.')
  const sourceReferences=candidates.flatMap(value=>[boltStat,reloadPenaltyStat].map(stat=>`support:${value.numeric.sourceRecordId}:${stat}`))
  const skillTypes=new Set(input.skill.skillTypes)
  const requireSkillTypes=[...candidates[0].numeric.requireSkillTypes] as string[]
  const required=requireSkillTypes.filter(value=>value!=='AND')
  const compatible=requireSkillTypes.includes('AND')
    ? required.every(value=>skillTypes.has(value))
    : required.some(value=>skillTypes.has(value))
  if(!compatible)return empty('blocked-incompatible-skill','Doppellauf benötigt einen der strukturiert freigegebenen Armbrust-Fertigkeitstypen.',candidates.map(value=>value.definition.id),sourceReferences)
  const familyCounts=new Map<string,number>()
  for(const candidate of candidates){const family=candidate.numeric.gemFamily[0]??candidate.definition.id;familyCounts.set(family,(familyCounts.get(family)??0)+1)}
  const duplicateFamilies=new Set([...familyCounts].filter(([,count])=>count>1).map(([family])=>family))
  if(duplicateFamilies.size)return empty('blocked-duplicate-family','Mehrere Stufen derselben Doppellauf-Familie sind ausgewählt. Die Wirkung wird fail-closed blockiert.',candidates.filter(value=>duplicateFamilies.has(value.numeric.gemFamily[0]??value.definition.id)).map(value=>value.definition.id),sourceReferences)
  const baseBolts=Number((input.skill.numericStats as Record<string,number>)[baseBoltStat])
  if(!Number.isInteger(baseBolts)||baseBolts<1)return empty('blocked-missing-base-bolts','Die Armbrustfertigkeit besitzt keine strukturierte positive Grundzahl geladener Bolzen.',candidates.map(value=>value.definition.id),[...sourceReferences,`skill:${input.skill.sourceRecordId}:${baseBoltStat}`])
  const appliedSupports=candidates.map(({definition,numeric,additionalBolts,reloadPenalty})=>({
    supportId:definition.id,supportName:definition.displayNameDe??definition.nameEn??numeric.name,family:numeric.gemFamily[0]??definition.id,
    additionalBolts,finalReloadSpeedPercent:-reloadPenalty,
    sourceReferences:[boltStat,reloadPenaltyStat].map(stat=>`support:${numeric.sourceRecordId}:${stat}`),
  }))
  const additionalBolts=appliedSupports.reduce((sum,value)=>sum+value.additionalBolts,0)
  const finalReloadSpeedPercent=appliedSupports.reduce((sum,value)=>sum+value.finalReloadSpeedPercent,0)
  return {
    modelVersion:CROSSBOW_AMMUNITION_SUPPORT_MODEL_VERSION,status:'applied-burst-only',baseBolts,additionalBolts,loadedBolts:baseBolts+additionalBolts,
    finalReloadSpeedPercent,reloadSpeedMultiplier:round(Math.max(0,1+finalReloadSpeedPercent/100)),sustainedDamageMultiplier:1,
    appliedSupports,blockedSupportIds:[],sourceReferences:[...sourceReferences,`skill:${input.skill.sourceRecordId}:${baseBoltStat}`],
    limitations:['Der Pin liefert für diese Kette keine absolute Nachladezeit. Daher werden Magazin-/Burstkapazität und relativer Nachladefaktor ausgewiesen, aber nicht als nachhaltiger Schadensmultiplikator verwendet.'],
    detail:`Die belegte Ladung steigt von ${baseBolts} auf ${baseBolts+additionalBolts} Bolzen; die finale Nachladegeschwindigkeit beträgt relativ ${round(Math.max(0,1+finalReloadSpeedPercent/100)*100)}%.`,
  }
}
