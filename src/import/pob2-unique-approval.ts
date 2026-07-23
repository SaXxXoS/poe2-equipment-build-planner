import { evaluateImportApproval, type SourceApprovalFile } from './approval'

export const POB2_UNIQUE_SOURCE_ID = 'path-of-building-poe2-unique-planner-c5300ccd'
export const POB2_UNIQUE_SCOPE_ID = 'poe2-pob2-unique-planner-data'
export const POB2_UNIQUE_REPOSITORY = 'PathOfBuildingCommunity/PathOfBuilding-PoE2'
export const POB2_UNIQUE_COMMIT = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
export const POB2_UNIQUE_FORMAT_VERSION = '1'
export const POB2_UNIQUE_DISTRIBUTION_STATUS = 'distribution-project-approved-with-disclosed-uncertainty' as const
export const POB2_UNIQUE_PROJECT_OWNER_DECISION = 'approved-with-disclosed-uncertainty' as const
export const POB2_UNIQUE_PRODUCT_OUTPUT = 'generated/pob2/uniques.json' as const

export type Pob2UniqueDistributionStatus =
  | 'distribution-approved'
  | 'distribution-conditionally-approved'
  | 'distribution-pending-maintainer-confirmation'
  | 'distribution-pending-ggg-confirmation'
  | 'distribution-pending-both'
  | 'distribution-project-approved-with-disclosed-uncertainty'
  | 'distribution-blocked'

export const POB2_UNIQUE_SOURCE_FILE_HASHES = {
  'src/Data/Uniques/amulet.lua': '688004e0b18364d0201dfcc05ffc64eed82c705c371a38c3a129fe85ff3cf307',
  'src/Data/Uniques/belt.lua': '23e36248d5de42d04e9af7d890a92b376de211aacb378a5b43d2b09df436311b',
  'src/Data/Uniques/body.lua': 'a39172cafcab5feb7d77ea15b29a67355a02d0706b8b1a8bb3d6562ffbc16c97',
  'src/Data/Uniques/boots.lua': '74335281fb54a8cd115bf6f7bf8b2d1808b2b4a588e3b1820231ed56560c26ba',
  'src/Data/Uniques/bow.lua': '2d0f6a4b434145034e7de102a7590ac05c56c41cbe92c19779d735d9ef21775a',
  'src/Data/Uniques/crossbow.lua': 'b76cd73e9d334b0bc2ba76f3d20aaf1e20133340a936571447331e37755ec40c',
  'src/Data/Uniques/flask.lua': '49c50365eb9a4e425c83ced89e5ffae034ca4a9a25b50868eda6f45d6b96eae3',
  'src/Data/Uniques/focus.lua': 'a363116d3971b330769d20fd9e73a1d1330a89a746bd0d9f4f0820c6625570fc',
  'src/Data/Uniques/gloves.lua': '063f9e48e33e2721e3bfcf1079b7f5d029822a94d3fcea903319ef512a3dcd43',
  'src/Data/Uniques/helmet.lua': 'a3d542e9f51950665ce901a3f59bfcf3e6d6e1e6909c9e94cb23eb1a42555dc7',
  'src/Data/Uniques/jewel.lua': '06115f389a916bf0b906c6b1aaef80fb3453582024a18cf5ffef64961c4d3425',
  'src/Data/Uniques/mace.lua': '10cf27b6851799271f62aad32f59e7b0c44174ddc88daa58486c613b2057ff76',
  'src/Data/Uniques/quiver.lua': '0a48c5f5945b052fabc8c03b19c0317283016b05ca5d854bc03390209cb32ac5',
  'src/Data/Uniques/ring.lua': '2330af5132959b8f499825b3cb5b76bf563d1c32bc728c56af7ede115f47834b',
  'src/Data/Uniques/sceptre.lua': '8595984d05ac9107480c42715752e0f06b2f79a8e8f1338af0f056329f39412f',
  'src/Data/Uniques/shield.lua': '1f25309f43b9936a22599c02c2c90f9e0101ec9fb36bf387181b94958724f709',
  'src/Data/Uniques/spear.lua': '867d313faec7e87e39c00258f44f5e9f4e930b2c097e0f25c4ee66a05e0cfdeb',
  'src/Data/Uniques/staff.lua': 'b5b4529d3999d0960d2179490ca43657c318149b5376b224d9dd5f43fec8aeaf',
  'src/Data/Uniques/talisman.lua': '4f682fa8dc5a6f439bb9d0d22c2c64ce4e48755c42764bd63a35c1b307f63d3c',
  'src/Data/Uniques/wand.lua': 'a94306112c1cdddb0dcef966091dfad33e45d7a13cc4dfbe0868ed0af2bdae52',
} as const

export const POB2_UNIQUE_ALLOWED_FIELDS = [
  'sourceId', 'name', 'baseDisplayName', 'slot', 'itemCategory', 'requiredLevel',
  'variants', 'visibleModifiers', 'rollRanges', 'implicits', 'legacyStatus',
  'provenance', 'resolutionStatus',
] as const

