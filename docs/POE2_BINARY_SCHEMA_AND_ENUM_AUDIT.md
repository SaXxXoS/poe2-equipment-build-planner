# PoE2 binary schema and enum audit (5M.2.5)

## 1–4. Ziel, Ausgangslage, Grenzen und Pins

5M.2.5 erweitert ausschließlich die lokale Auditpipeline. Produktdateien, Approval, Laufzeitcode und deutsche Produkttexte bleiben unverändert. Maßgeblich sind `Content.ggpk` SHA-256 `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`, PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`, ooz `0.2.4` (Archiv `e6d7e728a8b02d2203a80f41bdf8f13c524afda2d393773930b8dfc0afd94af4`), Schema `268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30`, Referenzmanifest `a4bbcd99f21490520b516c83800e67bf3a0b691e971d0da59e318dfe6e971353`, Auditformat 1 und Node.js 24.14.0.

## 5–12. Schemaquellen und ItemClasses

Geprüft wurden im gepinnten PoB2-Commit `src/Export/spec.lua`, `src/Export/Scripts/enums.lua`, `mods.lua`, `soulcores.lua` und die erzeugten lokalen DATC64-Dateien. ItemClasses besitzt 117 englische und 117 deutsche Records, jeweils 150 Byte bei 149 Byte beschriebenem Schema. Kontrolliertes Entfernen jedes einzelnen Recordbytes ergab mehrere strukturell parsebare Positionen (Englisch/Deutsch je 49 Kandidaten, Bereich 65–113). Damit ist der exakte Offset **Unbekannt**. Die früher angenommene feste Endposition wird nicht bestätigt.

Die Bool-Hypothese ist wegen des zusätzlichen Bytes und vorhandener Bool-Felder plausibel, aber ohne eindeutigen Offset nicht bestätigt. Padding/Alignment ist widersprochen: Kandidatenbytes variieren recordabhängig. Das bekannte Präfix kann experimentell gelesen werden, das gesamte Schema ist jedoch nur **teilweise dekodierbar**. Keine Byteposition wird stillschweigend übersprungen.

## 13–15. Charm

Die produktive Klasse ist `Charms` (Plural). Der Datenfluss beginnt im gepinnten RePoE-Schlüssel `data/item_classes.json#Charms`, läuft über `scripts/poe2-additional-item-import.mjs` und endet in den generierten Zusatzitemdaten sowie `src/affixes/registry.ts`. Eine direkte lokale Singular-ID `Charm` wurde nicht belegt. Abschlussstatus: `project-normalized-id` mit Beweisstufe `strongly-supported`; für einen neuen lokalen Produktimport ist dies allein nicht ausreichend.

## 16–23. SoulCores, StatsValues, BondedStats und Zielkategorien

Geprüft wurden 295 SoulCores, 5 SoulCoreTypes, 507 SoulCoreStats, 30 SoulCoreStatCategories und 4 SoulCoreLimits. Auch das 98-Byte-SoulCores-Record besitzt gegenüber dem 97-Byte-Schema ein zusätzliches Byte. Alle 98 Löschpositionen bleiben mit dem aktuellen Decoder strukturell möglich; der exakte Offset und die Semantik bleiben **Unbekannt**.

`SoulCoreStats.Stats[]` und `StatValue[]` bilden 552 positionsgleiche Paare ohne Längenabweichung. `BondedStats[]` und `BondedValues[]` bilden 510 positionsgleiche Paare ohne Längenabweichung; `soulcores.lua` konsumiert genau diesen parallelen Arrayvertrag. Diese Struktur ist bestätigt, nicht aus Texten zurückgerechnet. Zielkategorien folgen technisch `SoulCoreStats.Category → SoulCoreStatCategories.ItemClass[]`; sichtbare Kategorienamen wurden nicht als Beweis benutzt. Wegen des unresolved SoulCores-Recordschemas bleiben alle 295 Ketten teilweise aufgelöst.

## 24–31. Mod-Domains und Generation Types

