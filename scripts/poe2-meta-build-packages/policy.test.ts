import { describe, expect, it } from 'vitest'
import {
  selectMetaRefreshProfileIds,
  shouldPromoteMetaProduct,
} from './policy.mjs'

describe('poe2 Meta-Build-Paket-Generatorpolitik', () => {
  it('verteilt einen Wiederaufnahmebatch über Aszendenzen und bevorzugt noch nicht versuchte Profile', () => {
    const profiles = [
      { expectedAscendancy: 'A', rank: 1, url: 'a-1' },
      { expectedAscendancy: 'A', rank: 2, url: 'a-2' },
      { expectedAscendancy: 'B', rank: 1, url: 'b-1' },
      { expectedAscendancy: 'B', rank: 2, url: 'b-2' },
    ]
    const previous = new Map([
      ['a-1', { attemptCount: 1 }],
      ['b-1', { attemptCount: 1 }],
    ])
    expect([...selectMetaRefreshProfileIds({
      pendingProfiles: profiles,
      previousObservations: previous,
      ascendancyOrder: ['A', 'B'],
      maximumNewFetches: 2,
      profileIdFor: value => value.url,
    })]).toEqual(['a-2', 'b-2'])
  })

  it('lässt bei einem kleineren Batch spätere Aszendenzen nicht verhungern', () => {
    const profiles = [
      { expectedAscendancy: 'A', rank: 1, url: 'a-1' },
      { expectedAscendancy: 'A', rank: 2, url: 'a-2' },
      { expectedAscendancy: 'B', rank: 1, url: 'b-1' },
      { expectedAscendancy: 'B', rank: 2, url: 'b-2' },
      { expectedAscendancy: 'C', rank: 1, url: 'c-1' },
      { expectedAscendancy: 'C', rank: 2, url: 'c-2' },
    ]
    const previous = new Map([
      ['a-1', { attemptCount: 1 }],
      ['b-1', { attemptCount: 1 }],
    ])
    expect([...selectMetaRefreshProfileIds({
      pendingProfiles: profiles,
      previousObservations: previous,
      ascendancyOrder: ['A', 'B', 'C'],
      maximumNewFetches: 2,
      profileIdFor: value => value.url,
    })]).toEqual(['c-1', 'a-2'])
  })

  it('wiederholt eine vorübergehende Ratenbegrenzung vor neuen und dauerhaft fehlenden Profilen', () => {
    const profiles = [
      { expectedAscendancy: 'A', rank: 1, url: 'rate-limited' },
      { expectedAscendancy: 'B', rank: 1, url: 'new' },
      { expectedAscendancy: 'C', rank: 1, url: 'missing' },
    ]
    const previous = new Map([
      ['rate-limited', { attemptCount: 1, blockReasons: ['HTTP 429'] }],
      ['missing', { attemptCount: 1, blockReasons: ['HTTP 404'] }],
    ])
    expect([...selectMetaRefreshProfileIds({
      pendingProfiles: profiles,
      previousObservations: previous,
      ascendancyOrder: ['A', 'B', 'C'],
      maximumNewFetches: 3,
      profileIdFor: value => value.url,
    })]).toEqual(['rate-limited', 'new', 'missing'])
  })

  it('laesst einen dreimal begrenzten Charakter neue Profile nicht dauerhaft blockieren', () => {
    const profiles = [
      { expectedAscendancy: 'A', rank: 1, url: 'exhausted' },
      { expectedAscendancy: 'B', rank: 1, url: 'new' },
    ]
    const previous = new Map([
      ['exhausted', { attemptCount: 3, blockReasons: ['HTTP 429'] }],
    ])
    expect([...selectMetaRefreshProfileIds({
      pendingProfiles: profiles,
      previousObservations: previous,
      ascendancyOrder: ['A', 'B'],
      maximumNewFetches: 2,
      profileIdFor: value => value.url,
    })]).toEqual(['new', 'exhausted'])
  })

  it('ersetzt einen validierten alten Produktpin nicht durch einen leeren neuen Snapshot', () => {
    const previous = { source: { version: 'old' }, profileCount: 53, packageCount: 10 }
    const candidate = { source: { version: 'new' }, profileCount: 0, packageCount: 0 }
    expect(shouldPromoteMetaProduct(previous, candidate)).toBe(false)
  })

  it('promotet einen neuen Snapshot erst bei mindestens gleicher Produktabdeckung', () => {
    const previous = { source: { version: 'old' }, profileCount: 53, packageCount: 10 }
    expect(shouldPromoteMetaProduct(previous, {
      source: { version: 'new' }, profileCount: 52, packageCount: 12,
    })).toBe(false)
    expect(shouldPromoteMetaProduct(previous, {
      source: { version: 'new' }, profileCount: 53, packageCount: 10,
    })).toBe(true)
  })

  it('laesst auch denselben Snapshot niemals auf geringere Coverage zurueckfallen', () => {
    const previous = { source: { version: 'same' }, profileCount: 53, packageCount: 10 }
    expect(shouldPromoteMetaProduct(previous, {
      source: { version: 'same' }, profileCount: 2, packageCount: 1,
    })).toBe(false)
    expect(shouldPromoteMetaProduct(previous, {
      source: { version: 'same' }, profileCount: 53, packageCount: 10,
    })).toBe(true)
  })
})
