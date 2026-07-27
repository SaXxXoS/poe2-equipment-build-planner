import type { BuildAnalysis, Confidence, ConstraintViolation, RotationPlan } from '../engine'
import type { EquipmentEntry } from '../domain'
import { equipmentSlotDefinitions, jewelDefinitions, clusterJewelDefinitions, uniqueClusterJewelDefinitions, passiveNodeDefinitions, skillDefinitions, supportDefinitions } from '../data'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { buildAssistantCandidates } from '../features/build-assistant-v1'
import type { PassivePlanPresentation } from '../features/real-passive-analysis'
import { technicalAffixById } from '../affixes/registry'
import { affixDisplayName } from '../features/equipment-editor/affix-display'
import type { BuildVariantOptimization } from '../features/skills/build-variant-optimizer'

const confidenceText: Record<Confidence, string> = { high: 'Hohe Sicherheit', medium: 'Mittlere Sicherheit', low: 'Niedrige Sicherheit' }
const goalText = { balanced: 'Allround', mapping: 'Mapping', boss: 'Boss' }
const damageText: Record<string, string> = { physical: 'Physischer Schaden', fire: 'Feuerschaden', cold: 'Kälteschaden', lightning: 'Blitzschaden', chaos: 'Chaosschaden' }
const mechanicText: Record<string, string> = { attack: 'Angriff', spell: 'Zauber', projectile: 'Projektil', melee: 'Nahkampf', area: 'Fläche', critical: 'Kritisch', 'damage-over-time': 'Schaden über Zeit', minion: 'Begleiter', movement: 'Bewegung', buff: 'Stärkung', debuff: 'Schwächung' }
const verdictText: Record<string, string> = { 'clear-upgrade': 'Klare Verbesserung', 'situational-upgrade': 'Situative Verbesserung', sidegrade: 'Seitentausch', downgrade: 'Voraussichtlich schwächer', unknown: 'Unbekannt' }
const definitionName = (id: string) => {
  const resolvedId = id.startsWith('candidate:') ? id.slice('candidate:'.length) : id
  return [...buildAssistantCandidates.skills, ...buildAssistantCandidates.supports, ...buildAssistantCandidates.jewels, ...skillDefinitions, ...supportDefinitions, ...passiveNodeDefinitions, ...jewelDefinitions, ...clusterJewelDefinitions, ...uniqueClusterJewelDefinitions].find(item => item.id === resolvedId)?.displayNameDe ?? 'Unbekannte Empfehlung'
}
const uniqueById = new Map(localizedPob2UniquesDe.map(item => [item.id, item]))
const uniqueCandidateById = new Map(buildAssistantCandidates.uniques.map(item => [item.id, item]))
const evidenceText: Record<string, string> = {
  'structured-exact': 'Direkt aus strukturierten Daten',
  'structured-derived': 'Sicher aus strukturierten Daten abgeleitet',
  'text-pattern-exact': 'Aus eindeutigem Beschreibungsmuster abgeleitet',
  'text-pattern-ambiguous': 'Datenlage eingeschränkt',
  unresolved: 'Semantik nicht verfügbar',
}
const formatDamage=(value:number|undefined)=>value==null?'Nicht verfügbar':new Intl.NumberFormat('de-DE',{maximumFractionDigits:2}).format(value)
const issueText = (issue: ConstraintViolation) => {
  const known: Record<string, string> = {
    'skill-wrong-weapon': 'Die gewählte Fertigkeit passt nicht zur erkannten Waffenart.',
    'skill-attack-in-spell-only-profile': 'Der Angriff passt nicht zum überwiegend zauberbasierten Ausrüstungsprofil.',
    'skill-spell-in-attack-only-profile': 'Der Zauber passt nicht zum überwiegend angriffsbasierten Ausrüstungsprofil.',
    'low-profile-clarity': 'Die Ausrüstung liefert noch kein klares Profil.',
    'equipment-conflict': 'Ausrüstungsschwerpunkte stehen teilweise im Konflikt.',
    'level-requirement': 'Die Levelanforderung ist noch nicht erfüllt.',
    'synthetic-attribute-deficit': 'Mindestens eine Attributanforderung ist noch nicht ausreichend gedeckt.',
    redundant: 'Dieser Wert überschneidet sich mit einer anderen Empfehlung.',
    'required-skill-tag-missing': 'Dem Hauptangriff fehlt die erforderliche Mechanik.',
    'required-mechanic-missing': 'Die benötigte Mechanik ist nicht vorhanden.',
  }
  return known[issue.code] ?? `Technischer Hinweis: ${issue.code}`
}
const topConfidence = (analysis: BuildAnalysis): Confidence => {
  const values = [analysis.equipmentAnalysis.score.confidence, analysis.skillAnalysis.topMainCandidates[0]?.confidence, analysis.supportAnalysis.topCandidates[0]?.confidence].filter(Boolean)
  return values.includes('low') ? 'low' : values.includes('medium') ? 'medium' : 'high'
}
const uniqueRecommendations = (analysis: BuildAnalysis) => {
  const source = analysis.uniqueAnalysis.eligibleCandidates.filter(item =>
    item.matchedProfileFields.length > 0 || item.matchedSkillTags.length > 0 || item.equipmentSynergyScore > 0 || item.buildEnabler,
  )
  const seen = new Set<string>()
  return source.filter(item => !seen.has(item.itemSlot) && seen.add(item.itemSlot)).slice(0, 5)
}
function Rotation({ plan }: { plan: RotationPlan }) {
  if (!plan.steps.length || plan.missingRoles.includes('main-damage')) return <p>Noch nicht vollständig verfügbar: Es fehlt eine belastbare Hauptschadensfolge.</p>
  const timingLabel = (step: RotationPlan['steps'][number]) => {
    const timing = step.timing
    if (!timing) return ''
    const values = [
      timing.activationTimeMs ? `Aktivierung ${timing.activationTimeMs / 1000} s` : '',
      timing.effectDurationMs ? `Wirkzeit ${timing.effectDurationMs / 1000} s` : '',
      timing.cooldownMs ? `Abklingzeit ${timing.cooldownMs / 1000} s` : '',
      timing.triggerIntervalMs ? `Triggerintervall ${timing.triggerIntervalMs / 1000} s` : '',
    ].filter(Boolean)
    return values.length ? `${values.join(' · ')}. ${timing.detail}` : timing.detail
  }
  return <ol>{plan.steps.map(step => <li key={step.stepId}><b>{step.actionType === 'switch-weapon-set' ? `Zu ${step.nextWeaponSet === 'set-2' ? 'Waffenset 2' : 'Waffenset 1'} wechseln` : step.skillId ? definitionName(step.skillId) : 'Nächsten Schritt ausführen'}</b><br/><span>{step.weaponSet === 'set-1' ? 'Waffenset 1' : step.weaponSet === 'set-2' ? 'Waffenset 2' : 'Beide Waffensets'} · {confidenceText[step.confidence]}</span>{timingLabel(step) ? <><br/><small>{timingLabel(step)}</small></> : null}</li>)}</ol>
}
function RecommendationList({ values, name }: { values: Array<{ targetId: string; totalScore: number; confidence: Confidence; reasons: Array<{ code: string }>; violations: ConstraintViolation[] }>; name: (id: string) => string }) {
  return values.length ? <ol>{values.slice(0, 5).map(value => <li key={value.targetId}><b>{name(value.targetId)}</b> · Rangwert {value.totalScore} · {confidenceText[value.confidence]}<br/><span>{value.reasons.length ? `${value.reasons.length} belegte Bewertungssignale` : 'Nutzen derzeit nur eingeschränkt bestimmbar'}{value.violations.length ? ` · ${value.violations.map(issueText).join(' ')}` : ''}</span></li>)}</ol> : <p>Keine geeignete Empfehlung verfügbar.</p>
}

