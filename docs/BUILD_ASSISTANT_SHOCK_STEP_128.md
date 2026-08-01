# Build-Assistent – gegnerseitiger Schock, Schritt 128

## Ziel

Schritt 128 verbindet den vom Hauptskill ausgelösten Schock erstmals reproduzierbar mit dem generischen gegnerseitigen Schadensmultiplikator. Ein Bonus wird nur angesetzt, wenn Trefferstärke, Chance, Gegner-Schwelle, Aktionsrate und Wirkzeit gemeinsam eine aufrechterhaltbare Wirkung belegen.

## Gepinnte Quelle

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Konstanten und Schwellentabelle: `src/Data/Misc.lua`
- Chance und Magnitude: `src/Modules/CalcOffence.lua`
- generischer `DamageTaken`-Effekt: `src/Modules/CalcPerform.lua`
- strukturierte Skillwerte: `generated/pob2/damage-reference.json`, Schema 13

## Produktive Formel

PoB2 liefert am Pin:

- Chance-Multiplikator: `25`
- Grundmagnitude: `20 %`
- maximale Magnitude: `100 %`
- Grunddauer: `8 Sekunden`
- Magnitude: `50 × (gewichteter Blitztreffer / Gegner-Schwelle)^0,4 × Effektmodifikatoren`

Nichtkritische und kritische Treffer werden getrennt gegen die Gegner-Schwelle ausgewertet und anschließend mit Treffer- und kritischer Trefferchance gewichtet. Die Anwendungshäufigkeit ist:

`Aktionen pro Sekunde × erwartete Schockchance / 100`

Produktiv gilt der Schock nur, wenn innerhalb seiner achtsekündigen Dauer rechnerisch mindestens eine erneute Anwendung zu erwarten ist. Dann erhöht seine Magnitude den erlittenen physischen, Feuer-, Kälte-, Blitz- und Chaosschaden gleichermaßen. Ist die Aufrechterhaltung nicht belegt, bleibt der Effekt sichtbar im Auditstatus, erzeugt aber `effectiveValue = 0` und keinen positiven Schadensbonus.

## Grenzen

- Nur die Trefferkomponente des gewählten Hauptskills wird verwendet.
- Der Skill muss im aktiven Waffenset liegen.
- Intrinsische strukturierte Skillwerte für Schockchance und Schockeffekt werden berücksichtigt.
- Passive-, Aszendenz-, Support- und Gegenstandsmodifikatoren für Schock werden in diesem Schritt noch nicht allgemein aufgelöst.
- Schockflächen, externe Schockquellen, mehrere konkurrierende Schocks und nicht belegte Laufzeitzustände bleiben fail-closed.
- Ohne Gegnerlevel, Trefferchance, kritische Trefferchance oder Blitztrefferschaden wird kein Schockbonus erfunden.

## Versionen

- Schadensrechner: `3.42.0`
- Schockmodell: `1.0.0`
- zeitliches Gegnerstatusmodell: `2.0.0`
- Damage-Reference-Schema: `13`

## Prüfung

- Fokussierte Schadens- und Gegnerwirkungstests: 3 Dateien, 63 Tests, erfolgreich
- Typecheck: erfolgreich
- Kontrolliert partitionierte Gesamtsuite: 140 Dateien, 1.717 Tests, erfolgreich
- Lint, Typecheck, Produktions- und Pages-Build: erfolgreich

## Nächster Schritt

Schritt 129 erschließt belegte Schockmodifikatoren aus Passive Tree, Aszendenz, Supports und Ausrüstung sowie die stärkste konkurrierende Schockquelle, ohne Textähnlichkeit oder unbelegte Uptime anzunehmen.
