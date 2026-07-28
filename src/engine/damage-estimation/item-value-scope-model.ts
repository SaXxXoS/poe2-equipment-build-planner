import type { EquipmentEntry } from '../../domain'

export const ITEM_VALUE_SCOPE_MODEL_VERSION = '1.0.0'

export type ItemValueBasis = 'observed-final-values' | 'pinned-base-values' | 'no-numeric-item-values'
export type ItemQualityStatus =
  | 'included-in-observed-final-values'
  | 'blocked-missing-exact-quality-formula'
  | 'display-only-no-applicable-value'
  | 'not-provided'
export type LocalModifierStatus =
  | 'excluded-already-in-observed-final-values'
  | 'applied-to-pinned-base-values'
  | 'blocked-missing-base-values'
  | 'not-present'

export interface ItemValueScopeResolutionEntry {
  itemId: string
  slotId: string
  quality?: number
  valueBasis: ItemValueBasis
  qualityStatus: ItemQualityStatus
  localModifierStatus: LocalModifierStatus
  localModifierIds: string[]
  globalModifierIds: string[]
  productive: boolean
  detail: string
}

export interface ItemValueScopeModel {
  modelVersion: typeof ITEM_VALUE_SCOPE_MODEL_VERSION
  entries: ItemValueScopeResolutionEntry[]
  blockedItemIds: string[]
  observedFinalValueItemIds: string[]
  localModifiersExcludedFromGlobalScaling: number
  limitations: string[]
}

const hasValues = (value: object | undefined) =>
  Boolean(value && Object.values(value).some(entry => entry !== undefined))

export function resolveItemValueScopeModel(equipment: EquipmentEntry[]): ItemValueScopeModel {
  const entries = equipment
    .filter(entry =>
      entry.quality !== undefined ||
      hasValues(entry.weaponStats) ||
      hasValues(entry.defences) ||
      entry.modifierValues.length > 0,
    )
    .map(entry => {
      const localModifierIds = entry.modifierValues
        .filter(modifier => modifier.isLocal === true)
        .map(modifier => modifier.id)
        .sort()
      const globalModifierIds = entry.modifierValues
        .filter(modifier => modifier.isLocal !== true)
        .map(modifier => modifier.id)
        .sort()
      const observedFinalValues = hasValues(entry.weaponStats) || hasValues(entry.defences)
      const isWeapon = entry.slotId.includes('weapon-')
      const hasPinnedBase = isWeapon && Boolean(entry.baseDisplayName || entry.itemDefinitionId)
      const valueBasis: ItemValueBasis = observedFinalValues
        ? 'observed-final-values'
        : hasPinnedBase
          ? 'pinned-base-values'
          : 'no-numeric-item-values'
      const qualityStatus: ItemQualityStatus = entry.quality === undefined
        ? 'not-provided'
        : observedFinalValues
          ? 'included-in-observed-final-values'
          : hasPinnedBase
            ? 'blocked-missing-exact-quality-formula'
            : 'display-only-no-applicable-value'
      const localModifierStatus: LocalModifierStatus = localModifierIds.length === 0
        ? 'not-present'
        : observedFinalValues
          ? 'excluded-already-in-observed-final-values'
          : hasPinnedBase
            ? 'applied-to-pinned-base-values'
            : 'blocked-missing-base-values'
      const productive =
        qualityStatus !== 'blocked-missing-exact-quality-formula' &&
        localModifierStatus !== 'blocked-missing-base-values'
      const detail = observedFinalValues
        ? 'Die eingegebenen Tooltipwerte sind Endwerte. Qualität und lokale Affixe werden nicht erneut auf diese Werte gerechnet.'
        : hasPinnedBase
          ? qualityStatus === 'blocked-missing-exact-quality-formula'
            ? 'Die Basis ist bekannt, aber für die eingegebene Qualität fehlt eine exakte, gepinnte Wirkungsformel.'
            : 'Lokale Affixe dürfen einmal auf die gepinnte Basis wirken; globale Werte bleiben davon getrennt.'
          : 'Ohne Endwert oder gepinnte Basis entsteht kein numerischer Gegenstandswert.'
      return {
        itemId: entry.id,
        slotId: entry.slotId,
        quality: entry.quality,
        valueBasis,
        qualityStatus,
        localModifierStatus,
        localModifierIds,
        globalModifierIds,
        productive,
        detail,
      }
    })
    .sort((a, b) => a.slotId.localeCompare(b.slotId) || a.itemId.localeCompare(b.itemId))

  return {
    modelVersion: ITEM_VALUE_SCOPE_MODEL_VERSION,
    entries,
    blockedItemIds: entries.filter(entry => !entry.productive).map(entry => entry.itemId),
    observedFinalValueItemIds: entries
      .filter(entry => entry.valueBasis === 'observed-final-values')
      .map(entry => entry.itemId),
    localModifiersExcludedFromGlobalScaling: entries
      .filter(entry => entry.localModifierStatus === 'excluded-already-in-observed-final-values')
      .reduce((sum, entry) => sum + entry.localModifierIds.length, 0),
    limitations: [
      'Tooltip-Endwerte werden als bereits durch Qualität und lokale Affixe beeinflusst behandelt.',
      'Qualität wird ohne exakte gepinnte Basisformel niemals zusätzlich geschätzt.',
      'Lokale Affixe dürfen nicht als globale Build-Skalierung wirken.',
    ],
  }
}

export function itemValueScopeOutput(model: ItemValueScopeModel) {
  return {
    modelVersion: model.modelVersion,
    entries: model.entries,
    blockedItemIds: model.blockedItemIds,
    observedFinalValueItemIds: model.observedFinalValueItemIds,
    localModifiersExcludedFromGlobalScaling: model.localModifiersExcludedFromGlobalScaling,
    limitations: model.limitations,
  }
}
