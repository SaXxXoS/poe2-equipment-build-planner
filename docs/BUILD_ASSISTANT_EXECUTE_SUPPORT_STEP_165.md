# Schritt 165 – Execute-Unterstützungen gegen Ziele auf niedrigem Leben

## Ergebnis

Die gepinnten Unterstützungen `Execute I`, `Execute II` und `Execute III` werden nun mit ihren strukturierten finalen Schadenswerten gegen ein ausdrücklich als `low-life` markiertes Ziel ausgewertet:

- Execute I: 40 % mehr Trefferschaden
- Execute II: 50 % mehr Trefferschaden
- Execute III: 30 % mehr Trefferschaden

Die Wirkung wird erst nach der Gegnerabwehr in die bedingten Trefferpfade eingerechnet. Bei `not-low-life` bleibt sie inaktiv; bei fehlendem oder unbekanntem Lebenszustand wird sie fail-closed blockiert. Mehrere Ränge derselben Supportfamilie sowie inkompatible Fertigkeiten werden ebenfalls blockiert.

Execute III besitzt zusätzlich 30 % mehr Schaden, während der Spieler selbst auf niedrigem Leben ist. Der produktive Buildzustand enthält dafür noch keinen belegten Spieler-Lebenszustand. Dieser zweite Bonus wird daher nicht angenommen und ausdrücklich als blockierte Restlücke ausgegeben.

## Technische Einordnung

- Schadensrechner: `3.79.0`
- Execute-Modell: `1.0.0`
- Quelle: `generated/pob2/damage-reference.json`
- Quellrecords: `SupportExecutePlayer`, `SupportExecutePlayerTwo`, `SupportExecutePlayerThree`
- Produktpins, Offline-Grenzen und Quellenfreigaben bleiben unverändert.
- Vollständige Path-of-Building-Gleichwertigkeit ist weiterhin nicht belegt.

## Prüfung

- Fokussiert: 2 Dateien, 84 Tests erfolgreich.
- Gesamtlauf: 1.871 Tests bestanden; drei unter paralleler Vollbaumlast zeitüberschrittene Tests bestanden im seriellen Wiederholungslauf mit 198 Tests vollständig.
- Typecheck, Lint, Produktions-Build und Pages-Build erfolgreich.

