import type { BuildAnalysis, Confidence, ConstraintViolation, RotationPlan } from '../engine'
import type { EquipmentEntry } from '../domain'
import { equipmentSlotDefinitions, jewelDefinitions, clusterJewelDefinitions, uniqueClusterJewelDefinitions, passiveNodeDefinitions, skillDefinitions, supportDefinitions } from '../data'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { buildAssistantCandidates } from '../features/build-assistant-v1'
import type { PassivePlanPresentation } from '../features/real-passive-analysis'
import { technicalAffixById } from '../affixes/registry'
import { affixDisplayName } from '../features/equipment-editor/affix-display'
import type { BuildVariantOptimization } from '../features/skills/build-variant-optimizer'
import type { PostPassiveResourceRebalanceResult } from '../features/skills/post-passive-resource-rebalance'
import { ResourceBalancePanel } from './ResourceBalancePanel'

const confidenceText: Record<Confidence, string> = { high: 'Hohe Sicherheit', medium: 'Mittlere Sicherheit', low: 'Niedrige Sicherheit' }
const goalText = { balanced: 'Allround', mapping: 'Mapping', boss: 'Boss' }
const damageText: Record<string, string> = { physical: 'Physischer Schaden', fire: 'Feuerschaden', cold: 'Kälteschaden', lightning: 'Blitzschaden', chaos: 'Chaosschaden' }
const damagingAilmentText: Record<string, string> = { bleeding: 'Blutung', poison: 'Gift', ignite: 'Entzünden' }
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
const defenceLabel = { armour: 'Rüstung', evasion: 'Ausweichwert', energyShield: 'Energieschild' } as const

