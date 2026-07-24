import localizationData from '../../generated/localization/de/poe2-affixes.json'

export type GermanAffixDisplayStatus = 'verified-local-source' | 'reviewed-app-translation'

export interface GermanAffixDisplayRecord {
  affixId: string
  locale: 'de'
  status: GermanAffixDisplayStatus
  text: string
  sourceReference: string
  resolutionMethod: string
}

const records = localizationData.records as GermanAffixDisplayRecord[]
const byId = new Map(records.map(record => [record.affixId, record]))

export function germanAffixDisplay(affixId: string) {
  return byId.get(affixId) ?? null
}

export const germanAffixDisplayCoverage = {
  total: localizationData.recordCount,
  verifiedLocalSource: localizationData.localizedCount,
  reviewedAppTranslation: localizationData.reviewedAppTranslationCount,
  translationMissing: localizationData.translationMissingCount,
}
