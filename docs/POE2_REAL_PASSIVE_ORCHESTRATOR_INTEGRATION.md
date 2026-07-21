# Reale Passive-Pipeline im Haupt-Orchestrator (Aufgabe 5I)

## UI-Grenze nach 5K

React ruft weder Orchestrator noch Pipeline direkt auf. Genau der 5J-Dispatcher erreicht `analyzeBuild`; 5K sendet ausschließlich Compact-Anfragen über den Worker-Client. Budget bleibt explizit, fachliche Regeln sind unverändert und Pfade werden nicht im Baum visualisiert.

## Browseradapter 5J

Der Workerdispatcher ruft weiterhin ausschließlich `analyzeBuild` mit der 5I-Adaptergrenze auf. Workeranalysen erzwingen Compact und verwenden den im Worker gehaltenen Graph/Context. Keine UI-Anbindung oder Pfadvisualisierung.

## Vertragsentwicklung 5I.1

Der Adapter verwendet standardmäßig `resultDetailMode: compact`; `full` bleibt für Audit und Entwicklung verfügbar. Genau eine Projektionsfunktion entfernt redundante Transportdaten und erhält Plan, Pfade, Budget, Required-Diagnosen, Issues, Status und fachlichen Hash. Ein optionaler Prepared Targeting Context beschleunigt wiederholte Profile desselben geprüften Baums. Details: [POE2_REAL_PASSIVE_PERFORMANCE_OPTIMIZATION.md](POE2_REAL_PASSIVE_PERFORMANCE_OPTIMIZATION.md).

## Ziel und Ausgangsstand

5I bindet den vorhandenen öffentlichen Vertrag `runRealPassivePipeline` über genau eine Grenze, `runRealPassivePlanningIntegration`, in `analyzeBuild` ein. Targeting, Pathfinder, Planner und deren Validierung werden weder dupliziert noch direkt vom Orchestrator aufgerufen. React, Baumrenderer und UI-State bleiben unberührt.

Der bisherige Ablauf lautet weiterhin: `BuildInput → Equipment/BuildProfile → Skills → Supports → synthetische Passives → Jewels → Uniques → Rotations → Explanations`. Die optionale reale Pipeline verzweigt unmittelbar nach dem Equipment-Profil, weil sie nur dieses Profil und ihren expliziten Vertrag benötigt. Kein späteres Modul konsumiert ihren Plan; unabhängige Analyzer laufen auch nach kontrollierten Pipelinefehlern vollständig weiter.

## Eingabe, Aktivierung und Budget

`EngineRequest.realPassivePlanning` ist optional. Fehlt es, entsteht weder Aufruf noch Graph, Diagnose oder Ergebnisfeld. `enabled:false` liefert ausschließlich `disabled`. Bei Aktivierung werden Request-ID, Baum, Quellversion, explizites ganzzahliges `pointBudget`, technischer Charakterkontext, Planungsmodus und Zielprofil verlangt. Budget wird nie aus Level, Quests oder Aszendenzpunkten abgeleitet.

Weitere kontrollierte Felder sind explizite Start-ID, vorbereiteter Graph plus dessen Quellversion, Allocated/Blocked/Required/Excluded-IDs, erlaubte Knotentypen, Targetinggrenze, Kandidatenpool, maximale Ziele, Mindestscore/-Confidence und Keystone-Reoptimierungsfreigabe. Die Adaptergrenze ergänzt ausschließlich das bereits normalisierte `BuildProfile` und den vorhandenen `AnalyzerContext`.

## Start- und Versionsvertrag

Die Pipeline löst den Start unverändert über explizite technische Node-ID oder genau eine offizielle `classStartIndex`-Zuordnung auf. Namen, Geometrie, Standardklasse und „erster Treffer“ sind ausgeschlossen. `sourceVersion` muss mit `passiveTree.metadata.releaseTag` übereinstimmen. Ein vorbereiteter Graph benötigt zusätzlich `passiveGraphSourceVersion`; abweichende Versionen werden vor dem Pipelineaufruf als `prepared-graph-source-version-mismatch` abgelehnt. Pipelinecodes, Stufen und Node-IDs bleiben unverändert.

## Graphlebenszyklus und Cacheentscheidung

Ohne Graph baut die Pipeline innerhalb des Laufs genau einmal. Mit passendem vorbereiteten Graph meldet sie `provided`, `graphReused:true` und `graphBuildCount:0`. Mehrere Profile dürfen denselben unveränderlichen Graphen verwenden, besitzen aber getrennte Budgets, Required-Ziele, Ergebnisse und Hashes.

