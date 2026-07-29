# Schritt 52 – Cooldown-Recovery und Overrides

## Ergebnis

Das Trigger- und Wiederholungsmodell bildet jetzt die im gepinnten PoB2-Code
belegte Reihenfolge für Abklingzeiten ab:

1. Basisabklingzeit,
2. belegte additive beziehungsweise überschriebene Abklingzeit,
3. Division durch den Cooldown-Recovery-Faktor,
4. Rundung auf den 33-ms-Server-Takt,
5. keine Tick-Rundung bei mehreren gespeicherten Nutzungen.

Die App besitzt derzeit keinen strukturierten Transport für additive
Cooldown-Werte oder `CooldownRecovery`-Overrides. Solche Wirkungen bleiben
deshalb wirkungslos und werden nicht aus sichtbaren Texten geschätzt.

## Support-Verknüpfung

Die gepinnten Supports `Cooldown Recovery I` und `Cooldown Recovery II`
enthalten 25 beziehungsweise 30 Prozent Cooldown Recovery. Ein Wert wird nur
angewendet, wenn:

- der Support im selben Meta-Setup gewählt ist,
- der Supportname genau einer gepinnten technischen Referenz entspricht,
- das eingebettete Ziel alle `requireSkillTypes` besitzt,
- kein `excludeSkillType` verletzt ist.

Im aktuellen Pin besitzt beispielsweise `Snap` den Typ `Cooldown`, aber nicht
`AffectedByCooldownRate`. Der Support wird deshalb dort fail-closed nicht
angewendet. Diese Einschränkung ist eine belegte Datenlücke und kein Anlass,
Kompatibilität zu erfinden.

## Referenz

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Berechnung: `src/Modules/CalcOffence.lua`
- Supportdaten: `src/Data/Skills/sup_dex.lua`

## Tests

- PoB2-Reihenfolge der Recovery-Berechnung
- negative Recovery erzeugt keinen erfundenen Beschleunigungsbonus
- inkompatibler Support bleibt wirkungslos
- Support eines anderen Setups bleibt wirkungslos
- bestehende Cooldown-, Server-Tick- und Stored-Uses-Regeln bleiben erhalten

## Verbleibende Lücke

Additive Abklingzeiten, Temporalis-Werte und Cooldown-Overrides können erst
produktiv wirken, wenn sie über eine gepinnte, strukturierte Datenkette bis
zum konkreten Build transportiert werden. Freie Textinterpretation ist dafür
nicht zulässig.
