# Schritt 120 – Blutungs- und Giftvermeidung

## Ziel

Das Überlebensmodell behandelt Blutung und Gift als getrennte nicht-elementare Beeinträchtigungen. Gleichzeitig wird die allgemeine PoB2-Kategorie `AvoidAilments` ergänzt, die sowohl auf diese beiden als auch auf die vier Elementarbeeinträchtigungen wirkt.

## Belegte Rechenregel

Gemäß gepinntem PoB2 gilt für Blutung und Gift jeweils:

1. allgemeine Beeinträchtigungsvermeidung plus individuelle Vermeidung,
2. Deckelung auf 100 %,
3. passende Immunität setzt den effektiven Wert auf 100 %.

Allgemeine Elementarbeeinträchtigungsvermeidung wirkt nicht auf Blutung oder Gift. Chaos Inoculation enthält in der gepinnten Parserregel ausdrücklich Blutungsimmunität.

## Ergebnisstruktur

`avoidance` enthält nun zusätzlich:

- `ailmentChance` für allgemeine Beeinträchtigungsvermeidung,
- `bleed` mit `chance`, `immune` und `immunitySource`,
- `poison` mit `chance`, `immune` und `immunitySource`.

Der vorhandene Wert `elementalAilmentChance` enthält jetzt korrekt allgemeine plus elementarspezifische Vermeidung.

## Fail-closed

Bedingte Immunitäten, etwa „Cannot be Poisoned while Bleeding“, werden ohne bestätigten Laufzeitzustand blockiert. PoB2-Unique-Planerzeilen ohne technische GGG-Identitätskette werden nicht automatisch als technische Gegenstandswirkung übernommen.

## Quellen und Coverage

- gepinntes PoB2 `src/Modules/Data.lua`: nicht-elementare Liste `Bleed`, `Poison`
- gepinntes PoB2 `src/Modules/ModParser.lua`: `AvoidAilments`, `AvoidBleed`, `AvoidPoison`, `BleedImmune`, `PoisonImmune`
- gepinntes PoB2 `src/Modules/CalcDefence.lua`: Addition, Deckelung und Immunitätsvorrang
- lokaler Passivbaum `data-sources/poe2-tree/raw/0.5.2/data.json`

Die geprüfte lokale Baumversion enthält keine direkt belegte, produktiv erreichbare Einzelvermeidungszeile für Blutung oder Gift. Das Modell behauptet deshalb keine aktuelle Baum-Coverage. Eine sichtbare PoB2-Unique-Zeile „Cannot be Poisoned“ bleibt ohne technische Produktverknüpfung außerhalb dieser Berechnung.

## Versionen

- `CHARACTER_SURVIVABILITY_MODEL_VERSION`: `1.4.0`
- Schadensrechner: `3.34.0`

## Nächster Schritt

Schritt 121 untersucht Fluchvermeidung und Fluchimmunität sowie die Abgrenzung zwischen „immune“, „unaffected“ und reduzierter Wirkung.
