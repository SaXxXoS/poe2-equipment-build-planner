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
    classifier: '2f1423b598efc64740adde8c45c8b19ec30f6488179596201508c9d9e9cf121f', targetConfig: '800cf57d94b19c8512aa46fd10b0473a1fbc7b527d9acd0ddb65158e11996a67', evaluator: 'c44654c1b4c77243bb71e30164a29137dea19ac167cde182f3175e0d1d19a350', rules: '61c1915bbbb3150df1b315f482588326d2ad32fe10021be69f02ae5c1a269991', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', candidateBuilder: 'd96c297a3dfbd573ecb0fe143d90ed870fd033e52e842713123671dda65f9e3b', plannerConfig: '8e71d38e5400fc666ef669225d44ed59759b9fa5c78ca280668c4fff875cbd9f', planner: '67685a50498f85968ec23f84a671502fd105fef9f33147bcbc5b20b7a9ae299b', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '700281cc5fb78b46108f427869e0d8d296fa3ff85ac4126e7a78d49596b839c0',
  }))
  it('enthält kein React, Netzwerk, DPS oder eigene Fachregeln', () => { const source = ['types.ts', 'config.ts', 'input-validator.ts', 'start-node-resolver.ts', 'pipeline.ts', 'diagnostics.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/real-passive-pipeline/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|damage per second|\bdps\b/i); expect(source).not.toMatch(/PassiveTargetRule|class MinHeap|Dijkstra/); expect(source).toMatch(/evaluatePassiveTargets/); expect(source).toMatch(/planPassiveTargets/); expect(source).toMatch(/buildPassiveGraph/) })
  it('erzeugt keine deutschen Knotentexte oder ViewModels', () => { const source = read('src/engine/real-passive-pipeline/pipeline.ts'); expect(source).not.toMatch(/[äöüß]/i); expect(source).not.toMatch(/ViewModel|tree-view|components/) })
})
