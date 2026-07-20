import { useState } from 'react'
import { clusterJewelDefinitions, jewelDefinitions, uniqueClusterJewelDefinitions } from '../data'
import type { AnyJewelDefinition } from '../domain'

function JewelPicker({ title, items }: { title: string; items: AnyJewelDefinition[] }) {
  const [chosen, setChosen] = useState<(AnyJewelDefinition | null)[]>([null, null]); const [active, setActive] = useState<number | null>(null); const [search, setSearch] = useState('')
  const visible = items.filter(item => item.displayNameDe.toLowerCase().includes(search.toLowerCase()))
  return <div><h3>{title}</h3><div className="jewel-row">{chosen.map((item, index) => <button className="jewel-slot" key={index} onClick={() => setActive(index)}>{item ? <><b>{item.displayNameDe}</b><small>{item.description}</small></> : '+ Auswählen'}</button>)}</div>{active !== null && <div className="modal-backdrop"><div className="modal" role="dialog"><div className="row"><h2>{title}</h2><button className="icon" onClick={() => setActive(null)}>×</button></div><label>Suchen<input autoFocus value={search} onChange={event => setSearch(event.target.value)}/></label><div className="choice-list">{visible.map(item => <button key={item.id} onClick={() => { setChosen(chosen.map((current, index) => index === active ? item : current)); setActive(null) }}><b>{item.displayNameDe}</b><small>{item.description}</small></button>)}</div>{chosen[active] && <button className="danger full" onClick={() => { setChosen(chosen.map((current, index) => index === active ? null : current)); setActive(null) }}>Auswahl entfernen</button>}</div></div>}</div>
}
export function JewelsSection() { return <section><h2>4. Juwele & Cluster</h2><div className="three-col"><JewelPicker title="Normale Juwele" items={jewelDefinitions}/><JewelPicker title="Cluster-Juwele" items={clusterJewelDefinitions}/><JewelPicker title="Unique-Cluster-Juwele" items={uniqueClusterJewelDefinitions}/></div></section> }