function ProfileRecommendations({ title, supports, passives, jewels, uniques }: {
  title: string
  supports: BuildAnalysis['supportRecommendations']
  passives: BuildAnalysis['passiveRecommendations']
  jewels: BuildAnalysis['jewelRecommendations']
  uniques: BuildAnalysis['uniqueRecommendations']
}) {
  return <div className="profile-recommendations"><h4>{title}</h4>
    <p><b>Supports:</b> {supports.slice(0, 3).map(value => definitionName(value.supportId)).join(', ') || 'Keine belegte Abweichung verfügbar'}</p>
    <p><b>Passive:</b> {passives.slice(0, 3).map(value => definitionName(value.targetId)).join(', ') || 'Keine belegte Abweichung verfügbar'}</p>
    <p><b>Juwelen:</b> {jewels.slice(0, 3).map(value => definitionName(value.jewelId)).join(', ') || 'Keine belegte Abweichung verfügbar'}</p>
    <p><b>Uniques:</b> {uniques.slice(0, 3).map(value => uniqueById.get(value.uniqueId)?.name ?? value.uniqueId).join(', ') || 'Keine belegte Abweichung verfügbar'}</p>
  </div>
}

export function BuildAssistantResultSection({ analysis, equipment, passivePlan, variantOptimization, onShowPassivePlan }: {
  analysis: BuildAnalysis
  equipment: EquipmentEntry[]
  passivePlan?: PassivePlanPresentation
  variantOptimization?: BuildVariantOptimization | null
  onShowPassivePlan?: () => void
}) {
  const desiredSkillId = analysis.supportAnalysis.allCandidates[0]?.skillId ?? analysis.skillAnalysis.topMainCandidates[0]?.skillId
  const desiredSkill = analysis.skillRecommendations.find(item => item.skillId === desiredSkillId)
  const emptySlots = equipment.filter(item => !item.uniqueItemId && !item.itemClassId && item.modifierValues.length === 0)
  const equippedUniques = equipment.flatMap(item => item.uniqueItemId ? [{ entry: item, unique: uniqueById.get(item.uniqueItemId) }] : [])
  const uniques = uniqueRecommendations(analysis)
  const confidence = topConfidence(analysis)
  const strongestField = <T extends string>(values: Record<T, number>) =>
    (Object.entries(values) as [T, number][]).filter(([, value]) => value > 0).sort(([a, av], [b, bv]) => bv - av || a.localeCompare(b))[0]?.[0]
  const selectedSkillDefinition = buildAssistantCandidates.skills.find(item => item.id === desiredSkill?.skillId)
  const selectedDamageTypes = selectedSkillDefinition?.damageTypes ?? []
  const dominantDamage = selectedDamageTypes
    .slice()
    .sort((a, b) => analysis.buildProfile.damageTypes[b] - analysis.buildProfile.damageTypes[a] || a.localeCompare(b))[0]
    ?? analysis.equipmentAnalysis.dominantDamageType
    ?? strongestField(analysis.buildProfile.damageTypes)
  const dominantMechanic = analysis.equipmentAnalysis.dominantMechanic ?? strongestField(analysis.buildProfile.mechanics)
  const scalingAdvice = analysis.effectModel?.scalingAdvice ?? []
  const appliedAffixes = equipment.flatMap(entry => entry.modifierValues)
  const weakIds = new Set([...analysis.equipmentAnalysis.weaklyUsedModifierIds, ...analysis.equipmentAnalysis.unusedModifierIds])
  const conflictIds = new Set(analysis.equipmentAnalysis.conflictingModifierIds)
  const affixLabel = (id: string) => {
    const value = appliedAffixes.find(item => item.modifierId === id)
    const affix = technicalAffixById.get(id)
    return `${affix ? affixDisplayName(affix) : definitionName(id)}${value ? ` (${value.statValues?.map(item => item.value).join(' / ') ?? String(value.value)})` : ''}`
  }
  const strongAffixes = [...new Set(appliedAffixes.map(value => value.modifierId).filter(id => !weakIds.has(id) && !conflictIds.has(id)))].slice(0, 8)
  const partialAffixes = [...new Set(appliedAffixes.map(value => value.modifierId).filter(id => weakIds.has(id)))].slice(0, 8)
  const unsuitableAffixes = [...new Set(appliedAffixes.map(value => value.modifierId).filter(id => conflictIds.has(id)))].slice(0, 8)
  const fitCategory = !desiredSkill?.valid ? 'Schwach passend' : analysis.equipmentAnalysis.profileClarity >= 70 && confidence !== 'low' ? 'Sehr passend' : analysis.equipmentAnalysis.profileClarity >= 45 ? 'Gut passend' : 'Bedingt passend'
  const nextSteps = [
    ...(desiredSkill && !desiredSkill.valid ? ['Waffen- oder Skillkonflikt zuerst beheben.'] : []),
    ...(analysis.equipmentAnalysis.conflictingModifierIds.length ? ['Konfliktierende Affixe überprüfen.'] : []),
    ...(analysis.buildProfile.defence.resistanceNeed > 0 ? ['Widerstände als defensive Grundlage priorisieren.'] : []),
    ...(analysis.buildProfile.defence.generalDefenceNeed > 0 ? ['Mindestens eine belastbare Verteidigungsschicht ergänzen.'] : []),
    ...(analysis.supportAnalysis.topCandidates[0] ? [`${definitionName(analysis.supportAnalysis.topCandidates[0].supportId)} als nächsten Support testen.`] : []),
    ...(analysis.passiveAnalysis.topPathEfficiencyCandidates[0] ? [`${definitionName(analysis.passiveAnalysis.topPathEfficiencyCandidates[0].targetId)} als nächsten passiven Schwerpunkt prüfen.`] : []),
    ...(uniques[0] ? [`${uniqueById.get(uniques[0].uniqueId)?.name ?? 'Empfohlenes Unique'} im passenden Slot vergleichen.`] : []),
    ...(emptySlots.length ? [`${emptySlots.length} leere Ausrüstungsslots schrittweise ergänzen.`] : []),
  ].slice(0, 5)
  return <section id="result" className="result build-assistant-result">
    <div className="placeholder">BUILD-ASSISTENT V1 · ECHTE ANALYZER-AUSWERTUNG</div>
    <h2>Build-Vorschlag</h2>
    <article className="build-summary"><h3>Zusammenfassung · Build-Eignung: {fitCategory}</h3><p className="muted">Die Eignung bewertet die fachliche Passung. Der getrennte Schadenswert darunter zeigt nur den aktuell sicher berechenbaren Trefferschaden.</p><dl className="summary-grid">
      <div><dt>Zielprofil</dt><dd>{goalText[analysis.buildProfile.goals.mappingWeight > analysis.buildProfile.goals.bossWeight ? 'mapping' : analysis.buildProfile.goals.bossWeight > analysis.buildProfile.goals.mappingWeight ? 'boss' : 'balanced']}</dd></div>
      <div><dt>Hauptschaden</dt><dd>{dominantDamage ? damageText[dominantDamage] : 'Unbekannt'}</dd></div>
      <div><dt>Mechanik</dt><dd>{dominantMechanic ? mechanicText[dominantMechanic] : 'Unbekannt'}</dd></div>
      <div><dt>Sicherheit</dt><dd>{confidenceText[confidence]}</dd></div>
      <div><dt>Stärke</dt><dd>{dominantDamage ? `Klarster Schwerpunkt: ${damageText[dominantDamage]}` : 'Noch kein klarer Schwerpunkt'}</dd></div>
      <div><dt>Schwäche</dt><dd>{emptySlots.length ? `${emptySlots.length} leere Slots begrenzen die Aussagekraft` : analysis.warnings.length ? `${analysis.warnings.length} Konflikte oder Warnungen` : 'Keine deutliche Schwäche erkannt'}</dd></div>
    </dl></article>
    <details open><summary>Optimierte Waffen- und Fertigkeitskombination</summary><div className="result-panel">
      {variantOptimization?.selected ? <>
        <h3>Beste belegte Kombination im lokalen Datenbestand</h3>
        <dl className="summary-grid">
          <div><dt>Hauptfertigkeit</dt><dd>{definitionName(variantOptimization.selected.skillId)}</dd></div>
          <div><dt>Waffe</dt><dd>{variantOptimization.selected.weaponLabel}</dd></div>
          <div><dt>Haupt-Waffenset</dt><dd>{variantOptimization.selected.mainWeaponSet === 'set-1' ? 'Waffenset 1' : 'Waffenset 2'}</dd></div>
          <div><dt>Set-2-Setup</dt><dd>{variantOptimization.selected.setupSkillId ? definitionName(variantOptimization.selected.setupSkillId) : 'Keine belegte Ergänzung'}</dd></div>
        </dl>
        <p>{variantOptimization.equipmentFirst ? 'Vorhandene Waffen wurden zuerst berücksichtigt.' : 'Ohne Ausrüstung wurde die fachlich passendste belegte Waffenart mitgeprüft.'} Geprüft: {variantOptimization.evaluatedSkillCount} Hauptfertigkeiten und {variantOptimization.evaluatedCombinationCount} kompatible Skill-Waffen-Kombinationen.</p>
        <ul>{variantOptimization.selected.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
        {variantOptimization.alternatives.length > 0 && <><h4>Belegte Alternativen</h4><ol>{variantOptimization.alternatives.slice(0, 3).map(candidate => <li key={`${candidate.skillId}-${candidate.weaponType}`}><b>{definitionName(candidate.skillId)}</b> mit {candidate.weaponLabel} · Variantenwert {candidate.totalScore}</li>)}</ol></>}
        <p className="muted">Die Auswahl ist eine deterministische Optimierung aus vorhandenen Skill-, Waffen-, Support-, Aszendenz- und Tree-Signalen. Sie behauptet keine vollständige Path-of-Building-DPS-Simulation; der tatsächlich berechnete Passive-Pfad bleibt die abschließende Pfadprüfung.</p>
      </> : <p>Keine vollständig kompatible und belegte Skill-Waffen-Kombination gefunden. Unbekannte Zusammenhänge wurden nicht erfunden.</p>}
    </div></details>
    <details open><summary>Schaden und Build-Vergleich</summary><div className="result-panel damage-estimate">
      {analysis.damageEstimate?.status==='unavailable'?<><h3>Numerischer Schaden: nicht verfügbar</h3><p>{analysis.damageEstimate.warnings.join(' ')}</p></>:<>
        <h3>Berechenbarer Trefferschaden · {analysis.damageEstimate?.skillName??'Hauptfertigkeit'}</h3>
        <dl className="summary-grid">
          <div><dt>Schaden pro Treffer</dt><dd>{formatDamage(analysis.damageEstimate?.hitDamage?.minimum)}–{formatDamage(analysis.damageEstimate?.hitDamage?.maximum)}</dd></div>
          <div><dt>Ø pro Treffer</dt><dd>{formatDamage(analysis.damageEstimate?.hitDamage?.average)}</dd></div>
          <div><dt>Aktionen pro Sekunde</dt><dd>{formatDamage(analysis.damageEstimate?.actionsPerSecond)}</dd></div>
          <div><dt>Trefferschaden pro Sekunde</dt><dd>{formatDamage(analysis.damageEstimate?.hitDamagePerSecond)}</dd></div>
          {analysis.damageEstimate?.expectedCriticalHitDamagePerSecond != null && <div><dt>Erwartungswert mit kritischen Treffern</dt><dd>{formatDamage(analysis.damageEstimate.expectedCriticalHitDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.criticalChance && <div><dt>Kritische Trefferchance</dt><dd>{formatDamage(analysis.damageEstimate.criticalChance.effective)} %</dd></div>}
          {analysis.damageEstimate?.criticalDamageBonus != null && <div><dt>Gesamter kritischer Schadensbonus</dt><dd>+{formatDamage(analysis.damageEstimate.criticalDamageBonus)} %</dd></div>}
          {analysis.damageEstimate?.expectedDamagePerSecondAfterMitigation != null && <div><dt>Nach Gegnerabwehr</dt><dd>{formatDamage(analysis.damageEstimate.expectedDamagePerSecondAfterMitigation)}</dd></div>}
          {analysis.damageEstimate?.activeWindowDamagePerSecond != null && <div><dt>Im belegten Bufffenster</dt><dd>{formatDamage(analysis.damageEstimate.activeWindowDamagePerSecondAfterMitigation??analysis.damageEstimate.activeWindowDamagePerSecond)}</dd></div>}
        </dl>
        {analysis.damageEstimate?.temporalOffensiveEffects?.some(effect=>effect.status==='active-window')?<div><b>Zeitabhängig angewandte Offensivwirkungen:</b><ul>{analysis.damageEstimate.temporalOffensiveEffects.filter(effect=>effect.status==='active-window').map(effect=><li key={`${effect.sourceId}:${effect.kind}`}>{effect.label}: {effect.percent} % · {effect.durationMs?`${(effect.durationMs/1000).toLocaleString('de-DE')} s Wirkfenster`:effect.detail}{effect.activationTimeMs?` · ${(effect.activationTimeMs/1000).toLocaleString('de-DE')} s Aktivierung`:''}</li>)}</ul><p className="muted">Dieser Wert gilt nur während des belegten Wirkfensters und ersetzt nicht den dauerhaften Vergleichswert.</p></div>:null}
        {analysis.damageEstimate?.temporalOffensiveEffects?.some(effect=>effect.status==='blocked')?<div><b>Nicht numerisch angewandte zeitabhängige Wirkungen:</b><ul>{analysis.damageEstimate.temporalOffensiveEffects.filter(effect=>effect.status==='blocked').map(effect=><li key={`${effect.sourceId}:${effect.kind}`}>{effect.label}: {effect.detail}</li>)}</ul></div>:null}
        {analysis.damageEstimate?.chargeState?<div><b>Ladungszustand:</b><ul>{analysis.damageEstimate.chargeState.states.map(state=><li key={state.type}>{state.label}: {state.availability==='available-window'?(state.count==null?'verfügbar':`${state.count} verfügbar`):state.availability==='conditional-unresolved'?'nur bedingt belegt':'nicht belegt'} · {state.detail}</li>)}</ul>{analysis.damageEstimate.chargeState.consumptions.length?<><b>Ladungsverbrauch:</b><ul>{analysis.damageEstimate.chargeState.consumptions.map(value=><li key={value.sourceId}>{value.label}: {value.detail}</li>)}</ul></>:null}<p className="muted">Nicht vollständig belegte Ladungszustände erzeugen keinen Schadensbonus.</p></div>:null}
        {analysis.damageEstimate?.enemyProfile ? <><p><b>Vergleichsgegner:</b> {analysis.damageEstimate.enemyProfile.label}. Das Profil wird automatisch aus dem Zielprofil gewählt.</p>{analysis.damageEstimate.enemyProfile.appliedEffects?.length?<div><b>Automatisch berücksichtigte Gegnerwirkungen:</b><ul>{analysis.damageEstimate.enemyProfile.appliedEffects.map(effect=><li key={`${effect.source}:${effect.sourceId}:${effect.kind}`}>{effect.label}: {effect.effectiveValue??effect.value}{effect.kind==='armour-break'?' Rüstung':' %'} · {effect.state==='permanent'?'dauerhaft':effect.state==='fully-active'?'voll aktiv':effect.state==='building'?'wird aufgebaut':'während der Anwendung'}{effect.durationMs?` · ${(effect.durationMs/1000).toLocaleString('de-DE')} s`:''}{effect.applicationRatePerSecond?` · ${effect.applicationRatePerSecond.toLocaleString('de-DE',{maximumFractionDigits:2})} Treffer/s`:''}{effect.timeToFullEffectMs?` · voll nach ${(effect.timeToFullEffectMs/1000).toLocaleString('de-DE',{maximumFractionDigits:2})} s`:''}{effect.uptimeStatus==='maintainable'?' · bei fortgesetzten Treffern aufrechterhaltbar':effect.uptimeStatus==='windowed'?' · zeitlich begrenztes Wirkfenster':effect.uptimeStatus==='unresolved'?' · Uptime nicht belegt':''}</li>)}</ul>{analysis.damageEstimate.enemyProfile.hitsToFullyBreakArmour?<p><b>Vollständig gebrochene Rüstung:</b> nach {analysis.damageEstimate.enemyProfile.hitsToFullyBreakArmour} belegten Treffern{analysis.damageEstimate.enemyProfile.timeToFullyBreakArmourMs?` beziehungsweise ${(analysis.damageEstimate.enemyProfile.timeToFullyBreakArmourMs/1000).toLocaleString('de-DE',{maximumFractionDigits:2})} Sekunden`:''}.</p>:null}</div>:null}{analysis.damageEstimate.enemyProfile.limitations?.length?<p className="warning"><b>Grenzen:</b> {analysis.damageEstimate.enemyProfile.limitations.join(' ')}</p>:null}</> : <p><b>Vergleichsgegner:</b> Nicht festgelegt; deshalb wird vor Gegnerabwehr gerechnet.</p>}
        {analysis.damageEstimate?.stages?.length ? <><h4>Nachvollziehbare Rechenschritte</h4><ol>{analysis.damageEstimate.stages.map(stage => <li key={stage.id}><b>{stage.label}</b>{stage.value != null ? `: ${formatDamage(stage.value)}` : stage.components.length ? `: ${stage.components.map(value => `${damageText[value.type]} ${formatDamage(value.minimum)}–${formatDamage(value.maximum)}`).join(', ')}` : ''}</li>)}</ol></> : null}
        {analysis.damageEstimate?.appliedDamageEffects?.length ? <p><b>Numerisch angewandte Schadenswerte:</b> {analysis.damageEstimate.appliedDamageEffects.map(value => `${value.value} % (${value.source === 'equipment' ? 'Ausrüstung' : value.source === 'ascendancy' ? 'Aszendenz' : 'Passivbaum'})`).join(', ')}</p> : null}
        {analysis.damageEstimate?.appliedSpeedEffects?.length ? <p><b>Numerisch angewandte Geschwindigkeit:</b> {analysis.damageEstimate.appliedSpeedEffects.map(value => `${value.value} % (${value.source === 'equipment' ? 'Ausrüstung' : value.source === 'ascendancy' ? 'Aszendenz' : 'Passivbaum'})`).join(', ')}</p> : null}
        {analysis.damageEstimate?.appliedSupportEffects?.length ? <p><b>Numerisch angewandte Supports:</b> {analysis.damageEstimate.appliedSupportEffects.map(value => `${value.label}: ${value.value} %`).join(', ')}</p> : <p><b>Numerische Supportwirkung:</b> Für die gewählten Supports ist noch kein strukturierter Effektwert freigegeben.</p>}
        {analysis.damageEstimate?.confirmedConversions?.length ? <p><b>Bestätigte Umwandlungen:</b> {analysis.damageEstimate.confirmedConversions.map(value => `${value.percent} % ${damageText[value.from]} → ${damageText[value.to]}`).join(', ')}</p> : <p><b>Schadensumwandlung:</b> Keine numerisch bestätigte Umwandlung angewandt.</p>}
        <p><b>Enthalten:</b> {analysis.damageEstimate?.included.join(', ')}</p>
        <p><b>Noch nicht enthalten:</b> {analysis.damageEstimate?.excluded.join(', ')}</p>
        <p className="warning">{analysis.damageEstimate?.warnings.join(' ')}</p>
      </>}
      <p className="muted">Vergleiche zwei Builds nur, wenn bei beiden dieselbe Fertigkeit, Gemmenstufe und dieselben ausgeschlossenen Mechaniken gelten. Der Wert ist keine vollständige Path-of-Building-DPS.</p>
    </div></details>
    <details open><summary>Affixskalierung</summary><div className="result-panel"><div className="affix-scaling-grid"><div><h4>Stark passend</h4>{strongAffixes.length ? <ul>{strongAffixes.map(id => <li key={id}>{affixLabel(id)}</li>)}</ul> : <p>Keine starke, belegte Skalierung erkannt.</p>}</div><div><h4>Teilweise hilfreich</h4>{partialAffixes.length ? <ul>{partialAffixes.map(id => <li key={id}>{affixLabel(id)}</li>)}</ul> : <p>Keine teilweise genutzten Affixe.</p>}</div><div><h4>Konflikte oder unpassend</h4>{unsuitableAffixes.length ? <ul>{unsuitableAffixes.map(id => <li key={id}>{affixLabel(id)}</li>)}</ul> : <p>Keine eindeutigen Affixkonflikte erkannt.</p>}</div></div><p><b>Fehlende Grundlage:</b> {analysis.buildProfile.defence.resistanceNeed > 0 ? 'Widerstände ' : ''}{analysis.buildProfile.defence.generalDefenceNeed > 0 ? 'Leben oder eine belastbare Verteidigungsschicht' : 'Keine eindeutige defensive Lücke'}</p></div></details>
    <details open><summary>Beste Schadensskalierungen</summary><div className="result-panel">{scalingAdvice.length ? <ul>{scalingAdvice.map(value => <li key={value}>{value}</li>)}</ul> : <p>Für die gewählte Fertigkeit sind noch keine belastbaren Schadensskalierungen verfügbar.</p>}<p><b>Wirkungsmodell:</b> {analysis.effectModel?.offenceEffects.filter(value => value.productive).length ?? 0} offensive, {analysis.effectModel?.defenceEffects.filter(value => value.productive).length ?? 0} defensive und {analysis.effectModel?.unresolvedEffects.length ?? 0} ungelöste Wirkungen.</p>{analysis.effectModel?.warnings.length ? <ul className="warning-list">{analysis.effectModel.warnings.map(value => <li key={value}>{value}</li>)}</ul> : null}<p className="muted">Diese Hinweise stammen aus der gemeinsamen Wirkungskette für Ausrüstung, Fertigkeiten, Supports, Passive, Waffensets und Aszendenz. Defensive Werte erzeugen keinen offensiven Bonus; unbekannte Zusammenhänge erzeugen keinen Bonus.</p></div></details>
    <details open><summary>Ausrüstung</summary><div className="result-panel"><p>{equipment.length - emptySlots.length} von {equipment.length} Slots enthalten Daten. {emptySlots.length ? 'Die Analyse bleibt möglich, besitzt aber geringere Sicherheit.' : 'Alle Slots wurden erfasst.'}</p>
      {equippedUniques.length > 0 && <><h4>Ausgerüstete Uniques</h4><ul>{equippedUniques.map(({ entry, unique }) => <li key={entry.id}>{unique?.name ?? entry.uniqueItemId} · {equipmentSlotDefinitions.find(slot => slot.id === entry.slotId)?.displayNameDe ?? entry.slotId}{entry.uniqueVariantId ? ` · Variante ${entry.uniqueVariantId}` : ''}</li>)}</ul></>}
      <p><b>Waffensets:</b> {analysis.equipmentAnalysis.dominantWeaponSet === 'balanced' ? 'Beide Sets sind ähnlich gewichtet.' : `${analysis.equipmentAnalysis.dominantWeaponSet === 'set-1' ? 'Set 1' : 'Set 2'} ist stärker ausgeprägt.`}</p>
      {analysis.warnings.length ? <ul className="warning-list">{analysis.warnings.slice(0, 8).map((warning, index) => <li key={`${warning.code}-${index}`}>{issueText(warning)}</li>)}</ul> : <p>Keine blockierenden Ausrüstungskonflikte erkannt.</p>}
    </div></details>
    <details open><summary>Hauptangriff und Supports</summary><div className="result-panel"><h3>{desiredSkill ? definitionName(desiredSkill.skillId) : 'Hauptangriff nicht verfügbar'}</h3>{desiredSkill && <p>Rangwert {desiredSkill.totalScore} · {confidenceText[desiredSkill.confidence]} · {desiredSkill.valid ? 'Kompatibel' : 'Nicht kompatibel'}</p>}
      <h4>Empfohlene Supports</h4><RecommendationList values={analysis.supportAnalysis.topCandidates} name={definitionName}/>
      <h4>Ausgeschlossene Supports</h4>{analysis.supportAnalysis.blockedCandidates.length ? <ul>{analysis.supportAnalysis.blockedCandidates.slice(0, 4).map(item => <li key={item.supportId}>{definitionName(item.supportId)}: {item.violations.map(issueText).join(' ') || 'Nicht kompatibel'}</li>)}</ul> : <p>Keine Supports durch harte Regeln ausgeschlossen.</p>}
    </div></details>
    <details open><summary>Passive Schwerpunkte und konkrete Pfade</summary><div className="result-panel"><RecommendationList values={analysis.passiveAnalysis.eligibleCandidates} name={definitionName}/>{analysis.passiveAnalysis.topKeystoneCandidates.length ? <p><b>Keystone-Hinweis:</b> Nachteile vor Auswahl prüfen; Trade-offs bleiben sichtbar.</p> : <p>Kein belastbarer Keystone-Vorschlag verfügbar.</p>}
      {passivePlan?.results.shared?.plan ? <div className="concrete-passive-plan"><h4>Berechneter Passive-Pfad</h4><p>{passivePlan.status === 'stale' ? 'Der Pfad gehört zu älteren Eingaben und muss neu berechnet werden.' : `${passivePlan.results.shared.usedPointBudget} von ${passivePlan.results.shared.pointBudget} Punkten verwendet · ${passivePlan.results.shared.allocatedNodeIds.length} Knoten im gemeinsamen Pfad.`}</p><ol>{passivePlan.results.shared.plan.selectedTargets.slice(0, 8).map((target, index) => <li key={target.nodeId}><b>{index + 1}. {target.displayName || target.nodeId}</b> · {target.incrementalPointCost} Punkte · {target.pathNodeIds.length} Pfadknoten · {confidenceText[target.confidence]}</li>)}</ol>{onShowPassivePlan && <button className="secondary" onClick={onShowPassivePlan}>Alle Pfade im Baum anzeigen</button>}</div> : <p>Konkreter Pfad noch nicht berechnet. Die vorhandene Passive-Analyse in Abschnitt 6 kann ihn mit Punktbudget und Klassenstart erzeugen.</p>}
    </div></details>
    <details><summary>Juwelen und Cluster</summary><div className="result-panel"><RecommendationList values={[...analysis.jewelAnalysis.topNormalJewels, ...analysis.jewelAnalysis.topClusterJewels, ...analysis.jewelAnalysis.topUniqueClusterJewels]} name={definitionName}/></div></details>
    <details open><summary>Passende Uniques</summary><div className="result-panel">{uniques.length ? <ol>{uniques.map(item => { const unique = uniqueById.get(item.uniqueId), candidate = uniqueCandidateById.get(item.uniqueId); return <li key={item.uniqueId}><b>{unique?.name ?? item.uniqueId}</b> · {unique?.baseDisplayName ?? item.itemSlot} · {verdictText[item.replacementVerdict]}<br/><span>Slot {item.itemSlot} · {confidenceText[item.confidence]} · {evidenceText[candidate?.semanticEvidence ?? 'unresolved']} · {item.requiresReoptimization ? 'Neuberechnung erforderlich' : 'Keine Neuberechnung erkannt'}{item.tradeOffs.length ? ` · Belegte Einschränkungen: ${item.tradeOffs.length}` : ''}</span></li> })}</ol> : <p>Keine fachlich begrenzte Unique-Empfehlung verfügbar.</p>}<p className="muted">PoB2-Uniques ohne technische GGG-Stat-Verknüpfung erhalten nur die von vorhandenen Regeln belegbare Bewertung.</p></div></details>
    <div className="rotation-grid"><article><h3>Mapping</h3><p>Priorität: Flächenwirkung, Projektilabdeckung und Bewegung, soweit vom Skill unterstützt.</p><ProfileRecommendations title="Mapping-Ranglisten" supports={analysis.supportAnalysis.topMappingSupports} passives={analysis.passiveAnalysis.topMappingCandidates} jewels={analysis.jewelAnalysis.topMappingJewels} uniques={analysis.uniqueAnalysis.topMappingUniques}/><Rotation plan={analysis.mappingRotation}/></article><article><h3>Boss</h3><p>Priorität: Einzelzielwirkung, Schwächungen und stabile Schadensfenster, soweit belegt.</p><ProfileRecommendations title="Boss-Ranglisten" supports={analysis.supportAnalysis.topBossSupports} passives={analysis.passiveAnalysis.topBossCandidates} jewels={analysis.jewelAnalysis.topBossJewels} uniques={analysis.uniqueAnalysis.topBossUniques}/><Rotation plan={analysis.bossRotation}/></article></div>
    <details open><summary>Nächste Verbesserungen</summary><div className="result-panel">{nextSteps.length ? <ol>{nextSteps.map(step => <li key={step}>{step}</li>)}</ol> : <p>Keine konkrete Verbesserung aus den vorhandenen Daten ableitbar.</p>}</div></details>
  </section>
}
