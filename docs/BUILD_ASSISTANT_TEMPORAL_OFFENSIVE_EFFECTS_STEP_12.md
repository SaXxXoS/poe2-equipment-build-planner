# Zeitabhängige Offensivwirkungen – Schritt 12

## Ziel

Schritt 12 verbindet strukturierte offensive Buffwerte mit der in Schritt 11
belegten Rotation. Die Verarbeitung läuft automatisch im Hintergrund. Es gibt
keine neue Nutzereinstellung.

## Zulassungskette

Eine zeitabhängige Wirkung darf nur numerisch angewandt werden, wenn gemeinsam
belegt sind:

1. die ausgewählte Quellfertigkeit,
2. der betroffene Hauptskilltyp,
3. ein strukturierter Zahlenwert,
4. das Wirkungsziel,
5. eine Aktivierungsregel der Bossrotation und
6. eine strukturierte Wirkzeit.

Fehlt ein Glied, bleibt die Wirkung `blocked` und verändert keinen
Schadenswert.

## Getrennte Vergleichswerte

Der bisherige Trefferschaden pro Sekunde bleibt der dauerhafte
Vergleichswert. Ein zeitlich begrenzter Buff erzeugt zusätzlich
`activeWindowDamagePerSecond`. Dieser Wert wird ausdrücklich als
„Im belegten Bufffenster“ angezeigt und nicht als dauerhafte DPS ausgegeben.

Wenn ein automatisches Gegnerprofil vorliegt, wird das aktive Fenster auch
nach derselben Gegnerabwehr berechnet.

## Produktiv angewandte Wirkung

### War Banner

Für eine Angriffshauptfertigkeit werden im belegten 9,8-Sekunden-Fenster
folgende strukturierte PoB2-Werte angewandt:

- 25 % mehr Angriffsschaden
- 25 % erhöhte Angriffsgeschwindigkeit
- 0,5 Sekunden Aktivierungszeit

Die Werte gelten nicht für Zauber. War Banner wird nur berücksichtigt, wenn es
ausgewählt und als einmalige Aktivierung in der Bossrotation vorhanden ist.

## Bewusst blockierte Wirkung

### Sigil of Power

Der strukturierte Bonus von 14 % mehr Zauberschaden pro Stufe ist vorhanden.
Die tatsächlich erreichte Stufenzahl und ihre Aufbauzeit sind in der aktuellen
Kette jedoch nicht vollständig belegt. Deshalb erzeugt Sigil of Power noch
keinen numerischen Bonus.

Defensive Bannerwerte, Flüche, Exposition und Rüstungsbruch werden nicht als
offensive Spielerbuffs doppelt gezählt. Gegnerwirkungen bleiben im getrennten
Gegnerwirkungsmodell.

## Implementierung

- Wirkungsmodell:
  `src/engine/damage-estimation/temporal-offensive-effects.ts`
- Schadensintegration:
  `src/engine/damage-estimation/estimate.ts`
- Rotationsübergabe:
  `src/engine/orchestration/analyze-build.ts`
- Anzeige:
  `src/components/BuildAssistantResultSection.tsx`

Modellversion: `1.0.0`  
Schadenteilrechner: `2.3.0`

## Tests

Geprüft werden:

- War Banner auf einer Angriffsfertigkeit
- getrennte Schadens- und Geschwindigkeitswirkung
- Wirkzeit und Aktivierungszeit
- Blockierung bei einer Zauberhauptfertigkeit
- Blockierung einer unvollständigen Zeitkette
- Blockierung von Sigil of Power ohne Stufenzahl
- deterministische Wiederholung
- getrennte Anzeige des aktiven Schadensfensters

## Grenzen

- keine erfundene durchschnittliche Uptime
- keine erfundene Kampfzeit
- kein automatisch angenommener maximaler Sigil-Aufbau
- keine Vermischung defensiver und offensiver Wirkungen
- keine vollständige Path-of-Building-Gesamt-DPS-Simulation

## Ergebnis

Belegte zeitabhängige Offensivwirkungen können nun die Schadensrechnung
verändern, ohne den dauerhaften Vergleichswert zu verfälschen. Unvollständige
Wirkungsketten bleiben sichtbar blockiert.

## Als Nächstes

Als nächster Schritt kann das Modell um weitere vollständig belegte
Buff-, Trigger- und Stapelwirkungen erweitert werden. Voraussetzung bleibt
dieselbe vollständige Zulassungskette.
