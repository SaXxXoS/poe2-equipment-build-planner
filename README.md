# PoE2 Equipment Build Planner

> **Datenstand 5M.2.10:** Der englische PoB2-Unique-Bestand bleibt unverändert. Lokale deutsche Namen, Basistypen und CSD-Templates wurden offline geprüft, besitzen jedoch keine sichere gemeinsame technische Identität mit den `pob2:`-Records. Daher wurden keine deutschen Unique-Produkttexte importiert; alle 435 Items bleiben `translation-missing`.

> Datenstatus 5M.2.9: 435 englische Unique-Planerrecords aus `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` sind offline integriert. Sie sind strikt von GGG-/RePoE-Affixdaten getrennt; deutsche Unique-Texte bleiben `translation-missing`. Keine externe Billigung wird behauptet.

> PoB2 Unique data policy: the project owner has authorized a future reduced,
> source-separated planner data set under disclosed legal/licensing
> uncertainty. No individual permission was requested from or granted by
> Path of Building Community or Grinding Gear Games. This is a project
> decision, not legal advice. Exact pinning, attribution, notices and all
> product-separation guards remain mandatory; no PoB2 Unique product data
> were imported by task 5M.2.8B.

> Historical 5M.2.8A status: public distribution was initially blocked
> pending two written confirmations. 5M.2.8B supersedes that technical
> blocker through the explicit project-owner decision above; no external
> permission is claimed.

> Datenstatus 5M.2.7: Der priorisierte Unique-Quellenaudit ist abgeschlossen. Offizielle Quellen, RePoE, PoB2, poe2-mcp und weitere Kandidaten liefern keine vollständige technische Unique-ID→Base→Mod/Stat→Werte→Varianten-Kette. Es wurden keine Daten importiert; Approval, Produktivpin, Runtime und `translation-missing` bleiben unverändert.

> Status 5M.2.0: Die ID-basierte deutsche Gegenstandslokalisierung wurde nur hinsichtlich Quellen, Coverage und Approval geprüft. Es wurden keine deutschen Produktivtexte oder freien Übersetzungen importiert; `translation-missing` bleibt aktiv. Alle deutschen Sprachscopes sind `pending`, Foto-Mappings sind `blocked`. Details: [Quellenentscheidung](docs/POE2_GERMAN_ITEM_LOCALIZATION_SOURCE_DECISION.md).

## Quellenstatus 5M.1B.0C

Die technische Identität der 295 im gepinnten RePoE-Export belegten Socketables ist eng bedingt freigegeben; Rune-/Soul-Core-/Idol-/AbyssalEye-/CongealedMist-Effekte bleiben mangels strukturiert exportierter Werte `pending`. Es wurden keine Daten importiert und keine Laufzeitkomponente geändert. Siehe `docs/POE2_SOCKETABLE_AND_SPECIAL_MOD_SOURCE_DECISION.md`.

Der Equipment-Dialog verwendet seit 5M.1 den commit-gepinnten technischen RePoE-Affixbestand (1.828 normalisierte Mods, 29 Itemklassen). Dieser Bestand ist vollständig für den engen 5M.1-Importfilter, aber **kein vollständiger PoE2-Itemmod-Bestand**. 5M.1B.0A hat ausschließlich getrennte Approval-Teilscopes für normale Jewels, Charms und Life-/Mana-Flasks vorbereitet; zusätzliche Daten oder Produktfunktionen wurden nicht importiert. Das Unique-Audit 5M.1B.0B gibt ebenfalls noch keine realen Uniques frei: Identität bleibt `pending`, Mods/Varianten/granted Effects bleiben `blocked`. Relics, Runen, Soul Cores, Spezialmods und deutsche Lokalisierung bleiben offen. Details: [`docs/POE2_ADDITIONAL_ITEM_CLASS_SOURCE_DECISION.md`](docs/POE2_ADDITIONAL_ITEM_CLASS_SOURCE_DECISION.md) und [`docs/POE2_UNIQUE_ITEM_SOURCE_DECISION.md`](docs/POE2_UNIQUE_ITEM_SOURCE_DECISION.md).

