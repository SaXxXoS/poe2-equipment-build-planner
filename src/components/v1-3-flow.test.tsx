import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CharacterSection } from './CharacterSection'
import { EquipmentSection } from './EquipmentSection'
import { SkillsSection } from './SkillsSection'
import { applyClassSelection, parseUnsignedIntegerDraft, supportedClassOptions } from '../features/character/ui-options'
import { activeWeaponSlotIds, canRemoveJewelEntry, createNextJewelEntry, jewelEntries } from '../features/equipment-editor/layout'
import { createEmptySkillSetups } from '../features/skills/initial-state'
import { createInitialCharacterConfiguration } from '../features/character/initial-state'
import { availablePassivePoints } from '../features/character/passive-points'
import { initialEquipment } from '../data'

describe('V1.3.1 korrigierter Equipment-first-Flow', () => {
  it('zeigt kompakte deutsche Charakterauswahlen und nur unterstützte Klassen', () => {
    const html = renderToStaticMarkup(<CharacterSection value={{ classId:'', ascendancyId:'', level:0, goalProfile:'balanced' }} onChange={() => undefined}/>)
    expect(html).toContain('<select aria-label="Klasse"')
    expect(html).toContain('Klasse auswählen')
    expect(html).toContain('Zuerst Klasse auswählen')
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('choice-list')
    expect(html).not.toContain('character-summary')
    expect(supportedClassOptions.map(value => value.label)).toEqual(['Hexe','Waldläuferin','Krieger','Zauberin','Jägerin','Söldner','Mönch','Druide'])
    expect(html).not.toContain('Marauder')
    expect(applyClassSelection({ classId:'old', ascendancyId:'old-asc', level:1, goalProfile:'balanced' }, 'new')).toMatchObject({ classId:'new', ascendancyId:'' })
  })
  it('behält leere Zahlenentwürfe sichtbar leer und berechnet gültige Punkte', () => {
    expect(parseUnsignedIntegerDraft('')).toBeUndefined()
    expect(parseUnsignedIntegerDraft('1')).toBe(1)
    expect(parseUnsignedIntegerDraft('70')).toBe(70)
    expect(parseUnsignedIntegerDraft('-1')).toBeNull()
    expect(parseUnsignedIntegerDraft('abc')).toBeNull()
    expect(availablePassivePoints(70,8)).toBe(77)
    const html = renderToStaticMarkup(<CharacterSection value={{ classId:'', ascendancyId:'', level:0, goalProfile:'balanced' }} onChange={() => undefined}/>)
    expect(html).toContain('placeholder="Level eingeben"')
    expect(html).toContain('placeholder="Punkte eingeben"')
    expect(html).toContain('placeholder="0 bis 8"')
    expect(html).toContain('Aszendenzpunkte')
    expect(html).not.toContain('value="0"')
  })
  it('ordnet die Hauptausrüstung zusammenhängend und schaltet nur Waffenplätze', () => {
    const html = renderToStaticMarkup(<EquipmentSection entries={initialEquipment} setEntries={() => undefined}/>)
    expect(html).toContain('equipment-loadout')
    expect(html).toContain('equipment-paperdoll-stage')
    expect(html).toContain('Waffenset auswählen')
    expect(html).toContain('Juwelen')
    expect(html).toContain('Charms und Fläschchen')
    expect(html).toContain('equipment-quick-slots')
    expect(html).toContain('Charm 3')
    expect(html).toContain('Juwelenplatz hinzufügen')
    expect(jewelEntries(initialEquipment)).toHaveLength(2)
    expect(createNextJewelEntry(initialEquipment).slotId).toBe('slot-jewel-3')
    expect(canRemoveJewelEntry(jewelEntries(initialEquipment).at(-1))).toBe(true)
    expect(canRemoveJewelEntry({ ...jewelEntries(initialEquipment)[0], itemClassId:'Jewels' })).toBe(false)
    expect(html).not.toContain('Waffenset 2 links')
    expect(activeWeaponSlotIds('set-1')).toEqual(['slot-weapon-set-1-left','slot-weapon-set-1-right'])
    expect(activeWeaponSlotIds('set-2')).toEqual(['slot-weapon-set-2-left','slot-weapon-set-2-right'])
  })
  it('startet mit sechs kompakten leeren Fertigkeitskarten ohne Supports', () => {
    expect(createInitialCharacterConfiguration()).toEqual({ classId:'', ascendancyId:'', level:0, additionalPassivePoints:undefined, ascendancyPassivePoints:undefined, goalProfile:'balanced' })
    expect(initialEquipment.every(value => !value.itemClassId && !value.uniqueItemId && value.modifierValues.length === 0)).toBe(true)
    const setups = createEmptySkillSetups()
    const html = renderToStaticMarkup(<SkillsSection setups={setups} onChange={() => undefined}/>)
    expect(setups).toHaveLength(6)
    expect(setups.every(value => !value.skillId && value.supportGemIds.length === 0)).toBe(true)
    expect((html.match(/class="skill-card empty-skill-card"/g) ?? [])).toHaveLength(6)
    expect((html.match(/placeholder="Fertigkeit suchen"/g) ?? [])).toHaveLength(6)
    expect(html).not.toContain('<h3>Blitzpfeil</h3>')
    expect(html).not.toContain('<h3>Kugelblitz</h3>')
    expect(html).not.toContain('Mehrfachprojektil')
    expect(html).not.toContain('Beste vorschlagen')
    expect(html).toContain('Unterstützungsplätze')
    expect(html).toContain('Zuerst eine Fertigkeit auswählen')
    expect(html).toContain('Support 5')
  })
})
