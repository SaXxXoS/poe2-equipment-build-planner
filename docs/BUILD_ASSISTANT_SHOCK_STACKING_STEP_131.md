# Build-Assistent – Mehrfach-Schock, Schritt 131

## Ziel

Schritt 131 verbindet die in der zugewiesenen Aszendenz tatsächlich belegte Mehrfach-Schock-Regel mit dem bestehenden Schockmodell. Ohne diese Regel bleibt genau ein Schock wirksam.

## Gepinnte Evidenz

Maßgeblich ist `PathOfBuildingCommunity/PathOfBuilding-PoE2` bei Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` sowie der lokale Baumstand `0.5.2`.

- `Strike Twice` enthält `Targets can be affected by two of your Shocks at the same time`.
- Derselbe Knoten enthält `25% less Magnitude of Shock you inflict`.
- PoB2 übersetzt dies in `ShockCanStack` und `ShockStacksMax = 2`.
- `CalcPerform.lua` begrenzt die Stapelzahl auf dieses Maximum und multipliziert die Schockwirkung mit der belegten Stapelzahl.

## Umsetzung

- Nur ein tatsächlich zugewiesener Knoten mit der exakten Quellzeile erhöht das Maximum von eins auf zwei.
- Die 25 % geringere Magnitude wird aus derselben zugewiesenen Aszendenz separat verrechnet.
- Die Grundmagnitude wird zuerst aus Treffer und Beeinträchtigungsschwelle bestimmt und mindestens auf die gepinnte Grundmagnitude gesetzt. Danach wirken erhöhte, verringerte, More- und Less-Magnitude; abschließend gilt die Maximalmagnitude.
- Die dauerhaft belegbare Zahl je Schockquelle folgt deterministisch aus `Anwendungsrate × Wirkzeit` und wird ganzzahlig sowie auf das erlaubte Maximum begrenzt.
- Die stärkste Quelle belegt zuerst. Reicht ihre belegte Anwendungsrate für zwei parallele Schocks, belegt sie beide; andernfalls kann die nächste schwächere, aufrechterhaltbare Quelle den verbleibenden Platz belegen.
- Nicht ausgewählte Quellen bleiben mit effektiv null sichtbar und beeinflussen den Schaden nicht.

## Bewusst blockiert

- manuell angenommene Schockstapel ohne belegte Anwendungsrate,
- geschockter Boden ohne vollständig verbundene Fertigkeitsquelle und Laufzeit,
- externe `ShockOverride`-Werte ohne aktive lokale Quelle,
- bedingte Mehrfach-Schock-Regeln ohne bestätigten Laufzeitzustand,
- Textähnlichkeit oder deutsche Anzeige als technische Evidenz.

## Versionen

- Schadensrechner `3.45.0`
- Schockmodell `1.3.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

- normale stärkste-Schock-Auswahl bleibt unverändert,
- `Strike Twice` wird nur aus dem zugewiesenen Aszendenzpfad aktiv,
- Maximum zwei, Magnitudenreduktion und wirksame Summe sind direkt getestet,
- nicht aufrechterhaltbare Quellen erzeugen weiterhin keinen Bonus,
- die Berechnung ist reihenfolgeunabhängig und deterministisch.

Fokussiert wurden 2 Dateien mit 68 Tests geprüft. Die serielle Gesamtsuite bestand aus 139 Dateien mit 1.723 Tests. Typecheck, Lint, Produktions-Build, Pages-Build und JSON-Validierung waren erfolgreich.

## Nächster Schritt

Schritt 132 untersucht geschockten Boden und feste Schockquellen. Produktiv werden sie nur, wenn Fertigkeitsidentität, fester Wert, Wirkzeit, Aktivierung und Konkurrenzregel vollständig lokal belegt sind.
