import type {
  SkillGemDefinition,
  SkillRole,
  SupportGemDefinition,
  SyntheticWeaponType,
} from '../../domain'
import { isCompatibleEmbeddedSkill, resolvedMetaSocketRule } from './meta-skills'
import { derivedAscendancyAffinity } from './ascendancy-tree-affinity'
import {
  evaluateSkillInteraction,
  evaluateSkillWeaponCompatibility,
  evaluateSupportInteraction,
  type SkillInteractionEvidence,
} from './poe2-interaction-rules'

export type BuildEffectEdgeKind =
  | 'skill-weapon'
  | 'skill-support'
  | 'main-setup'
  | 'meta-payload'
  | 'ascendancy-skill'

export interface BuildEffectEdge {
  fromId: string
  toId: string
  kind: BuildEffectEdgeKind
  evidence: SkillInteractionEvidence | 'structured-derived-with-curated-fallback' | 'fallback-curated' | 'unresolved'
  productive: boolean
  reason: string
  ruleId: string
}

export interface BuildEffectGraph {
  status: 'coherent' | 'limited' | 'blocked'
  edges: BuildEffectEdge[]
  blockers: string[]
  unresolved: string[]
  productiveEdgeCount: number
}

export function buildEffectGraph(input: {
  mainSkill: SkillGemDefinition
  mainWeapon: SyntheticWeaponType
  supports: SupportGemDefinition[]
  setupSkill?: SkillGemDefinition
  embeddedSkills?: SkillGemDefinition[]
  ascendancyId: string
  role?: SkillRole
}): BuildEffectGraph {
  const edges: BuildEffectEdge[] = []
  const blockers: string[] = []
  const unresolved: string[] = []
  const append = (edge: BuildEffectEdge) => {
    edges.push(edge)
    if (!edge.productive) blockers.push(edge.reason)
  }

  const weapon = evaluateSkillWeaponCompatibility(input.mainSkill, input.mainWeapon)
  append({
    fromId: input.mainSkill.id,
    toId: `weapon:${input.mainWeapon}`,
    kind: 'skill-weapon',
    evidence: weapon.evidence,
    productive: weapon.status === 'productive',
    reason: weapon.reason,
    ruleId: weapon.ruleId,
  })

  for (const support of input.supports) {
    const relation = evaluateSupportInteraction(
      input.mainSkill,
      support,
      input.mainWeapon,
      input.role ?? 'main',
    )
    append({
      fromId: support.id,
      toId: input.mainSkill.id,
      kind: 'skill-support',
      evidence: relation.evidence,
      productive: relation.status === 'productive',
      reason: relation.reason,
      ruleId: relation.ruleId,
    })
  }

  if (input.setupSkill) {
    const relation = evaluateSkillInteraction(input.mainSkill, input.setupSkill)
    append({
      fromId: input.setupSkill.id,
      toId: input.mainSkill.id,
      kind: 'main-setup',
      evidence: relation.evidence,
      productive: relation.status === 'productive',
      reason: relation.reason,
      ruleId: relation.ruleId,
    })
  }

  if (resolvedMetaSocketRule(input.mainSkill)) {
    if (!input.embeddedSkills?.length) {
      blockers.push('Die auslösende Meta-Fertigkeit besitzt keine kompatible eingebettete aktive Fertigkeit.')
    }
    for (const embedded of input.embeddedSkills ?? []) {
      const compatible = isCompatibleEmbeddedSkill(input.mainSkill, embedded)
      append({
        fromId: input.mainSkill.id,
        toId: embedded.id,
        kind: 'meta-payload',
        evidence: compatible ? 'structured-exact' : 'blocked',
        productive: compatible,
        reason: compatible
          ? 'Die eingebettete aktive Fertigkeit erfüllt die strukturierte Auslöserregel.'
          : 'Die eingebettete Fertigkeit erfüllt die Auslöserregel nicht.',
        ruleId: compatible ? 'meta.payload-compatible' : 'meta.payload-incompatible',
      })
    }
  }

  const ascendancy = derivedAscendancyAffinity(input.mainSkill, input.ascendancyId)
  if (ascendancy.evidence === 'structured-derived') {
    edges.push({
      fromId: input.ascendancyId,
      toId: input.mainSkill.id,
      kind: 'ascendancy-skill',
      evidence: ascendancy.evidence,
      productive: true,
      reason: `Der lokale Aszendenzbaum enthält passende strukturierte Wirkungen: ${ascendancy.matches.join(', ')}.`,
      ruleId: 'ascendancy.skill-affinity.tree-derived',
    })
  } else {
    unresolved.push('Für die Kombination ist keine strukturierte Aszendenz→Skill-Wirkung klassifiziert.')
  }

  return {
    status: blockers.length ? 'blocked' : unresolved.length ? 'limited' : 'coherent',
    edges,
    blockers: [...new Set(blockers)],
    unresolved: [...new Set(unresolved)],
    productiveEdgeCount: edges.filter(edge => edge.productive).length,
  }
}