`Mods.Domain` und `Mods.GenerationType` sind im gepinnten Schema Enumfelder. `enums.lua` erzeugt die Wertlisten und `mods.lua` verwendet unabhängige numerische Consumerkonstanten. Zusammen mit dem Binärfeldvertrag sind die verwendeten Werte bestätigt.

- Domains im Produktbestand: Rohwert 1 (1.828 Mods), 2 (107), 11 (320); 2.255/2.255 vorhanden und bestätigt, keine unbekannten Werte.
- Generation Types: 1 (1.028), 2 (770), 3 (354), 5 (103); 2.255/2.255 vorhanden und bestätigt, keine unbekannten Werte.
- Bestätigte Consumerbedeutungen: 1 Prefix, 2 Suffix, 3 Intrinsic/Item Exclusive, 5 Corruption. Die vollständigen Enumtabellen und nichtsprechenden Reserven stehen in den maschinenlesbaren Berichten.

## 32–35. ModFamily, ModType, Gruppen und Konflikte

`Mods.Family[] → ModFamily` (6.113 Records) und `Mods.Type → ModType` (12.522 Records) sind technische Referenzen und bestätigt. Eine gegenseitige Ausschluss- oder Crafting-Konfliktsemantik ist durch Schema und Consumercode nicht belegt. Deshalb bleibt `conflictGroups` **unknown**; Tabellennamen oder RePoE-Gleichlauf werden nicht als Beweis verwendet.

## 36–41. Coverage, Lokalisierung, OCR und Uniques

Alle 2.255 Produktmods besitzen bestätigte Domain- und Generation-Type-Werte, bleiben aber wegen ungeklärter Konfliktgruppensemantik `partially-resolved` (0 resolved, 2.255 partial, 0 unresolved). Alle 33 Produktitemklassen und 295 SoulCore-Zeilen bleiben partial. Unverändert: 419/431 deutsche Stat-IDs, 12 fehlend; 447/485 CSD-Strukturen, 38 Lücken; 2.189 OCR-Mehrdeutigkeiten, davon durch dieses Audit 0 sicher gelöst. Uniques erhalten nur eine bessere technische Teileinordnung; eine vollständige Unique-Kette entsteht nicht.

## 42–50. Beweisstufen, Determinismus, Sicherheit und Schlussfolgerung

Verwendet werden `confirmed`, `strongly-supported`, `plausible`, `contradicted` und `unknown`. Nur gepinnter Code beziehungsweise mindestens zwei unabhängige technische Signale führen zu `confirmed`. Zwei vollständige Läufe erzeugten byteidentisch SHA-256 `b9cb48507925c9d3b6921b8bd90b315547f634aed5684c51fae24c88a5d701c7`.

Der Lauf war vollständig offline: kein HTTP, HTTPS, DNS, API, Trade-API, PoE2DB oder Webseitenzugriff. Rohdaten und Volltexte bleiben unter `.local-audits/`; keine Ausgabe erfolgte nach `generated/` oder `public/`. PoB2- und ooz-Code-Lizenzen bleiben getrennt vom Status extrahierter GGG-Spieldaten; dieses Audit erteilt keine Distributionsfreigabe.

Technische Schlussfolgerung: Domain und Generation Type sind für reguläre Affixe belastbar vorbereitet. 5M.2 insgesamt ist **noch nicht vollständig vorbereitet**, weil ItemClasses/SoulCores je ein nicht eindeutig lokalisierbares Byte und die Konfliktgruppensemantik ungelöst bleiben. Nächster Schritt ist ein gezieltes, gepinntes Schemaquellen-Audit für genau diese drei Restblocker; erst danach darf eine separate Pin-/Approval-Entscheidung erwogen werden. 5M.2 und 5N wurden nicht begonnen.

## Prioritätsfortsetzung 5M.2.6

Der Auftraggeber priorisiert nun Unique-Affixe. Der separate Offline-Audit fand keine vollständige Item-Unique-Identitäts-/Affixkette; bestätigte reguläre Mod-Enums ändern dieses Ergebnis nicht.
