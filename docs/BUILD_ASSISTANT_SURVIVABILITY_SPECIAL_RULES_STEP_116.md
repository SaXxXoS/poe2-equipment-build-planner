# Schritt 116 – Sonderregeln für Leben und Betäubungsschwelle

## Ergebnis

Das Charakter-Überlebensmodell bildet jetzt die lokal gepinnten PoB2-Sonderregeln für inhärente Attributboni, Chaos Inoculation und alternative Betäubungsschwellenbasen explizit ab. Die Regeln werden nur angewandt, wenn der zugeteilte Passiv- oder Aszendenzknoten die exakte Quellzeile enthält und die benötigte Bezugsgröße bestätigt berechnet wurde.

## Attribut-Sonderregeln

Die Reihenfolge entspricht `CalcPerform.lua`:

1. `Gain no inherent bonuses from Attributes` entfernt alle für dieses Modell relevanten inhärenten Attributboni.
2. `Gain no inherent bonus from Strength` beziehungsweise `Strength provides no bonus to maximum Life` entfernt den Stärke-Lebensbonus.
3. `Inherent Life granted by Strength is halved` ändert den Grundwert von zwei auf ein Leben je Stärke.
4. `Inherent bonuses gained from Attributes are doubled` verdoppelt den danach verbleibenden inhärenten Bonus.

Dadurch ergeben halbiertes und zugleich verdoppeltes Stärke-Leben zusammen exakt zwei Leben je Stärke. Es wird keine frei erfundene Priorität verwendet.

## Chaos Inoculation

Bei belegtem `Maximum Life is 1` wird maximales Leben auf eins gesetzt. Das Modell bewahrt `preOverrideMaximum` und verwendet entsprechend `CalcDefence.lua` dieses Leben vor Chaos Inoculation als Betäubungsschwellenbasis. Die elementare Beeinträchtigungsschwelle verwendet weiterhin das tatsächlich verbleibende maximale Leben.

## Alternative Betäubungsschwellenbasis

Unterstützt werden die exakten Formen:

- vollständiger oder prozentualer Energieschild statt Leben,
- prozentuales Mana statt Leben,
- ein bestätigter Energieschildanteil zusätzlich zur Basis.

Energieschild stammt aus dem Charakter-Verteidigungsmodell. Mana stammt aus der zum aktiven Fertigkeitssetup gehörenden bestätigten Ressourcenberechnung. Fehlt die Bezugsgröße oder sind mehrere widersprüchliche Basisregeln aktiv, wird die Sonderregel in `blockedLines` aufgenommen und nicht angewandt.

## Grenzen

Laufzeitbedingungen wie erhobener Schild, kürzlich erlittene Betäubung, eingehender Trefferschaden und andere nicht im Buildzustand bestätigte Bedingungen bleiben blockiert. Path-of-Building-Gleichwertigkeit ist weiterhin nicht belegt.

## Nächster Schritt

Als Nächstes werden zusätzliche, lokal exakt belegbare Schwellenbeiträge aus Rüstung, Energieschild und Ausrüstungspositionen modelliert. Dabei bleiben bedingte Zustände fail-closed.
