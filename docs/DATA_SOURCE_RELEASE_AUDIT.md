# Datenquellen-Freigabeaudit

## Ergänzung 5M.0 (22. Juli 2026)

Der nachfolgende Gesamtstatus beschreibt den historischen 5B/5C-Stand. Seit 5M.0 ist RePoE-PoE2 ausschließlich für `poe2-technical-affix-data-for-build-planner` aus Version `4.5.4.4.4`/Commit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c` `conditionally-approved`. Dies ist eine risikobasierte technische Projektentscheidung, keine GGG-Datenlizenz. PoE2DB, deutsche `display-names`, Skills, Supports, Medien und alle übrigen nicht ausdrücklich genannten Kategorien bleiben blockiert. Details: `docs/POE2_AFFIX_SOURCE_DECISION.md` und die maßgebliche `data-sources/source-approval.json`.

## Freigabeänderung und Importstand 5C

Der frühere Status `blocked` des offiziellen PoE2-Passivbaumexports wurde eng begrenzt auf `conditionally-approved` korrigiert. Release 0.5.2/Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6` liefert 5.150 importierte Knoten, 6.067 Verbindungen, 1.621 Gruppen, 6 Klassenstarts, 36 Aszendenzstarts und 19 explizite Juwelsockel. Es werden 0 Cluster-Sockel behauptet. 13 Einträge werden kontrolliert übersprungen; drei Warnungen, null Fehler und null unbekannte Felder stehen im Bericht. Andere echte Quellen/Kategorien bleiben blockiert. Saisonupdates folgen `docs/POE2_TREE_UPDATE_PROCESS.md` und benötigen Vergleich, Tests und dokumentierte manuelle Freigabe.

Stand: 20. Juli 2026. Dieses Audit bewertet ausschließlich den im Repository dokumentierten technischen und freigabebezogenen Stand. Es erfolgten kein Scraping, kein Datenabruf, kein API-Aufruf und kein Import echter PoE2-Daten. Dies ist keine Rechtsberatung und keine rechtliche Freigabe.

## Kontrollierte Freigabestatus

- `approved`: technisch, fachlich und hinsichtlich Nutzung/Weiterverteilung dokumentiert freigegeben.
- `conditionally-approved`: nur für einen präzise dokumentierten Umfang nach erfüllbaren Auflagen freigegeben.
- `pending`: Entscheidung oder belastbarer Nachweis fehlt.
- `blocked`: ein zwingendes Freigabekriterium ist offen; Nutzung darf nicht beginnen.
- `rejected`: Quelle oder Methode wurde ausdrücklich ausgeschlossen.

**Gesamtstatus echter PoE2-Daten: `blocked`.** Im Repository liegt keine vollständige Freigabe für automatisierten Abruf, lokale/abgeleitete Speicherung und Weiterverteilung eines echten Datensatzes vor.

## Bestehende Importpipeline

Die Pipeline ist eine reine Offline-Funktion in `src/import/pipeline.ts`. Sie erhält bereits im Speicher vorhandene `CanonicalRawData`; sie liest keine Dateien, ruft kein Netzwerk auf und schreibt keine Artefakte.

