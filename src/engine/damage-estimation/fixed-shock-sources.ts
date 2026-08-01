import type { EquipmentEntry } from '../../domain'
import { pob2UniquePlannerRegistry } from '../../uniques'
import type { BlockedEnemyMitigationEffect } from './types'

const WAKE_OF_DESTRUCTION_ID='pob2:src/Data/Uniques/boots.lua#21'
const WAKE_SHOCKED_GROUND_LINE='Drop Shocked Ground while moving, lasting 8 seconds'
const recordsById=new Map(pob2UniquePlannerRegistry.map(record=>[record.sourceId,record]))

function selectedLines(entry:EquipmentEntry){
  if(!entry.uniqueItemId)return[]
  const record=recordsById.get(entry.uniqueItemId)
  if(!record)return[]
  return [...record.visibleModifiers,...record.implicits].filter(line=>{
    const scope=line.variantScope??[]
    return !scope.length||Boolean(entry.uniqueVariantId&&scope.includes(entry.uniqueVariantId))
  })
}

/**
 * Resolves fixed Shock candidates whose numeric value and duration have an
 * exact pinned PoB2 chain. They remain blocked until the enemy's ground
 * occupancy is evidenced; merely equipping the source does not assume it.
 */
export function resolveBlockedFixedShockSources(equipment:EquipmentEntry[]):BlockedEnemyMitigationEffect[]{
  const blocked:BlockedEnemyMitigationEffect[]=[]
  for(const entry of equipment){
    if(entry.uniqueItemId!==WAKE_OF_DESTRUCTION_ID)continue
    const line=selectedLines(entry).find(value=>value.normalizedPlannerLine===WAKE_SHOCKED_GROUND_LINE)
    if(!line)continue
    blocked.push({
      source:'equipment',sourceId:entry.uniqueItemId,label:'Wake of Destruction: Shocked Ground',
      kind:'fixed-shock',value:20,durationMs:8000,activationCondition:'enemy-on-shocked-ground',
      reason:'enemy-ground-occupancy-unconfirmed',evidence:'text-pattern-exact',
      sourceReferences:[
        `${entry.uniqueItemId}:${line.sourceLineId}`,
        'PoB2:ModParser:drops shocked ground while moving lasting seconds->ShockBase(default)',
        'PoB2:CalcPerform:OnShockedGround->ShockOverride',
      ],
      detail:'Die ausgerüsteten Stiefel erzeugen beim Bewegen acht Sekunden lang geschockten Boden mit der gepinnten Grundwirkung von 20 %. Ohne belegten Zielstandort wird der Effekt nicht auf den Schaden angewandt.',
    })
  }
  return blocked.sort((left,right)=>left.sourceId.localeCompare(right.sourceId,'en'))
}
