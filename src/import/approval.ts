export const APPROVAL_STATUSES = ['approved', 'conditionally-approved', 'pending', 'blocked', 'rejected'] as const
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number]

export const APPROVAL_CONDITIONS = [
  'attributionRequired', 'rawRedistributionAllowed', 'derivedRedistributionAllowed',
  'automatedAccessAllowed', 'localStorageAllowed', 'repositoryStorageAllowed',
  'commercialUseClarified', 'patchVersionRequired', 'rateLimitKnown',
  'manualApprovalRequired',
] as const
export type ApprovalCondition = (typeof APPROVAL_CONDITIONS)[number]
export type ApprovalConditionValue = boolean | 'unknown'

export interface SourceApproval {
  sourceId: string
  name: string
  status: ApprovalStatus
  conditions: Record<ApprovalCondition, ApprovalConditionValue>
  requiredConditions: ApprovalCondition[]
  evidenceUrls: string[]
  reason: string
}

export interface CategoryAssignment {
  categoryId: string
  primarySourceId: string | null
  fallbackSourceId: string | null
  status: ApprovalStatus
  repositoryStorage: ApprovalConditionValue
  offlineOnly: boolean
  reason: string
  constraints?: CategoryApprovalConstraints
}

export interface CategoryApprovalConstraints {
  sourceVersion: string
  exportCommit: string
  parserCommit: string
  allowedItemCategories: string[]
  allowedSourceFiles: string[]
  allowedFields: string[]
  blockedDataCategories: string[]
  requireSha256Manifest: boolean
  requireDeterministicNormalization: boolean
  forbidRawMirror: boolean
  forbidRuntimeFetch: boolean
  forbidHotlinks: boolean
  distributionStatus?: string
  evidence?: string[]
  distributionConditions?: string[]
  attributionRequirements?: string[]
  licenseNoticeRequirements?: string[]
  allowedDistributionArtifacts?: string[]
  forbiddenDistributionArtifacts?: string[]
  clarificationStatus?: string
  nextRequiredAction?: string
}

export interface SourceApprovalFile {
  schemaVersion: '1.0.0'
  reviewedAt: string
  reviewedSources: SourceApproval[]
  approvedSources: string[]
  conditionallyApprovedSources: string[]
  blockedSources: string[]
  rejectedSources: string[]
  pendingSources: string[]
  categoryAssignments: CategoryAssignment[]
  globalRestrictions: string[]
  nextReviewTrigger: string
}

export interface ApprovalIssue { path: string; message: string }
export interface ApprovalValidationResult { ok: boolean; approval?: SourceApprovalFile; issues: ApprovalIssue[] }
export interface ImportApprovalRequest {
  sourceId: string
  categoryId: string
  satisfiedConditions?: Partial<Record<ApprovalCondition, boolean>>
  fixture?: boolean
  sourceVersion?: string
  exportCommit?: string
  parserCommit?: string
  itemCategory?: string
  sourceFile?: string
  requestedFields?: string[]
  dataCategories?: string[]
  sha256Manifest?: boolean
  deterministicNormalization?: boolean
  rawMirror?: boolean
  runtimeFetch?: boolean
  hotlink?: boolean
}
export interface ImportApprovalDecision {
  allowed: boolean
  code: 'fixture-allowed' | 'approved' | 'conditions-satisfied' | 'approval-missing' | 'approval-invalid' | 'source-unknown' | 'category-unknown' | 'source-blocked' | 'category-blocked' | 'source-not-assigned' | 'conditions-unmet' | 'request-constraints-unmet'
  message: string
  unmetConditions: ApprovalCondition[]
}

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const isStatus = (value: unknown): value is ApprovalStatus => typeof value === 'string' && APPROVAL_STATUSES.includes(value as ApprovalStatus)
const issue = (path: string, message: string): ApprovalIssue => ({ path, message })

export function parseSourceApproval(input: string | unknown): ApprovalValidationResult {
  if (typeof input !== 'string') return validateSourceApproval(input)
  try { return validateSourceApproval(JSON.parse(input)) }
  catch { return { ok: false, issues: [issue('root', 'Approval-Datei ist kein gültiges JSON')] } }
}

