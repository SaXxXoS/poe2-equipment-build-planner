import product from '../../generated/pob2/uniques.json'
import type { UniqueItemSlot } from '../domain'
import type { UniqueCandidate } from '../engine/common/types'

export interface Pob2UniquePlannerRecord {
  sourceId: string
  name: string
  baseDisplayName: string
  slot: UniqueItemSlot
  itemCategory: string
  requiredLevel: number | null
  variants: Array<{ sourceVariantId: string; currentOrLegacy: string }>
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

export const pob2UniqueAnalyzerCandidates: UniqueCandidate[] = records.map(item => ({
  id: item.sourceId,
  displayNameDe: 'translation-missing',
  nameEn: item.name,
  dataVersion: product.generatedDataHash,
  source: 'pob2-planner-data',
  sourceReference: `${item.provenance.sourceRepository}@${item.provenance.sourceCommit}:${item.provenance.sourceRecordIdentifier}`,
  status: 'imported',
  tags: [],
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
  levelRequirement: item.requiredLevel ?? undefined,
  modifiers: [],
  ascendancyIds: [],
  enabled: true,
  experimental: true,
}))

if (new Set(pob2UniqueAnalyzerCandidates.map(item => item.id)).size !== pob2UniqueAnalyzerCandidates.length) throw new Error('Duplicate PoB2 Unique planner IDs')
if (pob2UniqueAnalyzerCandidates.some(item => item.id.startsWith('fixture:'))) throw new Error('PoB2 Unique registry collides with fixture namespace')
