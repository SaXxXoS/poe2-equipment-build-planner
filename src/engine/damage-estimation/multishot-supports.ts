import reference from '../../../generated/pob2/damage-reference.json'
import type { SkillSetup, SupportGemDefinition } from '../../domain/skills'
import type { DamageComponent } from './types'

export const MULTISHOT_SUPPORT_MODEL_VERSION = '1.0.0'

type NumericSkill = (typeof reference.skills)[number]

export interface MultishotSupportModel {
  modelVersion: string
  status: 'not-applicable' | 'applied' | 'blocked-incompatible-skill' | 'blocked-duplicate-family'
  damageMultiplier: number
  skillSpeedMultiplier: number
  additionalProjectiles: number
  singleTargetHitMultiplier: 1
  appliedSupports: Array<{supportId:string;supportName:string;family:string;finalDamagePercent:number;finalSkillSpeedPercent:number;additionalProjectiles:number;sourceReferences:string[]}>
  blockedSupportIds: string[]
  sourceReferences: string[]
  detail: string
}

const recordsByName = new Map(reference.supports.map(value => [value.name.toLocaleLowerCase('en'), value]))
const projectileStat = 'number_of_additional_projectiles'
const damageStat = 'support_multiple_damage_+%_final'
const speedStat = 'support_scattershot_skill_speed_+%_final'
const round = (value: number) => Number(value.toFixed(8))

const empty = (status:MultishotSupportModel['status'],detail:string,blockedSupportIds:string[]=[],sourceReferences:string[]=[]):MultishotSupportModel => ({
  modelVersion:MULTISHOT_SUPPORT_MODEL_VERSION,status,damageMultiplier:1,skillSpeedMultiplier:1,additionalProjectiles:0,singleTargetHitMultiplier:1,
  appliedSupports:[],blockedSupportIds,sourceReferences,detail,
})

export function resolveMultishotSupports(input:{skill:NumericSkill;setup?:SkillSetup;supports:SupportGemDefinition[]}):MultishotSupportModel {
  const selected=new Set(input.setup?.supportGemIds??[])
  const candidates=input.supports.filter(value=>selected.has(value.id)).flatMap(definition=>{
    const numeric=recordsByName.get((definition.nameEn??'').toLocaleLowerCase('en'))
    const stats=numeric?.numericStats as Record<string,number>|undefined
    const additionalProjectiles=Number(stats?.[projectileStat])
    const damagePercent=Number(stats?.[damageStat])
    const speedPercent=Number(stats?.[speedStat])
    return numeric&&Number.isInteger(additionalProjectiles)&&additionalProjectiles>0&&Number.isFinite(damagePercent)&&Number.isFinite(speedPercent)
      ? [{definition,numeric,additionalProjectiles,damagePercent,speedPercent}]
      : []
  })
  if(!candidates.length)return empty('not-applicable','Keine ausgewählte Unterstützung besitzt eine vollständige strukturierte Mehrfachprojektilwirkung.')
  const sourceReferences=candidates.flatMap(value=>[projectileStat,damageStat,speedStat].map(stat=>`support:${value.numeric.sourceRecordId}:${stat}`))
  const skillTypes=new Set(input.skill.skillTypes)
  const compatible=skillTypes.has('Projectile')&&skillTypes.has('ProjectileNumber')&&!skillTypes.has('ProjectilesNumberModifiersNotApplied')
  if(!compatible)return empty('blocked-incompatible-skill','Mehrfachprojektil benötigt die strukturierten Typen Projectile und ProjectileNumber und ist bei ProjectilesNumberModifiersNotApplied ausgeschlossen.',candidates.map(value=>value.definition.id),sourceReferences)
  const familyCounts=new Map<string,number>()
  for(const candidate of candidates){const family=candidate.numeric.gemFamily[0]??candidate.definition.id;familyCounts.set(family,(familyCounts.get(family)??0)+1)}
  const duplicateFamilies=new Set([...familyCounts].filter(([,count])=>count>1).map(([family])=>family))
  if(duplicateFamilies.size)return empty('blocked-duplicate-family','Mehrere Stufen derselben Mehrfachprojektilfamilie sind ausgewählt. Die Wirkung wird fail-closed blockiert.',candidates.filter(value=>duplicateFamilies.has(value.numeric.gemFamily[0]??value.definition.id)).map(value=>value.definition.id),sourceReferences)
  const appliedSupports=candidates.map(({definition,numeric,additionalProjectiles,damagePercent,speedPercent})=>({
    supportId:definition.id,supportName:definition.displayNameDe??definition.nameEn??numeric.name,family:numeric.gemFamily[0]??definition.id,
    finalDamagePercent:damagePercent,finalSkillSpeedPercent:speedPercent,additionalProjectiles,
    sourceReferences:[projectileStat,damageStat,speedStat].map(stat=>`support:${numeric.sourceRecordId}:${stat}`),
  }))
  return {
    modelVersion:MULTISHOT_SUPPORT_MODEL_VERSION,status:'applied',
    damageMultiplier:round(appliedSupports.reduce((value,support)=>value*(1+support.finalDamagePercent/100),1)),
    skillSpeedMultiplier:round(appliedSupports.reduce((value,support)=>value*(1+support.finalSkillSpeedPercent/100),1)),
    additionalProjectiles:appliedSupports.reduce((sum,support)=>sum+support.additionalProjectiles,0),singleTargetHitMultiplier:1,
    appliedSupports,blockedSupportIds:[],sourceReferences,
    detail:'Die strukturierten zusätzlichen Projektile sowie der finale Schadens- und Fertigkeitsgeschwindigkeitsfaktor werden angewandt. Zusätzliche Projektile erhöhen ohne Mehrfachtrefferbeleg nur die Zielabdeckung.',
  }
}

export const applyMultishotDamageMultiplier=(components:DamageComponent[],model:MultishotSupportModel)=>model.status==='applied'
  ? components.map(value=>({...value,minimum:round(value.minimum*model.damageMultiplier),maximum:round(value.maximum*model.damageMultiplier)}))
  : components.map(value=>({...value}))
