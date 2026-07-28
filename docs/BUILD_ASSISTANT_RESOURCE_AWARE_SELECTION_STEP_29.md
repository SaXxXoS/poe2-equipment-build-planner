# Schritt 29: Ressourcenbewusste Skill- und Supportauswahl

## Ziel

Die automatische Auswahl verwendet die in den Schritten 24 bis 28 belegten
Mana-, Kostenmultiplikator-, Geist- und Reservierungsdaten bereits während
der Empfehlung. Die Ressourcenprüfung ist keine nachträgliche reine Anzeige
mehr.

## Hauptfertigkeit

Für jeden automatischen Hauptskill wird mit Charakterlevel und dem geplanten
Waffenset eine Ressourcenbilanz erzeugt. Eine Kombination wird nicht vor
einer nutzbaren Alternative gewählt, wenn:

- ein bestätigter Null-Mana-Zustand ihre belegten Manakosten unbrauchbar
  macht oder
- ihre Geistreservierung selbst die levelbasierte Quest-Obergrenze
  überschreitet.

Unvollständige Kostenketten bleiben unbekannt und erzeugen weder einen
positiven Bonus noch einen erfundenen Ausschluss.

## Supports

Supports werden weiterhin zuerst durch die bestehenden fachlichen
Kompatibilitätsregeln gefiltert. Beim Befüllen jedes freien Platzes wird die
gesamte aktuelle Setup-Liste erneut geprüft. Berücksichtigt werden:

- exakte Kostenmultiplikatoren,
- Kosten relativ zum bestätigten Mindest-Manapool,
- bestätigte dauerhafte Deckung,
- nur kurzfristig bezahlbare Kosten,
- Geistreservierung in Waffenset 1 und Waffenset 2,
- Supportfamilien und Ausschlusskategorien.

Eine sicher unbrauchbare Kombination wird übersprungen. Zwischen fachlich
zulässigen Kandidaten wird die ressourcenschonendere belegte Kette bevorzugt.
Manuell gewählte Supports werden nicht heimlich entfernt.

## Variantenoptimierung

Die gemeinsame Skill-, Waffen-, Support- und Set-2-Optimierung erhält
denselben Ressourcenstatus. Ressourcenrisiken reduzieren den Variantenwert;
bestätigt unbrauchbare Kombinationen werden blockiert. Die sichtbare
Begründung nennt, ob die Kombination dauerhaft gedeckt, nur kurzfristig
nutzbar oder noch unvollständig belegt ist.

## Grenzen

Die Entscheidung verwendet ausschließlich belegte Projektdaten. Unbekannte
Aktionsfrequenzen, Questabschlüsse, bedingte Regeneration und
fertigkeitsspezifische Sonderregeln werden nicht erfunden. Eine technisch
unvollständige Kette bleibt auswählbar, erhält aber keinen positiven
Ressourcenbonus.

## Prüfung

- 29 fokussierte Skill-, Support-, Varianten- und Ressourcentests erfolgreich
- 1.255 Tests in 97 Testdateien fachlich erfolgreich
- ein paralleler Zeitabbruch des Lokalisierungsaudits seriell erfolgreich
  bestätigt
- Typecheck, Lint, Produktions- und Pages-Build erfolgreich
- 155 JSON-Dateien validiert

## Nächster Schritt

Schritt 30 soll die Ressourcenprüfung nach der Passiv- und
Aszendenzplanung erneut ausführen und bei einer dort entstehenden
Unterdeckung eine belegte alternative Supportkombination vorschlagen.
