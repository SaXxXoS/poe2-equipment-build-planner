# Deterministische Pfadsuch-Grundlage für den PoE2-Passivbaum

## Verantwortung und Grenze

`src/engine/passive-pathfinding/` baut aus dem normalisierten offiziellen Baumstand 0.5.2 einen unveränderlichen, wiederverwendbaren Graphen und beantwortet ausschließlich vorgegebene Pfadanfragen. Das Modul wählt keine fachlich geeigneten Ziele, bewertet keinen Nutzen, optimiert keinen Build und ist weder an den synthetischen Passive Analyzer noch an React oder die Baumansicht angebunden. Es führt keine Netzwerkzugriffe aus.

## Graphmodell

Jeder Graphknoten enthält technische ID, deterministisch sortierte Nachbarn, kontrollierten Knotentyp, Klassenstartindizes, Aszendenz-ID, Sockelstatus, Aktivstatus, optionale Waffen-Set-Markierung und Traversierungskosten. Jede ungerichtete Verbindung wird über ein kanonisches Knotenpaar genau einmal geführt. Der Builder prüft doppelte IDs und Kanten, unbekannte Referenzen, fehlende Verbindungen sowie ungültige Kosten. Eine in den offiziellen Nachbarlisten deklarierte Selbstnachbarschaft wird kontrolliert ignoriert; eine echte Selbstverbindung im Verbindungsbestand blockiert das Graphmodell. Die Quelldaten werden weder sortiert noch anderweitig verändert.

Der offizielle Graph enthält 5.150 Knoten und 6.067 Verbindungen. Ein gebautes `PassiveGraph` kann für beliebig viele Anfragen wiederverwendet werden.

## Kostenmodell und Punktbudget

Die zentrale Konfiguration steht in `config.ts`. Normale, Notable-, Keystone-, Ascendancy- und Juwelsockelknoten kosten standardmäßig je einen Punkt. Technische Klassen- und Aszendenzstarts kosten null. Explizite, nichtnegative ganzzahlige Quellkosten dürfen diese Vorgabe ersetzen. Der Startanker und bereits belegte Knoten verursachen keine zusätzlichen Kosten; Zielknoten werden wie jeder andere neu belegte Knoten berechnet. Blockierte, deaktivierte, typfremde oder nicht freigegebene Aszendenzknoten werden nicht traversiert.

Das Ergebnis trennt traversierte, neu belegte und wiederverwendete Knoten sowie `totalPointCost` und Kantenlänge. Ein ungültiges Budget blockiert die Anfrage. Bei einem gültigen, aber zu kleinen Budget bleibt der technisch gefundene Pfad nachvollziehbar erhalten und erhält Status `over-budget` sowie eine blockierende Violation.

## Algorithmus und Tie-Breaker

Einzelzielanfragen verwenden einen deterministischen Dijkstra-Algorithmus mit Binär-Heap. `shortest-path` priorisiert die Kantenlänge; `lowest-cost-path` priorisiert die konfigurierten Punktkosten. Bei gleichen Kosten gelten stabil: weniger neu belegte Knoten, kürzerer Pfad und anschließend die lexikografisch kleinere Folge technischer Node-IDs. Der Algorithmus verwendet weder Zufall noch Heuristik, A* oder einen fachlichen Nutzen-Score. Gleiche Graph- und Anfragewerte erzeugen strukturell identische Ergebnisse einschließlich einer stabil abgeleiteten Request-ID.

`PassivePathResult` liefert die geordneten Knoten und Verbindungen, Kosten-/Wiederverwendungszähler, Erreichbarkeit, Budgetstatus, Algorithmus- und Tie-Breaker-Angabe, Warnungen, Violations, Status und Version.

## Mehrzielstrategie

