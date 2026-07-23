import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { mkdtemp } from 'node:fs/promises'
import { beforeAll, describe, expect, it } from 'vitest'
import { generateGermanDisplayLayer } from './generate.mjs'

describe('German PoB2 Unique display layer generator', () => {
  let first
  let second
  beforeAll(async () => {
    const root = await mkdtemp(join(tmpdir(), 'pob2-unique-de-'))
    first = await generateGermanDisplayLayer({ outputPath: join(root, 'first.json') })
    second = await generateGermanDisplayLayer({ outputPath: join(root, 'second.json') })
  }, 30_000)

  it('generates complete ID-linked display coverage deterministically', () => {
    expect(first.serialized).toBe(second.serialized)
    expect(first.output.items).toHaveLength(435)
    expect(first.output.coverage).toMatchObject({ names: 435, baseDisplayNames: 435, variants: 579, modifiers: 2345, implicits: 273 })
    expect(first.output.coverage.statusCounts['translation-missing']).toBe(0)
    expect(first.output.items.every(item => item.uniqueId.startsWith('pob2:'))).toBe(true)
    expect(first.output.items.flatMap(item => item.variants).every(value => value.sourceVariantId)).toBe(true)
    expect(first.output.items.flatMap(item => [...item.modifiers, ...item.implicits]).every(value => value.sourceLineId)).toBe(true)
  })

  it('contains display information only', () => {
    const forbidden = ['technicalGggModLink', 'technicalGggStatLinks', 'rollRanges', 'provenance', 'analyzer', 'sourceCommit']
    const serialized = first.serialized
    for (const field of forbidden) expect(serialized).not.toContain(`"${field}"`)
    expect(serialized).not.toContain('"normalizedPlannerLine"')
  })

  it('does not modify the English product', async () => {
    const product = await readFile('generated/pob2/uniques.json')
    expect(first.output.sourceProductHash).toBe('db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452')
    expect(product.length).toBeGreaterThan(2_000_000)
  })
})

