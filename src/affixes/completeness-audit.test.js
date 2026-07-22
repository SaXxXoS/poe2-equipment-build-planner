/* global URL */
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const readJson = async name => JSON.parse(await readFile(new URL(`../../docs/audits/${name}`, import.meta.url), 'utf8'))

describe('PoE2 item-mod completeness audit', () => {
  it('categorizes every 5M.1 mod, special, and implicit deterministically', async () => {
    const audit = await readJson('poe2-item-mod-category-matrix.json')
    expect(audit.categorizedMods).toHaveLength(1828)
    expect(new Set(audit.categorizedMods.map(row => row.modId)).size).toBe(1828)
    expect(audit.summary.categories).toEqual({
      'base-implicit': 231,
      'corruption-implicit': 103,
      'corruption-upgrade': 110,
      'regular-prefix': 816,
      'regular-suffix': 568,
    })
    expect(audit.summary.specials).toBe(213)
    expect(audit.implicitMatrix).toHaveLength(231)
    expect(audit.filters.map(row => row.id)).toEqual([
      'supported-item-class-allowlist', 'mods-by-base-reference-union',
      'selected-base-implicit-addition', 'side-precedence', 'first-family-selection',
    ])
  })

  it('pins every inventoried repository and marks uncertainties', async () => {
    const inventory = await readJson('poe2-community-source-inventory.json')
    expect(inventory.repositories).toHaveLength(51)
    for (const repository of inventory.repositories) {
      expect(repository.checkedCommit).toMatch(/^[0-9a-f]{40}$/)
      expect(repository.relevanceClass).toMatch(/^[A-I]$/)
    }
    for (const source of inventory.deepReviewed) expect(source.commit).toMatch(/^[0-9a-f]{40}$/)
    expect(inventory.uncertainties.length).toBeGreaterThan(0)
  })

  it('keeps the approval record and generated 5M.1 corpus byte-identical', async () => {
    const expected = {
      'technical-affixes.json': 'e84f14b83df013105f6f198ad94411d3dc3c594b4a6dc7a51d12f1c54864926c',
      'affix-families.json': 'fbb3eedf63e195c14b24c13e3f44dc0cd7f821f4ddaa48fb5b6204404b5a791e',
      'affix-tiers.json': '34a436328e25f398ccb1e0973c0c417c2ea7c10dbbc004bce1e4f3bd65632de8',
      'item-classes.json': '6f1ef192291594a40c6b86dce9b49866f5a80cbf0e091a9d472d3538b8d39ece',
      'item-class-affix-index.json': '35e1d6523488d296107c5d9026a86bb9b3226fd856b447f67b6350644dd71da5',
      'affix-conflicts.json': '926d2b76ea14266cb65aa58946509ca9ddf3c0e6ba31e3ddccfc00b61751f386',
      'affix-coverage-report.json': '790ad5771f8ba6c1a2a40eb1c951204368ded203847bd4edbaeb7f46c8fd5dca',
      'affix-import-report.json': '60442282150a02534a8ca7edc4aa57c21410ffb7aa761c592d69ee1f3cdba757',
      'affix-source-manifest.json': '147e2cab6c19cf50eab17f2720c4239e2a8867dbe6887a09ae8490e03c36a6bc',
    }
    for (const [name, hash] of Object.entries(expected)) {
      const bytes = await readFile(new URL(`../../generated/poe2-affixes/${name}`, import.meta.url))
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash)
    }
    const approval = await readFile(new URL('../../data-sources/source-approval.json', import.meta.url))
    expect(createHash('sha256').update(approval).digest('hex')).toBe('36cf21441d2f3a4a649d5279edf3fe7fd2644b700cef584b71c68945707a7182')
  })

  it('records non-import and unknown cross-source totals explicitly', async () => {
    const comparison = await readJson('poe2-item-mod-source-comparison.json')
    expect(comparison.productionDataImported).toBe(false)
    expect(comparison.approvalChanged).toBe(false)
    expect(comparison.results.allThreeExactIntersection.count).toBeNull()
    expect(comparison.results.allThreeExactIntersection.countingRule).toContain('unknown')
  })
})
