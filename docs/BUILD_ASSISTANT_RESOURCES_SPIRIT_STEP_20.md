# Ressourcen und Geist – Schritt 20

## Ziel

Dieser Schritt prüft Mana, Leben, Geist, Fertigkeitskosten und Reservierungen
deterministisch. Er führt keine zusätzliche Nutzereinstellung und keine neue
Datenquelle ein.

## Inventar

Der gepinnte PoB2-Referenzbestand umfasst 337 Fertigkeitsdatensätze. Davon
tragen 82 `HasReservation` und 9 `MultipleReservation`. Sechs einzelne
strukturierte Zahlenfelder erwähnen Mana; sie beschreiben Spezialwirkungen,
nicht die allgemeinen Kosten aller Fertigkeiten.

Im aktuellen BuildProfile fehlen vollständige aktuelle Mana-, Lebens- und
Geistkapazitäten sowie Regeneration. Der Produktbestand enthält auch keine
geschlossene allgemeine Kette aus Grundkosten, Supportmultiplikatoren,
Reservierungsbetrag und Kapazität.

## Modell

`resource-spirit-model` klassifiziert je belegter Fertigkeit:

- einfache oder mehrfache Geistreservierung,
- strukturierte Manawechselwirkungen,
- Quellenreferenzen und Waffenset,
- den Grund, warum Bezahlbarkeit oder Aufrechterhaltbarkeit noch nicht
  berechnet werden kann.

Semantische `resourceCost`-Werte der Supportkandidaten bleiben reine
Rankinghinweise. Sie werden weder als Mana- noch als Lebenskosten bezeichnet.

## Fail-closed-Regeln

- Reservierungsmarker sind kein Reservierungsbetrag.
- Eine Reservierung beweist keine verfügbare Geistkapazität.
- Ein Manaeffekt beweist weder Grundkosten noch verfügbares Mana.
- Ohne Kosten, Pool und Wiederherstellung wird die Wirkfrequenz nicht
  reduziert und keine dauerhafte Uptime behauptet.
- Das Modell verändert deshalb derzeit keinen Schadenswert.

## Integration

Das Modell ist Teil jedes Schadenergebnisses und wird unter „Ressourcen und
Geist“ verständlich angezeigt. Rechnerversion: `2.9.0`, Modellversion:
`1.0.0`.

## Grenzen und nächster Schritt

Eine produktive Ressourcenbilanz benötigt exakt versionierte
Fertigkeitskosten, Support-Kostenmultiplikatoren, Mana-/Lebens-/Geistpools,
Reservierungsbeträge und Wiederherstellung. Diese Daten werden nicht
geschätzt.

Nächster Schritt: Gemmenstufen und Qualität als getrennte, belegte
Berechnungsparameter modellieren.
