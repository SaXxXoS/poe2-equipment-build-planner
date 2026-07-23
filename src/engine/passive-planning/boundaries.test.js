/* global URL */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
const root = new URL('../../../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const sha = path => createHash('sha256').update(read(path)).digest('hex')

describe('Passive-Planning Modulgrenzen', () => {
  it('lässt Targeting, Pathfinder, Analyzer und Orchestrator unverändert', () => expect({
    classifier: sha('src/engine/passive-targeting/classifier.ts'), targetConfig: sha('src/engine/passive-targeting/config.ts'), evaluator: sha('src/engine/passive-targeting/evaluator.ts'), rules: sha('src/engine/passive-targeting/rules.ts'), pathfinder: sha('src/engine/passive-pathfinding/pathfinder.ts'), analyzer: sha('src/engine/passives/analyzer.ts'), orchestrator: sha('src/engine/orchestration/analyze-build.ts'),
  }).toEqual({
    classifier: 'dceb74e0bd4f12a3e8f3a913ffeecf2f101db6bf511cbe12bcb9403c1b81ab01', targetConfig: 'b4dd36bd5bb0775c625b890742ad6dcba9842fc035fcc85231286504aebeb68d', evaluator: '708d05db9fc03d2f8bf553dda922d42a4d19e28c3a3e3751dffd002058f2a80e', rules: '1b6b84baa95e2b7c0955711fcf8a8c863562cd6f79162d31171e33e9d6e7eee7', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '7d0c8338ebc44b5fbc0c7910ae28afa74628287f86087ef58bd186c4d70041b2',
  }))
  it('enthält weder React noch Netzwerkzugriffe, DPS oder Textklassifikation', () => { const source = ['types.ts', 'config.ts', 'candidate-builder.ts', 'planner.ts', 'validator.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/passive-planning/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|dps|damage per second/i); expect(source).not.toMatch(/classifyPassive|classifyPassiveText|PassiveTargetRule/); expect(source).toMatch(/findPassivePath/) })
  it('dupliziert keinen Pfadsuchalgorithmus und erzeugt keine deutschen Knotentexte', () => { const planner = read('src/engine/passive-planning/planner.ts'); expect(planner).not.toMatch(/class MinHeap|Dijkstra|neighbourNodeIds/); expect(planner).not.toMatch(/[äöüß]/i) })
})
