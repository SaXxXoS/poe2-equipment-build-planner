import { describe, expect, it } from 'vitest'
import type { EquipmentEntry, SkillGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'
import { applyConversions, applyDamageModifiers, collectQuantitativeEffects } from './quantitative-effects'

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
})
