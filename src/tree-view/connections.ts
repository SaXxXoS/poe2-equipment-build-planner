import type { TreeConnectionViewModel } from './types'

export type TreeConnectionRenderStatus = 'normalVisible' | 'hiddenUntilActive' | 'decorative' | 'glowOnly' | 'unknown'

export interface TreeConnectionRenderDecision {
  status: TreeConnectionRenderStatus
  visible: boolean
  reason: string
}

export type TreeConnectionGeometry = { kind:'line'; d:string } | { kind:'arc'; d:string; radius:number; sweep:0|1 }
export interface TreeConnectionStyle { className:string; layer:'base'|'effect'; strokeWidth:number; opacity:number }

export function resolveTreeConnectionGeometry(connection:TreeConnectionViewModel,from:{x:number;y:number},to:{x:number;y:number}):TreeConnectionGeometry {
  const center=connection.orbitCenter
  if(!center)return{kind:'line',d:`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
  const fromRadius=Math.hypot(from.x-center.x,from.y-center.y),toRadius=Math.hypot(to.x-center.x,to.y-center.y),radius=(fromRadius+toRadius)/2
  if(!Number.isFinite(radius)||radius<=0)return{kind:'line',d:`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
  const cross=(from.x-center.x)*(to.y-center.y)-(from.y-center.y)*(to.x-center.x),sweep:0|1=cross>=0?1:0
  return{kind:'arc',radius,sweep,d:`M ${from.x} ${from.y} A ${radius} ${radius} 0 0 ${sweep} ${to.x} ${to.y}`}
}

export function resolveTreeConnectionStyle(decision:TreeConnectionRenderDecision,selected=false):TreeConnectionStyle{
  return{className:[`connection-${decision.status}`,selected?'selected':''].filter(Boolean).join(' '),layer:decision.status==='normalVisible'?'base':'effect',strokeWidth:selected?18:8,opacity:decision.status==='normalVisible'?0.72:0.9}
}

export function resolveTreeConnectionRenderDecision(connection: TreeConnectionViewModel, activeNodeIds: ReadonlySet<string>): TreeConnectionRenderDecision {
  if (connection.connectionType === 'layout-transition') return { status: 'unknown', visible: false, reason: 'separate-layout-transition' }
  if (connection.connectionType === 'decorative') return { status: 'decorative', visible: true, reason: 'explicit-decorative-layer' }
  if (connection.connectionType === 'glow-only') return { status: 'glowOnly', visible: activeNodeIds.has(connection.fromNodeId) && activeNodeIds.has(connection.toNodeId), reason: 'explicit-glow-layer' }
  if (connection.connectionType !== 'passive-tree') return { status: 'unknown', visible: false, reason: 'unsupported-connection-type' }
  if (connection.touchesMastery) return { status: 'hiddenUntilActive', visible: activeNodeIds.has(connection.fromNodeId) && activeNodeIds.has(connection.toNodeId), reason: 'official-mastery-effect-edge' }
  if (connection.hideInDefaultState) return { status: 'hiddenUntilActive', visible: activeNodeIds.has(connection.fromNodeId) && activeNodeIds.has(connection.toNodeId), reason: 'official-endpoint-hideConnection' }
  return { status: 'normalVisible', visible: true, reason: 'official-passive-edge' }
}
