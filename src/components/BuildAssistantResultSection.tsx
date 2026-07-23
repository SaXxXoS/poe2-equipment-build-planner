import type { BuildAnalysis, Confidence, ConstraintViolation, RotationPlan } from '../engine'
import type { EquipmentEntry } from '../domain'
import { equipmentSlotDefinitions, jewelDefinitions, clusterJewelDefinitions, uniqueClusterJewelDefinitions, passiveNodeDefinitions, skillDefinitions, supportDefinitions } from '../data'
import { localizedPob2UniquesDe } from '../localization/pob2-uniques-de'
import { buildAssistantCandidates } from '../features/build-assistant-v1'
import type { PassivePlanPresentation } from '../features/real-passive-analysis'

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
  return <ol>{plan.steps.map(step => <li key={step.stepId}><b>{step.actionType === 'switch-weapon-set' ? `Zu ${step.nextWeaponSet === 'set-2' ? 'Waffenset 2' : 'Waffenset 1'} wechseln` : step.skillId ? definitionName(step.skillId) : 'Nächsten Schritt ausführen'}</b><br/><span>{step.weaponSet === 'set-1' ? 'Waffenset 1' : step.weaponSet === 'set-2' ? 'Waffenset 2' : 'Beide Waffensets'} · {confidenceText[step.confidence]}</span></li>)}</ol>
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

