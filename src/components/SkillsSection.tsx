import { useState } from 'react'
import type { SkillOrigin, SkillRole, SkillSetup, SkillWeaponSet } from '../domain'
import { buildAssistantCandidates } from '../features/build-assistant-v1'
import { emptySkillSetup } from '../features/skills/initial-state'

const roleLabels: Record<SkillRole, string> = { main: 'Hauptschaden', secondary: 'Zusatzschaden', utility: 'Utility', movement: 'Bewegung', defensive: 'Defensive' }
const originLabels: Record<SkillOrigin, string> = { manual: 'Manuell gewählt', recommended: 'Von der App empfohlen', ascendancy: 'Durch Aszendenz', equipment: 'Durch Ausrüstung verfügbar' }
const setLabels: Record<SkillWeaponSet, string> = { 'set-1': 'Waffenset 1', 'set-2': 'Waffenset 2', both: 'Beide' }
const visibleSupportSlots = 5

export function SkillsSection({ setups, onChange, onRecommendSupports }: { setups: SkillSetup[]; onChange: (values: SkillSetup[]) => void; onRecommendSupports?: (setupId: string) => void }) {
  const [searches, setSearches] = useState<Record<string, string>>({})
  const [supportSearches, setSupportSearches] = useState<Record<string, string>>({})
  const [openSkillPicker, setOpenSkillPicker] = useState<string | null>(null)
  const [openSupportPicker, setOpenSupportPicker] = useState<string | null>(null)
  const visible = setups.length >= 6 ? setups : [...setups, ...Array.from({ length: 6 - setups.length }, (_, i) => emptySkillSetup(setups.length + i))]
  const update = (id: string, patch: Partial<SkillSetup>) => onChange(visible.map(value => value.id === id ? { ...value, ...patch } : value))
  const chooseSkill = (setupId: string, skillId: string) => {
    update(setupId, { skillId, origin: 'manual', supportGemIds: [] })
    setOpenSkillPicker(null)
    setSearches(current => ({ ...current, [setupId]: '' }))
  }

  return <section id="skills">
    <div className="section-heading"><div><h2>3. Fertigkeiten und Unterstützungen</h2><p className="muted">Sechs leere Startplätze; weitere Plätze sind optional.</p></div><button aria-label="Fertigkeitsslot hinzufügen" onClick={() => onChange([...visible, emptySkillSetup(visible.length)])}>＋ Slot</button></div>
    <div className="skills-grid">{visible.map((setup, index) => {
      const skill = buildAssistantCandidates.skills.find(item => item.id === setup.skillId)
      const query = searches[setup.id] ?? ''
      const filtered = buildAssistantCandidates.skills.filter(item => `${item.displayNameDe} ${item.nameEn ?? ''}`.toLocaleLowerCase('de').includes(query.toLocaleLowerCase('de')))

      if (!skill) return <article className="skill-card empty-skill-card" key={setup.id}>
        <div className="skill-card-head"><span className="skill-art" aria-hidden="true">＋</span><div><h3>Fertigkeit {index + 1}</h3><small>Keine Fertigkeit ausgewählt</small></div>{index >= 6 && <button aria-label="Fertigkeitsslot entfernen" onClick={() => onChange(visible.filter(value => value.id !== setup.id))}>−</button>}</div>
        <div className="picker-field">
          <label htmlFor={`skill-search-${setup.id}`}>Fertigkeit suchen</label>
          <input id={`skill-search-${setup.id}`} type="search" value={query} placeholder="Fertigkeit suchen" autoComplete="off" aria-expanded={openSkillPicker === setup.id} aria-controls={`skill-results-${setup.id}`} onFocus={() => setOpenSkillPicker(setup.id)} onClick={() => setOpenSkillPicker(setup.id)} onChange={event => { setSearches({ ...searches, [setup.id]: event.target.value }); setOpenSkillPicker(setup.id) }}/>
          {openSkillPicker === setup.id && <div className="picker-panel" id={`skill-results-${setup.id}`} role="listbox" aria-label={`Fertigkeiten für Platz ${index + 1}`}><small>{filtered.length} Fertigkeiten</small>{filtered.length ? filtered.map(item => <button type="button" role="option" aria-selected="false" key={item.id} onClick={() => chooseSkill(setup.id, item.id)}><strong>{item.displayNameDe}</strong>{item.nameEn && item.nameEn !== item.displayNameDe && <span>{item.nameEn}</span>}</button>) : <p>Keine passende Fertigkeit gefunden.</p>}</div>}
        </div>
        <div className="support-slots support-slots-disabled" aria-label="Unterstützungsplätze"><b>Unterstützungsplätze</b><small>Zuerst eine Fertigkeit auswählen</small><div>{Array.from({ length: visibleSupportSlots }, (_, supportIndex) => <span key={supportIndex}>Support {supportIndex + 1}</span>)}</div></div>
      </article>

      const supportQuery = supportSearches[setup.id] ?? ''
      const availableSupports = buildAssistantCandidates.supports.filter(item => !setup.supportGemIds.includes(item.id) && `${item.displayNameDe} ${item.nameEn ?? ''}`.toLocaleLowerCase('de').includes(supportQuery.toLocaleLowerCase('de')))
      return <article className="skill-card populated-skill-card" key={setup.id}>
        <div className="skill-card-head"><span className="skill-art" aria-hidden="true">{skill.displayNameDe.slice(0, 2)}</span><div><h3>{skill.displayNameDe}</h3><small>{originLabels[setup.origin ?? 'manual']}</small></div>{index >= 6 && !setup.locked && <button aria-label="Fertigkeitsslot entfernen" onClick={() => onChange(visible.filter(value => value.id !== setup.id))}>−</button>}</div>
        <label>Fertigkeit<select value={setup.skillId} onChange={event => update(setup.id, { skillId: event.target.value, origin: 'manual', supportGemIds: [] })}><option value="">Fertigkeit entfernen</option>{buildAssistantCandidates.skills.map(item => <option value={item.id} key={item.id}>{item.displayNameDe}{item.nameEn && item.nameEn !== item.displayNameDe ? ` (${item.nameEn})` : ''}</option>)}</select></label>
        <div className="form-grid compact"><label>Rolle<select value={setup.role} onChange={event => update(setup.id, { role: event.target.value as SkillRole })}>{Object.entries(roleLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>Waffenset<select value={setup.weaponSet} onChange={event => update(setup.id, { weaponSet: event.target.value as SkillWeaponSet })}>{Object.entries(setLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label></div>
        <div className="support-editor">
          <div className="row"><b>Unterstützungsplätze</b><button onClick={() => onRecommendSupports?.(setup.id)}>Beste vorschlagen</button></div>
          <div className="support-slot-list">{Array.from({ length: Math.max(visibleSupportSlots, setup.supportGemIds.length) }, (_, supportIndex) => {
            const id = setup.supportGemIds[supportIndex]
            const support = id ? buildAssistantCandidates.supports.find(item => item.id === id) : undefined
            return support
              ? <span className="support-chip" key={id}><span className="support-art" aria-hidden="true">{support.displayNameDe.slice(0, 2)}</span><span><small>Support {supportIndex + 1}</small>{support.displayNameDe}</span><button aria-label={`${support.displayNameDe} entfernen`} onClick={() => update(setup.id, { supportGemIds: setup.supportGemIds.filter(value => value !== id) })}>−</button></span>
              : <button type="button" className="empty-support-slot" key={`empty-${supportIndex}`} onClick={() => setOpenSupportPicker(openSupportPicker === setup.id ? null : setup.id)}>＋ Support {supportIndex + 1}</button>
          })}</div>
          {openSupportPicker === setup.id && <div className="support-picker"><label htmlFor={`support-search-${setup.id}`}>Unterstützung suchen</label><input id={`support-search-${setup.id}`} type="search" value={supportQuery} placeholder="Unterstützung suchen" autoComplete="off" onChange={event => setSupportSearches(current => ({ ...current, [setup.id]: event.target.value }))}/><div className="picker-panel inline" role="listbox" aria-label={`Unterstützungen für ${skill.displayNameDe}`}><small>{availableSupports.length} Unterstützungen</small>{availableSupports.length ? availableSupports.map(item => <button type="button" role="option" aria-selected="false" key={item.id} onClick={() => { update(setup.id, { supportGemIds: [...new Set([...setup.supportGemIds, item.id])] }); setOpenSupportPicker(null); setSupportSearches(current => ({ ...current, [setup.id]: '' })) }}><strong>{item.displayNameDe}</strong>{item.nameEn && item.nameEn !== item.displayNameDe && <span>{item.nameEn}</span>}</button>) : <p>Keine passende Unterstützung gefunden.</p>}</div></div>}
        </div>
      </article>
    })}</div>
    <p className="muted">Automatische Empfehlungen erscheinen erst nach einer Build-Auswertung oder einer ausdrücklichen Aktion.</p>
  </section>
}
