# Schritt 69 – Wut-Anlaufzeit und Kampfreferenz

## Ergebnis

Die App unterscheidet nun zwischen einem nur angenommenen vollen Wutvorrat
und einem im fortgesetzten Kampf tatsächlich erreichbaren vollen Vorrat.

Aus bestätigter Wuterzeugung und gleichzeitigem Wutverbrauch werden
deterministisch berechnet:

- der Nettogewinn pro Sekunde,
- die Zeit von null bis zum bestätigten Maximalvorrat und
- ob der volle Vorrat nach dieser Anlaufzeit bei derselben belegten
  Trefferfolge gehalten werden kann.

Nur im Zustand `maintainable-after-ramp` bezeichnet die Oberfläche den
Voll-Wut-Schaden als Kampfreferenz. Andernfalls bleibt er ein begrenztes
Vergleichsfenster.

## Sicherheitsgrenzen

- Unbekannte Trefferfrequenzen erzeugen keine Anlaufzeit.
- Erzeugung, die lediglich den Verbrauch deckt, beweist keinen Aufbau von
  null bis zum Maximalvorrat.
- Mehrere Ziele, Projektilüberlappungen und nicht belegte Mehrfachtreffer
  werden nicht zur Wuterzeugung addiert.
- Der tatsächliche Kampf kann unterbrochen werden; die Kampfreferenz gilt
  ausdrücklich nur bei fortgesetzter gleicher Treffer- und Gewinnrate.

## Prüfung

- Ressourcenmodell: `17.0.0`
- Wutvergleichsmodell: `1.0.0`
- 75 fokussierte Tests erfolgreich
- Typecheck erfolgreich