`connect-targets` wählt keine Ziele aus. Die explizit übergebenen Ziele werden schrittweise an den bereits verbundenen Teilbaum angeschlossen. In jedem Schritt werden alle noch offenen Ziele und vorhandenen Anker deterministisch verglichen; gewählt wird der geringste zusätzliche Pfad nach denselben Kosten-, Längen- und ID-Tie-Breakern. Gemeinsame Knoten und Kanten werden wiederverwendet und nur einmal in den Gesamtkosten geführt.

Das Resultat dokumentiert Zielergebnisse, zusammengeführten Teilbaum, Verbindungsreihenfolge und Strategie. `optimalityClaim` ist bewusst `shortest-per-step`: Es handelt sich nicht um eine globale Steiner-Tree-Optimierung und es wird keine globale Optimalität behauptet.

## Aszendenz- und Waffen-Set-Grenzen

Ein Knoten mit Aszendenz-ID ist nur traversierbar, wenn exakt diese ID in der Anfrage angegeben ist. Damit bleiben Aszendenzbereiche ohne Kontext und fremde Bereiche gesperrt. Die Eintrittsknoten unterliegen derselben Prüfung und können nicht als Abkürzung durch einen fremden Bereich dienen. Unklare Zuordnungen werden nicht erraten.

Der Anfragevertrag führt einen optionalen Waffen-Set-Kontext. Der offizielle Export 0.5.2 enthält keine Waffen-Set-Zuordnung pro Knoten; deshalb wird keine solche Eigenschaft erfunden. Bei später strukturell gelieferten expliziten Zuordnungen blockiert die Traversierung ein fremdes Set.

## Fehlerfälle

Blockierend behandelt werden insbesondere unbekannte oder blockierte Start-/Zielknoten, leere oder doppelte Ziele, ungültige Referenzen/Verbindungen/Kosten, deaktivierte Knoten, unzulässige Typen oder Aszendenzen, unerreichbare Ziele und ungültige Budgets. Eine Budgetüberschreitung wird gesondert als `over-budget` gemeldet. Das Modul wirft nur beim Aufbau eines fehlerhaften Graphmodells einen `PassiveGraphError`; Anfragefehler erscheinen strukturiert im Ergebnis.

## Performancebeobachtung

Messumgebung: Windows x64, Node.js 24.14.0, Vitest 3.2.7, vollständiger offizieller Release-0.5.2-Graph. Zwei unmittelbar nacheinander ausgeführte Einzelmessungen ergaben:

| Vorgang | Beobachtung |
| --- | ---: |
| Graphaufbau | 329,84–336,35 ms |
| ein entferntes Einzelziel, `lowest-cost-path` | 316,35–318,77 ms |
| zehn getrennte entfernte Einzelziele | 2.973,83–3.040,55 ms |
| vier Ziele, schrittweise Teilbaumverbindung | 2.230,54–2.293,60 ms |
| beobachtete Heap-Differenz nach Graphaufbau | etwa 6,54–6,55 MiB |
| beobachtete Heap-Gesamtdifferenz nach Suchen | etwa 28,34–62,77 MiB |

Die Speicherwerte sind Momentaufnahmen des Node-Heaps ohne erzwungene Garbage Collection und deshalb keine stabile Verbrauchsgarantie. Bei gleichzeitiger Last der vollständigen parallelen Testsuite wurden 633,33 ms / 763,90 ms / 4.101,72 ms / 2.290,96 ms und 28,41 MiB Heap-Gesamtdifferenz beobachtet. Die Zeitwerte sind Entwicklungsrechner-Beobachtungen, keine Produktgrenzwerte. Der Graph sollte einmal aufgebaut und wiederverwendet werden; wiederholte Suchen erzeugen weiterhin merkliche temporäre Allokationen durch vollständige, nachvollziehbare Pfadfolgen.

## Nicht enthalten

Keine fachliche Zielauswahl, Buildoptimierung, automatische Punkteverteilung, Cluster-Juwel-Pfade, DPS-Berechnung, Analyzer-/Orchestrator-Integration, UI-Markierung oder Änderung der sichtbaren Baumansicht. Diese Schritte benötigen jeweils einen getrennten Auftrag.
