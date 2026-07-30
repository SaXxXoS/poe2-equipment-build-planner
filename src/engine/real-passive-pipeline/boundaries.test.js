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
    classifier: '063c7f2a34a6073148c3dadf4077088dc728e1af9ac7e1b907ffb0d1a9ac80f0', targetConfig: '189f0019789ac2ff2f2207c65e054c03fcf1f163aef0bb000c5d067eec5c1660', evaluator: '73d6e79755b70d315253c2276d337e0acfe2be97573a2cef2d1b8525a1a2e616', rules: '81e0a444e18bdfb185f6f2d40aa6bbf2d5397a4c85822ef2b4ddf9fcaa874f62', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', candidateBuilder: 'd96c297a3dfbd573ecb0fe143d90ed870fd033e52e842713123671dda65f9e3b', plannerConfig: '8e71d38e5400fc666ef669225d44ed59759b9fa5c78ca280668c4fff875cbd9f', planner: '67685a50498f85968ec23f84a671502fd105fef9f33147bcbc5b20b7a9ae299b', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '700281cc5fb78b46108f427869e0d8d296fa3ff85ac4126e7a78d49596b839c0',
  }))
  it('enthält kein React, Netzwerk, DPS oder eigene Fachregeln', () => { const source = ['types.ts', 'config.ts', 'input-validator.ts', 'start-node-resolver.ts', 'pipeline.ts', 'diagnostics.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/real-passive-pipeline/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|damage per second|\bdps\b/i); expect(source).not.toMatch(/PassiveTargetRule|class MinHeap|Dijkstra/); expect(source).toMatch(/evaluatePassiveTargets/); expect(source).toMatch(/planPassiveTargets/); expect(source).toMatch(/buildPassiveGraph/) })
  it('erzeugt keine deutschen Knotentexte oder ViewModels', () => { const source = read('src/engine/real-passive-pipeline/pipeline.ts'); expect(source).not.toMatch(/[äöüß]/i); expect(source).not.toMatch(/ViewModel|tree-view|components/) })
})
