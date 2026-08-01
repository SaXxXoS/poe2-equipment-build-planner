# Build-Assistent – sekundärer Beeinträchtigungsschutz, Schritt 122

## Ziel

Dieser Schritt erweitert das bestehende Charakter-Schutzmodell um die von PoB2 getrennt berechneten Schutzarten gegen Blindheit, Aufspießen, verderbtes Blut, Maim, Hinder und Stille. Er erfindet weder aktive Gegnerzustände noch nicht belegte Immunitäten.

## Gepinnte Referenz

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Baum: `data-sources/poe2-tree/raw/0.5.2/data.json`

PoB2 berechnet in `CalcDefence.lua` Blindheits- und Aufspießvermeidung jeweils separat und setzt sie bei entsprechender Immunität auf 100 Prozent. Verderbtes Blut, Maim und Hinder besitzen eigene Immunitätsflags. Stille ist ein Fluch: Ohne eigene Stille-Immunität erbt sie die Fluchvermeidung.

## Implementiertes Modell

`secondaryDebuffProtection` enthält getrennte Felder für:

- Blindheitsvermeidung und -immunität
- Aufspießvermeidung und -immunität
- Immunität gegen verderbtes Blut
- Immunität gegen Maim
- Immunität gegen Hinder
- Stillevermeidung, Stille-Immunität und den geerbten Fluchvermeidungsanteil

Vermeidung wird wie in PoB2 bei 100 Prozent gedeckelt. Immunität ergibt für Blindheit, Aufspießen und Stille eine effektive Vermeidung von 100 Prozent, bleibt aber als eigener Zustand sichtbar.

## Reale Coverage

Der gepinnte Rohbaum enthält 5.151 Einträge; das normalisierte Produktmodell enthält 5.150 Knoten. Exakt produktiv erkannt werden:

- `monkchakra12` – `Chakra of Sight`: `Cannot be Blinded`
- `slow_mitigation8` – `Light on your Feet`: `Immune to Hinder` und `Immune to Maim`
- `physical_witch13` – `Sanguine Tolerance`: `Immune to Corrupted Blood`

Der aktuelle Baum enthält keine unbedingte Blindheits- oder Aufspießvermeidung, keine unbedingte Aufspießimmunität und keine Stille-Immunität. Diese Ausgaben bleiben deshalb null beziehungsweise `false`.

## Fail-closed-Grenzen

- `Immune to Maim while Shapeshifted` wird ohne bestätigten Verwandlungszustand nicht aktiviert.
- `Deflected Hits cannot inflict Maim on you` wird ohne trefferbezogene Deflect-Auswertung nicht als globale Immunität behandelt.
- Bedingte Blindheits-, Aufspieß-, Maim-, Hinder- oder Stillezeilen werden in `blockedLines` ausgewiesen.
- Die App behauptet keine Immunität allein aufgrund ähnlicher Texte oder sichtbarer Unique-Zeilen.

## Versionen

- Charakter-Schutzmodell: `1.6.0`
- Schadensrechner: `3.36.0`

## Prüfung

- Fokussierte Referenztests: 2 Dateien, 79 Tests, erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich
- Gesamtsuite: 136 Dateien und 1.689 Tests in kontrollierten Teilmengen erfolgreich
- Produktionsbuild: erfolgreich
- Pages-Build: erfolgreich

Der monolithische Vitest-Lauf meldet bei gleichzeitig laufenden Performance-Suiten `onTaskUpdate`-RPC-Zeitüberschreitungen. Sämtliche betroffenen Tests bestanden isoliert; dies ist als Runner-Grenze und nicht als fachlicher Testfehler protokolliert.

## Offene Grenze

Dieser Schritt modelliert den vorhandenen Schutz, aber noch nicht die konkrete Stärke, Dauer oder Trefferfolge einer gegnerischen Beeinträchtigung. Eine vollständige defensive Kampfsimulation benötigt später zusätzlich belegte Gegnerprofile und zeitabhängige Zustände.
