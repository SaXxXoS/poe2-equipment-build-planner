# Schritt 77 – Siegelzustand für Fertigkeiten

## Ergebnis

Die App transportiert für ausgewählte Fertigkeiten mit vollständig belegten
Siegelparametern jetzt Kapazität, Wiederholungen je gebrochenem Siegel,
Aufbauintervall und vollständige Vorbereitungszeit.

Für `Freezing Salvo` sind im gepinnten PoB2-Stand belegt:

- maximal 10 Siegel
- eine Wiederholung je gebrochenem Siegel
- 750 ms Aufbauintervall
- 7.500 ms bis zur rechnerischen vollen Kapazität

## Sichere Grenze

Der aktuelle Siegelstand und der tatsächliche Auslösezeitpunkt sind nicht im
Buildzustand vorhanden. Das Modell gibt deshalb keinen erfundenen
Schadensmultiplikator aus. Die Daten stehen als reproduzierbarer
Rotationsnachweis bereit und können später mit einem belegten Kampfzustand
verbunden werden.

## Versionen

- Siegelzustandsmodell: `1.0.0`
- Schadensrechner: `3.18.0`

## Tests

Geprüft sind die vollständige Freezing-Salvo-Kapazität, die Abwesenheit eines
erfundenen aktuellen Siegelstands und der irrelevante Zustand normaler
Fertigkeiten ohne Siegel.