export function BuildAssistantResultSection({ analysis, equipment, passivePlan, onShowPassivePlan }: {
  analysis: BuildAnalysis
  equipment: EquipmentEntry[]
  passivePlan?: PassivePlanPresentation
  onShowPassivePlan?: () => void
}) {
  const desiredSkillId = analysis.supportAnalysis.allCandidates[0]?.skillId ?? analysis.skillAnalysis.topMainCandidates[0]?.skillId
  const desiredSkill = analysis.skillRecommendations.find(item => item.skillId === desiredSkillId)
  const emptySlots = equipment.filter(item => !item.uniqueItemId && !item.itemClassId && item.modifierValues.length === 0)
  const equippedUniques = equipment.flatMap(item => item.uniqueItemId ? [{ entry: item, unique: uniqueById.get(item.uniqueItemId) }] : [])
  const uniques = uniqueRecommendations(analysis)
  const confidence = topConfidence(analysis)
  const dominantDamage = analysis.equipmentAnalysis.dominantDamageType
  const dominantMechanic = analysis.equipmentAnalysis.dominantMechanic
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
    <article className="build-summary"><h3>Zusammenfassung</h3><dl className="summary-grid">
      <div><dt>Zielprofil</dt><dd>{goalText[analysis.buildProfile.goals.mappingWeight > analysis.buildProfile.goals.bossWeight ? 'mapping' : analysis.buildProfile.goals.bossWeight > analysis.buildProfile.goals.mappingWeight ? 'boss' : 'balanced']}</dd></div>
      <div><dt>Hauptschaden</dt><dd>{dominantDamage ? damageText[dominantDamage] : 'Unbekannt'}</dd></div>
      <div><dt>Mechanik</dt><dd>{dominantMechanic ? mechanicText[dominantMechanic] : 'Unbekannt'}</dd></div>
      <div><dt>Sicherheit</dt><dd>{confidenceText[confidence]}</dd></div>
      <div><dt>Stärke</dt><dd>{dominantDamage ? `Klarster Schwerpunkt: ${damageText[dominantDamage]}` : 'Noch kein klarer Schwerpunkt'}</dd></div>
      <div><dt>Schwäche</dt><dd>{emptySlots.length ? `${emptySlots.length} leere Slots begrenzen die Aussagekraft` : analysis.warnings.length ? `${analysis.warnings.length} Konflikte oder Warnungen` : 'Keine deutliche Schwäche erkannt'}</dd></div>
    </dl></article>
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
      {passivePlan?.result?.plan ? <div className="concrete-passive-plan"><h4>Berechneter Passive-Pfad</h4><p>{passivePlan.status === 'stale' ? 'Der Pfad gehört zu älteren Eingaben und muss neu berechnet werden.' : `${passivePlan.result.usedPointBudget} von ${passivePlan.result.pointBudget} Punkten verwendet · ${passivePlan.result.allocatedNodeIds.length} Knoten im Pfad.`}</p><ol>{passivePlan.result.plan.selectedTargets.slice(0, 8).map((target, index) => <li key={target.nodeId}><b>{index + 1}. {target.displayName || target.nodeId}</b> · {target.incrementalPointCost} Punkte · {target.pathNodeIds.length} Pfadknoten · {confidenceText[target.confidence]}</li>)}</ol>{onShowPassivePlan && <button className="secondary" onClick={onShowPassivePlan}>Pfad im Baum anzeigen</button>}</div> : <p>Konkreter Pfad noch nicht berechnet. Die vorhandene Passive-Analyse in Abschnitt 6 kann ihn mit Punktbudget und Klassenstart erzeugen.</p>}
    </div></details>
    <details><summary>Juwelen und Cluster</summary><div className="result-panel"><RecommendationList values={[...analysis.jewelAnalysis.topNormalJewels, ...analysis.jewelAnalysis.topClusterJewels, ...analysis.jewelAnalysis.topUniqueClusterJewels]} name={definitionName}/></div></details>
    <details open><summary>Passende Uniques</summary><div className="result-panel">{uniques.length ? <ol>{uniques.map(item => { const unique = uniqueById.get(item.uniqueId), candidate = uniqueCandidateById.get(item.uniqueId); return <li key={item.uniqueId}><b>{unique?.name ?? item.uniqueId}</b> · {unique?.baseDisplayName ?? item.itemSlot} · {verdictText[item.replacementVerdict]}<br/><span>Slot {item.itemSlot} · {confidenceText[item.confidence]} · {evidenceText[candidate?.semanticEvidence ?? 'unresolved']} · {item.requiresReoptimization ? 'Neuberechnung erforderlich' : 'Keine Neuberechnung erkannt'}{item.tradeOffs.length ? ` · Belegte Einschränkungen: ${item.tradeOffs.length}` : ''}</span></li> })}</ol> : <p>Keine fachlich begrenzte Unique-Empfehlung verfügbar.</p>}<p className="muted">PoB2-Uniques ohne technische GGG-Stat-Verknüpfung erhalten nur die von vorhandenen Regeln belegbare Bewertung.</p></div></details>
    <div className="rotation-grid"><article><h3>Mapping</h3><p>Priorität: Flächenwirkung, Projektilabdeckung und Bewegung, soweit vom Skill unterstützt.</p><ProfileRecommendations title="Mapping-Ranglisten" supports={analysis.supportAnalysis.topMappingSupports} passives={analysis.passiveAnalysis.topMappingCandidates} jewels={analysis.jewelAnalysis.topMappingJewels} uniques={analysis.uniqueAnalysis.topMappingUniques}/><Rotation plan={analysis.mappingRotation}/></article><article><h3>Boss</h3><p>Priorität: Einzelzielwirkung, Schwächungen und stabile Schadensfenster, soweit belegt.</p><ProfileRecommendations title="Boss-Ranglisten" supports={analysis.supportAnalysis.topBossSupports} passives={analysis.passiveAnalysis.topBossCandidates} jewels={analysis.jewelAnalysis.topBossJewels} uniques={analysis.uniqueAnalysis.topBossUniques}/><Rotation plan={analysis.bossRotation}/></article></div>
    <details open><summary>Nächste Verbesserungen</summary><div className="result-panel">{nextSteps.length ? <ol>{nextSteps.map(step => <li key={step}>{step}</li>)}</ol> : <p>Keine konkrete Verbesserung aus den vorhandenen Daten ableitbar.</p>}</div></details>
  </section>
}
