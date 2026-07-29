# Schritt 72 – Doppel- und Dreifachschaden

## Ergebnis

Die Trefferschadenskette besitzt jetzt ein getrenntes, deterministisches
Modell für Doppel- und Dreifachschaden. Es liest ausschließlich exakt
belegte Wirkungen aus tatsächlich vergebenen passiven oder
Aszendenzknoten.

Unterstützte sichere Formen:

- prozentuale Chance auf Doppel- oder Dreifachschaden
- garantierter Doppel- oder Dreifachschaden
- Zauberchance auf Doppel- oder Dreifachschaden
- garantierter Dreifachschaden mit Elementarfertigkeiten
- Doppelchance kritischer Treffer, gewichtet mit der berechneten
  effektiven Kritchance

Nicht vollständig modellierte Waffen-, Gegner-, Zeit-, Schwellen- und
sonstige Zustandszeilen bleiben fail-closed.

## PoB2-Reihenfolge

Die Umsetzung folgt dem gepinnten `CalcOffence.lua`:

1. Doppel- und Dreifachchance werden jeweils auf 100 % begrenzt.
2. Dreifachschaden besitzt Vorrang.
3. Der überlappende Doppelanteil wird abgezogen.
4. Erwartungsfaktor:
   `1 + wirksame Doppelchance + 2 × Dreifachchance`.

Beispiel:

- 20 % Doppelchance
- 10 % Dreifachchance
- wirksame Doppelchance nach Überschneidung: 18 %
- erwarteter Trefferschadensfaktor: 1,38

## Integration

Der Faktor wirkt auf:

- normalen Trefferschadens-Erwartungswert
- Trefferchance und kritischen Erwartungswert
- zeitlich belegte Trefferfenster
- vorbereitete Folgetreffer
- gegnergeminderten Trefferschaden
- den getrennten bestätigten Wutzustand

Er wirkt ausdrücklich nicht auf Schaden über Zeit oder Zustände.

## Versionen und Prüfung

- Schadensrechner: `3.13.0`
- Mehrfachschadensmodell: `1.0.0`
- fokussierte Tests: 56 erfolgreich
- Typecheck: erfolgreich

Die Ergebnisansicht nennt Doppelchance, Dreifachchance, den
Überlappungsfaktor und die Anzahl exakt belegter Quellen.

## Grenze

Die vollständige PoB2-Gleichwertigkeit ist noch nicht belegt. Komplexe
Zustände dürfen erst produktiv wirken, wenn ihr Zustand selbst reproduzierbar
aus dem Buildzustand hervorgeht.
