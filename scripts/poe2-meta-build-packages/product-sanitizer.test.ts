import { describe, expect, it } from 'vitest'
import catalog from '../../generated/poe2-gems/catalog.json'
import { sanitizeMetaProduct } from './product-sanitizer.mjs'

const base = {
  schemaVersion: '1.0.0',
  source: { version: 'test' },
  policy: {},
  profileCount: 4,
  packageCount: 3,
  packages: [
    { packageId: 'bow', ascendancyId: 'deadeye', mainSkill: 'Ice Shot', weapon: 'bow', profileCount: 2 },
    { packageId: 'wand', ascendancyId: 'deadeye', mainSkill: 'Ice Shot', weapon: 'wand', profileCount: 2 },
    { packageId: 'spell', ascendancyId: 'stormweaver', mainSkill: 'Spark', weapon: 'wand', profileCount: 2 },
  ],
}

describe('meta product sanitizer', () => {
  it('retains exact local pairs and reports unproven profile-wide pairs', () => {
    const result = sanitizeMetaProduct(base, catalog.skills)
    expect(result.product.packages.map(value => value.packageId)).toEqual(['bow'])
    expect(result.product).toMatchObject({
      packageCount: 1,
      policy: {
        localSkillWeaponGate: 'exact-pinned-gem-weapon-requirement',
        profileWideWeaponListIsSetProof: false,
      },
    })
    expect(result.report).toMatchObject({
      inputPackageCount: 3,
      productivePackageCount: 1,
      blockedPackageCount: 2,
    })
    expect(result.report.blockedPackages.map(value => value.packageId)).toEqual(['spell', 'wand'])
  })

  it('preserves the complete rejection audit on repeated product sanitization', () => {
    const first = sanitizeMetaProduct(base, catalog.skills)
    const second = sanitizeMetaProduct(first.product, catalog.skills, first.report)

    expect(second.product).toEqual(first.product)
    expect(second.report).toEqual(first.report)
    expect(second.report).toMatchObject({
      inputPackageCount: 3,
      productivePackageCount: 1,
      blockedPackageCount: 2,
    })
  })
})
