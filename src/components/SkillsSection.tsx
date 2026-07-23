import { useState } from 'react'
import type { SkillOrigin, SkillRole, SkillSetup, SkillWeaponSet } from '../domain'
import { buildAssistantCandidates } from '../features/build-assistant-v1'

const roleLabels: Record<SkillRole, string> = { main: 'Hauptschaden', secondary: 'Zusatzschaden', utility: 'Utility', movement: 'Bewegung', defensive: 'Defensive' }
const originLabels: Record<SkillOrigin, string> = { manual: 'Manuell gewählt', recommended: 'Von der App empfohlen', ascendancy: 'Durch Aszendenz', equipment: 'Durch Ausrüstung verfügbar' }
const setLabels: Record<SkillWeaponSet, string> = { 'set-1': 'Waffenset 1', 'set-2': 'Waffenset 2', both: 'Beide' }
const emptySetup = (index: number): SkillSetup => ({ id: `skill-setup-${index + 1}`, skillId: '', role: index === 0 ? 'main' : 'utility', weaponSet: 'both', supportGemIds: [], origin: 'manual' })

export function SkillsSection({ setups, onChange, onRecommendSupports }: { setups: SkillSetup[]; onChange: (values: SkillSetup[]) => void; onRecommendSupports?: (setupId: string) => void }) {
  const [searches, setSearches] = useState<Record<string, string>>({})
  const visible = setups.length >= 6 ? setups : [...setups, ...Array.from({ length: 6 - setups.length }, (_, i) => emptySetup(setups.length + i))]
  if (visible.length !== setups.length) queueMicrotask(() => onChange(visible))
  const update = (id: string, patch: Partial<SkillSetup>) => onChange(visible.map(value => value.id === id ? { ...value, ...patch } : value))
  return <section id="skills"><div className="section-heading"><div><h2>3. Fertigkeiten und Unterstützungen</h2><p className="muted">Sechs Startplätze; weitere Plätze sind optional. Jede Unterstützung bleibt ihrer Fertigkeit zugeordnet.</p></div><button aria-label="Fertigkeitsslot hinzufügen" onClick={() => onChange([...visible, emptySetup(visible.length)])}>＋ Slot</button></div>
    <div className="skills-grid">{visible.map((setup, index) => {
      const skill = buildAssistantCandidates.skills.find(item => item.id === setup.skillId)
      const query = searches[setup.id] ?? ''
      const filtered = buildAssistantCandidates.skills.filter(item => `${item.displayNameDe} ${item.nameEn ?? ''}`.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de')))
      return <article className="skill-card" key={setup.id}><div className="skill-card-head"><span className="skill-art" aria-hidden="true">{skill?.displayNameDe.slice(0, 2) ?? '+'}</span><div><h3>{skill?.displayNameDe ?? `Fertigkeitsplatz ${index + 1}`}</h3><small>{originLabels[setup.origin ?? 'manual']}</small></div>{index >= 6 && !setup.locked && <button aria-label="Fertigkeitsslot entfernen" onClick={() => onChange(visible.filter(value => value.id !== setup.id))}>−</button>}</div>
        <label>Fertigkeit suchen<input type="search" value={query} placeholder="Deutsch oder Englisch" onChange={event => setSearches({ ...searches, [setup.id]: event.target.value })}/></label>
        <label>Fertigkeit<select value={setup.skillId} onChange={event => update(setup.id, { skillId: event.target.value, origin: 'manual', supportGemIds: [] })}><option value="">Leer / automatisch empfehlen</option>{filtered.map(item => <option value={item.id} key={item.id}>{item.displayNameDe}{item.nameEn && item.nameEn !== item.displayNameDe ? ` (${item.nameEn})` : ''}</option>)}</select></label>
        <div className="form-grid compact"><label>Rolle<select value={setup.role} onChange={event => update(setup.id, { role: event.target.value as SkillRole })}>{Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Waffenset<select value={setup.weaponSet} onChange={event => update(setup.id, { weaponSet: event.target.value as SkillWeaponSet })}>{Object.entries(setLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
        <div className="support-editor"><div className="row"><b>Unterstützungen</b>{skill && <button onClick={() => onRecommendSupports?.(setup.id)}>Beste vorschlagen</button>}</div>{setup.supportGemIds.map(id => { const support = buildAssistantCandidates.supports.find(item => item.id === id); return <span className="support-chip" key={id}>{support?.displayNameDe ?? id}<button aria-label={`${support?.displayNameDe ?? id} entfernen`} onClick={() => update(setup.id, { supportGemIds: setup.supportGemIds.filter(value => value !== id) })}>−</button></span> })}<select aria-label="Unterstützung hinzufügen" value="" onChange={event => event.target.value && update(setup.id, { supportGemIds: [...new Set([...setup.supportGemIds, event.target.value])] })}><option value="">＋ Unterstützung hinzufügen</option>{buildAssistantCandidates.supports.filter(item => !setup.supportGemIds.includes(item.id)).map(item => <option key={item.id} value={item.id}>{item.displayNameDe}</option>)}</select></div>
      </article>
    })}</div><p className="muted">Automatische Aszendenzfertigkeiten werden nur ergänzt, wenn eine technisch belegte Zuordnung vorhanden ist. Für den aktuellen Bestand ist keine solche Zuordnung bestätigt.</p>
  </section>
}
