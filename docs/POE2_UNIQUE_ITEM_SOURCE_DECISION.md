# PoE2-Unique-Gegenstände – Quellen- und Approval-Entscheidung (5M.1B.0B)

> Stand 5M.2.7: RePoE `1a6066ec…`, PoB2 `c5300ccd…` und poe2-mcp `163c30a9…` liefern weder einzeln noch ID-sicher kombiniert die vollständige Item→Base→Mod/Stat→Werte→Varianten-Kette. Es wurde keine technisch geeignete Unique-Quelle gefunden; Approval und Produktivpin bleiben unverändert.

## Abgrenzung 5M.2.0

> Status 5M.2.9: Der getrennte PoB2-Planerdatensatz ist mit 435 englischen Uniques produktiv importiert. Die technische GGG-Unique-Identitätsfrage bleibt unberührt; Deutsch bleibt `translation-missing`.

Unique-Namen, -Modtexte und Varianten sind nicht Teil der deutschen Lokalisierungsentscheidung. Ihre bestehenden `pending`/`blocked`-Status bleiben unverändert; keine deutsche Unique-Quelle wurde freigegeben.

> Abgrenzung 5M.1B.0C: Technische Socketable-Identitäten werden separat behandelt. `UniqueMutatedVaal…`, Unique-Socketable- und Unique-Anointment-Mods bleiben durch diese Entscheidung ausdrücklich blocked; die Unique-Entscheidung wurde nicht gelockert und keine Unique-Daten wurden importiert.

## 1. Ziel und Ergebnis

Dieses Audit entscheidet ausschließlich über Quellen und Freigabegrenzen. Es importiert keine Unique-Daten, erzeugt keine Produktdatei und ändert weder UI noch Engine, Analyzer, Worker oder BuildProfile.

**Ergebnis:** Keine geprüfte Quelle liefert am festgehaltenen Stand gleichzeitig stabile Unique-Identität, technische Basistypzuordnung, itemgebundene Mod-/Stat-IDs, Rollbereiche, Varianten und granted Effects. Deshalb wird kein Unique-Teilbereich produktiv freigegeben. Identität bleibt `pending`; Unique-Mods, Varianten und item-granted Effect-Referenzen bleiben `blocked`.

Ausgangscommit: `4711d7834c16e0826b010e4172133b156b5db61f`. Auditdatum: 2026-07-22.

## 2. Zählregeln

- Unique-Gegenstand: ein Itemdatensatz beziehungsweise statischer PoB-Itemblock, nicht eine sichtbare Zeile.
- technische Unique-ID: stabile Quell-ID, die nicht nur Displayname ist.
- Unique-Variante: explizite historische oder auswählbare Variante. Zahlenrolls sind separat.
- Basistypzuordnung: explizite technische Item–Base-Beziehung; Namensvergleich zählt nicht.
- sichtbare Modzeile: Nicht-Headerzeile eines PoB-Blocks.
- technische Moddefinition: stabile Mod-ID mit strukturierten Statreferenzen.
- Statkombination: geordnetes Tupel nichtleerer Stat-IDs einer Moddefinition.
- variabler Roll: mindestens ein ungleiches Min/Max-Paar; feste Werte zählen nicht.
- granted Skill/Support: itemgebundene technische Effect-ID. Ein sichtbarer Name zählt nur als Textreferenz.
- nicht auflösbarer Text: Zeile ohne verlustfreie itemgebundene Mod-/Stat-Identität.

Mehrere Versionen desselben Items, mehrere auswählbare Varianten und mehrere Zahlenrolls werden nie gleichgesetzt.

## 3. Erforderliches späteres Datenmodell

Ein späteres zentrales Modell braucht mindestens `uniqueId`, `sourceUniqueId`, `metadataId`, `baseItemId`, `itemClassId`, `variantId`, `version`, `levelRequirement`, `fixedProperties`, `implicitModIds`, geordnete `explicitModGroups`, `statLines`, `valueRanges`, reine `grantedSkillIds`-/`grantedSupportIds`-Referenzen, `conditions`, `localFlags`, `sourceVersion`, `sourceReference`, `dataStatus`, `localizationStatus` und `engineSupportStatus`.

