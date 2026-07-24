# Deutsche Anzeige der normalen PoE2-Affixe

## Ergebnis

Alle 2.255 produktiv auswählbaren technischen Affixe besitzen nun einen deutschen Anzeigetext. Die technische Affixquelle, Stat-IDs, Mod-IDs, Wertebereiche, Spawnweights und Analyzer-Semantik wurden nicht verändert.

## Quellen und Status

- 2.169 Affixe werden deterministisch über die gepinnte lokale deutsche CSD-Struktur, die exakte Stat-ID-Kette und die Wertebedingungen gerendert (`verified-local-source`).
- 86 Sonderfälle verwenden eine getrennt gekennzeichnete, deterministische deutsche App-Anzeigeübersetzung (`reviewed-app-translation`).
- `translation-missing`: 0.

Die App-Übersetzungen werden nicht als offizielle GGG-Lokalisierung bezeichnet. Sie betreffen vor allem Hybridzeilen, versteckte technische Waffenbasis-Effekte und Einträge, deren englischer Parsertext keine direkt renderbare deutsche CSD-Zeile besitzt.

## Architektur

`generated/localization/de/poe2-affixes.json` ist eine reine Anzeigeschicht, verknüpft über `affixId`. Die vorhandenen englischen Produktdateien unter `generated/poe2-affixes` und `generated/poe2-items` bleiben maßgeblich. Die Affixauswahl, der Item-Editor, die Ausrüstungszusammenfassung und die Build-Ergebnisse verwenden zentral `affixDisplayName`.

## Determinismus und Grenzen

Der Generator prüft den lokalen Content- und CSD-Manifestpin. Mehrdeutige CSD-Zuordnungen werden nicht als verifiziert übernommen. Die 86 App-Texte sind verständliche Anzeigen, keine technische GGG-ID- oder Lizenzbehauptung. Ein späterer sprachlicher Feinschliff kann diese Texte prüfen, ohne die technische Datenebene zu verändern.
