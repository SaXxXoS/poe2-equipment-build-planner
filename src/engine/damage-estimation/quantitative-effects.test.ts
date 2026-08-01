import { describe, expect, it } from 'vitest'
import type { EquipmentEntry, SkillGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyConversions, applyDamageModifiers, applyGainAsExtra, applyRageMoreDamageModifiers, collectQuantitativeEffects, collectRageScaledDamageModifiers, collectSkillConversions } from './quantitative-effects'

const skill: SkillGemDefinition = {
  id: 'spark',
  displayNameDe: 'Funke',
  nameEn: 'Spark',
  tags: ['spell', 'projectile', 'lightning'],
  damageTypes: ['lightning'],
  dataVersion: 'test',
  source: 'local-placeholder',
  status: 'verified',
}
const tree = {
  metadata: { releaseTag: 'test' },
  connections: [],
  nodes: [
    { id: 'shared', name: { sourceText: 'Lightning Damage' }, stats: [{ sourceText: '20% increased [Lightning|Lightning] Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'asc', name: { sourceText: 'Cast Speed' }, stats: [{ sourceText: '10% increased Cast Speed' }], nodeType: 'ascendancy', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: 'Stormweaver', isJewelSocket: false },
    { id: 'extra', name: { sourceText: 'Extra Lightning' }, stats: [{ sourceText: '[Gain] 12% of [Physical] Damage as Extra [Lightning] Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'spell-more', name: { sourceText: 'Arcane Force' }, stats: [{ sourceText: '12% more Spell Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'conditional-damage', name: { sourceText: 'Conditional Force' }, stats: [{ sourceText: '40% increased Lightning Damage while on Full Life' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'rage-physical', name: { sourceText: 'Bestial Rage' }, stats: [{ sourceText: 'Every 10 [Rage|Rage] also grants 12% increased [Physical|Physical] Damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'rage-spell-more', name: { sourceText: 'Druidic Champion' }, stats: [{ sourceText: 'Every 2 [Rage|Rage] also grants 1% more Spell damage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
    { id: 'rage-ambiguous', name: { sourceText: 'Unknown Rage' }, stats: [{ sourceText: 'Gain lots of Damage for every Rage' }], nodeType: 'normal', isClassStart: false, classStartIndex: null, isAscendancyStart: false, ascendancyId: null, isJewelSocket: false },
  ],
} as RealPassiveTree
const planning = {
  pipelineResult: { allocatedNodeIds: ['shared'] },
  ascendancyPlanning: { allocatedNodeIds: ['asc'] },
} as unknown as RealPassivePlanningIntegrationResult

describe('quantitative Wirkungskette', () => {
  it('liest nur numerisch eindeutige belegte Baum- und Aszendenzzeilen', () => {
    const result = collectQuantitativeEffects({ equipment: [], skill, passiveTree: tree, realPassivePlanning: planning, weaponSet: 'set-1' })
    expect(result.damageModifiers).toEqual([expect.objectContaining({ source: 'passive', percent: 20, appliesTo: ['lightning'] })])
    expect(result.speedModifiers).toEqual([expect.objectContaining({ source: 'ascendancy', percent: 10 })])
  })

  it('wendet strukturierte Mehr-Multiplikatoren getrennt an und blockiert Bedingungen', () => {
    const result = collectQuantitativeEffects({
      equipment: [],
      skill,
      passiveTree: tree,
      realPassivePlanning: {
        pipelineResult: { allocatedNodeIds: ['shared', 'spell-more', 'conditional-damage'] },
      } as unknown as RealPassivePlanningIntegrationResult,
      weaponSet: 'set-1',
    })
    expect(result.damageModifiers).toEqual([
      expect.objectContaining({ sourceId: 'shared', percent: 20, kind: 'increased' }),
      expect.objectContaining({ sourceId: 'spell-more', percent: 12, kind: 'more' }),
    ])
    expect(applyDamageModifiers(
      [{ type: 'lightning', minimum: 100, maximum: 100 }],
      [],
      result.damageModifiers,
    )).toEqual([{ type: 'lightning', minimum: 134.4, maximum: 134.4 }])
  })

  it('erhält die Schadenssumme bei einer bestätigten Umwandlung', () => {
    const result = applyConversions([{ type: 'physical', minimum: 100, maximum: 200 }], [{ id: 'conversion', source: 'equipment', sourceId: 'item', from: 'physical', to: 'fire', percent: 40 }])
    expect(result).toEqual([
      { type: 'physical', minimum: 60, maximum: 120 },
      { type: 'fire', minimum: 40, maximum: 80 },
    ])
  })

  it('wendet auf umgewandelten Schaden belegte Ursprungs- und Zielskalierung an', () => {
    const result = applyDamageModifiers(
      [{ type: 'physical', minimum: 100, maximum: 100 }],
      [{ id: 'conversion', source: 'equipment', sourceId: 'item', from: 'physical', to: 'fire', percent: 100 }],
      [
        { id: 'physical', source: 'passive', sourceId: 'p1', label: 'physical', percent: 20, appliesTo: ['physical'] },
        { id: 'fire', source: 'equipment', sourceId: 'item', label: 'fire', percent: 30, appliesTo: ['fire'] },
      ],
    )
    expect(result).toEqual([{ type: 'fire', minimum: 150, maximum: 150 }])
  })

  it('erhält Gain-as-extra getrennt von Umwandlung und skaliert mit Quelle und Ziel', () => {
    const gained = applyGainAsExtra(
      [{ type: 'physical', minimum: 100, maximum: 100 }],
      [{ id: 'gain', source: 'passive', sourceId: 'node', from: 'physical', to: 'lightning', percent: 20 }],
    )
    expect(gained).toEqual([
      { type: 'physical', minimum: 100, maximum: 100 },
      { type: 'lightning', minimum: 20, maximum: 20 },
    ])
    expect(applyDamageModifiers(
      [{ type: 'physical', minimum: 100, maximum: 100 }],
      [],
      [
        { id: 'physical', source: 'passive', sourceId: 'p1', label: 'physical', percent: 20, appliesTo: ['physical'] },
        { id: 'lightning', source: 'passive', sourceId: 'p2', label: 'lightning', percent: 30, appliesTo: ['lightning'] },
      ],
      [{ id: 'gain', source: 'passive', sourceId: 'node', from: 'physical', to: 'lightning', percent: 20 }],
    )).toEqual([
      { type: 'physical', minimum: 120, maximum: 120 },
      { type: 'lightning', minimum: 30, maximum: 30 },
    ])
  })

  it('führt Umwandlungen in der PoE-Reihenfolge mehrstufig aus und erhält die Herkunftsskalierung', () => {
    const conversions = [
      { id: 'p-l', source: 'passive' as const, sourceId: 'p1', from: 'physical' as const, to: 'lightning' as const, percent: 100 },
      { id: 'l-c', source: 'passive' as const, sourceId: 'p2', from: 'lightning' as const, to: 'cold' as const, percent: 50 },
      { id: 'c-f', source: 'passive' as const, sourceId: 'p3', from: 'cold' as const, to: 'fire' as const, percent: 100 },
    ]
    expect(applyConversions([{ type: 'physical', minimum: 100, maximum: 100 }], conversions)).toEqual([
      { type: 'fire', minimum: 50, maximum: 50 },
      { type: 'lightning', minimum: 50, maximum: 50 },
    ])
    expect(applyDamageModifiers(
      [{ type: 'physical', minimum: 100, maximum: 100 }],
      conversions,
      [{ id: 'physical', source: 'passive', sourceId: 'p4', label: 'physical', percent: 20, appliesTo: ['physical'] }],
    )).toEqual([
      { type: 'fire', minimum: 60, maximum: 60 },
      { type: 'lightning', minimum: 60, maximum: 60 },
    ])
  })

  it('ignoriert rückwärts gerichtete Konversionsketten fail-closed', () => {
    expect(applyConversions(
      [{ type: 'fire', minimum: 100, maximum: 100 }],
      [{ id: 'backwards', source: 'passive', sourceId: 'p1', from: 'fire', to: 'cold', percent: 100 }],
    )).toEqual([{ type: 'fire', minimum: 100, maximum: 100 }])
  })

  it('liest intrinsische Skillumwandlung aus der strukturierten Stufenzeile', () => {
    expect(collectSkillConversions('lightning-arrow', {
      'active_skill_base_physical_damage_%_to_convert_to_lightning': 80,
    })).toEqual([expect.objectContaining({
      source: 'skill', sourceId: 'lightning-arrow', from: 'physical', to: 'lightning', percent: 80,
    })])
  })

  it('gibt Skillumwandlung Vorrang und wendet globale Umwandlung nur auf den Rest an', () => {
    expect(applyConversions(
      [{ type: 'physical', minimum: 100, maximum: 100 }],
      [
        { id: 'skill', source: 'skill', sourceId: 'skill', from: 'physical', to: 'lightning', percent: 80 },
        { id: 'global', source: 'passive', sourceId: 'node', from: 'physical', to: 'fire', percent: 50 },
      ],
    )).toEqual([
      { type: 'physical', minimum: 10, maximum: 10 },
      { type: 'fire', minimum: 10, maximum: 10 },
      { type: 'lightning', minimum: 80, maximum: 80 },
    ])
  })

  it('importiert ausschließlich unbedingte exakte Gain-as-extra-Zeilen aus vergebenen Knoten', () => {
    const result = collectQuantitativeEffects({
      equipment: [],
      skill,
      passiveTree: tree,
      realPassivePlanning: {
        pipelineResult: { allocatedNodeIds: ['extra'] },
      } as unknown as RealPassivePlanningIntegrationResult,
      weaponSet: 'set-1',
    })
    expect(result.gainAsExtra).toEqual([
      expect.objectContaining({ sourceId: 'extra', from: 'physical', to: 'lightning', percent: 12 }),
    ])
  })

  it('wendet lokale Waffenwerte bei erfassten Endwerten nicht ein zweites Mal an', () => {
    const equipment: EquipmentEntry[] = [{
      id: 'weapon',
      slotId: 'slot-weapon-set-1-left',
      itemClassId: 'Spears',
      modifierValues: [{ id: 'local-speed', modifierId: 'local-speed', value: 20, isLocal: true, statValues: [{ statId: 'attack_speed_+%', value: 20 }] }],
      weaponStats: { physicalDamage: { minimum: 10, maximum: 20 }, attacksPerSecond: 1.5 },
    }]
    const attack = { ...skill, tags: ['attack', 'physical'] as SkillGemDefinition['tags'], damageTypes: ['physical'] as SkillGemDefinition['damageTypes'] }
    expect(collectQuantitativeEffects({ equipment, skill: attack, weaponSet: 'set-1' }).speedModifiers).toEqual([])
  })

  it('wertet exakt belegte zusätzliche Wutskalierungen mit dem wirksamen Wutstand aus', () => {
    const spell = { ...skill, tags: ['spell', 'physical'] as SkillGemDefinition['tags'], damageTypes: ['physical'] as SkillGemDefinition['damageTypes'] }
    const effects = collectRageScaledDamageModifiers({
      passiveTree: tree,
      realPassivePlanning: {
        pipelineResult: { allocatedNodeIds: ['rage-physical', 'rage-spell-more', 'rage-ambiguous'] },
      } as unknown as RealPassivePlanningIntegrationResult,
      weaponSet: 'set-1',
      skill: spell,
      effectiveRageEffect: 30,
    })
    expect(effects).toEqual([
      expect.objectContaining({ sourceId: 'rage-physical', kind: 'increased', percent: 36, rageDivisor: 10 }),
      expect.objectContaining({ sourceId: 'rage-spell-more', kind: 'more', percent: 15, rageDivisor: 2 }),
    ])
    expect(applyRageMoreDamageModifiers(
      [{ type: 'physical', minimum: 136, maximum: 136 }],
      effects,
    )).toEqual([{ type: 'physical', minimum: 156.4, maximum: 156.4 }])
  })

  it('blockiert unpassende oder nicht exakt strukturierte Wuttexte fail-closed', () => {
    const attack = { ...skill, tags: ['attack', 'physical'] as SkillGemDefinition['tags'], damageTypes: ['physical'] as SkillGemDefinition['damageTypes'] }
    expect(collectRageScaledDamageModifiers({
      passiveTree: tree,
      realPassivePlanning: {
        pipelineResult: { allocatedNodeIds: ['rage-spell-more', 'rage-ambiguous'] },
      } as unknown as RealPassivePlanningIntegrationResult,
      weaponSet: 'set-1',
      skill: attack,
      effectiveRageEffect: 30,
    })).toEqual([])
  })
})
