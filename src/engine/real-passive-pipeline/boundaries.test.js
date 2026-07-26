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
    classifier: 'dceb74e0bd4f12a3e8f3a913ffeecf2f101db6bf511cbe12bcb9403c1b81ab01', targetConfig: 'b4dd36bd5bb0775c625b890742ad6dcba9842fc035fcc85231286504aebeb68d', evaluator: '4c5e3c34e7b2551779e337604b85f5ddd43f975679053faa84e4f692271965ff', rules: '1b6b84baa95e2b7c0955711fcf8a8c863562cd6f79162d31171e33e9d6e7eee7', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', candidateBuilder: '989cad1205e72dede45b55da11e7b3772f56e69bed58d1b90e9bb1040fb8bc32', plannerConfig: 'd79c8e1cb69b0916780770269788f4dbae36beace377d8b0b35c16da6ddf4cf5', planner: '3355327faef4ae158504426614b663e55eb3f0ea0c05be035c0ebdff4c1f8658', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: 'e94776f0aafb8592d15f4fed375d3c5c69ea61b9d0c61e159fe219c622485def',
  }))
  it('enthält kein React, Netzwerk, DPS oder eigene Fachregeln', () => { const source = ['types.ts', 'config.ts', 'input-validator.ts', 'start-node-resolver.ts', 'pipeline.ts', 'diagnostics.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/real-passive-pipeline/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|damage per second|\bdps\b/i); expect(source).not.toMatch(/PassiveTargetRule|class MinHeap|Dijkstra/); expect(source).toMatch(/evaluatePassiveTargets/); expect(source).toMatch(/planPassiveTargets/); expect(source).toMatch(/buildPassiveGraph/) })
  it('erzeugt keine deutschen Knotentexte oder ViewModels', () => { const source = read('src/engine/real-passive-pipeline/pipeline.ts'); expect(source).not.toMatch(/[äöüß]/i); expect(source).not.toMatch(/ViewModel|tree-view|components/) })
})
