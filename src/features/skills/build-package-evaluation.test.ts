import { describe, expect, it } from 'vitest'
import type { BuildAnalysis } from '../../engine'
import type { BuildVariantCandidate } from './build-variant-optimizer'
import { evaluateAnalyzedBuildPackage } from './build-package-evaluation'

const candidate: BuildVariantCandidate = {
  skillId: 'skill-main',
  skillName: 'Hauptfertigkeit',
  skillTags: ['spell'],
  weaponType: 'wand',
  weaponLabel: 'Zauberstab',
  mainWeaponSet: 'set-1',
  compatibleSupportIds: ['support-a'],
  affinityScore: 70,
  passiveAffinityScore: 70,
  analyzerScore: 70,
  modeledDps: null,
  damageObjectiveScore: 0,
  numericCoverageStatus: 'unavailable',
  resourceStatus: 'confirmed-usable',
  totalScore: 100,
  reasons: [],
}

const analysis = (skillValid = true): BuildAnalysis => ({
  equipmentAnalysis: { score: { totalScore: 70 } },
  skillAnalysis: {
    allCandidates: [{
      skillId: 'skill-main',
      valid: skillValid,
      totalScore: 80,
      matchedProfileFields: ['mechanics.spell'],
    }],
  },
  supportAnalysis: {
    allCandidates: [{ supportId: 'support-a', valid: true, totalScore: 75 }],
  },
  passiveAnalysis: {
    topDamageCandidates: [{
      valid: true,
      damageScore: 85,
      matchedProfileFields: ['mechanics.spell'],
    }],
  },
  jewelAnalysis: {
    topDamageJewels: [{ valid: true, damageScore: 60, matchedSkillTags: ['spell'] }],
  },
  uniqueAnalysis: {
    topDamageUniques: [{
      valid: true,
      damageScore: 55,
      supportsCurrentBuild: true,
      matchedSkillTags: ['spell'],
      matchedProfileFields: ['mechanics.spell'],
    }],
  },
  rotationAnalysis: {
    validPlans: [{ missingRoles: [] }],
  },
  warnings: [],
} as unknown as BuildAnalysis)

describe('gemeinsame Build-Paketbewertung', () => {
  it('führt die Resultate aller sechs Analyzer und der Ressourcenprüfung zusammen', () => {
    const result = evaluateAnalyzedBuildPackage(candidate, analysis())
    expect(result.status).toBe('coherent')
    expect(result.components).toEqual({
      equipment: 70,
      skill: 80,
      supports: 75,
      passives: 85,
      jewels: 60,
      uniques: 55,
      resources: 100,
      rotation: 100,
    })
    expect(result.totalScore).toBeGreaterThan(0)
  })

  it('blockiert das gesamte Paket, wenn der Hauptskill technisch ungültig ist', () => {
    const result = evaluateAnalyzedBuildPackage(candidate, analysis(false))
    expect(result.status).toBe('blocked')
    expect(result.blockers).toContain('Die Hauptfertigkeit wurde vom Skill Analyzer blockiert.')
  })
  it('kennzeichnet ein aktuell korreliert beobachtetes Paket trotz lokaler Ressourcenlücke als kohärent', () => {
    const result = evaluateAnalyzedBuildPackage({
      ...candidate,
      resourceStatus: 'resource-chain-unknown',
      metaReferenceProfileCount: 9,
    }, analysis())
    expect(result.status).toBe('coherent')
    expect(result.components.resources).toBe(25)
    expect(result.evidence.join(' ')).toContain('9 gepinnten aktuellen Profilen')
  })
  it('rechnet fachfremde Passive- und Unique-Wirkungen nicht dem Paket zu', () => {
    const value = analysis()
    value.passiveAnalysis.topDamageCandidates[0].matchedProfileFields = ['damage.fire']
    value.uniqueAnalysis.topDamageUniques[0].matchedSkillTags = ['attack']
    value.uniqueAnalysis.topDamageUniques[0].matchedProfileFields = ['damage.fire']
    const result = evaluateAnalyzedBuildPackage(candidate, value)
    expect(result.components.passives).toBe(0)
    expect(result.components.uniques).toBe(0)
    expect(result.evidence.join(' ')).toContain('Passive')
    expect(result.evidence.join(' ')).toContain('Uniques')
  })
  it('führt einen reinen Attributmangel ohne vorhandene Ausrüstung als planbare Anforderung', () => {
    const value = analysis(false)
    value.warnings = [{
      blocking: true,
      sourceId: 'skill-main',
      messageKey: 'engine.skill.constraint.skill-attribute-deficit',
    }] as BuildAnalysis['warnings']
    const result = evaluateAnalyzedBuildPackage(candidate, value, {
      allowPlannedEquipmentRequirements: true,
    })
    expect(result.status).not.toBe('blocked')
    expect(result.blockers).not.toContain('engine.skill.constraint.skill-attribute-deficit')
  })
  it('verwendet nach der Baumplanung die reale Passivabdeckung statt des Vorabkandidatenwerts', () => {
    const value = analysis()
    value.passiveAnalysis.topDamageCandidates = []
    value.realPassivePlanning = {
      enabled: true,
      pipelineResult: {
        pointBudget: 80,
        usedPointBudget: 80,
      },
      weaponSetPlanning: {
        set1: {
          pointBudget: 104,
          usedPointBudget: 104,
        },
      },
      profileFeedback: {
        shared: {
          fieldDeltas: [{ field: 'mechanics.spell', delta: 20, sourceNodeIds: ['node-a'] }],
        },
        set1: {
          fieldDeltas: [{ field: 'speed.castSpeedAffinity', delta: 20, sourceNodeIds: ['node-b'] }],
        },
      },
    } as unknown as BuildAnalysis['realPassivePlanning']
    const result = evaluateAnalyzedBuildPackage(candidate, value)
    expect(result.components.passives).toBe(76)
    expect(result.evidence.join(' ')).not.toContain('Passive liefern')
  })
})
