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

## Nachbesserung 5K.1 – identische Wiederholungen

Die 8,9–9,7 Sekunden wurden mit der tatsächlichen UI-Anfrage reproduziert. Die Ursache war weder React noch eine doppelte Nachricht: `candidatePoolLimit: 50` und `maximumSelectedTargets: 20` führen in der unveränderten Planning-Stufe zu rund elf Sekunden Arbeit. Eine instrumentierte Node-Reihe maß 11.511,25 ms Workerzeit, davon 11.211,82 ms Planning, 193,05 ms Targeting, 0,62 ms Compact-Projektion und 3,79 ms Serialisierung. Graph- und Context-Aufbauten waren jeweils null; sonstige Orchestratorarbeit lag aus der Differenz bei rund 19,56 ms. Diese Anfrage ist deshalb nicht mit der früheren 5I.1-Einzelziel-/Pool-10-Messung vergleichbar.

Der UI-Controller verwendet nun die vollständige Eingabesignatur als stabile Request-ID. Der sitzungsweite Worker hält genau den letzten Compact-Plan zusammen mit dem vollständigen serialisierten Analyze-Payload als Vergleichsschlüssel. Nur ein bytegleiches validiertes Payload ist ein Treffer; dann wird das unveränderte Ergebnis ohne zweiten Orchestratorlauf zurückgegeben. Jede Änderung an Charakter, Ausrüstung, Skills, Budget oder Planungsmodus ist ein Miss und durchläuft unverändert die vollständige Fachpipeline. Reinitialisierung, harter Abbruch und Dispose löschen den Eintrag. Es gibt weder globalen Cache noch Storage oder releaseübergreifende Wiederverwendung.

Der Request umfasst 16.882 B und enthält weder Baum, Graph, Prepared Context noch Assets. Das gemessene Compact-Ergebnis umfasst 804.888 B; Full und `targetingResult` verlassen den Worker weiterhin nicht. Sechs identische Läufe ergaben durchgehend `fnv1a32-5d6ef45a`; der erste Lauf rief den Orchestrator einmal auf, fünf Treffer jeweils nullmal. Pro Nutzeraktion wird genau eine Workeranfrage gesendet, es gibt keinen Strict-Mode-/Effect-Aufruf. Der verbleibende relevante Risikopunkt ist ausdrücklich: Eine fachlich geänderte Eingabe bleibt wegen der unveränderten 50/20-Planung langsam. Aufgabe 5L wurde nicht begonnen; die physische iPhone-Abnahme bleibt offen.

Lokaler Pages-Produktionsbrowser am 21. Juli 2026: Eine geänderte Budget-21-Anfrage benötigte 9.439 ms bis zur abgeschlossenen UI, davon 9.032,80 ms gemeldete Workerzeit. Fünf anschließende identische UI-Läufe waren einschließlich einer absichtlichen 250-ms-Sicherheitswartezeit und Browserautomations-Overhead nach 654/630/661/619/627 ms abgeschlossen (Median 630 ms); der Worker meldete 0,00–0,20 ms und jedes Mal `cacheHit:true`. Die verbleibende obere Differenz enthält zusammen Structured Clone, Message-Empfang, React-State/Render, die Sicherheitswartezeit und Teststeuerung und ist daher keine reine Transferzeit. Ein veränderter Budget-22-Lauf ließ sich hart abbrechen; die UI zeigte den Neuinitialisierungsweg nach 514 ms. Die Ergebnisansicht blieb vollständig, der Browser meldete keine Console-Warnungen oder -Fehler.

Die angeforderte Browser-Viewport-Überschreibung auf 390×844 wurde vom verfügbaren In-App-Browser nicht wirksam übernommen (gemessen weiterhin 1280×720/1265 Dokumentbreite). Deshalb wird keine mobile Automation behauptet. Die vorhandenen Responsive-Tests bleiben grün; Scroll während Analyse und horizontaler Überlauf bei exakt 390×844 sowie die gesamte physische iPhone-Abnahme sind offen.
