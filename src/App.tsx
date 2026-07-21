import { useState } from 'react'
import './styles.css'
import './domain.css'
import type { CharacterConfiguration } from './domain'
import { ascendancyDefinitions, buildResult, initialEquipment, skillSetups as initialSkillSetups } from './data'
import { CharacterSection } from './components/CharacterSection'
import { EquipmentSection } from './components/EquipmentSection'
import { SkillsSection } from './components/SkillsSection'
import { JewelsSection } from './components/JewelsSection'
import { PassiveTree } from './components/PassiveTree'
import { BuildResultSection } from './components/BuildResultSection'
import { RealPassiveAnalysis } from './features/real-passive-analysis'

export default function App() {
  const [character, setCharacter] = useState<CharacterConfiguration>({ classId: 'class-official-6', ascendancyId: ascendancyDefinitions.find(value => value.classId === 'class-official-6')?.id ?? '', level: 70, goalProfile: 'balanced' })
  const [equipment, setEquipment] = useState(initialEquipment)
  const [setups, setSetups] = useState(initialSkillSetups)
  const [calculated, setCalculated] = useState(false)
  function calculate() { setCalculated(true); setTimeout(() => document.querySelector('#result')?.scrollIntoView({ behavior: 'smooth' }), 0) }
  return <><header><p className="eyebrow">Equipment-first · Mobiler Prototyp</p><h1>PoE2 Equipment Build Planner</h1><p>Plane einen Build ausgehend von deiner Ausrüstung. Der offizielle Passivbaum kann experimentell im Worker analysiert werden; übrige Ergebnisse bleiben lokale Platzhalter.</p></header><main><CharacterSection value={character} onChange={setCharacter}/><EquipmentSection entries={equipment} setEntries={setEquipment}/><SkillsSection setups={setups} onChange={setSetups}/><JewelsSection/><PassiveTree characterClassId={character.classId} characterAscendancyId={character.ascendancyId}/><RealPassiveAnalysis character={character} equipment={equipment} setups={setups}/><section className="calculate"><h2>7. Test-Build berechnen</h2><p>Dieser getrennte Ergebnisbereich verwendet weiterhin lokale Platzhalter.</p><button className="calculate-btn" onClick={calculate}>Test-Build berechnen</button></section>{calculated && <BuildResultSection result={buildResult}/>}</main><footer>Prototyp mit lokalen Platzhalterdaten · Keine Verbindung zu PoE2DB</footer></>
}
