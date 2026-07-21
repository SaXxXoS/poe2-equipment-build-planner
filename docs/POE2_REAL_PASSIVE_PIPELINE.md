# Reale Passive-Pipeline (Aufgabe 5H)

## Integration durch Aufgabe 5I

Der öffentliche Pipelinevertrag wird nun ausschließlich von `runRealPassivePlanningIntegration` im Haupt-Orchestrator verwendet. Die Pipeline bleibt fachlich eigenständig; Targeting, Pathfinder und Planner werden nicht dupliziert. Stufen messen reale Laufzeiten, während der deterministische Resultathash diese weiterhin ausschließt. Graphwiederverwendung erfolgt explizit über Eingabe plus geprüfte Quellversion; ein globaler Cache wurde nicht eingeführt. Details: [`POE2_REAL_PASSIVE_ORCHESTRATOR_INTEGRATION.md`](POE2_REAL_PASSIVE_ORCHESTRATOR_INTEGRATION.md).

## Verantwortung und Abgrenzung

`src/engine/real-passive-pipeline/` verbindet die bestehenden Module in der Richtung `BuildProfile → passive-targeting → passive-pathfinding → passive-planning`. Sie validiert Kontext und Quelle, löst einen Klassenstart auf, baut oder übernimmt genau einen Graph, führt das unveränderte Targeting aus, übergibt dessen vollständiges Resultat an den unveränderten Planner und prüft den resultierenden Teilbaum.

Die Pipeline enthält keine Klassifikations-, Score-, Pfadsuch- oder Kandidatenauswahllogik. Sie importiert weder React noch den Haupt-Orchestrator oder den synthetischen Passive Analyzer. Es entstehen keine ViewModels, deutschen Knotentexte, Equipment-/Skillanalysen oder DPS-Werte.

## Eingabevertrag und explizites Budget

`RealPassivePipelineInput` verlangt Request- und Quellversion, normalisiertes `BuildProfile`, Klasse, optionale Aszendenz, Charakterlevel, optionalen Start, ausdrücklich übergebenes `pointBudget`, Zielprofil, Planungsmodus, normalisierten Baum, optional vorbereiteten Graph, Belegungs-/Blockierungs-/Required-/Excluded-IDs, optionale Knotentypen und Targeting-Grenze, Pool-/Zielgrenzen, Mindestscore/-Confidence, Keystone-Reoptimierungsfreigabe und `AnalyzerContext`.

Das Punktebudget wird nie aus dem Charakterlevel abgeleitet. Level bleibt Targeting- und Validierungskontext. Quest- und Aszendenzpunkte werden nicht erfunden. Die technische Obergrenze 123 entspricht der bestehenden Planner-Sicherheitsgrenze und ist keine reale Produktbehauptung.

## Startknotenauflösung

Eine explizite ID hat Vorrang, muss aber ein offizieller Klassenstart sein und `classStartIndex` der angegebenen technischen Klasse enthalten. Ohne ID wird ausschließlich diese offizielle Zuordnung verwendet. Genau ein Treffer ist erforderlich. Fehlende oder mehrdeutige Zuordnungen blockieren. Anzeigenamen, Koordinaten, geometrische Nähe und Standardklassen werden nicht verwendet.

`StartNodeResolution` enthält aufgelöste ID, `explicit` oder `official-class-mapping`, Klasse, Warnungen und Violations. Für Release 0.5.2 wird Klasse `0` eindeutig zu `47175` aufgelöst.

## Quelle, Graph und Stufenmodell

Korrektur 5I: Die acht Stufen erfassen nun reale `durationMs`. Diese Laufzeiten bleiben vollständig außerhalb des deterministischen Resultathashs; die weiter unten stehende historische 5H-Aussage zu kontrollierten Nullwerten ist damit ersetzt.

Die Pipeline prüft vorhandene Quellversion, Gleichheit mit `metadata.releaseTag`, Knoten/Verbindungen, Profil, Level, Budget und kontrollierte Modi. Sie aktualisiert keine Daten. Ein bereitgestellter Graph wird anhand von Knoten-/Verbindungszahl und Startreferenz geprüft und ohne Neubau verwendet. Sonst ruft die Pipeline einmal `buildPassiveGraph` auf. Diagnosewerte sind `provided`/`built`, Wiederverwendung, Buildanzahl und Bestandsgrößen.

Die acht stabilen Stufen lauten `validate-input`, `resolve-start-node`, `prepare-graph`, `evaluate-targets`, `prepare-planning-input`, `create-passive-plan`, `validate-output`, `complete`. Jede besitzt Status, `durationMs`, Warning-/Violation-Codes sowie Eingabe-/Ausgabezusammenfassung. Im deterministischen Kernergebnis ist `durationMs` kontrolliert null; reale Laufzeiten werden nur im Performance-Harness außerhalb des Resultathashs gemessen. Zeitstempel fehlen.

## Targeting- und Planning-Integration

`evaluatePassiveTargets` erhält Profil, Klasse/Aszendenz, Level, Zielprofil, alle echten Knoten, Excluded-IDs, erlaubte Typen, Ergebnisgrenze, Mindest-Confidence, Context und Quellversion. Empfehlungen, Rankings, Reasons, Coverage und unresolved Stats werden unverändert in `targetingResult` übernommen.

