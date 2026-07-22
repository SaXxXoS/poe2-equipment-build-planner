import { useCallback,useState } from 'react'
import './styles.css'
import './domain.css'
import type { CharacterConfiguration } from './domain'
import { ascendancyDefinitions, buildResult, initialEquipment, skillSetups as initialSkillSetups } from './data'
import { CharacterSection } from './components/CharacterSection'
import { EquipmentSection } from './components/EquipmentSection'
import { SkillsSection } from './components/SkillsSection'
import { PassiveTree } from './components/PassiveTree'
import { BuildResultSection } from './components/BuildResultSection'
import { RealPassiveAnalysis,type PassivePlanPresentation } from './features/real-passive-analysis'

export default function App() {
  const [character, setCharacter] = useState<CharacterConfiguration>({ classId: 'class-official-6', ascendancyId: ascendancyDefinitions.find(value => value.classId === 'class-official-6')?.id ?? '', level: 70, goalProfile: 'balanced' })
  const [equipment, setEquipment] = useState(initialEquipment)
  const [setups, setSetups] = useState(initialSkillSetups)
  const [calculated, setCalculated] = useState(false)
  const [passivePlan,setPassivePlan]=useState<PassivePlanPresentation>({result:null,status:'uninitialized'}),[planVisible,setPlanVisible]=useState(true),[focusPlanRequest,setFocusPlanRequest]=useState(0)
  const receivePassivePlan=useCallback((value:PassivePlanPresentation)=>{setPassivePlan(value);if(value.status==='completed'&&value.result)setPlanVisible(true)},[])
  function calculate() { setCalculated(true); setTimeout(() => document.querySelector('#result')?.scrollIntoView({ behavior: 'smooth' }), 0) }
  return <><header><p className="eyebrow">Equipment-first · Mobiler Prototyp</p><h1>PoE2 Equipment Build Planner</h1><p>Plane einen Build ausgehend von deiner Ausrüstung. Der offizielle Passivbaum kann experimentell im Worker analysiert werden; übrige Ergebnisse bleiben lokale Platzhalter.</p></header><main><CharacterSection value={character} onChange={setCharacter}/><EquipmentSection entries={equipment} setEntries={setEquipment}/><SkillsSection setups={setups} onChange={setSetups}/><PassiveTree characterClassId={character.classId} characterAscendancyId={character.ascendancyId} planResult={passivePlan.result} planStatus={passivePlan.status} planVisible={planVisible} focusPlanRequest={focusPlanRequest}/><RealPassiveAnalysis character={character} equipment={equipment} setups={setups} onPlanPresentation={receivePassivePlan} planVisible={planVisible} onTogglePlan={()=>setPlanVisible(value=>!value)} onShowPlan={()=>{setPlanVisible(true);setFocusPlanRequest(value=>value+1);setTimeout(()=>document.querySelector('.tree-viewport')?.scrollIntoView({behavior:'smooth',block:'center'}),0)}}/><section className="calculate"><h2>7. Test-Build berechnen</h2><p>Dieser getrennte Ergebnisbereich verwendet weiterhin lokale Platzhalter.</p><button className="calculate-btn" onClick={calculate}>Test-Build berechnen</button></section>{calculated && <BuildResultSection result={buildResult}/>}</main><footer>Prototyp mit lokalen Platzhalterdaten · Keine Verbindung zu PoE2DB</footer></>
}
