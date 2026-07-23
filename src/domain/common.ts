export const DATA_SOURCES = ['local-placeholder', 'poe2db', 'official', 'manual', 'pob2-planner-data'] as const
export type DataSource = (typeof DATA_SOURCES)[number]

export const DATA_STATUSES = ['placeholder', 'imported', 'verified'] as const
export type DataStatus = (typeof DATA_STATUSES)[number]

export const MECHANIC_TAGS = [
  'attack', 'spell', 'projectile', 'melee', 'area', 'physical', 'fire', 'cold',
  'lightning', 'chaos', 'critical', 'damage-over-time', 'minion', 'movement',
  'buff', 'debuff', 'defensive', 'resistance', 'resource', 'strength', 'dexterity', 'intelligence',
] as const
export type MechanicTag = (typeof MECHANIC_TAGS)[number]

export type EntityId = string

export type SourceLanguage = 'de' | 'en' | 'unknown'
export type VerificationStatus = 'unverified' | 'structure-validated' | 'source-verified'

export interface DataProvenance {
  sourceId: string
  sourceUrl?: string
  sourceRecordId?: string
  sourceLanguage?: SourceLanguage
  sourceVersion?: string
  gameVersion?: string
  importedAt?: string
  importerVersion?: string
  contentHash?: string
  verificationStatus?: VerificationStatus
}

export interface GameDataMetadata {
  id: EntityId
  displayNameDe: string
  nameEn?: string
  dataVersion: string
  source: DataSource
  sourceReference?: string
  status: DataStatus
  tags: MechanicTag[]
  provenance?: DataProvenance
}

export const PLACEHOLDER_VERSION = 'prototype-2'

export function placeholderMetadata(
  id: string,
  displayNameDe: string,
  tags: MechanicTag[] = [],
): GameDataMetadata {
  return { id, displayNameDe, dataVersion: PLACEHOLDER_VERSION, source: 'local-placeholder', status: 'placeholder', tags }
}