export function CharacterDefencePanel({ model }: { model: NonNullable<NonNullable<BuildAnalysis['damageEstimate']>['characterDefenceModel']> }) {
  const productive = model.contributions.filter(value => value.calculatedContribution !== 0)
  return <div className="character-defence-model"><b>Belegte Charakterverteidigung · {model.weaponSet === 'set-1' ? 'Waffenset 1' : 'Waffenset 2'}</b>
    {productive.length ? <dl className="summary-grid">{productive.map(value => <div key={value.type}>
      <dt>{defenceLabel[value.type]}</dt>
      <dd>{formatDamage(value.calculatedContribution)}</dd>
      <small>{formatDamage(value.equipmentBase)} aus Ausrüstung{value.flatPassive ? ` · ${value.flatPassive > 0 ? '+' : ''}${formatDamage(value.flatPassive)} flach` : ''}{value.increasedReducedPercent ? ` · ${value.increasedReducedPercent > 0 ? '+' : ''}${formatDamage(value.increasedReducedPercent)} % erhöht/verringert` : ''}{value.moreLessMultiplier !== 1 ? ` · Faktor ${formatDamage(value.moreLessMultiplier)}` : ''}</small>
    </div>)}</dl> : <p>Keine bestätigten Verteidigungswerte für dieses Waffenset vorhanden.</p>}
    {model.excludedWeaponItemIds.length ? <p className="warning"><b>Ausgeschlossen:</b> Verteidigungswerte auf {model.excludedWeaponItemIds.length} Waffen-Eintrag{model.excludedWeaponItemIds.length === 1 ? '' : 'en'} wurden nicht gerechnet.</p> : null}
    {model.blockedPassiveLines.length ? <p className="warning">{model.blockedPassiveLines.length} bedingte oder noch nicht sicher strukturierte Passive-Wirkung{model.blockedPassiveLines.length === 1 ? '' : 'en'} bleibt unangewandt.</p> : null}
    <p className="muted">{model.limitations.join(' ')}</p>
  </div>
}
const attributeLabel = { strength: 'StÃ¤rke', dexterity: 'Geschicklichkeit', intelligence: 'Intelligenz' } as const
export function CharacterAttributePanel({ models }: { models: NonNullable<BuildAnalysis['characterAttributes']> }) {
  return <div className="character-attribute-model"><b>Belegte Charakterattribute</b>
    <dl className="summary-grid">{(['set-1', 'set-2'] as const).flatMap(set => (Object.keys(models[set].total) as Array<keyof typeof attributeLabel>).map(attribute => <div key={`${set}:${attribute}`}>
      <dt>{attributeLabel[attribute]} Â· {set === 'set-1' ? 'Waffenset 1' : 'Waffenset 2'}</dt>
      <dd>{models[set].total[attribute]}</dd>
      <small>Basis {models[set].base[attribute]} Â· AusrÃ¼stung {models[set].equipment[attribute]} Â· Passive/Aszendenz {models[set].passives[attribute]}</small>
    </div>))}</dl>
    {models['set-1'].status !== 'exact-confirmed-sources' ? <p className="warning">Die Klassen-Grundattribute konnten nicht sicher aufgelÃ¶st werden.</p> : null}
    {[...new Set([...models['set-1'].blockedPassiveLines, ...models['set-2'].blockedPassiveLines])].length ? <p className="warning">Bedingte oder nicht exakt strukturierte Attributzeilen bleiben unangewandt.</p> : null}
  </div>
}
const issueText = (issue: ConstraintViolation) => {
  const known: Record<string, string> = {
    'skill-wrong-weapon': 'Die gewählte Fertigkeit passt nicht zur erkannten Waffenart.',
    'skill-attack-in-spell-only-profile': 'Der Angriff passt nicht zum überwiegend zauberbasierten Ausrüstungsprofil.',
    'skill-spell-in-attack-only-profile': 'Der Zauber passt nicht zum überwiegend angriffsbasierten Ausrüstungsprofil.',
    'low-profile-clarity': 'Die Ausrüstung liefert noch kein klares Profil.',
    'equipment-conflict': 'Ausrüstungsschwerpunkte stehen teilweise im Konflikt.',
    'level-requirement': 'Die Levelanforderung ist noch nicht erfüllt.',
    'synthetic-attribute-deficit': 'Mindestens eine Attributanforderung ist noch nicht ausreichend gedeckt.',
    'skill-attribute-deficit': 'Die konkrete Attributanforderung der Fertigkeit ist noch nicht erfÃ¼llt.',
    'attribute-requirement-strength': 'Die StÃ¤rkeanforderung des Gegenstands ist noch nicht erfÃ¼llt.',
    'attribute-requirement-dexterity': 'Die Geschicklichkeitsanforderung des Gegenstands ist noch nicht erfÃ¼llt.',
    'attribute-requirement-intelligence': 'Die Intelligenzanforderung des Gegenstands ist noch nicht erfÃ¼llt.',
    redundant: 'Dieser Wert überschneidet sich mit einer anderen Empfehlung.',
    'required-skill-tag-missing': 'Dem Hauptangriff fehlt die erforderliche Mechanik.',
    'required-mechanic-missing': 'Die benötigte Mechanik ist nicht vorhanden.',
  }
  if (issue.code === 'base-level-requirement') return 'Die Levelanforderung eines eingetragenen Basistyps ist noch nicht erfüllt.'
  if (issue.code === 'base-attribute-requirement') return 'Die Attributanforderung eines eingetragenen Basistyps ist noch nicht erfüllt.'
  if (issue.code === 'base-attributes-unknown') return 'Die Attribute für die Anforderungsprüfung sind nicht vollständig belegt.'
  if (issue.code === 'base-identity-unresolved') return 'Der sichtbare Basistyp besitzt noch keine sichere technische Zuordnung; seine Anforderungen bleiben unbekannt.'
  if (issue.code === 'attribute-requirements-unknown') return 'Die belegten Attributanforderungen dieses Uniques können ohne vollständige Attributdaten nicht geprüft werden.'
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

export function BuildAssistantResultSection({ analysis, equipment, passivePlan, variantOptimization, resourceRebalance, onShowPassivePlan }: {
  analysis: BuildAnalysis
  equipment: EquipmentEntry[]
  passivePlan?: PassivePlanPresentation
  variantOptimization?: BuildVariantOptimization | null
  resourceRebalance?: PostPassiveResourceRebalanceResult | null
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
  const blockedEquipmentRequirements=analysis.equipmentRequirementAssessment?.blockedItems??[]
  const unresolvedEquipmentRequirements=analysis.equipmentRequirementAssessment?.unresolvedItems??[]
  const fitCategory = !desiredSkill?.valid || blockedEquipmentRequirements.length ? 'Schwach passend' : analysis.equipmentAnalysis.profileClarity >= 70 && confidence !== 'low' ? 'Sehr passend' : analysis.equipmentAnalysis.profileClarity >= 45 ? 'Gut passend' : 'Bedingt passend'
  const nextSteps = [
    ...blockedEquipmentRequirements.map(item=>item.status==='blocked-level'
      ? `${item.label}: benötigtes Level ${item.requiredLevel ?? 'unbekannt'} erreichen oder Gegenstand ersetzen.`
      : `${item.label}: fehlende Attribute ergänzen (${Object.entries(item.missing).filter(([,value])=>(value??0)>0).map(([attribute,value])=>`${attributeLabel[attribute as keyof typeof attributeLabel]} +${value}`).join(', ')}).`),
    ...(unresolvedEquipmentRequirements.length?[`${unresolvedEquipmentRequirements.length} Basistyp${unresolvedEquipmentRequirements.length===1?'':'en'} technisch zuordnen, damit Anforderungen sicher geprüft werden können.`]:[]),
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
    {resourceRebalance?.passivePlanAdjusted ? <p className="analysis-note"><b>Ressourcen-Passivziele:</b> Die zunächst erkannte Unterdeckung wurde durch einen belegbar tragfähigeren alternativen Passivplan reduziert. Die Supportauswahl wurde erst danach geprüft.</p> : null}
    {resourceRebalance?.adjustedSetupIds.length ? <p className="analysis-note"><b>Ressourcenprüfung:</b> {resourceRebalance.adjustedSetupIds.length} automatisch erzeugte Supportkombination(en) wurden nach der realen Passiv- und Aszendenzplanung auf eine tragfähigere Kombination umgestellt.</p> : null}
    {resourceRebalance?.manualConflictSetupIds.length ? <p className="analysis-warning"><b>Manuelle Auswahl beibehalten:</b> Bei {resourceRebalance.manualConflictSetupIds.length} Fertigkeitssetup(s) ist eine bestätigte Ressourcenunterdeckung vorhanden. Die Nutzerwahl wurde nicht automatisch verändert.</p> : null}
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
          <div><dt>Schadensziel</dt><dd>{variantOptimization.selected.numericCoverageStatus === 'comparable' ? `${variantOptimization.selected.damageObjectiveScore}/100 relativ vergleichbar` : 'Nur strukturell belegbar'}</dd></div>
          <div><dt>Vergleichsabdeckung</dt><dd>{variantOptimization.numericallyComparableCombinationCount}/{variantOptimization.evaluatedCombinationCount}</dd></div>
          <div><dt>Set-2-Setup</dt><dd>{variantOptimization.selected.setupSkillId ? definitionName(variantOptimization.selected.setupSkillId) : 'Keine belegte Ergänzung'}</dd></div>
        </dl>
        <p>{variantOptimization.equipmentFirst ? 'Vorhandene Waffen wurden zuerst berücksichtigt.' : 'Ohne Ausrüstung wurde die fachlich passendste belegte Waffenart mitgeprüft.'} Geprüft: {variantOptimization.evaluatedSkillCount} Hauptfertigkeiten und {variantOptimization.evaluatedCombinationCount} kompatible Skill-Waffen-Kombinationen.</p>
        {variantOptimization.selected.packageComponents && <>
          <h4>Gemeinsame Build-Paketprüfung</h4>
          <p>
            Status: {variantOptimization.selected.packageStatus === 'coherent'
              ? 'Zusammenhängend belegt'
              : variantOptimization.selected.packageStatus === 'limited'
                ? 'Teilweise belegt'
                : 'Blockiert'}
            {' · '}Paketwert {variantOptimization.selected.packageScore}/100
          </p>
          <dl className="result-grid">
            <div><dt>Ausrüstung</dt><dd>{variantOptimization.selected.packageComponents.equipment}</dd></div>
            <div><dt>Hauptskill</dt><dd>{variantOptimization.selected.packageComponents.skill}</dd></div>
            <div><dt>Supports</dt><dd>{variantOptimization.selected.packageComponents.supports}</dd></div>
            <div><dt>Passive</dt><dd>{variantOptimization.selected.packageComponents.passives}</dd></div>
            <div><dt>Juwelen</dt><dd>{variantOptimization.selected.packageComponents.jewels}</dd></div>
            <div><dt>Uniques</dt><dd>{variantOptimization.selected.packageComponents.uniques}</dd></div>
            <div><dt>Ressourcen</dt><dd>{variantOptimization.selected.packageComponents.resources}</dd></div>
            <div><dt>Rotation</dt><dd>{variantOptimization.selected.packageComponents.rotation}</dd></div>
          </dl>
        </>}
        <ul>{variantOptimization.selected.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>
        {variantOptimization.alternatives.length > 0 && <><h4>Belegte Alternativen</h4><ol>{variantOptimization.alternatives.slice(0, 3).map(candidate => <li key={`${candidate.skillId}-${candidate.weaponType}`}><b>{definitionName(candidate.skillId)}</b> mit {candidate.weaponLabel} · Variantenwert {candidate.totalScore}</li>)}</ol></>}
        <p className="muted">Die Auswahl ist eine deterministische Optimierung aus vorhandenen Skill-, Waffen-, Support-, Aszendenz- und Tree-Signalen. Sie behauptet keine vollständige Path-of-Building-DPS-Simulation; der tatsächlich berechnete Passive-Pfad bleibt die abschließende Pfadprüfung.</p>
      </> : <p>Keine vollständig kompatible und belegte Skill-Waffen-Kombination gefunden. Unbekannte Zusammenhänge wurden nicht erfunden.</p>}
    </div></details>
    <details open><summary>Schaden und Build-Vergleich</summary><div className="result-panel damage-estimate">
      {analysis.damageEstimate?.status==='unavailable'?<><h3>Numerischer Schaden: nicht verfügbar</h3><p>{analysis.damageEstimate.warnings.join(' ')}</p>{analysis.damageEstimate.damageOverTime?.blockedEffects.length?<div><b>Nicht angewandte DoT-Teilwerte:</b><ul>{analysis.damageEstimate.damageOverTime.blockedEffects.map(effect=><li key={`${effect.sourceRecordId}:${effect.kind}`}>{effect.sourceLabel}: {effect.detail}</li>)}</ul></div>:null}</>:<>
        <h3>Berechenbarer Trefferschaden · {analysis.damageEstimate?.skillName??'Hauptfertigkeit'}</h3>
        <dl className="summary-grid">
          <div><dt>Schaden pro Treffer</dt><dd>{formatDamage(analysis.damageEstimate?.hitDamage?.minimum)}–{formatDamage(analysis.damageEstimate?.hitDamage?.maximum)}</dd></div>
          <div><dt>Ø pro Treffer</dt><dd>{formatDamage(analysis.damageEstimate?.hitDamage?.average)}</dd></div>
          <div><dt>Aktionen pro Sekunde</dt><dd>{formatDamage(analysis.damageEstimate?.actionsPerSecond)}</dd></div>
          <div><dt>Trefferschaden pro Sekunde</dt><dd>{formatDamage(analysis.damageEstimate?.hitDamagePerSecond)}</dd></div>
          {analysis.damageEstimate?.attackHitChance?.status==='exact' && <div><dt>Angriffstrefferchance</dt><dd>{formatDamage(analysis.damageEstimate.attackHitChance.hitChancePercent)} %</dd></div>}
          {analysis.damageEstimate?.accuracyAdjustedDamagePerSecond != null && <div><dt>Trefferbereinigter Schaden/s</dt><dd>{formatDamage(analysis.damageEstimate.accuracyAdjustedDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.accuracyAdjustedExpectedCriticalDamagePerSecond != null && <div><dt>Treffer- und kritbereinigter Schaden/s</dt><dd>{formatDamage(analysis.damageEstimate.accuracyAdjustedExpectedCriticalDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.expectedCriticalHitDamagePerSecond != null && <div><dt>Erwartungswert mit kritischen Treffern</dt><dd>{formatDamage(analysis.damageEstimate.expectedCriticalHitDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.criticalChance && <div><dt>Kritische Trefferchance</dt><dd>{formatDamage(analysis.damageEstimate.criticalChance.effective)} %</dd></div>}
          {analysis.damageEstimate?.criticalDamageBonus != null && <div><dt>Gesamter kritischer Schadensbonus</dt><dd>+{formatDamage(analysis.damageEstimate.criticalDamageBonus)} %</dd></div>}
          {analysis.damageEstimate?.expectedDamagePerSecondAfterMitigation != null && <div><dt>Nach Gegnerabwehr</dt><dd>{formatDamage(analysis.damageEstimate.expectedDamagePerSecondAfterMitigation)}</dd></div>}
          {analysis.damageEstimate?.accuracyAdjustedDamagePerSecondAfterMitigation != null && <div><dt>Nach Trefferchance und Gegnerabwehr</dt><dd>{formatDamage(analysis.damageEstimate.accuracyAdjustedDamagePerSecondAfterMitigation)}</dd></div>}
          {analysis.damageEstimate?.triggerRepeatModel?.productive && <div><dt>Ausgelöste Fertigkeiten/s</dt><dd>{formatDamage(analysis.damageEstimate.triggerRepeatModel.triggeredDamagePerSecondAfterMitigation??analysis.damageEstimate.triggerRepeatModel.triggeredDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.combinedDamagePerSecond != null && <div><dt>Gemeinsamer belegter Schaden/s</dt><dd>{formatDamage(analysis.damageEstimate.combinedDamagePerSecondAfterMitigation??analysis.damageEstimate.combinedDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.rageDamageComparison && analysis.damageEstimate.rageDamageComparison.status!=='blocked-no-confirmed-rage-gain' && <div><dt>{analysis.damageEstimate.rageDamageComparison.status==='ramped-sustained-combat-comparison'?'Kampfreferenz bei voller Wut':'Vergleich bei voller Wut'}</dt><dd>{formatDamage(analysis.damageEstimate.rageDamageComparison.expectedDamagePerSecondAfterMitigationAtComparedRage??analysis.damageEstimate.rageDamageComparison.expectedDamagePerSecondAtComparedRage)} Schaden/s bei {analysis.damageEstimate.rageDamageComparison.comparedRage} Wut ({analysis.damageEstimate.rageDamageComparison.effectiveRageEffect} wirksame Wut; wirkt auf {analysis.damageEstimate.rageDamageComparison.appliesTo==='spell'?'Zauber':'Angriffe'})</dd></div>}
          {analysis.damageEstimate?.activeWindowDamagePerSecond != null && <div><dt>Im belegten Bufffenster</dt><dd>{formatDamage(analysis.damageEstimate.activeWindowDamagePerSecondAfterMitigation??analysis.damageEstimate.activeWindowDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.preparedNextHitDamage != null && <div><dt>Vorbereiteter nächster Treffer</dt><dd>{formatDamage(analysis.damageEstimate.preparedNextHitDamageAfterMitigation??analysis.damageEstimate.preparedNextHitDamage)}</dd></div>}
          {analysis.damageEstimate?.damageOverTime?.totalSingleApplicationDamagePerSecond != null && <div><dt>Belegter DoT pro Sekunde</dt><dd>{formatDamage(analysis.damageEstimate.damageOverTime.totalSingleApplicationDamagePerSecondAfterMitigation??analysis.damageEstimate.damageOverTime.totalSingleApplicationDamagePerSecond)}</dd></div>}
          {analysis.damageEstimate?.damagingAilments?.totalSustainedDamagePerSecond != null && <div><dt>Schädigende Zustände pro Sekunde</dt><dd>{formatDamage(analysis.damageEstimate.damagingAilments.totalSustainedDamagePerSecondAfterMitigation??analysis.damageEstimate.damagingAilments.totalSustainedDamagePerSecond)}</dd></div>}
        </dl>
        {analysis.damageEstimate?.attackHitChance?.status==='exact'?<div><b>Genauigkeit gegen Ausweichen:</b><ul>
          <li>Genauigkeit: {analysis.damageEstimate.attackHitChance.playerAccuracy}</li>
          <li>Gegner Stufe {analysis.damageEstimate.attackHitChance.enemyLevel}: {analysis.damageEstimate.attackHitChance.enemyEvasion} Ausweichen</li>
          <li>Vergleichsdistanz: {analysis.damageEstimate.attackHitChance.comparisonDistanceMetres} m</li>
        </ul><p className="muted">{analysis.damageEstimate.attackHitChance.limitations.join(' ')}</p></div>:null}
        {analysis.damageEstimate?.damageOverTime?.effects.length?<div><b>Eigenständiger Schaden über Zeit:</b><ul>{analysis.damageEstimate.damageOverTime.effects.map(effect=><li key={`${effect.sourceRecordId}:${effect.damageType}`}>{damageText[effect.damageType]}: {formatDamage(effect.damagePerSecondAfterMitigation??effect.damagePerSecond)} pro Sekunde{effect.damagePerSecondAfterMitigation!=null?' nach Gegnerwiderstand':''} für {(effect.durationMs/1000).toLocaleString('de-DE')} s · {formatDamage(effect.totalDamagePerApplicationAfterMitigation??effect.totalDamagePerApplication)} je Einzelanwendung</li>)}</ul><p className="muted">Dieser Wert bleibt vom Trefferschaden getrennt. Er beschreibt genau eine belegte Anwendung, keine dauerhafte Uptime und keine zusätzlichen Stapel.</p></div>:null}
        {analysis.damageEstimate?.damageOverTime?.blockedEffects.length?<div><b>Nicht angewandte DoT-Teilwerte:</b><ul>{analysis.damageEstimate.damageOverTime.blockedEffects.map(effect=><li key={`${effect.sourceRecordId}:${effect.kind}`}>{effect.sourceLabel}: {effect.detail}</li>)}</ul></div>:null}
        {analysis.damageEstimate?.damageOverTime?<p className="muted">{analysis.damageEstimate.damageOverTime.limitations.join(' ')}</p>:null}
        {analysis.damageEstimate?.damagingAilments?.effects.length?<div><b>Schädigende Zustände:</b><ul>{analysis.damageEstimate.damagingAilments.effects.map(effect=><li key={`${effect.sourceRecordId}:${effect.kind}`}><b>{damagingAilmentText[effect.kind]??effect.kind}:</b> {formatDamage(effect.damagePerSecondAfterMitigation??effect.damagePerSecond)} Schaden/s{effect.damagePerSecondAfterMitigation!=null?' nach Gegnerwiderstand':''} · {formatDamage(effect.chancePercent)} % Chance · {(effect.durationMs/1000).toLocaleString('de-DE')} s · erwartete aktive Stapel {formatDamage(effect.expectedActiveStacks)} von {effect.maximumStacks}{effect.ailmentCriticalChancePercent!=null?` · ${formatDamage(effect.ailmentCriticalChancePercent)} % Wahrscheinlichkeit für mindestens einen kritisch ausgelösten aktiven Zustand`:''}</li>)}</ul></div>:null}
        {analysis.damageEstimate?.damagingAilments?.blockedEffects.length?<div><b>Nicht angewandte schädigende Zustände:</b><ul>{analysis.damageEstimate.damagingAilments.blockedEffects.map(effect=><li key={`${effect.sourceRecordId}:${effect.kind}`}><b>{damagingAilmentText[effect.kind]??effect.kind}:</b> {effect.detail}</li>)}</ul></div>:null}
        {analysis.damageEstimate?.damagingAilments?<p className="muted">{analysis.damageEstimate.damagingAilments.limitations.join(' ')}</p>:null}
        {analysis.damageEstimate?.projectileHitModel?.isProjectileSkill?<div><b>Projektile und Mehrfachtreffer:</b><ul>
          <li>Projektile pro Aktion: {analysis.damageEstimate.projectileHitModel.projectilesPerAction}</li>
          <li>Boss: Faktor {analysis.damageEstimate.projectileHitModel.bossScenario.hitMultiplier} · {analysis.damageEstimate.projectileHitModel.bossScenario.detail}</li>
          <li>Mapping: bis zu {analysis.damageEstimate.projectileHitModel.mappingPotentialTargetContacts} mögliche Zielkontakte · kein DPS-Multiplikator</li>
          {analysis.damageEstimate.projectileHitModel.mechanics.map(mechanic=><li key={`${mechanic.kind}:${mechanic.sourceReference}`}>{mechanic.detail}</li>)}
        </ul><p className="muted">{analysis.damageEstimate.projectileHitModel.limitations.join(' ')}</p></div>:null}
        {analysis.damageEstimate?.triggerRepeatModel?.sources.length?<div><b>Trigger und Wiederholungen:</b><ul>
          {analysis.damageEstimate.triggerRepeatModel.sources.map(source=><li key={`${source.sourceSkillId}:${source.kind}:${source.targetSkillId??'none'}`}><b>{source.sourceSkillName}:</b> {source.condition?`Bedingung ${source.condition} · `:''}{source.intervalMs?`Intervall ${(source.intervalMs/1000).toLocaleString('de-DE')} s · `:''}{source.targetSkillId?`Ziel ${source.targetSkillName??source.targetSkillId} · `:'Ziel nicht belegt · '}{source.triggersAllSocketedSkills&&source.socketedTargetCount?`${source.socketedTargetCount} eingebettete Fertigkeiten gemeinsam · `:''}{source.cooldownRecoveryPercent?`${formatDamage(source.cooldownRecoveryPercent)} % Abklingzeit-Erholung · `:''}{source.targetStoredUses&&source.targetStoredUses>1?`${source.targetStoredUses} gespeicherte Nutzungen${source.emptyToFullRechargeSeconds!=null?`, leer zu voll ${formatDamage(source.emptyToFullRechargeSeconds)} s`:''} · `:''}{source.cooldownRateCapPerSecond!=null?`Cooldown-Grenze ${formatDamage(source.cooldownRateCapPerSecond)}/s (${formatDamage(source.serverTickRoundedCooldownSeconds??0)} s${source.cooldownRoundedToServerTick?' im Server-Takt':' ohne Tick-Rundung'}) · `:''}{source.fullyStoredUseDamage!=null?`volle Reserve ${formatDamage(source.fullyStoredUseDamageAfterMitigation??source.fullyStoredUseDamage)} Schaden · `:''}{source.triggerRatePerSecond!=null?`${formatDamage(source.triggerRatePerSecond)} Auslösungen/s · `:''}{source.triggeredDamagePerSecond!=null?`${formatDamage(source.triggeredDamagePerSecondAfterMitigation??source.triggeredDamagePerSecond)} Schaden/s · `:''}{source.detail}</li>)}
        </ul><p className="muted">{analysis.damageEstimate.triggerRepeatModel.limitations.join(' ')}</p></div>:null}
        {analysis.damageEstimate?.minionCompanionModel?.sources.length?<div><b>Minions und Begleiter:</b><ul>
          {analysis.damageEstimate.minionCompanionModel.sources.map(source=><li key={`${source.sourceSkillId}:${source.kind}`}><b>{source.sourceSkillName}:</b> {source.maximumCount?`Maximalanzahl ${source.maximumCount} · `:''}{source.durationMs?`Dauer ${(source.durationMs/1000).toLocaleString('de-DE')} s · `:''}{source.damageBonusPercent?`${source.damageBonusPercent} % Minion-Schaden · `:''}{source.speedBonusPercent?`${source.speedBonusPercent} % Minion-Tempo · `:''}{source.reservationRequired?'Reservierung erforderlich · ':''}{source.detail}</li>)}
        </ul><p className="muted">{analysis.damageEstimate.minionCompanionModel.limitations.join(' ')}</p></div>:null}
        {analysis.damageEstimate?.resourceSpiritModel ? <ResourceBalancePanel model={analysis.damageEstimate.resourceSpiritModel}/> : null}
        {analysis.characterAttributes ? <CharacterAttributePanel models={analysis.characterAttributes}/> : null}
        {analysis.damageEstimate?.characterDefenceModel ? <CharacterDefencePanel model={analysis.damageEstimate.characterDefenceModel}/> : null}
        {analysis.damageEstimate?.rageDamageComparison?<p className="muted"><b>Wut und Schaden:</b> {analysis.damageEstimate.rageDamageComparison.detail}{analysis.damageEstimate.rageDamageComparison.durationWithoutFurtherHitOrGainSeconds!=null?` Ohne weitere Treffer oder Wutgewinne hält dieses Vergleichsfenster höchstens ${analysis.damageEstimate.rageDamageComparison.durationWithoutFurtherHitOrGainSeconds.toLocaleString('de-DE')} s.`:''}</p>:null}
        {analysis.damageEstimate?.multipleDamageEffect?<p className="muted"><b>Doppel-/Dreifachschaden:</b> {analysis.damageEstimate.multipleDamageEffect.doubleDamageChancePercent.toLocaleString('de-DE')} % Doppelchance, {analysis.damageEstimate.multipleDamageEffect.tripleDamageChancePercent.toLocaleString('de-DE')} % Dreifachchance; nach der PoB2-Überlappungsreihenfolge ergibt das den Trefferschadensfaktor {analysis.damageEstimate.multipleDamageEffect.expectedDamageMultiplier.toLocaleString('de-DE',{maximumFractionDigits:3})}. Nur {analysis.damageEstimate.multipleDamageEffect.sources.length} exakt belegte aktive Wirkung{analysis.damageEstimate.multipleDamageEffect.sources.length===1?'':'en'} wurde{analysis.damageEstimate.multipleDamageEffect.sources.length===1?'':'n'} eingerechnet.</p>:null}
        {analysis.damageEstimate?.gemLevelQualityModel?<div><b>Gemmenstufe und Qualität:</b><ul>
          <li>Fertigkeitsstufe: {analysis.damageEstimate.gemLevelQualityModel.skillLevelStatus==='exact'?`Stufe ${analysis.damageEstimate.gemLevelQualityModel.appliedSkillLevel} exakt angewandt`:analysis.damageEstimate.gemLevelQualityModel.skillLevelStatus==='default-reference-level'?`Stufe ${analysis.damageEstimate.gemLevelQualityModel.appliedSkillLevel} aus dem gepinnten Referenzstand angewandt`:'nicht berechenbar – angeforderte und verfügbare Stufe stimmen nicht überein'}</li>
          <li>Fertigkeitsqualität: {analysis.damageEstimate.gemLevelQualityModel.skillQualityStatus==='exact'?`${analysis.damageEstimate.gemLevelQualityModel.appliedSkillQuality}% exakt angewandt (${analysis.damageEstimate.gemLevelQualityModel.appliedQualityStats.length} wirksame Qualitätswerte)`:analysis.damageEstimate.gemLevelQualityModel.skillQualityStatus==='default-zero'?'0% als unveränderte Standardqualität angewandt':'nicht berechenbar – Qualität muss ganzzahlig zwischen 0 und 23 liegen'}</li>
          <li>Supportstufen: die am Quellenpin vorhandene Stufe jeder Supportvariante wird exakt verwendet; Supportqualität bleibt unbelegt.</li>
        </ul><p className="muted">{analysis.damageEstimate.gemLevelQualityModel.limitations.join(' ')}</p></div>:null}
        {analysis.damageEstimate?.itemValueScopeModel?<div><b>Gegenstandswerte und Qualität:</b><ul>
          <li>{analysis.damageEstimate.itemValueScopeModel.observedFinalValueItemIds.length} Gegenstände verwenden eingegebene Tooltip-Endwerte.</li>
          <li>{analysis.damageEstimate.itemValueScopeModel.localModifiersExcludedFromGlobalScaling} lokale Affixe werden nicht nochmals als globale Skalierung gerechnet.</li>
          <li>{analysis.damageEstimate.itemValueScopeModel.blockedItemIds.length?`${analysis.damageEstimate.itemValueScopeModel.blockedItemIds.length} Gegenstände sind wegen einer fehlenden exakten Wertkette blockiert.`:'Keine doppelte oder unbelegte Qualitätsanwendung erkannt.'}</li>
        </ul><p className="muted">{analysis.damageEstimate.itemValueScopeModel.limitations.join(' ')}</p></div>:null}
        {analysis.damageEstimate?.nextSkillEffects?.effects.some(effect=>effect.status==='prepared-next-hit')?<div><b>Belegte Folgeangriffswirkung:</b><ul>{analysis.damageEstimate.nextSkillEffects.effects.filter(effect=>effect.status==='prepared-next-hit').map(effect=><li key={`${effect.sourceId}:${effect.targetSkillId}`}>{effect.sourceLabel} → {effect.targetSkillLabel}: {effect.detail}</li>)}</ul><p className="muted">Der Wert gilt genau für den vorbereiteten nächsten Treffer. Er wird nicht als dauerhafter Schaden pro Sekunde ausgegeben.</p></div>:null}
        {analysis.damageEstimate?.nextSkillEffects?.effects.some(effect=>effect.status==='blocked')?<div><b>Nicht angewandte Folgeangriffswirkungen:</b><ul>{analysis.damageEstimate.nextSkillEffects.effects.filter(effect=>effect.status==='blocked').map(effect=><li key={`${effect.sourceId}:${effect.kind}`}>{effect.sourceLabel}: {effect.detail}</li>)}</ul></div>:null}
        {analysis.damageEstimate?.temporalOffensiveEffects?.some(effect=>effect.status==='active-window')?<div><b>Zeitabhängig angewandte Offensivwirkungen:</b><ul>{analysis.damageEstimate.temporalOffensiveEffects.filter(effect=>effect.status==='active-window').map(effect=><li key={`${effect.sourceId}:${effect.kind}`}>{effect.label}: {effect.percent} % · {effect.durationMs?`${(effect.durationMs/1000).toLocaleString('de-DE')} s Wirkfenster`:effect.detail}{effect.activationTimeMs?` · ${(effect.activationTimeMs/1000).toLocaleString('de-DE')} s Aktivierung`:''}</li>)}</ul><p className="muted">Dieser Wert gilt nur während des belegten Wirkfensters und ersetzt nicht den dauerhaften Vergleichswert.</p></div>:null}
        {analysis.damageEstimate?.temporalOffensiveEffects?.some(effect=>effect.status==='blocked')?<div><b>Nicht numerisch angewandte zeitabhängige Wirkungen:</b><ul>{analysis.damageEstimate.temporalOffensiveEffects.filter(effect=>effect.status==='blocked').map(effect=><li key={`${effect.sourceId}:${effect.kind}`}>{effect.label}: {effect.detail}</li>)}</ul></div>:null}
        {analysis.damageEstimate?.chargeState?<div><b>Ladungszustand:</b><ul>{analysis.damageEstimate.chargeState.states.map(state=><li key={state.type}>{state.label}: {state.availability==='available-window'?(state.count==null?'verfügbar':`${state.count} verfügbar`):state.availability==='conditional-unresolved'?'nur bedingt belegt':'nicht belegt'} · {state.detail}</li>)}</ul>{analysis.damageEstimate.chargeState.consumptions.length?<><b>Ladungsverbrauch:</b><ul>{analysis.damageEstimate.chargeState.consumptions.map(value=><li key={value.sourceId}>{value.label}: {value.detail}</li>)}</ul></>:null}{analysis.damageEstimate.chargeState.buffScenarios.length?<><b>Ladungsabhängige Buffs:</b><ul>{analysis.damageEstimate.chargeState.buffScenarios.map(value=><li key={value.sourceId}><b>{value.label}:</b> je Power Charge {value.minimumAddedDamagePerCharge}–{value.maximumAddedDamagePerCharge} zusätzlicher Blitzschaden für {(value.durationPerChargeMs/1000).toLocaleString('de-DE')} s auf Gemmenstufe {value.appliedSkillLevel}. {value.detail}</li>)}</ul></>:null}{analysis.damageEstimate.chargeState.regulationScenarios.length?<><b>Charge-Regulation-Szenario:</b><ul>{analysis.damageEstimate.chargeState.regulationScenarios.map(value=><li key={value.sourceId}><b>{value.label}:</b> Frenzy Charges: {value.frenzySkillSpeedPercent}% Fertigkeitsgeschwindigkeit; Power Charges: {value.powerFinalCriticalChancePercent}% finale kritische Trefferchance; Endurance Charges: {value.enduranceFinalDefencePercent}% finale Rüstung, Ausweichen und Energieschild. Verbrauch alle {(value.consumptionIntervalMs/1000).toLocaleString('de-DE')} s. {value.detail}</li>)}</ul></>:null}<p className="muted">Nicht vollständig belegte Ladungszustände erzeugen keinen Schadensbonus.</p></div>:null}
        {analysis.damageEstimate?.sealState?<div><b>Fertigkeitssiegel:</b><ul>{analysis.damageEstimate.sealState.skills.map(value=><li key={value.skillId}><b>{value.label}:</b> maximal {value.maximumSeals} Siegel, {value.repeatsPerBrokenSeal} Wiederholung je Siegel, volle Vorbereitung nach {(value.fullPreparationTimeMs/1000).toLocaleString('de-DE')} s. {value.detail}</li>)}</ul><p className="muted">Ohne bekannten aktuellen Siegelstand wird kein Sequenzbonus eingerechnet.</p></div>:null}
        {analysis.damageEstimate?.projectileAccumulationState?<div><b>Aufladbare Projektilfolge:</b><ul>{analysis.damageEstimate.projectileAccumulationState.skills.map(value=><li key={value.skillId}><b>{value.label}:</b> maximal {value.maximumProjectiles} Projektile, {(value.releaseIntervalMs/1000).toLocaleString('de-DE')} s Abstand und {value.finalDamagePerReleasedProjectilePercent} % finaler Schaden je abgefeuertem Projektil. {value.detail}</li>)}</ul><p className="muted">Aktuelle Stapelzahl und tatsächliche Mehrfachtreffer bleiben ohne belegten Kampfzustand unangewandt.</p></div>:null}
        {analysis.damageEstimate?.channelledStageState?<div><b>Kanalisierte Stufen:</b><ul>{analysis.damageEstimate.channelledStageState.skills.map(value=><li key={value.skillId}><b>{value.label}:</b> maximal {value.maximumStages} Stufen, {value.finalDamagePerStagePercent} % finaler Schaden je Stufe, voll aufgeladen Faktor {value.fullStageDamageMultiplier.toLocaleString('de-DE')}{value.minimumChannelTimeMs?` bei mindestens ${(value.minimumChannelTimeMs/1000).toLocaleString('de-DE')} s je Kanalabschnitt`:''}. {value.detail}</li>)}</ul>{analysis.damageEstimate.maximumChannelledHitDamage!=null?<p><b>Voll aufgeladener vorbereiteter Treffer:</b> {formatDamage(analysis.damageEstimate.maximumChannelledHitDamage)}{analysis.damageEstimate.maximumChannelledHitDamageAfterMitigation!=null?` · nach Gegnerabwehr ${formatDamage(analysis.damageEstimate.maximumChannelledHitDamageAfterMitigation)}`:''}</p>:null}<p className="muted">Das ist ein belegtes Vollstufenszenario. Es verändert den Dauerschaden nicht, solange Kanalzeit, aktuelle Stufe und Kampfabfolge nicht vollständig feststehen.</p></div>:null}
        {analysis.damageEstimate?.chargedSkillState?<div><b>Aufgeladene Fertigkeit:</b><ul>{analysis.damageEstimate.chargedSkillState.skills.map(value=><li key={value.skillId}><b>{value.label}:</b> maximal {value.maximumStages} Stufen{value.fullStageGainAsFirePercent?`, ${value.fullStageGainAsFirePercent} % als zusätzlicher Feuerschaden im Vollstufenszenario`:''}{value.fullStageDamageMultiplier?`, Schadensfaktor ${value.fullStageDamageMultiplier.toLocaleString('de-DE')}`:''}{value.fullStageAdditionalProjectiles?`, ${value.fullStageAdditionalProjectiles} zusätzliche Projektile ohne angenommene Einzelzieltreffer`:''}. {value.detail}</li>)}</ul>{analysis.damageEstimate.maximumChargedHitDamage!=null?<p><b>Vollstufiger vorbereiteter Treffer:</b> {formatDamage(analysis.damageEstimate.maximumChargedHitDamage)}{analysis.damageEstimate.maximumChargedHitDamageAfterMitigation!=null?` · nach Gegnerabwehr ${formatDamage(analysis.damageEstimate.maximumChargedHitDamageAfterMitigation)}`:''}</p>:null}<p className="muted">Aktuelle Stufen und Projektilüberlappungen werden nicht erfunden; der normale Dauerschaden bleibt davon getrennt.</p></div>:null}
        {analysis.damageEstimate?.persistentStageState?.skills.length?<div><b>Persistente Stufenzustände:</b><ul>{analysis.damageEstimate.persistentStageState.skills.map(value=><li key={value.skillId}><b>{value.label}:</b> {value.kind==='stationary-retaliation'
          ?`voll vorbereitet ${value.fullStageMinimumAddedColdDamage}–${value.fullStageMaximumAddedColdDamage} zusätzlicher Kälteschaden nach ${((value.fullPreparationTimeMs??0)/1000).toLocaleString('de-DE')} s`
          :value.kind==='mana-built-spell-buff'
            ?`Vollstufenszenario ${value.fullStageMoreSpellDamagePercent} % mehr Zauberschaden (Faktor ${value.fullStageSpellDamageMultiplier?.toLocaleString('de-DE')})`
            :value.kind==='monster-power-warcry'
              ?`bei ${value.monsterPowerCap} Monster-Power ${value.fullPowerMinimumColdDamage}–${value.fullPowerMaximumColdDamage} Kälteschaden im Buff und ${value.fullPowerEmpoweredAttackMinimumColdDamage}–${value.fullPowerEmpoweredAttackMaximumColdDamage} im verstärkten Angriff`
              :`${value.gainAsColdPercent} % als Kälteschaden gewonnen; Grunddauer ${((value.effectDurationMs??0)/1000).toLocaleString('de-DE')} s plus ${value.durationExtensionPerRageMs} ms je Rage`}. {value.detail}</li>)}</ul><p className="muted">Diese Maximalszenarien werden ohne belegten aktuellen Zustand nicht als dauerhafte DPS eingerechnet.</p></div>:null}
        {analysis.damageEstimate?.elementalState?.scenarios.length?<div><b>Elementarzustände:</b><ul>{analysis.damageEstimate.elementalState.scenarios.map(value=><li key={value.sourceId}><b>{value.label}:</b> {value.kind==='rotating-element'?`${value.finalDamagePercent} % mehr Schaden des aktiven Elements für ${((value.effectDurationMs??0)/1000).toLocaleString('de-DE')} s`:`${value.resonanceGrantedPerHit} Resonanzgewinn und ${value.finalDamagePercentPer50Resonance} % finaler Schaden je 50 Resonanz`}. {value.detail}</li>)}</ul><p className="muted">Ohne belegtes aktives Element beziehungsweise aktuelle Resonanz fließt kein Bonus in die DPS ein.</p></div>:null}
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
      {analysis.equipmentRequirementAssessment?.items.length ? <><h4>Level- und Attributanforderungen</h4><ul>{analysis.equipmentRequirementAssessment.items.map(item=><li key={item.entryId}><b>{item.label}</b> · {item.activeSets.length===2?'beide Waffensets':item.activeSets[0]==='set-1'?'Waffenset 1':'Waffenset 2'} · {item.status==='met'?'erfüllt':item.status==='blocked-level'?`Level ${item.requiredLevel ?? 'unbekannt'} noch nicht erreicht`:item.status==='blocked-attributes'?`fehlend: ${Object.entries(item.missing).filter(([,value])=>(value??0)>0).map(([attribute,value])=>`${attributeLabel[attribute as keyof typeof attributeLabel]} ${value}`).join(', ')}`:item.status==='unresolved-base'?'technische Basis unbekannt':'Attribute unbekannt'}</li>)}</ul></>:null}
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
