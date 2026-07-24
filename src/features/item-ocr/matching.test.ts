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
})
