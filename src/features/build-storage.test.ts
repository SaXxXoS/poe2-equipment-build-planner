import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialCharacterConfiguration } from './character/initial-state'
import { createEmptySkillSetups } from './skills/initial-state'
import { initialEquipment } from '../data'
import { BUILD_STORAGE_KEY, clearStoredBuild, loadStoredBuild, saveStoredBuild } from './build-storage'

const values = new Map<string, string>()
const localStorage = {
  getItem: vi.fn((key: string) => values.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => values.set(key, value)),
  removeItem: vi.fn((key: string) => values.delete(key)),
}

describe('lokaler Buildspeicher', () => {
  afterEach(() => {
    values.clear()
    vi.unstubAllGlobals()
  })

  it('speichert und lädt Charakter, Ausrüstung und Fertigkeiten versioniert', () => {
    vi.stubGlobal('window', { localStorage })
    const build = {
      character: createInitialCharacterConfiguration(),
      equipment: initialEquipment,
      setups: createEmptySkillSetups(),
    }
    saveStoredBuild(build)
    expect(loadStoredBuild()).toEqual({ schemaVersion: 1, ...build })
    expect(localStorage.setItem).toHaveBeenCalledWith(BUILD_STORAGE_KEY, expect.any(String))
  })

  it('ignoriert beschädigte oder unbekannte Speicherstände sicher', () => {
    vi.stubGlobal('window', { localStorage })
    values.set(BUILD_STORAGE_KEY, '{defekt')
    expect(loadStoredBuild()).toBeNull()
    values.set(BUILD_STORAGE_KEY, JSON.stringify({ schemaVersion: 2 }))
    expect(loadStoredBuild()).toBeNull()
  })

  it('löscht nur den Buildspeicher der App', () => {
    vi.stubGlobal('window', { localStorage })
    clearStoredBuild()
    expect(localStorage.removeItem).toHaveBeenCalledWith(BUILD_STORAGE_KEY)
  })
})
