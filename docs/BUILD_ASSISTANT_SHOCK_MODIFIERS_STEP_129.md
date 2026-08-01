# Build-Assistent – belegte Schockmodifikatoren, Schritt 129

## Ziel

Schritt 129 erweitert das Schockmodell um eindeutig belegte Modifikatoren aus dem zugewiesenen Passivbaum, der Aszendenz, gewählten Supports und technisch zugeordneten Ausrüstungswerten. Die Auflösung ist waffensetgenau und fail-closed.

## Quellen und Pin

- `PathOfBuildingCommunity/PathOfBuilding-PoE2`, Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- `src/Modules/ModParser.lua` und `src/Modules/CalcPerform.lua`
- `data-sources/poe2-tree/raw/0.5.2/data.json`
- `generated/poe2-affixes/technical-affixes.json`
- `generated/pob2/damage-reference.json`

## Produktive Auflösung

Aus 97 inventarisierten schockbezogenen Baumzeilen erfüllen 58 Zeilen auf 56 Knoten die engen, unbedingten Muster. Darunter liegen vier Aszendenzzeilen. Produktiv sind erhöhte Schockchance, erhöhte Schockstärke, erhöhte Stärke nicht-schädigender Beeinträchtigungen, weniger Schockstärke und erhöhte Schockdauer.

Die gewählten Supports `Lasting Shock`, `Overcharge` und `Shock` werden über gepinnte numerische Stat-IDs verbunden. Ausrüstung wirkt nur über `shock_chance_+%` und `shock_effect_+%` mit bestätigter technischer Zuordnung. Schockschutz auf dem Spieler ist kein offensiver Modifikator.

Erhöhte Werte werden additiv gruppiert; finale Support- und Less-Multiplikatoren werden getrennt multipliziert. Die modifizierte Dauer fließt in die Aufrechterhaltungsprüfung ein. Waffenset-Knoten und Waffenwerte des anderen Sets werden nicht übernommen.

## Bewusst blockiert

- bedingte Effekte wie „mit kritischen Treffern“ oder „gegen elektrisierte Gegner“,
- `All Damage contributes to Shock`, bis die vollständige Beitragsregel separat modelliert ist,
- zwei gleichzeitig wirkende Schocks und deren Ersetzungsregel,
- Schockflächen und externe Schockquellen,
- freie Textähnlichkeit oder deutsche Anzeigetexte als technische Quelle.

## Versionen

- Schadensrechner `3.43.0`
- Schockmodell `1.1.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

- fokussiert: 4 Dateien und 84 Tests erfolgreich,
- serieller Gesamtlauf: 139 Dateien und 1.719 Tests erfolgreich,
- Typecheck und Lint erfolgreich,
- Produktions-Build und Pages-Build erfolgreich,
- der unbeschränkt parallele Vitest-Lauf bleibt wegen des bekannten Worker-RPC-Timeouts instabil; der belastbare Gesamtnachweis wurde deshalb mit genau einem Worker erbracht.

## Nächster Schritt

Schritt 130 modelliert mehrere belegte Schockquellen sowie die Ersetzungs- beziehungsweise stärkste-Schock-Auswahl.
