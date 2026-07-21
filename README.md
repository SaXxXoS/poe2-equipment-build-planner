# PoE2 Equipment Build Planner

## Offizieller Passivbaum-Datenbestand (Aufgabe 5C)

Die in Aufgabe 5B zu strenge Sperre wurde ausschließlich für den offiziellen GGG-Passivbaumexport korrigiert. Release `0.5.2` („Runes of Aldur“) ist auf Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6` und SHA-256 `f83c94ce7b09f2bfc5b3b1d63523c2ab3d2582d0e964f6aeec34b8b0390abcfe` festgelegt.

```bash
npm run import:poe2-tree -- --release 0.5.2
npm run check:poe2-tree-update -- --release 0.5.2
```

Importiert werden ausschließlich Baumstruktur und englische Originaltexte; keine Assets, Übersetzungen oder Daten von PoE2DB/RePoE. Seit Aufgabe 5D zeigt der Baumabschnitt diesen Datenbestand über einen getrennten ViewModel-Adapter technisch an; die Engine bleibt vollständig getrennt. `latest`, `main`, fehlende oder unbekannte Versionen werden blockiert. Details: [`docs/POE2_TREE_IMPORT.md`](docs/POE2_TREE_IMPORT.md), [`docs/POE2_TREE_UPDATE_PROCESS.md`](docs/POE2_TREE_UPDATE_PROCESS.md) und [`docs/POE2_TREE_VIEW_ADAPTER.md`](docs/POE2_TREE_VIEW_ADAPTER.md). Andere echte Datenkategorien bleiben blockiert.

Seit Aufgabe 5E kann das isolierte Modul `src/engine/passive-pathfinding/` deterministische kürzeste und günstigste Pfade sowie eine schrittweise Verbindung explizit vorgegebener Ziele auf diesem offiziellen Graphen berechnen. Es trifft keine fachliche Zielauswahl, behauptet keine globale Mehrzieloptimalität und ist weder mit dem Passive Analyzer noch mit Orchestrator oder UI verbunden. Details: [`docs/POE2_PASSIVE_PATHFINDING.md`](docs/POE2_PASSIVE_PATHFINDING.md).

Aufgabe 5F ergänzt davon getrennt `src/engine/passive-targeting/`: Das Modul klassifiziert offizielle englische Namen und Statzeilen regelbasiert, gleicht sie mit einem synthetischen `BuildProfile` ab und erzeugt einzelne Zielknotenranglisten samt Confidence und gemessenem Coverage-Bericht. Es ruft keine Pfadsuche auf und erzeugt weder Zielmengen noch einen vollständigen Baum. Details: [`docs/POE2_PASSIVE_TARGETING.md`](docs/POE2_PASSIVE_TARGETING.md).

Aufgabe 5G führt vorbereitete Targeting-Ergebnisse und den vorhandenen Pathfinder in `src/engine/passive-planning/` kontrolliert zusammen. Required-Ziele werden zuerst verbunden; danach wählt der deterministische Planer unter festem Budget aus einem früh begrenzten Pool schrittweise nach `value-first`, `efficiency-first` oder `balanced`. Pfadteile werden wiederverwendet und identische Requests gecacht. Das Ergebnis bleibt heuristisch; Analyzer, Orchestrator und UI sind nicht angebunden. Details: [`docs/POE2_PASSIVE_PLANNING.md`](docs/POE2_PASSIVE_PLANNING.md).

Aufgabe 5H ergänzt den isolierten Entry Point `src/engine/real-passive-pipeline/`. Er verbindet ein normalisiertes `BuildProfile` mit dem unveränderten echten Targeting und Planner, löst den offiziellen Klassenstart auf, baut oder übernimmt genau einen Graph und validiert den budgetierten Teilbaum. Laufzeitfreie Stufendiagnosen, Required-Target-Tracking und ein deterministischer Resultathash machen den Durchlauf nachvollziehbar. Haupt-Orchestrator und UI bleiben getrennt. Details: [`docs/POE2_REAL_PASSIVE_PIPELINE.md`](docs/POE2_REAL_PASSIVE_PIPELINE.md).

Mobiler, Equipment-first ausgerichteter Build-Planer-Prototyp für Path of Exile 2. Die App zeigt direkt eine einzige lange Planer-Seite und demonstriert den vollständigen Eingabe- und Ergebnisablauf.

> **Prototyp:** Sämtliche Spieldaten und Berechnungsergebnisse sind lokale Platzhalter. Eine UI-unabhängige, deterministische Engine-Architektur mit künstlicher Testlogik ist vorhanden; es gibt keine echte Optimierungs- oder DPS-Engine und keine PoE2DB-Anbindung.

## Öffentliche Testversion

Die öffentliche Testversion ist unter [https://saxxxos.github.io/poe2-equipment-build-planner/](https://saxxxos.github.io/poe2-equipment-build-planner/) erreichbar. GitHub Pages verwendet GitHub Actions als Quelle; Abruf, Assets, Reload und Kerninteraktionen wurden am 20. Juli 2026 auf Mobil- und Desktopbreite geprüft.

Das Deployment baut bei jedem Push auf `main` automatisch mit GitHub Actions und veröffentlicht ausschließlich das erzeugte `dist`-Artefakt. Die Testversion verwendet synthetische Daten und feste UI-Platzhalter; die vorhandene Engine ist noch nicht produktiv mit der React-Oberfläche verbunden.

## Installation und Start

```bash
npm install
npm run dev
```

Produktions-Build:

```bash
npm run build
```

Maßgeblich sind npm und das eingecheckte `package-lock.json`; der CI-Build installiert reproduzierbar mit `npm ci`. Der Produktions-Build verwendet zentral den Pages-Basispfad `/poe2-equipment-build-planner/`, während der lokale Entwicklungsserver unter `/` arbeitet.

Weitere Prüfungen:

```bash
npm run test
npm run lint
npm run typecheck
```

`npm run test` führt die lokalen Vitest-Modelltests ohne Netzwerkzugriffe aus.

Künstlichen Offline-Import ausführen:

```bash
npm run import:fixture
```

Der Befehl lädt ausschließlich das synthetische Fixture, validiert Manifest, Rohdaten und Referenzen und gibt einen strukturierten Importbericht aus.

## Projektstruktur

- `src/components/` – UI-Bereiche und Dialoge
- `src/domain/` – normalisierte Domänentypen, zentrale Tags und reine Validierungsfunktionen
- `src/import/` – versioniertes Rohdatenformat, Offline-Importpipeline und künstliche Fixtures
- `data-sources/source-approval.json` – maschinenlesbare Quellen-/Kategoriefreigaben und globale Importsperren
- `src/engine/` – React-freie Analyzer-Schnittstellen, Bewertungsmodell, Orchestrator und künstliche Engine-Fixtures
- `src/engine/passive-pathfinding/` – isolierter offizieller Graph, deterministische Einzel-/Mehrzielpfade und Vertragstests
- `src/engine/passive-targeting/` – isolierte Regelklassifikation und fachliche Einzelzielranglisten für echte Baumknoten
- `src/engine/passive-planning/` – isolierte budgetbegrenzte Heuristik aus vorbereiteten Zielwerten und vorhandenen Pfadkosten
- `src/engine/real-passive-pipeline/` – isolierter realer Ablauf von BuildProfile über Targeting und Pfadsuche zum validierten PassivePlan
- `src/data.ts` – normalisierte lokale Definitionen, Konfigurationen und feste Testberechnung
- `docs/DATA_SOURCES.md` – geprüfte Datenquellen, Bedingungen, Unsicherheiten und vorläufige Empfehlung
- `docs/ENGINE_ARCHITECTURE.md` – Engine-Datenfluss, Regeln, Profile, Bewertungen und klare fachliche Grenzen
- `docs/POE2_PASSIVE_PATHFINDING.md` – Graph-, Kosten-, Algorithmus-, Aszendenz- und Performancevertrag der realen Pfadsuchgrundlage
- `docs/POE2_PASSIVE_TARGETING.md` – Textregeln, Profilabgleich, Ranglisten, Coverage und Grenzen der echten Zielknotenbewertung
- `docs/POE2_PASSIVE_PLANNING.md` – Kandidatenpool, Nutzen-/Kostenmodell, Required-Ziele, Modi, Cache, Budget und Optimalitätsgrenze
- `docs/POE2_REAL_PASSIVE_PIPELINE.md` – Pipelinevertrag, Klassenstart, Stufen, Diagnosen, Ausgabeprüfung, Hash und Performance
- `docs/ENGINE_UI_INTEGRATION_AUDIT.md` – geprüfter späterer UI-/Engine-Vertrag, Adaptergrenze und Integrationsrisiken
- `docs/DATA_SOURCE_RELEASE_AUDIT.md` – Datenbedarf, Quellenstatus und verbindliche Sperre vor echtem Datenimport
- `docs/DATA_SOURCE_APPROVAL.md` – verbindliche Quellenentscheidung, Datenmatrix und Empfehlung für Aufgabe 5C
- `docs/DATA_SOURCE_REFERENCES.md` – geprüfte Primärbelege mit Abrufdatum und Interpretationsgrenzen
- `src/styles.css` – mobile-first Oberflächengestaltung
- `AI_PROJECT/CHATGPT_PROTOCOL.md` – offizielles Projektgedächtnis und langfristiger Plan

Die Anwendung verwendet Vite, React, TypeScript, CSS und lokalen React-State. Sie besitzt bewusst kein Backend, keine Datenbank, keine Authentifizierung und kein Mehrseiten-Routing.

## Domänenmodell und stabile IDs

Technische IDs sind von deutschen Anzeigenamen getrennt. Dadurch können Beziehungen zwischen Klassen, Aszendenzen, Modifiern, Equipment, Skills, Supports, Juwelen und passiven Knoten stabil referenziert und später kontrolliert auf importierte Daten abgebildet werden. Konkrete Charakter-, Equipment- und Skill-Konfigurationen speichern ausschließlich diese IDs und ihre veränderlichen Werte.

Die bestehenden UI-/Engine-Definitionen führen gemeinsame Metadaten und bleiben `local-placeholder`. Der getrennte offizielle Passivbaum-Datenbestand besitzt eigene Quell-/Versionsmetadaten und wird von UI und Engine noch nicht verwendet; externe Laufzeit-APIs gibt es weiterhin nicht.

## Importgrundlage

Das kanonische Rohdatenformat bildet eine feste Grenze zwischen externen Quellen und dem Domänenmodell. Die reine Pipeline arbeitet ausschließlich auf übergebenen Daten, erzeugt deterministische interne IDs und Inhalts-Hashes, prüft Schema, Manifest, Kategorien, Tags, Werte, Zählungen, Duplikate und Referenzen und erzeugt erst danach Domänenobjekte. Sie führt keine Netzwerkzugriffe aus und schreibt keine Dateien.

Als einzige echte PoE2-Daten sind die kontrolliert gepinnte offizielle Passivbaumstruktur und ihre englischen Quelltexte importiert. Die Fixtures bleiben ausdrücklich künstlich. Ein breiter PoE2DB-Import bleibt blockiert.

Aufgabe 5C gibt ausschließlich sechs Kategorien des offiziellen Passivbaumexports unter den dokumentierten Bedingungen frei. RePoE, PoE2DB, Bilder, Icons und alle anderen echten Kategorien bleiben blockiert. `src/import/approval.ts` und der Baumimport prüfen die maschinenlesbare Entscheidung deterministisch.

## Engine-Architektur

Die Platzhalter-Engine folgt dem Equipment-first-Datenfluss und liefert neben Scores immer strukturierte Gründe und Regelverstöße. Der Equipment Analyzer verarbeitet zentral definierte synthetische Regeln, erstellt getrennte Profile beider Waffen-Sets, erkennt künstliche Affinitäten, Bedarfe, Konflikte sowie ungenutzte oder schwach genutzte Modifier und erzeugt daraus ein kombiniertes `BuildProfile`. Er ist nicht mit der sichtbaren UI verbunden.

Sämtliche Regeln und Schwellen sind Testkonfigurationen und keine fachlich verbindlichen PoE2-Empfehlungen. Architektur, Normalisierung, Modulreihenfolge und Grenzen sind in [`docs/ENGINE_ARCHITECTURE.md`](docs/ENGINE_ARCHITECTURE.md) beschrieben. `npm run test` prüft Domäne, Importpipeline und Engine deterministisch und ohne Netzwerkzugriff.

Der synthetische Skill Analyzer bewertet künstliche Fertigkeitskandidaten gegen Equipment-Profil, Klasse, Aszendenz, Ziel und beide Waffen-Sets. Er liefert harte Ausschlüsse, strukturierte Teilwerte, Rollen, Confidence und stabile Mapping-/Bossranglisten. Es sind keine echten PoE2-Fertigkeiten enthalten; Supports werden nicht optimiert, DPS wird nicht berechnet und die Engine ist weiterhin nicht an die UI angebunden.

Der synthetische Support Analyzer bewertet einzelne künstliche Support-Kandidaten für einen bereits ausgewählten Skill. Er prüft Tags, Schadensarten, Mechaniken, Waffen und Rollen, bewertet Build-/Zielprofil und beide Waffen-Sets, bildet Trade-offs sowie Confidence ab und liefert stabile Fachranglisten. Es sind keine echten Support-Gems enthalten; eine Support-Kombination, Sockel-/Linkoptimierung oder DPS-Berechnung findet nicht statt. Auch dieser Analyzer ist nicht an die UI angebunden.

Der synthetische Passive Analyzer bewertet einzelne Knoten und vorgegebene kleine Cluster samt vereinfachter Graphprüfung, Punktkosten, Nutzen pro Punkt, Path-Efficiency, Waffen-Sets, Trade-offs, Confidence und Fachranglisten. Er erzeugt keinen vollständigen Baum, sucht keine alternativen Pfade, bewertet keine Juwele und verwendet weder einen echten PoE2-Skilltree noch DPS-Formeln. Die Engine bleibt von der UI getrennt.

Der synthetische Jewel Analyzer bewertet einzelne normale, Cluster- und Unique-Cluster-Juwele samt Sockelprüfung, Clusterkosten, Path-Efficiency, Build-Enablern, Trade-offs, Waffen-Sets, Confidence und Ranglisten. Er belegt keine Sockel automatisch, kombiniert keine Juwele und verändert den passiven Baum nicht. Es werden weder echte PoE2-Daten noch DPS-Formeln verwendet; die Engine bleibt von der UI getrennt.

Der synthetische Unique Analyzer bewertet einzelne Gegenstände nach Aszendenz-, Equipment-, Skill- und Modulsynergie, Slot-/Ersatzwert, Trade-offs, Waffen-Sets und Confidence. Build-Enabler und alternative Richtungen werden nur gekennzeichnet; es gibt keine kombinierte Unique-Optimierung oder automatische Neuberechnung. Echte Daten, Preise, Trade-API, DPS und UI-Anbindung bleiben ausgeschlossen.

Der synthetische Rotation Generator erzeugt getrennte, strukturierte Mapping- und Bossfolgen aus bereits ausgewählten Skill-Empfehlungen. Er modelliert Skillrollen, explizite Waffenwechsel, anhaltende beziehungsweise beim Wechsel verfallende Effekte, Maintenance- und Repeat-Sequenzen, fehlende Rollen, Complexity und Confidence. Alle Bedingungen sind kontrollierte Codes; es gibt keine freie Textgenerierung, keine echten Cooldowns oder Zeiten, keine DPS-Berechnung, keine echten PoE2-Daten und keine UI-Anbindung.

Der regelbasierte Explanation Generator wandelt die vorhandenen Analyse-, Trade-off-, Constraint- und Rotationsdaten mit zentralen deutschen Templates in nachvollziehbare Erklärungen und maschinenlesbare Traces um. Unbekannte ReasonCodes und fehlende Anzeigenamen werden ausdrücklich gemeldet; ein nicht ausblendbarer Hinweis nennt die synthetische Datenbasis. Es gibt keine KI-/LLM-Anbindung, keine freie Textgenerierung, keine echten PoE2-Daten, keine DPS-Berechnung und noch keine UI-Anbindung der Engine-Erklärungen.
## Nachbesserung 5D: korrekte Baumgeometrie

Die Baumansicht übernimmt die bereits absoluten offiziellen Knotenkoordinaten unverändert über `src/tree-view/geometry.ts`. 40 Referenzen zu separat positionierten Aszendenzlayouts werden nicht mehr als lange SVG-Linien gezeichnet; 6.027 echte Kanten innerhalb desselben Layouts bleiben sichtbar. Knoten und Linien skalieren gemeinsam über eine SVG-ViewBox. `generated/poe2-tree/geometry-diagnostics.json` dokumentiert Release 0.5.2. Importer und Baumdaten blieben unverändert; Aufgabe 5I ist nicht begonnen. Details: [`docs/POE2_TREE_VIEW_ADAPTER.md`](docs/POE2_TREE_VIEW_ADAPTER.md).
## Touch und ausgewählte Aszendenz

Der offizielle Baum unterstützt Pointer-basierten Zwei-Finger-Pinch um den Finger-Mittelpunkt, Ein-Finger-/Maus-Pan und Wheel-Zoom. Der Charakter-State steuert rein visuell den hervorgehobenen Klassenstart und genau ein offizielles Aszendenz-Inset. Offizielle GGG-Medien bleiben mangels belastbarer Weiterverteilungsfreigabe blockiert; die näher am Spiel liegende Hierarchie entsteht ohne Assets aus skalierenden SVG-Rahmen und drei Detailstufen. Siehe [`docs/POE2_TREE_TOUCH_AND_ASCENDANCY.md`](docs/POE2_TREE_TOUCH_AND_ASCENDANCY.md). Aufgabe 5I ist nicht begonnen.
