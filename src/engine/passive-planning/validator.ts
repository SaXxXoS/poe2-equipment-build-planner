import { PASSIVE_PLANNING_CONFIG } from './config'
import type { PassivePlanningInput } from './types'

export function validatePassivePlanningInput(input:PassivePlanningInput):string[] {
  const violations:string[]=[]
  if(!input.requestId.trim())violations.push('missing-request-id')
  if(!input.passiveGraph.nodes.has(input.startNodeId))violations.push('unknown-start-node')
  else if(input.passiveGraph.nodes.get(input.startNodeId)?.nodeType!==(input.planningScope==='ascendancy'?'ascendancy-start':'class-start'))violations.push(input.planningScope==='ascendancy'?'invalid-ascendancy-start-node':'invalid-class-start-node')
  if(!Number.isInteger(input.pointBudget)||input.pointBudget<0||input.pointBudget>PASSIVE_PLANNING_CONFIG.limits.maximumPointBudget)violations.push('invalid-point-budget')
  if(!Number.isInteger(input.maximumSelectedTargets)||input.maximumSelectedTargets<1)violations.push('invalid-maximum-selected-targets')
  if(!Number.isInteger(input.candidatePoolLimit)||input.candidatePoolLimit<1)violations.push('invalid-candidate-pool-limit')
  if(!Number.isFinite(input.minimumTargetScore))violations.push('invalid-minimum-target-score')
  if(input.sourceVersion!==input.targetingResult.sourceVersion)violations.push('targeting-source-version-mismatch')
  if(!input.passiveGraph.version)violations.push('missing-graph-version')
  const duplicates=(values:string[])=>(new Set(values)).size!==values.length
  for(const [name,values] of [['required',input.requiredTargetNodeIds??[]],['excluded',input.excludedTargetNodeIds??[]],['blocked',input.blockedNodeIds??[]]] as const)if(duplicates(values))violations.push(`duplicate-${name}-node-id`)
  if((input.requiredTargetNodeIds??[]).some(id=>(input.excludedTargetNodeIds??[]).includes(id)||(input.blockedNodeIds??[]).includes(id)))violations.push('required-target-explicitly-blocked')
  if((input.requiredTargetNodeIds??[]).length>Math.min(input.maximumSelectedTargets,input.candidatePoolLimit,PASSIVE_PLANNING_CONFIG.limits.maximumSelectedTargets))violations.push('required-target-limit-exceeded')
  return [...new Set(violations)].sort()
}
