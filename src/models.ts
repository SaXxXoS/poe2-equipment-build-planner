export interface Ascendancy { id:string; name:string; classId:string }
export interface Character { classId:string; ascendancyId:string; level:number; goal:'Ausgeglichen'|'Mapping'|'Boss'; mainSkill:string }
export interface Affix { id:string; name:string; value:number }
export interface EquipmentSlot { id:string; name:string; affixes:Affix[] }
export interface SupportGem { id:string; name:string }
export interface Skill { id:string; name:string; role:'Hauptfertigkeit'|'Zusatzfertigkeit'; weaponSet:'Waffen-Set 1'|'Waffen-Set 2'|'Beide'; supports:(SupportGem|null)[] }
export interface Jewel { id:string; name:string; description:string }
export interface ClusterJewel extends Jewel { size:'klein'|'mittel'|'groß' }
export interface UniqueClusterJewel extends Jewel { unique:true }
export interface PassiveNode { id:string; name:string; type:'normal'|'notable'|'keystone'|'jewel'|'cluster'; x:number; y:number; selected:boolean }
export interface Recommendation { title:string; items:string[] }
export interface RotationStep { order:number; action:string; reason:string }
export interface BuildResult { mainSkill:string; additionalSkills:string[]; supports:string[]; weaponSet1:string[]; weaponSet2:string[]; passivePath:string; jewels:string[]; clusters:string[]; uniqueClusters:string[]; uniqueItem:string; affixImprovements:string[]; mappingRotation:RotationStep[]; bossRotation:RotationStep[]; explanation:string; skillOrderExplanation:string; weaponSwapExplanation:string; recommendations:Recommendation[] }
