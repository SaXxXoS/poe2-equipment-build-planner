# Schritt 162 – Brutality I–III exakt modelliert

## Ergebnis

Der Rechner wertet die drei gepinnten Brutality-Stufen jetzt als eigenständige, zusammengehörige Supportwirkung aus:

- `Brutality I`: 25 % mehr physischer Schaden,
- `Brutality II`: 30 % mehr physischer Schaden,
- `Brutality III`: 30 % mehr physischer Schaden und bei Treffern 20 % Chance, gegnerische physische Schadensreduktion zu ignorieren.

Der Schadensfaktor verändert ausschließlich physische Komponenten. Nichtphysischer Schaden bleibt unverändert. Für Brutality III wird der Treffer gegen Rüstung deterministisch als Erwartungswert aus dem normalen Trefferzweig (80 %) und dem Zweig mit ignorierter physischer Schadensreduktion (20 %) berechnet. Andere Schadensarten und gegnerische Modifikatoren für erlittenen Schaden bleiben davon unberührt.

Belegter nativer physischer Schaden über Zeit erhält den physischen Mehr-Schaden, aber nicht die ausdrücklich nur für Treffer freigegebene Chance, physische Schadensreduktion zu ignorieren. Inkompatible Fertigkeiten und mehrere Ränge derselben Supportfamilie werden fail-closed blockiert.

## Produkttrennung und Grenzen

Die Umsetzung verwendet ausschließlich die strukturierten Felder der bereits gepinnten PoB2-Supportrecords. Es wurden keine technischen GGG-IDs, keine externen Daten und keine freie Textinterpretation ergänzt. Die generische Teilabbildung von Brutality wurde entfernt, damit der spezialisierte Effekt genau einmal angewandt wird.

Vollständige Gleichwertigkeit mit Path of Building 2 ist damit weiterhin nicht belegt. Geschlossen ist ausschließlich der hier dokumentierte, strukturierte Brutality-Wirkungsumfang.

## Prüfungen

- fokussiert: 3 Dateien, 84 Tests erfolgreich,
- vollständig stabil seriell: 158 Dateien, 1.858 Tests erfolgreich,
- Typecheck, Lint, Produktions- und Pages-Build erfolgreich,
- 238 getrackte JSON-Dateien mit Node validiert und `git diff --check` erfolgreich,
- Produktpins und Offline-Grenzen unverändert.
