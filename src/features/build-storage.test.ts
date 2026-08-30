import { afterEach, describe, expect, it, vi } from 'vitest'
import { createInitialCharacterConfiguration } from './character/initial-state'
import { createEmptySkillSetups } from './skills/initial-state'
import { initialEquipment } from '../data'
import { BUILD_STORAGE_KEY, BUILD_STORAGE_SCHEMA_VERSION, clearStoredBuild, loadStoredBuild, saveStoredBuild } from './build-storage'

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
    const loaded=loadStoredBuild()
    expect(loaded).toMatchObject({ schemaVersion:BUILD_STORAGE_SCHEMA_VERSION,character:build.character })
    expect(loaded?.equipment.map(entry=>entry.slotId)).toEqual(build.equipment.map(entry=>entry.slotId))
    expect(loaded?.setups.map(setup=>setup.id)).toEqual(build.setups.map(setup=>setup.id))
    expect(localStorage.setItem).toHaveBeenCalledWith(BUILD_STORAGE_KEY, expect.any(String))
  })

  it('ignoriert beschädigte oder unbekannte Speicherstände sicher', () => {
    vi.stubGlobal('window', { localStorage })
    values.set(BUILD_STORAGE_KEY, '{defekt')
    expect(loadStoredBuild()).toBeNull()
    values.set(BUILD_STORAGE_KEY, JSON.stringify({ schemaVersion: 99 }))
    expect(loadStoredBuild()).toBeNull()
  })

  it('migriert einen alten V1-Speicherstand, ergänzt neue Slots und bewahrt Eingaben', () => {
    vi.stubGlobal('window', { localStorage })
    const legacyEquipment = [{
      id:'equipment-slot-helmet', slotId:'slot-helmet', itemClassId:'Helmets',
      modifierValues:[{ id:'', modifierId:'legacy-life', value:42, affixSide:'prefix' }],
    }]
    values.set(BUILD_STORAGE_KEY, JSON.stringify({
      schemaVersion:1,
      character:{ classId:'class-official-6', ascendancyId:'ascendancy-stormweaver', level:84, goalProfile:'boss' },
      equipment:legacyEquipment,
      setups:[{ id:'skill-setup-1', skillId:'skill-spark', role:'main', weaponSet:'set-1', supportGemIds:['support-a'] }],
    }))
    const loaded=loadStoredBuild()
    expect(loaded?.schemaVersion).toBe(BUILD_STORAGE_SCHEMA_VERSION)
    expect(loaded?.equipment).toHaveLength(initialEquipment.length)
    expect(loaded?.equipment.find(entry=>entry.slotId==='slot-helmet')?.modifierValues[0]?.id).toBeTruthy()
    expect(loaded?.setups).toHaveLength(createEmptySkillSetups().length)
    expect(loaded?.setups[0]).toMatchObject({skillId:'skill-spark',embeddedSkillIds:[],supportGemIds:['support-a']})
  })

  it('blockiert unbekannte Slots und repariert doppelte Fertigkeits-IDs deterministisch', () => {
    vi.stubGlobal('window', { localStorage })
    values.set(BUILD_STORAGE_KEY, JSON.stringify({
      schemaVersion:BUILD_STORAGE_SCHEMA_VERSION,
      character:createInitialCharacterConfiguration(),
      equipment:[...initialEquipment,{id:'evil',slotId:'slot-unbekannt',modifierValues:[]}],
      setups:[
        {id:'doppelt',skillId:'',role:'main',weaponSet:'both',supportGemIds:[]},
        {id:'doppelt',skillId:'',role:'unbekannt',weaponSet:'unbekannt',supportGemIds:'defekt'},
      ],
    }))
    const loaded=loadStoredBuild()!
    expect(loaded.equipment.some(entry=>entry.slotId==='slot-unbekannt')).toBe(false)
    expect(new Set(loaded.setups.map(setup=>setup.id)).size).toBe(loaded.setups.length)
    expect(loaded.setups[1]).toMatchObject({role:'utility',weaponSet:'both',supportGemIds:[]})
  })

  it('löscht nur den Buildspeicher der App', () => {
    vi.stubGlobal('window', { localStorage })
    clearStoredBuild()
    expect(localStorage.removeItem).toHaveBeenCalledWith(BUILD_STORAGE_KEY)
  })
})
