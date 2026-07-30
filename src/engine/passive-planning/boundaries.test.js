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
    classifier: 'dceb74e0bd4f12a3e8f3a913ffeecf2f101db6bf511cbe12bcb9403c1b81ab01', targetConfig: '2ebf4a2e3ba0182a78a2f64e7d98ceecf92bf065f3f813578dbc554ba1e0e364', evaluator: 'c44654c1b4c77243bb71e30164a29137dea19ac167cde182f3175e0d1d19a350', rules: '9c1271ca17df57d5a05ad6626d1b7f06ba2e681be6c3ffed51ad156556acd58c', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '700281cc5fb78b46108f427869e0d8d296fa3ff85ac4126e7a78d49596b839c0',
  }))
  it('enthält weder React noch Netzwerkzugriffe, DPS oder Textklassifikation', () => { const source = ['types.ts', 'config.ts', 'candidate-builder.ts', 'planner.ts', 'validator.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/passive-planning/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|dps|damage per second/i); expect(source).not.toMatch(/classifyPassive|classifyPassiveText|PassiveTargetRule/); expect(source).toMatch(/findPassivePath/) })
  it('dupliziert keinen Pfadsuchalgorithmus und erzeugt keine deutschen Knotentexte', () => { const planner = read('src/engine/passive-planning/planner.ts'); expect(planner).not.toMatch(/class MinHeap|Dijkstra|neighbourNodeIds/); expect(planner).not.toMatch(/[äöüß]/i) })
})
