import { useMemo, useState } from 'react'
import { affixesFor, baseItemsFor, itemClassesForSlot, technicalAffixById } from '../affixes/registry'
import type { AppliedModifier, EquipmentEntry, ItemRarity } from '../domain'
import { localizedPob2LinesForVariant, localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { affixDisplayName, affixGroupName, affixSearchText } from '../features/equipment-editor/affix-display'
import { RARITY_LIMITS, appliedModifierId, clearItem, createAppliedModifier, inferItemRarity, migrateEquipmentEntry, modifiersFor } from '../features/equipment-editor/model'
import type { ItemOcrResult } from '../features/item-ocr'
import { ItemOcrPanel } from './ItemOcrPanel'

const rarityText: Record<ItemRarity, string> = { normal: 'Normal', magic: 'Magisch', rare: 'Selten', unique: 'Einzigartig' }
const uniqueSlots = (slotId: string) => slotId.includes('helmet') ? ['helmet'] : slotId.includes('body-armour') ? ['body-armour'] : slotId.includes('gloves') ? ['gloves'] : slotId.includes('boots') ? ['boots'] : slotId.includes('amulet') ? ['amulet'] : slotId.includes('ring') ? ['ring'] : slotId.includes('belt') ? ['belt'] : slotId.includes('weapon') ? (slotId.endsWith('right') ? ['weapon', 'offhand'] : ['weapon']) : slotId.includes('jewel') ? ['jewel'] : ['special']

function AppliedSlot({ side, index, value, onChoose, onRemove }: { side: 'prefix'|'suffix'|'implicit'; index: number; value?: AppliedModifier; onChoose: () => void; onRemove: () => void }) {
  const affix = value && technicalAffixById.get(value.modifierId)
  return <div className="applied-slot"><button onClick={onChoose}><b>{side === 'prefix' ? `Prefix ${index + 1}` : side === 'suffix' ? `Suffix ${index + 1}` : `Implicit ${index + 1}`}</b><span>{affix ? affixDisplayName(affix) : 'Leer – auswählen'}</span>{value && <small>Werte: {value.statValues?.map(item => item.value).join(' / ') ?? String(value.value)}</small>}</button>{value && <button className="danger compact-action" aria-label="Affix entfernen" onClick={onRemove}>−</button>}</div>
}

export function AffixDialog({ entry, slotName, onSave, onClose }: { entry: EquipmentEntry; slotName: string; onSave: (entry: EquipmentEntry) => void; onClose: () => void }) {
  const migratedEntry = migrateEquipmentEntry(entry)
  const existingRarity = inferItemRarity(entry)
  const [step, setStep] = useState<'action'|'rarity'|'editor'>(existingRarity ? 'action' : 'rarity')
  const [rarity, setRarity] = useState<ItemRarity>(existingRarity ?? 'rare')
  const classes = itemClassesForSlot(entry.slotId)
  const [itemClassId, setItemClassId] = useState(entry.itemClassId ?? classes[0]?.itemClassId ?? '')
  const [baseItemId, setBaseItemId] = useState(entry.itemDefinitionId ?? '')
  const [itemLevel, setItemLevel] = useState<number | undefined>(entry.itemLevel)
  const [added, setAdded] = useState(migratedEntry.modifierValues)
  const [baseDisplayName, setBaseDisplayName] = useState(migratedEntry.baseDisplayName ?? '')
  const [sockets, setSockets] = useState(entry.sockets?.length ? entry.sockets : [{ id: `${entry.id}:socket:1` }])
  const [picker, setPicker] = useState<{ side:'prefix'|'suffix'|'implicit'; index:number }>()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [values, setValues] = useState<number[]>([])
  const [uniqueSearch, setUniqueSearch] = useState('')
  const [uniqueItemId, setUniqueItemId] = useState(entry.uniqueItemId ?? '')
  const [uniqueVariantId, setUniqueVariantId] = useState(entry.uniqueVariantId ?? '')
  const baseItems = baseItemsFor(itemClassId)
  const chosenUnique = localizedPob2UniquesDe.find(item => item.id === uniqueItemId)
  const chosenUniqueLines = chosenUnique ? localizedPob2LinesForVariant(chosenUnique, uniqueVariantId) : undefined
  const uniqueOptions = localizedPob2UniquesDe.filter(item => uniqueSlots(entry.slotId).includes(item.slot)).filter(item => `${item.name} ${item.baseDisplayName}`.toLocaleLowerCase('de').includes(uniqueSearch.toLocaleLowerCase('de'))).slice(0, 150)
  const visible = useMemo(() => picker ? affixesFor(itemClassId, picker.side, itemLevel).filter(affix => picker.side !== 'implicit' || !baseItemId || affix.baseItemIds?.includes(baseItemId)).filter(affix => affixSearchText(affix).includes(search.toLocaleLowerCase('de'))).slice(0, 300) : [], [picker, itemClassId, itemLevel, baseItemId, search])
  const chosen = technicalAffixById.get(selected) ?? visible[0]
  const grouped = [...visible.reduce((groups, affix) => {
    const key = affixGroupName(affix)
    groups.set(key, [...(groups.get(key) ?? []), affix])
    return groups
  }, new Map<string, typeof visible>())].sort(([a], [b]) => a.localeCompare(b, 'de'))
  const conflicts = new Set(added.filter(value => value.id !== appliedModifierId(entry.id, picker?.side ?? '', picker?.index ?? -1)).flatMap(value => technicalAffixById.get(value.modifierId)?.conflictGroups ?? []))
  const blocked = chosen?.conflictGroups.some(group => conflicts.has(group)) ?? false

  function chooseRarity(value: ItemRarity) { setRarity(value); setStep('editor'); setPicker(undefined) }
  function applyOcr(result:ItemOcrResult,selectedIds:Set<string>){
    if(result.unique&&selectedIds.has(result.unique.uniqueItemId)){
      setRarity('unique');setUniqueItemId(result.unique.uniqueItemId);setUniqueVariantId('');setAdded([]);setStep('editor');return
    }
    const nextRarity=result.rarity&&result.rarity!=='unique'?result.rarity:'rare'
    const nextClass=result.itemClassId??itemClassId
    const limits=RARITY_LIMITS[nextRarity]
    const selectedAffixes=result.affixes.filter(match=>selectedIds.has(match.affixId)&&(match.resolutionStatus==='auto-selected'||match.values.length))
    const next=selectedAffixes.flatMap(match=>{
      const affix=technicalAffixById.get(match.affixId)
      if(!affix)return[]
      const sameSide=selectedAffixes.filter(value=>value.affixSide===match.affixSide)
      const index=sameSide.indexOf(match)
      if(match.affixSide==='prefix'&&index>=limits.prefix||match.affixSide==='suffix'&&index>=limits.suffix||match.affixSide==='implicit'&&index>0)return[]
      return[createAppliedModifier(entry.id,affix,match.affixSide,index,match.values,nextClass)]
    })
    setRarity(nextRarity);setItemClassId(nextClass);setItemLevel(result.itemLevel);setBaseDisplayName(result.baseDisplayName??'');setAdded(next);setStep('editor');setPicker(undefined)
  }
  function applyAffix() {
    if (!picker || !chosen || blocked) return
    const statValues = chosen.statLines.map((line, index) => ({ statId: line.statId, value: line.valueType === 'fixed' ? line.minimum : values[index] ?? line.minimum }))
    const next: AppliedModifier = { id: appliedModifierId(entry.id, picker.side, picker.index), modifierId: chosen.affixId, value: statValues.length > 1 ? { min: statValues[0].value, max: statValues[1].value } : statValues[0]?.value ?? 0, sourceModId: chosen.sourceModId, statValues, itemClassId, affixSide: picker.side, tierId: chosen.tierId, requiredItemLevel: chosen.requiredItemLevel, isLocal: chosen.isLocal, isHybrid: chosen.isHybrid, sourceVersion: chosen.sourceVersion, dataStatus: chosen.dataStatus }
    setAdded([...added.filter(value => value.id !== next.id), next]); setPicker(undefined); setSelected(''); setValues([]); setSearch('')
  }
  function save() {
    const limits = RARITY_LIMITS[rarity]
    const normalModifiers = rarity === 'unique' ? [] : added.filter(value => value.affixSide === 'implicit' || value.affixSide === 'prefix' && modifiersFor({ ...entry, modifierValues: added }, 'prefix').indexOf(value) < limits.prefix || value.affixSide === 'suffix' && modifiersFor({ ...entry, modifierValues: added }, 'suffix').indexOf(value) < limits.suffix)
    onSave(rarity === 'unique' ? { ...entry, rarity, uniqueItemId, uniqueVariantId: uniqueVariantId || undefined, modifierValues: [], itemClassId: undefined, itemDefinitionId: undefined, baseDisplayName: undefined, sockets } : { ...entry, rarity, uniqueItemId: undefined, uniqueVariantId: undefined, itemClassId, itemDefinitionId: baseItemId || undefined, baseDisplayName: baseDisplayName.trim() || undefined, itemLevel, modifierValues: normalModifiers, sockets })
    onClose()
  }
  return <div className="modal-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}><div className="modal item-editor" role="dialog" aria-modal="true">
    <header className="dialog-header"><button className="text-button" onClick={() => picker ? setPicker(undefined) : step === 'editor' ? setStep(existingRarity ? 'action' : 'rarity') : onClose()}>← Zurück</button><h2>{slotName}</h2><button className="icon" aria-label="Dialog schließen" onClick={onClose}>×</button></header>
    <div className="dialog-scroll">
      {step === 'action' && <><div className="rarity-choice"><button onClick={() => setStep('editor')}>Gegenstand bearbeiten</button><button onClick={() => setStep('rarity')}>Gegenstand ersetzen</button><button className="danger" onClick={() => { onSave(clearItem(entry)); onClose() }}>Gegenstand entfernen</button></div><ItemOcrPanel slotId={entry.slotId} onApply={applyOcr}/></>}
      {step === 'rarity' && <><ItemOcrPanel slotId={entry.slotId} onApply={applyOcr}/><h3>Oder Seltenheit manuell wählen</h3><div className="rarity-choice">{(Object.keys(rarityText) as ItemRarity[]).map(value => <button key={value} onClick={() => chooseRarity(value)}>{rarityText[value]}</button>)}</div></>}
      {step === 'editor' && !picker && <>{rarity === 'unique' ? <><label>Unique suchen<input autoFocus type="search" value={uniqueSearch} onChange={event => setUniqueSearch(event.target.value)} placeholder="Name oder Basistyp"/></label><label>Unique<select className="affix-list" size={7} value={uniqueItemId} onChange={event => { setUniqueItemId(event.target.value); setUniqueVariantId('') }}><option value="">Bitte wählen</option>{uniqueOptions.map(item => <option value={item.id} key={item.id}>{item.name} · {item.baseDisplayName}</option>)}</select></label>{chosenUnique && <div className="unique-choice-summary">
        <b>{chosenUnique.name}</b>
        <span>{chosenUnique.baseDisplayName}</span>
        {chosenUnique.requiredLevel != null && <small>Benötigtes Level: {chosenUnique.requiredLevel}</small>}
        {chosenUnique.variants.length > 1 && <label>Variante<select value={uniqueVariantId} onChange={event => setUniqueVariantId(event.target.value)}><option value="">Variante auswählen</option>{chosenUnique.variants.map(variant => <option value={variant.id} key={variant.id}>{variant.text} · {variant.currentOrLegacy === 'legacy' ? 'Legacy' : variant.currentOrLegacy === 'current' ? 'Aktuell' : 'Status unbekannt'}</option>)}</select></label>}
        {chosenUnique.variants.length > 1 && !uniqueVariantId && <p className="warning">Wähle eine Variante, damit ausschließlich deren Eigenschaften analysiert werden.</p>}
        {chosenUniqueLines && <>
          {chosenUniqueLines.implicits.length > 0 && <div><h4>Implizite Eigenschaften</h4><ul className="unique-editor-lines">{chosenUniqueLines.implicits.map(line => <li key={line.id}>{line.text}</li>)}</ul></div>}
          <div><h4>Einzigartige Eigenschaften</h4>{chosenUniqueLines.modifiers.length > 0 ? <ul className="unique-editor-lines">{chosenUniqueLines.modifiers.map(line => <li key={line.id}>{line.text}</li>)}</ul> : <p className="muted">Keine Eigenschaften für diese Variante aufgelöst.</p>}</div>
        </>}
        <small>PoB2-Planerdaten; normale Affixe bleiben getrennt.</small>
      </div>}</> : <>
        <details open><summary>Grunddaten · {rarityText[rarity]}</summary><label>Itemklasse<select value={itemClassId} onChange={event => { setItemClassId(event.target.value); setBaseItemId('') }}>{classes.map(value => <option value={value.itemClassId} key={value.itemClassId}>{value.technicalName}</option>)}</select></label>{baseItems.length > 0 ? <label>Basistyp<select value={baseItemId} onChange={event => setBaseItemId(event.target.value)}><option value="">Bitte wählen</option>{baseItems.map(value => <option key={value.baseItemId} value={value.baseItemId}>{value.baseItemId}</option>)}</select></label> : <label>Basistyp (Anzeige)<input value={baseDisplayName} onChange={event => setBaseDisplayName(event.target.value)} placeholder="z. B. Experten-Kettenhaube"/></label>}<label>Item-Level (nur zum technischen Filtern)<input type="number" min="1" value={itemLevel ?? ''} onChange={event => setItemLevel(event.target.value ? Number(event.target.value) : undefined)}/></label></details>
        <details open><summary>Implicits · {modifiersFor({ ...entry, modifierValues: added }, 'implicit').length}</summary><AppliedSlot side="implicit" index={0} value={modifiersFor({ ...entry, modifierValues: added }, 'implicit')[0]} onChoose={() => setPicker({ side:'implicit', index:0 })} onRemove={() => setAdded(added.filter(value => value.affixSide !== 'implicit'))}/></details>
        {RARITY_LIMITS[rarity].prefix > 0 && <details open><summary>Prefixe · {modifiersFor({ ...entry, modifierValues: added }, 'prefix').length}/{RARITY_LIMITS[rarity].prefix}</summary>{Array.from({ length: RARITY_LIMITS[rarity].prefix }, (_, index) => <AppliedSlot key={index} side="prefix" index={index} value={added.find(value => value.id === appliedModifierId(entry.id, 'prefix', index)) ?? modifiersFor({ ...entry, modifierValues: added }, 'prefix')[index]} onChoose={() => setPicker({ side:'prefix', index })} onRemove={() => setAdded(added.filter(value => value.id !== appliedModifierId(entry.id, 'prefix', index)))} />)}</details>}
        {RARITY_LIMITS[rarity].suffix > 0 && <details open><summary>Suffixe · {modifiersFor({ ...entry, modifierValues: added }, 'suffix').length}/{RARITY_LIMITS[rarity].suffix}</summary>{Array.from({ length: RARITY_LIMITS[rarity].suffix }, (_, index) => <AppliedSlot key={index} side="suffix" index={index} value={added.find(value => value.id === appliedModifierId(entry.id, 'suffix', index)) ?? modifiersFor({ ...entry, modifierValues: added }, 'suffix')[index]} onChoose={() => setPicker({ side:'suffix', index })} onRemove={() => setAdded(added.filter(value => value.id !== appliedModifierId(entry.id, 'suffix', index)))} />)}</details>}
      </>}
      <details open><summary>Sockel · {sockets.length}</summary><div className="socket-editor">{sockets.map((_socket, index) => <span key={_socket.id} className="socket-orb">{index + 1}</span>)}<button aria-label="Sockel hinzufügen" onClick={() => setSockets([...sockets, { id: `${entry.id}:socket:${sockets.length + 1}` }])}>＋</button><button aria-label="Sockel entfernen" disabled={sockets.length <= 1} onClick={() => setSockets(sockets.slice(0, -1))}>−</button></div><p className="muted">Konkrete Sockelinhalte sind im vorhandenen Produktmodell nicht belegt.</p></details></>}
      {picker && <><h3>{picker.side === 'prefix' ? 'Prefix' : picker.side === 'suffix' ? 'Suffix' : 'Implicit'} auswählen</h3><label>Affix suchen<input autoFocus type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="z. B. Leben, Feuer, Angriff"/></label><div className="affix-groups">{grouped.map(([group, affixes]) => <details open key={group}><summary>{group} · {affixes?.length ?? 0}</summary>{affixes?.map(affix => <button className={chosen?.affixId === affix.affixId ? 'selected' : ''} key={affix.affixId} onClick={() => { setSelected(affix.affixId); setValues([]) }}><span>{affixDisplayName(affix)}</span><small>Benötigtes Item-Level {affix.requiredItemLevel ?? 'Unbekannt'}</small></button>)}</details>)}</div>{chosen && <div className="affix-values"><h4>{affixDisplayName(chosen)}</h4>{chosen.statLines.map((line, index) => line.valueType === 'fixed' ? <p key={`${line.statId}-${index}`}>Fester Wert: <b>{line.minimum}{line.isPercent ? ' %' : ''}</b></p> : <label key={`${line.statId}-${index}`}>{chosen.statLines.length === 2 ? index === 0 ? 'Minimum' : 'Maximum' : `Wert ${index + 1}`} ({line.minimum}–{line.maximum}{line.isPercent ? ' %' : ''})<input type="number" min={line.minimum} max={line.maximum} step={line.step ?? (line.numericType === 'integer' ? 1 : 'any')} value={values[index] ?? line.minimum} onChange={event => setValues(current => Object.assign([...current], { [index]: Number(event.target.value) }))}/></label>)}{blocked && <p className="warning">Konfliktgruppe bereits belegt.</p>}<button disabled={blocked || chosen.statLines.some((line, index) => { const value = line.valueType === 'fixed' ? line.minimum : values[index] ?? line.minimum; return !Number.isFinite(value) || value < line.minimum || value > line.maximum }) || chosen.statLines.length === 2 && (values[0] ?? chosen.statLines[0].minimum) > (values[1] ?? chosen.statLines[1].minimum)} onClick={applyAffix}>Affix übernehmen</button></div>}</>}
    </div>{step === 'editor' && !picker && <div className="dialog-actions"><button className="secondary" onClick={onClose}>Abbrechen</button><button disabled={rarity === 'unique' ? !uniqueItemId || Boolean(chosenUnique && chosenUnique.variants.length > 1 && !uniqueVariantId) : !itemClassId || baseItems.length > 0 && !baseItemId} onClick={save}>Speichern</button></div>}
  </div></div>
}
