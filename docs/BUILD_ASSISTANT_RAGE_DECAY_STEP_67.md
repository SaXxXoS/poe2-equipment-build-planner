# Schritt 67 – natürlicher Wutverlust

## Ergebnis

Das Ressourcenmodell berücksichtigt jetzt den gepinnten natürlichen
Wutverlust:

- Der Verlust beginnt grundsätzlich vier Sekunden nach dem letzten belegten
  Treffer oder Wutgewinn.
- Danach gehen grundsätzlich fünf Wut pro Sekunde verloren.
- Exakt erkannte passive und Aszendenzwirkungen können den Beginn verzögern,
  den Verlust verlangsamen oder den natürlichen Verlust vollständig
  unterbinden.
- Für wutverbrauchende Fertigkeiten wird die konservative Nutzungsdauer ohne
  weitere Treffer und ohne weiteren Wutgewinn ausgewiesen.

Die Berechnung verbindet den laufenden Fertigkeitsverbrauch und den zeitlich
verzögerten natürlichen Verlust stückweise. Sie behandelt den natürlichen
Verlust daher nicht fälschlich ab Sekunde null.

## Quellenkette

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- `src/Data/Misc.lua`
  - `BaseRageLossPerMinute = 300`
  - `BaseRageLossDelayMs = 4000`
- Gepinnter Passivbaum:
  - `Inherent Rage loss starts ... second later`
  - `Inherent loss of Rage is ...% slower`
  - `No Inherent loss of Rage`

Der Referenzgenerator reduziert die Minuten- und Millisekundenwerte
deterministisch auf Wut pro Sekunde und Sekunden. Unbekannte oder bedingte
Formulierungen werden nicht frei interpretiert.

## Grenzen

- Der aktuelle Wutstand wird weiterhin nicht erfunden.
- Die ausgewiesene Dauer setzt für den Vergleich ausdrücklich einen vollen
  bestätigten Wutvorrat voraus.
- Ein Treffer oder Wutgewinn setzt die Verlustverzögerung im Spiel erneut
  zurück. Die aktuelle Dauer ist bewusst das konservative Szenario ohne
  weitere Treffer und ohne weiteren Gewinn.
- Mehrfachtreffer und mehrere Ziele werden nicht pauschal angenommen.

## Prüfung

- Ressourcenmodell: `16.0.0`
- 75 fokussierte Tests erfolgreich
- Typecheck erfolgreich
- deterministische Referenzdatei neu erzeugt
- Referenzinhalt-Hash:
  `429654e44b80325212f475a219f3125de35554fe9897c00897d630dad97da7f8`
