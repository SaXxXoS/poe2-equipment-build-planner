# PoE2 Item-Mod-Vollständigkeitsaudit (5M.1A)

## Ergebnis

Der mit 5M.1 erzeugte Bestand ist **kein vollständiger PoE2-Gegenstandsmodifikatorbestand**. Er ist reproduzierbar und intern vollständig für die bewusst ausgewählten 29 `mods_by_base`-Klassen: 1.828 technische Mod-IDs, davon 816 Prefixe, 568 Suffixe, 231 über ausgewählte Basistypen referenzierte Implicits und 213 technisch aufgelöste Spezialdatensätze. Unique-Gegenstände und deren feste/variable Modzeilen, Runen, Soul Cores als auswertbare Socketables sowie Jewel-, Flask-, Charm- und Relic-Modbestände sind nicht Bestandteil von 5M.1.

Diese Aufgabe hat keine zusätzlichen Fach- oder Lokalisierungsdaten importiert, keine Approval-Regel geändert und weder UI noch Engine verändert. 5M.1B, 5M.2 und 5N wurden nicht begonnen.

## Pins und Zählregeln

- Ausgangscommit: `d12722d2e715486dd009db6ab133f93622522d4a`
- RePoE-PoE2: Version `4.5.4.4.4`, Exportcommit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`
- RePoE-Parser: `14e3edc89ed705bd4e4eda5c8135756431c76e81`
- technische Mod-ID: ein Schlüssel in `mods.json`
- Statzeile: ein Element von `stats[]`; ein mehrzeiliger Mod bleibt eine Mod-ID
- Tier und Familie: die bereits von 5M.1 erzeugten Records, nicht mit sichtbaren Texten gleichgesetzt
- Itemklassenzuordnung: eindeutige Klasse-Mod-Referenz in `mods_by_base.json`
- Basis-Implicit: Referenz aus `base_items.json[].implicits` auf `mods.json`
- `null` bedeutet unbekannt beziehungsweise nicht verlustfrei vergleichbar; es ist keine Schätzung.

Die vollständige ID-Zuordnung und die Zählregeln stehen in [poe2-item-mod-category-matrix.json](audits/poe2-item-mod-category-matrix.json). Der Bericht spiegelt keine fremden Rohdatensätze.

## Begriffsgrenzen

Reguläre Affixe sind spawnfähige beziehungsweise klassenzugeordnete Prefix-/Suffix-Mod-IDs mit ihren Tiers. Implicits werden nur gezählt, wenn ein Basistyp sie technisch referenziert; Basiswerte wie Rüstung, Schaden oder Block sind nicht automatisch Affixe. Unique-Items, Unique-Modzeilen und Unique-Varianten werden getrennt gezählt. Socketables bezeichnen Gegenstände wie Runen oder Soul Cores; ihre Gegenstandsanzahl ist nicht ihre Modzeilenanzahl. Corruption-, Desecrated-, Mutated-, Enchantment- und content-spezifische Datensätze werden nicht aus PoE1-Begriffen abgeleitet, sondern nur bei technischer Evidenz ausgewiesen.

## 5M.1-Kategorisierung

| Hauptkategorie | Mod-IDs | Evidenz |
|---|---:|---|
| reguläres Prefix | 816 | `affixSide=prefix` aus ausgewählten `mods_by_base`-Referenzen |
| reguläres Suffix | 568 | `affixSide=suffix` |
| festes Basis-Implicit | 231 | ausgewähltes `base_items[].implicits` |
| Corruption-Implicit | 103 | Source-Side und `generation_type=corrupted` |
| Corruption-Upgrade | 110 | `generation_type=unique`, technische IDs `CorruptionUpgrade…` |
| unresolved | 0 | keine verbleibende Special-ID |

Die 416 mehrzeiligen Records enthalten mehr als eine Statzeile. Das ist eine Strukturzählung und kein Beweis, dass jeder Record fachlich ein „Hybridaffix“ im Spielbegriff ist.

### 213 Specials

Die bisherige Sammelkategorie entstand durch die Prioritätsfunktion `prefix > suffix > implicit > special`. Alle 213 besitzen jedoch belastbare Quellmerkmale: 103 sind `corrupted`; 110 sind Corruption-Upgrades mit `unique`-Generation und `CorruptionUpgrade…`-IDs. Alle liegen in der Item-Domain. Sie bleiben im Produktivformat unverändert; nur der Auditbericht klassifiziert sie genauer. UI und Engine besitzen dafür keine neu hinzugefügte Sonderlogik.

### 231 Implicits

Alle 231 sind `base_items.json`-Referenzen ausgewählter Basistypen auf `mods.json`; ihre Generation wird upstream häufig als `unique` bezeichnet. Das macht sie nicht zu Unique-Gegenstandsmodzeilen. Die maschinenlesbare Implicit-Matrix nennt pro Mod-ID Itemklassen, exakte Basistyp-IDs und Statzeilenzahl. Die 29-Klassen-Union verliert im bestehenden Produktivrecord die exakte Basistypzuordnung; der Audit rekonstruiert sie, ohne das Produktivformat zu ändern. Weitere Basistypen und Klassen existieren im Export und sind durch den 5M.1-Allowlistfilter ausgeschlossen.

## Prefix-/Suffix- und Filteraudit

Der Rohbestand umfasst 16.678 `mods.json`-IDs. `mods_by_base.json` referenziert klassenübergreifend 3.450 eindeutige IDs; die feste 29-Klassen-Auswahl referenziert 1.597 davon. Durch ausgewählte Basistyp-Implicits wächst die Union auf 1.828. Daher belegen 816/568 Vollständigkeit nur innerhalb dieses Scopes, nicht für alle tragbaren PoE2-Itemklassen.

Jede Importentscheidung ist im JSON-Bericht mit Codepfad, Eingangsmenge, Ausschlusszahl und Empfehlung dokumentiert:

1. feste 29-Klassen-Allowlist; 45 der 74 `mods_by_base`-Schlüssel liegen außerhalb,
2. Union ausschließlich referenzierter Mods; 15.081 Roh-Mods liegen nicht in der ausgewählten Klassenunion,
3. Ergänzung nur der Implicits ausgewählter Basistypen,
4. Side-Priorität, die Mehrfachprovenienz auf einen Primärwert reduziert,
5. lexikografisch erste Familie; Mehrfachfamilien wären als Warnung sichtbar.

Belastbare ausgeschlossene Beispiele im selben Pin sind: Jewels 446 eindeutige Referenzen, Charms 51, Life Flasks 57, Mana Flasks 52 und Relics 137. Diese Zahlen dürfen wegen Überschneidungen nicht addiert und als Gesamtfehlmenge ausgegeben werden.

## Gepinnter RePoE-Export

Der gesamte Export wurde außerhalb des Projekts inventarisiert. Relevante Top-Level-Datensätze sind `mods` (16.678), `mods_by_base` (74 Klassen), `base_items` (5.246), `item_classes` (117), `tags` (1.327), `uniques` (449 Records), `augments` (295), `skill_gems` (1.191), `skills` (8.347), `stat_value_handlers` (73), `tag_details` (1.327) sowie die Verzeichnisse `stat_translations`, `Metadata` und `Art`. Die letzten Medien-/Textbereiche wurden nur festgestellt, nicht übernommen. Von diesen Dateien wurden in 5M.1 ausschließlich die im Manifest genannten sechs Quelldateien verwendet.

`base_items` enthält 295 Basistypen der Klasse `SoulCore`; daraus folgt weder eine bestätigte Zahl von Soul-Core-Modzeilen noch eine produktive Zuordnung. `uniques.json` enthält 449 Records, ist am Pin aber keine normalisierte vollständige Unique-Modzeilentabelle. Dedizierte Top-Level-Dateien für Runen, Desecrated- oder Mutated-Mods wurden am Pin nicht gefunden. „Unbekannt“ bleibt deshalb die belastbare Anzahl dieser fachlichen Modzeilen.

### Parser

Der gepinnte Parser normalisiert unter `repoe/parser/poe2/` Mods, ModsByBase und BaseItemTypes getrennt. Er übernimmt Generation Type, Domain, Gruppen, Stats, Tags und Spawnweights in `mods.json`; Klassenzuordnungen entstehen separat in `mods_by_base.json`, Basistyp-Implicits in `base_items.json`. Das Exportformat veröffentlicht keine verlustfrei ID-verknüpfte Kompletttabelle aus Unique-Gegenstand, Variante und allen sichtbaren Unique-Modzeilen. Soul Cores erscheinen als Basistypen/Metadata, nicht als bereits fertiges Build-Planner-Socketable-Modregister. Lokalisierte Statbeschreibungen sind getrennte Exportdaten und lagen außerhalb des 5M.1-Scopes.

## Community-Quellen

Am 22.07.2026 wurden alle 51 Repositories des GitHub-Topics `path-of-exile-2`, sortiert nach Aktualisierung, inventarisiert. Jedes besitzt im [Community-Inventar](audits/poe2-community-source-inventory.json) einen geprüften Commit und eine Relevanzklasse A–I. Thema-Mitgliedschaft ist zeitabhängig; der Snapshot behauptet keine dauerhafte Vollständigkeit des Topics.

Vertieft geprüft wurden:

- `PathOfBuildingCommunity/PathOfBuilding-PoE2`, `dev@f5b94342eeea413a94c339af3e881c5e2a4df0df`: aktuell maßgeblich; Lua-Basen, Rare/Magic-Modparser, Unique-Dateien, Rune-/Soul-Core- und Corruption-Unterstützung. Viele Inhalte sind manuell normalisierte sichtbare Zeilen, nicht verlustfrei RePoE-Mod-IDs. Kontrollquelle B, keine Importfreigabe.
- `PathOfBuildingCommunity/PathOfBuilding-PoE2-v2`, `dev@7e047f0e86c5539b6fe983606c209066c3569083`: archivierter historischer Stand, Klasse I.
- `HivemindOverlord/poe2-mcp`, `main@163c30a9fd45f815d330cc54e6ab51a797693d31`: eigene Mods.datc64-Pipeline, Metadaten/Schema-Fingerprints und 16.788 behauptete Records am geprüften Stand. Patch und Schema unterscheiden sich; keine vollständige normalisierte Unique-/Socketable-Tabelle nachgewiesen. Kontrollquelle B.
- `poe2-tools/poe2-build-planner`, `master@a173f7b0d398951693fee83ee5ee40f327d4a749`: Items sind laut README Freitext-Modpläne; RePoE versorgt Gemdaten. Keine strukturierte Itemmod-Hauptquelle, Klasse E.
- gepinnte RePoE-Repositories: primäre technische Quelle innerhalb des bereits engen Approval-Scopes, Klasse A.
- `ackness/pobr`, `ff1d07da2a2b38959e34eea077d842d222f631b4`, und `damdor/poe-buildwright`, `291e2e66dc3bccf4f06ede70546ab5e89388351c`, wurden als hochwertige Kontrollen aus dem Topic markiert; keine Datenübernahme.

Eine offene Code-Lizenz (zum Beispiel MIT) lizenziert nicht automatisch GGG-abgeleitete Spieldaten. Herkunft, Code-Lizenz, Datenrechte, Reproduzierbarkeit und Approval bleiben getrennte Achsen.

## Quellenvergleich und Stichproben

Der [Quellenvergleich](audits/poe2-item-mod-source-comparison.json) verwendet vorrangig Mod-ID, Stat-ID-Kombination, Base-Type-Metadatapfad, Generation Type und Domain. Ein exakter Drei-Wege-Intersection-Count ist **unbekannt**, weil PoB viele sichtbare/manuell gepflegte Lua-Zeilen und poe2-mcp eine andere Patch-/Extraktionsform verwendet. Eine Textähnlichkeit wurde nicht als ID-Gleichheit ausgegeben. Kleine Stichproben aus Prefix, Suffix, Basis-Implicit, Corruption-Implicit und Corruption-Upgrade sind enthalten; vollständige Fremddatensätze nicht.

## Mastermatrix und Lücken

Die Mastermatrix im Kategoriebericht trennt vorhandene, importierte und unbekannte Zahlen. Zwingend beziehungsweise wichtig für vollständige normale, magische, seltene und einzigartige Builds sind reguläre Affixe, Basis-/Corruption-Implicits, Basiseigenschaften, Unique-Items samt Varianten/Modzeilen, Jewels, Charms, Flasks und relevante Socketables. Für den späteren Fotomodus werden zusätzlich eindeutige technische IDs und getrennt freizugebende deutsche Lokalisierungen benötigt.

Aktuell fehlen oder sind gesperrt:

- durch 5M.1-Filter: Modreferenzen nicht ausgewählter Klassen, darunter Jewels/Charms/Flasks/Relics, sowie deren Basistyp-Implicits;
- durch Approval-Scope: Unique-Daten, Socketables, weitere Spezialkategorien und Lokalisierung;
- durch das gepinnte RePoE-Schema: keine nachgewiesene normalisierte Komplettabbildung aller Unique-/Rune-/Soul-Core-Modzeilen;
- nur in Kontrollprojekten deutlicher modelliert: PoB-Unique-, Rune-, Soul-Core-, rune-only und weitere spezielle sichtbare Modlogik, jedoch ohne Importfreigabe und ohne garantierte ID-Äquivalenz.

## Approval-Empfehlung und Reihenfolge

Keine Freigabe wurde vorgenommen. Der nächste Schritt sollte **5M.1B.0** sein: getrennte technische Scopes und Quelldateien für (1) ausgeschlossene RePoE-Klassen/Implicits, (2) Unique-Itemdefinitionen und Unique-Mods, (3) Runen/Soul Cores/weitere Socketables und (4) Spezialmodarten prüfen. Erst danach dürfen getrennte deterministische Importe folgen. Die deutsche Lokalisierungsfreigabe 5M.2.0 folgt erst, wenn die technische Ziel-ID-Menge stabil ist.

Vorgeschlagene, noch nicht freigegebene Scope-Gruppen sind `poe2-technical-base-implicit-data-for-build-planner`, `poe2-technical-unique-item-data-for-build-planner`, `poe2-technical-socketable-data-for-build-planner` und `poe2-technical-special-item-mod-data-for-build-planner`. Für jede sind Pinning, Hashes, minimale Felder, Entfernungspfad und GGG-Datenrechte erneut zu prüfen.

## Grenzen und Schlussfolgerung

Keine belastbare Gesamtzahl aller PoE2-Itemmods wird behauptet. Unique-Modzeilen, Rune-/Soul-Core-Modzeilen, Desecrated/Mutated und ein verlustfreier Drei-Quellen-Abgleich bleiben unbekannt. Physische iPhone-Abnahme bleibt für den bestehenden UI-Stand offen; diese reine Dokument-/Auditänderung benötigt keine neue Geräteabnahme.

Klare Schlussfolgerung: **5M.1 ist technisch abgeschlossen, aber sein Bestand von 1.828 Mods ist fachlich unvollständig für das Projektziel.**