Modgruppen müssen eine Zeile mit einer oder mehreren Stat-IDs, mehrere gekoppelte Zeilen, feste Werte, Rollbereiche, historische und auswählbare Varianten, lokale und globale Wirkung sowie mechanische/bedingte Effekte unterscheiden. Nicht auflösbare Effekte müssen als `unsupported` erhalten bleiben; sie dürfen nicht aus Text geraten werden.

## 4. RePoE-Export 4.5.4.4.4

Pin: `repoe-fork/poe2@b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c` (`master` entspricht am Auditdatum diesem Commit).

| Datei | Bytes | SHA-256 | Ergebnis |
|---|---:|---|---|
| `version.txt` | 9 | `ec563ae02051174b61a31ae1a0aa84329cd1025cc5ce2ecde19fae85b446ba28` | `4.5.4.4.4` |
| `data/uniques.json` | 177.396 | `f7ca314de26c538409925b23605f7e552a4a98572d5bab1993c4ad3c956e5cb7` | 449 Stashzeilen, 441 verschiedene `id`-/Namensstrings |
| `data/mods.json` | 13.467.532 | `33e65dd81cc430c067b70550d4b7a6360b66ae477ced225cdc6309d58acafe1b` | 16.678 Mods, nicht Unique-Items zugeordnet |
| `data/base_items.json` | 8.127.066 | `846029974c5cd643423404072bd6c5b497c5ed129544750a41ca7d0e0c5b4449` | 5.246 Basistypen, nicht Unique-Zeilen zugeordnet |
| `data/skills.json` | 28.943.792 | `1a83f007c1015c1d2fc0e3e22503dc8deb2debed0e3ea450cf64bc3714f378c7` | vollständige Skilldaten bleiben außerhalb des Scopes |

`uniques.json` enthält nur `id`, `name`, `item_class`, Inventarmaße, Alternate-Art-Flag, `renamed_version`, `base_version` und `visual_identity`. Am Pin sind `renamed_version`, `base_version` und Alternate-Art in allen 449 Zeilen leer/falsch. `id` ist derselbe sichtbare Wortstring wie der Name; eine Metadata- oder Basistyp-ID fehlt. Artpfade sind Medien und bleiben gesperrt.

In `mods.json` tragen 10.376 Datensätze `generation_type: unique`; das ist keine Zahl von Unique-Item-Mods. Darunter liegen zahlreiche Basis-Implicits, Corruption-Upgrades und andere technische Unique-Generationsfälle. Es gibt 4.191 Stat-ID-Kombinationen, 6.637 feste und 3.739 variable Datensätze in dieser breiten Gruppe, aber keine Relation zu den 449 Unique-Zeilen. RePoE reicht deshalb nur als technische Teil-/Kontrollquelle, nicht als Unique-Hauptquelle.

## 5. RePoE-Parser

Pin: `repoe-fork/repoe@14e3edc89ed705bd4e4eda5c8135756431c76e81`, MIT für Parsercode.

- `repoe/parser/poe2/uniques.py` liest `UniqueStashLayout.dat64`, `Words.dat64` und `ItemVisualIdentity.dat64` und schreibt ausschließlich die oben genannten Identitäts-/Artfelder.
- `repoe/parser/poe2/mods.py` erhält Mod-ID, Min/Max, Stat-IDs, Generation, Domain, Tags, Gruppen und `grants_effects`.
- `repoe/parser/poe2/base_items.py` exportiert BaseItemTypes separat.
- Es existiert kein Join von Unique-Stashzeile zu BaseItem oder Mods. Werte und Effect-IDs können in Mods erhalten bleiben, werden aber keinem Unique-Gegenstand zugeordnet.
- Varianten, historische Versionen und lokalisierte Unique-Modzeilen werden nicht als belastbares Unique-Modell exportiert.

Eine Parsererweiterung wäre technisch denkbar, ist aber ohne belegte Quellrelationen und reproduzierbare Tabellenbelegung keine freigegebene Produktquelle.

## 6. Path of Building PoE2

Aktuell maßgeblich ist `PathOfBuildingCommunity/PathOfBuilding-PoE2`, Branch `dev`, Commit `f5b94342eeea413a94c339af3e881c5e2a4df0df`; `dev` entsprach am 2026-07-22 exakt diesem Commit. Eine eindeutige Releasezuordnung ist **Unbekannt**. `PathOfBuilding-PoE2-v2@7e047f0e86c5539b6fe983606c209066c3569083` ist historisch/archiviert und keine aktuelle Autorität.

