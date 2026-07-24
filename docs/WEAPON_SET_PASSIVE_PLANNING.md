# Waffen-Set-Passivplanung

## Ziel

Die App bildet die PoE2-Regel ab, dass Waffen-Set-Punkte keine zusätzlichen
normalen Passivpunkte sind. Ein normaler Punkt kann stattdessen je eine
unterschiedliche Belegung für Waffenset 1 und Waffenset 2 tragen.

## Planungsmodell

Die vorhandene deterministische Passive-Pipeline bleibt maßgeblich und wird
kontrolliert in drei Stufen verwendet:

1. Ein gemeinsamer Stamm wird mit
   `normales Gesamtbudget - zu teilende Waffen-Set-Punkte` geplant.
2. Der gemeinsame Stamm wird als bereits belegt an die Planung für Set 1
   übergeben.
3. Derselbe Stamm wird als bereits belegt an die Planung für Set 2 übergeben.

Die beiden Set-Planungen dürfen jeweils höchstens die angegebene Zahl
aufgeteilter Punkte ergänzen. Die Darstellung vereinigt anschließend den
gemeinsamen Stamm mit der jeweiligen Set-Ergänzung. Damit überschreitet kein
aktiver Set-Baum das normale Gesamtbudget.

## Bedienung

`Punktebudget` ist die normale Gesamtzahl. `Waffen-Set-Punkte` ist die Zahl
dieser normalen Punkte, die zwischen den beiden Sets unterschiedlich geplant
werden soll. Bei `0` bleibt die bisherige Einzelplanung vollständig erhalten.

Nach der Analyse kann zwischen `Gemeinsam`, `Waffenset 1` und `Waffenset 2`
umgeschaltet werden. Der offizielle Baum zeigt immer den ausgewählten Plan.

## Grenzen

- Die Planung ist weiterhin heuristisch und nicht garantiert global optimal.
- Die Eingabe bezeichnet die gewünschte Aufteilung, nicht zusätzliche Punkte.
- Aszendenzpunkte gehören weiterhin nicht zum normalen Punktebudget.
- Wenn für ein Set keine fachlich positiven weiteren Ziele existieren, darf
  dessen Ergänzung weniger Punkte verwenden; es werden keine Knoten erfunden.
- Die bestehenden offiziellen Baumdaten, Datenpins und Pfadsuchregeln wurden
  nicht ersetzt.

## Vollständige normale Budgetnutzung

Nach der priorisierten strategischen Auswahl verwendet eine zweite,
evidenzbasierte Planungsphase verbleibende normale Punkte für weitere
erreichbare, positiv bewertete und konfliktfreie Ziele. Der produktive
offizielle Baum ist mit 121 von 121 verwendeten Punkten getestet.

Unbekannte, negative oder konfliktbehaftete Knoten werden nicht als bloße
Füllpunkte vergeben. Wenn für ein Profil nicht genügend sichere Ziele
vorliegen, bleibt deshalb ein Restbudget sichtbar. Aszendenzpunkte bleiben
weiterhin ein getrennter Punkttyp.
