import { describe, expect, it } from 'vitest'
import officialTree from '../../../generated/poe2-tree/tree.json'
import { measurePassiveEffectCoverage } from './effect-coverage'
import type { PassiveTargetNode } from './types'

describe('numerische Wirkungs-Coverage des offiziellen Passivbaums', () => {
  const report = measurePassiveEffectCoverage(
    officialTree.nodes as PassiveTargetNode[],
  )

  it('trennt semantische Erkennung, Profilverknüpfung und Zahlenanwendung', () => {
    expect(report.totalStatLines).toBe(5962)
    expect(report.semanticallyClassifiedStatLines).toBe(5962)
    expect(report.profileLinkedStatLines).toBeGreaterThan(0)
    expect(report.profileLinkedStatLines).toBeLessThan(report.totalStatLines)
    expect(report.extractedNumericStatLines).toBeGreaterThan(0)
    expect(report.numericallyAppliedStatLines).toBe(0)
    expect(report.numericalApplicationPercent).toBe(0)
  })

  it('ist vollständig deterministisch', () => {
    expect(
      measurePassiveEffectCoverage(officialTree.nodes as PassiveTargetNode[]),
    ).toEqual(report)
  })
})
