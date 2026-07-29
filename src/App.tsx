import { useCallback, useEffect, useState } from 'react'
import './styles.css'
import './domain.css'
import type { CharacterConfiguration } from './domain'
import type { BuildAnalysis } from './engine'
import { initialEquipment } from './data'
import { CharacterSection } from './components/CharacterSection'
import { EquipmentSection } from './components/EquipmentSection'
import { SkillsSection } from './components/SkillsSection'
import { createEmptySkillSetups } from './features/skills/initial-state'
import { removeDuplicateSupportFamilies } from './features/skills/support-selection'
import { assignRecommendedWeaponSets } from './features/skills/automatic-weapon-sets'
import { planSynergisticSkills } from './features/skills/synergy-planner'
import { fillRecommendedSupportSlots } from './features/skills/automatic-supports'
import { ensureRequiredEmbeddedSkill, supportCapacityFor } from './features/skills/meta-skills'
import { selectAutomaticMainSkill } from './features/skills/automatic-main-skill'
import { optimizeBuildVariants, type BuildVariantOptimization } from './features/skills/build-variant-optimizer'
import { evaluateAnalyzedBuildPackage } from './features/skills/build-package-evaluation'
import { createInitialCharacterConfiguration } from './features/character/initial-state'
import { PassiveTree } from './components/PassiveTree'
import { BuildAssistantResultSection } from './components/BuildAssistantResultSection'
import { RealPassiveAnalysis, createPassiveAnalysisController, REAL_PASSIVE_UI_MAXIMUM_POINT_BUDGET, type PassiveAnalysisUiInput, type PassivePlanPresentation } from './features/real-passive-analysis'
import { buildAssistantCandidates, runBuildAssistantV1, validateBuildAssistantInput } from './features/build-assistant-v1'
import { clearStoredBuild, loadStoredBuild, saveStoredBuild } from './features/build-storage'
import { createEquipmentSlotSuggestions } from './features/equipment-editor/recommendations'
import { rebalanceSupportsAfterPassivePlanning, summarizePostPassiveResourceRisk, type PostPassiveResourceRebalanceResult } from './features/skills/post-passive-resource-rebalance'
import officialPassiveTree from '../generated/poe2-tree/tree.json'

