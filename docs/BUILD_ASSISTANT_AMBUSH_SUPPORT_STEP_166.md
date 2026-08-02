# Schritt 166 – Hinterhalt gegen Ziele auf vollem Leben

## Ergebnis

Die gepinnte Unterstützung `Ambush` (`Hinterhalt`) wertet nun ihre strukturierte Bedingung aus:

- gegen ein ausdrücklich als `full-life` bestätigtes Ziel: 100 % mehr kritische Trefferchance;
- gegen ein bestätigt nicht auf vollem Leben befindliches Ziel: inaktiv;
- ohne eindeutig bestätigten Lebenszustand: fail-closed blockiert.

Der Bonus verändert ausschließlich die kritische Trefferchance. Er wird nicht als direkter Schadensmultiplikator behandelt. Die bestehende Obergrenze von 100 % kritischer Trefferchance und Effekte, die kritische Treffer vollständig verbieten, bleiben maßgeblich.

Inkompatible Fertigkeiten und mehrere Einträge derselben Supportfamilie werden blockiert. `full-life` ist als eigener Gegnerzustand modelliert; dadurch bleibt die Regel von `low-life`, `not-low-life` und `unknown` eindeutig getrennt.

## Technische Einordnung

- Schadensrechner: `3.80.0`
- Hinterhalt-Modell: `1.0.0`
- Quelle: `generated/pob2/damage-reference.json`
- Quellrecord: `SupportAmbushPlayer`
- Quellstat: `support_ambush_critical_strike_chance_vs_enemies_on_full_life_+%_final`
- Produktpins, Offline-Grenzen und Quellenfreigaben bleiben unverändert.
- Vollständige Path-of-Building-Gleichwertigkeit ist weiterhin nicht belegt.

## Prüfung

Die fokussierten Modell-, Integrations- und Execute-Regressionsprüfungen umfassen 3 Dateien und 87 Tests. Im vollständigen Parallellauf bestanden 1.875 Tests; drei ausschließlich zeitüberschrittene Vollbaumdateien bestanden anschließend seriell mit insgesamt 198 Tests. Typecheck, Lint, Produktions-Build und Pages-Build waren erfolgreich.
