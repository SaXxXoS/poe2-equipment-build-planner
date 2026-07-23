# PoE2 Offline Reference Table Extraction (5M.2.4)

> Folgestand 5M.2.7: Der externe Vergleich bestätigt, dass die fehlende Unique-Referenzkante weder im aktualisierten RePoE-Export noch in PoB2 oder poe2-mcp materialisiert ist. Lokale Referenzdaten und Pins bleiben unverändert.

## 1. Ziel und Ausgangslage

5M.2.4 erweitert ausschließlich die lokale Auditpipeline aus 5M.2.3. Es wurden keine Produktdaten, deutschen Produkttexte, Uniques oder Socketables importiert. Produktivpin, Approval, `translation-missing`, UI, BuildProfile, Worker, Analyzer, Engine, Passive Pipeline, Baum und Planvisualisierung bleiben unverändert. 5M.2 und 5N wurden nicht begonnen.

5M.2.3 hatte 2.255 Mod-IDs, 2.705 Statzeilen, 431 Stat-IDs, 444 geordnete Kombinationen, 429 Mehrzeiler/Hybride und 39 Basistypen technisch gefunden. Referenztabellen, 33 Itemklassen, Charm, Uniques und Socketables waren nicht Ende-zu-Ende aufgelöst.

## 2. Pins und Offlinegrenze

