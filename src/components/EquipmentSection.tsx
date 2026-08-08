import { useState } from 'react'
import { technicalAffixById } from '../affixes/registry'
import { equipmentSlotDefinitions } from '../data'
import type { EquipmentEntry } from '../domain'
import { localizedPob2LinesForVariant, localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { affixDisplayName } from '../features/equipment-editor/affix-display'
import { inferItemRarity } from '../features/equipment-editor/model'
import { activeWeaponSlotIds, canRemoveJewelEntry, createNextJewelEntry, jewelEntries } from '../features/equipment-editor/layout'
import { AffixDialog } from './AffixDialog'
import type { EquipmentSlotSuggestion } from '../features/equipment-editor/recommendations'

const slotName = (id: string) => equipmentSlotDefinitions.find(slot => slot.id === id)?.displayNameDe ?? (id.startsWith('slot-jewel-') ? `Normales Juwel ${id.split('-').at(-1)}` : id)
const visibleSlotName = (id: string) => id.includes('weapon') ? (id.endsWith('left') ? 'Waffe L' : 'Waffe R') : id === 'slot-ring-1' ? 'R1' : id === 'slot-ring-2' ? 'R2' : id === 'slot-amulet' ? 'A' : id === 'slot-life-flask' ? 'Leben' : id === 'slot-mana-flask' ? 'Mana' : id.startsWith('slot-jewel-') ? `Juwel ${id.split('-').at(-1)}` : slotName(id)
const rarityName = { normal:'Normal', magic:'Magisch', rare:'Selten', unique:'Einzigartig' }
const slotGlyph = (id: string) => id.includes('weapon') ? '◆' : id.includes('helmet') ? '⌒' : id.includes('body') ? '◈' : id.includes('gloves') ? '◇' : id.includes('boots') ? '▽' : id.includes('belt') ? '▬' : id.includes('ring') ? '○' : id.includes('amulet') ? '♢' : id.includes('flask') ? '▥' : id.includes('charm') ? '✦' : '●'
function EquipmentSlot({ entry, onClick, compact = false, suggestion }: { entry: EquipmentEntry; onClick: () => void; compact?: boolean; suggestion?:EquipmentSlotSuggestion }) {
  const unique = localizedPob2UniquesDe.find(item => item.id === entry.uniqueItemId)
  const variant = unique?.variants.find(item => item.id === entry.uniqueVariantId)
  const rarity = inferItemRarity(entry)
  const propertyCount = entry.modifierValues.length+(entry.properties?.length??0)
  const defenceSummary=[entry.defences?.armour!==undefined?`${entry.defences.armour} Rüstung`:undefined,entry.defences?.evasion!==undefined?`${entry.defences.evasion} Ausweichen`:undefined,entry.defences?.energyShield!==undefined?`${entry.defences.energyShield} ES`:undefined].filter(Boolean).join(' · ')
  return <button className={`slot slot-${entry.slotId}${compact ? ' compact-slot' : ''}${suggestion&&!rarity?' suggested-slot':''}`} aria-label={`${slotName(entry.slotId)} bearbeiten`} data-empty={!rarity} onClick={onClick}>
    <b>{visibleSlotName(entry.slotId)}</b>
    <span className="slot-glyph" aria-hidden="true">{slotGlyph(entry.slotId)}</span>
    {unique ? <><strong>{unique.name}</strong><small>{variant ? `${variant.text} · ` : ''}{propertyCount} Eigenschaften{entry.quality!==undefined?` · ${entry.quality}% Qualität`:''}</small>{defenceSummary&&<span>{defenceSummary}</span>}</> : rarity ? <><strong>{entry.baseDisplayName ?? entry.itemDefinitionId ?? entry.itemClassId ?? slotName(entry.slotId)}</strong><small>{rarityName[rarity]} · {propertyCount} Eigenschaften{entry.quality!==undefined?` · ${entry.quality}% Qualität`:''}</small>{defenceSummary&&<span>{defenceSummary}</span>}{!compact && <span>{entry.modifierValues.slice(0, 2).map(item => { const affix = technicalAffixById.get(item.modifierId); return `${affix ? affixDisplayName(affix) : 'Nicht auflösbar'} (${item.statValues?.map(value => value.value).join('/') ?? String(item.value)})` }).join(' · ')}</span>}</> : suggestion?<><small className="slot-recommendation-label">Planvorschlag</small><strong>{suggestion.title}</strong><span>{suggestion.detail}</span><small>Antippen, um einen Gegenstand einzutragen</small></>:<span className="empty-slot-action">Hinzufügen</span>}
  </button>
}
const armorSlots = ['slot-helmet','slot-amulet','slot-body-armour','slot-gloves','slot-belt','slot-ring-1','slot-ring-2','slot-boots']
const quickSlots = ['slot-life-flask','slot-charm-1','slot-charm-2','slot-charm-3','slot-mana-flask']

function uniqueLineText(item: (typeof localizedPob2UniquesDe)[number], reference: string) {
  if (!reference.startsWith('source-line:')) return reference
  const sourceLineId = reference.slice('source-line:'.length)
  return [...item.implicits, ...item.modifiers].find(line => line.id === sourceLineId)?.text
}

function visibleTradeOffs(item: (typeof localizedPob2UniquesDe)[number] | undefined, values: string[] | undefined) {
  return (values ?? [])
    .map(value => item ? uniqueLineText(item, value) : value)
    .filter((value): value is string => Boolean(value) && !value?.startsWith('source-line:'))
}

function preferredUniqueVariantId(item: (typeof localizedPob2UniquesDe)[number] | undefined) {
  return item?.variants.find(variant => variant.currentOrLegacy === 'current')?.id
    ?? (item?.variants.length === 1 ? item.variants[0].id : undefined)
}

function requirementText(requirements: EquipmentSlotSuggestion['requirements']) {
  if (!requirements) return []
  return [
    requirements.requiredLevel !== null ? `Level ${requirements.requiredLevel}` : undefined,
    requirements.strength !== null ? `${requirements.strength} Stärke` : undefined,
    requirements.dexterity !== null ? `${requirements.dexterity} Geschick` : undefined,
    requirements.intelligence !== null ? `${requirements.intelligence} Intelligenz` : undefined,
  ].filter((value): value is string => Boolean(value))
}
export function EquipmentSection({ entries, setEntries, suggestions=[] }: { entries: EquipmentEntry[]; setEntries: (values: EquipmentEntry[]) => void; suggestions?:EquipmentSlotSuggestion[] }) {
  const [active, setActive] = useState<EquipmentEntry | null>(null)
  const [activeSuggestion, setActiveSuggestion] = useState<EquipmentSlotSuggestion | null>(null)
  const [weaponSet, setWeaponSet] = useState<'set-1'|'set-2'>('set-1')
  const save = (updated: EquipmentEntry) => setEntries(entries.map(entry => entry.id === updated.id ? updated : entry))
  const jewels = jewelEntries(entries)
  const lastJewel = jewels.at(-1)
  const addJewel = () => setEntries([...entries, createNextJewelEntry(entries)])
  const removeJewel = () => canRemoveJewelEntry(lastJewel) && setEntries(entries.filter(entry => entry.id !== lastJewel?.id))
  const renderSlot = (id: string, compact = false) => {
    const entry = entries.find(value => value.slotId === id)
    const suggestion=suggestions.find(value=>value.slotId===id)
    return entry && <EquipmentSlot key={id} entry={entry} compact={compact} suggestion={suggestion} onClick={() => suggestion&&!inferItemRarity(entry)?setActiveSuggestion(suggestion):setActive(entry)}/>
  }
  const rawSuggestedEntry=activeSuggestion&&entries.find(value=>value.slotId===activeSuggestion.slotId)
  const suggestedEntry=rawSuggestedEntry&&activeSuggestion?.source==='weapon-optimizer'?{
    ...rawSuggestedEntry,
    rarity:'normal' as const,
    itemClassId:activeSuggestion.itemClassId,
    itemDefinitionId:activeSuggestion.itemDefinitionId,
    baseDisplayName:activeSuggestion.baseDisplayName,
    weaponStats:activeSuggestion.weaponStats,
    weaponStatsSource:'pinned-base' as const,
  }:rawSuggestedEntry&&activeSuggestion?.source==='unique-analyzer'?{
    ...rawSuggestedEntry,
    rarity:'unique' as const,
    uniqueItemId:activeSuggestion.uniqueItemId,
    uniqueVariantId:preferredUniqueVariantId(localizedPob2UniquesDe.find(value=>value.id===activeSuggestion.uniqueItemId)),
    modifierValues:[],
  }:rawSuggestedEntry
  const suggestedUnique=activeSuggestion?.uniqueItemId?localizedPob2UniquesDe.find(value=>value.id===activeSuggestion.uniqueItemId):undefined
  const unversionedUniqueLines=suggestedUnique&&!suggestedUnique.variants.length?localizedPob2LinesForVariant(suggestedUnique):undefined
  const suggestedTradeOffs=visibleTradeOffs(suggestedUnique,activeSuggestion?.tradeOffs)
  const suggestedRequirements=requirementText(activeSuggestion?.requirements)
  return <section id="equipment"><h2>2. Ausrüstung</h2><p className="muted">Tippe einen Platz an, um deinen Gegenstand einzutragen.</p>
    <div className="equipment-paperdoll-stage">
    <div className="weapon-set-toggle" role="group" aria-label="Waffenset auswählen">
      <button aria-pressed={weaponSet === 'set-1'} onClick={() => setWeaponSet('set-1')}>Set 1</button>
      <button aria-pressed={weaponSet === 'set-2'} onClick={() => setWeaponSet('set-2')}>Set 2</button>
    </div>
    <div className="equipment-loadout" data-weapon-set={weaponSet}>
      {renderSlot(activeWeaponSlotIds(weaponSet)[0])}
      {armorSlots.map(id => renderSlot(id))}
      {renderSlot(activeWeaponSlotIds(weaponSet)[1])}
    </div>
    <div className="equipment-quick-slots" aria-label="Charms und Fläschchen">{quickSlots.map(id => renderSlot(id, true))}</div>
    <div className="equipment-jewels">
      <div className="equipment-jewels-heading"><h3>Juwelen</h3><span>{jewels.length}</span><div><button aria-label="Juwelenplatz entfernen" disabled={!canRemoveJewelEntry(lastJewel)} onClick={removeJewel}>−</button><button aria-label="Juwelenplatz hinzufügen" onClick={addJewel}>＋</button></div></div>
      <div>{jewels.map(entry => <EquipmentSlot key={entry.id} entry={entry} compact onClick={() => setActive(entry)}/>)}</div>
    </div>
    </div>
    {activeSuggestion&&suggestedEntry&&<div className="modal-backdrop" onMouseDown={event=>event.target===event.currentTarget&&setActiveSuggestion(null)}><div className="modal suggestion-details" role="dialog" aria-modal="true" aria-label="Details zum Ausrüstungsvorschlag"><header className="dialog-header"><button className="text-button" onClick={()=>setActiveSuggestion(null)}>← Zurück</button><h2>{activeSuggestion.title}</h2><button className="icon" aria-label="Dialog schließen" onClick={()=>setActiveSuggestion(null)}>×</button></header><div className="dialog-scroll"><p className="recommendation-type">{activeSuggestion.source==='unique-analyzer'?'Einzigartiger Gegenstand':'Empfohlene Waffenart'}</p><p>{activeSuggestion.detail}</p>{activeSuggestion.source==='weapon-optimizer'&&<><dl className="suggestion-facts"><div><dt>Basistyp</dt><dd>{activeSuggestion.baseDisplayName??activeSuggestion.title}</dd></div><div><dt>Anforderungen</dt><dd>{suggestedRequirements.length?suggestedRequirements.join(' · '):'Nicht belegt'}</dd></div></dl><h3>Belegte Grundwerte und Eigenschaften</h3>{activeSuggestion.properties?.length?<ul>{activeSuggestion.properties.map(value=><li key={value}>{value}</li>)}</ul>:<p className="warning">Für diese Waffenart ist noch keine konkrete kompatible Basis mit belegten Grundwerten aufgelöst.</p>}</>}{suggestedUnique&&<><dl className="suggestion-facts"><div><dt>Basistyp</dt><dd>{suggestedUnique.baseDisplayName}</dd></div><div><dt>Benötigtes Level</dt><dd>{suggestedUnique.requiredLevel??'Unbekannt'}</dd></div><div><dt>Varianten</dt><dd>{suggestedUnique.variants.length||'Keine getrennten Varianten'}</dd></div></dl><h3>Eigenschaften</h3>{suggestedUnique.variants.map((variant,index)=>{const lines=localizedPob2LinesForVariant(suggestedUnique,variant.id);const isCurrent=variant.currentOrLegacy==='current';const hasCurrent=suggestedUnique.variants.some(value=>value.currentOrLegacy==='current');return <details key={variant.id} open={isCurrent||(!hasCurrent&&index===0)}><summary>{variant.text}{variant.currentOrLegacy==='legacy'?' · Legacy':isCurrent?' · Aktuell':''}</summary>{lines.implicits.length||lines.modifiers.length?<ul>{[...lines.implicits,...lines.modifiers].map(line=><li key={line.id}>{line.text}</li>)}</ul>:<p className="muted">Für diese Variante sind keine sichtbaren Eigenschaften aufgelöst.</p>}</details>})}{unversionedUniqueLines&&(unversionedUniqueLines.implicits.length||unversionedUniqueLines.modifiers.length)?<ul>{[...unversionedUniqueLines.implicits,...unversionedUniqueLines.modifiers].map(line=><li key={line.id}>{line.text}</li>)}</ul>:null}</>}{activeSuggestion.reasons?.length?<><h3>Warum vorgeschlagen</h3><ul>{activeSuggestion.reasons.map(value=><li key={value}>{value}</li>)}</ul></>:null}{suggestedTradeOffs.length?<><h3>Nachteile und Abwägungen</h3><ul>{suggestedTradeOffs.map(value=><li key={value}>{value}</li>)}</ul></>:null}{activeSuggestion.source==='weapon-optimizer'&&<p className="muted">Die Empfehlung verwendet eine lokal gepinnte, anforderungsgeprüfte Waffenbasis. Weitere Affixe werden nicht erfunden und können im Editor ergänzt werden.</p>}</div><div className="dialog-actions"><button className="secondary" onClick={()=>setActiveSuggestion(null)}>Schließen</button><button onClick={()=>{setActiveSuggestion(null);setActive(suggestedEntry)}}>Gegenstand eintragen</button></div></div></div>}
    {active && <AffixDialog entry={active} slotName={slotName(active.slotId)} onSave={save} onClose={() => setActive(null)}/>}
  </section>
}