| Stufe | Quellcode | Tatsächliches Verhalten |
|---|---|---|
| Rohformat/Manifest | `src/import/types.ts` | Schema-/Importer-/Quellversion, Quelle, Zeitangabe, Sprache, Kategorien, Counts, Hash und Fixture-Markierung |
| Kategorien | `RAW_CATEGORIES` | Klassen, Aszendenzen, Modifier, Skills, Supports, drei Juwelarten, Uniques, passive Knoten und Verbindungen |
| Parsergrenze | `runImport(raw: unknown)` | Prüft Objekt-/Top-Level-Struktur; kein JSON-/HTTP-Dateiparser enthalten |
| Schema-/Manifestprüfung | `validateManifest`/Pipeline | Schema-Version, Fixture-Regel, Quelle, Counts und erwartete Kategorien |
| Normalisierung | `stableId`, `metadata`, Mappingfunktionen | deterministische technische IDs, gemeinsame Metadaten und kontrollierte Tags |
| Referenzprüfung | `validateReferences` | Klassen-, Modifier-, Support-, Passive- und Verbindungsreferenzen |
| Wert-/Tagprüfung | Pipeline + `isMechanicTag` | kontrollierte Tags, Wertebereiche, Clustergröße, Verbindungssicht |
| Fehlerbericht | `ImportIssue`, `ImportReport` | strukturierte Issues mit Code, Pfad, Nachricht und optionaler Record-ID; keine stillen Fehler |
| Integrität | `src/import/hash.ts` | deterministischer FNV-1a-32-Inhaltshash; kein kryptografischer Nachweis |
| Fixture | `src/import/fixtures/valid-fixture.ts` | ausdrücklich synthetische 23 Datensätze |
| CLI-ähnlicher Lauf | `src/import/fixture-cli.test.ts` | Vitest-Skript meldet strukturierten Bericht; kein allgemeines Import-CLI |
| Ergebnis | `ImportedDomainData` | In-Memory-Domänenarrays; keine generierte Datei, Datenbank oder Laufzeitquelle |

Bekannte Grenzen: elf Rohkategorien statt des vollständigen späteren Bedarfs, vereinfachte Skill-/Support-/Unique-Felder, keine Item-Slot-/Waffenart-Kategorie, keine Patchhistorie, kein Quelladapter, kein Download, kein Persistenzformat, keine inkrementellen Updates, kein Rollbackmechanismus und keine fachliche Validierung gegen echte Referenzfälle.

## Datenbedarfsmatrix