Es gibt bewusst keinen globalen In-Memory-Cache: Der aktuelle `PassiveGraph` besitzt keine eigene stabile Baumhash-/Graphformat-Metadatenhülle. Ein globaler Cache würde Testvorzustand und Releaseidentität unnötig riskieren. Eigentümer ist der Aufrufer; explizite Wiederverwendung ist deterministisch und invalidierbar. Ein späterer Cache benötigt eine versionierte Graphhülle mit Release, Baumhash und Graphformatversion.

Targeting wird ebenfalls nicht gecacht. Textklassifikation ist teilweise baumabhängig, Profilabgleich, Eligibility, Scores, Confidence und Rankings sind profilabhängig. Eine sichere Trennung wäre eine eigene Optimierungsaufgabe; 5I verändert keine Fachlogik.

## Ergebnis- und Statusvertrag

`BuildAnalysis.realPassivePlanning` bleibt optional und enthält `enabled`, Integrationsstatus, das vollständige unveränderte `RealPassivePipelineResult`, unveränderte Violations sowie getrennte Laufzeitdiagnosen. Reale und synthetische Passive-Ergebnisse stehen in unterschiedlichen Feldern und werden weder zusammengeführt noch priorisiert.

Abbildung: `complete → completed` (mit Warnings `completed-with-issues`), `partial`/`budget-exhausted`/`no-eligible-targets → partial`, Eingabe-/Versions-/Startfehler → `invalid-input`, fachliche Blockierung/Required-Fehler → `blocked`, unerwartete Ausführungsfehler → `failed`. Vorvalidierungsfehler besitzen kein scheinbares Pipelineergebnis. Kontrollierte Pipelineergebnisse und Teilresultate bleiben erhalten. Ein unerwarteter geworfener interner Fehler folgt dem bestehenden fatalen Orchestratorpfad.

## Diagnosen, Determinismus und Sicherheit

Der Adapter verändert keine Pipelinecodes. Required-Diagnosen, Quellmodule, Stufen und optionale Node-IDs bleiben im eingebetteten Ergebnis. Alle vorhandenen Grenzen für Baumgröße, Budget, Kandidatenpool, Ziele, Iterationen und Pfadsuchen bleiben in Pipeline/Planner maßgeblich.

Der fachliche Pipelinehash wird unverändert übernommen. Zeiten, Ergebnisgröße, Plattform und Speicher sind nicht Teil dieses Hashes. Graphwiederverwendung ändert weder ausgewählte Ziele noch den Hash. Mehrere Läufe erzeugen getrennte Resultatobjekte.

## Laufzeitmessung

Einzellauf am 21. Juli 2026, Windows x64, Node v24.14.0, offizieller Baum 0.5.2, Pool 10, ein Ziel, Budget 15:

| Messung | Wert |
|---|---:|
| Orchestrator ohne reale Pipeline | 47,50 ms |
| Orchestrator mit neuem Graph | 3.272,16 ms |
| Graphaufbau separat | 318,63 ms |
| Orchestrator mit vorbereitetem Graph | 2.697,38 ms |
| Pipeline im wiederverwendeten Lauf | 2.243,09 ms |
| Targeting darin | 1.976,99 ms |
| Planning darin | 202,32 ms |
| Eingabe-/Ausgabevalidierung | 0,03 / 0,04 ms |
| zwei Läufe mit gemeinsamem Graph | 5.422,55 ms |
| drei Profile mit gemeinsamem Graph | 7.901,55 ms |
| ausgewertete Knoten / Pfadsuchen | 5.150 / 10 |
| serialisierte Pipelineausgabe | 34.896.050 Bytes |
| beobachtete Heap-Differenz des gesamten Harness | 234,07 MiB |

Aktivierung erhöht die synchrone Laufzeit deutlich. Graphwiederverwendung spart den Aufbau, Targeting bleibt jedoch der dominante Aufwand und wird je Profil wiederholt. Die große vollständige Ausgabe ist ein Speicher-/Transfer-Risiko für eine spätere UI-Anbindung. Es besteht keine globale Optimalitätsbehauptung; `heuristic` bleibt sichtbar.

## Grenzen und nächste Stufe

Keine UI-Anbindung, Pfadvisualisierung, Node-Aktivierung, Punkteingabe im UI, Aszendenzplanung, Batch-API, Persistenz, Browserstorage oder DPS. Der synthetische Passive Analyzer bleibt unverändert. Der nächste zulässige Schritt ist ein gesonderter 5J-Auftrag; vor einer UI-Anbindung sollten Worker-/Ausführungsstrategie und eine profilunabhängige Klassifikationsschicht separat geprüft werden.
