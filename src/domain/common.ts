export const DATA_SOURCES = ['local-placeholder', 'poe2db', 'official', 'manual'] as const
export type DataSource = (typeof DATA_SOURCES)[number]

export const DATA_STATUSES = ['placeholder', 'imported', 'verified'] as const
export type DataStatus = (typeof DATA_STATUSES)[number]

export const MECHANIC_TAGS = [
  'attack', 'spell', 'projectile', 'melee', 'area', 'physical', 'fire', 'cold',
  'lightning', 'chaos', 'critical', 'damage-over-time', 'minion', 'movement',
  'buff', 'debuff', 'defensive',
] as const
export type MechanicTag = (typeof MECHANIC_TAGS)[number]

export type EntityId = string

export interface GameDataMetadata {
  id: EntityId
  displayNameDe: string
  nameEn?: string
  dataVersion: string
  source: DataSource
  sourceReference?: string
  status: DataStatus
  tags: MechanicTag[]
}

export const PLACEHOLDER_VERSION = 'prototype-2'

export function placeholderMetadata(
  id: string,
  displayNameDe: string,
  tags: MechanicTag[] = [],
): GameDataMetadata {
  return { id, displayNameDe, dataVersion: PLACEHOLDER_VERSION, source: 'local-placeholder', status: 'placeholder', tags }
}
