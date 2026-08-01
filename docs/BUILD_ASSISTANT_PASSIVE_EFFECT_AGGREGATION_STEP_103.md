# Schritt 103 – deterministische Passivwirkungsaggregation

## Ergebnis

Die in Schritt 102 vorbereiteten Effekte können nun neutral pro belegtem
Zielbereich gestapelt werden:

- flache Zusätze werden addiert,
- `increased` und `reduced` teilen einen additiven Prozenttopf,
- `more` und `less` werden multiplikativ verkettet,
- Quellen bleiben nachvollziehbar erhalten,
- die Ausgabe ist stabil sortiert und eingabereihenfolgeunabhängig.

Beispiel: 20 % und 5 % verringerter Angriffsschaden ergeben netto 15 %
`increased/reduced`; 10 % mehr, 20 % mehr und 10 % weniger ergeben den
Multiplikator `1,188`.

## Grenzen

Bedingte und ziellose Effekte gelangen nicht in die Aggregation. Die
Zielbereiche sind weiterhin technische Wirkungsvektoren. Sie werden noch
nicht als DPS, Trefferfrequenz, Verteidigungsendwert oder Ressourcen-Uptime
ausgegeben. Das bestehende Ranking wurde nicht verändert.

Der nächste Schritt muss diese neutralen Vektoren kontrolliert mit konkreten
Skill-, Waffen-, Gegner- und Defensivformeln verbinden.
