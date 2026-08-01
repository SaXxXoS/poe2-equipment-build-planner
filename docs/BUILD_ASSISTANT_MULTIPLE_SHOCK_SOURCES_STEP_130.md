# Build-Assistent – mehrere Schockquellen, Schritt 130

## Ziel

Schritt 130 bewertet alle im aktiven Waffenset belegten Trefferfertigkeiten als getrennte mögliche Schockquellen. Normale konkurrierende Schocks werden nicht addiert. Produktiv wirkt ausschließlich der stärkste Schock, der mit seiner belegten Chance, Dauer und Aktionsrate zuverlässig aufrechterhalten werden kann.

## Belegte Spielregel

Maßgeblich ist der gepinnte lokale PoB2-Stand `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`. `src/Modules/CalcPerform.lua` bildet den aktuellen Schock mit einer Maximum-Auswahl. Eine Addition mehrerer Schocks erfolgt nur im gesonderten Zweig `ShockCanStack`. Die App übernimmt deshalb für normale Schocks die stärkste Wirkung und sperrt Mehrfach-Schock weiterhin fail-closed.

## Umsetzung

- Haupt- und weitere aktive Fertigkeiten werden mit ihren eigenen Trefferschäden, kritischen Treffern, Trefferchancen und Aktionsraten bewertet.
- Baum-, Aszendenz- und globale Ausrüstungsmodifikatoren gelten für jede Quelle im aktiven Waffenset.
- Supportmodifikatoren bleiben an genau die jeweilige Fertigkeitskarte gebunden.
- Nur aufrechterhaltbare Kandidaten nehmen an der Maximum-Auswahl teil.
- Der Gewinner erhält `selected-strongest`; verdrängte Kandidaten bleiben für die Erklärbarkeit sichtbar, wirken aber mit `effectiveValue = 0`.
- Gleichstarke Kandidaten werden deterministisch nach stabiler Skill-ID entschieden.
- Die Reihenfolge der Fertigkeitskarten verändert das Ergebnis nicht.

## Bewusst blockiert

- gleichzeitige Mehrfach-Schocks trotz vorhandener Baumzeile, solange Anzahl, Ersetzung und Schadensaufnahme nicht vollständig modelliert sind,
- geschockter Boden und externe feste Schockwerte,
- nicht aufrechterhaltbare Momentaufnahmen als dauerhafter Schadensbonus,
- freie Textähnlichkeit oder deutsche Anzeige als technische Evidenz.

## Versionen

- Schadensrechner `3.44.0`
- Schockmodell `1.2.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

- Mehrquellen-Auswahl, Reihenfolgeunabhängigkeit und nicht aufrechterhaltbare Konkurrenz sind direkt getestet.
- Die normale Schadensberechnung entdeckt weitere aktive Blitzfertigkeiten produktiv.
- fokussiert: 2 Dateien und 67 Tests erfolgreich,
- serielle Gesamtsuite: 140 Dateien und 1.723 Tests erfolgreich,
- Typecheck, Lint, Produktions- und Pages-Build erfolgreich.

## Nächster Schritt

Schritt 131 untersucht ausschließlich vollständig belegbare Mehrfach-Schock-Regeln und externe feste Schockquellen. Ohne vollständige Kette bleibt deren Wirkung null.