- Content.ggpk: 152.881.075.152 Bytes; SHA-256 `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`
- PoB2: `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- ooz: `0.2.4`; gepinntes Archiv SHA-256 `e6d7e728a8b02d2203a80f41bdf8f13c524afda2d393773930b8dfc0afd94af4`
- PoB2-Schema: SHA-256 `268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30`
- lokales GGPK-Dateiinventar: SHA-256 `9a8cc5e1f408cca027bce446696cc220de7d4de2854e14316a5fdbf713bbe4bb`
- Referenztabellenmanifest: SHA-256 `a4bbcd99f21490520b516c83800e67bf3a0b691e971d0da59e318dfe6e971353`
- Auditformat: `2`; Laufzeit: Node.js 24.14.0

Die Extraktion lief mit `bun_extract_file.exe extract-files <CONTENT_GGPK> <LOCAL_AUDIT_OUTPUT> <22_EXACT_PATHS>`. Pfade sind anonymisiert. Während Extraktion und Audit gab es kein HTTP, HTTPS, DNS, API, Trade-API, PoE2DB, Webseitenzugriff oder Hotlink. Vorbereitung und bereits vorhandene Programme sind von den Offline-Läufen getrennt.

## 3. Offene Referenzen und Auswahlplan

Aus den 5M.2.3-Statuswerten wurden insbesondere `ModDomains`, `ModGenerationTypes`, `ModFamily`, `ModType`, Itemklassen, Granted-Effect-Referenzen und Socketable-Tabellen abgeleitet. Das vollständige lokale Dateiinventar wurde gegen tatsächliche Pfade geprüft; keine Tabelle wurde aus einem vorgeschlagenen Namen erfunden.

Ausgewählt wurden nur 16 englische technische Tabellentypen plus sechs deutsche lokalisierte Gegenstücke, insgesamt 22 Dateien:

- `ItemClasses`, `ItemClassCategories`, `BaseItemTypes` und ihre deutschen Varianten
- `ModFamily`, `ModType`, `ModGrantedSkills`, `GrantedEffectsPerLevel`
- `SoulCores`, `SoulCoreTypes`, `SoulCoreStats`, `SoulCoreStatCategories`, `SoulCoreLimits` sowie vorhandene deutsche Varianten
- `UniqueChests`, `UniqueStashLayout`, `EndgameCorruptionMods`, `Incursion2MutatedUniqueModsClient`

Die fünf 5M.2.3-Tabellen wurden nicht unnötig neu in das Referenzmanifest kopiert. `Mods`, `Stats` und `Tags` werden aus dem unveränderten gepinnten Altmanifest in denselben Resolver eingebunden.

## 4. Ausgeschlossene oder nicht vorhandene Tabellen

Unter den vorgeschlagenen technischen Namen waren im Content-Inventar nicht vorhanden: `ModDomains`, `ModGenerationTypes`, `ModGroups`, `SpawnWeights`, `UniqueItems`, `UniqueItemVersions`, `UniqueItemMods`, `ItemGrantedSkills`, `ItemGrantedSupports`, `Augments`, `AugmentTypes`, `StatsValues`, `BondedStatsValues`, `ImplicitMods`, `CorruptionMods`, `Enchantments` und `Anointments`.

`ModDomains` und `ModGenerationTypes` besitzen PoB2-Schemablöcke, aber keine gleichnamige extrahierbare DATC64-Datei. Sie werden deshalb nicht als aufgelöste Enumtabellen behauptet. `ModFamily` ist technisch vorhanden, ersetzt aber keine belegte ModGroup-/Konflikttabelle. Spawn-Tags und Gewichte liegen als geordnete Felder in `Mods`; eine separate `SpawnWeights`-Tabelle wurde nicht erfunden.

## 5. Extraktionsläufe und Manifest

Beide Läufe extrahierten 22/22 Dateien ohne Fehler. Beobachtete Wandzeiten waren 8,7 beziehungsweise 8,9 Sekunden. Je Lauf entstanden 11.884.854 Bytes. Der Manifesthash war in beiden Läufen `a4bbcd99f21490520b516c83800e67bf3a0b691e971d0da59e318dfe6e971353`. Exitcode war 0; erkannte Netzwerkversuche: 0. Die Auditläufe benötigten beobachtet 7,6 beziehungsweise 7,9 Sekunden. Die vollständigen Rohdateien, Laufprotokolle, Manifeste und normalisierten Ergebnisse bleiben unter `.local-audits/poe2-offline-reference-extraction/`.

Die bereinigte Tabelle-zu-Hash-/Feldmatrix steht in `docs/audits/poe2-offline-reference-table-inventory.json`. Sie enthält für jede Datei Pfad, Größe, SHA-256, Datensatz- und Feldzahl, Datentyp, Arraystatus, Nullable-Einschätzung, Fremdschlüssel, Reihenfolgenrelevanz, unbekannte Felder und Parserstatus; keine Volltexte.

## 6. Schemas, Felder und Referenzintegrität

Die Pipeline verwendet ausschließlich explizite PoB2-Felddefinitionen. Arrays, Schlüssel, Nullreferenzen und Reihenfolgen werden technisch dekodiert. Schemaabweichungen führen zu `schema-unknown`; es erfolgt keine Positionsraterei. Innerhalb der kombinierten Tabellen wurden 137.090 Referenzen aufgelöst und 165.365 wegen fehlender Zieltabellen oder ungültiger Referenzen gemeldet. Doppelte technische IDs werden weiterhin als Fehler behandelt.

Unbenannte Schemafelder bleiben mit Index und Typ inventarisiert. Nicht extrahierte Ziele wie `ItemVisualIdentity`, `GrantedEffects`, `SkillGems`, `Words`, `FlavourText` und `StatSemantics` bleiben ungelöst.

## 7. Itemklassen-Schemabyte und Charm

Englische und deutsche `ItemClasses` haben 117 Datensätze, 150 Bytes je Datensatz und 149 sicher definierte Schemabytes. Das zusätzliche Byte liegt nach der belegten Schemastruktur; beide Sprachen haben dieselbe Zeilenbreite. Bedeutung, Werteverteilung, Referenzziel und Relevanz für ID oder Name bleiben **Unbekannt**, weil der Parser keine ungesicherte Feldposition interpretiert. Es ist nicht sicher ignorierbar; die Tabelle bleibt `schema-unknown` und wird nicht verlustfrei dekodiert.

Damit bleiben alle 33 Produktitemklassen `unresolved`. `Charm` kann weder als direkte lokale ID noch als sicherer Alias belegt werden. Klassifikation: **weiterhin unbekannt**. Es wurde keine Zuordnung aus dem sichtbaren Namen, aus BaseItemTypes oder aus RePoE-Normalisierung erzwungen.

## 8. ModDomains, Generation Types, Gruppen, Tags und Spawnweights

Die 2.255 Produktmods bleiben `partially-resolved`: Mod-ID, geordnete Stat-IDs, strukturierte Werte, Tags und Spawnweight-Arrays sind vorhanden; 2.255/2.255 stimmen weiterhin technisch überein. `ModDomains` und `ModGenerationTypes` sind mangels extrahierbarer Zieltabelle 0/2.255 aufgelöst. `ModFamily` enthält 6.113 Datensätze und `ModType` 12.522 Datensätze, kann aber ohne belegte Semantik keine Domain-, Generation- oder Konfliktgruppe ersetzen. Eine Craftingwahrscheinlichkeit wurde nicht berechnet.

Ergebnis: resolved 0, partially-resolved 2.255, unresolved 0. Der Status ist gegenüber 5M.2.3 fachlich unverändert, aber die Ursache ist nun durch das vollständige lokale Dateiinventar belegt.

## 9. Basistypen und deutsche Verbindungen

Die 39 Produktbasistyp-IDs bleiben vorhanden und partially-resolved. Englische und deutsche `BaseItemTypes` sind vollständig schemakompatibel dekodierbar; Namen bleiben ausschließlich lokal. Die Itemklassen-Fremdschlüssel können wegen der undekodierten Zieltabelle nicht fachlich aufgelöst werden. Tags und Implicit-Mod-Referenzen sind technisch vorhanden, ohne neue Produktdaten zu erzeugen.

## 10. Deutsche Templates und Lücken

Die 12 Produkt-Stat-IDs ohne deutsche CSD-Struktur wurden durch keine der neuen Referenztabellen lokalisiert. Sie bleiben 12/12 ungelöst; es wurde kein Alias oder freier deutscher Text erzeugt. Ebenso bleiben die 38 technischen Templatelücken 38/38 ungelöst. Die bereits in 5M.2.3 belegten 447 deutschen/englischen CSD-Strukturen bleiben unverändert.

Die 2.189 lokalen OCR-Mehrdeutigkeiten wurden gegen neue mögliche Kontexte geprüft. ModFamily, ModType, Basistyp und Soul-Core-Kategorie liefern Kontextkandidaten, aber Domain, Generation Type und verlustfreie Itemklasse fehlen. Deshalb wurden 0 Mehrdeutigkeiten als sicher gelöst klassifiziert.

## 11. Unique-Referenzkette

`UniqueStashLayout` enthält 449 Zeilen, `UniqueChests` 48 und `Incursion2MutatedUniqueModsClient` eine Zeile. Diese verwandten Tabellen bilden keine belastbare Kette `Unique-ID → BaseItem-ID → ItemClass-ID → Varianten-ID → Mod-ID → Stat-ID → strukturierter Wert`.

Unique-Identitäten, Basistypzuordnungen, Varianten, Modreferenzen, Stat-IDs, Rollbereiche sowie itemgebundene Skill-/Supportreferenzen bleiben daher **Unbekannt**. Sichtbare Wörter oder Unique-Zeilen wurden nicht als technische Identität verwendet. Die 65 Zeilen in `ModGrantedSkills` belegen nur Mod-/SkillGem-Referenzen; ohne vollständige Unique-Kette und `SkillGems`-Zieltabelle erfolgt keine Unique-Zuordnung und kein Skill-/Supportimport.

## 12. Socketables, StatsValues und BondedStatsValues

Technisch vorhanden sind 295 `SoulCores`-Zeilen, 5 Typen, 507 `SoulCoreStats`-Zeilen, 30 Statkategorien und 4 Limits. `SoulCoreStats` enthält strukturierte `Stats`, `StatsValues` und `BondedStats`. Die 295 Identitätszeilen besitzen jedoch ebenfalls ein unbekanntes Schemabyte und werden nicht in sichtbare Namen oder Produktidentitäten umgedeutet.

`StatsValues` ist als strukturierte Arrayquelle belegt; vollständige Ketten bleiben 0, Teilketten 295. `BondedStatsValues` existiert nicht als eigenständige Tabelle; `BondedStats`-Referenzen sind vorhanden, aber ohne vollständig aufgelöste Stat-, Itemklassen- und Zielkategoriekette nicht Ende-zu-Ende belegbar. Zielkategorien: 30 technische Kategoriezeilen, fachliche Waffe/Rüstung/Schmuck/Offhand-Zuordnung bleibt ohne sichere ItemClasses-Auflösung offen.

Runen, Idols, Abyssal Eyes und Congealed Mist bleiben **Unbekannt**, weil keine gleichnamigen technischen Identitätstabellen in der ausgewählten, schemabelegten Minimalmenge vorhanden sind. Frühere RePoE-Zahlen wurden nicht als lokale Extraktionsergebnisse ausgegeben. Keine Socketable-Produktdaten oder Freigaben entstanden.

## 13. OCR- und Foto-Modus-Tauglichkeit

- reguläre Prefixe/Suffixe, Basis-Implicits, Jewels, Charms und Flasks: `partially-suitable`
- Corruption-Mods: `only-with-context-logic`
- Uniques: `unknown`
- Soul Cores: `only-with-additional-context`
- Runen und weitere Socketables: `unknown`

Geprüft wurden nur IDs, Platzhalter, Wertebereiche, Reihenfolge, Basistyp-, Mod- und mögliche Kategorienkontexte. OCR, Bilderkennung und Foto-Modus wurden nicht implementiert.

## 14. Determinismus

Extraktionslauf 1 und 2 hatten identische Datei-, Größen- und Manifestwerte. Auditlauf 1 und 2 waren byteidentisch:

- normalisierter SHA-256: `0ce6cb7b394dca4e997b3be18bec8b779a497a90428b45b36168b4049bb848b7`
- bereinigter SHA-256: `1a0e803bebce49144dc3d7dd3200643cfc7fce6c0ff5169f9afbef7061126680`

Coverage, Konflikte, Warnungen und Fehler waren identisch. Zeitstempel sind nicht Bestandteil fachlicher Hashes. Determinismusstatus: `byteidentical`.

## 15. Sicherheit, Lizenzen und Spieldatenstatus

PoB2 steht unter GPL-3.0; ooz/bun wird nur als gepinntes lokales Extraktionswerkzeug verwendet. Der neue Auditcode ist projektinterner Code und übernimmt keine PoB-Engine- oder Berechnungslogik. Code-Lizenz, lokaler Parser, lokal extrahierte GGG-Daten, deutsche GGG-Texte und mögliche Produktdistribution bleiben getrennt.

Alle Rohdaten und Volltexte sind gitignored. Versioniert sind ausschließlich Parsercode, Tests, Pins, Hashes, aggregierte Zahlen, Feldmetadaten, Statuswerte und kleine technische Aussagen. Keine allgemeine Daten- oder Distributionsfreigabe wird behauptet. PS-Spieler benötigen für eine spätere Produktlokalisierung ausgelieferte Sprachdaten und deshalb eine eigene Approval-/Distributionsentscheidung.

## 16. Bekannte Lücken und Schlussfolgerung

Die Extraktionsmöglichkeit ist deterministisch, aber der aktuelle PoB2-Schemastand reicht nicht zur verlustfreien vollständigen Referenzauflösung. Entscheidend offen bleiben das unbekannte ItemClasses-/SoulCores-Byte, nicht als DAT vorhandene Domain-/Generationtabellen, die Unique-Identitätsschicht und die Bonded-/Zielkategoriekette.

Technische Schlussfolgerung: 5M.2.4 verbessert das Tabelleninventar und belegt Soul-Core-Strukturen, löst jedoch die 2.255 Produktmods nicht über den Status `partially-resolved` hinaus. Es rechtfertigt weder einen neuen Produktivpin noch eine Approval-Freigabe.

Empfohlener nächster Schritt ist ein eigener, audit-only Schemaentscheid für die zwei unbekannten Bytes und die nicht als DAT materialisierten Enumtabellen. Erst nach einer belegten Schemaquelle darf ein weiterer End-to-End-Audit erfolgen. 5M.2, 5N, Fotoerkennung, Übersetzungs-Lernmodus und mobile Textklippung bleiben offen.

## Fortsetzung 5M.2.5

Schema, Enumgenerator und Consumercode bestätigen Domain/Generation für 2.255 Mods. Zusatzbytes und Konfliktgruppensemantik bleiben unbekannt. Details: [POE2_BINARY_SCHEMA_AND_ENUM_AUDIT.md](POE2_BINARY_SCHEMA_AND_ENUM_AUDIT.md).

## Fortsetzung 5M.2.6

Die lokale Referenzextraktion wurde gezielt um 25 Unique-Kandidatendateien erweitert. Sie belegen Fragmente, aber keine Unique-ID→Base→Mod/Stat-Kette. Rohdaten bleiben ausschließlich lokal.
