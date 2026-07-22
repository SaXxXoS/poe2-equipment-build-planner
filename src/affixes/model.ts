import type { EntityId } from '../domain/common'

export type AffixSide = 'prefix' | 'suffix' | 'implicit' | 'special' | 'unknown'
export type LocalizationStatus = 'translation-missing' | 'technical-fallback' | 'not-applicable'
export interface TechnicalStatLine {
  statId: string; minimum: number; maximum: number; step?: number; numericType: 'integer' | 'decimal'; valueType: 'fixed' | 'range'
  signBehavior: 'positive' | 'negative' | 'mixed'; isPercent: boolean; isLocal: boolean; statOrder: number; sourceReference: string
  technicalTemplate?: string | null; localizationStatus: LocalizationStatus
}
export interface TechnicalAffix {
  affixId: EntityId; sourceModId: EntityId; familyId: string; tierId: string; generationType: string; affixSide: AffixSide
  domain: string; itemClassIds: string[]; requiredItemLevel: number | null; tags: string[]; spawnWeights: { tag: string; weight: number }[]
  statLines: TechnicalStatLine[]; groups: string[]; conflictGroups: string[]; isHybrid: boolean; isLocal: boolean | null
  sourceVersion: string; sourceReference: string; dataStatus: 'available' | 'partially-supported' | 'legacy-unresolved'
  localizationStatus: LocalizationStatus; technicalName: string; technicalText: string; baseItemIds?: string[]
}
export interface TechnicalBaseItem { baseItemId:string; itemClassId:string; itemKind:'jewel'|'charm'|'life-flask'|'mana-flask'; dropLevel:number|null; properties:Record<string,number>; tags:string[]; implicitModIds:string[]; sourceVersion:string; sourceReference:string; dataStatus:'available'; localizationStatus:LocalizationStatus }
export interface TechnicalItemClass {
  itemClassId: string; technicalName: string; slotType: string; weaponType: string; handedness: string; sourceVersion: string
  sourceReference: string; uiSupported: boolean; engineSupported: boolean; dataStatus: string; localizationStatus: LocalizationStatus
}
export interface AppliedStatValue { statId: string; value: number }
export interface TechnicalAppliedAffix {
  affixId: EntityId; sourceModId: EntityId; statValues: AppliedStatValue[]; itemClassId: string; affixSide: AffixSide; tierId: string
  requiredItemLevel: number | null; isLocal: boolean | null; isHybrid: boolean; sourceVersion: string; dataStatus: string
}