Der vorhandene reale Compact-Passivplan kann nach einer manuellen Workeranalyse direkt im offiziellen Baum ein- und ausgeblendet sowie auf Nutzerwunsch zentriert werden. Start, Wege, Ziele und eindeutige Required-Probleme sind rein visuelle Overlays auf unveränderter offizieller Geometrie und unveränderten Assets; die UI berechnet keine Pfade oder Punkte neu. Physische iPhone-Abnahme offen, Aufgabe 5M nicht begonnen.

Der offizielle Passivbaum kann jetzt über einen ausdrücklich vorbereiteten Browser-Worker textlich analysiert werden. Budget und Planungsmodus setzt der Nutzer; Ergebnisse sind Compact und heuristisch. Es gibt keine Pfadmarkierung, automatische Punkteableitung oder physische iPhone-Abnahme dieses Stands. Siehe [`docs/POE2_REAL_PASSIVE_UI_INTEGRATION.md`](docs/POE2_REAL_PASSIVE_UI_INTEGRATION.md).

Aufgabe 5J ergänzt einen versionierten lokalen Module-Worker für die reale Passive-Analyse. Graph und Prepared Context bleiben wiederverwendbar im Worker, Compact ist Transportstandard. Die bestehende App startet ihn noch nicht; Pfade werden nicht visualisiert. Siehe [`docs/POE2_REAL_PASSIVE_BROWSER_RUNTIME.md`](docs/POE2_REAL_PASSIVE_BROWSER_RUNTIME.md).

Aufgabe 5I.1 ergänzt eine semantikerhaltende Performancegrenze: Compact ist der Orchestratorstandard, Full bleibt explizit verfügbar, und ein geprüfter Prepared Targeting Context kann mehrere Profile desselben Baums beschleunigen. Es gibt weiterhin keine UI-Anbindung oder Pfadvisualisierung; Aufgabe 5J wurde nicht begonnen. Messdetails: [`docs/POE2_REAL_PASSIVE_PERFORMANCE_OPTIMIZATION.md`](docs/POE2_REAL_PASSIVE_PERFORMANCE_OPTIMIZATION.md).

## Reale Passive-Orchestratorintegration (Aufgabe 5I)

Der Haupt-Orchestrator kann die bestehende reale Passive-Pipeline jetzt über `EngineRequest.realPassivePlanning` ausdrücklich aktivieren. Ein explizites Punktebudget, Quellversion und technischer Charakterkontext bleiben Pflicht; vorbereitete Graphen können versioniert wiederverwendet werden. Der synthetische Passive Analyzer bleibt separat bestehen. Ohne Konfiguration ändert sich der bisherige Orchestratorlauf nicht. Es gibt weiterhin keine UI-Anbindung oder Pfaddarstellung. Details: [`docs/POE2_REAL_PASSIVE_ORCHESTRATOR_INTEGRATION.md`](docs/POE2_REAL_PASSIVE_ORCHESTRATOR_INTEGRATION.md).

## Asset- und Klassenstand 5D.3

Der sichtbare Passivbaum verwendet lokale offizielle Spriteatlanten aus GGGs gepinntem Export 0.5.2. Gewählte Aszendenzen erscheinen zentral; ein generiertes Register verwaltet alle Exportklassen ohne feste Sechsergrenze. Details: `docs/POE2_TREE_ASSETS.md` und `docs/POE2_CLASS_AND_ASCENDANCY_REGISTRY.md`. Aufgabe 5I ist weiterhin nicht begonnen.

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
> 5M.1B ergänzt gepinnte technische Eingaben für normale Jewels, Charms und Life-/Mana-Flasks. Uniques, Relics, Socketables, deutsche Affixtexte und Simulation bleiben ausgeschlossen. Siehe `docs/POE2_ADDITIONAL_ITEM_CLASS_TECHNICAL_IMPORT.md`.
> **Status 5M.2.1:** Lokaler deutscher Preflight teilweise erfolgreich: 32/33 produktrelevante Itemklassen-IDs, aber keine belastbare Mod-/Stat-/Basistyp-Coverage. Keine deutschen Texte importiert, `translation-missing` unverändert, keine UI-/Engineänderung. [Bericht](docs/POE2_GERMAN_LOCAL_EXTRACTION_PREFLIGHT.md)
> **Status 5M.2.2:** Drei exakt gepinnte Parser-Stacks wurden offline auditiert. PoB2/ooz extrahiert aktuelle DATC64- und CSD-Dateien deterministisch, stellt aber keinen nachgewiesenen verlustfreien, unbeaufsichtigten deutschen Struktur-Export bereit. Kein Kandidat rechtfertigt einen neuen Produktivpin; empfohlen ist eine separat beauftragte begrenzte Parseranpassung. Produktpin, Approval, Produktdaten und `translation-missing` bleiben unverändert. [Kandidatenaudit](docs/POE2_GERMAN_PARSER_CANDIDATE_AUDIT.md)
> **Status 5M.2.3:** Der gepinnte unbeaufsichtigte Offline-Auditparser liest fünf lokale DATC64-Tabellen und 589 CSD-Dateien ohne Netzwerk. Alle 2.255 Produkt-Mod-IDs, Statfolgen und Werteintervalle stimmen; 447/485 Templatelücken besitzen deutsche/englische CSD-Strukturen. ItemClasses bleibt wegen eines unbekannten Zusatzbytes ungelöst; Unique-/Socketable-Tabellen fehlen. Kein Produktimport oder Approval. [Parserbericht](docs/POE2_OFFLINE_ITEM_AUDIT_PARSER.md)
# 5M.2.4 Offline-Referenztabellenaudit

