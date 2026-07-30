# Build Assistant – persistente Stufenzustände (Schritt 83)

## Ergebnis

Arktische Rüstung und Siegel der Macht besitzen nun eigene,
gemmenstufengebundene Zustandsmodelle. Beide Modelle lesen ausschließlich die
strukturierte, am PoB2-Commit
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` gepinnte
Schadensreferenz.

## Arktische Rüstung

Auf Gemmenstufe 20 sind belegt:

- 101–152 zusätzlicher Kälteschaden je stationärem Stapel,
- fünf Stapel,
- 725 ms Aufbau je Stapel,
- damit 505–760 zusätzlicher Kälteschaden nach 3,625 Sekunden im vollständig
  vorbereiteten Vergeltungsszenario.

Die App behauptet weder eine dauerhafte stationäre Position noch einen
regelmäßig eintreffenden gegnerischen Treffer. Das Szenario wird deshalb
sichtbar ausgewiesen, aber nicht als Dauerschaden addiert.

## Siegel der Macht

Auf Gemmenstufe 20 sind belegt:

- vier Stufen,
- 14 % finaler Zauberschaden je Stufe,
- 50 % Manaschwelle je Aufwertung,
- 11,9 Sekunden Basiswirkzeit,
- damit 56 % mehr Zauberschaden beziehungsweise Faktor 1,56 im
  Vollstufenszenario.

Die aktuelle Stufenzahl und die tatsächliche Aufenthaltsdauer der
Hauptfertigkeit im Siegel sind nicht vollständig belegt. Der Faktor verändert
deshalb den normalen Dauerschaden nicht.

## Fail-closed-Regeln

- Eine explizit angeforderte, nicht vorhandene Gemmenstufe wird nicht
  interpoliert.
- Vollstufenwerte sind getrennte Szenarien und keine Uptime-Annahme.
- Es entstehen keine erfundenen Trefferfrequenzen oder DPS-Multiplikatoren.

## Versionen

- Persistentes Stufenmodell: `1.0.0`
- Zeitabhängiges Offensivmodell: `1.3.0`
- Schadensrechner: `3.23.0`

Vollständige Gleichwertigkeit mit Path of Building 2 ist damit weiterhin
nicht belegt. Der Schritt schließt eine weitere klar abgegrenzte,
reproduzierbare Mechanikkette.
