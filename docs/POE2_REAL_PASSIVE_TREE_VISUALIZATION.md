# Reale Passive-Planvisualisierung im Baum (5L)

## Ziel und Ausgangsstand

5L zeigt ausschließlich das bereits berechnete Compact-Ergebnis der realen Passive-Analyse im offiziellen Baum. Der Browser berechnet keinen Pfad, kein Budget, keine Zielreihenfolge und keine Verbindung neu. Targeting, Pathfinder, Planner, Pipeline und Haupt-Orchestrator bleiben fachlich unverändert.

## Compact-Datenvertrag

Verwendet werden `plan.startNodeId`, geordnete `selectedTargetIds`, `selectedTargets[].pathNodeIds`, deduplizierte `allocatedNodeIds` und `allocatedConnectionIds`, `requiredTargetDiagnostics`, Budget/Teilstatus, `sourceVersion` und `pipelineDiagnostics.deterministicResultHash`. Compact enthält keine allgemeine Liste aller blockierten Kandidaten und keine zielweise Connection-ID-Liste. Deshalb werden ausschließlich durch Required-Diagnosen eindeutig belegte blockierte oder nicht erreichbare Ziele markiert; weitere Zustände werden nicht erraten.

## Adapter und Validierung

`buildPassivePlanVisualization` in `src/tree-view/plan-visualization.ts` ist die einzige Grenze. Sie erzeugt Sets/Maps für Start, Ziele, Required-Ziele, belegte Knoten/Kanten, Pfadsegmente, Reihenfolge, Rollen und Issues. Sie prüft Source-Version und Hash, jede Node-/Connection-ID, Kantenendpunkte, aufeinanderfolgende Pfadsegmente, Erreichbarkeit des belegten Teilbaums vom Start sowie Aszendenz-, Layout- und Effektgrenzen. Duplikate werden nur durch Sets normalisiert und als Darstellung nicht mehrfach gerendert. Fehlende Referenzen werden nie still ignoriert. Source-Mismatch, fehlender Hash oder fehlender Start blockieren die Visualisierung; andere Inkonsistenzen werden als Visualisierungs-Issues gemeldet. Das Quellresultat wird nicht mutiert.

## Rollen und Priorität

Knotenrollen: `normal`, `plan-start`, `plan-path`, `plan-target`, `plan-required-target`, `plan-selected-target`, `plan-blocked-target`, `plan-unreachable-target`, `plan-overlap`, `inspected`, `searched`, `dimmed`. Sichtbare Priorität: nicht erreichbar, blockiert, Required, ausgewähltes Ziel, Ziel, Überschneidung, Start, Pfad, Inspektion, Suche, dimmed, normal.

Verbindungsrollen: `normal`, `plan-path`, `plan-required-path`, `plan-overlap`, `hidden-effect`, `layout-transition`, `unknown`. Der aktuelle Compact-Vertrag erlaubt keine fachlich belastbare zielweise Required-Pfadzuordnung; deshalb werden echte belegte Kanten einheitlich `plan-path`. Layoutübergänge, Mastery-/HideConnection-Effekte und unbekannte Typen werden auch dann nicht eingeblendet, wenn eine fehlerhafte Ergebnisreferenz sie nennt.

## Darstellung und Interaktion

Der vorhandene Verbindungspfad aus `resolveTreeConnectionGeometry` wird ein zweites Mal als dünnes, nicht interaktives Overlay gezeichnet. Gerade Kanten bleiben gerade, Orbitbögen behalten exakt dasselbe `d`; normale Grundlinien bleiben darunter erhalten. Gemeinsam genutzte Connection-IDs ergeben genau ein Overlay. Knotenmotive, offizielle Rahmen, Größe und Position bleiben unverändert; außenliegende Ringe, Linienstil und Zielnummern bilden die Zusatzebene. Overlayelemente besitzen `pointer-events:none`, Knoten bleiben fokussier- und antippbar. Inspektion ergänzt Planrolle und Zielreihenfolge.

Markierungen sind nicht nur farblich: Start/Required/stale verwenden unterschiedliche Strichmuster, Zielnummern und deutsche ARIA-Zusätze; die semantische Legende erklärt Startpunkt, geplanten Weg, empfohlenes Ziel, Pflichtziel, blockiert/nicht erreichbar und stale.

## Teilresultat, stale und Lebenszyklus

