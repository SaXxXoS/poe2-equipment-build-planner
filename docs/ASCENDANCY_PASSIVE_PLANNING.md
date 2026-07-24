# Aszendenzpunkte und Aszendenzplanung

## Ziel

Die App führt Aszendenzpunkte als eigenen Punkttyp. Der Nutzer gibt im
Charakterbereich selbst an, wie viele Aszendenzpunkte verfügbar sind.
Zulässig sind ausschließlich ganze Werte von 0 bis 8.

## Trennung der Budgets

- Normale Passivpunkte stammen aus Charakterlevel und Story-Passivpunkten.
- Waffen-Set-Punkte sind eine Aufteilung des normalen Passivpunktebudgets.
- Aszendenzpunkte sind ein separates Budget und werden weder vom normalen
  Budget abgezogen noch zu diesem addiert.
- Ein Punkt in Waffenset 1 und derselbe umgeschaltete Punkt in Waffenset 2
  bleiben weiterhin ein normaler Passivpunkt.

## Eingabe und Validierung

Der Charakterbereich enthält das Feld `Aszendenzpunkte`. Ein leerer Wert oder
`0` startet keine Aszendenzplanung. Werte von 1 bis 8 starten nur dann eine
Planung, wenn eine unterstützte Aszendenz ausgewählt ist. Negative Werte,
Dezimalwerte und Werte über 8 werden fail-closed abgewiesen.

## Planung

Die bestehende Passive-Pipeline besitzt dafür den expliziten Scope
`ascendancy`. Sie löst den offiziellen Start der gewählten Aszendenz auf,
traversiert ausschließlich deren Start- und Aszendenzknoten und verwendet
höchstens das eingegebene Budget. Andere Aszendenzen und normale Baumknoten
sind ausgeschlossen.

Die App füllt nicht zwangsläufig alle eingegebenen Punkte. Fehlen positiv
belegte, konfliktfreie Kandidaten, bleibt das Restbudget sichtbar. Dadurch
werden keine fachlich unbelegten Aszendenzentscheidungen erfunden.

## Darstellung

Nach der Analyse erscheint ein eigener Reiter `Aszendenz`. Der Baum markiert
dort nur den getrennten Aszendenzpfad. Budget, verbrauchte und verbleibende
Punkte werden separat ausgewiesen.

## Grenzen

Die Planung bleibt heuristisch und beansprucht keine global optimale
Aszendenzwahl. Baumquelle, Datenpins und Build-Architektur bleiben
unverändert.

