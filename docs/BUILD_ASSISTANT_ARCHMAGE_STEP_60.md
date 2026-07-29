# Build-Assistent – Schritt 60: Archmage

## Ziel

Die in Schritt 59 noch blockierte Archmage-Wechselwirkung wird aus der
gepinnten lokalen PoB2-Referenz als echte Kosten- und Schadenswirkung
ausgewertet. Es findet kein Netzwerkzugriff und keine freie Interpretation
des sichtbaren Textes statt.

## Belegte Regel

Die gepinnte Archmage-Beschreibung belegt zwei gekoppelte Wirkungen für
nicht-kanalisierte Zauber:

- zusätzliche Manakosten als Anteil des maximalen Manas;
- ein Anteil sämtlichen Schadens wird pro 100 maximalem Mana als zusätzlicher
  Blitzschaden gewonnen.

Auf Gemmenstufe 20 liefert der gepinnte Datensatz:

- `610` Per-myriad zusätzliche maximale-Manakosten, also `6,10 %`;
- `4 %` zusätzlichen Blitzschaden je 100 maximales Mana.

Bei dem bestätigten Mindestbestand eines Charakters auf Stufe 100 von
`520 Mana` ergibt das:

- `floor(520 × 610 / 10.000) = 31` zusätzliche Mana-Grundkosten;
- `520 / 100 × 4 = 20,8 %` des Schadens als zusätzlichen Blitzschaden.

Arc kostet auf Stufe 20 damit vor Supports `81 + 31 = 112 Mana`.

## Waffensets und Zielgrenze

Archmage wirkt ausschließlich auf einen nicht-kanalisierten Zauber:

- im selben Waffenset;
- oder aus einem ausdrücklich in beiden Waffensets aktiven Archmage-Setup.

Ein Archmage aus Waffenset 2 beeinflusst keinen ausschließlich in Waffenset 1
aktiven Zauber. Kanalisierte Fertigkeiten erhalten die Wirkung nicht.

## Rechenreihenfolge

Der zusätzliche Archmage-Betrag wird zur belegten Grundkostenzeile addiert,
bevor Support-Kostenmultiplikatoren und anschließend Baum-/Aszendenz-
Kostenwirkungen angewandt werden. Der zusätzliche Blitzschaden läuft durch
die bestehende PoB-Modifikatorreihenfolge für „Gain as Extra“.

## Fail-closed-Grenzen

Ohne bestätigten maximalen Manabestand, exakte Archmage-Stufe oder eindeutige
Ziel-/Waffensetbeziehung wird kein Bonus erzeugt. Mehrere Archmage-Quellen
werden nicht gestapelt; die deterministisch erste belegte Quelle wird
verwendet.

## Versionen und Prüfung

- Ressourcenmodell: `10.0.0`
- Schadensrechner: `3.8.0`
- positive Referenz: Arc und Archmage in Waffenset 1
- negative Referenz: Arc in Waffenset 1, Archmage in Waffenset 2
- fokussierte Tests: 63 erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich

Produktpins, englische PoB2-Produktdaten und deutsche Anzeigedaten bleiben
unverändert.
