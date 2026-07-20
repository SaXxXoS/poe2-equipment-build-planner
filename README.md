# PoE2 Equipment Build Planner

Mobiler, Equipment-first ausgerichteter Build-Planer-Prototyp für Path of Exile 2. Die App zeigt direkt eine einzige lange Planer-Seite und demonstriert den vollständigen Eingabe- und Ergebnisablauf.

> **Prototyp:** Sämtliche Spieldaten und Berechnungsergebnisse sind lokale Platzhalter. Es gibt noch keine echte Optimierungs-Engine, DPS-Berechnung oder PoE2DB-Anbindung.

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
- `src/data.ts` – normalisierte lokale Definitionen, Konfigurationen und feste Testberechnung
- `docs/DATA_SOURCES.md` – geprüfte Datenquellen, Bedingungen, Unsicherheiten und vorläufige Empfehlung
- `src/styles.css` – mobile-first Oberflächengestaltung
- `AI_PROJECT/CHATGPT_PROTOCOL.md` – offizielles Projektgedächtnis und langfristiger Plan

Die Anwendung verwendet Vite, React, TypeScript, CSS und lokalen React-State. Sie besitzt bewusst kein Backend, keine Datenbank, keine Authentifizierung und kein Mehrseiten-Routing.

## Domänenmodell und stabile IDs

Technische IDs sind von deutschen Anzeigenamen getrennt. Dadurch können Beziehungen zwischen Klassen, Aszendenzen, Modifiern, Equipment, Skills, Supports, Juwelen und passiven Knoten stabil referenziert und später kontrolliert auf importierte Daten abgebildet werden. Konkrete Charakter-, Equipment- und Skill-Konfigurationen speichern ausschließlich diese IDs und ihre veränderlichen Werte.

Jede Spieldatendefinition führt gemeinsame Metadaten: deutsche Anzeige, optionaler englischer Name, Datenversion, Quelle, optionaler Quellverweis, Status und zentral typisierte Mechanik-Tags. Alle aktuellen Datensätze tragen die Quelle `local-placeholder` und den Status `placeholder`; es werden weiterhin keine echten PoE2-Daten oder externen APIs verwendet.

## Importgrundlage

Das kanonische Rohdatenformat bildet eine feste Grenze zwischen externen Quellen und dem Domänenmodell. Die reine Pipeline arbeitet ausschließlich auf übergebenen Daten, erzeugt deterministische interne IDs und Inhalts-Hashes, prüft Schema, Manifest, Kategorien, Tags, Werte, Zählungen, Duplikate und Referenzen und erzeugt erst danach Domänenobjekte. Sie führt keine Netzwerkzugriffe aus und schreibt keine Dateien.

Es wurden noch keine echten PoE2-Spieldaten importiert. Die enthaltenen Fixtures sind ausdrücklich künstlich. Die rechtliche und technische Bewertung möglicher späterer Quellen steht in [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md); ein breiter PoE2DB-Import bleibt bis zur ausdrücklichen Klärung blockiert.
