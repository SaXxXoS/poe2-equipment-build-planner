import { classifySkillWeaponPair } from './skill-weapon-compatibility.mjs'

function canPreserveReport(previousReport, product, productivePackageCount) {
  return previousReport?.schemaVersion === '1.0.0'
    && previousReport.sourceVersion === product.source.version
    && previousReport.productivePackageCount === productivePackageCount
    && previousReport.inputPackageCount === previousReport.productivePackageCount + previousReport.blockedPackageCount
    && Array.isArray(previousReport.blockedPackages)
    && previousReport.blockedPackages.length === previousReport.blockedPackageCount
}

export function sanitizeMetaProduct(product, skills, previousReport = null) {
  const classified = product.packages.map(item => {
    const compatibility = classifySkillWeaponPair(item.mainSkill, item.weapon, skills)
    return {
      item: {
        ...item,
        localCompatibilityStatus: compatibility.status,
        localRequiredWeaponTypes: compatibility.requiredWeaponTypes,
      },
      compatibility,
    }
  })
  const packages = classified
    .filter(value => value.compatibility.productive)
    .map(value => value.item)
  const blockedPackages = classified
    .filter(value => !value.compatibility.productive)
    .map(value => ({
      packageId: value.item.packageId,
      ascendancyId: value.item.ascendancyId,
      mainSkill: value.item.mainSkill,
      weapon: value.item.weapon,
      profileCount: value.item.profileCount,
      status: value.compatibility.status,
      localRequiredWeaponTypes: value.compatibility.requiredWeaponTypes,
    }))
    .sort((left, right) => left.packageId.localeCompare(right.packageId))
  const report = {
    schemaVersion: '1.0.0',
    sourceVersion: product.source.version,
    inputPackageCount: product.packages.length,
    productivePackageCount: packages.length,
    blockedPackageCount: blockedPackages.length,
    blockedPackages,
    decision: 'only-exact-local-skill-weapon-links-are-productive',
    limitation: 'The source profile exposes character-wide weapons, not a proven weapon-set link for each gem group.',
  }
  return {
    product: {
      ...product,
      policy: {
        ...product.policy,
        localSkillWeaponGate: 'exact-pinned-gem-weapon-requirement',
        profileWideWeaponListIsSetProof: false,
      },
      packageCount: packages.length,
      packages,
    },
    report: canPreserveReport(previousReport, product, packages.length)
      ? previousReport
      : report,
  }
}
