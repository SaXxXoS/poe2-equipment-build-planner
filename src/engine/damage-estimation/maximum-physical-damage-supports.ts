import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const MAXIMUM_PHYSICAL_DAMAGE_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface MaximumPhysicalDamageSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-missing-physical-damage' | 'blocked-duplicate-family'
  components: DamageComponent[]
  appliedSupports: Array<{supportId:string;supportName:string;family:string;finalMaximumPhysicalDamagePercent:number;multiplier:number;sourceReference:string}>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const numericSupportsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const statId = 'support_heft_maximum_physical_damage_+%_final'
const round = (value: number) => Number(value.toFixed(8))
const result = (input: Omit<MaximumPhysicalDamageSupportModel, 'modelVersion'>):MaximumPhysicalDamageSupportModel => ({modelVersion:MAXIMUM_PHYSICAL_DAMAGE_SUPPORT_MODEL_VERSION,...input})

export function applyMaximumPhysicalDamageSupports(input:{components:DamageComponent[];skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[]}):MaximumPhysicalDamageSupportModel {
  const original=input.components.map(value=>({...value}))
  const selected=new Set(input.setup?.supportGemIds??[])
  const candidates=input.supports.filter(value=>selected.has(value.id)).flatMap(definition=>{
    const numeric=numericSupportsByName.get((definition.nameEn??'').toLocaleLowerCase('en'))
    const percent=Number((numeric?.numericStats as Record<string,number>|undefined)?.[statId])
    return numeric&&Number.isFinite(percent)?[{definition,numeric,percent}]:[]
  })
  if(!candidates.length)return result({status:'not-applicable',components:original,appliedSupports:[],blockedSupportIds:[],sourceReferences:[],detail:'Keine ausgewählte Unterstützung besitzt einen strukturiert belegten finalen Modifikator für den maximalen physischen Schaden.'})
  const sourceReferences=candidates.map(value=>`support:${value.numeric.sourceRecordId}:${statId}`)
  if(!input.skill.skillTypes.includes('Attack'))return result({status:'blocked-incompatible-skill',components:original,appliedSupports:[],blockedSupportIds:candidates.map(value=>value.definition.id),sourceReferences,detail:'Muskelkraft ist am gepinnten PoB2-Datensatz nur für Angriffe belegt und wird auf diese Fertigkeit nicht angewandt.'})
  if(!original.some(value=>value.type==='physical'&&value.maximum>0))return result({status:'blocked-missing-physical-damage',components:original,appliedSupports:[],blockedSupportIds:candidates.map(value=>value.definition.id),sourceReferences,detail:'Die Fertigkeit besitzt keinen belegten maximalen physischen Ausgangsschaden. Ein positiver Effekt wird nicht erfunden.'})
  const familyCounts=new Map<string,number>()
  for(const candidate of candidates){const family=candidate.numeric.gemFamily[0]??candidate.definition.id;familyCounts.set(family,(familyCounts.get(family)??0)+1)}
  const duplicated=new Set([...familyCounts].filter(([,count])=>count>1).map(([family])=>family))
  if(duplicated.size)return result({status:'blocked-duplicate-family',components:original,appliedSupports:[],blockedSupportIds:candidates.filter(value=>duplicated.has(value.numeric.gemFamily[0]??value.definition.id)).map(value=>value.definition.id),sourceReferences,detail:'Mehrere Stufen derselben Supportfamilie sind ausgewählt. Die Wirkung wird fail-closed vollständig blockiert.'})
  const appliedSupports=candidates.map(({definition,numeric,percent})=>({supportId:definition.id,supportName:definition.displayNameDe??definition.nameEn??numeric.name,family:numeric.gemFamily[0]??definition.id,finalMaximumPhysicalDamagePercent:percent,multiplier:1+percent/100,sourceReference:`support:${numeric.sourceRecordId}:${statId}`}))
  const multiplier=appliedSupports.reduce((product,value)=>product*value.multiplier,1)
  return result({status:'applied',components:original.map(value=>value.type==='physical'?{...value,maximum:round(value.maximum*multiplier)}:value),appliedSupports,blockedSupportIds:[],sourceReferences,detail:'Der strukturierte finale PoB2-Faktor erhöht ausschließlich den maximalen physischen Ausgangsschaden. Mindestwert und nichtphysische Komponenten bleiben unverändert.'})
}
