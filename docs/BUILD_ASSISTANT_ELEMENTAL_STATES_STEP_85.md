# Schritt 85 – Elementarzustände und Resonanz

## Ergebnis

`Elemental Conflux` und `Trinity` besitzen jetzt ein getrenntes, deterministisches Zustandsmodell. Die App liest ausschließlich die strukturierten Werte des gepinnten PoB2-Schadensreferenzprodukts.

## Modellierte Werte

- Elemental Conflux, Gemmenstufe 20: 59 % finaler Schaden des jeweils aktiven Elements und 8 Sekunden Wirkzeit.
- Trinity, Gemmenstufe 20: 13 Resonanzgewinn, 6 % finaler Schaden je 50 Resonanz, 8 Sekunden Verzögerung bis zum Verfall, 10 Resonanzverlust pro Sekunde und 3 pro Treffer.

## Fail-closed-Grenze

Der aktuelle Buildzustand enthält weder das aktive Conflux-Element noch die aktuelle Resonanz aller drei Elemente. Deshalb zeigt die App die belegbaren Szenarien an, rechnet aber keinen dieser Boni als dauerhaft aktive DPS ein. Eine Rotation, Uptime oder Resonanzmenge wird nicht erfunden.

## Versionen

- Elementarzustandsmodell: `1.0.0`
- zeitabhängiges Offensivmodell: `1.4.0`
- Schadensrechner: `3.25.0`
