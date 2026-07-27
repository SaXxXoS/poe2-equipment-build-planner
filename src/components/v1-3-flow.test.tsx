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
import { AffixDialog, affixConflictGroupsBlockObservedEquipment } from './AffixDialog'
import { itemSupportsDefenceValues, weaponStatsAreValid } from '../features/equipment-editor/item-stat-fields'
import { automaticallySelectedOcrIds } from '../features/item-ocr/selection'

describe('V1.3.1 korrigierter Equipment-first-Flow', () => {
  it('zeigt einen Planvorschlag direkt im passenden leeren Ausrüstungsslot', () => {
    const html = renderToStaticMarkup(
      <EquipmentSection
        entries={initialEquipment}
        setEntries={() => undefined}
        suggestions={[
          {
            slotId: 'slot-helmet',
            title: 'Beispielhelm',
            detail: 'Passt zur belegten Schadensskalierung.',
            source: 'unique-analyzer',
          },
        ]}
      />,
    )
    expect(html).toContain('Planvorschlag')
    expect(html).toContain('Beispielhelm')
    expect(html).toContain('suggested-slot')
  })

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
  it('validiert tatsächliche Waffenbereiche und Angriffsgeschwindigkeit',()=>{
    expect(weaponStatsAreValid({physicalDamage:{minimum:46,maximum:91},criticalHitChance:6,attacksPerSecond:1.5})).toBe(true)
    expect(weaponStatsAreValid({physicalDamage:{minimum:91,maximum:46}})).toBe(false)
    expect(weaponStatsAreValid({attacksPerSecond:0})).toBe(false)
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
  it('startet mit neun kompakten leeren Fertigkeitskarten ohne Supports', () => {
    expect(createInitialCharacterConfiguration()).toEqual({ classId:'', ascendancyId:'', level:0, additionalPassivePoints:undefined, ascendancyPassivePoints:undefined, goalProfile:'balanced' })
    expect(initialEquipment.every(value => !value.itemClassId && !value.uniqueItemId && value.modifierValues.length === 0)).toBe(true)
    const setups = createEmptySkillSetups()
    const html = renderToStaticMarkup(<SkillsSection setups={setups} onChange={() => undefined}/>)
    expect(setups).toHaveLength(9)
    expect(setups.every(value => !value.skillId && value.supportGemIds.length === 0)).toBe(true)
    expect((html.match(/class="skill-card empty-skill-card"/g) ?? [])).toHaveLength(9)
    expect((html.match(/placeholder="Fertigkeit suchen"/g) ?? [])).toHaveLength(9)
    expect(html).not.toContain('<h3>Blitzpfeil</h3>')
    expect(html).not.toContain('<h3>Kugelblitz</h3>')
    expect(html).not.toContain('Mehrfachprojektil')
    expect(html).not.toContain('Beste vorschlagen')
    expect(html).toContain('Unterstützungsplätze')
    expect(html).toContain('Zuerst eine Fertigkeit auswählen')
    expect(html).toContain('Support 5')
  })
  it('bietet Foto- und Screenshot-Erkennung direkt im leeren Ausrüstungsslot an',()=>{
    const html=renderToStaticMarkup(<AffixDialog entry={initialEquipment[0]} slotName="Helm" onSave={()=>undefined} onClose={()=>undefined}/>)
    expect(html).toContain('Foto aufnehmen')
    expect(html).toContain('Screenshot wählen')
    expect(html).toContain('capture="environment"')
    expect(html).toContain('Das Bild bleibt auf deinem Gerät')
  })
  it('wählt ein sicher erkanntes Unique für die Übernahme automatisch aus',()=>{
    expect(automaticallySelectedOcrIds({
      rawText:'THE ORDAINED',rarity:'unique',observedLines:[],affixes:[],warnings:[],
      unique:{uniqueItemId:'pob2:src/Data/Uniques/spear.lua#4',uniqueName:'The Ordained',confidence:100,resolutionStatus:'auto-selected',observedLines:['GRANTS SKILL: SPEAR THROW'],observedImplicitLines:[]},
    })).toEqual(['pob2:src/Data/Uniques/spear.lua#4'])
  })
  it('blockiert reale Mehrfachwerte nicht durch technische Konfliktgruppen',()=>{
    expect(affixConflictGroupsBlockObservedEquipment).toBe(false)
  })
  it('kennzeichnet Waffen-Editoren ohne Rüstungs-Eingabebereich',()=>{
    const weapon=initialEquipment.find(value=>value.slotId==='slot-weapon-set-1-left')!
    const html=renderToStaticMarkup(<AffixDialog entry={weapon} slotName="Waffe Set 1 links" onSave={()=>undefined} onClose={()=>undefined}/>)
    expect(html).toContain('weapon-item-editor')
    expect(itemSupportsDefenceValues('Bows')).toBe(false)
    expect(itemSupportsDefenceValues('Wands')).toBe(false)
    expect(itemSupportsDefenceValues(undefined,'spear')).toBe(false)
    expect(itemSupportsDefenceValues('Body Armours')).toBe(true)
    expect(itemSupportsDefenceValues(undefined,'shield')).toBe(true)
  })
})
