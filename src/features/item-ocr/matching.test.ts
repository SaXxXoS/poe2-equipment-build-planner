import { describe,expect,it } from 'vitest'
import { matchItemOcr,normalizeOcrText } from './matching'

describe('lokale Gegenstands-OCR-Zuordnung',()=>{
  it('erkennt Seltenheit, Item-Level, Slotklasse, Affixtier und tatsächlichen Wert',()=>{
    const result=matchItemOcr(`Item Class: Helmets
Rarity: Rare
Viper Crown
Expert Chainmail Coif
--------
Item Level: 70
--------
+100 to Accuracy Rating`,'slot-helmet')
    expect(result).toMatchObject({rarity:'rare',itemLevel:70,itemClassId:'Helmets',baseDisplayName:'Expert Chainmail Coif'})
    expect(result.affixes).toContainEqual(expect.objectContaining({affixId:'IncreasedAccuracy4',affixSide:'prefix',values:[100],resolutionStatus:'auto-selected'}))
  })
  it('erkennt ein Unique nur als PoB2-Kandidat und erfindet keine Variante',()=>{
    const result=matchItemOcr(`Item Class: Amulets
Rarity: Unique
The Anvil
Bloodstone Amulet`,'slot-amulet')
    expect(result.unique).toMatchObject({uniqueName:'The Anvil',resolutionStatus:'auto-selected'})
    expect(result).not.toHaveProperty('unique.variantId')
  })
  it('lässt unlesbaren oder mehrdeutigen Text ungeklärt',()=>{
    const result=matchItemOcr('xx 11 ?? unreadable','slot-helmet')
    expect(result.affixes.filter(value=>value.resolutionStatus==='auto-selected')).toHaveLength(0)
    expect(result.warnings.length).toBeGreaterThan(0)
  })
  it('normalisiert OCR-Typografie deterministisch',()=>{
    expect(normalizeOcrText('  +10   to Life — Test  ')).toBe('+10 to Life - Test')
  })
  it('erkennt einen deutschen seltenen Ingame-Tooltip mit flektierten Affixtexten',()=>{
    const result=matchItemOcr(`DOOM CREST
AHNENTIARA
HELM: GEGENSTANDSSTUFE 82
QUALITÄT: +20%
ENERGIESCHILD: 424
ERFORDERT STUFE 80, INTELLIGENZ 115
16% ERHÖHTE SELTENHEIT DER GEFUNDENEN GEGENSTÄNDE
+73 ZUM MAXIMALEN ENERGIESCHILD
95% ERHÖHTER ENERGIESCHILD
+120 BIS MAXIMALES LEBEN
32% ERHÖHTE CHANCE AUF KRITISCHE TREFFER
+45% FEUERBESTÄNDIGKEIT`,'slot-helmet')
    expect(result.rarity).toBe('rare')
    expect(result.itemLevel).toBe(82)
    expect(result.baseDisplayName).toBe('AHNENTIARA')
    expect(result.affixes.find(value=>value.affixId==='IncreasedLife9')).toMatchObject({values:[120],resolutionStatus:'auto-selected'})
    expect(result.affixes.find(value=>value.values.includes(45))?.resolutionStatus).toBe('auto-selected')
    expect(result.affixes.filter(value=>value.resolutionStatus==='auto-selected').length).toBeGreaterThanOrEqual(5)
  })
})