export function validateSourceApproval(input: unknown): ApprovalValidationResult {
  const issues: ApprovalIssue[] = []
  if (!isRecord(input)) return { ok: false, issues: [issue('root', 'Approval-Datei muss ein Objekt sein')] }
  if (input.schemaVersion !== '1.0.0') issues.push(issue('schemaVersion', 'Nicht unterstützte Approval-Schema-Version'))
  if (typeof input.reviewedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.reviewedAt)) issues.push(issue('reviewedAt', 'reviewedAt muss YYYY-MM-DD verwenden'))
  if (!Array.isArray(input.reviewedSources)) issues.push(issue('reviewedSources', 'reviewedSources muss ein Array sein'))
  if (!Array.isArray(input.categoryAssignments)) issues.push(issue('categoryAssignments', 'categoryAssignments muss ein Array sein'))

  const sources = Array.isArray(input.reviewedSources) ? input.reviewedSources : []
  const sourceIds = new Set<string>()
  for (const [index, value] of sources.entries()) {
    const path = `reviewedSources.${index}`
    if (!isRecord(value)) { issues.push(issue(path, 'Quelle muss ein Objekt sein')); continue }
    if (typeof value.sourceId !== 'string' || !value.sourceId) issues.push(issue(`${path}.sourceId`, 'sourceId fehlt'))
    else if (sourceIds.has(value.sourceId)) issues.push(issue(`${path}.sourceId`, 'sourceId ist doppelt'))
    else sourceIds.add(value.sourceId)
    if (!isStatus(value.status)) issues.push(issue(`${path}.status`, 'Ungültiger Freigabestatus'))
    if (!isRecord(value.conditions)) issues.push(issue(`${path}.conditions`, 'Bedingungen fehlen'))
    else for (const condition of APPROVAL_CONDITIONS) if (![true, false, 'unknown'].includes(value.conditions[condition] as never)) issues.push(issue(`${path}.conditions.${condition}`, 'Bedingung muss true, false oder unknown sein'))
    if (!Array.isArray(value.requiredConditions) || value.requiredConditions.some(entry => !APPROVAL_CONDITIONS.includes(entry as ApprovalCondition))) issues.push(issue(`${path}.requiredConditions`, 'requiredConditions enthält unbekannte Werte'))
    if (!Array.isArray(value.evidenceUrls) || value.evidenceUrls.some(url => typeof url !== 'string')) issues.push(issue(`${path}.evidenceUrls`, 'evidenceUrls muss URLs enthalten'))
  }

  const statusLists = ['approvedSources', 'conditionallyApprovedSources', 'blockedSources', 'rejectedSources', 'pendingSources'] as const
  for (const name of statusLists) if (!Array.isArray(input[name]) || input[name].some(value => typeof value !== 'string')) issues.push(issue(name, `${name} muss ein String-Array sein`))
  if (!Array.isArray(input.globalRestrictions) || input.globalRestrictions.some(value => typeof value !== 'string')) issues.push(issue('globalRestrictions', 'globalRestrictions muss ein String-Array sein'))
  if (typeof input.nextReviewTrigger !== 'string' || !input.nextReviewTrigger) issues.push(issue('nextReviewTrigger', 'nextReviewTrigger fehlt'))

  const categories = Array.isArray(input.categoryAssignments) ? input.categoryAssignments : []
  const categoryIds = new Set<string>()
  for (const [index, value] of categories.entries()) {
    const path = `categoryAssignments.${index}`
    if (!isRecord(value)) { issues.push(issue(path, 'Kategorie muss ein Objekt sein')); continue }
    if (typeof value.categoryId !== 'string' || !value.categoryId) issues.push(issue(`${path}.categoryId`, 'categoryId fehlt'))
    else if (categoryIds.has(value.categoryId)) issues.push(issue(`${path}.categoryId`, 'categoryId ist doppelt'))
    else categoryIds.add(value.categoryId)
    if (!isStatus(value.status)) issues.push(issue(`${path}.status`, 'Ungültiger Freigabestatus'))
    if (![true, false, 'unknown'].includes(value.repositoryStorage as never)) issues.push(issue(`${path}.repositoryStorage`, 'repositoryStorage muss true, false oder unknown sein'))
    for (const field of ['primarySourceId', 'fallbackSourceId'] as const) if (value[field] !== null && typeof value[field] !== 'string') issues.push(issue(`${path}.${field}`, `${field} muss String oder null sein`))
    if (value.constraints !== undefined) {
      if (!isRecord(value.constraints)) issues.push(issue(`${path}.constraints`, 'constraints muss ein Objekt sein'))
      else {
        for (const field of ['sourceVersion', 'exportCommit', 'parserCommit'] as const) if (typeof value.constraints[field] !== 'string' || !value.constraints[field]) issues.push(issue(`${path}.constraints.${field}`, `${field} fehlt`))
        for (const field of ['allowedItemCategories', 'allowedSourceFiles', 'allowedFields', 'blockedDataCategories'] as const) if (!Array.isArray(value.constraints[field]) || value.constraints[field].some(entry => typeof entry !== 'string')) issues.push(issue(`${path}.constraints.${field}`, `${field} muss ein String-Array sein`))
        for (const field of ['requireSha256Manifest', 'requireDeterministicNormalization', 'forbidRawMirror', 'forbidRuntimeFetch', 'forbidHotlinks'] as const) if (typeof value.constraints[field] !== 'boolean') issues.push(issue(`${path}.constraints.${field}`, `${field} muss boolean sein`))
        for (const field of ['evidence', 'distributionConditions', 'attributionRequirements', 'licenseNoticeRequirements', 'allowedDistributionArtifacts', 'forbiddenDistributionArtifacts'] as const) {
          if (value.constraints[field] !== undefined && (!Array.isArray(value.constraints[field]) || value.constraints[field].some(entry => typeof entry !== 'string'))) issues.push(issue(`${path}.constraints.${field}`, `${field} muss ein String-Array sein`))
        }
        for (const field of ['distributionStatus', 'clarificationStatus', 'nextRequiredAction'] as const) {
          if (value.constraints[field] !== undefined && (typeof value.constraints[field] !== 'string' || !value.constraints[field])) issues.push(issue(`${path}.constraints.${field}`, `${field} muss ein nichtleerer String sein`))
        }
      }
    }
  }

  if (issues.length) return { ok: false, issues }
  return { ok: true, approval: input as unknown as SourceApprovalFile, issues: [] }
}

