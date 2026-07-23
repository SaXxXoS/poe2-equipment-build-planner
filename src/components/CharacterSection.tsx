import { useState } from 'react'
import type { CharacterConfiguration, GoalProfile } from '../domain'
import { ascendancyDefinitions, classDefinitions, findTreeAscendancy, treeClassRegistry } from '../data'
import { availablePassivePoints } from '../features/character/passive-points'

const goalLabels: Record<GoalProfile, string> = { balanced: 'Allround', mapping: 'Mapping', boss: 'Boss' }
export function CharacterSection({ value, onChange }: { value: CharacterConfiguration; onChange: (value: CharacterConfiguration) => void }) {
  const [stage, setStage] = useState<'class' | 'ascendancy' | 'details'>(value.ascendancyId ? 'details' : value.classId ? 'ascendancy' : 'class')
  const availableAscendancies = ascendancyDefinitions.filter(ascendancy => ascendancy.classId === value.classId)
  const selectedClass = classDefinitions.find(item => item.id === value.classId)
  const selectedAscendancy = ascendancyDefinitions.find(item => item.id === value.ascendancyId)
  return <section id="character"><h2>1. Charakter</h2>
    {stage === 'class' && <><p>Wähle zuerst deine Klasse.</p><div className="choice-list">{classDefinitions.map(item => { const registry = treeClassRegistry.find(value => value.classId === item.id)!; return <button key={item.id} disabled={!registry.selectableInCurrentUi} onClick={() => { onChange({ ...value, classId: item.id, ascendancyId: '' }); setStage('ascendancy') }}><span className="neutral-icon">{item.displayNameDe.slice(0, 2)}</span><span><b>{item.displayNameDe}</b><small>{registry.selectableInCurrentUi ? 'Verfügbar' : 'Noch nicht vollständig unterstützt'}</small></span></button> })}</div></>}
    {stage === 'ascendancy' && <><button className="text-button" onClick={() => setStage('class')}>← Zurück zur Klassenwahl</button><h3>{selectedClass?.displayNameDe}: Aszendenz wählen</h3><div className="choice-list"><button onClick={() => { onChange({ ...value, ascendancyId: '' }); setStage('details') }}><span className="neutral-icon">–</span><span><b>Keine Aszendenz</b><small>Optional oder noch nicht gewählt</small></span></button>{availableAscendancies.map(item => { const registry = findTreeAscendancy(item.id)!; return <button key={item.id} disabled={!registry.selectableInCurrentUi} onClick={() => { onChange({ ...value, ascendancyId: item.id }); setStage('details') }}><span className="neutral-icon">{item.displayNameDe.slice(0, 2)}</span><span><b>{item.displayNameDe}</b><small>{registry.selectableInCurrentUi ? 'Verfügbar' : 'Nicht verfügbar'}</small></span></button> })}</div></>}
    {stage === 'details' && <><div className="character-summary"><span className="neutral-icon">{selectedClass?.displayNameDe.slice(0, 2)}</span><div><b>{selectedClass?.displayNameDe ?? 'Klasse fehlt'}</b><span>{selectedAscendancy?.displayNameDe ?? 'Keine Aszendenz'}</span></div><button className="text-button" onClick={() => setStage('class')}>Ändern</button></div><div className="form-grid">
      <label>Charakterlevel<input type="number" min="1" max="100" value={value.level} onChange={event => onChange({ ...value, level: Number(event.target.value) })}/></label>
      <label>Zusätzliche Story-Passivpunkte<input type="number" min="0" max="50" value={value.additionalPassivePoints ?? 0} onChange={event => onChange({ ...value, additionalPassivePoints: Number(event.target.value) })}/></label>
      <label>Verfügbare Gesamt-Passivpunkte<output>{availablePassivePoints(value.level, value.additionalPassivePoints)}</output></label>
      <label>Zielprofil<select value={value.goalProfile} onChange={event => onChange({ ...value, goalProfile: event.target.value as GoalProfile })}>{Object.entries(goalLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
    </div><a className="step-link" href="#equipment">Weiter zur Ausrüstung →</a></>}
  </section>
}
