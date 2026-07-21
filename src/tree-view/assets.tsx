/* eslint-disable react-refresh/only-export-components */
import renderData from '../../generated/poe2-tree/tree-render-data.json'
import { useId } from 'react'
import type { TreeNodeViewModel } from './types'

export type TreeNodeDisplayState='inactive'|'active'|'selected'|'highlighted'|'dimmed'|'unavailable'
export type TreeDetailLevel='far'|'medium'|'near'
export type SpriteLayer='icon'|'frame'|'background'
export interface AtlasFrame { atlas:string;atlasWidth:number;atlasHeight:number;x:number;y:number;w:number;h:number }
export interface SpriteRenderData { assetUrl:string;atlasName:string;atlasWidth:number;atlasHeight:number;sourceX:number;sourceY:number;sourceWidth:number;sourceHeight:number;targetX:number;targetY:number;targetWidth:number;targetHeight:number;layer:SpriteLayer;spriteKey:string;fallbackReason?:string }
export interface NodeSpriteRenderData { officialIconReference:string|null;icon:SpriteRenderData|null;frame:SpriteRenderData|null;fallbackReason?:string }

const modules=import.meta.glob('../../generated/poe2-tree/assets/*.webp',{eager:true,query:'?url',import:'default'}) as Record<string,string>
const urls=Object.fromEntries(Object.entries(modules).map(([key,url])=>[key.split('/').pop()!,url]))
const frames=renderData.atlases as Record<string,AtlasFrame>,icons=renderData.nodeIcons as Record<string,string>

const isActive=(state:TreeNodeDisplayState)=>!['inactive','dimmed','unavailable'].includes(state)
const iconType=(node:TreeNodeViewModel)=>node.nodeType==='keystone'?'keystone':node.nodeType==='notable'?'notable':node.isJewelSocket?null:'normal'
const frameKey=(node:TreeNodeViewModel,active:boolean)=>{
  if(node.isJewelSocket)return active?'frame:JewelSocketAltActive':'frame:JewelSocketAltNormal'
  if(node.isClassStart)return active?'frame:PSSkillFrameActive':'frame:PSSkillFrame'
  if(node.isAscendancyStart)return'frame:AscendancyStartNode'
  if(node.isAscendancyNode&&node.nodeType==='notable')return active?'frame:AscendancyFrameNotableAllocated':'frame:AscendancyFrameNotableUnallocated'
  if(node.isAscendancyNode)return active?'frame:AscendancyFrameNormalAllocated':'frame:AscendancyFrameNormalUnallocated'
  if(node.nodeType==='keystone')return active?'frame:KeystoneFrameAllocated':'frame:KeystoneFrameUnallocated'
  if(node.nodeType==='notable')return active?'frame:NotableFrameAllocated':'frame:NotableFrameUnallocated'
  return null
}
const renderLayer=(frame:AtlasFrame|undefined,key:string,layer:SpriteLayer,node:TreeNodeViewModel,size:number):SpriteRenderData|null=>frame&&urls[frame.atlas]?{assetUrl:urls[frame.atlas],atlasName:frame.atlas,atlasWidth:frame.atlasWidth,atlasHeight:frame.atlasHeight,sourceX:frame.x,sourceY:frame.y,sourceWidth:frame.w,sourceHeight:frame.h,targetX:node.x-size/2,targetY:node.y-size/2,targetWidth:size,targetHeight:size,layer,spriteKey:key}:null

export function resolveNodeSpriteRenderData(node:TreeNodeViewModel,state:TreeNodeDisplayState,_zoomLevel:TreeDetailLevel,radius:number):NodeSpriteRenderData{
  const active=isActive(state),reference=icons[node.id]||null,type=iconType(node),resolvedFrameKey=frameKey(node,active),resolvedIconKey=type&&reference?`${type}${active?'Active':'Inactive'}:${reference}`:null
  const icon=resolvedIconKey?renderLayer(frames[resolvedIconKey],resolvedIconKey,'icon',node,radius*1.45):null
  const frame=resolvedFrameKey?renderLayer(frames[resolvedFrameKey],resolvedFrameKey,'frame',node,radius*2.35):null
  const fallbackReason=!reference?'official-node-icon-reference-missing':type&&!icon?'official-icon-sprite-unresolved':undefined
  return{officialIconReference:reference,icon,frame,...(fallbackReason?{fallbackReason}:{})}
}

export function Sprite({data,className}:{data:SpriteRenderData|null;className?:string}){const clipId=useId();if(!data)return null;return <svg x={data.targetX} y={data.targetY} width={data.targetWidth} height={data.targetHeight} viewBox={`0 0 ${data.sourceWidth} ${data.sourceHeight}`} preserveAspectRatio="xMidYMid meet" overflow="hidden" className={className} data-source-rect={`${data.sourceX} ${data.sourceY} ${data.sourceWidth} ${data.sourceHeight}`} data-sprite-key={data.spriteKey} data-atlas={data.atlasName} aria-hidden="true"><defs><clipPath id={clipId}><rect x="0" y="0" width={data.sourceWidth} height={data.sourceHeight}/></clipPath></defs><image href={data.assetUrl} x={-data.sourceX} y={-data.sourceY} width={data.atlasWidth} height={data.atlasHeight} preserveAspectRatio="none" clipPath={`url(#${clipId})`}/></svg>}
export function resolveBackgroundFrame(key:string|null|undefined){return key?frames[key]:undefined}
export function resolveBackgroundSprite(key:string|null|undefined,x:number,y:number,width:number,height:number):SpriteRenderData|null{const frame=resolveBackgroundFrame(key);return frame&&urls[frame.atlas]?{assetUrl:urls[frame.atlas],atlasName:frame.atlas,atlasWidth:frame.atlasWidth,atlasHeight:frame.atlasHeight,sourceX:frame.x,sourceY:frame.y,sourceWidth:frame.w,sourceHeight:frame.h,targetX:x-width/2,targetY:y-height/2,targetWidth:width,targetHeight:height,layer:'background',spriteKey:key!}:null}
export const officialClassRegistry=renderData.classes
