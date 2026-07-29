# PoE2-Regelverständnisschicht

## Ziel

Die App darf einen Build nicht mehr aus Kandidaten zusammensetzen, nur weil
deren Namen oder allgemeine Tags ähnlich aussehen. Jede automatisch
eingesetzte Zusatzfertigkeit benötigt eine nachvollziehbare, getestete
Wirkungsbeziehung zum Hauptskill.

## Erster umgesetzter Regelschnitt

Die zentrale Prüfung `poe2-interaction-rules.ts` unterscheidet:

- `structured-exact`: direkt strukturierte Rolle oder Wirkung;
- `structured-derived`: vollständig aus mehreren strukturierten Feldern
  abgeleitete Beziehung;
- `explicit-rule`: ausdrücklich implementierte und getestete PoE2-Interaktion;
- `heuristic-only`: Kandidatenhinweis ohne produktive Freigabe;
- `blocked`: technisch unpassend.

`heuristic-only` und `blocked` erzeugen keinen positiven Synergie-Score und
füllen keinen Fertigkeitsslot.

## Aktuell produktiv belegte Beziehungen

- Kugel der Stürme ergänzt einen gewirkten Blitzzauber.
- Elementarschwäche bereitet Feuer-, Kälte- oder Blitzschaden vor.
- Verwundbarkeit bereitet physischen Schaden vor.
- Verzweiflung bereitet Chaosschaden vor.
- Voltaische Markierung bereitet einen Blitzangriff vor.
- Ein generisches Set-2-Setup wird nur übernommen, wenn strukturierte Daten
  eine Ziel-, Spieler- oder Folgeskillwirkung und deren Fortbestand nach dem
  Waffenwechsel belegen.
- Eigenständige Bewegung oder Defensive wird nur über eine strukturierte Rolle
  übernommen; defensive Wirkung benötigt zusätzlich eine belegte
  Spielerwirkung.

## Nicht mehr zulässig

- zwei Skills wegen eines gemeinsamen Feuer-, Kälte-, Blitz-, Chaos- oder
  physischen Tags automatisch verbinden;
- einen beliebigen Buff, Debuff oder Utility-Skill als Füllskill einsetzen;
- aus einem hohen isolierten Analyzer-Score eine Interaktion ableiten;
- Set 2 verwenden, wenn die vorbereitende Wirkung nach dem Wechsel nicht
  belegt ist.

## Quellen- und Versionsstatus

Die produktiven Datenpins im Repository bleiben unverändert. Offizielle
PoE2-Seiten bestätigen die fortlaufende Änderung von Skills, Aszendenzen und
Passivregeln. Die vollständige Übereinstimmung jeder lokalen Regel mit allen
Mechaniken der aktuellen Saison ist noch **Unbekannt**. Deshalb wird die
Regelschicht schrittweise aus strukturierten lokalen Daten und ausdrücklich
belegten Interaktionen erweitert.

## Nächster Ausbau

1. Auslöser- und eingebettete Fertigkeiten vollständig über dieselbe
   Evidenzprüfung führen.
2. Waffenanforderungen und Waffenwechselwirkungen zentral zusammenführen.
3. Flüche, Marken, Exposition, Zustände, anhaltende Flächen und Buffs
   mechanikweise katalogisieren.
4. Aszendenz- und Passivwirkungen als explizite Wirkungsgraphen anbinden.
5. Erst danach DPS-orientierte Paketoptimierung über ausschließlich gültige
   Kombinationen durchführen.

