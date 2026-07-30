# Schritt 87 – Charge Regulation

## Ergebnis

`Charge Regulation` besitzt jetzt ein stufengenaues, strukturiertes
Ladungsszenario. Die App transportiert getrennt:

- Fertigkeitsgeschwindigkeit bei vorhandenen Frenzy Charges,
- finale kritische Trefferchance bei vorhandenen Power Charges,
- finale Rüstung, Ausweichen und Energieschild bei vorhandenen Endurance
  Charges,
- das belegte Verbrauchsintervall aller drei Ladungsarten.

Auf Gemmenstufe 20 sind 25 % Fertigkeitsgeschwindigkeit, 26 % finale
kritische Trefferchance, 20 % finale Verteidigung und ein
Verbrauchsintervall von 10 Sekunden belegt.

## Sicherheitsgrenze

Der gepinnte Datensatz belegt nicht, welche Ladungen im aktuellen
Buildzustand tatsächlich vorhanden sind. Die App zeigt daher das
Maximalszenario mit `currentChargeState = unknown`, wendet die Boni aber
nicht automatisch auf DPS oder Verteidigung an.

Eine angeforderte Gemmenstufe, die im Referenzdatensatz nicht vorhanden ist,
wird nicht interpoliert und nicht durch Stufe 20 ersetzt.

## Versionen

- Ladungszustandsmodell: `1.3.0`
- Schadensrechner: `3.27.0`

## Verifikation

- stufengenauer Referenztest für Gemmenstufe 10,
- Referenztest für Gemmenstufe 20,
- Fail-closed-Test für eine unbekannte Gemmenstufe,
- deterministische Wiederholungsprüfung,
- fokussierte zeitabhängige Integrationstests.