| Kategorie | Benötigte Felder | Vorhandener Domänentyp | Import-/Fixture-Status | Offene Transformationen | Fachliche Validierung |
|---|---|---|---|---|---|
| Klassen | stabile ID, DE/EN-Name, Version, Quelle, Tags | `ClassDefinition` | Rohkategorie; synthetisch vorhanden | externe ID/Übersetzung/Version | Vollständigkeit und Spielversion |
| Aszendenzen | ID, Klasse, Namen, Tags, Version | `AscendancyDefinition` | Rohkategorie; synthetisch | Klassenmapping, Tags | echte Klassenzuordnung |
| Skills | IDs, Namen, Tags, Schaden/Mechanik, Anforderungen, Waffen, Rollen, Rotationsmetadaten | `SkillGemDefinition` | Rohformat stark vereinfacht; synthetisch | viele Engine-Felder fehlen im Rohformat | Mechaniken, Anforderungen, Set-/Rolleneignung |
| Support Gems | IDs, Namen, Pflicht-/Ausschlusstags, Mechaniken, Kosten/Trade-offs | `SupportGemDefinition` | Rohkategorie; synthetisch | erweiterte Domainfelder mappen | echte Kompatibilität |
| Passive Nodes | ID, Name, Typ, Position, Modifier, Restriktionen, Set | `PassiveNodeDefinition` | Rohkategorie; synthetisch | erweiterte Mechaniken/Kosten | Knoteneffekt und Version |
| Passive Connections | ID, Von/Zu, Richtung/Status | `PassiveConnection` | Rohkategorie; synthetisch | Graphversion und Sonderkanten | Graphintegrität |
| Normale Juwele | ID, Namen, Modifier, Sockelregeln, Anforderungen | `JewelDefinition` | Rohkategorie; synthetisch | Requirements/Modifierdetails | Sockel- und Effektregeln |
| Cluster-Juwele | zusätzlich Größe, Knotenpool, Pfadkosten | `ClusterJewelDefinition` | Rohkategorie; synthetisch | interne Struktur/Notables | Kosten und Generierungsregeln |
| Unique-Cluster | Mechaniken, Enabler, Trade-offs, Restriktionen | `UniqueClusterJewelDefinition` | eigene Rohkategorie; synthetisch | Domain-Sonderfelder | Enabler-/Restriktionswirkung |
| Normale Uniques | Slot, Modifier, Anforderungen, Mechaniken, Set, Trade-offs | `UniqueItemDefinition` | Rohkategorie vereinfacht; synthetisch | Slot-/Replacement-/Enablerfelder | Itemwirkung und Ersatzlogik |
| Item-Slots | ID, DE-Name, Set/Hand, zulässige Itemtypen | `EquipmentSlotDefinition` | keine Rohkategorie; nur lokale Platzhalter | neues freizugebendes Rohschema | Slotregeln |
| Waffenarten | stabile ID, Tags, Hand/Set, Skillkompatibilität | `SyntheticWeaponType` ist nur Union | keine Rohkategorie/echten Fixtures | eigener Typ und Mapping nötig | echte Waffenanforderungen |
| Affixe | ID, Name, Kategorie, Werte, Modifiertyp, Slot-/Itemregeln | derzeit `ModifierDefinition` | teilweise als Modifier | Affixfamilie/Tiers/Spawnregeln fehlen | Werte, Gültigkeit, Patchstand |
| Tags | technische ID, Bedeutung, Quellmapping, Version | `MechanicTag` | kontrollierte lokale Union | externe Taxonomie abbilden | Semantik pro Modul |
| Modifier | ID, Namen, Kategorie, Einheit, Scope, Range, Slots, Tags | `ModifierDefinition` | Rohkategorie; drei synthetische Fixtures | komplexe Werte/Conditions | Rechenwirkung und Scope |
| Anforderungen | Attribute, Level, Klasse, Aszendenz, Waffe, Mechanik | verteilt über Domaininterfaces | nur teilweise im Rohformat | einheitliches Rohmodell | echte Schwellen/Restriktionen |
| Anzeigenamen | DE zwingend, EN optional, Fallback/Provenienz | `GameDataMetadata` | synthetische Namen vorhanden | Übersetzungsquelle und Updates | Terminologie/Attribution |
| Version/Patch | Schema, Quelle, Spielpatch, Importer, Hash, Zeitpunkt | `DataProvenance`, `ImportManifest` | Struktur vorhanden, Fixturewerte | Patchstrategie und Historie fehlen | Reproduzierbarkeit/Kompatibilität |

## Quellenstatus und offene Freigaben

| Quelle/Methode | Status | Repository-Nachweis | Offene Punkte |
|---|---|---|---|
| Lokale synthetische Fixtures | `approved` für Tests | klar als `local-placeholder`/Fixture markiert | nicht als echte Beratung verwenden |
| PoE2DB als geplanter Kandidat | `blocked` | in `docs/DATA_SOURCES.md` nur als mögliche Quelle dokumentiert | Nutzungsbedingungen, Lizenz, automatisierter Zugriff, lokale/abgeleitete Speicherung, Weiterverteilung, Attribution, Rate Limits, Patchhistorie |
| Offizielle GGG-Web-/API-Angebote allgemein | `pending` | Primärlinks und Einschränkungen in `docs/DATA_SOURCES.md` | konkreter Endpoint/Datensatz, API-Bedingungen, Assets, Speicherung, Attribution, Umfang |
| Offizieller Passivbaumexport | `pending` | technisch als Kandidat dokumentiert | Rechte an Daten/Assets, erlaubte Speicherung/Weiterverteilung, Versionierung |
| Manuelle Erfassung | `pending` | als mögliche Provenienz modelliert | Herkunftsnachweis, Rechte, Review, Wartung, Fehlerquote |
| Ungefragtes Web-Scraping | `rejected` | Projektregeln schließen es aus | keine Umsetzung vorgesehen |
| Live-Abhängigkeit von Drittseiten zur Laufzeit | `rejected` | Offline-first-Architektur | keine Umsetzung vorgesehen |

