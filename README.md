# PoE2 Equipment Build Planner

Mobiler, Equipment-first ausgerichteter Build-Planer-Prototyp für Path of Exile 2. Die App zeigt direkt eine einzige lange Planer-Seite und demonstriert den vollständigen Eingabe- und Ergebnisablauf.

> **Prototyp:** Sämtliche Spieldaten und Berechnungsergebnisse sind lokale Platzhalter. Eine UI-unabhängige, deterministische Engine-Architektur mit künstlicher Testlogik ist vorhanden; es gibt keine echte Optimierungs- oder DPS-Engine und keine PoE2DB-Anbindung.

## Installation und Start

```bash
npm install
npm run dev
```

Produktions-Build:

```bash
npm run build
```

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
- `src/engine/` – React-freie Analyzer-Schnittstellen, Bewertungsmodell, Orchestrator und künstliche Engine-Fixtures
- `src/data.ts` – normalisierte lokale Definitionen, Konfigurationen und feste Testberechnung
- `docs/DATA_SOURCES.md` – geprüfte Datenquellen, Bedingungen, Unsicherheiten und vorläufige Empfehlung
- `docs/ENGINE_ARCHITECTURE.md` – Engine-Datenfluss, Regeln, Profile, Bewertungen und klare fachliche Grenzen
- `src/styles.css` – mobile-first Oberflächengestaltung
- `AI_PROJECT/CHATGPT_PROTOCOL.md` – offizielles Projektgedächtnis und langfristiger Plan

Die Anwendung verwendet Vite, React, TypeScript, CSS und lokalen React-State. Sie besitzt bewusst kein Backend, keine Datenbank, keine Authentifizierung und kein Mehrseiten-Routing.

## Domänenmodell und stabile IDs

Technische IDs sind von deutschen Anzeigenamen getrennt. Dadurch können Beziehungen zwischen Klassen, Aszendenzen, Modifiern, Equipment, Skills, Supports, Juwelen und passiven Knoten stabil referenziert und später kontrolliert auf importierte Daten abgebildet werden. Konkrete Charakter-, Equipment- und Skill-Konfigurationen speichern ausschließlich diese IDs und ihre veränderlichen Werte.

Jede Spieldatendefinition führt gemeinsame Metadaten: deutsche Anzeige, optionaler englischer Name, Datenversion, Quelle, optionaler Quellverweis, Status und zentral typisierte Mechanik-Tags. Alle aktuellen Datensätze tragen die Quelle `local-placeholder` und den Status `placeholder`; es werden weiterhin keine echten PoE2-Daten oder externen APIs verwendet.

## Importgrundlage

Das kanonische Rohdatenformat bildet eine feste Grenze zwischen externen Quellen und dem Domänenmodell. Die reine Pipeline arbeitet ausschließlich auf übergebenen Daten, erzeugt deterministische interne IDs und Inhalts-Hashes, prüft Schema, Manifest, Kategorien, Tags, Werte, Zählungen, Duplikate und Referenzen und erzeugt erst danach Domänenobjekte. Sie führt keine Netzwerkzugriffe aus und schreibt keine Dateien.

Es wurden noch keine echten PoE2-Spieldaten importiert. Die enthaltenen Fixtures sind ausdrücklich künstlich. Die rechtliche und technische Bewertung möglicher späterer Quellen steht in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md); ein breiter PoE2DB-Import bleibt bis zur ausdrücklichen Klärung blockiert.

## Engine-Architektur

Die Platzhalter-Engine folgt dem Equipment-first-Datenfluss und liefert neben Scores immer strukturierte Gründe und Regelverstöße. Der Equipment Analyzer verarbeitet zentral definierte synthetische Regeln, erstellt getrennte Profile beider Waffen-Sets, erkennt künstliche Affinitäten, Bedarfe, Konflikte sowie ungenutzte oder schwach genutzte Modifier und erzeugt daraus ein kombiniertes `BuildProfile`. Er ist nicht mit der sichtbaren UI verbunden.

Sämtliche Regeln und Schwellen sind Testkonfigurationen und keine fachlich verbindlichen PoE2-Empfehlungen. Architektur, Normalisierung, Modulreihenfolge und Grenzen sind in [`docs/ENGINE_ARCHITECTURE.md`](docs/ENGINE_ARCHITECTURE.md) beschrieben. `npm run test` prüft Domäne, Importpipeline und Engine deterministisch und ohne Netzwerkzugriff.

Der synthetische Skill Analyzer bewertet künstliche Fertigkeitskandidaten gegen Equipment-Profil, Klasse, Aszendenz, Ziel und beide Waffen-Sets. Er liefert harte Ausschlüsse, strukturierte Teilwerte, Rollen, Confidence und stabile Mapping-/Bossranglisten. Es sind keine echten PoE2-Fertigkeiten enthalten; Supports werden nicht optimiert, DPS wird nicht berechnet und die Engine ist weiterhin nicht an die UI angebunden.

Der synthetische Support Analyzer bewertet einzelne künstliche Support-Kandidaten für einen bereits ausgewählten Skill. Er prüft Tags, Schadensarten, Mechaniken, Waffen und Rollen, bewertet Build-/Zielprofil und beide Waffen-Sets, bildet Trade-offs sowie Confidence ab und liefert stabile Fachranglisten. Es sind keine echten Support-Gems enthalten; eine Support-Kombination, Sockel-/Linkoptimierung oder DPS-Berechnung findet nicht statt. Auch dieser Analyzer ist nicht an die UI angebunden.

Der synthetische Passive Analyzer bewertet einzelne Knoten und vorgegebene kleine Cluster samt vereinfachter Graphprüfung, Punktkosten, Nutzen pro Punkt, Path-Efficiency, Waffen-Sets, Trade-offs, Confidence und Fachranglisten. Er erzeugt keinen vollständigen Baum, sucht keine alternativen Pfade, bewertet keine Juwele und verwendet weder einen echten PoE2-Skilltree noch DPS-Formeln. Die Engine bleibt von der UI getrennt.

Der synthetische Jewel Analyzer bewertet einzelne normale, Cluster- und Unique-Cluster-Juwele samt Sockelprüfung, Clusterkosten, Path-Efficiency, Build-Enablern, Trade-offs, Waffen-Sets, Confidence und Ranglisten. Er belegt keine Sockel automatisch, kombiniert keine Juwele und verändert den passiven Baum nicht. Es werden weder echte PoE2-Daten noch DPS-Formeln verwendet; die Engine bleibt von der UI getrennt.
