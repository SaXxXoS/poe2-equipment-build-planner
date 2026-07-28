# Geistreservierungen und bestätigte Mindestkapazität – Schritt 27

## Ziel

Die App ermittelt Geistreservierungen automatisch aus den bereits gepinnten
lokalen Gemmendaten und stellt sie der sicher belegbaren Geistkapazität
gegenüber. Dafür gibt es keine neue Benutzereinstellung.

## Gepinnte Datengrundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Gemmenzuordnung: lokales `skill_gems.json`
- Reservierungswerte: `static.reservations.spirit` der über
  `grants_skills` verbundenen Einträge aus dem lokalen `skills.json`

Der produktive Gemmenkatalog enthält 235 Fertigkeiten, davon besitzen 51 eine
eindeutige strukturierte Geistreservierung. Katalogschema 3 transportiert
Quell-Skill-IDs, Reservierungsbetrag und Auflösungsstatus.

## Reservierungsbilanz

Jede ausgewählte Fertigkeit mit exakter Geistreservierung wird über ihre
stabile Fertigkeits-ID und ihr Waffenset erfasst:

- `Waffenset 1` belastet nur Set 1.
- `Waffenset 2` belastet nur Set 2.
- `Beide` belastet beide Sets, da die Fertigkeit unabhängig vom aktiven
  Waffenset reserviert bleibt.

Die bestätigte Mindestkapazität besteht ausschließlich aus eindeutig
transportierten flachen Geistwerten der Ausrüstung und aus tatsächlich
vergebenen, exakt klassifizierten Passiv- beziehungsweise
Aszendenzwirkungen. Prozentuale Wirkungen werden erst auf diese belegte
flache Basis angewandt.

## Status und Fail-closed-Grenze

Pro Waffenset wird genau einer dieser Status ausgegeben:

- `fits-confirmed-minimum`: Schon die bestätigte Mindestkapazität deckt alle
  bekannten Reservierungen.
- `exceeds-confirmed-minimum`: Die bekannten Reservierungen übersteigen nur
  die bestätigte Mindestkapazität.
- `blocked-incomplete-reservation-chain`: Mindestens ein Betrag ist nicht
  eindeutig aufgelöst.
- `no-reservations`: Für das Waffenset besteht keine erkannte Reservierung.

`exceeds-confirmed-minimum` ist bewusst **kein endgültiges
Unspielbarkeitsurteil**. Quest-Geist und weitere derzeit nicht vollständig
transportierte Kapazitätsquellen können die Differenz decken. Die App zeigt
deshalb eine Warnung, verwirft die Kombination aber nicht automatisch.

`You have no Spirit` setzt die bestätigte Kapazität auf null. Unbekannte
Reservierungen, bedingte Effekte und freie Textannahmen erzeugen keinen Wert.

## Anzeige

Die Ergebnisansicht zeigt jede erkannte Reservierung sowie bestätigte
Mindestkapazität, reservierten und verbleibenden Geist und den Prüfstatus
getrennt für beide Waffensets.

## Unveränderte Grenzen

- keine neue externe Datenquelle,
- kein Runtime-Netzwerk,
- keine geschätzte Quest-Geistmenge,
- keine automatische negative Sperre aus einer konservativen Mindestbilanz,
- keine Änderung der Produktpins,
- keine vollständige PoB-Gesamt-DPS-Behauptung.

## Ergebnis

Schritt 27 schließt die exakte Fertigkeit-zu-Geistreservierungskette für 51
produktive Fertigkeiten. Eine positive Deckungsaussage ist belastbar, wenn
bereits die bestätigte Mindestkapazität genügt. Eine negative Gesamtaussage
bleibt ohne vollständige Geistkapazität ausdrücklich offen.

Die fokussierten Reservierungs-, Schadens- und Katalogtests sowie alle 1.249
fachlichen Tests der Gesamtsuite sind erfolgreich. Vier unter paralleler Last
am Zeitlimit abgebrochene Alt-Tests wurden seriell erfolgreich wiederholt.
Lint, Typecheck, Produktions-Build, Pages-Build und JSON-Validierung sind
ebenfalls erfolgreich.

## Nächster Schritt

Schritt 28 soll die noch fehlenden lokal belegbaren Geistkapazitätsquellen,
insbesondere Quest-Geist, sowie bestätigte Reservierungseffizienz
erschließen. Erst mit dieser geschlossenen Kapazitätskette darf die
automatische Optimierung Reservierungen verbindlich als nutzbar oder nicht
nutzbar behandeln.