Gezählt wurden nur 30 statische Dateien unter `src/Data/Uniques/*.lua`, nicht programmgenerierte Laufzeitkombinationen:

- 435 statische Unique-Blöcke, 433 verschiedene sichtbare Namen
- 435 sichtbare Basename-Zuordnungen, 358 verschiedene Basenames
- 579 `Variant:`-Deklarationen in 216 Items
- 2.704 sichtbare Nicht-Header-Modzeilen
- 1.663 Zeilen mit sichtbarem Zahlenbereich
- 117 sichtbare `Grants Skill:`-Zeilen; keine `Grants Support:`-Zeile im statischen Korpus
- null technische Unique-, Mod- oder Stat-IDs in den Itemblöcken

`src/Data/Uniques/Special/Generated.lua` erzeugt zusätzliche kombinatorische Uniques aus PoB-internen Tabellen (beispielsweise Radius-/Keystone-/Skillvarianten). Diese sind keine unabhängigen Spiel-IDs und werden nicht als statische Unique-Anzahl ausgegeben.

PoB parst sichtbare Zeilen über `src/Modules/ModParser.lua`; generische Regeln, `specialModList`, `unsupportedModList` und Enginecode erzeugen PoB-interne Mods. `src/Classes/Item.lua` ruft diesen Parser für Itemzeilen auf. Rollwerte werden aus Text extrahiert; lokale, bedingte und granted Effekte werden teils speziell interpretiert. Diese Parser-/Engineausgabe ist PoB-semantisch, nicht identisch mit GGG-Mod-/Stat-IDs, und wird nicht übernommen.

Die Code-Lizenz ist MIT. Die Unique-Dateien erklären ausdrücklich `Item data (c) Grinding Gear Games`. Communitykorrekturen und manuelle Interpretation sind nicht getrennt als allgemeine Datenlizenz freigegeben. PoB bleibt daher Kontrollquelle für Coverage, Varianten und Mechaniken, nicht Importquelle.

## 7. poe2-mcp

Pin: `HivemindOverlord/poe2-mcp@163c30a9fd45f815d330cc54e6ab51a797693d31`, `main` entsprach am Auditdatum diesem Commit. Datenrelease `data-v0.5.0-r12`, Patch 0.5.

Die Repositorypipeline dokumentiert die Extraktion aus der lizenzierten lokalen PoE2-Installation des Maintainers. Parser, Schemata und Fingerprints sind vorhanden; ein Nutzer mit eigener passenden Installation kann die allgemeine Datc64-Extraktion konzeptionell reproduzieren. Ein öffentliches, patchgleiches Eingabepaket oder eine unabhängige Verifikation der Clientdateien ist nicht enthalten.

- `data/game/mods/mods.json`: 19.965.708 Bytes, SHA-256 `1c9b35f7f4ce5508b4fec80f0995f5d944593afc2cf37e6b736b6fbbed1aa635`, 16.788 Mods.
- 5.495 Mod-IDs enthalten textuell `Unique`; 5.465 davon haben Stats, 2.534 mindestens einen variablen Range. Diese Namensfilterzahl ist keine Unique-Item-Modzahl.
- Es gibt keine Unique-Item-Tabelle, keine Base-/Itemzuordnung, keine Varianten und keine itemgebundenen granted Skills/Supports.
- `schema_fingerprints.json` enthält 1.019 Tabellenfingerprints; das belegt Pipelinebreite, nicht Unique-Vollständigkeit.

MIT gilt für Code. Die extrahierten Daten erhalten dadurch keine allgemeine GGG-Datenfreigabe. Eignung: Mod-/Schema-Kontrollquelle, nicht Unique-Hauptquelle.

## 8. Weitere Communityquellen

Das vollständige bestehende Inventar mit 51 Topic-Repositories wurde erneut ausgewertet. Es markiert genau eine weitere Quelle mit tatsächlicher lokaler Unique-Datenhaltung: `ackness/pobr@ff1d07da2a2b38959e34eea077d842d222f631b4`.

