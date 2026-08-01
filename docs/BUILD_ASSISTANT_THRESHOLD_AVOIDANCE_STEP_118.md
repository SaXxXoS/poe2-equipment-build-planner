# Build-Assistent – Schwellenmultiplikator und Vermeidung (Schritt 118)

## Ergebnis

Schritt 118 erweitert das Charakter-Survivability-Modell um exakt belegte PoB2-Regeln für Betäubungsschwelle, Betäubungsvermeidung und allgemeine Elementarbeeinträchtigungsvermeidung.

## Belegte Regeln

- `Your Stun Threshold is doubled` wird entsprechend `ModParser.lua` als `MORE 100` und damit als Multiplikator `2` angewandt.
- Unbedingte Chancen, Betäubung beziehungsweise Elementarbeeinträchtigungen zu vermeiden, werden addiert.
- Die effektive Vermeidung wird entsprechend `CalcDefence.lua` bei 100 Prozent gedeckelt.
- Unbedingte Betäubungsimmunität ergibt effektiv 100 Prozent Betäubungsvermeidung.
- `Cannot be Stunned while you have Energy Shield` wird nur bei explizit bestätigtem Zustand `hasEnergyShield` angewandt.

## Fail-closed-Grenze

Bedingte Vermeidung wie `while Channelling` wird ohne bestätigten Laufzeitzustand nicht eingerechnet. Die betreffende Quellzeile erscheint in `blockedLines`. Aus maximalem Energieschild wird nicht abgeleitet, dass aktuell Energieschild vorhanden ist.

## Unverändert unbekannt

- individuelle Vermeidung einzelner Beeinträchtigungen,
- bedingte Zustände ohne transportierten Laufzeitstatus,
- nicht technisch identifizierte sichtbare Gegenstandstexte,
- zeitabhängige Immunitäts- und Flask-Zustände.

Diese Punkte erzeugen keinen stillen defensiven Bonus.

## Versionen

- `CHARACTER_SURVIVABILITY_MODEL_VERSION`: `1.2.0`
- Schadensrechner: `3.32.0`
- PoB2-Quellpin bleibt unverändert.

## Nächster Schritt

Schritt 119 inventarisiert und integriert die lokal belegbaren individuellen Elementarbeeinträchtigungs-Vermeidungen und Immunitäten. Bedingte Varianten benötigen weiterhin einen expliziten, belegten Laufzeitzustand.
