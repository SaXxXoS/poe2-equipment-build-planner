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
    classifier: '900003cf3e6c078b5462db6cf4c5c3c5a16f24ca99013993e34bbf0fac49fe05', targetConfig: '62a2f2bf5e24b41d1e47a3b29dd491571e4b967a849f04a61cad9096808466ca', evaluator: '73d6e79755b70d315253c2276d337e0acfe2be97573a2cef2d1b8525a1a2e616', rules: 'd5c97de48e90d7efee71809f330c3cfcd35de84a933bd2e269af1662a9151b63', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '700281cc5fb78b46108f427869e0d8d296fa3ff85ac4126e7a78d49596b839c0',
  }))
  it('enthält weder React noch Netzwerkzugriffe, DPS oder Textklassifikation', () => { const source = ['types.ts', 'config.ts', 'candidate-builder.ts', 'planner.ts', 'validator.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/passive-planning/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|dps|damage per second/i); expect(source).not.toMatch(/classifyPassive|classifyPassiveText|PassiveTargetRule/); expect(source).toMatch(/findPassivePath/) })
  it('dupliziert keinen Pfadsuchalgorithmus und erzeugt keine deutschen Knotentexte', () => { const planner = read('src/engine/passive-planning/planner.ts'); expect(planner).not.toMatch(/class MinHeap|Dijkstra|neighbourNodeIds/); expect(planner).not.toMatch(/[äöüß]/i) })
})