`completed` zeigt den validierten Plan; ein fachliches `partial` innerhalb dieses abgeschlossenen Workerresultats zeigt seine gültigen Teilpfade zusammen mit dem vorhandenen Teilstatus. Während Initialisierung, Ready ohne Ergebnis, Analyse, Cancel, Fehler oder ungültigem Vertrag wird kein Plan gezeigt. Bei Eingabeänderung bleibt das letzte Ergebnis im Zustand `stale` sichtbar, aber gestrichelt, gedimmt und textlich als „Veralteter Plan“ bezeichnet. Eine neue Analyse blendet den alten Plan aus und ersetzt ihn erst atomar nach Erfolg. Request-/Worker-Generationsschutz aus 5K bleibt maßgeblich.

## Kamera und Bedienung

Es gibt keine automatische Kamerabewegung nach Ergebnisempfang. „Plan im Baum anzeigen“ macht den Plan sichtbar, berechnet ausschließlich Darstellungsbounds seiner bereits belegten Nicht-Aszendenzknoten und setzt die Kamera einmalig innerhalb der bestehenden Zoomgrenzen. Danach überschreibt kein Effect Pan, Pinch oder Wheel. Gesamtansicht, Suche, Filter, Klassen-/Aszendenznavigation und Inspektion bleiben unverändert. Filterdimmen unterdrückt einen Planring nicht.

## UI, Performance und Grenzen

Der Ergebnisbereich zeigt Plan ein/aus, Kameraaktion, Legende, belegte Knoten, hervorgehobene Verbindungen und aktuell/stale. Alle neuen Texte sind deutsch. Die Visualisierung löst weder Workeranfrage noch Analyse aus. Sie hält nur ID-Sets/Maps und kleine Pfadsegmente; Baum und Graph werden nicht kopiert. Zusätzliche SVG-Elemente: höchstens eine Pfadkopie je tatsächlich belegter, sichtbarer Kante, ein Ring je markiertem sichtbaren Knoten und eine Nummer je Ziel. Zoom/Pan ändern nur die ViewBox; der Adapter ist über Resultatobjekt und Baum memoisiert.

Allgemeine blockierte Kandidaten, separate Required-Pfadfarben, manuelle Belegung, automatische Punktableitung und Aszendenzplanung sind mangels Vertrag beziehungsweise Auftrag nicht enthalten. Mobile Risiken bleiben das bereits große SVG-DOM, Filtereffekte und WebP-Decodierung in iOS Safari. Die physische iPhone-Abnahme ist offen und darf nicht als bestanden gelten.

## Produktionsbrowserprüfung

Lokaler Pages-Build bei 1280×720 effektiv/1265 Pixel Dokumentbreite: Analyse 9.533 ms, fachlicher Status `partial`, 8 belegte Knoten, 7 belegte Verbindungen und 2 Ziele. Der Adapter erzeugte exakt 8 Ring-, 7 Connection- und 2 Reihenfolge-Overlays; das SVG hatte danach 17.974 Nachfahren. Dokumentbreite und Scrollbreite waren beide 1.265 Pixel. Planfokus änderte die ViewBox nur nach Button, anschließender manueller Zoom blieb stabil. Ausblenden/Einblenden, Suche und Keystone-Filter erhielten alle acht Markierungen. Zielinspektion per Tastatur zeigte Rolle und Reihenfolge; eine echte Touchgeste stand nicht zur Verfügung. Der stale Wechsel durch Budget 20→21 erhielt 8 gedimmte Knoten- und 7 gestrichelte Kantenmarkierungen mit deutscher Statusmeldung. Zwei durch die Browserautomation gesteuerte Umschaltungen benötigten zusammen 1.035 ms; dies enthält erheblichen Steuerungs-/IPC-Overhead und ist keine reine React-Renderzeit. Console-Warnungen/-Fehler: null; sichtbare Asset-, Worker- oder Daten-404: null.

Die angeforderte Viewport-Capability wurde auf 390×844 gesetzt, aber der verfügbare Browser blieb messbar bei 1280×720. Deshalb werden weder 390×844 noch 430×932 als mobile Automation bestanden behauptet. Die statischen Responsive-Regeln und automatischen Komponenten-/Gestentests sind grün; mobile Touch-, Scroll-, Pinch-/Pan- und Überlaufabnahme bleiben offen.

## Nächster Schritt

Nach Nutzerabnahme auf dem physischen iPhone können spätere Datenaufgaben getrennt geplant werden. Sichtbare Affix-, Skill- und Supportnamen/-beschreibungen müssen deutsch sein; PoE2DB ist dafür nur als zu prüfende deutsche Referenz vorgesehen, nicht automatisch als technische ID- oder Fachwahrheit. Aufgabe 5M wurde nicht begonnen.
