import { describe, expect, it } from 'vitest'
import { evaluateBaseRequirements } from './base-requirements'

const base = {
  requiredLevel: 70,
  requirements: { strength: 30, dexterity: 80, intelligence: null },
}

describe('Basisanforderungen', () => {
  it('bestätigt nur vollständig erfüllte Level- und Attributanforderungen', () => {
    expect(evaluateBaseRequirements(base, 70, { strength: 30, dexterity: 80, intelligence: 7 }).status).toBe('met')
    expect(evaluateBaseRequirements(base, 69, { strength: 100, dexterity: 100, intelligence: 100 }).status).toBe('blocked-level')
    expect(evaluateBaseRequirements(base, 70, { strength: 30, dexterity: 79, intelligence: 100 })).toMatchObject({
      status: 'blocked-attributes',
      missing: { dexterity: 1 },
    })
  })

  it('blockiert konkrete Vorschläge ohne belegten Attributstand fail-closed', () => {
    expect(evaluateBaseRequirements(base, 90, undefined).status).toBe('blocked-unknown-attributes')
  })
})
