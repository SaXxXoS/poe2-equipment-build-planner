import type { EquipmentEntry } from '../../domain'
import { pob2UniquePlannerRegistry } from '../../uniques'

export interface ConditionalAilmentEffects {
  bleedingChanceOnCriticalHitPercent?: number
  poisonChanceOnCriticalHitPercent?: number
  aggravateBleedingOnCriticalAttack?: boolean
  sourceReferences: string[]
}

const recordsById = new Map(pob2UniquePlannerRegistry.map(record => [record.sourceId, record]))

function selectedLines(entry: EquipmentEntry) {
  if (!entry.uniqueItemId) return []
  const record = recordsById.get(entry.uniqueItemId)
  if (!record) return []
  return [...record.visibleModifiers, ...record.implicits].filter(line => {
    const variantScope = line.variantScope ?? []
    if (!variantScope.length) return true
    return Boolean(entry.uniqueVariantId && variantScope.includes(entry.uniqueVariantId))
  })
}

/**
 * Resolves only exact English PoB2 planner lines whose conditional behaviour is
 * explicitly defined by the pinned PoB2 modifier parser. Display translations,
 * OCR text and similarity matching are deliberately excluded.
 */
export function resolveConditionalAilmentEffects(equipment: EquipmentEntry[]): ConditionalAilmentEffects {
  const result: ConditionalAilmentEffects = { sourceReferences: [] }
  for (const entry of equipment) {
    for (const line of selectedLines(entry)) {
      if (line.normalizedPlannerLine === 'Critical Hits Poison the enemy') {
        result.poisonChanceOnCriticalHitPercent = 100
        result.sourceReferences.push(
          `${entry.uniqueItemId}:${line.sourceLineId}`,
          'PoB2:ModCache:Critical Hits Poison the enemy',
        )
      }
      if (line.normalizedPlannerLine === 'Aggravate Bleeding on targets you Critically Hit with Attacks') {
        result.aggravateBleedingOnCriticalAttack = true
        result.sourceReferences.push(
          `${entry.uniqueItemId}:${line.sourceLineId}`,
          'PoB2:ModCache:Aggravate Bleeding on targets you Critically Hit with Attacks',
        )
      }
    }
  }
  result.sourceReferences = [...new Set(result.sourceReferences)].sort((left, right) => left.localeCompare(right, 'en'))
  return result
}
