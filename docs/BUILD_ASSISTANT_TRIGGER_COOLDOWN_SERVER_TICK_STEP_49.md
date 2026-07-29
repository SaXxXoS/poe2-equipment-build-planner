# Schritt 49 – Trigger-Abklingzeit und Server-Takt

## Ergebnis

Die gepinnten PoB2-Skilldaten liefern nun zusätzlich die Basis-Abklingzeit
und gespeicherten Nutzungen je Gemmenstufe. Eine produktiv berechnete
Trigger-Fertigkeit kann deshalb nicht mehr schneller auslösen, als ihre
belegte Abklingzeit erlaubt.

## Gepinnte Regel

Der PoB2-Stand `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
definiert in `src/Modules/Data.lua`:

- Server-Tick: `0,033` Sekunden
- Server-Tick-Rate: `1 / 0,033`

`src/Modules/CalcTriggers.lua` rundet die wirksame Abklingzeit auf den
nächsten vollständigen Server-Tick auf. Das Teilmodell bildet daher ab:

`Tick-Cooldown = ceil(Basis-Cooldown / 0,033) × 0,033`

`Trigger-Grenze = 1 / Tick-Cooldown`

Die tatsächliche Auslöserate ist das Minimum aus Energie-/Ereignisrate und
dieser Cooldown-Grenze.

## Grenzen

Noch nicht geschlossen sind erhöhte oder verringerte
Abklingzeit-Wiederherstellung, harte Cooldown-Overrides, zusätzlich
gespeicherte Nutzungen in allen Sonderfällen und die Rotation mehrerer
eingebetteter Fertigkeiten. Diese Fälle bleiben getrennt offen und werden
nicht geschätzt.
