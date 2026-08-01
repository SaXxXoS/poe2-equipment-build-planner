# Schritt 113 – Vollständigere Attributaggregation

## Ergebnis

Das Charakterattributmodell verarbeitet neben einzelnen flachen Stärke-, Geschicklichkeits- und Intelligenzwerten jetzt auch kombinierte Attributzeilen sowie eindeutig formulierte erhöhte, verringerte, mehr und weniger Modifikatoren aus dem gepinnten Passivbaum `0.5.2`.

Die Reihenfolge ist deterministisch:

1. bestätigte Klassenbasis
2. technische flache Ausrüstungswerte des aktiven Waffensets
3. flache Werte der belegten gemeinsamen, waffensetspezifischen und Aszendenzknoten
4. additive erhöhte/verringerte Modifikatoren
5. multiplikative mehr/weniger Modifikatoren
6. Abrundung auf ganzzahlige Attribute

## Neu unterstützte Baumformen

- `+# to Strength and Dexterity` sowie die entsprechenden anderen Attributpaare
- `#% increased/reduced Strength, Dexterity, Intelligence oder Attributes`
- `#% more/less Strength, Dexterity, Intelligence oder Attributes`
- einfache Baum-Markupformen wie `[Strength]` zusätzlich zu `[Strength|Strength]`

Im vollständigen gepinnten Baum kommen 463 attributbezogene Statzeilen vor. Davon sind nun 106 einzelne flache, 15 flache Alle-Attribute-, 7 kombinierte Paar- und 12 prozentuale Zeilenformen deterministisch strukturiert. 323 Vorkommen bleiben absichtlich außerhalb dieses Attributsummenmodells, weil sie Wahlmöglichkeiten, Bedingungen, Anforderungen oder aus Attributen abgeleitete andere Wirkungen beschreiben.

## Fail-closed-Grenzen

Nicht automatisch angewandt werden insbesondere:

- `+5 to any Attribute`, solange die Spielerwahl nicht im Buildmodell festgelegt ist
- `Body Armour grants 20% increased Strength`, solange die genaue lokale Wirkungsbasis nicht separat modelliert ist
- Schaden, Angriffsgeschwindigkeit, Ausweichen oder Schwellenwerte pro Attribut
- geänderte Gemmen- und Ausrüstungsanforderungsregeln
- verdoppelte oder ersetzte inhärente Attributboni

Diese Zeilen bleiben in `blockedPassiveLines` sichtbar und erzeugen keinen erfundenen Wert.

## Rückwärtskompatibilität

Bereits gespeicherte Attributmodelle mit der Kennung `pinned-tree-0.5.2-v1` bleiben lesbar. Neue Berechnungen verwenden `pinned-tree-0.5.2-v2-percentages`.

## Nächster Schritt

Die nächste Rechenlücke sind belegte Sekundärwirkungen pro Attribut, beispielsweise Schaden pro Stärke oder Angriffsgeschwindigkeit pro Geschicklichkeit. Sie müssen in die jeweils zuständigen Wirkungsmodelle einfließen und dürfen nicht als zusätzliche Attribute missverstanden werden.
