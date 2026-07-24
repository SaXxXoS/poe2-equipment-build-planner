import type { RealPassivePipelineInput,StartNodeResolution } from './types'
const classes=(value:number|number[]|null)=>value===null?[]:(Array.isArray(value)?value:[value]).map(String)
export function resolveRealPassiveStartNode(input:RealPassivePipelineInput):StartNodeResolution{
 const ascendancy=input.planningScope==='ascendancy'
 const starts=input.passiveTree.nodes.filter(node=>ascendancy?node.isAscendancyStart:node.isClassStart)
 if(input.startNodeId){
  const node=starts.find(value=>value.id===input.startNodeId)
  const violations=!node?['explicit-start-not-found']:ascendancy?(node.ascendancyId!==input.ascendancyId?['explicit-start-ascendancy-mismatch']:[]):(!classes(node.classStartIndex).includes(input.characterClassId)?['explicit-start-class-mismatch']:[])
  return{resolvedStartNodeId:violations.length?null:input.startNodeId,resolutionSource:violations.length?null:'explicit',classId:input.characterClassId,warnings:[],violations}
 }
 const matches=ascendancy?starts.filter(node=>Boolean(input.ascendancyId)&&node.ascendancyId===input.ascendancyId):starts.filter(node=>classes(node.classStartIndex).includes(input.characterClassId))
 return{resolvedStartNodeId:matches.length===1?matches[0].id:null,resolutionSource:matches.length===1?'official-class-mapping':null,classId:input.characterClassId,warnings:[],violations:matches.length===0?[ascendancy?'ascendancy-start-not-found':'class-start-not-found']:matches.length>1?[ascendancy?'ambiguous-ascendancy-start':'ambiguous-class-start']:[]}
}
