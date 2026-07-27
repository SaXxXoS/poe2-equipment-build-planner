import type { DamageComponent, EnemyMitigationProfile, MitigatedDamageComponent } from './types'

const round=(value:number,digits=2)=>Number(value.toFixed(digits))
const finiteNonNegative=(value:number|undefined)=>Number.isFinite(value)&&value!>=0?value!:0
const clampResistance=(value:number)=>Math.max(-100,Math.min(90,value))
const physicalAfterArmour=(damage:number,armour:number)=>{
  if(damage<=0||armour<=0)return damage
  const mitigation=Math.min(0.9,armour/(armour+10*damage))
  return damage*(1-mitigation)
}

export interface EnemyMitigationResult { components:MitigatedDamageComponent[]; average:number; warnings:string[] }

/** Applies only explicitly supplied comparison values; there are no hidden boss defaults. */
export function applyEnemyMitigation(components:DamageComponent[],profile:EnemyMitigationProfile):EnemyMitigationResult {
  const warnings:string[]=[]
  const mitigated=components.map(component=>{
    if(component.type==='physical'){
      const armour=Math.max(0,finiteNonNegative(profile.armour)-finiteNonNegative(profile.armourBreak))
      const averageRaw=(component.minimum+component.maximum)/2
      const mitigation=armour>0&&averageRaw>0?Math.min(0.9,armour/(armour+10*averageRaw)):0
      return{...component,minimum:round(physicalAfterArmour(component.minimum,armour)),maximum:round(physicalAfterArmour(component.maximum,armour)),effectiveDefence:round(armour),mitigationPercent:round(mitigation*100)}
    }
    const resistance=profile.resistances?.[component.type]??0
    const reduction=finiteNonNegative(profile.resistanceReduction?.[component.type])
    const penetration=finiteNonNegative(profile.penetration?.[component.type])
    const resistanceAfterReduction=clampResistance(resistance-reduction)
    const penetratedResistance=resistanceAfterReduction>0?Math.max(0,resistanceAfterReduction-penetration):resistanceAfterReduction
    const effectiveResistance=clampResistance(penetratedResistance)
    if(resistance-reduction!==resistanceAfterReduction)warnings.push(`${component.type}: Widerstand nach Reduktion wurde für das Vergleichsmodell auf ${resistanceAfterReduction} % begrenzt.`)
    const multiplier=1-effectiveResistance/100
    return{...component,minimum:round(component.minimum*multiplier),maximum:round(component.maximum*multiplier),effectiveDefence:round(effectiveResistance),mitigationPercent:round(effectiveResistance)}
  })
  return{components:mitigated,average:round(mitigated.reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)),warnings}
}