PoBR hält unter Datenversion 4.5.4.3 `overlay/uniques.json` (244.044 Bytes, SHA-256 `4c9c68b975403cd136d0518900dc3d536838068d40586dee1b78df8eb4edd825`) mit 435 Einträgen. Das Manifest nennt `PathOfBuilding-PoE2@29ab8262dd4a867eac56165afb8391a509e34a0e` und einen reproduzierbaren `extract-lua`-Befehl. Die Datensätze bestehen aus Name, Base, Typ, Varianten und vollständigem Rohtext; technische Unique-, Mod- und Stat-IDs fehlen. `special_mods.json` ist ausdrücklich handkuratiert. PoBR ist damit ein gutes Reproduzierbarkeitsbeispiel, aber eine derivative PoB-Kontrollquelle, keine unabhängige Hauptquelle. MIT gilt für Code; README ordnet `data/` GGG zu.

Die übrigen Inventarquellen enthalten keine belegte Unique-Datenbank. GGPK-/Dat-Parser sind Werkzeuge, aber ohne gepinntes vollständiges Unique-Zuordnungsprodukt keine Datenquelle. Copy/Paste-Parser führen Itemtexte, keine stabile Korpusidentität. `poe2-build-planner` nutzt freie Itemtexte beziehungsweise RePoE für Gems. Sie bleiben ausgeschlossen.

PoE2DB bleibt ausschließlich manuelle spätere Sprach-/Vergleichsreferenz. Es wurde nicht gescrapt, keine API gesucht, kein HTML, Dump, Asset oder Datensatz übernommen.

## 9. ID-basierter Vergleich

Es existiert kein verlustfreier gemeinsamer Unique-Schlüssel:

- RePoE: Stash-row/key, sichtbarer Words-String und Visual-ID; keine Metadata-ID.
- PoB/PoBR: sichtbarer Name, Basename, lokale Variantenordinalzahl; keine technischen Mod-/Stat-IDs.
- poe2-mcp: Mod-/Stat-ID und Datc64-Zeile; kein Unique-Item.

Damit sind `gleiche technische ID mit abweichenden Werten`, exakte Quell-Exklusivmengen und eine Drei-Quellen-Schnittmenge **Unbekannt**. Namens- oder Basename-Joins sind nur manuelle Kontrollvergleiche. Sie dürfen keinen produktiven Import erzeugen.

## 10. Repräsentative Stichproben

| Fall | Befund | Projekt-/Enginezustand |
|---|---|---|
| Astramentis | RePoE nur Identity; PoB zwei historische Varianten und variable Attributzeilen; keine technische Item–Mod-ID | einfache Tags teilweise ausdrückbar, reale Version/Mods unsupported |
| Choir of the Storm | PoB nennt Lightning Bolt und zwei Varianten; keine itemgebundene GrantedEffect-ID | granted Skill unsupported |
| The Adorned | gekoppelter mehrzeiliger Radius-/Juweleffekt | Cross-Jewel-Effekt unsupported |
| Controlled Metamorphosis | Unique-Jewel mit Radius- und Auswahlvarianten | Jewel-Slot wird vom Unique Analyzer blockiert; Passive-Interaktion unsupported |
| Arakaali's Gift | Unique-Charm mit Trigger und zwei gekoppelten Recoveries | Charm-/Trigger-Simulation unsupported |
| Olroth's Resolve | Unique-Flask mit zwei Versionen und Guard-Mechanik | Flask-/Recovery-Simulation unsupported |
| Blackbraid | Rüstung mit lokalen und globalen Werten sowie drei Versionen | lokale Baseberechnung und Versionen unsupported |
| Double Vision | Crossbow, lokale Rolls, granted Skill und mehrzeiliger Effekt | Weapon locals, Ammunition und granted Skill unsupported |

Für alle Beispiele sind technische Unique-ID, itemgebundene Mod-/Stat-ID und Varianten-ID **Unbekannt**. Die sichtbaren Zeilen werden nicht als technische Wahrheit übernommen.

## 11. Bestehender Unique Analyzer

Der aktuelle Vertrag `UniqueItemDefinition` besitzt synthetische Metadaten, Itemtyp/Slot, `ModifierDefinition[]`, Klassen-/Aszendenz-/Skill-/Waffengates, Anforderungen, Mechanikmarker, Trade-offs, Enabler- und Replacementfelder. Es gibt 16 synthetische Fixtures. Analyzer-Version: `0.7.0-synthetic`.

