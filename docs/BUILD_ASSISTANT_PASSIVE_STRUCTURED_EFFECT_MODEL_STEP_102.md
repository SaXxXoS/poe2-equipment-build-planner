# Schritt 102 – strukturiertes Passivwirkungsmodell

## Ergänzung

Eindeutige Baumzeilen werden nun nicht nur semantisch klassifiziert, sondern
in eine getrennte Wirkungsstruktur überführt:

- Quelltext und normalisierter Text
- Zahlenwert
- Einheit (`flat` oder `percent`)
- Operator (`flat-add`, `increased`, `reduced`, `more`, `less`)
- Wirkungsrichtung
- Mechaniktags
- belegte BuildProfile-Ziele
- Bedingtheit
- Aggregationsstatus

## Fail-closed-Grenzen

Nur eindeutig am Zeilenanfang belegte Formen werden normalisiert. Komplexe
Sondertexte, unbekannte Formen und nicht zuordenbare `+1`-Regeln erzeugen
keinen strukturierten Effekt. Bedingungen werden erkannt und bis zu einer
separaten Bedingungsauflösung blockiert. Ein Effekt ohne belegtes Profilziel
bleibt ebenfalls blockiert.

## Vollbaum-Messung

- Statzeilen: 5.962
- Zahlen im Quelltext extrahiert: 5.716
- eng strukturiert normalisiert: 4.030
- bereit für eine spätere Aggregation: 3.008
- wegen Bedingung blockiert: 571
- wegen fehlendem Ziel blockiert: 451
- bereits in Endwerte numerisch angewendet: 0

Damit existiert erstmals eine überprüfbare Grundlage für eine spätere
numerische Passivaggregation. Dieser Schritt verändert noch kein Ranking und
behauptet keine Path-of-Building-2-Parität.
