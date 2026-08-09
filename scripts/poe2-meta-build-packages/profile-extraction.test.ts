import { describe, expect, it } from 'vitest'
import {
  extractMainGroup,
  extractProfileSkillLoadout,
  extractWeapons,
} from './profile-extraction.mjs'

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

  it('erhaelt die vollstaendige reduzierte Skillgruppenstruktur eines Profils', () => {
    const loadout = extractProfileSkillLoadout([
      {
        dps: [{ name: 'Spark', dps: 500 }],
        allGems: [
          { name: 'Spark', itemData: { support: false } },
          { name: 'Arcane Tempo', itemData: { support: true } },
        ],
      },
      {
        dps: [{ name: 'Orb of Storms', dps: 120 }],
        allGems: [
          { name: 'Orb of Storms', itemData: { support: false } },
          { name: 'Overabundance', itemData: { support: true } },
        ],
      },
      {
        allGems: [
          { name: 'Cast on Critical', itemData: { support: false } },
          { name: 'Comet', itemData: { support: false } },
          { name: 'Energy Retention', itemData: { support: true } },
        ],
      },
    ])

    expect(loadout.main?.name).toBe('Spark')
    expect(loadout.groups).toEqual([
      expect.objectContaining({
        groupIndex: 0,
        primarySkill: 'Spark',
        activeSkills: ['Spark'],
        supports: ['Arcane Tempo'],
        relationship: 'main-group',
        weaponSet: 'unknown',
      }),
      expect.objectContaining({
        groupIndex: 1,
        primarySkill: 'Orb of Storms',
        activeSkills: ['Orb of Storms'],
        supports: ['Overabundance'],
        relationship: 'same-profile-group',
      }),
      expect.objectContaining({
        groupIndex: 2,
        primarySkill: 'Cast on Critical',
        activeSkills: ['Cast on Critical', 'Comet'],
        supports: ['Energy Retention'],
        relationship: 'same-profile-group',
      }),
    ])
  })
})
