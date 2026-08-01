# Schritt 114 – Attributabhängige Sekundärwirkungen

## Ergebnis

Das in Schritt 113 vereinheitlichte Attributmodell speist nun auch die lokal und exakt belegbaren Sekundärwirkungen des gepinnten passiven Baums. Die Berechnung ist waffensetspezifisch und schließt die vergebenen Aszendenzknoten ein.

Produktiv berechnet werden ausschließlich diese fünf exakten Formen:

- erhöhter Schaden pro voller Stärkeschwelle,
- erhöhter Zauberschaden pro voller Stärkeschwelle, ausschließlich für Zauber,
- erhöhte Angriffsgeschwindigkeit pro voller Geschicklichkeitsschwelle, ausschließlich für Angriffe,
- erhöhter Schaden pro voller Schwelle des niedrigsten Attributs,
- erhöhter Ausweichwert pro voller Intelligenzschwelle.

Die Anzahl erfüllter Schwellen wird mit `floor(Attribut / Schwelle)` bestimmt. Bruchteile einer Schwelle geben keinen Effekt. Flache und prozentuale Attribute aus Ausrüstung, aktivem Waffenset, normalen Passiven und Aszendenz werden vorher genau einmal aggregiert.

## Trefferchance

Die Angriffstrefferchance verwendet jetzt dasselbe vollständige Geschicklichkeitsmodell. Die zuvor getrennte Teilzählung für flache Geschicklichkeit wurde entfernt. Dadurch fließen kombinierte Attribute sowie erhöhte, verringerte, mehr und weniger Geschicklichkeit konsistent in die PoB2-Genauigkeitsformel ein.

## Fail-closed-Grenze

Nicht importiert oder geschätzt werden weiterhin insbesondere:

- frei wählbare Attribute,
- Attributersatzregeln,
- inhärente Attributbonus-Umschreibungen,
- Körperrüstungs- oder Anforderungsabhängigkeiten,
- Schwellen-, Lebens- und Begleitereffekte ohne vollständiges Zielmodell.

Diese Wirkungen benötigen jeweils ein eigenes, belegtes Zustands- und Aggregationsmodell.

## Quellen

- `data-sources/poe2-tree/raw/0.5.2/data.json`
- gepinnte PoB2-Formel für Trefferchance und Genauigkeit
- technische Affixwerte der eingegebenen Ausrüstung

## Nächster Schritt

Schritt 115 erschließt die verbleibenden eindeutig modellierbaren Attributwirkungen für Leben, Betäubungs- und Beeinträchtigungsschwellen sowie regelverändernde Attributmechaniken getrennt und fail-closed.
