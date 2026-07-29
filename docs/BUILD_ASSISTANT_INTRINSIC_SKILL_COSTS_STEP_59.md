# Schritt 59 – Fertigkeitseigene Ressourcenkosten

## Ergebnis

Das Ressourcenmodell verarbeitet jetzt strukturierte, fertigkeitseigene
Kostenänderungen zusätzlich zu Grundkosten, Unterstützungsfaktoren sowie
Passiv- und Aszendenzwirkungen.

Der belegte Kostenaufschlag von `Toxic Domain` wird auf der exakt gewählten
Fertigkeitsstufe aus dem gepinnten PoB2-Datensatz gelesen und additiv mit
anderen erhöhten beziehungsweise verringerten Kosten verrechnet. Bei Stufe 20
werden damit aus 106 Mana vor weiteren Modifikatoren deterministisch 132 Mana:

`floor(106 × 1,25) = 132`

## Fail-closed Sonderfälle

Folgende strukturierte Werte werden erkannt, aber noch nicht numerisch
angewandt:

- `Mana Tempest`: zusätzliche Kosten hängen vom tatsächlichen
  Ressourcenverbrauch innerhalb des Sturms ab.
- `Archmage`: zusätzliche Kosten hängen vom maximalen Mana sowie von der
  verbundenen nicht kanalisierten Ziel-Fertigkeit ab.
- kanalisierte Rage-Fertigkeiten: die anfängliche Kostenunterdrückung hängt
  von der konkreten Kanalisierungsdauer ab.

Diese Einträge erscheinen in der Kostenkette als blockierte intrinsische
Wirkungen. Sie erzeugen keinen erfundenen Bonus oder Malus.

## Daten- und Produktgrenzen

- keine neue Datenquelle
- keine Änderung bestehender Pins
- kein Runtime-Netzwerk
- keine freie Textähnlichkeit
- keine Annahme unbekannter Laufzeitzustände

## Prüfungen

- exakter Stufe-20-Kostenaufschlag von `Toxic Domain`
- blockierte dynamische Kosten von `Mana Tempest`
- sichtbare intrinsische und blockierte Kostenwirkungen
- unveränderte Reihenfolge der bestehenden Kostenrechnung