const deny = (code: ImportApprovalDecision['code'], message: string, unmetConditions: ApprovalCondition[] = []): ImportApprovalDecision => ({ allowed: false, code, message, unmetConditions })

export function evaluateImportApproval(input: string | unknown | undefined, request: ImportApprovalRequest): ImportApprovalDecision {
  if (request.fixture) return { allowed: true, code: 'fixture-allowed', message: 'Synthetischer Fixture-Import ist freigegeben', unmetConditions: [] }
  if (input === undefined || input === null) return deny('approval-missing', 'Approval-Datei fehlt; echter Import ist blockiert')
  const validation = parseSourceApproval(input)
  if (!validation.ok || !validation.approval) return deny('approval-invalid', `Approval-Datei ist ungültig: ${validation.issues.map(value => `${value.path}: ${value.message}`).join('; ')}`)
  const source = validation.approval.reviewedSources.find(value => value.sourceId === request.sourceId)
  if (!source) return deny('source-unknown', `Quelle ${request.sourceId} ist nicht geprüft`)
  const category = validation.approval.categoryAssignments.find(value => value.categoryId === request.categoryId)
  if (!category) return deny('category-unknown', `Datenkategorie ${request.categoryId} ist nicht geprüft`)
  if (source.status !== 'approved' && source.status !== 'conditionally-approved') return deny('source-blocked', `Quelle ${source.sourceId} hat Status ${source.status}`)
  if (category.status !== 'approved' && category.status !== 'conditionally-approved') return deny('category-blocked', `Datenkategorie ${category.categoryId} hat Status ${category.status}`)
  if (![category.primarySourceId, category.fallbackSourceId].includes(source.sourceId)) return deny('source-not-assigned', `Quelle ${source.sourceId} ist der Kategorie ${category.categoryId} nicht zugeordnet`)
  const constraints = category.constraints
  if (constraints) {
    const violations: string[] = []
    if (request.sourceVersion !== constraints.sourceVersion) violations.push('sourceVersion')
    if (request.exportCommit !== constraints.exportCommit) violations.push('exportCommit')
    if (request.parserCommit !== constraints.parserCommit) violations.push('parserCommit')
    if (!request.itemCategory || !constraints.allowedItemCategories.includes(request.itemCategory)) violations.push('itemCategory')
    if (!request.sourceFile || !constraints.allowedSourceFiles.includes(request.sourceFile)) violations.push('sourceFile')
    if (!request.requestedFields || request.requestedFields.some(field => !constraints.allowedFields.includes(field))) violations.push('requestedFields')
    if (request.dataCategories?.some(value => constraints.blockedDataCategories.includes(value))) violations.push('blockedDataCategories')
    if (constraints.requireSha256Manifest && request.sha256Manifest !== true) violations.push('sha256Manifest')
    if (constraints.requireDeterministicNormalization && request.deterministicNormalization !== true) violations.push('deterministicNormalization')
    if (constraints.forbidRawMirror && request.rawMirror !== false) violations.push('rawMirror')
    if (constraints.forbidRuntimeFetch && request.runtimeFetch !== false) violations.push('runtimeFetch')
    if (constraints.forbidHotlinks && request.hotlink !== false) violations.push('hotlink')
    if (violations.length) return deny('request-constraints-unmet', `Request verletzt Scope-Bedingungen: ${violations.join(', ')}`)
  }
  if (source.status === 'conditionally-approved' || category.status === 'conditionally-approved') {
    const unmet = source.requiredConditions.filter(condition => request.satisfiedConditions?.[condition] !== true)
    if (unmet.length) return deny('conditions-unmet', `Bedingungen für ${source.sourceId} sind nicht erfüllt: ${unmet.join(', ')}`, unmet)
    return { allowed: true, code: 'conditions-satisfied', message: `Bedingte Freigabe für ${source.sourceId}/${category.categoryId} ist erfüllt`, unmetConditions: [] }
  }
  return { allowed: true, code: 'approved', message: `Import für ${source.sourceId}/${category.categoryId} ist freigegeben`, unmetConditions: [] }
}
