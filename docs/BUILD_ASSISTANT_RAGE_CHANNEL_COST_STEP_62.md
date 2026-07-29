# Schritt 62 – Raserei-Kosten kanalisierter Fertigkeiten

## Ergebnis

Die Ressourcenberechnung verarbeitet das anfängliche Aussetzen laufender
Raserei-Kosten nun als strukturierte Kostenphase. Grundlage sind ausschließlich
die gepinnten PoB2-Felder:

- `RagePerMinute`
- `channelled_skill_suppress_ongoing_rage_cost_for_first_X_ms`
- der zugehörige normale Qualitätseffekt

## Belegte Fälle

- **Flame Breath**, Stufe 20: 6 Raserei pro Sekunde; 4 Sekunden Grundfenster,
  bei 20 Qualität exakt 5 Sekunden.
- **Rampage**, Stufe 20: 5 Raserei pro Sekunde; 2,5 Sekunden Grundfenster.

Die Qualität wird nur als ganze Zahl von 0 bis 23 akzeptiert. Außerhalb dieses
Bereichs bleibt die Kostenkette fail-closed.

## Grenze

Die App kennt damit die anfänglich kostenfreie Phase und den anschließenden
laufenden Verbrauch. Eine maximale Kanalisierungsdauer wird noch nicht
behauptet, weil dafür aktueller/maximaler Rasereivorrat, Erzeugung und weitere
laufende Wirkungen vollständig verbunden sein müssen.

## Prüfung

- Ressourcenmodell: Version 11.0.0
- fokussierte Ressourcen- und UI-Tests: 30 erfolgreich
- keine Netzwerk- oder Laufzeitquelle
- Datenpins unverändert
