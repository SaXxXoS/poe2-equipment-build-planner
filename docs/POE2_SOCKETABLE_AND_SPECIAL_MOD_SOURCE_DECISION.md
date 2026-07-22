# PoE2-Socketables und Spezialmods – Quellenentscheidung 5M.1B.0C

## 1. Ziel, Ausgangslage und Ergebnis

Diese Aufgabe prüft ausschließlich Quellen, Kategorien, IDs, Zuordnungen, Vollständigkeit, Rechte und Approval-Grenzen. Sie importiert keine Runen, Soul Cores, Socketables oder zusätzlichen Spezialmods und verändert weder Produktdaten noch UI, Engine, Worker, Analyzer oder BuildProfile.

Ausgangscommit ist `93132eecbf0e4cebd1478766af1dc353d7918a0b`. RePoE ist auf Export `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c` und Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81` gepinnt.

Das wichtigste Ergebnis: Der Export enthält mit `data/augments.json` eine belastbare technische Identitätsschicht für 295 Socketables. Deshalb werden Identitätsfelder für 221 Runen, 34 Soul Cores sowie genau 35 Idols, 4 Abyssal Eyes und 1 Congealed Mist eng `conditionally-approved`. Die Effektstruktur besitzt Zielkategorien und Stat-IDs, aber der Parser schreibt die numerischen `StatsValues` und `BondedStatsValues` nicht strukturiert aus. Moddaten bleiben deshalb `pending`. Bestehende 103 Corruption-Implicits und 110 Corruption-Upgrades bleiben unverändert und dürfen nicht doppelt importiert werden.

## 2. Begriffe und Zählregeln

- Ein Socketable-Gegenstand ist genau ein technischer Schlüssel in `augments.json` beziehungsweise derselbe Metadata-/Base-Key in `base_items.json`.
- `type_id` trennt Rune, SoulCore, Idol, AbyssalEye und CongealedMist. Der gemeinsame Metadata-Pfad `Metadata/Items/SoulCores/...` ist keine fachliche Gleichsetzung.
- Eine Effektvariante ist ein Eintrag in `categories` eines Socketables. Ein Gegenstand mit Waffen- und Rüstungseffekt bleibt ein Gegenstand mit mehreren Varianten.
- Eine Statzeile ist ein Element aus `stats[]` oder `bonded_stats[]`; mehrere Statzeilen bleiben zusammen.
- Eine technische Mod-ID ist ein Schlüssel in `mods.json`. Namensfragmente sind kein Kategorienachweis.
- Ein Wertebereich zählt nur bei strukturiertem Min/Max. Zahlen in `stat_text` werden nicht zurückgeparst.
- Ein Tier zählt nur, wenn die Quelle eine Tierbeziehung ausweist. `augments.json` enthält keine Tierstruktur.
- Sichtbare PoB-Zeilen und PoB-`tradeHashes` sind keine RePoE-Mod-/Stat-IDs.

Rune bedeutet hier nur `type_id=Rune`; Soul Core nur `type_id=SoulCore`. Corruption-Implicit (`generation_type=corrupted`) und Corruption-Upgrade (`CorruptionUpgrade…`, `generation_type=unique`) bleiben getrennt. `domain=desecrated` wird nicht als normaler Equipment-Mod interpretiert. Enchantment ist nicht automatisch Implicit; Anointment benötigt zusätzlich Rezept-, Item- und Passive-Node-Zuordnung.

## 3. Bestehender Corruption-Bestand und frühere Specials

Die ehemals 213 „Special“-Records aus 5M.1 sind vollständig aufgelöst:

| Kategorie | Mods | Statzeilen | variable Records | Gruppen | Generation | Domain |
|---|---:|---:|---:|---:|---|---|
| Corruption-Implicit | 103 | 111 | 85 | 77 | `corrupted` | `item` |
| Corruption-Upgrade | 110 | 118 | 94 | 77 | `unique` | `item` |

Die 103 Implicits betreffen 28, die 110 Upgrades 29 technische Itemklassen im vorhandenen Audit. Mod-ID, Stats, Bereiche, Gruppen, Konflikte und Klassenzuordnungen liegen bereits in den neun generierten 5M.1-Dateien. UI und Engine besitzen dafür keine neue Sonderlogik; der fachliche Analyzer-Support ist weiterhin nicht vollständig.

Keiner der 213 Records ist Desecrated, Mutated, Rune-only, Socketable-only, Enchantment oder Anointment. Es gibt null unresolved Records. Zusätzliche Namens- oder Domain-Treffer in den 16.678 Roh-Mods dürfen nicht erneut als diese 213 importiert werden. Status je Kandidat muss später `already-produced`, `raw-not-imported`, `other-source-only` oder `unknown` tragen.

## 4. RePoE-Exportinventar

| Datei | Bytes | SHA-256 | Befund |
|---|---:|---|---|
| `version.txt` | 9 | `ec563ae02051174b61a31ae1a0aa84329cd1025cc5ce2ecde19fae85b446ba28` | `4.5.4.4.4` |
| `data/augments.json` | 339.373 | `21985449c8528f13deb9fd50db922d81ef3f8a58fecdcc65c0fa5734e7c516c5` | 295 technische Socketables |
| `data/base_items.json` | 8.127.066 | `846029974c5cd643423404072bd6c5b497c5ed129544750a41ca7d0e0c5b4449` | 5.246 Bases; alle 295 Augment-IDs lösen auf |
| `data/mods.json` | 13.467.532 | `33e65dd81cc430c067b70550d4b7a6360b66ae477ced225cdc6309d58acafe1b` | 16.678 Mods; Corruption/Spezialkontrolle |
| `data/mods_by_base.json` | 5.241.078 | `80ca517eca450192e88e86cb550af8cc43ccb6d0b29ecc4c2537ac67d47db4b9` | 74 Klassen; keine vollständige Augment-Effektmatrix |
| `data/item_classes.json` | 16.553 | `f1905c443d45863ad66bc07066b63551c7ed315f77e6b635fee2fa52ee05d821` | 117 Klassen |

`base_items.json` führt 295 Bases unter Itemklasse `SoulCore`; diese generische Exportklasse ersetzt nicht die `type_id`-Trennung. Dedizierte Top-Level-Dateien für Desecrated, Mutated, Enchantments oder Anointments existieren nicht. `mods.json` enthält 126 `corrupted`-Generation-Records insgesamt; 103 davon gehören zur bestehenden 29-Klassen-Auswahl. Bloße ID-Suchen (`Rune`, `Mutat`, `Enchant`) liefern zahlreiche Monster-, Map-, Unique- und Altcontent-Treffer und sind keine Produktmenge.

## 5. RePoE-Parser und Datenverlust

`repoe/parser/poe2/augments.py` (`bf74b11a…`, 3.609 Bytes) liest konkret:

- `SoulCores.dat64`
- `SoulCoreStats.dat64`
- die Relationen `BaseItemType`, `Type`, `Limit`, `StatCategory`, `Stats`, `StatsValues`, `BondedStats` und `BondedStatsValues`
- Statübersetzungen aus `stat_descriptions.txt`.

Er erhält technische Base-ID, Required Level, Type-ID/-Name, Limit, Kategorien, Zielklassen, Stat-ID und `IsLocal`. Er benutzt Werte zur englischen Übersetzung, schreibt `StatsValues` und `BondedStatsValues` jedoch nicht als numerische Felder in `augments.json`. Damit sind Item–Kategorie–Stat-Beziehungen erhalten, Wertebereiche aber nur im sichtbaren Text. Zur verlustfreien Modfreigabe müsste der gepinnte Parser reproduzierbar um strukturierte Wertearrays erweitert, neu gepinnt, exportiert, gehasht und erneut geprüft werden.

`mods.py` (`b80cdaca…`) erhält für allgemeine Mods Generation, Domain, Gruppen, Stat-IDs, Min/Max, Tags, Spawnweights und `grants_effects`. `base_items.py` (`176a2643…`) hält Bases/Implicits separat. Es existiert kein Join, der allgemeine Mod-Records statt der SoulCoreStats-Relation als vollständige Socketable-Effektquelle belegt.

## 6. Runen, Soul Cores und weitere Socketables

| Typ | Gegenstände | Effektvarianten | Statzeilen | eindeutige Stat-IDs | Bonded-Zeilen | eindeutige Bonded-IDs |
|---|---:|---:|---:|---:|---:|---:|
| Rune | 221 | 354 | 382 | 238 | 428 | 163 |
| SoulCore | 34 | 64 | 70 | 60 | 0 | 0 |
| Idol | 35 | 76 | 87 | 86 | 82 | 74 |
| AbyssalEye | 4 | 12 | 12 | 12 | 0 | 0 |
| CongealedMist | 1 | 1 | 1 | 1 | 0 | 0 |
| Gesamt | 295 | 507 | 552 | nicht addierbar | 510 | nicht addierbar |

Alle 295 IDs lösen in `base_items.json` auf. Gegenstandsartabhängigkeit ist explizit: Rune-Varianten reichen unter anderem über Armour, Martial Weapon, Wand/Staff, Shield, Body Armour und einzelne konkrete Waffentypen; Soul Cores über Armour-, Waffen- und Offhandgruppen. Bonded-Effekte sind technisch getrennt. Modzeilen- und Wertebereichsvollständigkeit ist wegen der verworfenen Werte **Unbekannt**.

Rune-only- oder Socketable-only-Modnamen in `mods.json` sind überwiegend Unique- oder andere Mechanikmods und dürfen nicht als Effekttabelle der 295 Items umgedeutet werden. Item-granted Skills wurden für die Socketables nicht als belastbare itemgebundene ID-Beziehung nachgewiesen.

## 7. Path of Building PoE2

Kontrollpin: `PathOfBuildingCommunity/PathOfBuilding-PoE2`, `dev@f5b94342eeea413a94c339af3e881c5e2a4df0df`; zugehöriges Release **Unbekannt**. Code MIT, eingebettete Itemdaten als GGG-Copyright gekennzeichnet.

`src/Data/ModRunes.lua` ist automatisch erzeugt (194.599 Bytes, SHA `f4e93061…`) und enthält nach struktureller Lua-Zählregel 287 Top-Level-Namensrecords sowie 570 Zielrecords: 411 `type=Rune`, 69 `SoulCore`, 77 `Idol`, 12 `AbyssalEye`, 1 `CongealedMist`. Top-Level-Namen enthalten 133 sichtbare „Rune“- und 30 „Soul Core“-Namen; die übrigen Namen zeigen, warum Namenszählung keine Typzählung ist. Zielrecords sind PoB-interne Kategorien und sichtbare Modzeilen mit `statOrder`/`tradeHashes`, keine RePoE-Mod-/Stat-ID-Beziehung.

`src/Data/ModCorrupted.lua` enthält sichtbare Corruptiondaten. `src/Export/Scripts/soulcores.lua` erzeugt Daten aus PoB-Exporttabellen. PoB modelliert Socketables funktional und ist eine wertvolle Coverage-/Mechanikkontrolle, aber Werte und Wirkungen hängen von PoB-Parser-/Enginecode ab. Es wird weder Daten- noch Parserlogik übernommen.

## 8. poe2-mcp und weitere Communityquellen

Kontrollpin: `HivemindOverlord/poe2-mcp@163c30a9fd45f815d330cc54e6ab51a797693d31`, Datenrelease `data-v0.5.0-r12`. `mods.json` enthält 16.788 Modrecords; 16.565 IDs schneiden sich exakt mit den 16.678 RePoE-IDs, 113 sind nur im RePoE-Pin und 223 nur im MCP-Patch. Diese Differenz ist Patch-/Extraktionskontrolle, keine automatische Quellunion.

Die 1.019 Schemafingerprints nennen `soulcores`, `soulcorestats`, `soulcorestatcategories`, `socketablestashtablayout` und `incursion2mutateduniquemodsclient`. Das Repository veröffentlicht aber keine normalisierte SoulCores-/SoulCoreStats-Itemdatei. Technische Mod-/Stat-IDs und Wertebereiche sind in der Moddatei vorhanden, nicht itemgebunden zu den 295 Socketables. MIT gilt für Code, nicht als GGG-Datenfreigabe.

Das bestehende Inventar von 51 Topic-Repositories wurde erneut gefiltert. PoBR bleibt derivative PoB-Kontrolle; poe2-build-planner nutzt Freitext; Parserprojekte ohne gepinntes Zuordnungsprodukt sind Werkzeuge, keine Datenquelle. Keine weitere Quelle liefert eine belastbarere vollständige Item–Kategorie–Stat–Wert-Beziehung. PoE2DB wurde nicht abgerufen, gescrapt oder als API/Dump verwendet.

## 9. Weitere Corruption-, Desecrated-, Mutated- und Spezialmods

- **Corruption-Implicits:** `conditionally-approved` im bestehenden 5M.0-Scope und bereits importiert; kein neuer Import.
- **Corruption-Upgrades:** ebenso bestehend; `generation_type=unique` bedeutet hier Upgrade-ID, nicht Unique-Item-Zeile.
- **Weitere Corruption-Mods:** `pending`. 528 IDs mit Namensfragment `Corrupt` über viele Domains sind keine belegte zusätzliche Equipmentmenge.
- **Desecrated:** `deferred` (im Approval-Schema als blockierendes `pending`). `domain=desecrated` enthält 415 gemischte Map-/Abyss-/Unique-Heart-Records; normale Equipmentzuordnung ist nicht belegt.
- **Mutated:** `blocked`. 244 ID-Namen enthalten „Mutat“, darunter Transmutation und überwiegend `UniqueMutatedVaal…`; eine Freigabe würde die Unique-Sperre umgehen.
- **Enchantments:** `pending`. 16 Namensfunde liegen über Item-, Chest- und Area-Domains; eine vollständige Item-Enchantment-Tabelle fehlt.
- **Anointments:** `deferred`. `UniqueMultipleAnointments1` und Passive-Node-Namen sind keine Rezept-/Item-/Node-Datenbank.
- **Sonstige Spezialmods:** `deferred`; keine pauschale Restkategorie wird erfunden.

## 10. ID-basierter Vergleich und Stichproben

Der Vergleich nutzt Metadata-/Base-ID, Type-ID, Kategorie-ID, Stat-ID, Mod-ID, Generation, Domain, Gruppe und strukturierte Werte. RePoE↔MCP ist für allgemeine Mod-IDs teilweise exakt. RePoE↔PoB ist bei Socketables nur über technische Namen/Typen plausibilisierbar, nicht verlustfrei. Ein Drei-Quellen-Intersection-Count der Socketable-Items ist **Unbekannt**.

| Fall | Technische Evidenz | Projektstatus/Risiko |
|---|---|---|
| Rune, mehrere Rüstungsziele | `EmergentInstinct`, Body Armour/Gloves/Helmet | Identität freigegeben; Effektwerte pending |
| Soul Core, Waffe/Rüstung | `SoulCoreCrit`, Body Armour/Martial Weapon/Shield or Buckler | Identität freigegeben; Effektwerte pending |
| Bonded-Effekt | `CarvedCunning`, Idol mit normalen und bonded Stats | Modell/Analyzer fehlen |
| weiteres Socketable | `AmanamusGaze`, AbyssalEye | nur exakt dieser Typ freigegeben |
| Anointment-Marker | `AugmentAnoint`, CongealedMist | Identität ja; Rezept/Passivewirkung deferred |
| Corruption-Implicit | `CorruptionAdditionalAmmo1` | bereits produktiv |
| Corruption-Upgrade | `CorruptionUpgradeAdditionalAmmo1` | bereits produktiv |
| Mutated | `UniqueMutatedVaalIncreasedLifeLeechRate` | Unique-Risiko, blocked |
| Anointment-Namensfund | `UniqueMultipleAnointments1` | keine Anointment-Datenbank |

Spezialmod ohne direkte Stat-ID beziehungsweise vollständige Wertebeziehung bleibt `unknown`/unsupported; Text wird nicht geraten.

## 11. Build-Planner-, Architektur- und Foto-Relevanz

Socketables sind wichtig für vollständige reale Ausrüstung und Buildbewertung, aber Identitätsimport allein würde falsche Vollständigkeit vortäuschen. Später erforderlich sind Socketanzahl und -belegung pro Equipmentitem, Socketable-ID, Zielkategorie, normale und bonded Statgruppen, lokale/globale Wirkung, Werte, Limits und unbekannte Effekte. Das bestehende Equipmentmodell besitzt diese Struktur nicht; BuildProfile, Workerprojektion und Equipment Analyzer benötigen eine gesonderte Architekturentscheidung, gegebenenfalls einen Socketable-Adapter/Analyzer. Passive-/Skillkopplungen dürfen nicht aus sichtbarem Text abgeleitet werden.

Der spätere Fotomodus muss Socketables auf dem Itembild erkennen, Modzeilen von normalen Affixen trennen, Itemart und Socketposition berücksichtigen, technische IDs und Zahlenwerte zuordnen, mehrere Einsetzungen unterscheiden und unbekannte Zuordnungen erhalten. Deutsche Texte dürfen erst nach stabiler technischer Zielmenge in 5M.2 geprüft werden.

## 12. Approval-Entscheidung und Scopes

| Teilbereich | Status | Scope/Rolle |
|---|---|---|
| Rune-Identität | `conditionally-approved` | `poe2-technical-rune-identity-data-for-build-planner` |
| Rune-Moddaten | `pending` | eigener blockierender Scope |
| Soul-Core-Identität | `conditionally-approved` | `poe2-technical-soul-core-identity-data-for-build-planner` |
| Soul-Core-Moddaten | `pending` | eigener blockierender Scope |
| Idol/AbyssalEye/CongealedMist-Identität | `conditionally-approved` | `poe2-technical-other-socketable-identity-data-for-build-planner` |
| deren Moddaten | `pending` | eigener blockierender Scope |
| bestehende Corruption-Implicits/-Upgrades | bestehend `conditionally-approved` | kein neuer Scope/Import |
| weitere Corruption-Mods | `pending` | zusätzliche Menge nicht belegt |
| Desecrated | `deferred` | Approval technisch `pending` |
| Mutated | `blocked` | Unique-Grenze |
| Enchantments | `pending` | Vollständigkeit/Zuordnung offen |
| Anointments | `deferred` | Approval technisch `pending` |
| sonstige Spezialmods | `deferred` | keine Restfreigabe |

Für Identitäten sind nur `data/augments.json`, `data/base_items.json`, `data/item_classes.json` und `version.txt` sowie `socketableId`, `baseTypeId`, `itemClassId`, `typeId`, `requiredLevel`, `limit`, Provenienz und Status erlaubt. Namen, Stattexte, Werte, Stat-/Moddaten und Bonded-Effekte sind ausdrücklich nicht in diesen Scopes enthalten.

Alle Scopes verlangen exakte Pins, SHA-256-Manifest, deterministische Normalisierung, Attribution, manuelle Freigabe, Offlinebetrieb und Entfernbarkeit. `latest`, `main`, Rohspiegel, Laufzeitabruf und Hotlinks sind verboten. Jeder Release-, Parser-, Schema- oder Rechtewechsel widerruft die operative Nutzbarkeit bis zur erneuten Prüfung.

## 13. Ausgeschlossene Daten, Lizenzen und Risiken

Ausgeschlossen bleiben Bilder, Icons, Audio, Modelle, Lore/Flavour, vollständige Rohspiegel, Drops/Preise/Trade, deutsche Displaynamen und Stattexte, PoE2DB-Daten, vollständige Skills/Supports, Unique-Daten, fremde Berechnungen/Parserlogik, Medien, Laufzeitabrufe und Hotlinks.

RePoE-, PoB- und MCP-Code-Lizenzen werden von GGG-Spieldatenrechten getrennt. Die bedingte Identitätsentscheidung ist eine enge, widerrufbare Projektrisikoentscheidung, keine allgemeine Nutzungserlaubnis. Hauptquelle für Identität ist RePoE; PoB und MCP bleiben Kontrolle/Schema-Referenz.

## 14. Importvoraussetzungen, Grenzen und Schlussfolgerung

Vor Modimport sind erforderlich: Parserexport der strukturierten normalen und bonded Werte, neuer Parser-/Exportpin, Hashmanifest, vollständiger Item–Kategorie–Stat–Wert-Diff, technische Modellentscheidung, Unsupported-Strategie, Update-/Entfernungstest und manuelle Approval-Prüfung. Neue Kategorien dürfen nicht automatisch aktiviert werden.

Es wurden keine Daten importiert, keine Produktivdateien erzeugt und keine bestehenden Corruption-Daten geändert. Zusätzliche Itemklassen und Uniques bleiben unimportiert; deutsche Texte bleiben gesperrt. 5M.1B, 5M.2 und 5N wurden nicht begonnen. Die physische iPhone-Abnahme bleibt offen und ist für diese reine Auditänderung nicht erforderlich.

Klare Schlussfolgerung: **Die technische Socketable-Identität ist belastbar und eng freigabefähig; die vollständigen Effekte sind es am aktuellen Exportformat noch nicht.** Empfohlener nächster Schritt ist eine Planungsentscheidung, ob vor 5M.1B zuerst ein gepinnter RePoE-Parserkandidat mit verlustfreien `StatsValues`/`BondedStatsValues` geprüft werden soll. Ohne diese Vorarbeit darf 5M.1B nur bereits vollständig freigegebene 5M.1B.0A-Bereiche importieren.
> 5M.1B importiert weder Socketable-Identitäten noch deren weiterhin blockierte/pending Wirkungen. Relics bleiben deferred.
