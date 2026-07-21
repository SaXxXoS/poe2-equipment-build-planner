# Reale Passive-Analyse in der React-UI (5K)

## Ziel, Audit und Eingaben

5K bindet ausschließlich den öffentlichen 5J-Worker-Client an React. `App` hält Charakter, Klasse, Aszendenz, Level, Ziel, Equipment/Affixe und Skillsetups. Der Juwel-Picker bleibt lokaler Komponentenstate; Required-Ziele und fachliche Passive-Filter besitzen keine eindeutige UI-Auswahl und werden deshalb nicht erfunden.

Neu sind nur das explizite normale Punktebudget (1–123) und `value-first`, `efficiency-first` oder `balanced`. Budget wird nie aus Level, Quests oder Aszendenzpunkten abgeleitet. Das Register muss einen eindeutigen unterstützten Start bestätigen; anschließend löst die bestehende Pipeline ihn über den offiziellen `classStartIndex` auf. Eine Exportkennung wird nicht fälschlich als technische Node-ID verwendet. Source `0.5.2`, Baumidentität und Vertragsversionen sind gepinnt und nicht editierbar.

## React-Laufzeitgrenze und Lebenszyklus

`createPassiveAnalysisController` ist die einzige React-nahe Laufzeitgrenze. `RealPassiveAnalysis` besitzt genau eine Controllerinstanz und entsorgt sie beim Unmount. Der Worker wird erst durch „Analyse vorbereiten“ erzeugt, einmal initialisiert und in derselben Sitzung wiederverwendet. Änderungen erzeugen keinen Worker und starten keine Analyse.

Ein aktiver Abbruch terminiert den Worker hart, verwirft Teilresultate und verlangt eine sichtbare Neuinitialisierung. Retry entsorgt die alte Instanz und initialisiert genau einen neuen Client. Reload beendet die Sitzung; Storage und Service Worker existieren nicht.

## Adapter, Zustand und stale

`buildRealPassiveWorkerRequest` kopiert validierte UI-Daten in genau eine Anfrage. Compact wird im Worker erzwungen; Required-Ziele bleiben leer und der Quellstate wird nicht mutiert. Eine deterministische FNV-1a-Signatur umfasst Charakter, Equipment, Skillsetups, Budget und Planning-Modus. Visuelle Bauminteraktionen fehlen bewusst.

Zustände sind `uninitialized`, `initializing`, `ready`, `analyzing`, `cancelling`, `completed`, `cancelled`, `failed`, `stale` und `disposed`. Relevante Änderungen markieren ein Ergebnis sichtbar als stale. Request-IDs und Worker-Generationen verhindern das Überschreiben durch Antworten terminierter Worker.

## Fortschritt, Fehler und Accessibility

Die UI übersetzt nur echte Worker-Stufen zentral ins Deutsche und zeigt keine Prozentwerte. Laufzeit-, Protokoll-, Versions-, Timeout-, Klassenstart- und Budgetfehler werden von fachlichen Teilresultaten getrennt; Stacktraces erscheinen nicht. Status verwendet `aria-live`, Fehler `role=alert`, Eingaben besitzen Label/Hilfetext und Aktionen sind tastaturbedienbar.

## Compact-Ergebnis

Gezeigt werden Status, Budget/Verbrauch/Rest, Ziel-/Pfad-/Knotenzahlen, maximal acht Ziele mit Exportname und ID, Reihenfolge, Punktekosten, Pfadlänge, Confidence und Reasons, Required-Diagnosen, unresolved Stats, begrenzte Issues, Source-Version und optionaler Hash. Pfade werden nur zusammengefasst; Knoten, Kamera und Auswahl bleiben unverändert. Ein sichtbarer Heuristikhinweis schließt globale Optimalität aus.

## Mobil, Performance und Grenzen

Responsive Grids, mindestens 46-Pixel-Controls, umbrechende Aktionen und begrenzte scrollbare Listen unterstützen 390×844 und 430×932 ohne Vollbildblocker. Baum und Navigation bleiben bedienbar. Lokaler Desktop-Pages-Lauf: Initialisierung 2.113 ms, erste Analyse 8.900 ms, zweite Analyse mit wiederverwendetem Graph/Context 9.673 ms und harter Abbruch bis zum UI-Zustand 1.139 ms. Compact bleibt ungefähr 718 kB; Budget 20 ergab zwei Ziele, acht Knoten und `partial`. Transfer und React-Commit ließen sich nicht zuverlässig separat isolieren und werden nicht erfunden. Aus 5J bleibt die maximale beobachtete 10-ms-Timerdrift 1,30 ms.

iOS kann Worker bei Hintergrundwechsel oder Speicherdruck beenden. Physische iPhone-Abnahme bleibt offen. Nicht enthalten: Pfadvisualisierung, Punktebelegung, automatische Budgetableitung, Fotoerkennung, Buildvergleich, Redesign oder Aufgabe 5L.
