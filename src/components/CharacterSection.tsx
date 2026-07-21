import type { CharacterConfiguration, GoalProfile } from '../domain'
import { ascendancyDefinitions, classDefinitions, findTreeAscendancy, skillDefinitions, treeClassRegistry } from '../data'

const goalLabels: Record<GoalProfile, string> = { balanced: 'Ausgeglichen', mapping: 'Mapping', boss: 'Boss' }

export function CharacterSection({ value, onChange }: { value: CharacterConfiguration; onChange: (value: CharacterConfiguration) => void }) {
  const availableAscendancies = ascendancyDefinitions.filter(ascendancy => ascendancy.classId === value.classId)
  return <section><h2>1. Charakter</h2><div className="form-grid">
    <label>Klasse<select value={value.classId} onChange={event => { const classId = event.target.value, registry = treeClassRegistry.find(item => item.classId === classId); onChange({ ...value, classId, ascendancyId: registry?.ascendancies.find(item => item.selectableInCurrentUi)?.ascendancyId ?? '' }) }}>{classDefinitions.map(item => { const registry=treeClassRegistry.find(value=>value.classId===item.id)!; return <option value={item.id} key={item.id} disabled={!registry.selectableInCurrentUi}>{item.displayNameDe}{registry.selectableInCurrentUi?'':' (noch nicht unterstützt)'}</option> })}</select></label>
    <label>Aszendenz<select value={value.ascendancyId} onChange={event => onChange({ ...value, ascendancyId: event.target.value })}><option value="">Keine Aszendenz</option>{availableAscendancies.map(item => { const registry=findTreeAscendancy(item.id)!; return <option value={item.id} key={item.id} disabled={!registry.selectableInCurrentUi}>{item.displayNameDe}{registry.selectableInCurrentUi?'':' (nicht verfügbar)'}</option> })}</select></label>
    <label>Charakterlevel<input aria-label="Charakterlevel" type="number" min="1" max="100" value={value.level} onChange={event => onChange({ ...value, level: Number(event.target.value) })}/></label>
    <label>Ziel<select value={value.goalProfile} onChange={event => onChange({ ...value, goalProfile: event.target.value as GoalProfile })}>{Object.entries(goalLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
    <label>Hauptfertigkeit<select value={value.desiredMainSkillId ?? ''} onChange={event => onChange({ ...value, desiredMainSkillId: event.target.value || undefined })}><option value="">Automatisch</option>{skillDefinitions.slice(0, 3).map(skill => <option value={skill.id} key={skill.id}>{skill.displayNameDe}</option>)}</select></label>
  </div></section>
}
