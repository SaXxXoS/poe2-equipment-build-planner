import { describe, expect, it } from 'vitest'
import { pinnedReferenceSnapshot } from './reference-snapshot.mjs'

describe('pinnedReferenceSnapshot', () => {
  it('keeps all batches on the version stored with the reference list', () => {
    expect(pinnedReferenceSnapshot({
      source: {
        league: 'Runes of Aldur',
        leagueUrl: 'runesofaldur',
        version: 'pinned-20260809',
        snapshotName: 'runes-of-aldur',
        passiveTree: 'PassiveTree-0.5',
      },
    }, 'runesofaldur')).toEqual({
      name: 'Runes of Aldur',
      url: 'runesofaldur',
      version: 'pinned-20260809',
      snapshotName: 'runes-of-aldur',
      passiveTree: 'PassiveTree-0.5',
    })
  })

  it('blocks a missing or mismatched source pin', () => {
    expect(() => pinnedReferenceSnapshot({
      source: {
        leagueUrl: 'other-league',
        version: 'unstable',
        snapshotName: 'other',
      },
    }, 'runesofaldur')).toThrow('Kein gepinnter Referenz-Snapshot')
  })
})
