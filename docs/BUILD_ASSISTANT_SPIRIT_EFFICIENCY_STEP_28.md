# Schritt 28: Quest-Geist und Reservierungseffizienz

## Ergebnis

Die App berücksichtigt Geistkapazität nun ohne weitere Nutzereinstellung.
Der gepinnte PoB2-Stand belegt drei permanente Questbelohnungen:

- Freythorn, King In The Mists: +30 Geist ab Gebietsstufe 11
- Azak Bog, Ignagduk: +30 Geist ab Gebietsstufe 36
- Kriar Village, Lythara: +40 Geist ab Gebietsstufe 61

Das Charakterlevel beweist keinen Questabschluss. Deshalb ist die Summe
aus den für das Level erreichbaren Belohnungen ausdrücklich eine
`level-derived-upper-bound-not-completion-proof`-Planungsschätzung. Sicher
bestätigte Ausrüstungs-, Passiv- und Aszendenzbeiträge bleiben davon
getrennt.

## Reservierungsformel

Die Reservierung verwendet die im gepinnten PoB2-Rechenkern belegte Formel:

`gerundet(Basisreservierung / (1 + erhöhte Effizienz / 100) / Mehr-Effizienz)`

Allgemeine, unbedingte Reservierungseffizienz aus tatsächlich vergebenen
Passiv- und Aszendenzknoten wird waffensetspezifisch angewandt. Bedingte,
fertigkeitsspezifische und nicht eindeutig zuordenbare Texte bleiben
fail-closed.

## Anzeige und Status

Für beide Waffensets werden separat angezeigt:

- sicher bestätigte Mindestkapazität,
- levelbasierte Quest-Geist-Schätzung,
- Planungskapazität,
- Grundreservierung,
- Reservierung nach Effizienz,
- verbleibender Geist,
- Evidenz- und Deckungsstatus.

Eine unter der Quest-Schätzung passende Kombination wird nicht als sicher
bestätigter Questabschluss dargestellt. Reicht selbst die Planungskapazität
nicht, wird die Unterdeckung eindeutig gemeldet.

Ohne Levelangabe wird keine Questbelohnung angenommen. Überschreitet eine
Reservierung dann die sicher bestätigte Mindestkapazität, bleibt die
dauerhafte Nutzbarkeit ausdrücklich unbekannt.

## Prüfung

- 1.250 Tests in 97 Testdateien fachlich erfolgreich
- 20 fokussierte Ressourcen-/Geisttests erfolgreich
- zwei parallele Zeitüberschreitungen seriell erfolgreich wiederholt
- Lint, Typecheck, Produktions- und Pages-Build erfolgreich
- 154 JSON-Dateien validiert
- Referenzdatei SHA-256:
  `a05dd0b71c4d50fd41b9df9c4b732aa2cc4e6938fe82536432ab3fe130034ebe`

## Grenzen und nächster Schritt

Questabschluss, fertigkeitsspezifische Reservierungseffizienz, bedingte
Aszendenzmechaniken und besondere Umwandlungen sind weiterhin unbekannt,
sofern sie nicht strukturiert transportiert werden. Schritt 29 soll die
automatische Fertigkeits- und Supportauswahl anhand der jetzt verfügbaren
Kosten-, Nachhaltigkeits- und Geistbilanz ressourcenbewusst optimieren.
