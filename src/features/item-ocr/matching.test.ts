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
    const automatic=result.affixes.filter(value=>value.resolutionStatus==='auto-selected')
    expect(automatic).toEqual(expect.arrayContaining([
      expect.objectContaining({affixId:'LocalIncreasedEnergyShield8',affixSide:'prefix',values:[73]}),
      expect.objectContaining({affixId:'LocalIncreasedEnergyShieldPercent7_',affixSide:'prefix',values:[95]}),
      expect.objectContaining({affixId:'IncreasedLife9',affixSide:'prefix',values:[120]}),
      expect.objectContaining({affixId:'ItemFoundRarityIncrease3',affixSide:'suffix',values:[16]}),
      expect.objectContaining({affixId:'CriticalStrikeChance5',affixSide:'suffix',values:[32]}),
      expect.objectContaining({affixId:'FireResist8',affixSide:'suffix',values:[45]}),
    ]))
    expect(automatic.filter(value=>value.affixSide==='prefix')).toHaveLength(3)
    expect(automatic.filter(value=>value.affixSide==='suffix')).toHaveLength(3)
  })
  it('übernimmt alle sechs Affixe aus dem englischen Screenshot variantengenau in drei Prefixe und drei Suffixe',()=>{
    const result=matchItemOcr(`DOOM CREST
ANCESTRAL TIARA
HELMET: ITEM LEVEL 82
QUALITY: +20%
ENERGY SHIELD: 424
REQUIRES LEVEL 80, 115 INT.
ALLOCATES ZAROKH'S GIFT
RAVEN-TOUCHED
16% INCREASED RARITY OF ITEMS FOUND
+73 TO MAXIMUM ENERGY SHIELD
95% INCREASED ENERGY SHIELD
+120 TO MAXIMUM LIFE
32% INCREASED CRITICAL HIT CHANCE
+45% TO FIRE RESISTANCE`,'slot-helmet')
    const automatic=result.affixes.filter(value=>value.resolutionStatus==='auto-selected')
    expect(result).toMatchObject({rarity:'rare',itemLevel:82,baseDisplayName:'ANCESTRAL TIARA'})
    expect(automatic).toEqual(expect.arrayContaining([
      expect.objectContaining({affixId:'LocalIncreasedEnergyShield8',affixSide:'prefix',values:[73]}),
      expect.objectContaining({affixId:'LocalIncreasedEnergyShieldPercent7_',affixSide:'prefix',values:[95]}),
      expect.objectContaining({affixId:'IncreasedLife9',affixSide:'prefix',values:[120]}),
      expect.objectContaining({affixId:'ItemFoundRarityIncrease3',affixSide:'suffix',values:[16]}),
      expect.objectContaining({affixId:'CriticalStrikeChance5',affixSide:'suffix',values:[32]}),
      expect.objectContaining({affixId:'FireResist8',affixSide:'suffix',values:[45]}),
    ]))
    expect(automatic.filter(value=>value.affixSide==='prefix')).toHaveLength(3)
    expect(automatic.filter(value=>value.affixSide==='suffix')).toHaveLength(3)
    expect(automatic).not.toEqual(expect.arrayContaining([
      expect.objectContaining({affixId:'ItemFoundRarityIncreasePrefix3'}),
    ]))
  })
})
