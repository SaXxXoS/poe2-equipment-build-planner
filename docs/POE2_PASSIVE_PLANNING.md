# Begrenzte Passive-Planung (Aufgabe 5G)

## Verantwortung und Grenzen

`src/engine/passive-planning/` verbindet ausschließlich vorbereitete `PassiveTargetRecommendation`s mit Kosten des bestehenden `passive-pathfinding`. Das Ergebnis ist ein begrenzter zusammenhängender Teilbaum unter einem normalen Punktebudget. Der Planer klassifiziert keine Texte, berechnet keine Targeting-Kategorien neu, erfindet keine Ziele und enthält keinen Pfadsuchalgorithmus.

Die Strategie ist eine deterministische schrittweise Heuristik. `optimalityClaim: heuristic` schließt globale Build-, Steiner-Tree- oder kombinatorische Optimalität aus. Passive Analyzer, Orchestrator, React-UI und Baumdarstellung importieren den Planer nicht. DPS, Skills, Supports, Equipment, Juwelbelegung, Cluster-Juwele und Level-für-Level-Planung liegen außerhalb von 5G.

## Eingabevertrag

`PassivePlanningInput` enthält Request-ID, `BuildProfile`, Klasse, optionale Aszendenz, Klassenstart, Punktebudget, Zielprofil (`mapping`, `boss`, `balanced`), vorbereitetes `PassiveTargetAnalysis`, wiederverwendbaren `PassiveGraph`, optionale belegte/blockierte/erforderliche/ausgeschlossene IDs, Ziel- und Poolgrenze, Mindestscore/-Confidence, Planungsmodus, `AnalyzerContext` und Quellversion. `allowReoptimizationTargets` gibt entsprechend markierte Ziele ausdrücklich frei. Ein optionaler Cache aus `createPassivePlanningPathCache()` darf kontrolliert zwischen identischen Planungen geteilt werden.

Der Validator blockiert fehlende IDs, unbekannte oder falsche Starts, negative/zu hohe Budgets, ungültige Limits, Duplikate, widersprüchlich blockierte Pflichtziele, zu viele Pflichtziele und abweichende Targeting-Quellversionen.

## Kandidatenpool

Der Pool entsteht nur aus `targetingResult.allCandidates`. Vor der ersten Suche werden blockierte, deaktivierte/unbekannte Knoten, Klassen-/Aszendenzstarts, sämtliche Aszendenzknoten, reguläre Juwelsockel, ausgeschlossene IDs, Empfehlungen unter Score/Confidence und nicht freigegebene Reoptimierungsziele entfernt. Ein Juwelsockel passiert nur als Required-Ziel; eine Belegung findet nicht statt.

Die frühe zentrale Grenze beträgt 50. Sortiert wird nach Required, relevanter Modusbewertung, `totalScore`, Confidence und technischer Node-ID. Doppelte Node-IDs werden entfernt.

## Nutzenmodell

Der Planer kombiniert ausschließlich vorhandene Zahlen: `targetValue = totalScore`, `profileValue = profileSynergyScore` und `modeValue = mappingScore`, `bossScore` oder deren Mittelwert. Eine zentrale Gewichtung und der Confidence-Faktor bilden `confidenceAdjustedValue`. Nur vorhandene Konfliktfelder/-tags/-knoten, unresolved Stats, Reoptimierung und Redundanz erzeugen Abzüge. Sämtliche Gewichte und Abzüge stehen in `config.ts`. Das ist ein Planungswert, keine erneute Statklassifikation.

## Kosten, Effizienz und Pfadwiederverwendung

Für jeden Kandidaten ruft der Planer `findPassivePath` in `lowest-cost-path` von jedem Knoten des aktuellen Teilbaums auf und übernimmt den günstigsten Anschluss. Aszendenztypen sind nicht erlaubt. Vorbelegte und neu hinzugefügte Knoten werden als belegt übergeben, sodass gemeinsame Pfadteile keine Zusatzpunkte kosten.

Ausgewiesen werden Pfadkosten, neue/wiederverwendete Knoten, Pfadlänge, Restbudget, `valuePerPoint`, `incrementalValuePerPoint`, Budgetanteil und Wiederverwendungsquote. Bei Kosten null gilt der zentrale Divisor 1; es entsteht kein unendlicher Wert.

Der Cache-Schlüssel umfasst Graphversion, Anker, Ziel, komplette aktuelle Belegung und blockierte IDs. Identische Requests werden dadurch nicht wiederholt und verschiedene Teilbaumstände nicht vermischt. `pathSearchCount` und `pathCacheHitCount` machen dies sichtbar.

## Modi und Auswahlstrategie

`value-first` priorisiert absoluten Nutzen, Profil und Confidence. `efficiency-first` priorisiert Nutzen je Zusatzpunkt, kurze Pfade und Wiederverwendung. `balanced` verbindet beide. Alle Gewichte liegen zentral.

