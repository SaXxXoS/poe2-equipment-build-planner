# Schritt 54 – Supportbedingte Cooldown-Overrides

## Ziel

Ein Support darf nicht nur seinen Schadensmultiplikator liefern, während sein
gleichzeitig auferlegter Cooldown ignoriert wird. Beides muss als eine
gemeinsame belegte Wirkung in die nachhaltige Schadensrate eingehen.

## Umsetzung

Das Schadensmodell verarbeitet nun für einen kompatiblen Support im selben
Fertigkeitssetup:

- den strukturierten finalen Schadensmultiplikator,
- einen strukturierten Cooldown-Override,
- erhöhte Cooldown-Erholung,
- die Server-Takt-Rundung bei nur einer gespeicherten Nutzung,
- die daraus folgende nachhaltige maximale Nutzungsrate.

Die berechnete Aktionsrate wird an dieser Nutzungsrate begrenzt. Ein hoher
Trefferschaden kann dadurch nicht mehr fälschlich mit der ursprünglichen
Zauber- oder Angriffsgeschwindigkeit als dauerhafter DPS multipliziert werden.

## Referenzfall Sanduhr

Der gepinnte PoB2-Datensatz belegt für `Hourglass`:

- 30 % mehr Schaden,
- einen Cooldown-Override von 10 Sekunden,
- Ausschluss bereits vorhandener Cooldown-, Trigger-, Proxy- und
  Persistent-Fertigkeiten.

Für eine kompatible Schadensfertigkeit ohne eigenen Cooldown werden deshalb
beide Wirkungen gemeinsam angewendet. Bei einer gespeicherten Nutzung wird der
Cooldown wie im gepinnten PoB2-Rechenweg auf den 33-ms-Server-Takt
aufgerundet.

## Quellen

- `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- `src/Modules/CalcOffence.lua`
- `src/Data/Skills/sup_int.lua`
- Produktreferenz `generated/pob2/damage-reference.json`

## Grenzen

Nicht strukturierte Supportbedingungen bleiben wirkungslos. Mehrere
konkurrierende Cooldown-Overrides werden noch nicht frei kombiniert; ohne
eindeutige Prioritätskette wird kein günstigerer Wert erfunden.
