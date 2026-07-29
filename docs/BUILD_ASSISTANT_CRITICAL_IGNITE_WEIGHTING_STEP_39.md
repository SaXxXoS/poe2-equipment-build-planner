# Build-Assistent – kritische Entzünden-Gewichtung (Schritt 39)

## Ergebnis

Die Entzünden-Berechnung unterscheidet jetzt normale und kritische Treffer
entsprechend der gepinnten PoB2-Implementierung in
`CalcOffence.calcAilmentDamage`.

Berücksichtigt werden:

- effektive Kritchance des auslösenden Treffers,
- getrennte Entzündenchance für normalen und kritischen Feuerschaden,
- nach beiden Auslösepfaden gewichteter Feuerschaden,
- Wahrscheinlichkeit, dass unter den erwarteten aktiven Entzündungen
  mindestens eine durch einen kritischen Treffer ausgelöst wurde.

Die Ergebnisansicht weist diese letzte Wahrscheinlichkeit gesondert aus.
Sie wird nicht fälschlich als Multiplikator auf den Entzündenschaden
angewendet.

## Quellenbindung

Quelle bleibt ausschließlich der lokal vorhandene und gepinnte PoB2-Stand
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

Verwendete Referenzen:

- `src/Modules/CalcOffence.lua`: `calcAilmentDamage`
- `src/Modules/CalcOffence.lua`: Berechnung von `ailmentCritChance`
- `src/Data/Misc.lua`: Entzünden-Grundkonstanten

## Fail-closed-Grenze

Kritische Sonderregeln für Gift und Blutung sowie bedingte Stats, die
kritische Zustände separat verändern, bleiben ausgeschlossen, bis ihre
vollständige Bedingungs- und Statkette reproduzierbar modelliert ist.

## Prüfung

Ein Referenztest prüft normale und kritische Entzündenchance, gewichteten
Quellschaden, aktive Zustände und Gesamtschaden gegen die gepinnte Formel.
