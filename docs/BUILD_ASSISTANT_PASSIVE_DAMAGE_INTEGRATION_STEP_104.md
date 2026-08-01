# Schritt 104 – strukturierte Passivwirkungen in der Schadenskette

## Ergebnis

Die Schadensschätzung verwendet für vergebene normale, waffensetspezifische
und Aszendenzknoten nicht mehr ausschließlich eine kleine, separat gepflegte
Regex-Liste. Eindeutige Prozentwirkungen werden jetzt über denselben
Passivklassifikator und dasselbe strukturierte Wirkungsmodell ausgewertet, das
den vollständigen gepinnten Baum abdeckt.

Numerisch verbunden sind:

- allgemeiner sowie schadensartspezifischer Schaden,
- elementarer Schaden,
- zu einer Fertigkeit passende Angriffs-, Zauber-, Projektil-, Nahkampf- und
  Flächenskalierung,
- Angriffs- und Zaubergeschwindigkeit,
- erhöhte beziehungsweise verringerte kritische Trefferchance,
- additive `increased/reduced`-Wirkungen,
- getrennt multiplikative `more/less`-Wirkungen.

Die Berechnung verwendet nur tatsächlich vergebene Knoten des aktiven
Waffensets einschließlich der getrennt geplanten Aszendenzknoten. Unpassende
Mechaniken, unbekannte Ziele und nicht bestätigte Bedingungen erzeugen keinen
numerischen Bonus.

## Rechenregeln

- `increased` und `reduced` werden zunächst additiv saldiert.
- `more` und `less` werden anschließend multiplikativ verknüpft.
- Ein Schadensmultiplikator kann den Ergebniswert nicht unter null drücken.
- Schadensart und ursprüngliche Schadensherkunft bleiben bei Umwandlungen
  erhalten; dadurch wirken belegte Quell- und Zielskalierungen weiterhin in
  der bestehenden PoE-Reihenfolge.
- Die Reihenfolge der Quelldaten beeinflusst das Ergebnis nicht.

## Fail-closed-Grenzen

Komplexe Zustände wie „while“, „if“, „when“, „recently“, „on hit“ oder
gegnerabhängige Aussagen werden weiterhin nicht automatisch als dauerhaft
aktiv behandelt. Gain-as-extra, Umwandlungen, Wut, Gegnerzustände und weitere
Sondermechaniken behalten ihre bereits vorhandenen, engeren Fachmodelle.

Die Änderung verbindet damit einen wesentlichen Teil der 3.008 in Schritt 102
als aggregationsbereit gemessenen Zeilen mit der realen Schadenskette. Sie
belegt noch keine vollständige numerische Gleichwertigkeit mit Path of
Building 2, weil flache Verteidigungs-, Attribut-, Ressourcen- und zahlreiche
bedingte Sonderwirkungen noch getrennt zu vervollständigen sind.

## Prüfung

- Strukturierte `more`-Wirkung wird getrennt von `increased` berechnet.
- Eine bedingte Schadenszeile wird nicht eingerechnet.
- Die vorhandenen Treffer-, Umwandlungs-, Gain-as-extra-, Support-,
  Gegnerabwehr- und PoB2-Mikrovergleichstests bleiben erfolgreich.

