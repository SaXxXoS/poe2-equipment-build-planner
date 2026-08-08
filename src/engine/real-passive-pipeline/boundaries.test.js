/* global URL */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const root = new URL('../../../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')

describe('Real-Passive-Pipeline Modulgrenzen', () => {
  it('lässt alle drei Fachmodule, Analyzer und Orchestrator unverändert', () => expect({
    classifier: sha('src/engine/passive-targeting/classifier.ts'), targetConfig: sha('src/engine/passive-targeting/config.ts'), evaluator: sha('src/engine/passive-targeting/evaluator.ts'), rules: sha('src/engine/passive-targeting/rules.ts'), pathfinder: sha('src/engine/passive-pathfinding/pathfinder.ts'), candidateBuilder: sha('src/engine/passive-planning/candidate-builder.ts'), plannerConfig: sha('src/engine/passive-planning/config.ts'), planner: sha('src/engine/passive-planning/planner.ts'), analyzer: sha('src/engine/passives/analyzer.ts'), orchestrator: sha('src/engine/orchestration/analyze-build.ts'),
  }).toEqual({
    classifier: '063c7f2a34a6073148c3dadf4077088dc728e1af9ac7e1b907ffb0d1a9ac80f0', targetConfig: '189f0019789ac2ff2f2207c65e054c03fcf1f163aef0bb000c5d067eec5c1660', evaluator: '73d6e79755b70d315253c2276d337e0acfe2be97573a2cef2d1b8525a1a2e616', rules: '81e0a444e18bdfb185f6f2d40aa6bbf2d5397a4c85822ef2b4ddf9fcaa874f62', pathfinder: 'b40444abf0bc79eb3dcba63ee3ae46cff8355de58500d08b52596d31862e1838', candidateBuilder: '70b2a54c9ce8e23d66279d572d94c76f41d0fe1ca7f181fc77c8b6632e2a444c', plannerConfig: '8e71d38e5400fc666ef669225d44ed59759b9fa5c78ca280668c4fff875cbd9f', planner: '26ae688e91d9992edf02109f41b7cf205668f2543eb7994863629c5fc3d97e10', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '2dff76ed254fccbbf5d5244587ca6e08b3b914e7914013b6be47086224747b56',
  }))
  it('enthält kein React, Netzwerk, DPS oder eigene Fachregeln', () => { const source = ['types.ts', 'config.ts', 'input-validator.ts', 'start-node-resolver.ts', 'pipeline.ts', 'diagnostics.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/real-passive-pipeline/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|damage per second|\bdps\b/i); expect(source).not.toMatch(/PassiveTargetRule|class MinHeap|Dijkstra/); expect(source).toMatch(/evaluatePassiveTargets/); expect(source).toMatch(/planPassiveTargets/); expect(source).toMatch(/buildPassiveGraph/) })
  it('erzeugt keine deutschen Knotentexte oder ViewModels', () => { const source = read('src/engine/real-passive-pipeline/pipeline.ts'); expect(source).not.toMatch(/[äöüß]/i); expect(source).not.toMatch(/ViewModel|tree-view|components/) })
})
