import type { DataSource, MechanicTag, ModifierCategory, ModifierScope, ModifierUnit, PassiveNodeType, SourceLanguage } from '../domain'

export const IMPORT_SCHEMA_VERSION = '1.0.0'
export const IMPORTER_VERSION = '0.1.0'
export const IMPORT_STATUSES = ['fixture', 'experimental', 'validated', 'rejected'] as const
export type ImportStatus = (typeof IMPORT_STATUSES)[number]
export const RAW_CATEGORIES = ['classes', 'ascendancies', 'modifiers', 'skills', 'supports', 'jewels', 'clusterJewels', 'uniqueClusterJewels', 'uniques', 'passiveNodes', 'passiveConnections'] as const
export type RawCategory = (typeof RAW_CATEGORIES)[number]
export type ImportCounts = Record<RawCategory, number>

export interface ImportManifest {
  schemaVersion: string
  importerVersion: string
  source: DataSource
  sourceId: string
  sourceUrl?: string
  sourceVersion: string
  gameVersion: string
  language: SourceLanguage
  importedAt: string
  counts: ImportCounts
  hashes: Partial<Record<RawCategory | 'dataset', string>>
  warnings: string[]
  status: ImportStatus
}

export interface RawBase { sourceRecordId: string; nameDe: string; nameEn?: string; tags: string[] }
export type RawClass = RawBase
export interface RawAscendancy extends RawBase { classSourceRecordId: string }
export interface RawModifier extends RawBase { category: ModifierCategory; unit: ModifierUnit; scope: ModifierScope; minValue?: number; maxValue?: number; allowedSlotIds: string[] }
export interface RawSkill extends RawBase { supportSourceRecordIds?: string[] }
export interface RawSupport extends RawBase { requiredTags: string[]; excludedTags: string[]; ownTags: string[] }
export interface RawJewel extends RawBase { description: string; modifierSourceRecordIds: string[] }
export interface RawClusterJewel extends RawJewel { clusterSize: 'small' | 'medium' | 'large'; passiveNodeSourceRecordIds: string[]; additionalPathCost: number }
export interface RawUnique extends RawBase { itemType: string; modifierSourceRecordIds: string[] }
export interface RawPassiveNode extends RawBase { nodeType: PassiveNodeType; x: number; y: number; modifierSourceRecordIds: string[] }
export interface RawPassiveConnection { sourceRecordId: string; fromNodeSourceRecordId: string; toNodeSourceRecordId: string }

export interface CanonicalRawData {
  manifest: ImportManifest
  classes: RawClass[]
  ascendancies: RawAscendancy[]
  modifiers: RawModifier[]
  skills: RawSkill[]
  supports: RawSupport[]
  jewels: RawJewel[]
  clusterJewels: RawClusterJewel[]
  uniqueClusterJewels: RawJewel[]
  uniques: RawUnique[]
  passiveNodes: RawPassiveNode[]
  passiveConnections: RawPassiveConnection[]
}

export type ImportIssueCode = 'schema' | 'manifest' | 'duplicate' | 'reference' | 'tag' | 'value' | 'source' | 'count' | 'category'
export interface ImportIssue { code: ImportIssueCode; path: string; message: string; recordId?: string }
export interface ImportReport {
  status: ImportStatus
  schemaVersion: string
  sourceVersion: string
  importedRecords: number
  rejectedRecords: number
  counts: ImportCounts
  hashes: Partial<Record<RawCategory | 'dataset', string>>
  warnings: string[]
  errors: ImportIssue[]
  duplicates: string[]
  missingReferences: string[]
}

export interface ImportedDomainData {
  classes: import('../domain').ClassDefinition[]
  ascendancies: import('../domain').AscendancyDefinition[]
  modifiers: import('../domain').ModifierDefinition[]
  skills: import('../domain').SkillGemDefinition[]
  supports: import('../domain').SupportGemDefinition[]
  jewels: import('../domain').JewelDefinition[]
  clusterJewels: import('../domain').ClusterJewelDefinition[]
  uniqueClusterJewels: import('../domain').UniqueClusterJewelDefinition[]
  uniques: import('../domain').UniqueItemDefinition[]
  passiveNodes: import('../domain').PassiveNodeDefinition[]
  passiveConnections: import('../domain').PassiveConnection[]
}

export interface ImportResult { ok: boolean; data?: ImportedDomainData; report: ImportReport }
export const isMechanicTag = (value: string): value is MechanicTag => (['attack','spell','projectile','melee','area','physical','fire','cold','lightning','chaos','critical','damage-over-time','minion','movement','buff','debuff','defensive'] as string[]).includes(value)
