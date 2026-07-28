# Passive-, Aszendenz- und Waffenset-Ressourcen – Schritt 26

## Ziel

Schritt 26 verbindet die in der realen Baumplanung tatsächlich vergebenen
Passiv- und Aszendenzknoten automatisch mit der Ressourcenbilanz aus Schritt
25. Es gibt keine neue Benutzereinstellung.

## Verarbeitete Wirkungen

Nur unbedingte, exakt lesbare Originalzeilen werden verwendet:

- flaches und prozentuales maximales Mana,
- erhöhte Manaregeneration,
- erhöhte beziehungsweise mehr Manakosten und verdoppelte Manakosten,
- flacher und prozentualer Geist,
- `No inherent Mana Regeneration`,
- `You have no Mana`.

Der gepinnte Baum enthält 95 exakt klassifizierbare Ressourcenzeilen dieser
engen Klassen, davon 14 auf Aszendenzknoten. Die Zahl beschreibt den
Quellbestand, nicht automatisch die in einem einzelnen Build vergebenen
Knoten.

## Waffensets und Aszendenz

Für eine Fertigkeit auf Waffenset 1 werden der gemeinsame Pfad, der
Set-1-Pfad und die vergebene Aszendenz ausgewertet. Für Waffenset 2 gilt
entsprechend der Set-2-Pfad. Eine Fertigkeit mit `Beide` verwendet nur den
gemeinsamen Pfad und die Aszendenz; sie erbt nicht gleichzeitig beide
Spezialisierungen.

## Berechnung

Der bestätigte Mindestpool aus Level und eindeutig strukturierten
Ausrüstungswerten wird um belegte flache und prozentuale Manawirkungen
ergänzt. Die natürliche Regeneration wird anschließend aus dem wirksamen
Mana und den belegten unbedingten Regenerationswerten berechnet.

Supportmultiplikatoren werden zuerst angewandt. Danach folgen belegte
Kostenwirkungen aus Baum und Aszendenz. Die Ergebnisansicht nennt pro
Fertigkeit die wirksamen Kosten, Mana, Regeneration, Verbrauch pro Sekunde,
Baum-/Aszendenzwirkungen und bestätigten flachen Geist.

## Fail-closed

Texte mit Bedingungen wie `while`, `if`, `when`, `recently`, `per` oder
ausrüstungsabhängigen Formeln erzeugen keinen automatischen Wert.
Mana-Kosteneffizienz wird noch nicht numerisch verwendet, weil ihre
vollständige Formel im aktuellen Produktmodell nicht geschlossen ist.

Geistbeiträge werden transparent ausgewiesen. Eine vollständige
Reservierungsbilanz wird weiterhin nicht behauptet, solange Grundkapazität
und sämtliche Reservierungsbeträge nicht geschlossen vorliegen.

`You have no Mana` blockiert eine bestätigte Manafertigkeit. Ein bloß
unzureichender konservativer Mindestwert wird nicht als endgültig unspielbar
bezeichnet, weil weitere Wiederherstellung fehlen kann.

## Technischer Status

- Ressourcenmodell: `5.0.0`
- Schadensrechner: `3.5.0`
- neue Datenquelle: keine
- Runtime-Netzwerk: keines
- Produktpins: unverändert

## Nächster Schritt

Schritt 27 soll Mana-Kosteneffizienz, vollständige Geistkapazität und
konkrete Reservierungsbeträge aus den bereits gepinnten lokalen Quellen
erschließen.
