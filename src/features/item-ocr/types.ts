import type { EquipmentDefences, EquipmentWeaponStats, ItemRarity } from '../../domain'

export type ItemImageMode = 'photo' | 'screenshot'
export type OcrResolutionStatus = 'auto-selected' | 'review-required'

export interface OcrAffixCandidate {
  affixId: string
  affixSide: 'prefix' | 'suffix' | 'implicit'
  itemClassId: string
  sourceText: string
  displayText: string
  values: number[]
  confidence: number
  resolutionStatus: OcrResolutionStatus
  sourceOrder?: number
}
export interface OcrUniqueCandidate {
  uniqueItemId: string
  uniqueName: string
  confidence: number
  resolutionStatus: OcrResolutionStatus
  observedLines: string[]
  observedImplicitLines: string[]
}

export interface ItemOcrResult {
  rawText: string
  rarity?: ItemRarity
  itemLevel?: number
  quality?: number
  defences?: EquipmentDefences
  weaponStats?: EquipmentWeaponStats
  baseDisplayName?: string
  itemClassId?: string
  observedLines: string[]
  affixes: OcrAffixCandidate[]
  unique?: OcrUniqueCandidate
  warnings: string[]
}
