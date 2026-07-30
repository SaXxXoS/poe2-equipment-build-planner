# Schritt 78 – aufladbare Projektilfolgen

## Ergebnis

Die App transportiert für `Ember Fusillade` erstmals die vollständig
gepinnten Parameter der aufladbaren Projektilfolge:

- maximal 10 Projektile im Referenzdatensatz
- 100 ms Abstand zwischen den Projektilen
- 1.300 ms Wirkzeit
- 5 % finaler Schaden je abgefeuertem Ember
- 900 ms rechnerisches Freigabefenster zwischen erstem und zehntem Projektil

## Rechengrenze

Der aktuelle Emberstand, die Zahl tatsächlich abgefeuerter Projektile, die
Trefferzahl pro Ziel und mögliche Flächenüberlappung sind im Buildzustand
nicht vollständig belegt. Daher werden diese Werte sichtbar transportiert,
aber noch nicht zu einem Gesamt- oder DPS-Multiplikator verrechnet.

Diese Trennung verhindert insbesondere, dass zehn mögliche Projektile
automatisch als zehn garantierte Treffer eines einzelnen Gegners gelten.

## Sichtbare Integration

Die Ergebnisansicht zeigt nun:

- Siegelkapazität und Aufbauzeit von Siegelfertigkeiten
- Kapazität und Freigabeparameter aufladbarer Projektilfolgen
- den ausdrücklichen Hinweis, welche Zustände noch keinen Bonus erzeugen

## Versionen und Tests

- Projektilaufbaumodell: `1.0.0`
- Schadensrechner: `3.19.0`
- fokussiert geprüft: Ember-Fusillade-Parameter, fehlender aktueller
  Stapelstand und fail-closed-Verhalten anderer Projektilfertigkeiten
