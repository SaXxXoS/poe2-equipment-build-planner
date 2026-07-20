# PoE2 Equipment Build Planner

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
- `src/data.ts` – normalisierte lokale Definitionen, Konfigurationen und feste Testberechnung
- `docs/DATA_SOURCES.md` – geprüfte Datenquellen, Bedingungen, Unsicherheiten und vorläufige Empfehlung
- `docs/ENGINE_ARCHITECTURE.md` – Engine-Datenfluss, Regeln, Profile, Bewertungen und klare fachliche Grenzen
- `docs/ENGINE_UI_INTEGRATION_AUDIT.md` – geprüfter späterer UI-/Engine-Vertrag, Adaptergrenze und Integrationsrisiken
- `docs/DATA_SOURCE_RELEASE_AUDIT.md` – Datenbedarf, Quellenstatus und verbindliche Sperre vor echtem Datenimport
- `docs/DATA_SOURCE_APPROVAL.md` – verbindliche Quellenentscheidung, Datenmatrix und Empfehlung für Aufgabe 5C
- `docs/DATA_SOURCE_REFERENCES.md` – geprüfte Primärbelege mit Abrufdatum und Interpretationsgrenzen
- `src/styles.css` – mobile-first Oberflächengestaltung
- `AI_PROJECT/CHATGPT_PROTOCOL.md` – offizielles Projektgedächtnis und langfristiger Plan

Die Anwendung verwendet Vite, React, TypeScript, CSS und lokalen React-State. Sie besitzt bewusst kein Backend, keine Datenbank, keine Authentifizierung und kein Mehrseiten-Routing.

## Domänenmodell und stabile IDs

Technische IDs sind von deutschen Anzeigenamen getrennt. Dadurch können Beziehungen zwischen Klassen, Aszendenzen, Modifiern, Equipment, Skills, Supports, Juwelen und passiven Knoten stabil referenziert und später kontrolliert auf importierte Daten abgebildet werden. Konkrete Charakter-, Equipment- und Skill-Konfigurationen speichern ausschließlich diese IDs und ihre veränderlichen Werte.

Jede Spieldatendefinition führt gemeinsame Metadaten: deutsche Anzeige, optionaler englischer Name, Datenversion, Quelle, optionaler Quellverweis, Status und zentral typisierte Mechanik-Tags. Alle aktuellen Datensätze tragen die Quelle `local-placeholder` und den Status `placeholder`; es werden weiterhin keine echten PoE2-Daten oder externen APIs verwendet.

## Importgrundlage

Das kanonische Rohdatenformat bildet eine feste Grenze zwischen externen Quellen und dem Domänenmodell. Die reine Pipeline arbeitet ausschließlich auf übergebenen Daten, erzeugt deterministische interne IDs und Inhalts-Hashes, prüft Schema, Manifest, Kategorien, Tags, Werte, Zählungen, Duplikate und Referenzen und erzeugt erst danach Domänenobjekte. Sie führt keine Netzwerkzugriffe aus und schreibt keine Dateien.

Es wurden noch keine echten PoE2-Spieldaten importiert. Die enthaltenen Fixtures sind ausdrücklich künstlich. Die rechtliche und technische Bewertung möglicher späterer Quellen steht in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md); ein breiter PoE2DB-Import bleibt bis zur ausdrücklichen Klärung blockiert.

Die verbindliche Nachprüfung aus Aufgabe 5B gibt weiterhin keine echte Datenkategorie frei. Nur synthetische Fixtures sind `approved`; die offizielle GGG-API ist ausschließlich für ihre dokumentierten Endpunkte unter Bedingungen `conditionally-approved`, deckt aber den benötigten statischen Datenbestand nicht ab. Offizieller Passivbaumexport, RePoE und PoE2DB bleiben für einen Repository-Import `blocked`, Bilder und Icons ebenfalls. `src/import/approval.ts` validiert die maschinenlesbare Entscheidung und blockiert fehlende, ungültige, unbekannte oder nicht freigegebene Quellen/Kategorien deterministisch. Vor Aufgabe 5C ist eine schriftliche, kategorienbezogene Erlaubnis zu Abruf, Speicherung, Ableitungen, öffentlicher Weiterverteilung und Attribution erforderlich.

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
