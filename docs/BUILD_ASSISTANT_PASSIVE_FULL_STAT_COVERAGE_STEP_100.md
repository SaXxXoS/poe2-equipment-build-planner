# Schritt 100 – vollständige semantische Baum-Statzeilen-Coverage

## Ergebnis

Alle 5.962 sichtbaren Statzeilen der 5.150 Knoten des gepinnten offiziellen
Passivbaums Release `0.5.2` werden deterministisch einer eng begrenzten
Mechanikfamilie zugeordnet. Die zuvor verbleibenden 41 Zeilen umfassen unter
anderem alternative Klassenstarts, Phylactery- und Time-Lost-Juwelregeln,
Immunitäten, Tailwind, Jade, Fissures, Charge-Transfer, geblockten
Trefferschaden, Crushing Blows sowie getrennte Chill- und Shock-Grenzen.

## Messwerte

- vorher klassifiziert: 5.921
- nachher klassifiziert: 5.962
- vorher ungelöst: 41
- nachher ungelöst: 0
- Coverage: 99,31 % → 100,00 %
- Passivklassifikator: `1.13.0`
- Passivziel-Analyzer: `1.1.0`

## Sicherheitsgrenze

Die 100,00 % belegen die semantische Erfassung der sichtbaren englischen
Baumtexte. Sie belegen **nicht**, dass jede Mechanik bereits numerisch wie in
Path of Building 2 berechnet wird. Neue Spezialtags erzeugen ohne eine
separate, getestete Wirkungsformel keinen freien Schaden, keine Uptime, keine
Triggerfrequenz und keinen Rankingbonus.

Die Richtung von Eigenschaden durch geblockte Treffer wird ausdrücklich als
negativ behandelt. Mehrdeutige Profilwirkungen bleiben trotz erkannter
Mechanik ohne positive Bewertung.

## Tests

Jede zuvor ungelöste Originalform besitzt einen fokussierten Klassifikationstest.
Zusätzlich sichern Boundary-Hashes die Klassifikator-, Regel- und
Konfigurationsstände. Vollständige rechnerische Gleichwertigkeit mit Path of
Building 2 bleibt weiterhin offen.
