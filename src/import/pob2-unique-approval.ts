import { evaluateImportApproval, type SourceApprovalFile } from './approval'

export const POB2_UNIQUE_SOURCE_ID = 'path-of-building-poe2-unique-planner-c5300ccd'
export const POB2_UNIQUE_SCOPE_ID = 'poe2-pob2-unique-planner-data'
export const POB2_UNIQUE_REPOSITORY = 'PathOfBuildingCommunity/PathOfBuilding-PoE2'
export const POB2_UNIQUE_COMMIT = 'c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0'
export const POB2_UNIQUE_FORMAT_VERSION = '1'

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
}

export interface Pob2UniqueGuardDecision {
  allowed: boolean
  code: 'audit-allowed' | 'product-import-blocked' | 'approval-denied' | 'guard-denied'
  issues: string[]
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
  if (!request.namespace.startsWith('pob2:') || request.namespace.startsWith('fixture:')) issues.push('namespace')
  if (request.requestedFields.some(field => !POB2_UNIQUE_ALLOWED_FIELDS.includes(field as never))) issues.push('field-allowlist')
  if (request.requestedFields.some(field => POB2_UNIQUE_FORBIDDEN_FIELDS.includes(field as never))) issues.push('forbidden-field')
  if (request.dataCategories.some(value => blockedCategories.has(value))) issues.push('product-separation')
  if (request.runtimeNetwork || request.hotlinks || request.scraping || request.media || request.rawMirror) issues.push('external-or-raw-data')
  if (!request.sha256Manifest || !request.deterministicNormalization) issues.push('reproducibility')
  if (request.outputPath && /(^|[\\/])(generated|public)([\\/]|$)/i.test(request.outputPath)) issues.push('product-output')
  for (const field of requiredProvenance) {
    if (!(field in request.provenance) || request.provenance[field] === undefined || request.provenance[field] === '') issues.push(`provenance:${field}`)
  }
  if (request.provenance.sourceKind !== 'pob2-planner-data'
    || request.provenance.sourceRepository !== POB2_UNIQUE_REPOSITORY
    || request.provenance.sourceCommit !== POB2_UNIQUE_COMMIT
    || request.provenance.gggIdentityStatus !== 'unknown') issues.push('provenance-values')

  if (!generic.allowed) return { allowed: false, code: 'approval-denied', issues }
  if (issues.length) return { allowed: false, code: 'guard-denied', issues: [...new Set(issues)] }
  // 5M.2.8 leaves distribution pending. Audit is permitted; product output stays closed.
  if (request.mode === 'product-import') return { allowed: false, code: 'product-import-blocked', issues: ['distribution-pending', 'follow-up-5M.2.9-required'] }
  return { allowed: true, code: 'audit-allowed', issues: [] }
}
