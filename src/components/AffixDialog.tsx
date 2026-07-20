import { useMemo, useState } from 'react'
import { modifierDefinitions } from '../data'
import type { AppliedModifier, EquipmentEntry, ModifierDefinition } from '../domain'

export function AffixDialog({ entry, slotName, onSave, onClose }: { entry: EquipmentEntry; slotName: string; onSave: (values: AppliedModifier[]) => void; onClose: () => void }) {
  const [search, setSearch] = useState(''); const [selected, setSelected] = useState(modifierDefinitions[0].id)
  const [value, setValue] = useState(10); const [added, setAdded] = useState(entry.modifierValues)
  const visible = useMemo(() => modifierDefinitions.filter(item => item.displayNameDe.toLowerCase().includes(search.toLowerCase())), [search])
  const nameOf = (modifierId: string) => modifierDefinitions.find(item => item.id === modifierId)?.displayNameDe ?? modifierId
  function add() { const definition: ModifierDefinition | undefined = modifierDefinitions.find(item => item.id === selected); if (definition) setAdded([...added, { id: `applied-${entry.slotId}-${crypto.randomUUID()}`, modifierId: definition.id, value }]) }
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}><div className="modal" role="dialog" aria-modal="true"><div className="row"><h2>{slotName}</h2><button className="icon" aria-label="Dialog schließen" onClick={onClose}>×</button></div>
    <label>Affixe suchen<input autoFocus value={search} onChange={event => setSearch(event.target.value)} placeholder="z. B. Widerstand"/></label>
    <label>Affix<select className="affix-list" size={Math.min(6, Math.max(2, visible.length))} value={selected} onChange={event => setSelected(event.target.value)}>{visible.map(item => <option value={item.id} key={item.id}>{item.displayNameDe}</option>)}</select></label>
    <label>Wert<input aria-label="Affixwert" type="number" value={value} onChange={event => setValue(Number(event.target.value))}/></label><button onClick={add}>Affix hinzufügen</button>
    <h3>Gespeicherte Affixe</h3>{added.length === 0 ? <p className="muted">Noch keine Affixe.</p> : <ul className="clean">{added.map((item, index) => <li key={item.id}><span>{nameOf(item.modifierId)}: <b>{typeof item.value === 'number' ? item.value : `${item.value.min}–${item.value.max}`}</b></span><button className="danger" aria-label={`${nameOf(item.modifierId)} entfernen`} onClick={() => setAdded(added.filter((_, itemIndex) => itemIndex !== index))}>Entfernen</button></li>)}</ul>}
    <div className="dialog-actions"><button className="secondary" onClick={onClose}>Abbrechen</button><button onClick={() => { onSave(added); onClose() }}>Speichern</button></div>
  </div></div>
}
