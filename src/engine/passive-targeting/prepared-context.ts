import { classifyPassiveNode } from './classifier'
import type { PassiveTargetNode,PreparedPassiveTargetingContext } from './types'

export const PASSIVE_TARGETING_CONTEXT_FORMAT_VERSION='1' as const
function hash(value:string):string{let result=2166136261;for(let index=0;index<value.length;index++){result^=value.charCodeAt(index);result=Math.imul(result,16777619)}return`fnv1a32-${(result>>>0).toString(16).padStart(8,'0')}`}
export function passiveTargetingTreeIdentity(nodes:readonly PassiveTargetNode[]):string{return hash(nodes.map(node=>JSON.stringify([node.id,node.nodeType,node.isClassStart,node.classStartIndex,node.isAscendancyStart,node.ascendancyId,node.isJewelSocket,node.enabled,node.name.sourceText,node.name.sourceLocale,node.stats.map(stat=>[stat.sourceText,stat.sourceLocale])])).join('\n'))}
export function preparePassiveTargetingContext(passiveNodes:readonly PassiveTargetNode[],sourceVersion:string):PreparedPassiveTargetingContext{
 const classifications=passiveNodes.map(classifyPassiveNode),signatures=new Map<string,readonly string[]>()
 classifications.forEach(value=>{const signature=value.tags.join('|');if(signature)signatures.set(signature,Object.freeze([...(signatures.get(signature)??[]),value.nodeId].sort()))})
 return Object.freeze({formatVersion:PASSIVE_TARGETING_CONTEXT_FORMAT_VERSION,sourceVersion,treeIdentity:passiveTargetingTreeIdentity(passiveNodes),nodeCount:passiveNodes.length,classifications:Object.freeze(classifications),signatureNodeIds:signatures})
}
export function validatePreparedPassiveTargetingContext(context:PreparedPassiveTargetingContext,nodes:readonly PassiveTargetNode[],sourceVersion:string):string[]{return [...(context.formatVersion!==PASSIVE_TARGETING_CONTEXT_FORMAT_VERSION?['prepared-targeting-context-format-mismatch']:[]),...(context.sourceVersion!==sourceVersion?['prepared-targeting-context-source-version-mismatch']:[]),...(context.nodeCount!==nodes.length||context.treeIdentity!==passiveTargetingTreeIdentity(nodes)?['prepared-targeting-context-tree-mismatch']:[])]}
