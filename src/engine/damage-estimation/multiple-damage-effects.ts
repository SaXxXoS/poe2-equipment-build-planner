import type { SkillGemDefinition } from '../../domain'
import type { RealPassivePlanningIntegrationResult } from '../orchestration/real-passive-integration'
import type { RealPassiveTree } from '../real-passive-pipeline/types'

export interface MultipleDamageSource {
  sourceNodeId: string
  sourceText: string
  kind: 'double' | 'triple'
  rawChancePercent: number
  effectiveChanceContributionPercent: number
  condition: 'unconditional' | 'critical-hit'
  evidence: 'text-pattern-exact'
}

export interface MultipleDamageEffect {
  modelVersion: '1.0.0'
  doubleDamageChancePercent: number
  tripleDamageChancePercent: number
  effectiveDoubleDamageChancePercent: number
  expectedDamageMultiplier: number
  sources: MultipleDamageSource[]
  limitations: string[]
}

const stripMarkup = (value: string) =>
  value.replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1').replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ').trim()

function allocatedNodeIds(
  planning: RealPassivePlanningIntegrationResult | undefined,
  weaponSet: 'set-1' | 'set-2',
) {
  const selected = planning?.weaponSetPlanning?.[weaponSet] ?? planning?.pipelineResult
  return [...new Set([
    ...(selected?.allocatedNodeIds ?? []),
    ...(planning?.ascendancyPlanning?.allocatedNodeIds ?? []),
  ])]
}

const clampChance = (value: number) => Math.max(0, Math.min(100, value))

export function resolveMultipleDamageEffect(input: {
  passiveTree?: RealPassiveTree
  planning?: RealPassivePlanningIntegrationResult
  weaponSet: 'set-1' | 'set-2'
  skill?: SkillGemDefinition
  criticalChancePercent?: number
}): MultipleDamageEffect {
  const sources: MultipleDamageSource[] = []
  if (input.passiveTree && input.planning) {
    const nodes = new Map(input.passiveTree.nodes.map(node => [node.id, node]))
    const tags = new Set([...(input.skill?.tags ?? []), ...(input.skill?.damageTypes ?? [])].map(value => value.toLocaleLowerCase('en')))
    for (const nodeId of allocatedNodeIds(input.planning, input.weaponSet)) {
      const node = nodes.get(nodeId)
      if (!node) continue
      for (const stat of node.stats) {
        const sourceText = stat.sourceText ?? ''
        const text = stripMarkup(sourceText)
        const chance = text.match(/^(\d+(?:\.\d+)?)% chance to deal (Double|Triple) Damage$/i)
        const guaranteed = text.match(/^Deal (Double|Triple) Damage$/i)
        const spellChance = text.match(/^Spells have (?:a )?(\d+(?:\.\d+)?)% chance to deal (Double|Triple) Damage$/i)
        const elementalGuaranteed = text.match(/^(?:Deal Triple Damage with Elemental Skills|Elemental Skills deal Triple Damage)$/i)
        const criticalDouble = text.match(/^Your Critical Hits have (?:a )?(\d+(?:\.\d+)?)% chance to deal Double Damage$/i)
        let kind: 'double' | 'triple' | undefined
        let rawChancePercent = 0
        let effectiveChanceContributionPercent = 0
        let condition: MultipleDamageSource['condition'] = 'unconditional'
        if (chance) {
          kind = chance[2].toLocaleLowerCase('en') as 'double' | 'triple'
          rawChancePercent = Number(chance[1])
          effectiveChanceContributionPercent = rawChancePercent
        } else if (guaranteed) {
          kind = guaranteed[1].toLocaleLowerCase('en') as 'double' | 'triple'
          rawChancePercent = 100
          effectiveChanceContributionPercent = 100
        } else if (spellChance && tags.has('spell')) {
          kind = spellChance[2].toLocaleLowerCase('en') as 'double' | 'triple'
          rawChancePercent = Number(spellChance[1])
          effectiveChanceContributionPercent = rawChancePercent
        } else if (elementalGuaranteed && ['fire', 'cold', 'lightning'].some(tag => tags.has(tag))) {
          kind = 'triple'
          rawChancePercent = 100
          effectiveChanceContributionPercent = 100
        } else if (criticalDouble && input.criticalChancePercent != null) {
          kind = 'double'
          condition = 'critical-hit'
          rawChancePercent = Number(criticalDouble[1])
          effectiveChanceContributionPercent = rawChancePercent * clampChance(input.criticalChancePercent) / 100
        }
        if (!kind || !Number.isFinite(effectiveChanceContributionPercent) || effectiveChanceContributionPercent <= 0) continue
        sources.push({
          sourceNodeId: nodeId,
          sourceText,
          kind,
          rawChancePercent,
          effectiveChanceContributionPercent,
          condition,
          evidence: 'text-pattern-exact',
        })
      }
    }
  }
  sources.sort((a, b) => a.sourceNodeId.localeCompare(b.sourceNodeId, 'en') || a.sourceText.localeCompare(b.sourceText, 'en'))
  const tripleDamageChancePercent = clampChance(sources.filter(value => value.kind === 'triple').reduce((sum, value) => sum + value.effectiveChanceContributionPercent, 0))
  const doubleDamageChancePercent = clampChance(sources.filter(value => value.kind === 'double').reduce((sum, value) => sum + value.effectiveChanceContributionPercent, 0))
  const effectiveDoubleDamageChancePercent = Math.max(
    doubleDamageChancePercent - tripleDamageChancePercent * doubleDamageChancePercent / 100,
    0,
  )
  return {
    modelVersion: '1.0.0',
    doubleDamageChancePercent,
    tripleDamageChancePercent,
    effectiveDoubleDamageChancePercent,
    expectedDamageMultiplier: 1 + effectiveDoubleDamageChancePercent / 100 + 2 * tripleDamageChancePercent / 100,
    sources,
    limitations: [
      'Nur exakt belegte aktive Knoten werden ausgewertet.',
      'Unbestätigte Gegner-, Treffer-, Waffen-, Schwellen- und Zeitbedingungen bleiben blockiert.',
      'Doppel- und Dreifachschaden skalieren hier ausschließlich Trefferschaden, nicht Schaden über Zeit oder Zustände.',
    ],
  }
}
