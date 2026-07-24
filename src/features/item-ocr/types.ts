import type { ItemRarity } from '../../domain'

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
}
export interface OcrUniqueCandidate {
  uniqueItemId: string
  uniqueName: string
  confidence: number
  resolutionStatus: OcrResolutionStatus
}

export interface ItemOcrResult {
  rawText: string
  rarity?: ItemRarity
  itemLevel?: number
  baseDisplayName?: string
  itemClassId?: string
  affixes: OcrAffixCandidate[]
  unique?: OcrUniqueCandidate
  warnings: string[]
}
