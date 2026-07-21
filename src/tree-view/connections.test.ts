import { describe,expect,it } from 'vitest'
import importedTree from '../../generated/poe2-tree/tree.json'
import importReport from '../../generated/poe2-tree/import-report.json'
import { adaptImportedPoe2Tree } from './adapter'
import { resolveTreeConnectionGeometry,resolveTreeConnectionRenderDecision,resolveTreeConnectionStyle } from './connections'
import type { ImportedPoe2Tree,TreeConnectionViewModel } from './types'

const connection=(value:Partial<TreeConnectionViewModel>={}):TreeConnectionViewModel=>({id:'1:2',fromNodeId:'1',toNodeId:'2',connectionType:'passive-tree',hideInDefaultState:false,sourceReference:'edges.0',...value})

describe('zentrale Verbindungsdarstellung',()=>{
  it('zeigt eine normale offizielle Verbindung im Ruhezustand',()=>expect(resolveTreeConnectionRenderDecision(connection(),new Set())).toEqual({status:'normalVisible',visible:true,reason:'official-passive-edge'}))
  it('blendet eine hideConnection-Verbindung im Ruhezustand aus',()=>expect(resolveTreeConnectionRenderDecision(connection({hideInDefaultState:true}),new Set())).toMatchObject({status:'hiddenUntilActive',visible:false}))
  it('blendet den Effekt nur bei aktivierten Endpunkten ein',()=>{const value=connection({hideInDefaultState:true});expect(resolveTreeConnectionRenderDecision(value,new Set(['1'])).visible).toBe(false);expect(resolveTreeConnectionRenderDecision(value,new Set(['1','2']))).toMatchObject({status:'hiddenUntilActive',visible:true})})
  it('blendet offizielle Mastery-Effektkanten im Ruhezustand aus',()=>expect(resolveTreeConnectionRenderDecision(connection({touchesMastery:true}),new Set())).toEqual({status:'hiddenUntilActive',visible:false,reason:'official-mastery-effect-edge'}))
  it('unterscheidet gerade und offizielle Orbitgeometrie zentral',()=>{expect(resolveTreeConnectionGeometry(connection(),{x:0,y:0},{x:10,y:0})).toEqual({kind:'line',d:'M 0 0 L 10 0'});expect(resolveTreeConnectionGeometry(connection({orbit:2,orbitCenter:{x:0,y:0}}),{x:10,y:0},{x:0,y:10})).toEqual({kind:'arc',radius:10,sweep:1,d:'M 10 0 A 10 10 0 0 1 0 10'})})
  it('hält Linienlook und Layer zentral',()=>expect(resolveTreeConnectionStyle({status:'normalVisible',visible:true,reason:'test'})).toEqual({className:'connection-normalVisible',layer:'base',strokeWidth:8,opacity:.72}))
  it('klassifiziert unbekannte und layoutübergreifende Verbindungen sicher unsichtbar',()=>{expect(resolveTreeConnectionRenderDecision(connection({connectionType:'layout-transition'}),new Set()).visible).toBe(false);expect(resolveTreeConnectionRenderDecision(connection({connectionType:'other'}),new Set()).status).toBe('unknown')})
  it('erhält alle echten Exportkanten und markiert exakt zwölf Smith-Effektverbindungen',()=>{const tree=adaptImportedPoe2Tree(importedTree as ImportedPoe2Tree,importReport),hidden=tree.connections.filter(value=>value.hideInDefaultState);expect(tree.connectionCount).toBe(6067);expect(tree.drawableConnectionCount).toBe(6027);expect(hidden).toHaveLength(12);expect(hidden.every(value=>value.fromNodeId==='9988'||value.toNodeId==='9988')).toBe(true);expect(tree.connections.filter(value=>value.connectionType==='passive-tree'&&!value.hideInDefaultState)).toHaveLength(6015)})
  it('bewahrt 1.733 offizielle Kreisbögen und 644 Mastery-Effektkanten',()=>{const tree=adaptImportedPoe2Tree(importedTree as ImportedPoe2Tree,importReport);expect(tree.connections.filter(value=>value.orbitCenter).length).toBe(1733);expect(tree.connections.filter(value=>value.touchesMastery).length).toBe(644)})
})