Die bestehende Offline-Auditpipeline inventarisiert nun deterministisch 22 konkret benötigte lokale Referenztabellen. ItemClasses und SoulCores behalten je ein unbekanntes Schemabyte; Domain-/Generation-/Unique-/Bonded-Ketten bleiben deshalb Auditlücken. Es wurden keine Produktdaten oder Volltexte importiert, keine Freigabe erteilt und 5M.2/5N nicht begonnen. Details: `docs/POE2_OFFLINE_REFERENCE_TABLE_EXTRACTION.md`.

## 5M.2.5 Binärschema-/Enum-Audit

Domain und Generation Type sind für 2.255/2.255 Mods bestätigt; StatsValues/BondedStats sind als Parallelarrays belegt. Zusatzbytes in ItemClasses/SoulCores und Konfliktgruppensemantik bleiben unbekannt. Keine Produkt-, UI-, Engine- oder Approval-Änderung; 5M.2/5N bleiben unbegonnen. Details: `docs/POE2_BINARY_SCHEMA_AND_ENUM_AUDIT.md`.

## 5M.2.6 Unique-Identitäts-/Affix-Audit

25 gepinnte lokale Kandidatendateien wurden zweimal offline geprüft. Stash-, Words-, Visual-, Chest-, Mutation-, Legacy- und Skillfragmente enthalten keine vollständige Unique-ID→Base→Variante→Mod/Stat→Werte-Kette. Unique-Affixe sind technisch nicht vollständig geklärt; kein Import oder Approval. Details: `docs/POE2_UNIQUE_IDENTITY_AND_AFFIX_AUDIT.md`.

## 5M.2.8 PoB2-Unique-Planerdaten-Approval

Auf ausdrückliche Auftraggeberentscheidung ist PoB2 am Commit `c5300ccd…ab7d0` als getrennte Unique-Planerdatenquelle bedingt zugelassen. Der Scope darf keine technischen GGG-IDs, regulären Affixe, Crafting-/CSD-/Socketable-/Medien- oder Runtime-Daten liefern. Distribution und Produktimport bleiben pending; es wurden keine Uniques oder Texte importiert. Vertrag: `docs/POE2_POB2_UNIQUE_PLANNER_DATA_APPROVAL.md`.
## Deutsche PoB2-Unique-Anzeige (5M.2.11)

Die 435 englischen PoB2-Uniques besitzen nun eine getrennte, ID-verknüpfte deutsche Anzeigeschicht unter `generated/localization/de/pob2-uniques.json`. Sie deckt 435 Namen, 435 Basistypen, 579 Varianten, 2.345 Modzeilen und 273 Implicits ab. Das sind App-Übersetzungen und keine offiziellen oder technisch bestätigten GGG-Texte. 2.080 Felder bleiben als `review-required` für sprachlichen Feinschliff sichtbar; leere Übersetzungen fallen auf Englisch und anschließend `translation-missing` zurück. Englische Produktdaten, Registry, Analyzer, Engine, Crafting- und RePoE-Daten bleiben unverändert.
