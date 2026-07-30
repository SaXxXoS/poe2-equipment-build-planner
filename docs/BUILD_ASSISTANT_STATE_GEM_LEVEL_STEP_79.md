# Schritt 79 – Gemmenstufe für Zustandskapazitäten

## Korrektur

Siegel- und Projektilaufbauwerte werden jetzt aus derselben exakten
Gemmenstufe gelesen wie die übrigen Fertigkeitswerte.

Für `Ember Fusillade` belegt der gepinnte Stand:

- Stufe 1: maximal 6 Projektile
- Stufe 10: maximal 7 Projektile
- Stufe 20: maximal 10 Projektile

Die Freigabedauer wird jeweils aus der stufengenauen Maximalzahl und dem
belegten Abstand berechnet.

## Standard und Blockierung

- Bei einer eingegebenen vorhandenen Stufe wird exakt diese Zeile verwendet.
- Ohne Eingabe wird wie im bestehenden Gemmenstufenmodell die gepinnte
  Referenzstufe 20 verwendet.
- Eine angeforderte, nicht vorhandene Stufe wird nicht interpoliert und
  erzeugt keinen Zustandsdatensatz.

Dieselbe Auflösung gilt für die Siegelparameter von `Freezing Salvo`.

## Versionen

- Siegelzustandsmodell: `1.1.0`
- Projektilaufbaumodell: `1.1.0`
- Schadensrechner: `3.20.0`

## Tests

Geprüft sind Referenzstufe, exakte Stufe 1 und fail-closed blockierte Stufe 99
für beide Zustandsmodelle.
