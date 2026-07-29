# Schritt 71 – zusätzliche Schadensskalierung pro Wut

## Ergebnis

Der bestätigte Wutzustand berücksichtigt jetzt neben der intrinsischen
Angriffsschadenswirkung auch exakt belegte passive und
Aszendenz-Schadenszeilen der Form:

- `Every Rage also grants …`
- `Every N Rage also grants …`

Unterstützt werden ausschließlich eng begrenzte `increased`- und
`more`-Schadensmuster mit eindeutigem Schadens- oder Skillbezug. Freie
Textähnlichkeit, unvollständige Texte und nicht passende Skillarten erzeugen
keinen Bonus.

## Quellenbeleg

Maßgeblich bleibt der gepinnte lokale PoB2-Stand. `ModParser.lua` ordnet diese
Zeilen dem Wutwirkungsmultiplikator zu. Der generierte Baum enthält unter
anderem:

- `Bestial Rage`: je 10 Wut 12 % erhöhter physischer Schaden
- `Ichlotl's Inferno`: je Wut 1 % erhöhter Feuerschaden
- `Mystical Rage`: je Wut 2 % erhöhter Zauberschaden
- `Druidic Champion`: je 2 Wut 1 % mehr Zauberschaden

## Rechenweg

Für den bestätigten Vergleichswert bei voller Wut wird die Schadenskette
separat neu gerechnet:

1. Grundschaden und bestätigte Umwandlungen
2. normale und wutabhängige `increased`-Wirkungen
3. Gain-as-extra
4. quantitative Supportwirkungen
5. wutabhängige `more`-Wirkungen
6. Lucky-Erwartungswert
7. Trefferchance und kritischer Erwartungswert
8. intrinsische Wutwirkung
9. gegnerische Minderung

Der normale Dauerschadenswert bleibt unverändert, solange der Wutzustand
nicht als dauerhaft erreicht und gehalten belegt ist.

## Versionen und Tests

- Schadensrechner: `3.12.0`
- Wutvergleich: `2.1.0`
- fokussierte Tests: 88 erfolgreich

Die Ausgabe führt die tatsächlich angewandten wutabhängigen Wirkungen samt
Quellknoten, Text, Art, Gesamtprozentsatz und Wutteilung auf.

## Verbleibende Grenze

Komplexere konditionale Wutzeilen, Minion-Wutwirkungen und frei formulierte
Mechaniken bleiben blockiert, bis ein exakter strukturierter Rechenpfad
vorliegt. Eine vollständige Gleichwertigkeit mit PoB2 ist damit noch nicht
belegt.