Es ist ungeklärt, ob automatisierter Abruf, lokale Speicherung, Speicherung abgeleiteter/normalisierter Daten oder Weiterverteilung zulässig sind. Ebenso fehlen belastbare Entscheidungen zu Attribution, Rate Limits, Patch-/Versionshistorie und möglicher Assetnutzung. Das Audit behauptet weder eine Lizenz noch eine Erlaubnis.

## Verbindliche Freigabecheckliste

Vor einem echten Import müssen alle zwingenden Punkte mit Nachweis, Datum, verantwortlicher Entscheidung und freigegebenem Umfang dokumentiert sein:

- [ ] Quelle eindeutig identifiziert.
- [ ] Nutzungsbedingungen archiviert oder unveränderlich referenziert.
- [ ] Lizenz beziehungsweise Nutzungsrecht geprüft.
- [ ] Automatisierter Zugriff ausdrücklich erlaubt.
- [ ] Lokale Speicherung erlaubt.
- [ ] Speicherung abgeleiteter/normalisierter Daten erlaubt.
- [ ] Weiterverteilung im öffentlichen Repository/Pages-Artefakt erlaubt.
- [ ] Attribution und Anzeigeort geklärt.
- [ ] Patch-/Versionsstrategie geklärt.
- [ ] Rate Limits und Abrufintervalle geklärt.
- [ ] Datenschutzrelevanz geprüft.
- [ ] Alle benötigten Datenfelder auf das Domänenmodell abgebildet.
- [ ] Kanonisches Rohschema für fehlende Kategorien erweitert und versioniert.
- [ ] Fachlich geprüfte Referenztests vorhanden.
- [ ] Rollback-Strategie vorhanden.
- [ ] Aktualisierungs-, Deprecation- und Migrationsstrategie vorhanden.
- [ ] Freigabeentscheidung mit Status und Umfang dokumentiert.

Solange ein zwingender Punkt offen ist, bleibt der reale Import `blocked`. Eine technische Abrufmöglichkeit ist keine Nutzungsfreigabe.

## Verbindliche Nachprüfung in Aufgabe 5B

Die belegbasierte Prüfung ist in `docs/DATA_SOURCE_APPROVAL.md` und `docs/DATA_SOURCE_REFERENCES.md` dokumentiert; `data-sources/source-approval.json` ist die maschinenlesbare Entscheidung. Ergebnis:

- Nur lokale synthetische Fixtures sind `approved`.
- Die offizielle GGG-API ist ausschließlich für dokumentierte Endpunkte und unter ihren Bedingungen `conditionally-approved`, deckt aber keine vollständige benötigte statische Datenkategorie ab.
- Der offizielle PoE2-Passivbaumexport ist nur im dokumentierten 5C-Umfang `conditionally-approved`; RePoE, PoE2DB und alle anderen echten Kategorien bleiben `blocked`.
- Nicht dokumentierte Endpunkte und Spieldateiextraktion sind `rejected`; manuelle Übertragung bleibt `pending`.
- Bilder und Icons sind separat `blocked`.
- Eine zentrale, netzwerkfreie Freigabesperre unter `src/import/approval.ts` verhindert echte Importe ohne passende Quellen-/Kategoriefreigabe und erfüllte Bedingungen; Fixtures bleiben möglich.

**Gesamtstatus echter PoE2-Daten bleibt `blocked`.** Für Aufgabe 5C wird noch kein Import empfohlen. Benötigt wird zuerst eine schriftliche, kategorienbezogene Freigabe, idealerweise für den offiziellen Passivbaumexport ohne Assets, einschließlich Abruf, Speicherung, Ableitungen, öffentlicher Weiterverteilung und Attribution.
# 5M.1 Affixstand

Der aktuelle technische Affixstand ist exakt `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`. Ein Versions-, Commit- oder Schemawechsel wird nicht automatisch aktiviert, sondern verlangt Diffbericht, neue Hashes, Tests und manuelle Freigabe.
