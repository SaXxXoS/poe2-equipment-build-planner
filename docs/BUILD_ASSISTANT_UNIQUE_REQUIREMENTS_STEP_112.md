# Schritt 112 – Unique-Anforderungen je Waffenset

## Ergebnis

Der Unique Analyzer prüft belegte Attributanforderungen jetzt gegen das tatsächlich relevante Waffenset. Ein setübergreifend verwendbares Unique muss die Anforderung in beiden Sets erfüllen. Ein ausdrücklich Set 1 oder Set 2 zugeordnetes Unique wird nur gegen dieses Set geprüft. Fehlen die berechneten Charakterattribute, wird eine vorhandene Anforderung fail-closed blockiert.

## Produktive Datenlage

Der gepinnte PoB2-Produktbestand enthält 435 Unique-Gegenstände. In diesem reduzierten Produktmodell sind derzeit weder bestätigte Levelanforderungen noch bestätigte Stärke-, Geschicklichkeits- oder Intelligenzanforderungen vorhanden. Die produktive Coverage beträgt deshalb für beide Anforderungsarten 0 von 435.

Diese Angaben werden nicht aus dem sichtbaren Unique- oder Basistypnamen abgeleitet. Eine Namensähnlichkeit ist keine technische Identitätskette. Bis eine gesondert freigegebene, stabile Zuordnung existiert, bleiben diese produktiven Anforderungen unbekannt.

## Regeln

- gemeinsam verwendbares Unique: Prüfung in Set 1 und Set 2
- Set-1-Unique: Prüfung nur in Set 1
- Set-2-Unique: Prüfung nur in Set 2
- ausgerüsteter Waffenplatz: dessen Setzuordnung hat Vorrang
- fehlende Charakterattribute bei bekannter Anforderung: blockiert
- unbekannte produktive Anforderung: wird nicht erfunden

## Prüfung

Die fokussierte Suite deckt beide Sets, set-spezifische Prüfung und den fail-closed-Fall ab. Die sichtbare Ergebnisdarstellung erklärt fehlende Attributdaten auf Deutsch.

## Verbleibende Grenze

Eine produktive Prüfung der 435 PoB2-Uniques wird erst möglich, wenn eine freigegebene technische Identitätskette zu einer lokalen Quelle mit belegten Anforderungen vorliegt. Schritt 112 schafft dafür den korrekten Analyzerpfad, behauptet aber keine noch fehlenden Produktdaten.
