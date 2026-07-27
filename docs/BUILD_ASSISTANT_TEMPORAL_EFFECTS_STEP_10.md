# Automatisches Zeit- und Aufrechterhaltungsmodell – Schritt 10

## Ziel

Schritt 10 verbindet bereits belegte Wirkzeiten und die berechnete
Aktionsfrequenz des Hauptskills. Dafür gibt es keine neuen Pflichtfelder und
keine manuell einzustellende Uptime.

## Automatische Eingaben

- Hauptskill und aktives Waffenset
- berechnete Aktionen beziehungsweise Treffer pro Sekunde
- strukturierter Rüstungsbruch pro Treffer
- strukturierte Fluch-Wirkzeit und Fluch-Wirkzeitpunkt
- automatisch gewähltes Vergleichsgegnerprofil
- tatsächlich vergebene unbedingte Passive- und Aszendenzwirkungen

## Zeitstatus

Jede berücksichtigte Gegnerwirkung besitzt genau einen Zeitstatus:

- `permanent`: eine unbedingte passive Wirkung
- `maintainable`: nach Aufbau durch fortgesetzte Treffer aufrechterhaltbar
- `windowed`: belegtes Wirkfenster, aber keine belegte Wiederholungsfrequenz
- `ramping`: Wirkung befindet sich im Aufbau
- `unresolved`: vollständige Aufrechterhaltung ist nicht belegt

## Rüstungsbruch

Die App berechnet aus Zielrüstung, Rüstungsbruch pro Treffer und der
Aktionsfrequenz des Hauptskills:

1. Treffer bis zum vollständigen Rüstungsbruch
2. Zeit bis zum vollständigen Rüstungsbruch
3. ob der vollständige Zustand innerhalb der belegten zwölf Sekunden erreicht
   und durch weitere Treffer aufrechterhalten werden kann

Nur dann wird der belegte Vollzustand von vollständig gebrochener Rüstung in
der Gegnerrechnung verwendet. Der angezeigte Wert ist in diesem Fall ein
aufrechterhaltbarer Vollzustand nach der Aufbauphase, kein Durchschnitt über
die anfängliche Aufbauzeit.

Ein Rüstungsbruch-Skill, der nicht der Hauptskill ist, erhält ohne belegte
Rotationsfrequenz keine erfundene Anwendungshäufigkeit. Reicht ein einzelner
Treffer, wird lediglich ein zeitlich begrenztes Wirkfenster ausgewiesen.

## Flüche

Die strukturierte Wirkzeit und Wirkzeitpunkt eines gewählten Fluchs werden
angezeigt. Ohne belegte Rotation ist aber unbekannt, wie oft der Spieler den
Fluch erneut wirkt. Deshalb wird keine prozentuale Fluch-Uptime erfunden.

## Permanente Wirkungen

Unbedingte, tatsächlich vergebene Durchdringung aus Passivbaum oder
Aszendenz besitzt den Status `permanent`. Bedingte Knoten bleiben weiterhin
ausgeschlossen.

## Nicht automatisch behauptet

- Exposition ohne strukturierten Betrag
- Buff-Uptime ohne strukturierte Dauer und Aktivierungsregel
- Triggerfrequenzen ohne belegte Triggerbedingung und Abklingzeit
- eine exakte Kampfrotation
- ein Rampen-Durchschnitt über eine frei gewählte Kampfdauer
- vollständige Path-of-Building-Gesamt-DPS

## Determinismus

Bei identischem Build, Zielprofil und Quellenpin entstehen dieselben
Zeitstatus, Trefferzahlen, Aufbauzeiten und Schadenswerte. Das fachliche
Zeitmodell trägt die Version `1.0.0`; der Teilrechner trägt Version `2.2.0`.

## Ergebnis

Rüstungsbruch wird nicht länger pauschal als sofort vollständig angenommen.
Die App verwendet die tatsächliche berechnete Trefferfrequenz des
Hauptskills, zeigt die Aufbauzeit und trennt aufrechterhaltbare,
zeitbegrenzte und unbekannte Wirkungen sichtbar.

## Nächster Schritt

Als nächstes kann ein strukturiertes Rotations- und Triggerfenster aufgebaut
werden. Es darf nur Buffs, Debuffs und Trigger aufnehmen, deren
Aktivierungsregel, Dauer, Abklingzeit und numerische Wirkung im gepinnten
Projektbestand eindeutig belegt sind.
