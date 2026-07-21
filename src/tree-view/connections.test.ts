import { describe,expect,it } from 'vitest'
import importedTree from '../../generated/poe2-tree/tree.json'
import importReport from '../../generated/poe2-tree/import-report.json'
import { adaptImportedPoe2Tree } from './adapter'
import { resolveTreeConnectionRenderDecision } from './connections'
import type { ImportedPoe2Tree,TreeConnectionViewModel } from './types'

const connection=(value:Partial<TreeConnectionViewModel>={}):TreeConnectionViewModel=>({id:'1:2',fromNodeId:'1',toNodeId:'2',connectionType:'passive-tree',hideInDefaultState:false,sourceReference:'edges.0',...value})

describe('zentrale Verbindungsdarstellung',()=>{
  it('zeigt eine normale offizielle Verbindung im Ruhezustand',()=>expect(resolveTreeConnectionRenderDecision(connection(),new Set())).toEqual({status:'normalVisible',visible:true,reason:'official-passive-edge'}))
  it('blendet eine hideConnection-Verbindung im Ruhezustand aus',()=>expect(resolveTreeConnectionRenderDecision(connection({hideInDefaultState:true}),new Set())).toMatchObject({status:'hiddenUntilActive',visible:false}))
  it('blendet den Effekt nur bei aktivierten Endpunkten ein',()=>{const value=connection({hideInDefaultState:true});expect(resolveTreeConnectionRenderDecision(value,new Set(['1'])).visible).toBe(false);expect(resolveTreeConnectionRenderDecision(value,new Set(['1','2']))).toMatchObject({status:'hiddenUntilActive',visible:true})})
  it('klassifiziert unbekannte und layoutübergreifende Verbindungen sicher unsichtbar',()=>{expect(resolveTreeConnectionRenderDecision(connection({connectionType:'layout-transition'}),new Set()).visible).toBe(false);expect(resolveTreeConnectionRenderDecision(connection({connectionType:'other'}),new Set()).status).toBe('unknown')})
  it('erhält alle echten Exportkanten und markiert exakt zwölf Smith-Effektverbindungen',()=>{const tree=adaptImportedPoe2Tree(importedTree as ImportedPoe2Tree,importReport),hidden=tree.connections.filter(value=>value.hideInDefaultState);expect(tree.connectionCount).toBe(6067);expect(tree.drawableConnectionCount).toBe(6027);expect(hidden).toHaveLength(12);expect(hidden.every(value=>value.fromNodeId==='9988'||value.toNodeId==='9988')).toBe(true);expect(tree.connections.filter(value=>value.connectionType==='passive-tree'&&!value.hideInDefaultState)).toHaveLength(6015)})
})