export default function App() {
  const [initial] = useState(loadStoredBuild)
  const [character, setCharacter] = useState<CharacterConfiguration>(() => initial?.character ?? createInitialCharacterConfiguration())
  const [equipment, setEquipment] = useState(() => initial?.equipment ?? initialEquipment)
  const [setups, setSetups] = useState(() => removeDuplicateSupportFamilies(initial?.setups ?? createEmptySkillSetups(), buildAssistantCandidates.supports))
  const [analysis, setAnalysis] = useState<BuildAnalysis | null>(null)
  const [variantOptimization, setVariantOptimization] = useState<BuildVariantOptimization | null>(null)
  const [resourceRebalance, setResourceRebalance] = useState<PostPassiveResourceRebalanceResult | null>(null)
  const [calculationState, setCalculationState] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [calculationErrors, setCalculationErrors] = useState<string[]>([])
  const [passivePlan, setPassivePlan] = useState<PassivePlanPresentation>({ results: { shared: null, 'set-1': null, 'set-2': null, ascendancy: null }, status: 'uninitialized' })
  const [planVisible, setPlanVisible] = useState(true)
  const [focusPlanRequest, setFocusPlanRequest] = useState(0)
  const [passiveController] = useState(createPassiveAnalysisController)
  const [saveStatus, setSaveStatus] = useState(initial ? 'Gespeicherter Build geladen' : 'Noch nicht gespeichert')
  const equipmentSuggestions=analysis?createEquipmentSlotSuggestions({
    equipment,
    optimization:variantOptimization,
    uniqueRecommendations:[
      ...analysis.uniqueAnalysis.topCurrentBuildUniques,
      ...analysis.uniqueAnalysis.topDamageUniques,
      ...analysis.uniqueAnalysis.topDefensiveUniques,
    ],
    uniqueNames:new Map(buildAssistantCandidates.uniques.map(item=>[item.id,item.displayNameDe])),
    characterLevel:character.level,
  }):[]
  useEffect(() => {
    const timer = window.setTimeout(() => {
      saveStoredBuild({ character, equipment, setups })
      setSaveStatus('Automatisch gespeichert')
    }, 250)
    return () => window.clearTimeout(timer)
  }, [character, equipment, setups])
  function invalidateResult() {
    setAnalysis(null)
    setVariantOptimization(null)
    setResourceRebalance(null)
    setCalculationState('idle')
    setCalculationErrors([])
  }
  function prepareMetaSetup(value: typeof setups[number], allSetups: typeof setups) {
    const main = allSetups.find(item => item.role === 'main' && item.skillId)
    const mainTags = buildAssistantCandidates.skills.find(item => item.id === main?.skillId)?.tags ?? []
    const occupiedSkillIds = allSetups.flatMap(item => [
      ...(item.id === value.id ? [] : item.skillId ? [item.skillId] : []),
      ...(item.id === value.id ? [] : item.embeddedSkillIds ?? []),
    ])
    return ensureRequiredEmbeddedSkill(value, buildAssistantCandidates.skills, mainTags, occupiedSkillIds)
  }
  const receivePassivePlan = useCallback((value: PassivePlanPresentation) => {
    setPassivePlan(value)
    if (value.status === 'completed' && Object.values(value.results).some(Boolean)) setPlanVisible(true)
  }, [])
  const showPassivePlan = useCallback(() => {
    setPlanVisible(true)
    setFocusPlanRequest(value => value + 1)
    setTimeout(() => document.querySelector('.tree-viewport')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  }, [])
  async function calculate() {
    const preparedSetups = assignRecommendedWeaponSets(setups)
    const input = { character, equipment, setups: preparedSetups }
    const errors = validateBuildAssistantInput(input)
    setCalculationErrors(errors)
    if (errors.length) return
    setCalculationState('running')
    let completedAnalyzerResult:BuildAnalysis|null=null
    try {
        const addRecommendedSupports = (setupsToFill:typeof setups, characterForAnalysis:CharacterConfiguration) =>
          setupsToFill.reduce<typeof setups>((filled, value) => {
            const currentSetups = [...filled, ...setupsToFill.slice(filled.length)]
            if (!value.skillId) return [...filled, value]
            const preparedValue = prepareMetaSetup(value, currentSetups)
            const preparedCurrentSetups = currentSetups.map(item => item.id === value.id ? preparedValue : item)
            const skillResult = runBuildAssistantV1({
              character: { ...characterForAnalysis, desiredMainSkillId: value.skillId },
              equipment,
              setups: preparedCurrentSetups,
            })
            return [...filled, fillRecommendedSupportSlots(
              preparedValue,
              skillResult.supportAnalysis.topCandidates.length
                ? skillResult.supportAnalysis.topCandidates
                : skillResult.supportAnalysis.eligibleCandidates,
              buildAssistantCandidates.supports,
              supportCapacityFor(preparedValue),
              {
                equipment,
                setups: preparedCurrentSetups,
                skills: buildAssistantCandidates.skills,
                characterLevel: characterForAnalysis.level || undefined,
              },
              false,
            )]
          }, [])
        const evaluatePackage = (
          candidate: NonNullable<BuildVariantOptimization['selected']>,
          characterForAnalysis: CharacterConfiguration,
          baseSetups: typeof setups,
        ) => {
          let setupAssigned = false
          const packageSetups = baseSetups.map((setup, index) => {
            if (index === 0) return {
              ...setup,
              skillId: candidate.skillId,
              role: 'main' as const,
              weaponSet: candidate.mainWeaponSet,
              supportGemIds: candidate.compatibleSupportIds,
              origin: 'recommended' as const,
            }
            if (!setupAssigned && candidate.setupSkillId && !setup.skillId) {
              setupAssigned = true
              return {
                ...setup,
                skillId: candidate.setupSkillId,
                role: 'utility' as const,
                weaponSet: candidate.mainWeaponSet === 'set-1' ? 'set-2' as const : 'set-1' as const,
                supportGemIds: [],
                origin: 'recommended' as const,
                synergyReason: candidate.setupReason,
              }
            }
            return setup
          })
          const packageAnalysis = runBuildAssistantV1({
            character: { ...characterForAnalysis, desiredMainSkillId: candidate.skillId },
            equipment,
            setups: packageSetups,
          })
          const hasEquipment = equipment.some(entry =>
            Boolean(entry.itemClassId || entry.itemDefinitionId || entry.uniqueItemId || entry.modifierValues.length))
          return evaluateAnalyzedBuildPackage(candidate, packageAnalysis, {
            allowPlannedEquipmentRequirements: !hasEquipment,
          })
        }
        let result = runBuildAssistantV1(input)
        completedAnalyzerResult=result
        let effectiveSetups = preparedSetups
        let effectiveCharacter = character
        const hasSelectedSkill = preparedSetups.some(value => value.skillId)
        if (!hasSelectedSkill) {
          const mainCandidates = [
            ...result.skillAnalysis.topMainCandidates,
            ...result.skillAnalysis.eligibleCandidates.filter(value => value.possibleRoles.includes('main')),
            ...result.skillAnalysis.allCandidates.filter(value => value.possibleRoles.includes('main')),
          ].filter((value, index, all) => all.findIndex(candidate => candidate.skillId === value.skillId) === index)
          const optimization = optimizeBuildVariants({
            classId: character.classId,
            ascendancyId: character.ascendancyId,
            equipment,
            setups: preparedSetups,
            skills: buildAssistantCandidates.skills,
            supports: buildAssistantCandidates.supports,
            skillScores: mainCandidates,
            characterLevel: character.level || undefined,
            evaluatePackage: candidate => evaluatePackage(candidate, character, preparedSetups),
          })
          setVariantOptimization(optimization)
          const recommendation = mainCandidates.find(value => value.skillId === optimization.selected?.skillId) ?? selectAutomaticMainSkill({
            candidates: mainCandidates,
            definitions: buildAssistantCandidates.skills,
            equipment,
            setups: preparedSetups,
            classId: character.classId,
            ascendancyId: character.ascendancyId,
            characterLevel: character.level || undefined,
          })
          if (recommendation) {
            effectiveCharacter = { ...character, desiredMainSkillId: recommendation.skillId }
            const preferredWeaponSet = optimization.selected?.mainWeaponSet
              ?? (recommendation.preferredWeaponSet === 'none' ? 'both' as const : recommendation.preferredWeaponSet)
            const provisionalSetups = preparedSetups.map((value, index) => index === 0 ? { ...value, skillId: recommendation.skillId, role: 'main' as const, weaponSet: preferredWeaponSet, origin: 'recommended' as const, supportGemIds: [] } : value)
            const provisionalResult = runBuildAssistantV1({ character: effectiveCharacter, equipment, setups: provisionalSetups })
            const rankedSkills = [
              recommendation,
              ...provisionalResult.skillAnalysis.eligibleCandidates,
              ...provisionalResult.skillAnalysis.allCandidates.filter(value => value.valid),
            ].filter((value, index, all) => all.findIndex(candidate => candidate.skillId === value.skillId) === index)
            const mainDefinition = buildAssistantCandidates.skills.find(value => value.id === recommendation.skillId)
            const skillQueue = mainDefinition ? planSynergisticSkills(
              mainDefinition,
              buildAssistantCandidates.skills.filter(definition => {
                if (definition.requiredClassId && definition.requiredClassId !== character.classId) return false
                if (definition.excludedClassIds?.includes(character.classId)) return false
                if (definition.allowedAscendancyIds?.length && !definition.allowedAscendancyIds.includes(character.ascendancyId)) return false
                return !definition.excludedAscendancyIds?.includes(character.ascendancyId)
              }),
              rankedSkills,
              provisionalSetups.length - 1,
              { ascendancyId: character.ascendancyId },
            ) : []
            if (optimization.selected?.setupSkillId) {
              const selectedSetupIndex = skillQueue.findIndex(value => value.skillId === optimization.selected?.setupSkillId)
              if (selectedSetupIndex > 0) skillQueue.unshift(...skillQueue.splice(selectedSetupIndex, 1))
            }
            const populatedSetups = assignRecommendedWeaponSets(provisionalSetups.map(value => {
              if (value.skillId) return value
              const candidate = skillQueue.shift()
              if (!candidate) return value
              return {
                ...value,
                skillId: candidate.skillId,
                role: candidate.role,
                weaponSet: candidate.weaponSet,
                origin: 'recommended' as const,
                supportGemIds: [],
                synergyReason: candidate.reason,
              }
            }))
            const nextSetups = addRecommendedSupports(populatedSetups, effectiveCharacter)
            effectiveSetups = nextSetups
            setSetups(nextSetups)
            setCharacter(effectiveCharacter)
            result = runBuildAssistantV1({ character: effectiveCharacter, equipment, setups: nextSetups })
            completedAnalyzerResult=result
          }
        }
        if (hasSelectedSkill) {
          const mainSetup = preparedSetups.find(value => value.role === 'main' && value.skillId) ?? preparedSetups.find(value => value.skillId)
          const mainDefinition = buildAssistantCandidates.skills.find(value => value.id === mainSetup?.skillId)
          if (mainSetup && mainDefinition) {
            const scores = [...result.skillAnalysis.eligibleCandidates, ...result.skillAnalysis.allCandidates]
              .filter((value, index, all) => all.findIndex(candidate => candidate.skillId === value.skillId) === index)
            setVariantOptimization(optimizeBuildVariants({
              classId: character.classId,
              ascendancyId: character.ascendancyId,
              equipment,
              setups: preparedSetups,
              skills: buildAssistantCandidates.skills,
              supports: buildAssistantCandidates.supports,
              skillScores: scores.map(value => value.skillId === mainDefinition.id
                ? value
                : { ...value, valid: false }),
              characterLevel: character.level || undefined,
              evaluatePackage: candidate => evaluatePackage(candidate, character, preparedSetups),
            }))
            const existingIds = new Set(preparedSetups.flatMap(value => value.skillId ? [value.skillId] : []))
            const queue = planSynergisticSkills(mainDefinition, buildAssistantCandidates.skills, scores, preparedSetups.filter(value => !value.skillId).length, {
              ascendancyId: character.ascendancyId,
            })
              .filter(value => !existingIds.has(value.skillId))
            const populated = preparedSetups.map(value => {
              if (value.skillId) return value
              const candidate = queue.shift()
              return candidate ? {
                ...value,
                skillId: candidate.skillId,
                role: candidate.role,
                weaponSet: candidate.weaponSet,
                origin: 'recommended' as const,
                supportGemIds: [],
                synergyReason: candidate.reason,
              } : value
            })
            const populatedWithSupports = addRecommendedSupports(populated, effectiveCharacter)
            if (populatedWithSupports.some((value, index) => value !== preparedSetups[index])) {
              effectiveSetups = populatedWithSupports
              setSetups(effectiveSetups)
              result = runBuildAssistantV1({ character: effectiveCharacter, equipment, setups: effectiveSetups })
              completedAnalyzerResult=result
            }
          }
        }
        if (effectiveSetups !== setups || effectiveCharacter !== character) {
          if (effectiveSetups !== setups) setSetups(effectiveSetups)
          await new Promise<void>(resolve => window.setTimeout(resolve, 0))
        }
        const pointBudget = Math.max(1, Math.min(REAL_PASSIVE_UI_MAXIMUM_POINT_BUDGET, Math.trunc(effectiveCharacter.level) - 1 + Math.max(0, Math.trunc(effectiveCharacter.additionalPassivePoints ?? 0))))
        const passiveInput: PassiveAnalysisUiInput = {
          character: effectiveCharacter,
          equipment,
          setups: effectiveSetups,
          pointBudget,
          weaponSetPointBudget: Math.min(24, pointBudget),
          ascendancyPointBudget: effectiveCharacter.ascendancyPassivePoints ?? 0,
          planningMode: 'damage-first',
        }
        if (passiveController.getState().status === 'uninitialized') await passiveController.initialize()
        await passiveController.analyze(passiveInput)
        let passiveAwareResult = passiveController.getState().result
        if (passiveAwareResult?.realPassivePlanning) {
          let passivePlanAdjustedForResources = false
          const initialResourceRisk = summarizePostPassiveResourceRisk({
            equipment,
            setups: effectiveSetups,
            skills: buildAssistantCandidates.skills,
            supports: buildAssistantCandidates.supports,
            characterLevel: effectiveCharacter.level || undefined,
            passiveTree: officialPassiveTree,
            realPassivePlanning: passiveAwareResult.realPassivePlanning!,
          })
          // Eine zweite vollständige Baumsuche ist nur für einen harten,
          // bestätigten Ressourcenkonflikt gerechtfertigt. Weiche Risiken
          // behandelt der nachfolgende Support-Rebalancer ohne den teuren
          // Passivlauf zu wiederholen.
          if (initialResourceRisk.hardConflictSetupIds.length) {
            await passiveController.analyze({ ...passiveInput, resourcePriority: 'undercoverage' })
            const resourceAwareCandidate = passiveController.getState().result
            if (resourceAwareCandidate?.realPassivePlanning) {
              const candidateRisk = summarizePostPassiveResourceRisk({
                equipment,
                setups: effectiveSetups,
                skills: buildAssistantCandidates.skills,
                supports: buildAssistantCandidates.supports,
                characterLevel: effectiveCharacter.level || undefined,
                passiveTree: officialPassiveTree,
                realPassivePlanning: resourceAwareCandidate.realPassivePlanning,
              })
              const candidateImproves = candidateRisk.hardConflictSetupIds.length < initialResourceRisk.hardConflictSetupIds.length
                || (
                  candidateRisk.hardConflictSetupIds.length === initialResourceRisk.hardConflictSetupIds.length
                  && candidateRisk.totalPenalty < initialResourceRisk.totalPenalty
                )
              if (candidateImproves) {
                passiveAwareResult = resourceAwareCandidate
                passivePlanAdjustedForResources = true
              }
            }
          }
          const rankedSupports = effectiveSetups.flatMap(value => {
            if (!value.skillId) return []
            return runBuildAssistantV1({
              character: { ...effectiveCharacter, desiredMainSkillId: value.skillId },
              equipment,
              setups: effectiveSetups,
            }).supportAnalysis.topCandidates
          })
          const postPassiveRebalance = rebalanceSupportsAfterPassivePlanning({
            equipment,
            setups: effectiveSetups,
            skills: buildAssistantCandidates.skills,
            supports: buildAssistantCandidates.supports,
            rankedSupports,
            characterLevel: effectiveCharacter.level || undefined,
            passiveTree: officialPassiveTree,
            realPassivePlanning: passiveAwareResult.realPassivePlanning!,
          })
          setResourceRebalance({
            ...postPassiveRebalance,
            passivePlanAdjusted: passivePlanAdjustedForResources,
          })
          if (postPassiveRebalance.adjustedSetupIds.length) {
            effectiveSetups = postPassiveRebalance.setups
            setSetups(effectiveSetups)
          }
          result = runBuildAssistantV1(
            { character: effectiveCharacter, equipment, setups: effectiveSetups },
            passiveAwareResult.realPassivePlanning!,
          )
          completedAnalyzerResult=result
        }
        setAnalysis(result)
        setCalculationState('completed')
        setTimeout(() => document.querySelector('#result')?.scrollIntoView({ behavior: 'smooth' }), 0)
      } catch(error) {
        const code=error instanceof Error?error.message:'unknown-analysis-error'
        if(completedAnalyzerResult){
          setAnalysis(completedAnalyzerResult)
          setCalculationState('completed')
          setCalculationErrors([code.includes('timeout')
            ? 'Die Passivplanung hat das Zeitlimit erreicht. Die übrige Build-Auswertung wird trotzdem angezeigt; der Baumplan kann separat erneut berechnet werden.'
            : 'Die Passivplanung konnte nicht abgeschlossen werden. Die bereits berechnete Build-Auswertung wird trotzdem angezeigt.'])
          setTimeout(() => document.querySelector('#result')?.scrollIntoView({ behavior: 'smooth' }), 0)
        }else{
          setCalculationState('error')
          setCalculationErrors(['Die Build-Auswertung konnte nicht abgeschlossen werden. Bitte prüfe die Eingaben.'])
        }
      }
  }
  function resetBuild() {
    clearStoredBuild()
    setCharacter(createInitialCharacterConfiguration())
    setEquipment(initialEquipment)
    setSetups(createEmptySkillSetups())
    setPassivePlan({ results: { shared: null, 'set-1': null, 'set-2': null, ascendancy: null }, status: 'uninitialized' })
    invalidateResult()
    setSaveStatus('Build zurückgesetzt')
  }
  function recommendSupports(setupId: string) {
    const setup = setups.find(value => value.id === setupId)
    if (!setup?.skillId || !character.classId) return
    const preparedSetup = prepareMetaSetup(setup, setups)
    const preparedSetups = setups.map(value => value.id === setupId ? preparedSetup : value)
    const result = runBuildAssistantV1({ character: { ...character, desiredMainSkillId: setup.skillId }, equipment, setups: preparedSetups })
    const rankedSupports = result.supportAnalysis.topCandidates.length
      ? result.supportAnalysis.topCandidates
      : result.supportAnalysis.eligibleCandidates
    const filled = fillRecommendedSupportSlots(
      preparedSetup,
      rankedSupports,
      buildAssistantCandidates.supports,
      supportCapacityFor(preparedSetup),
      {
        equipment,
        setups: preparedSetups,
        skills: buildAssistantCandidates.skills,
        characterLevel: character.level || undefined,
      },
      false,
    )
    setSetups(setups.map(value => value.id === setupId ? filled : value))
    invalidateResult()
    if(filled.supportGemIds.length===setup.supportGemIds.length){
      setCalculationErrors([`Für ${buildAssistantCandidates.skills.find(value=>value.id===setup.skillId)?.displayNameDe??'diese Fertigkeit'} wurde kein belegter kompatibler Support gefunden.`])
    }else{
      setCalculationErrors([])
    }
  }
  return <>
    <header>
      <p className="eyebrow">Equipment-first · Build-Assistent V1</p>
      <h1>PoE2 Build-Assistent</h1>
      <p>Wähle Charakter, Ausrüstung, Hauptangriff und Zielprofil. Die vorhandenen Analyzer verbinden diese Eingaben zu einem nachvollziehbaren deutschen Build-Vorschlag.</p>
    </header>
    <main>
      <section className="build-storage"><div><b>Lokaler Buildspeicher</b><p className="muted">{saveStatus}. Die Daten bleiben ausschließlich in diesem Browser.</p></div><div className="row"><button className="secondary" onClick={() => { saveStoredBuild({ character, equipment, setups }); setSaveStatus('Manuell gespeichert') }}>Jetzt speichern</button><button className="danger" onClick={resetBuild}>Alles zurücksetzen</button></div></section>
      <CharacterSection value={character} onChange={value => { setCharacter(value); invalidateResult() }}/>
      <EquipmentSection entries={equipment} setEntries={value => { setEquipment(value); invalidateResult() }} suggestions={equipmentSuggestions}/>
      <SkillsSection setups={setups} onChange={value => { setSetups(value); const selectedMain = value.find(setup => setup.role === 'main' && setup.skillId); setCharacter(current => ({ ...current, desiredMainSkillId: selectedMain?.skillId || undefined })); invalidateResult() }} onRecommendSupports={recommendSupports}/>
      <PassiveTree characterClassId={character.classId} characterAscendancyId={character.ascendancyId} planResults={passivePlan.results} planStatus={passivePlan.status} planVisible={planVisible} focusPlanRequest={focusPlanRequest}/>
      <RealPassiveAnalysis character={character} equipment={equipment} setups={setups} controller={passiveController} onPlanPresentation={receivePassivePlan} planVisible={planVisible} onTogglePlan={() => setPlanVisible(value => !value)} onShowPlan={showPassivePlan} onBuildAnalyze={calculate}/>
      <section className="calculate">
        <h2>7. Build auswerten</h2>
        <p>Leere optionale Ausrüstungsslots sind erlaubt. Sie senken lediglich die Sicherheit der Empfehlung.</p>
        {calculationErrors.length > 0 && <div className="analysis-error" role="alert">{calculationErrors.map(error => <p key={error}>{error}</p>)}</div>}
        <button className="calculate-btn" disabled={calculationState === 'running'} onClick={calculate}>{calculationState === 'running' ? 'Berechnung läuft …' : 'Build-Vorschlag erstellen'}</button>
        <p className="calculation-status" aria-live="polite">{calculationState === 'completed' ? 'Ergebnis vorhanden' : calculationState === 'error' ? 'Fehler bei der Berechnung' : calculationState === 'running' ? 'Analyzer werden ausgeführt' : 'Bereit zur Auswertung'}</p>
      </section>
      {analysis && <BuildAssistantResultSection analysis={analysis} equipment={equipment} passivePlan={passivePlan} variantOptimization={variantOptimization} resourceRebalance={resourceRebalance} onShowPassivePlan={showPassivePlan}/>}
    </main>
    <footer>Lokale, deterministische Build-Auswertung · Keine Runtime-Verbindung zu externen Datenquellen</footer>
  </>
}
