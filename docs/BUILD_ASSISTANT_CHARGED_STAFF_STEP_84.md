# Build Assistant – Charged Staff je Power Charge (Schritt 84)

## Ergebnis

`Charged Staff` besitzt nun ein stufengenaues, aus der gepinnten
PoB2-Schadensreferenz gelesenes Buffszenario.

Auf Gemmenstufe 20 sind belegt:

- mindestens eine benötigte Power Charge,
- 1–22 zusätzlicher Blitzschaden je verbrauchter Power Charge,
- 6 Sekunden Buffdauer je Charge,
- 65 Mana Aktivierungskosten.

Auf Gemmenstufe 10 werden stattdessen exakt 1–7 zusätzlicher Blitzschaden je
Charge gelesen. Nicht vorhandene angeforderte Stufen werden nicht
interpoliert und nicht durch Stufe 20 ersetzt.

## Rechengrenze

Die gepinnte Quelle belegt nicht automatisch, wie viele Power Charges der
konkrete Build erzeugt und dauerhaft verfügbar hält. Deshalb:

- bleibt das Modell ein sichtbares Pro-Charge-Szenario,
- wird keine Ladungszahl erfunden,
- wird kein permanenter Blitzschaden auf Stabangriffe addiert,
- bleibt der normale Dauerschaden unverändert.

Sobald eine vollständige, reproduzierbare Erzeugungs- und Verbrauchskette
belegt ist, kann dasselbe Pro-Charge-Modell produktiv in ein konkretes
Zeitfenster überführt werden.

## Reproduzierbarer Referenztest

Der maschinenlesbare Mikro-Paritätsbestand enthält jetzt den sechsten Fall
`charged-staff-per-power-charge-l20`. Er prüft die Werte und zusätzlich, dass
keine aktuelle Power-Charge-Anzahl und kein dauerhafter Bonus behauptet
werden.

## Versionen

- Ladungszustandsmodell: `1.2.0`
- Schadensrechner: `3.24.0`

Vollständige Build-Parität mit Path of Building 2 bleibt offen.
