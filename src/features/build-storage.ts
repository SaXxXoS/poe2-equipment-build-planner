import type { CharacterConfiguration, EquipmentEntry, SkillSetup } from '../domain'

export const BUILD_STORAGE_KEY = 'poe2-build-assistant:v1'
export interface StoredBuild {
  schemaVersion: 1
  character: CharacterConfiguration
  equipment: EquipmentEntry[]
  setups: SkillSetup[]
}

export function loadStoredBuild(): StoredBuild | null {
  if (typeof window === 'undefined') return null
  try {
    const value = JSON.parse(window.localStorage.getItem(BUILD_STORAGE_KEY) ?? 'null') as Partial<StoredBuild> | null
    if (!value || value.schemaVersion !== 1 || !value.character || !Array.isArray(value.equipment) || !Array.isArray(value.setups)) return null
    return value as StoredBuild
  } catch {
    return null
  }
}

export function saveStoredBuild(value: Omit<StoredBuild, 'schemaVersion'>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify({ schemaVersion: 1, ...value } satisfies StoredBuild))
}

export function clearStoredBuild() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(BUILD_STORAGE_KEY)
}
