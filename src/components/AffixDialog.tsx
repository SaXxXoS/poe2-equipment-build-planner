import { useMemo, useState } from 'react'
import { affixesFor, baseItemsFor, itemClassesForSlot, technicalAffixById } from '../affixes/registry'
import type { TechnicalAffix } from '../affixes/model'
import type { EquipmentEntry } from '../domain'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'

const uniqueSlots = (slotId: string) => {
  if (slotId.includes('helmet')) return ['helmet']
  if (slotId.includes('body-armour')) return ['body-armour']
  if (slotId.includes('gloves')) return ['gloves']
  if (slotId.includes('boots')) return ['boots']
  if (slotId.includes('amulet')) return ['amulet']
  if (slotId.includes('ring')) return ['ring']
  if (slotId.includes('belt')) return ['belt']
  if (slotId.includes('weapon')) return slotId.endsWith('right') ? ['weapon', 'offhand'] : ['weapon']
  if (slotId.includes('jewel')) return ['jewel']
  return ['special']
}

export function AffixDialog({ entry, slotName, onSave, onClose }: { entry: EquipmentEntry; slotName: string; onSave: (entry: EquipmentEntry) => void; onClose: () => void }) {
  const classes = itemClassesForSlot(entry.slotId)
  const [mode, setMode] = useState<'normal' | 'unique'>(entry.uniqueItemId ? 'unique' : 'normal')
  const [itemClassId, setItemClassId] = useState(entry.itemClassId ?? classes[0]?.itemClassId ?? '')
  const [baseItemId, setBaseItemId] = useState(entry.itemDefinitionId ?? '')
  const [itemLevel, setItemLevel] = useState<number | undefined>(entry.itemLevel)
  const [side, setSide] = useState<'prefix' | 'suffix' | 'implicit'>('prefix')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [values, setValues] = useState<number[]>([])
  const [added, setAdded] = useState(entry.modifierValues)
  const [uniqueSearch, setUniqueSearch] = useState('')
  const [uniqueItemId, setUniqueItemId] = useState(entry.uniqueItemId ?? '')
  const [uniqueVariantId, setUniqueVariantId] = useState(entry.uniqueVariantId ?? '')
  const baseItems = baseItemsFor(itemClassId)
  const visible = useMemo(() => affixesFor(itemClassId, side, itemLevel)
    .filter(affix => side !== 'implicit' || !baseItemId || affix.baseItemIds?.includes(baseItemId))
    .filter(affix => `${affix.technicalText} ${affix.sourceModId} ${affix.statLines.map(stat => stat.statId).join(' ')}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 300), [itemClassId, side, itemLevel, baseItemId, search])
  const uniqueOptions = useMemo(() => localizedPob2UniquesDe
    .filter(item => uniqueSlots(entry.slotId).includes(item.slot))
    .filter(item => `${item.name} ${item.baseDisplayName}`.toLowerCase().includes(uniqueSearch.toLowerCase()))
    .slice(0, 150), [entry.slotId, uniqueSearch])
  const chosenUnique = localizedPob2UniquesDe.find(item => item.id === uniqueItemId)
  const chosen = technicalAffixById.get(selected) ?? visible[0]
  const conflicts = new Set(added.flatMap(value => technicalAffixById.get(value.modifierId)?.conflictGroups ?? []))
  const blocked = chosen?.conflictGroups.some(group => conflicts.has(group)) ?? false
  function add(affix: TechnicalAffix) {
    const statValues = affix.statLines.map((line, index) => ({ statId: line.statId, value: values[index] ?? line.minimum }))
    setAdded([...added, { id: `applied-${entry.slotId}-${crypto.randomUUID()}`, modifierId: affix.affixId, value: statValues[0]?.value ?? 0, sourceModId: affix.sourceModId, statValues, itemClassId, affixSide: affix.affixSide, tierId: affix.tierId, requiredItemLevel: affix.requiredItemLevel, isLocal: affix.isLocal, isHybrid: affix.isHybrid, sourceVersion: affix.sourceVersion, dataStatus: affix.dataStatus }])
  }
  function save() {
    onSave(mode === 'unique'
      ? { ...entry, uniqueItemId, uniqueVariantId: uniqueVariantId || undefined, modifierValues: [], itemClassId: undefined, itemDefinitionId: undefined }
      : { ...entry, uniqueItemId: undefined, uniqueVariantId: undefined, itemClassId, itemDefinitionId: baseItemId || undefined, itemLevel, modifierValues: added })
    onClose()
  }
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div className="modal" role="dialog" aria-modal="true">
    <div className="row"><h2>{slotName}</h2><button className="icon" aria-label="Dialog schließen" onClick={onClose}>×</button></div>
    <label>Gegenstandsart<select value={mode} onChange={event => setMode(event.target.value as 'normal' | 'unique')}><option value="normal">Normaler Gegenstand mit Affixen</option><option value="unique">Einzigartiger Gegenstand</option></select></label>
    {mode === 'unique' ? <>
      <label>Unique suchen<input autoFocus value={uniqueSearch} onChange={event => setUniqueSearch(event.target.value)} placeholder="Name oder Basistyp"/></label>
      <label>Unique<select className="affix-list" size={7} value={uniqueItemId} onChange={event => { setUniqueItemId(event.target.value); setUniqueVariantId('') }}><option value="">Bitte wählen</option>{uniqueOptions.map(item => <option value={item.id} key={item.id}>{item.name} · {item.baseDisplayName}</option>)}</select></label>
      {chosenUnique && <div className="unique-choice-summary"><b>{chosenUnique.name}</b><span>{chosenUnique.baseDisplayName}{chosenUnique.requiredLevel ? ` · Stufe ${chosenUnique.requiredLevel}` : ''}</span>{chosenUnique.variants.length > 1 && <label>Variante<select value={uniqueVariantId} onChange={event => setUniqueVariantId(event.target.value)}><option value="">Variante nicht festgelegt</option>{chosenUnique.variants.map(variant => <option value={variant.id} key={variant.id}>{variant.text} · {variant.currentOrLegacy === 'legacy' ? 'Legacy' : variant.currentOrLegacy === 'current' ? 'Aktuell' : 'Status unbekannt'}</option>)}</select></label>}<small>PoB2-Planerdaten; getrennt von technischen GGG-Affixen.</small></div>}
    </> : <>
      <p className="warning">Deutsche Übersetzung einzelner technischer Affixe kann fehlen.</p>
      <label>Technische Itemklasse<select value={itemClassId} onChange={event => { setItemClassId(event.target.value); setBaseItemId(''); setSelected('') }}>{classes.map(value => <option value={value.itemClassId} key={value.itemClassId}>{value.technicalName}</option>)}</select></label>
      {baseItems.length > 0 && <label>Technischer Basistyp<select value={baseItemId} onChange={event => setBaseItemId(event.target.value)}><option value="">Bitte wählen</option>{baseItems.map(value => <option key={value.baseItemId} value={value.baseItemId}>{value.baseItemId} · Drop-Level {value.dropLevel ?? '?'}</option>)}</select></label>}
      <label>Item Level (optional)<input type="number" min="1" value={itemLevel ?? ''} onChange={event => setItemLevel(event.target.value ? Number(event.target.value) : undefined)}/></label>
      <label>Affixseite<select value={side} onChange={event => setSide(event.target.value as typeof side)}><option value="prefix">Prefix</option><option value="suffix">Suffix</option>{itemClassId === 'Charms' && <option value="implicit">Basis-Implicit</option>}</select></label>
      <label>Technische Suche<input value={search} onChange={event => setSearch(event.target.value)}/></label>
      <label>Affix<select className="affix-list" size={6} value={chosen?.affixId ?? ''} onChange={event => { setSelected(event.target.value); setValues([]) }}>{visible.map(affix => <option value={affix.affixId} key={affix.affixId}>{affix.technicalText} · {affix.tierId.split(':').at(-1)} · ilvl {affix.requiredItemLevel ?? '?'}</option>)}</select></label>
      {chosen?.statLines.map((line, index) => <label key={`${line.statId}-${index}`}>{line.statId} ({line.minimum}–{line.maximum})<input type="number" min={line.minimum} max={line.maximum} step={line.step ?? (line.numericType === 'integer' ? 1 : 'any')} value={values[index] ?? line.minimum} onChange={event => setValues(current => Object.assign([...current], { [index]: Number(event.target.value) }))}/></label>)}
      {blocked && <p className="warning">Konfliktgruppe bereits belegt.</p>}<button disabled={!chosen || blocked} onClick={() => chosen && add(chosen)}>Affix hinzufügen</button>
      <h3>Gespeicherte Affixe</h3>{added.length === 0 ? <p className="muted">Noch keine Affixe.</p> : <ul className="clean">{added.map(item => <li key={item.id}><span>{technicalAffixById.get(item.modifierId)?.technicalText ?? 'Nicht auflösbares Affix'}: <b>{item.statValues?.map(value => value.value).join(' / ') ?? String(item.value)}</b></span><button className="danger" onClick={() => setAdded(added.filter(value => value.id !== item.id))}>Entfernen</button></li>)}</ul>}
    </>}
    <div className="dialog-actions"><button className="secondary" onClick={onClose}>Abbrechen</button><button disabled={mode === 'unique' ? !uniqueItemId : baseItems.length > 0 && !baseItemId} onClick={save}>Speichern</button></div>
  </div></div>
}
