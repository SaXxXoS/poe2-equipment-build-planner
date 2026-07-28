# Schritt 30: Ressourcen-Nachprüfung nach dem realen Passivplan

## Ziel

Die Ressourcen- und Geistbilanz wird nach der tatsächlichen Passiv-,
Waffenset- und Aszendenzplanung erneut berechnet. Damit wirken die wirklich
vergebenen Ressourcenknoten auf die abschließende Supportentscheidung.

## Korrigierte Integrationslücke

Der Worker lieferte bereits den kompakten realen Plan zurück. Beim
anschließenden erneuten Build-Lauf wurde jedoch nur das Planungsergebnis,
nicht auch der gepinnte offizielle Baum an die Schadens- und
Ressourcenrechnung übergeben. Ohne den Baum konnten die gewählten Knoten-IDs
nicht wieder ihren belegten Ressourcenwirkungen zugeordnet werden.

Der abschließende Build-Lauf erhält nun gemeinsam:

- den unveränderten offiziellen Passivbaum,
- den realen gemeinsamen Pfad,
- die beiden Waffensetpfade und
- den realen Aszendenzplan.

## Automatische Nachprüfung

Nach dem Worker-Lauf werden alle belegten Fertigkeitssetups nochmals mit
ihren vollständigen Kostenketten geprüft. Automatisch erzeugte Setups dürfen
auf eine fachlich kompatible, besser tragbare Supportkombination wechseln,
wenn diese nachweislich:

- einen bestätigten harten Ressourcenkonflikt beseitigt oder
- ein belegtes Ressourcenrisiko reduziert.

Die bestehende Support-Rangliste, harte Kompatibilität, Supportfamilien und
das Limit von fünf Supports bleiben maßgeblich.

## Nutzereingaben

Manuell gewählte Supportkombinationen werden nicht automatisch verändert.
Bei bestätigter Unterdeckung erscheint stattdessen eine klare Warnung im
Build-Ergebnis.

## Grenzen

Unbekannte Kosten, Aktionsfrequenzen, Questabschlüsse oder bedingte
Wiederherstellungen werden weiterhin nicht erfunden. Die Nachprüfung ist
keine vollständige Path-of-Building-Simulation und behauptet keine
unbelegbare dauerhafte Nutzbarkeit.

## Prüfung

- 25 fokussierte Ressourcen-, Support- und Nachprüfungstests erfolgreich
- 1.257 Tests in 98 Testdateien erfolgreich
- Typecheck, Lint, Produktions-Build und Pages-Build erfolgreich
- 156 JSON-Dateien validiert
- `git diff --check` und Git-Sicherheitsprüfung erfolgreich

## Nächster Schritt

Als nächstes sollte die Planung bei einer bestätigten Unterdeckung nicht nur
Supports austauschen, sondern kontrolliert prüfen, ob ein belegter
Ressourcenknoten als alternatives Passivziel fachlich besser ist.