Unterstützt werden synthetische Tag-Synergien, Klasse/Aszendenz, Skill-/Waffengates, Level, Replacement-Verdict, Enabler, `requiresReoptimization` und Trade-off-Marker. Slots: Weapon, Offhand, Helmet, Body Armour, Gloves, Boots, Amulet, Ring, Belt und Special. `jewel` wird ausdrücklich blockiert. Es gibt keine reale Unique-ID-/Variantenstruktur.

Nicht unterstützt sind reale lokale Waffen-/Basewerte, Item-granted Skills/Supports, Flask-/Charmtrigger, Passive-/Radiusinteraktion, gekoppelte mehrzeilige Effekte, zufällige oder auswählbare Effekte, historische Versionen und kontrollierte Unsupported-Textpersistenz. Der Analyzer hängt von vorab manuell zugeordneten technischen Tags/Mechanikfeldern ab, nicht von sichtbaren Texten oder realen IDs. Ein Datenimport würde keine Engineunterstützung erzeugen.

## 12. Approval-Entscheidung

| Scope | Status | Haupt-/Kontrollquelle | Begründung |
|---|---|---|---|
| `poe2-technical-unique-item-identity-data-for-build-planner` | `pending` | RePoE / PoB-Kontrolle | RePoE-Identität ist name-/stashbasiert und ohne Metadata/Base-ID |
| `poe2-technical-unique-mod-data-for-build-planner` | `blocked` | keine | keine itemgebundene technische Mod-/Statquelle |
| `poe2-technical-unique-variant-data-for-build-planner` | `blocked` | PoB/PoBR Kontrolle | keine stabile Varianten-ID; Historie, Auswahl und Testvarianten vermischt |
| `poe2-technical-item-granted-effect-reference-data-for-build-planner` | `blocked` | RePoE/PoB Kontrolle | sichtbare Skillnamen beziehungsweise unverbundene Effect-IDs |

Alle `allowedSourceFiles` und `allowedFields` dieser neuen Scopes sind leer. Das ist absichtlich keine Freigabe. Unique-Jewels, -Charms und -Flasks bleiben ausschließlich in den Unique-Scopes; sie sind nicht durch 5M.1B.0A freigegeben.

## 13. Ausgeschlossene Daten und Rechte

Weiter gesperrt bleiben Bilder, Icons, Modelle, Audio, Flavour/Lore, vollständige Rohspiegel, Drops, Preise/Trade, deutsche Displaynamen/Modtexte, PoE2DB-Daten, vollständige Skill-/Supportdaten, fremde Berechnungen und Parserlogik, Runen, Soul Cores, Desecrated/Mutated Mods, Medien, Laufzeitabrufe und Hotlinks.

Code-Lizenzen und Spieldatenstatus sind getrennt: RePoE-Parser, PoB, poe2-mcp und PoBR verwenden MIT für Software; keine dieser MIT-Lizenzen wird als GGG-Daten- oder Medieneinräumung interpretiert. Die Entscheidung ist widerrufbar. Da nichts importiert wurde, besteht die Entfernung aus dem Löschen der vier Approval-Zeilen und Auditdokumente; keine Produktdatenbereinigung ist erforderlich.

## 14. Importvoraussetzungen und Updateprozess

Vor einer späteren Freigabe ist mindestens erforderlich:

1. patch-/commit-gepinnte, reproduzierbare Unique-Itemquelle;
2. stabile Unique-/Metadata-/Base-IDs;
3. explizite Item–Mod–Stat-Zuordnung einschließlich Min/Max und Gruppen;
4. getrennte historische, auswählbare und Rollvarianten;
5. itemgebundene granted Effect-IDs statt Namen;
6. SHA-256-Manifest, deterministische Normalisierung, Feldallowlist und Negativscope;
7. separate Rechte-/Projektrisikoentscheidung;
8. Engine-Supportmatrix mit `supported`/`display-only`/`unsupported`;
9. manuelle Freigabe pro Release; keine automatische Produktaktivierung.

## 15. Grenzen und Schlussfolgerung

Zählungen sind quellspezifisch. PoB-Itemblöcke sind keine Spiel-Datensätze; RePoE-`generation_type: unique` ist keine Unique-Item-Modmenge; `Unique` im MCP-Modnamen ist nur ein Namensfilter. Programmgenerierte PoB-Varianten sind nicht verlustfrei als endliche Itemmenge gezählt. Deutsche Lokalisierung wurde nicht untersucht oder übernommen.

