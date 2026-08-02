# Schritt 152 – Armbrustmunition und Doppellauf

## Ziel

Die strukturierte Wirkung von `Doppellauf I–III` wird für Armbrustmunition getrennt von Angriffsgeschwindigkeit, Projektilzahl und Cooldowns modelliert.

## Belegte Werte

Am gepinnten PoB2-Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` enthält `src/Data/Skills/sup_str.lua`:

- `Doppellauf I`: ein zusätzlicher Armbrustbolzen, 30 % weniger finale Nachladegeschwindigkeit,
- `Doppellauf II`: ein zusätzlicher Armbrustbolzen, 20 % weniger finale Nachladegeschwindigkeit,
- `Doppellauf III`: ein zusätzlicher Armbrustbolzen, 20 % weniger finale Nachladegeschwindigkeit.

Die Kompatibilitätsliste besitzt kein `AND`. Entsprechend der PoB2-Supportstruktur ist `CrossbowAmmoSkill` oder `CrossbowSkill` ausreichend. Mehrere Stufen derselben `DoubleBarrel`-Familie werden fail-closed blockiert.

## Rechenmodell

Das Modell führt getrennt:

- strukturierte Grundzahl geladener Bolzen,
- zusätzliche Bolzen,
- resultierende Ladung,
- finale relative Nachladegeschwindigkeit,
- nachhaltigen Schadensmultiplikator.

Der nachhaltige Schadensmultiplikator bleibt `1`. Der Pin enthält in der freigegebenen Schadensreferenz keine absolute Nachladezeit, mit der Schussfolge und Nachladephase geschlossen zu einer Dauer-DPS verbunden werden könnten. Zusätzliche Ladung wird daher als belegte Burst-/Magazinkapazität ausgewiesen, aber nicht als freie DPS-Steigerung behandelt.

## Integration

Das Ergebnis steht in `DamageEstimate.crossbowAmmunitionSupportModel`. Verarbeitete oder blockierte Doppellauf-Supports werden aus der allgemeinen Liste ungelöster Supportwirkungen entfernt. Der Schadensrechner trägt Version `3.66.0`.

Produktpins, englische Produktdaten, deutsche Anzeigedaten und Runtime-Netzwerkstatus bleiben unverändert.
