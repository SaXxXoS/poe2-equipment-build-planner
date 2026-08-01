# Schritt 117 – Defensive Beiträge zu Charakter-Schwellenwerten

## Ergebnis

Das Charakter-Überlebensmodell verrechnet jetzt weitere lokal gepinnte PoB2-Regeln, die Betäubungs- oder Beeinträchtigungsschwellen aus Rüstung, Ausweichwert, Energieschild und bestimmten Ausrüstungspositionen ableiten. Jeder Beitrag bleibt im Ergebnis getrennt sichtbar.

## Belegte Regeln

Aus `src/Modules/ModParser.lua` des gepinnten PoB2-Commits werden ausschließlich die exakten, unbedingten Formen übernommen:

- ein Prozentsatz der gesamten Rüstung oder des gesamten Ausweichwerts als zusätzliche Schwelle,
- ein Prozentsatz des maximalen Energieschilds als zusätzliche Schwelle,
- der niedrigere Wert aus Rüstung und Ausweichwert auf dem Helm als Betäubungsschwelle,
- der niedrigere Wert aus Rüstung und Ausweichwert auf den Schuhen als Beeinträchtigungsschwelle,
- ein Prozentsatz der Rüstung auf Helm, Handschuhen, Schuhen und Körperrüstung als zusätzliche Betäubungsschwelle.

Waffenwerte werden für die positionsbezogene Rüstungssumme ausdrücklich nicht verwendet.

## Reihenfolge und Breakdown

Die Beiträge werden entsprechend `CalcDefence.lua` zunächst zur Basis addiert. Erst danach wirken erhöhte beziehungsweise verringerte sowie mehr beziehungsweise weniger Schwellenwerte. Das Modell weist getrennt aus:

- `additionalFromEnergyShield`,
- `additionalFromDefences`,
- `additionalFromEquipmentPositions`,
- Attributbeiträge,
- sonstige flache Beiträge,
- prozentuale und multiplikative Modifikatoren.

## Fail-closed-Verhalten

Benötigt eine zugeteilte Regel einen globalen Rüstungs-, Ausweich- oder Energieschildwert, der nicht berechnet werden konnte, wird sie nicht geschätzt. Sie erscheint in `blockedLines`. Bedingungen wie „während Kanalisieren“, „kürzlich“ oder zustandsabhängige Verdopplungen werden weiterhin nicht automatisch als aktiv behandelt.

## Grenzen

Das Modell bildet noch nicht alle Schutz-, Immunitäts-, Vermeidungs- und Zustandsregeln von PoB2 ab. Die implementierten Komponenten sind reproduzierbar getestet; eine vollständige Gleichwertigkeit mit Path of Building 2 ist weiterhin nicht belegt.

## Nächster Schritt

Als Nächstes werden die noch fehlenden unbedingten Modifikatoren für Schwellenmultiplikation, Vermeidung und Energieschildschutz inventarisiert und nur bei vollständiger lokaler Evidenz ergänzt.