**Klare Schlussfolgerung:** RePoE reicht teilweise für getrennte Identitäts- und Modtechnik, aber nicht als Unique-Hauptquelle. PoB ist die reichste Kontrollquelle für sichtbare Itemdefinitionen und Mechaniken, jedoch ohne benötigte technische IDs. poe2-mcp ist eine technische Mod-/Schemareferenz ohne Unique-Items. PoBR ist derivative Reproduzierbarkeitskontrolle. Es gibt deshalb keine Freigabe und keinen Import.

Empfohlene Folgeaufgabe bleibt 5M.1B.0C für Runen, Soul Cores und Spezialmods. Erst danach darf eine gesonderte Importarchitektur geplant werden. 5M.1B, 5M.1B.0C, 5M.2 und 5N wurden hier nicht begonnen. Die physische iPhone-Abnahme bleibt offen und war mangels UI-Änderung nicht erforderlich.
> 5M.1B ändert die Entscheidung nicht: Unique Jewels, Charms, Flasks, Items und Mods sind nicht importiert.

## Update 5M.2.3 – lokaler Offline-Auditparser

Die fünf gepinnten Balance-Tabellen enthalten keine beweisbare Unique-Identitäts-/Versionsschicht. `generationType=unique` bei 354 Mods wird nicht als Unique-Gegenstand interpretiert. Basistypzuordnung, Varianten, technische Modreferenzen, Rollbereiche, spezielle Implicits sowie itemgebundene Skill-/Supportreferenzen bleiben Unbekannt. Keine sichtbare Unique-Zeile wurde in eine technische ID umgedeutet; keine Unique-Daten oder Freigabe entstanden. Details: [POE2_OFFLINE_ITEM_AUDIT_PARSER.md](POE2_OFFLINE_ITEM_AUDIT_PARSER.md).
# Stand nach 5M.2.4

`UniqueStashLayout` (449), `UniqueChests` (48) und `Incursion2MutatedUniqueModsClient` (1) wurden lokal geprüft. Sie bilden keine verlustfreie Unique-ID→Base→Variante→Mod→Stat-Kette. Unique-Identitäten, Mods, Varianten sowie granted Skill-/Supportreferenzen bleiben `pending`/`blocked`; keine Freigabe oder Produktdatei entstand.

## Stand nach 5M.2.5

Bestätigte Enumwerte verbessern nur Teilreferenzen. Es entsteht keine vollständige Unique-Kette; kein Unique-Scope wurde freigegeben oder importiert.

## Stand nach 5M.2.6

Der priorisierte Audit bestätigt das negative Ergebnis: 449 Stashfragmente, 311 technische Chest-/Mutations-Modreferenzen und 65 ModGrantedSkills bilden keine Item-Unique-Kette. 0 bestätigte Unique-Item-Identitäten, Basistypbezüge, Varianten oder Item-Affixe. Scope bleibt `pending`/`blocked`.

## Getrennter PoB2-Planerscope nach 5M.2.8

5M.2.8B löst den technischen Blocker aus 5M.2.8A durch eine ausdrückliche,
scopegebundene Auftraggeberentscheidung ab. Es werden keine externen
Einzelanfragen verfolgt und keine Genehmigungen behauptet. Der reduzierte
PoB2-Planerdatensatz darf in 5M.2.9 unter allen bestehenden Guards importiert
werden; deutsche Unique-Texte bleiben nicht freigegeben.

Historischer Stand 5M.2.8A: Der technische Planerscope blieb bestehen, doch
die öffentliche Verteilung war
`distribution-pending-both`: Weder die MIT-Abdeckung der
GGG-gekennzeichneten Unique-Dateien noch eine GGG-Genehmigung ist belegt.
5M.2.9 war damals blockiert; keine Unique-Daten oder deutschen Texte wurden
importiert.

Der bisherige GGG-Unique-Identitäts- und Affixscope bleibt unverändert pending beziehungsweise blocked. Ausschließlich `poe2-pob2-unique-planner-data` am Commit `c5300ccd…ab7d0` darf in 5M.2.9 unter Vertragsversion 2 verarbeitet werden. Planerbezogene Namen, Slots, Varianten, sichtbare Zeilen und belegte PoB2-Rollbereiche sind weiterhin keine technischen GGG-Daten.