export const POB2_UNIQUE_FORBIDDEN_FIELDS = [
  'gggUniqueId', 'gggBaseItemId', 'gggModId', 'gggStatId', 'technicalGggStatLink',
  'spawnWeights', 'modDomain', 'modGenerationType', 'conflictGroup', 'craftingWeight',
  'image', 'icon', 'media', 'hotlink', 'flavourText', 'germanText',
  'skillDefinition', 'supportDefinition', 'passiveTreeData', 'calculationResult',
] as const

export interface Pob2UniqueProvenance {
  sourceKind: 'pob2-planner-data'
  sourceRepository: typeof POB2_UNIQUE_REPOSITORY
  sourceCommit: typeof POB2_UNIQUE_COMMIT
  sourceRecordIdentifier: string
  sourceLicense: 'MIT-code-data-rights-pending'
  importedAtBuild: boolean
  technicalIdentityStatus: 'pob2-source-identity'
  gggIdentityStatus: 'unknown'
  localizationSource: 'pob2-english' | 'none'
  valueSource: 'pob2-structured' | 'pob2-parser-defined' | 'unknown'
  variantSource: 'pob2-variant' | 'pob2-source-order' | 'unknown'
  identityStatus: 'planner-only'
  localizationStatus: 'english-only' | 'translation-missing' | 'unknown'
}

export interface Pob2UniqueGuardRequest {
  mode: 'audit' | 'product-import'
  sourceId: string
  scopeId: string
  repository: string
  commit: string
  sourceFile: string
  sourceFileSha256: string
  requestedFields: string[]
  outputPath?: string
  namespace: string
  provenance: Partial<Pob2UniqueProvenance>
  sha256Manifest: boolean
  deterministicNormalization: boolean
  runtimeNetwork: boolean
  hotlinks: boolean
  scraping: boolean
  media: boolean
  rawMirror: boolean
  dataCategories: string[]
  projectOwnerDistributionDecision?: string
  attributionIncluded: boolean
  licenseNoticeIncluded: boolean
  sourceLabelIncluded: boolean
}

export interface Pob2UniqueGuardDecision {
  allowed: boolean
  code: 'audit-allowed' | 'product-import-allowed' | 'product-import-blocked' | 'approval-denied' | 'guard-denied'
  issues: string[]
}

export interface Pob2UniqueDistributionEvidence {
  maintainerConfirmed: boolean
  gggConfirmed: boolean
  attributionIncluded: boolean
  licenseNoticeIncluded: boolean
  projectOwnerDecision?: string
  uncertaintyDisclosed?: boolean
}

export function evaluatePob2UniqueDistribution(
  status: Pob2UniqueDistributionStatus,
  evidence: Pob2UniqueDistributionEvidence,
): { allowed: boolean; issues: string[] } {
  const issues: string[] = []
  if (status === 'distribution-blocked') return { allowed: false, issues: ['distribution-blocked'] }
  if (status === 'distribution-pending-maintainer-confirmation' || status === 'distribution-pending-both') {
    if (!evidence.maintainerConfirmed) issues.push('maintainer-confirmation-missing')
  }
  if (status === 'distribution-pending-ggg-confirmation' || status === 'distribution-pending-both') {
    if (!evidence.gggConfirmed) issues.push('ggg-confirmation-missing')
  }
  if (status === 'distribution-conditionally-approved') {
    if (!evidence.maintainerConfirmed) issues.push('maintainer-confirmation-missing')
    if (!evidence.gggConfirmed) issues.push('ggg-confirmation-missing')
    if (!evidence.attributionIncluded) issues.push('attribution-missing')
    if (!evidence.licenseNoticeIncluded) issues.push('license-notice-missing')
  }
  if (status === 'distribution-project-approved-with-disclosed-uncertainty') {
    if (evidence.projectOwnerDecision !== POB2_UNIQUE_PROJECT_OWNER_DECISION) issues.push('project-owner-decision-missing')
    if (evidence.uncertaintyDisclosed !== true) issues.push('uncertainty-disclosure-missing')
    if (!evidence.attributionIncluded) issues.push('attribution-missing')
    if (!evidence.licenseNoticeIncluded) issues.push('license-notice-missing')
  }
  return { allowed: issues.length === 0 && status === 'distribution-approved'
    ? true
    : issues.length === 0 && (
      status === 'distribution-conditionally-approved'
      || status === 'distribution-project-approved-with-disclosed-uncertainty'
    ), issues }
}

