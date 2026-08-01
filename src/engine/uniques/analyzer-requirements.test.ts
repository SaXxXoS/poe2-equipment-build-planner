import { describe, expect, it } from 'vitest'
import { analyzeBuild } from '../orchestration/analyze-build'
import { engineModifierFixtures, fixtureA, syntheticUniqueFixtures } from '../fixtures'
import { uniqueAnalyzer } from './analyzer'
import type { AnalyzerContext } from '../common/types'

const context = (): AnalyzerContext => ({ engineVersion: 'test', fixtureMode: true })

describe('Unique-Anforderungen pro Waffenset', () => {
  it('prüft gemeinsame Anforderungen in beiden Waffensets', () => {
    const build = analyzeBuild(fixtureA, context(), engineModifierFixtures)
    const unique = { ...syntheticUniqueFixtures[6], attributeRequirements: { intelligence: 80 } }
    const characterAttributes = {
      ...build.characterAttributes!,
      'set-1': { ...build.characterAttributes!['set-1'], total: { ...build.characterAttributes!['set-1'].total, intelligence: 100 } },
      'set-2': { ...build.characterAttributes!['set-2'], total: { ...build.characterAttributes!['set-2'].total, intelligence: 70 } },
    }
    const result = uniqueAnalyzer.analyzeRanked(build.buildProfile, fixtureA.input, [unique], context(), { characterAttributes }).allCandidates[0]
    expect(result.valid).toBe(false)
    expect(result.violations.some(value => value.code === 'attribute-requirement-intelligence')).toBe(true)
  })

  it('prüft eine set-spezifische Anforderung nur im zugeordneten Set', () => {
    const build = analyzeBuild(fixtureA, context(), engineModifierFixtures)
    const unique = { ...syntheticUniqueFixtures[6], weaponSet: 'set-1' as const, attributeRequirements: { intelligence: 80 } }
    const characterAttributes = {
      ...build.characterAttributes!,
      'set-1': { ...build.characterAttributes!['set-1'], total: { ...build.characterAttributes!['set-1'].total, intelligence: 100 } },
      'set-2': { ...build.characterAttributes!['set-2'], total: { ...build.characterAttributes!['set-2'].total, intelligence: 1 } },
    }
    const result = uniqueAnalyzer.analyzeRanked(build.buildProfile, fixtureA.input, [unique], context(), { characterAttributes }).allCandidates[0]
    expect(result.valid).toBe(true)
  })

  it('blockiert bekannte Anforderungen ohne Attributdaten fail-closed', () => {
    const build = analyzeBuild(fixtureA, context(), engineModifierFixtures)
    const unique = { ...syntheticUniqueFixtures[6], attributeRequirements: { intelligence: 80 } }
    const result = uniqueAnalyzer.analyzeRanked(build.buildProfile, fixtureA.input, [unique], context()).allCandidates[0]
    expect(result.valid).toBe(false)
    expect(result.violations.some(value => value.code === 'attribute-requirements-unknown')).toBe(true)
  })
})
