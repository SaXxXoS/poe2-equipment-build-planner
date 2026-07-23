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
    classifier: 'dceb74e0bd4f12a3e8f3a913ffeecf2f101db6bf511cbe12bcb9403c1b81ab01', targetConfig: 'b4dd36bd5bb0775c625b890742ad6dcba9842fc035fcc85231286504aebeb68d', evaluator: '708d05db9fc03d2f8bf553dda922d42a4d19e28c3a3e3751dffd002058f2a80e', rules: '1b6b84baa95e2b7c0955711fcf8a8c863562cd6f79162d31171e33e9d6e7eee7', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', candidateBuilder: 'e020e227e6b2827484e431530bf275090a8935f185eb96315a0efa6ff40d0344', plannerConfig: 'bc014a760c242678249559f5fbc04c8e30680948d9fa86a97479ef97ec91963d', planner: '52751cd5b37e76d83b2a46dcca2ed82eede2268bde8db2327757dc8cbfa9ddaf', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '7d0c8338ebc44b5fbc0c7910ae28afa74628287f86087ef58bd186c4d70041b2',
  }))
  it('enthält kein React, Netzwerk, DPS oder eigene Fachregeln', () => { const source = ['types.ts', 'config.ts', 'input-validator.ts', 'start-node-resolver.ts', 'pipeline.ts', 'diagnostics.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/real-passive-pipeline/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|damage per second|\bdps\b/i); expect(source).not.toMatch(/PassiveTargetRule|class MinHeap|Dijkstra/); expect(source).toMatch(/evaluatePassiveTargets/); expect(source).toMatch(/planPassiveTargets/); expect(source).toMatch(/buildPassiveGraph/) })
  it('erzeugt keine deutschen Knotentexte oder ViewModels', () => { const source = read('src/engine/real-passive-pipeline/pipeline.ts'); expect(source).not.toMatch(/[äöüß]/i); expect(source).not.toMatch(/ViewModel|tree-view|components/) })
})
