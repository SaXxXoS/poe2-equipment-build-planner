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
    classifier: '063c7f2a34a6073148c3dadf4077088dc728e1af9ac7e1b907ffb0d1a9ac80f0', targetConfig: '189f0019789ac2ff2f2207c65e054c03fcf1f163aef0bb000c5d067eec5c1660', evaluator: '73d6e79755b70d315253c2276d337e0acfe2be97573a2cef2d1b8525a1a2e616', rules: '81e0a444e18bdfb185f6f2d40aa6bbf2d5397a4c85822ef2b4ddf9fcaa874f62', pathfinder: 'f318ebb2c62ed80fba84f190ce93eb9d2a95fd93ebfdf2db5e7e3d6fc0bfb41f', analyzer: '28d8432549c7bf0bf33a1a078d8ab2386006a93428018fe56b4a5801fe176a67', orchestrator: '2dff76ed254fccbbf5d5244587ca6e08b3b914e7914013b6be47086224747b56',
  }))
  it('enthält weder React noch Netzwerkzugriffe, DPS oder Textklassifikation', () => { const source = ['types.ts', 'config.ts', 'candidate-builder.ts', 'planner.ts', 'validator.ts', 'fixtures.ts', 'index.ts'].map(name => read(`src/engine/passive-planning/${name}`)).join('\n'); expect(source).not.toMatch(/from ['"]react|fetch\(|XMLHttpRequest|WebSocket|https?:\/\/|dps|damage per second/i); expect(source).not.toMatch(/classifyPassive|classifyPassiveText|PassiveTargetRule/); expect(source).toMatch(/findPassivePath/) })
  it('dupliziert keinen Pfadsuchalgorithmus und erzeugt keine deutschen Knotentexte', () => { const planner = read('src/engine/passive-planning/planner.ts'); expect(planner).not.toMatch(/class MinHeap|Dijkstra|neighbourNodeIds/); expect(planner).not.toMatch(/[äöüß]/i) })
})
