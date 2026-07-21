import type { ImportedPoe2Tree, TreeBoundsViewModel } from './types'

export const TREE_GEOMETRY_VERSION='5D-fix-1.0.0'
export const TREE_VIEW_PADDING=420
type ImportedNode=ImportedPoe2Tree['nodes'][number]
type ImportedGroup=ImportedPoe2Tree['groups'][number]
export interface TreeWorldPosition{x:number;y:number}

const finite=(value:number,path:string)=>{if(!Number.isFinite(value))throw new Error(`Ungültige Baumkoordinate: ${path}`);return value}
export function resolvePassiveNodeWorldPosition(node:ImportedNode,group:ImportedGroup):TreeWorldPosition{
 if(!group||group.groupId!==node.groupId)throw new Error(`Fehlende Baumgruppe für Knoten ${node.id}`)
 return{x:finite(node.position.x,`nodes.${node.id}.position.x`),y:finite(node.position.y,`nodes.${node.id}.position.y`)}
}
export function calculateTreeBounds(positions:readonly TreeWorldPosition[],padding=TREE_VIEW_PADDING):TreeBoundsViewModel{
 if(!positions.length)throw new Error('Der importierte Baum enthält keine Knoten')
 const xs=positions.map((value,index)=>finite(value.x,`positions.${index}.x`)),ys=positions.map((value,index)=>finite(value.y,`positions.${index}.y`)),minX=Math.min(...xs)-padding,minY=Math.min(...ys)-padding,maxX=Math.max(...xs)+padding,maxY=Math.max(...ys)+padding
 return{minX,minY,maxX,maxY,width:maxX-minX,height:maxY-minY,padding}
}
export function isDrawableTreeConnection(from:ImportedNode,to:ImportedNode){return Boolean(from.ascendancyId)===Boolean(to.ascendancyId)}