const requiredProvenance: (keyof Pob2UniqueProvenance)[] = [
  'sourceKind', 'sourceRepository', 'sourceCommit', 'sourceRecordIdentifier',
  'sourceLicense', 'importedAtBuild', 'technicalIdentityStatus', 'gggIdentityStatus',
  'localizationSource', 'valueSource', 'variantSource', 'localizationStatus', 'identityStatus',
]
const blockedCategories = new Set([
  'normal-affixes', 'technical-mods', 'technical-stats', 'crafting-pools',
  'spawnweights', 'german-csd', 'photo-mappings', 'runes', 'soul-cores',
  'socketables', 'skills', 'supports', 'media', 'passive-tree',
])

export function guardPob2UniquePlannerData(
  approval: SourceApprovalFile,
  request: Pob2UniqueGuardRequest,
): Pob2UniqueGuardDecision {
  const issues: string[] = []
  const scopeConstraints = approval.categoryAssignments.find(
    value => value.categoryId === POB2_UNIQUE_SCOPE_ID,
  )?.constraints
  const generic = evaluateImportApproval(approval, {
    sourceId: request.sourceId,
    categoryId: request.scopeId,
    satisfiedConditions: {
      attributionRequired: true,
      automatedAccessAllowed: true,
      patchVersionRequired: true,
      manualApprovalRequired: true,
    },
    sourceVersion: `commit:${request.commit}`,
    exportCommit: request.commit,
    parserCommit: POB2_UNIQUE_FORMAT_VERSION,
    itemCategory: 'Unique Items',
    sourceFile: request.sourceFile,
    requestedFields: request.requestedFields,
    dataCategories: request.dataCategories,
    sha256Manifest: request.sha256Manifest,
    deterministicNormalization: request.deterministicNormalization,
    rawMirror: request.rawMirror,
    runtimeFetch: request.runtimeNetwork,
    hotlink: request.hotlinks,
  })
  if (!generic.allowed) issues.push(`approval:${generic.code}`)
  if (request.sourceId !== POB2_UNIQUE_SOURCE_ID || request.scopeId !== POB2_UNIQUE_SCOPE_ID) issues.push('scope')
  if (request.repository !== POB2_UNIQUE_REPOSITORY || request.commit !== POB2_UNIQUE_COMMIT) issues.push('pin')
  if (POB2_UNIQUE_SOURCE_FILE_HASHES[request.sourceFile as keyof typeof POB2_UNIQUE_SOURCE_FILE_HASHES] !== request.sourceFileSha256) issues.push('source-file-hash')
  if (!request.namespace.startsWith('pob2:') || request.namespace.startsWith('fixture:')) issues.push('namespace')
  if (request.requestedFields.some(field => !POB2_UNIQUE_ALLOWED_FIELDS.includes(field as never))) issues.push('field-allowlist')
  if (request.requestedFields.some(field => POB2_UNIQUE_FORBIDDEN_FIELDS.includes(field as never))) issues.push('forbidden-field')
  if (request.dataCategories.some(value => blockedCategories.has(value))) issues.push('product-separation')
  if (request.runtimeNetwork || request.hotlinks || request.scraping || request.media || request.rawMirror) issues.push('external-or-raw-data')
  if (!request.sha256Manifest || !request.deterministicNormalization) issues.push('reproducibility')
  if (request.mode === 'product-import' && request.outputPath !== POB2_UNIQUE_PRODUCT_OUTPUT) issues.push('product-output')
  if (request.mode === 'audit' && request.outputPath && /(^|[\\/])(generated|public)([\\/]|$)/i.test(request.outputPath)) issues.push('product-output')
  if (request.projectOwnerDistributionDecision !== POB2_UNIQUE_PROJECT_OWNER_DECISION) issues.push('project-owner-decision')
  if (scopeConstraints?.projectOwnerDecision !== POB2_UNIQUE_PROJECT_OWNER_DECISION
    || scopeConstraints.distributionStatus !== POB2_UNIQUE_DISTRIBUTION_STATUS
    || scopeConstraints.importStatus !== '5M.2.9-may-begin-under-existing-guards') issues.push('versioned-project-owner-decision')
  if (!request.attributionIncluded) issues.push('attribution')
  if (!request.licenseNoticeIncluded) issues.push('license-notice')
  if (!request.sourceLabelIncluded) issues.push('source-label')
  for (const field of requiredProvenance) {
    if (!(field in request.provenance) || request.provenance[field] === undefined || request.provenance[field] === '') issues.push(`provenance:${field}`)
  }
  if (request.provenance.sourceKind !== 'pob2-planner-data'
    || request.provenance.sourceRepository !== POB2_UNIQUE_REPOSITORY
    || request.provenance.sourceCommit !== POB2_UNIQUE_COMMIT
    || request.provenance.gggIdentityStatus !== 'unknown') issues.push('provenance-values')

  if (!generic.allowed) return { allowed: false, code: 'approval-denied', issues }
  if (issues.length) return { allowed: false, code: 'guard-denied', issues: [...new Set(issues)] }
  return request.mode === 'product-import'
    ? { allowed: true, code: 'product-import-allowed', issues: [] }
    : { allowed: true, code: 'audit-allowed', issues: [] }
}
