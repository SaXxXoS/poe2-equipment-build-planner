import type { CharacterConfiguration, GoalProfile } from '../domain'
import { ascendancyDefinitions, classDefinitions, findTreeAscendancy, treeClassRegistry } from '../data'
import { buildAssistantCandidates } from '../features/build-assistant-v1'
import { useState } from 'react'

const goalLabels: Record<GoalProfile, string> = { balanced: 'Allround', mapping: 'Mapping', boss: 'Boss' }

export function CharacterSection({ value, onChange }: { value: CharacterConfiguration; onChange: (value: CharacterConfiguration) => void }) {
  const [skillSearch, setSkillSearch] = useState('')
  const availableAscendancies = ascendancyDefinitions.filter(ascendancy => ascendancy.classId === value.classId)
  const visibleSkills = buildAssistantCandidates.skills.filter(skill => `${skill.displayNameDe} ${skill.nameEn ?? ''}`.toLocaleLowerCase('de').includes(skillSearch.toLocaleLowerCase('de')))
  return <section><h2>1. Charakter</h2><div className="form-grid">
    <label>Klasse<select value={value.classId} onChange={event => { const classId = event.target.value, registry = treeClassRegistry.find(item => item.classId === classId); onChange({ ...value, classId, ascendancyId: registry?.ascendancies.find(item => item.selectableInCurrentUi)?.ascendancyId ?? '' }) }}>{classDefinitions.map(item => { const registry=treeClassRegistry.find(value=>value.classId===item.id)!; return <option value={item.id} key={item.id} disabled={!registry.selectableInCurrentUi}>{item.displayNameDe}{registry.selectableInCurrentUi?'':' (noch nicht unterstützt)'}</option> })}</select></label>
    <label>Aszendenz<select value={value.ascendancyId} onChange={event => onChange({ ...value, ascendancyId: event.target.value })}><option value="">Keine Aszendenz</option>{availableAscendancies.map(item => { const registry=findTreeAscendancy(item.id)!; return <option value={item.id} key={item.id} disabled={!registry.selectableInCurrentUi}>{item.displayNameDe}{registry.selectableInCurrentUi?'':' (nicht verfügbar)'}</option> })}</select></label>
    <label>Charakterlevel<input aria-label="Charakterlevel" type="number" min="1" max="100" value={value.level} onChange={event => onChange({ ...value, level: Number(event.target.value) })}/></label>
    <label>Ziel<select value={value.goalProfile} onChange={event => onChange({ ...value, goalProfile: event.target.value as GoalProfile })}>{Object.entries(goalLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
    <label>Hauptfertigkeit suchen<input aria-label="Hauptfertigkeit suchen" type="search" value={skillSearch} onChange={event => setSkillSearch(event.target.value)} placeholder="Deutsch oder Englisch"/></label>
    <label>Hauptfertigkeit<select value={value.desiredMainSkillId ?? ''} onChange={event => onChange({ ...value, desiredMainSkillId: event.target.value || undefined })}><option value="">Automatisch</option>{visibleSkills.map(skill => <option value={skill.id} key={skill.id}>{skill.displayNameDe}{skill.nameEn && skill.nameEn !== skill.displayNameDe ? ` (${skill.nameEn})` : ''}</option>)}</select></label>
  </div></section>
}
