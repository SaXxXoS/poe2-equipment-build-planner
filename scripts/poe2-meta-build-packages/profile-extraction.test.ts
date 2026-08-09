import { describe, expect, it } from 'vitest'
import { extractMainGroup, extractWeapons } from './profile-extraction.mjs'

describe('poe.ninja Profilreduktion', () => {
  it('erkennt alle von der Build-App produktiv unterstuetzten Hauptwaffenklassen', () => {
    const items = [
      { itemData: { typeLine: 'Dusk Wand' } },
      { itemData: { baseType: 'Gelid Staff' } },
      { itemData: { properties: [{ name: 'Sceptre' }] } },
      { itemData: { typeLine: 'Quarterstaff' } },
    ]
    expect(extractWeapons(items)).toEqual(['quarterstaff', 'sceptre', 'staff', 'wand'])
  })

  it('verwechselt einen Quarterstaff nicht mit einem normalen Staff', () => {
    expect(extractWeapons([{ itemData: { typeLine: 'Crackling Quarterstaff' } }]))
      .toEqual(['quarterstaff'])
  })

  it('nimmt die hoechste belegte DPS-Gruppe samt Supports und eingebetteten Skills', () => {
    expect(extractMainGroup([
      {
        dps: [{ name: 'Spark', dps: 100 }],
        allGems: [
          { name: 'Spark', itemData: { support: false } },
          { name: 'Arcane Tempo', itemData: { support: true } },
        ],
      },
      {
        dps: [{ name: 'Comet', dps: 250 }],
        allGems: [
          { name: 'Comet', itemData: { support: false } },
          { name: 'Frost Wall', itemData: { support: false } },
          { name: 'Cold Mastery', itemData: { support: true } },
        ],
      },
    ])).toMatchObject({
      name: 'Comet',
      dps: 250,
      supports: ['Cold Mastery'],
      activeSkills: ['Comet', 'Frost Wall'],
    })
  })
})
