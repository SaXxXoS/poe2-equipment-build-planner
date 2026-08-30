import product from '../../generated/pob2/uniques.json'
import type { UniqueItemSlot } from '../domain'
import type { UniqueCandidate } from '../engine/common/types'
import { resolveExactBaseIdentity } from '../features/equipment-editor/base-identity-resolution'
import { classifyPob2Unique, type Pob2SemanticEvidence } from './pob2-semantics'

export type Pob2UniqueAnalyzerCandidate = UniqueCandidate & {
  semanticEvidence: Pob2SemanticEvidence
  evidenceLineIds: string[]
  technicalBaseIdentity?: {
    resolution: 'exact-local-base'
    baseId: string
    itemClassId: string
    kind: 'weapon' | 'defence' | 'utility'
    nameEn: string
    displayNameDe?: string
    requiredLevel?: number
    requirements: Partial<Record<'strength' | 'dexterity' | 'intelligence', number>>
  }
}

export interface Pob2UniquePlannerRecord {
  sourceId: string
  name: string
  baseDisplayName: string
  slot: UniqueItemSlot
  itemCategory: string
  requiredLevel: number | null
  variants: Array<{ sourceVariantId: string; currentOrLegacy: string; modifierSet: string[] }>
  visibleModifiers: Array<{ sourceLineId: string; normalizedPlannerLine: string; variantScope?: string[]; rollRanges?: Array<{ minimum: number; maximum: number }> }>
  implicits: Array<{ sourceLineId: string; normalizedPlannerLine: string; variantScope?: string[]; rollRanges?: Array<{ minimum: number; maximum: number }> }>
  provenance: {
    sourceKind: 'pob2-planner-data'
    sourceRepository: string
    sourceCommit: string
    sourceRecordIdentifier: string
    gggIdentityStatus: 'unknown'
    germanLocalizationStatus: 'translation-missing'
  }
}

const records = product.items as Pob2UniquePlannerRecord[]

export const pob2UniquePlannerRegistry = Object.freeze(records)

export const pob2UniqueAnalyzerCandidates: Pob2UniqueAnalyzerCandidate[] = records.map(item => {
  const baseIdentity = resolveExactBaseIdentity(item.baseDisplayName)
  const technicalRequirements = baseIdentity
    ? Object.fromEntries(Object.entries(baseIdentity.base.requirements).filter(([, value]) => (value ?? 0) > 0))
    : undefined
  const semanticRecord = { ...item, visibleModifiers: [...item.visibleModifiers, ...item.implicits] }
  const semantics = classifyPob2Unique(semanticRecord)
  const variantSemantics = item.variants.map(variant => {
    const value = classifyPob2Unique({ ...semanticRecord, variants: [variant] })
    return {
      variantId: variant.sourceVariantId,
      tags: value.tags,
      semanticEvidence: value.evidence,
      evidenceLineIds: value.evidenceLineIds,
      tradeOffs: value.tradeOffs,
      buildEnabler: value.buildEnabler,
      requiredWeaponTypes: value.requiredWeaponTypes,
    }
  })
  return ({
  id: item.sourceId,
  displayNameDe: 'translation-missing',
  nameEn: item.name,
  dataVersion: product.generatedDataHash,
  source: 'pob2-planner-data',
  sourceReference: `${item.provenance.sourceRepository}@${item.provenance.sourceCommit}:${item.provenance.sourceRecordIdentifier}`,
  status: 'imported',
  tags: semantics.tags,
  provenance: {
    sourceId: product.sourceScope,
    sourceRecordId: item.provenance.sourceRecordIdentifier,
    sourceLanguage: 'en',
    sourceVersion: item.provenance.sourceCommit,
    importerVersion: product.importContractVersion,
    contentHash: product.generatedDataHash,
    verificationStatus: 'source-verified',
  },
  itemType: item.itemCategory,
  itemSlot: item.slot,
  levelRequirement: Math.max(item.requiredLevel ?? 0, baseIdentity?.base.requiredLevel ?? 0) || undefined,
  attributeRequirements: technicalRequirements,
  technicalBaseIdentity: baseIdentity ? {
    resolution: 'exact-local-base',
    baseId: baseIdentity.base.id,
    itemClassId: baseIdentity.base.itemClassId,
    kind: baseIdentity.kind,
    nameEn: baseIdentity.base.nameEn,
    displayNameDe: baseIdentity.base.displayNameDe ?? undefined,
    requiredLevel: baseIdentity.base.requiredLevel ?? undefined,
    requirements: technicalRequirements ?? {},
  } : undefined,
  modifiers: [],
  ascendancyIds: [],
  enabled: true,
  experimental: true,
  semanticEvidence: semantics.evidence,
  evidenceLineIds: semantics.evidenceLineIds,
  tradeOffs: semantics.tradeOffs,
  buildEnabler: semantics.buildEnabler,
  requiredWeaponTypes: semantics.requiredWeaponTypes,
  variantSemantics,
})})

if (new Set(pob2UniqueAnalyzerCandidates.map(item => item.id)).size !== pob2UniqueAnalyzerCandidates.length) throw new Error('Duplicate PoB2 Unique planner IDs')
if (pob2UniqueAnalyzerCandidates.some(item => item.id.startsWith('fixture:'))) throw new Error('PoB2 Unique registry collides with fixture namespace')
