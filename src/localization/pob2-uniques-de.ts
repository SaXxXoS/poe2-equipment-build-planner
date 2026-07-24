import product from '../../generated/pob2/uniques.json'
import germanDisplay from '../../generated/localization/de/pob2-uniques.json'

export type Pob2GermanLocalizationStatus = 'verified-local-source' | 'reviewed-app-translation' | 'review-required' | 'translation-missing'
interface DisplayField { text: string; status: Pob2GermanLocalizationStatus }
interface ProductLine { sourceLineId: string; normalizedPlannerLine: string; rollRanges: Array<{ placeholder: string; minimum: number; maximum: number }> }
interface ProductVariant { sourceVariantId: string; displayLabel: string; currentOrLegacy: string; modifierSet: string[] }
interface ProductItem { sourceId: string; name: string; baseDisplayName: string; slot: string; itemCategory: string; requiredLevel: number | null; variants: ProductVariant[]; visibleModifiers: ProductLine[]; implicits: ProductLine[] }
interface DisplayItem { uniqueId: string; name: DisplayField; baseDisplayName: DisplayField; variants: Array<{ sourceVariantId: string; displayLabel: DisplayField }>; modifiers: Array<{ sourceLineId: string; displayText: DisplayField }>; implicits: Array<{ sourceLineId: string; displayText: DisplayField }> }
export interface LocalizedPob2Line { id: string; text: string; status: Pob2GermanLocalizationStatus }
export interface LocalizedPob2Unique { id: string; name: string; nameStatus: Pob2GermanLocalizationStatus; baseDisplayName: string; baseStatus: Pob2GermanLocalizationStatus; slot: string; itemCategory: string; requiredLevel: number | null; variants: Array<LocalizedPob2Line & { currentOrLegacy: string }>; modifiers: LocalizedPob2Line[]; implicits: LocalizedPob2Line[] }

const displayItems = new Map((germanDisplay.items as DisplayItem[]).map(item => [item.uniqueId, item]))
const productItems = new Map((product.items as ProductItem[]).map(item => [item.sourceId, item]))
export function resolvePob2GermanDisplay(field: DisplayField | undefined, english: string): DisplayField {
  if (field?.text.trim()) return field
  if (english.trim()) return { text: english, status: 'translation-missing' }
  return { text: 'translation-missing', status: 'translation-missing' }
}
function renderValues(text: string, ranges: ProductLine['rollRanges']): string {
  return ranges.reduce((result, range) => result.replaceAll(`{${range.placeholder}}`, range.minimum === range.maximum ? String(range.minimum) : `${range.minimum}–${range.maximum}`), text)
}
function localizeLines(source: ProductLine[], displays: Array<{ sourceLineId: string; displayText: DisplayField }> | undefined): LocalizedPob2Line[] {
  const byId = new Map(displays?.map(line => [line.sourceLineId, line]))
  return source.map(line => {
    const field = resolvePob2GermanDisplay(byId.get(line.sourceLineId)?.displayText, line.normalizedPlannerLine)
    return { id: line.sourceLineId, text: renderValues(field.text, line.rollRanges), status: field.status }
  })
}

export const localizedPob2UniquesDe: LocalizedPob2Unique[] = (product.items as ProductItem[]).map(item => {
  const display = displayItems.get(item.sourceId)
  const localizedName = resolvePob2GermanDisplay(display?.name, item.name)
  const localizedBase = resolvePob2GermanDisplay(display?.baseDisplayName, item.baseDisplayName)
  const variantDisplays = new Map(display?.variants.map(variant => [variant.sourceVariantId, variant]))
  return {
    id: item.sourceId, name: localizedName.text, nameStatus: localizedName.status,
    baseDisplayName: localizedBase.text, baseStatus: localizedBase.status,
    slot: item.slot, itemCategory: item.itemCategory, requiredLevel: item.requiredLevel,
    variants: item.variants.map(variant => {
      const field = resolvePob2GermanDisplay(variantDisplays.get(variant.sourceVariantId)?.displayLabel, variant.displayLabel)
      return { id: variant.sourceVariantId, text: field.text, status: field.status, currentOrLegacy: variant.currentOrLegacy }
    }),
    modifiers: localizeLines(item.visibleModifiers, display?.modifiers),
    implicits: localizeLines(item.implicits, display?.implicits),
  }
})

export function localizedPob2LinesForVariant(item: LocalizedPob2Unique, variantId?: string) {
  const source = productItems.get(item.id)
  const selected = variantId
    ? source?.variants.find(variant => variant.sourceVariantId === variantId)
    : source?.variants.length === 1 ? source.variants[0] : undefined
  const allowed = selected
    ? new Set(selected.modifierSet)
    : source?.variants.length
      ? source.variants.map(variant => new Set(variant.modifierSet)).reduce((left, right) => new Set([...left].filter(id => right.has(id))))
      : new Set([...(source?.visibleModifiers ?? []), ...(source?.implicits ?? [])].map(line => line.sourceLineId))
  return {
    modifiers: item.modifiers.filter(line => allowed.has(line.id)),
    implicits: item.implicits.filter(line => allowed.has(line.id)),
    exactVariant: Boolean(selected),
  }
}
export const pob2GermanDisplayMetadata = { sourceProductHash: germanDisplay.sourceProductHash, localizationDataHash: germanDisplay.localizationDataHash, coverage: germanDisplay.coverage }
