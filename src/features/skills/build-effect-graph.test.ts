import { describe, expect, it } from 'vitest'
import type { SkillGemDefinition, SupportGemDefinition } from '../../domain'
import { buildEffectGraph } from './build-effect-graph'

const metadata = {
  dataVersion: 'test',
  source: 'local-placeholder' as const,
  status: 'placeholder' as const,
}
const skill = (id: string, tags: SkillGemDefinition['tags'], extra: Partial<SkillGemDefinition> = {}): SkillGemDefinition => ({
  ...metadata, id, nameEn: id, displayNameDe: id, tags, enabled: true, ...extra,
})
const support = (id: string): SupportGemDefinition => ({
  ...metadata, id, displayNameDe: id, tags: [], requiredTags: [], excludedTags: [],
  ownTags: [], selectionOnly: true, enabled: true,
})

describe('gemeinsamer PoE2-Wirkungsgraph', () => {
  it('verbindet Waffe, Support, Setup und Aszendenz in einem gültigen Paket', () => {
    const main = skill('spark', ['spell', 'projectile', 'lightning'], {
      nameEn: 'Spark',
      recommendedSupportIds: ['support'],
    })
    const graph = buildEffectGraph({
      mainSkill: main,
      mainWeapon: 'wand',
      supports: [support('support')],
      setupSkill: skill('orb', ['spell', 'area', 'lightning'], { nameEn: 'Orb of Storms' }),
      ascendancyId: 'ascendancy-official-Sorceress1',
    })
    expect(graph.blockers).toEqual([])
    expect(graph.edges.map(edge => edge.kind)).toEqual([
      'skill-weapon',
      'skill-support',
      'main-setup',
      'ascendancy-skill',
    ])
  })

  it('blockiert eine falsche Waffe oder einen nicht zugeordneten Support', () => {
    const main = skill('bow-skill', ['attack', 'projectile'], {
      requiredWeaponTypes: ['bow'],
      recommendedSupportIds: ['other'],
    })
    const graph = buildEffectGraph({
      mainSkill: main,
      mainWeapon: 'mace',
      supports: [support('support')],
      ascendancyId: 'missing',
    })
    expect(graph.status).toBe('blocked')
    expect(graph.blockers.length).toBe(2)
  })

  it('akzeptiert eine gepinnte Mehrprofil-Beziehung als Paketbeleg, ohne eine freie Wirkungsregel zu erfinden', () => {
    const graph = buildEffectGraph({
      mainSkill: skill('twister', ['attack', 'projectile'], {
        nameEn: 'Twister',
        requiredWeaponTypes: ['spear'],
      }),
      mainWeapon: 'spear',
      supports: [],
      setupSkill: skill('spear-throw', ['attack', 'projectile'], { nameEn: 'Spear Throw' }),
      setupRelationship: {
        evidence: 'multi-profile-correlated-exact',
        reason: 'Vier gepinnte Profile belegen beide Fertigkeiten im selben Build.',
        ruleId: 'meta-package:test',
      },
      ascendancyId: 'ascendancy-official-Huntress2',
    })
    expect(graph.blockers).toEqual([])
    expect(graph.edges.find(edge => edge.kind === 'main-setup')).toMatchObject({
      productive: true,
      evidence: 'multi-profile-correlated-exact',
      ruleId: 'meta-package:test',
    })
  })

  it('blockiert eine Meta-Fertigkeit ohne eingebettete Nutzlast', () => {
    const graph = buildEffectGraph({
      mainSkill: skill('meta', ['spell'], { nameEn: 'Cast on Critical', metaSocketRule: 'spell' }),
      mainWeapon: 'wand',
      supports: [],
      ascendancyId: 'missing',
    })
    expect(graph.status).toBe('blocked')
    expect(graph.blockers).toContain('Die auslösende Meta-Fertigkeit besitzt keine kompatible eingebettete aktive Fertigkeit.')
  })
})
