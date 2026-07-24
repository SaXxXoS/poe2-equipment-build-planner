import { useState } from 'react'
import type { CharacterConfiguration, GoalProfile } from '../domain'
import { ascendancyDefinitions, findTreeAscendancy } from '../data'
import { availablePassivePoints } from '../features/character/passive-points'
import { applyClassSelection, ascendancyLabels, parseUnsignedIntegerDraft, supportedClassOptions } from '../features/character/ui-options'

const goalLabels: Record<GoalProfile, string> = { balanced: 'Allround', mapping: 'Mapping', boss: 'Boss' }
export function CharacterSection({ value, onChange }: { value: CharacterConfiguration; onChange: (value: CharacterConfiguration) => void }) {
  const [levelInput, setLevelInput] = useState(value.level > 0 ? String(value.level) : '')
  const [storyInput, setStoryInput] = useState(value.additionalPassivePoints == null ? '' : String(value.additionalPassivePoints))
  const [ascendancyInput, setAscendancyInput] = useState(value.ascendancyPassivePoints == null ? '' : String(value.ascendancyPassivePoints))
  const levelValid = /^\d+$/.test(levelInput) && Number(levelInput) >= 1 && Number(levelInput) <= 100
  const storyValid = /^\d+$/.test(storyInput) && Number(storyInput) >= 0 && Number(storyInput) <= 50
  const ascendancyValid = /^\d+$/.test(ascendancyInput) && Number(ascendancyInput) >= 0 && Number(ascendancyInput) <= 8
  const availableAscendancies = ascendancyDefinitions.filter(ascendancy =>
    ascendancy.classId === value.classId && findTreeAscendancy(ascendancy.id)?.selectableInCurrentUi,
  )
  const levelPoints = levelValid ? availablePassivePoints(Number(levelInput), 0) : null
  const totalPoints = levelValid && storyValid ? availablePassivePoints(Number(levelInput), Number(storyInput)) : null
  const updateNumber = (kind: 'level' | 'story' | 'ascendancy', input: string) => {
    const parsed = parseUnsignedIntegerDraft(input)
    if (parsed === null) return
    if (kind === 'level') {
      setLevelInput(input)
      onChange({ ...value, level: parsed ?? 0 })
    } else if (kind === 'story') {
      setStoryInput(input)
      onChange({ ...value, additionalPassivePoints: parsed })
    } else {
      setAscendancyInput(input)
      onChange({ ...value, ascendancyPassivePoints: parsed })
    }
  }
  return <section id="character"><h2>1. Charakter</h2>
    <div className="character-selectors">
      <label>Klasse
        <select aria-label="Klasse" value={value.classId} onChange={event => onChange(applyClassSelection(value, event.target.value))}>
          <option value="">Klasse auswählen</option>
          {supportedClassOptions.map(item => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label>Aszendenz
        <select aria-label="Aszendenz" value={value.ascendancyId} disabled={!value.classId} onChange={event => onChange({ ...value, ascendancyId: event.target.value })}>
          <option value="">{value.classId ? 'Aszendenz auswählen' : 'Zuerst Klasse auswählen'}</option>
          {availableAscendancies.map(item => <option value={item.id} key={item.id}>{ascendancyLabels[item.displayNameDe] ?? item.displayNameDe}</option>)}
        </select>
      </label>
    </div>
    <div className="character-data-grid">
      <label>Level
        <input aria-label="Level" inputMode="numeric" pattern="[0-9]*" placeholder="Level eingeben" value={levelInput} aria-invalid={levelInput !== '' && !levelValid} onChange={event => updateNumber('level', event.target.value)}/>
      </label>
      <label>Passivpunkte durch Level<output>{levelPoints ?? '—'}</output></label>
      <label>Story-Passivpunkte
        <input aria-label="Story-Passivpunkte" inputMode="numeric" pattern="[0-9]*" placeholder="Punkte eingeben" value={storyInput} aria-invalid={storyInput !== '' && !storyValid} onChange={event => updateNumber('story', event.target.value)}/>
      </label>
      <label>Gesamtpunkte<output>{totalPoints ?? '—'}</output></label>
      <label>Aszendenzpunkte
        <input aria-label="Aszendenzpunkte" inputMode="numeric" pattern="[0-9]*" placeholder="0 bis 8" value={ascendancyInput} aria-invalid={ascendancyInput !== '' && !ascendancyValid} onChange={event => updateNumber('ascendancy', event.target.value)}/>
      </label>
    </div>
    <label className="goal-field">Zielprofil<select value={value.goalProfile} onChange={event => onChange({ ...value, goalProfile: event.target.value as GoalProfile })}>{Object.entries(goalLabels).map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label>
    <a className="step-link" href="#equipment">Weiter zur Ausrüstung →</a>
  </section>
}
