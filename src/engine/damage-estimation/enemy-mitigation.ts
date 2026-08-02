import type { DamageComponent, EnemyMitigationProfile, MitigatedDamageComponent } from './types'
import { enemyDamageTakenMultiplier } from './enemy-damage-taken'

const round=(value:number,digits=2)=>Number(value.toFixed(digits))
const finiteNonNegative=(value:number|undefined)=>Number.isFinite(value)&&value!>=0?value!:0
const clampResistance=(value:number)=>Math.max(-100,Math.min(90,value))
const physicalAfterArmour=(damage:number,armour:number)=>{
  if(damage<=0||armour<=0)return damage
  const mitigation=Math.min(0.9,armour/(armour+10*damage))
  return damage*(1-mitigation)
}

export interface EnemyMitigationResult { components:MitigatedDamageComponent[]; average:number; warnings:string[] }
export interface EnemyMitigationOptions { physicalDamageReductionIgnoreChancePercent?:number }

/** Applies only explicitly supplied comparison values; there are no hidden boss defaults. */
export function applyEnemyMitigation(components:DamageComponent[],profile:EnemyMitigationProfile,options:EnemyMitigationOptions={}):EnemyMitigationResult {
  const warnings:string[]=[]
  const mitigated=components.map(component=>{
    const fullBreakTakenMultiplier=profile.fullyBrokenArmour
      ?1+(profile.fullyBrokenArmourEffect?.[component.type]??(component.type==='physical'?20:0))/100
      :1
    if(component.type==='physical'){
      const armour=profile.fullyBrokenArmour?0:Math.max(0,finiteNonNegative(profile.armour)-finiteNonNegative(profile.armourBreak))
      const averageRaw=(component.minimum+component.maximum)/2
      const mitigation=armour>0&&averageRaw>0?Math.min(0.9,armour/(armour+10*averageRaw)):0
      const ignoreChance=Math.max(0,Math.min(100,finiteNonNegative(options.physicalDamageReductionIgnoreChancePercent)))/100
      const expectedMitigation=mitigation*(1-ignoreChance)
      const takenMultiplier=enemyDamageTakenMultiplier(component.type,profile)
      const expectedAfterArmour=(damage:number)=>physicalAfterArmour(damage,armour)*(1-ignoreChance)+damage*ignoreChance
      return{...component,minimum:round(expectedAfterArmour(component.minimum)*fullBreakTakenMultiplier*takenMultiplier),maximum:round(expectedAfterArmour(component.maximum)*fullBreakTakenMultiplier*takenMultiplier),effectiveDefence:round(armour),mitigationPercent:round(expectedMitigation*100)}
    }
    const resistance=profile.resistances?.[component.type]??0
    const reduction=finiteNonNegative(profile.resistanceReduction?.[component.type])
    const penetration=finiteNonNegative(profile.penetration?.[component.type])
    const resistanceAfterReduction=clampResistance(resistance-reduction)
    const penetratedResistance=resistanceAfterReduction>0?Math.max(0,resistanceAfterReduction-penetration):resistanceAfterReduction
    const effectiveResistance=clampResistance(penetratedResistance)
    if(resistance-reduction!==resistanceAfterReduction)warnings.push(`${component.type}: Widerstand nach Reduktion wurde für das Vergleichsmodell auf ${resistanceAfterReduction} % begrenzt.`)
    const multiplier=(1-effectiveResistance/100)*enemyDamageTakenMultiplier(component.type,profile)*fullBreakTakenMultiplier
    return{...component,minimum:round(component.minimum*multiplier),maximum:round(component.maximum*multiplier),effectiveDefence:round(effectiveResistance),mitigationPercent:round(effectiveResistance)}
  })
  return{components:mitigated,average:round(mitigated.reduce((sum,value)=>sum+(value.minimum+value.maximum)/2,0)),warnings}
}
