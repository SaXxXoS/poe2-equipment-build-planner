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
npm run lint
npm run typecheck
```

## Projektstruktur

- `src/components/` – UI-Bereiche und Dialoge
- `src/models.ts` – erweiterbare TypeScript-Datenmodelle
- `src/data.ts` – lokale Testdaten und feste Testberechnung
- `src/styles.css` – mobile-first Oberflächengestaltung
- `AI_PROJECT/CHATGPT_PROTOCOL.md` – offizielles Projektgedächtnis und langfristiger Plan

Die Anwendung verwendet Vite, React, TypeScript, CSS und lokalen React-State. Sie besitzt bewusst kein Backend, keine Datenbank, keine Authentifizierung und kein Mehrseiten-Routing.
