import { useMemo, useState } from 'react'
import { localizedPob2UniquesDe, type LocalizedPob2Unique, type Pob2GermanLocalizationStatus } from '../localization/pob2-uniques-de'

const statusLabel: Record<Pob2GermanLocalizationStatus, string> = {
  'verified-local-source': 'lokal belegt', 'reviewed-app-translation': 'App-Übersetzung',
  'review-required': 'Feinschliff offen', 'translation-missing': 'englischer Fallback',
}
function Detail({ item }: { item: LocalizedPob2Unique }) {
  return <article className="unique-detail"><p className="eyebrow">PoB2-Unique · deutsche Anzeigeschicht</p><h3>{item.name}</h3><p className="muted">{item.baseDisplayName} · {item.slot}{item.requiredLevel === null ? '' : ` · Stufe ${item.requiredLevel}`}</p>
    {item.variants.length > 0 && <div className="unique-variants" aria-label="Varianten">{item.variants.map(variant => <span className="badge" key={variant.id}>{variant.text}</span>)}</div>}
    {item.implicits.length > 0 && <><h4>Implizite Eigenschaften</h4><ul className="unique-modifiers">{item.implicits.map(line => <li key={line.id}>{line.text}<small>{statusLabel[line.status]}</small></li>)}</ul></>}
    <h4>Unique-Eigenschaften</h4><ul className="unique-modifiers">{item.modifiers.map(line => <li key={line.id}>{line.text}<small>{statusLabel[line.status]}</small></li>)}</ul></article>
}
export function Pob2UniqueDisplaySection() {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(localizedPob2UniquesDe[0]?.id ?? '')
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('de-DE')
    return needle ? localizedPob2UniquesDe.filter(item => `${item.name} ${item.baseDisplayName}`.toLocaleLowerCase('de-DE').includes(needle)) : localizedPob2UniquesDe
  }, [query])
  const selected = localizedPob2UniquesDe.find(item => item.id === selectedId) ?? filtered[0] ?? localizedPob2UniquesDe[0]
  return <section aria-labelledby="pob2-uniques-heading"><div className="row"><div><h2 id="pob2-uniques-heading">7. Einzigartige Gegenstände</h2><p className="muted">435 englische PoB2-Planerdatensätze mit getrennter deutscher Anzeigeschicht.</p></div><span className="badge">{localizedPob2UniquesDe.length} Uniques</span></div>
    <label className="unique-search">Unique oder Basistyp suchen<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="z. B. Der Amboss"/></label>
    <div className="unique-browser"><div className="unique-results" aria-label="Unique-Auswahl">{filtered.slice(0, 60).map(item => <button className={item.id === selected?.id ? 'selected' : ''} key={item.id} onClick={() => setSelectedId(item.id)}>{item.name}<small>{item.baseDisplayName}</small></button>)}{filtered.length === 0 && <p className="muted">Keine passenden Uniques gefunden.</p>}{filtered.length > 60 && <small>Die ersten 60 von {filtered.length} Treffern werden angezeigt. Suche zum Eingrenzen.</small>}</div>{selected && <Detail item={selected}/>}</div>
    <p className="unique-source-note">Anzeigeübersetzungen sind App-Texte, keine offizielle GGG-Lokalisierung. Bei fehlendem deutschen Text wird der englische PoB2-Text angezeigt.</p></section>
}