Required-Ziele werden zuerst in stabiler ID-Reihenfolge validiert und verbunden. Fehlende, ungültige, unerreichbare oder zu teure Pflichtziele blockieren ausdrücklich. Danach werden alle verbleibenden Kandidaten am aktuellen Teilbaum bewertet, der beste zulässige positive Kandidat übernommen und alle verbleibenden Kandidaten wegen geänderter Wiederverwendung neu bewertet. Abbruch: Budgetende, Zielgrenze, kein positiver Kandidat oder Sicherheitsgrenze.

## Redundanz, Konflikte und Keystones

Redundanz nutzt nur vorhandene `redundantWithNodeIds`, gleiche Tag-Signaturen und dominante vorhandene Scorekategorien. Explizite/nahezu identische Wirkung erhält einen starken, eine ähnliche dominante Kategorie einen kleineren Abzug. Konflikte werden nicht neu interpretiert; ausschließlich `conflictingTags`, `conflictingProfileFields` und `conflictingNodeIds` zählen.

Keystones erfüllen alle Pool- und Confidence-Regeln. `requiresReoptimization` erfordert die explizite Freigabe. Jede Auswahl trägt `keystone: true`, eine Review-Warnung und die vorhandenen Trade-offs.

## Aszendenz- und Budgetgrenze

5G besitzt kein separates Aszendenzbudget. Deshalb sind alle Aszendenzstarts/-knoten aus Kandidaten und Pfadtypen ausgeschlossen, auch bei passender Aszendenz. Normale Punkte bezahlen nie Aszendenzen; diese bilden keine Abkürzung. Eine getrennte Planung braucht einen späteren Vertrag.

`usedPointBudget` summiert inkrementelle Pathfinder-Kosten; `remainingPointBudget` wird je Schritt aktualisiert. Optionale Ziele über Restbudget werden übersprungen. Ein Required-Ziel über Budget erzeugt `required-target-over-budget`. Das Budget wird nie überschritten.

## Ergebnis, Determinismus und Sicherheit

`PassivePlanResult` enthält Budget, ausgewählte/erforderliche/übersprungene Ziele, eindeutige Teilbaumknoten/-verbindungen, neue/wiederverwendete Knoten, Ziel- und Schrittobjekte, Aggregate, Warnungsgruppen, Status, Version, Strategie, Sicherheitsindikator und Such-/Cachezähler. Status: `complete`, `partial`, `blocked`, `no-eligible-targets`, `budget-exhausted`, `required-target-unreachable`, `required-target-over-budget`, `invalid-input`.

Tie-Breaker: Planungswert, Targeting-Score, Confidence, geringere Zusatzkosten, kürzerer Pfad, technische Node-ID. Mengen sind kanonisch sortiert; Zufall, Uhrzeit und Netzwerkzustand fehlen. Ein geteilter Cache ändert nur Diagnosezähler, nicht die Auswahl.

Zentrale Grenzen: 50 Kandidaten, 12 Ziele, 123 normale Punkte, 4.000 Pfadsuchen und 12 optionale Iterationen. Überschreitungen werden blockiert oder liefern ein gekennzeichnetes Partial mit Warnung. Dies sind Schutzwerte, keine realen Produktgrenzen.

## Performance auf dem offiziellen Baum

Messung vom 21. Juli 2026, Node `v24.14.0`, Windows x64, Release 0.5.2 mit 5.150 Knoten, einmal vorbereitetem Targeting und wiederverwendetem Graphen:

| Szenario | Laufzeit | echte Pfadsuchen |
|---|---:|---:|
| 10 Kandidaten, Budget 20 | 208,48 ms | 10 |
| 25 Kandidaten, Budget 20 | 415,05 ms | 25 |
| 50 Kandidaten, Budget 20 | 811,32 ms | 50 |
| 25 Kandidaten, Budget 5 | 391,77 ms | 25 |
| 25 Kandidaten, Budget 50 | 387,15 ms | 25 |
| 25 Kandidaten, ohne warmen Cache | 387,59 ms | 25 |
| 25 Kandidaten, Cache aufwärmen | 386,38 ms | 25 |
| identische 25er-Planung, warmer Cache | 77,58 ms | 0 (25 Treffer) |

Die Heap-Differenz der Gesamtmessung einschließlich Graph, Targeting, Resultaten und Cache betrug 85,43 MiB. Das sind Beobachtungen, keine Servicegrenzen. Targeting wurde vom Planner nicht neu ausgeführt. Die Poolgrenze verhindert 5.150 Pfadsuchen je Iteration.

## Abgrenzung zu Analyzer, Orchestrator und UI

Der synthetische Passive Analyzer bleibt eine unveränderte andere Kette. Der Planer wird weder vom Orchestrator noch von React importiert, schreibt keine Daten, zeigt keine Pfade und ruft keine Analyzer auf. Produktive Adapter-, Anzeige- oder Persistenzintegration ist ein späterer Auftrag.
