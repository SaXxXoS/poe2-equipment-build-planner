import { useCallback, useState } from 'react'
import './styles.css'
import './domain.css'
import type { CharacterConfiguration } from './domain'
import type { BuildAnalysis } from './engine'
import { initialEquipment } from './data'
import { CharacterSection } from './components/CharacterSection'
import { EquipmentSection } from './components/EquipmentSection'
import { SkillsSection } from './components/SkillsSection'
import { createEmptySkillSetups } from './features/skills/initial-state'
import { createInitialCharacterConfiguration } from './features/character/initial-state'
import { PassiveTree } from './components/PassiveTree'
import { BuildAssistantResultSection } from './components/BuildAssistantResultSection'
import { RealPassiveAnalysis, type PassivePlanPresentation } from './features/real-passive-analysis'
import { runBuildAssistantV1, validateBuildAssistantInput } from './features/build-assistant-v1'

export default function App() {
  const [character, setCharacter] = useState<CharacterConfiguration>(createInitialCharacterConfiguration)
  const [equipment, setEquipment] = useState(initialEquipment)
  const [setups, setSetups] = useState(createEmptySkillSetups)
  const [analysis, setAnalysis] = useState<BuildAnalysis | null>(null)
  const [calculationState, setCalculationState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [calculationErrors, setCalculationErrors] = useState<string[]>([])
  const [passivePlan, setPassivePlan] = useState<PassivePlanPresentation>({ result: null, status: 'uninitialized' })
  const [planVisible, setPlanVisible] = useState(true)
  const [focusPlanRequest, setFocusPlanRequest] = useState(0)
  function invalidateResult() {
    setAnalysis(null)
    setCalculationState('idle')
    setCalculationErrors([])
  }
  const receivePassivePlan = useCallback((value: PassivePlanPresentation) => {
    setPassivePlan(value)
    if (value.status === 'completed' && value.result) setPlanVisible(true)
  }, [])
  const showPassivePlan = useCallback(() => {
    setPlanVisible(true)
    setFocusPlanRequest(value => value + 1)
    setTimeout(() => document.querySelector('.tree-viewport')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }, [])
  function calculate() {
    const input = { character, equipment, setups }
    const errors = validateBuildAssistantInput(input)
    setCalculationErrors(errors)
    if (errors.length) return
    setCalculationState('running')
    setTimeout(() => {
      try {
        setAnalysis(runBuildAssistantV1(input))
        setCalculationState('completed')
        setTimeout(() => document.querySelector('#result')?.scrollIntoView({ behavior: 'smooth' }), 0)
      } catch {
        setCalculationState('error')
        setCalculationErrors(['Die Build-Auswertung konnte nicht abgeschlossen werden. Bitte prüfe die Eingaben.'])
      }
    }, 0)
  }
  function recommendSupports(setupId: string) {
    const setup = setups.find(value => value.id === setupId)
    if (!setup?.skillId || !character.classId) return
    const result = runBuildAssistantV1({ character: { ...character, desiredMainSkillId: setup.skillId }, equipment, setups })
    const supportGemIds = result.supportAnalysis.topCandidates.slice(0, 5).map(value => value.supportId)
    setSetups(setups.map(value => value.id === setupId ? { ...value, supportGemIds } : value))
    invalidateResult()
  }
  return <>
    <header>
      <p className="eyebrow">Equipment-first · Build-Assistent V1</p>
      <h1>PoE2 Build-Assistent</h1>
      <p>Wähle Charakter, Ausrüstung, Hauptangriff und Zielprofil. Die vorhandenen Analyzer verbinden diese Eingaben zu einem nachvollziehbaren deutschen Build-Vorschlag.</p>
    </header>
    <main>
      <CharacterSection value={character} onChange={value => { setCharacter(value); invalidateResult() }}/>
      <EquipmentSection entries={equipment} setEntries={value => { setEquipment(value); invalidateResult() }}/>
      <SkillsSection setups={setups} onChange={value => { setSetups(value); const selectedMain = value.find(setup => setup.role === 'main' && setup.skillId); setCharacter(current => ({ ...current, desiredMainSkillId: selectedMain?.skillId || undefined })); invalidateResult() }} onRecommendSupports={recommendSupports}/>
      <PassiveTree characterClassId={character.classId} characterAscendancyId={character.ascendancyId} planResult={passivePlan.result} planStatus={passivePlan.status} planVisible={planVisible} focusPlanRequest={focusPlanRequest}/>
      <RealPassiveAnalysis character={character} equipment={equipment} setups={setups} onPlanPresentation={receivePassivePlan} planVisible={planVisible} onTogglePlan={() => setPlanVisible(value => !value)} onShowPlan={showPassivePlan}/>
      <section className="calculate">
        <h2>7. Build auswerten</h2>
        <p>Leere optionale Ausrüstungsslots sind erlaubt. Sie senken lediglich die Sicherheit der Empfehlung.</p>
        {calculationErrors.length > 0 && <div className="analysis-error" role="alert">{calculationErrors.map(error => <p key={error}>{error}</p>)}</div>}
        <button className="calculate-btn" disabled={calculationState === 'running'} onClick={calculate}>{calculationState === 'running' ? 'Berechnung läuft …' : 'Build-Vorschlag erstellen'}</button>
        <p className="calculation-status" aria-live="polite">{calculationState === 'completed' ? 'Ergebnis vorhanden' : calculationState === 'error' ? 'Fehler bei der Berechnung' : calculationState === 'running' ? 'Analyzer werden ausgeführt' : 'Bereit zur Auswertung'}</p>
      </section>
      {analysis && <BuildAssistantResultSection analysis={analysis} equipment={equipment} passivePlan={passivePlan} onShowPassivePlan={showPassivePlan}/>}
    </main>
    <footer>Lokale, deterministische Build-Auswertung · Keine Runtime-Verbindung zu externen Datenquellen</footer>
  </>
}
