# Build-Assistent – Ressourcenbilanz je Fertigkeit und Waffenset (Schritt 32)

## Ziel

Die bereits berechneten Ressourcenwerte werden verständlich und getrennt je
Fertigkeit sowie je Waffenset dargestellt. Die Ansicht ergänzt keine neue
Spielregel und erfindet keine fehlenden Werte.

## Dargestellte Werte

Je Fertigkeitssetup zeigt die App:

- Fertigkeit und Waffenset,
- belegte Grundkosten pro Nutzung oder Sekunde,
- Kosten nach gewählten Supports,
- Nutzungen pro Sekunde,
- Mana-Bedarf pro Sekunde,
- wirksamen bestätigten Mana-Mindestbestand,
- wirksame bestätigte Mana-Regeneration,
- Support-Kostenfaktor,
- Kostenfaktor aus tatsächlich vergebenem Passivbaum und Aszendenz,
- bestätigten flachen Geistbeitrag,
- verständlichen Tragfähigkeitsstatus.

Geist wird zusätzlich getrennt für Waffenset 1 und Waffenset 2 mit
Planungskapazität, Reservierung und verbleibender Kapazität ausgewiesen.

## Datenbasis und Grenzen

Die Bilanz verwendet ausschließlich das vorhandene Ressourcenmodell:

- lokal gepinnte Fertigkeitsgrundkosten,
- lokal gepinnte Support-Kostenmultiplikatoren,
- tatsächlich vergebene Ressourcenwirkungen aus Passivbaum und Aszendenz,
- bestätigte Ausrüstungsbeiträge,
- konservative, levelabhängige Mindestpools,
- getrennte Geistreservierung beider Waffensets.

Eine levelbasierte Quest-Geistmenge bleibt ausdrücklich eine
Planungsschätzung und kein Nachweis abgeschlossener Questbelohnungen.
Unvollständige Grundkosten, Supportmultiplikatoren, Wirkfrequenzen, Pools oder
Reservierungsketten werden sichtbar als `Unbekannt` beziehungsweise
`Tragfähigkeit unbekannt` ausgewiesen.

## Ergebnis

Die App erklärt nun direkt, warum eine Fertigkeitskombination dauerhaft
tragfähig, nur kurzfristig bezahlbar oder mangels belegter Daten nicht
abschließend bewertbar ist. Die Berechnung selbst und ihre fail-closed
Grenzen bleiben unverändert.

## Nächster Schritt

Als Schritt 33 sollte die Ressourcenbilanz in den Vorher-/Nachher-Vergleich
der Buildvarianten einfließen, damit der Nutzer die verworfene und die
ressourcentragfähige Kombination direkt miteinander vergleichen kann.