`planPassiveTargets` erhält den aufgelösten Start, das ausdrückliche Budget, Modus/Zielprofil, vollständiges Targeting-Resultat, vorbereiteten Graph, Required-/Excluded-/Blocked-/Allocated-IDs, Pool-/Ziel-/Score-/Confidence-Grenzen, Keystone-Freigabe, Context und Version. Kandidatenauswahl und Pfadsuche bleiben vollständig in den bestehenden Modulen.

## Required-Target-Diagnose und Fehlerweitergabe

Jede Required-ID erhält `treeStatus`, `targetingStatus`, `planningStatus`, `selected`, `pathStatus`, ursprüngliche Warning- und Violation-Codes. Unterschieden werden fehlender Baumknoten, fehlendes/blocked/socket Targeting, Eingabefilter, fremde Aszendenz, Unerreichbarkeit, Budgetüberschreitung und erfolgreiche Verbindung. Required-Ziele verschwinden nie still.

`PipelineIssue` erhält Code, Quellmodul, Stufe und optionale Node-ID. Codes aus Targeting und Planning bleiben erhalten; ein zusätzlicher Pipeline-Code darf die Stufe kennzeichnen. Es werden keine fachlichen Ursachen umbenannt oder erfunden.

## Ergebnis und Ausgabevalidierung

`RealPassivePipelineResult` enthält Kontext, Startauflösung, vollständige Targeting- und Planning-Resultate, ausgewählte Ziele, belegte Knoten/Verbindungen, Budget, Required-Diagnosen, alle Stufen, Graph-/Targeting-/Planning-/Pipeline-Diagnosen, Issues, Status, Optimalitätsaussage und Version.

Kontrollierte Statuswerte: `complete`, `partial`, `blocked`, `invalid-input`, `source-version-mismatch`, `start-node-unresolved`, `targeting-failed`, `no-eligible-targets`, `required-target-failed`, `planning-failed`, `budget-exhausted`.

Nach Planning wird geprüft: Existenz aller Ziele/Knoten/Verbindungen, Eindeutigkeit, Erreichbarkeit jedes belegten Knotens vom Start über die ausgewählten Verbindungen, Budget, Required-Behandlung, fehlende Aszendenzknoten und übereinstimmende Quellversion. Ein ungültiges Resultat wird `planning-failed`.

## Determinismus und Resultathash

Startauflösung, Modulresultate, Reihenfolgen, IDs, Issues und Status sind deterministisch. `deterministicResultHash` ist ein FNV-1a-32-Hash über kanonisch nach Schlüsseln sortierte fachliche Kerndaten einschließlich Targeting-Empfehlungswerten und vollständigem Planning-Resultat. Laufzeiten, Speicher, Plattform und Zeitstempel sind ausgeschlossen. Der Hash ist ein Vergleichsindikator, keine kryptografische Signatur.

## Aszendenz- und Optimalitätsgrenze

Die Aszendenz dient nur Targeting und Zulässigkeitsprüfung. Entsprechend 5G sind Aszendenzstarts/-knoten im normalen Plan verboten; es gibt weder Aszendenzbudget noch -pfade. Die Pipeline übernimmt `optimalityClaim: heuristic` unverändert vom Planner und behauptet keine globale Baum-, Steiner-Tree- oder Buildoptimalität.

## Performance

Isolierte Messung am 21. Juli 2026, Node `v24.14.0`, Windows x64, offizieller Baum 0.5.2, Pool 10, ein Ziel, Budget 15:

| Messung | Laufzeit |
|---|---:|
| vollständige Pipeline mit neuem Graph | 2.482,74 ms |
| reiner Graphaufbau | 291,09 ms |
| vollständige Pipeline mit wiederverwendetem Graph | 1.845,79 ms |
| Targeting allein | 1.558,52 ms |
| Planning allein | 191,07 ms |
| zwei aufeinanderfolgende Läufe, gemeinsamer Graph | 3.623,40 ms |
| drei Profile, gemeinsamer Graph | 5.528,99 ms |

Der wiederverwendete Lauf meldete 10 echte Pfadsuchen und 0 Cachetreffer. Die beobachtete Heap-Differenz der gesamten Messung mit mehreren vollständigen Resultaten betrug 174,34 MiB. Dies sind Beobachtungen ohne Produktgrenzwert.

Die aktuelle Targeting-Schnittstelle klassifiziert alle Texte bei jedem Profil erneut. 5H führt absichtlich keinen fachlichen Cross-Run-Cache ein. Sicher wiederverwendbar wären künftig der immutable normalisierte Baum und Graph; eine Trennung profilunabhängiger Klassifikation von profilabhängiger Bewertung benötigt einen eigenen Auftrag und unveränderte Referenztests. Planner-Pfade können nur bei identischem Graph, Anker, Ziel, Belegungs- und Blockierungszustand wiederverwendet werden.

## Haupt-Orchestrator und UI

Die Pipeline ist ein neuer isolierter Entry Point und wird nicht von `analyzeBuild`, React oder dem Baum-ViewModel importiert. Sie zeigt keine Pfade, verändert keinen Buildstate und persistiert nichts. Produktive Orchestrator- und UI-Adapter bleiben getrennte Folgeaufgaben.
