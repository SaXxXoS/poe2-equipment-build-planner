# Datenquellen-Freigabeaudit

## Release-Auswirkung 5M.2.10

Keine Runtime- oder Produktdatenänderung. `generated/pob2/uniques.json` bleibt bei SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`; Registry und Analyzer bleiben unverändert. Sieben bereinigte Auditberichte und die Lokalisierungsstrategie dokumentieren den Status `audit-only-no-safe-product-link`. 5M.2 und 5N sind nicht begonnen.

## 5M.2.8B – Release-Grenze

> Release-Audit 5M.2.9: 435 Records und 579 Varianten wurden offline gebündelt; Produkt-SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`. Zwei Importläufe waren byteidentisch. Rohquellen, Medien, Flavour Text, deutsche Unique-Texte und Runtime-Netzwerk fehlen absichtlich.

5M.2.9 darf für den PoB2-Unique-Scope beginnen. Ein Release ist nur mit
Vertragsversion 2 zulässig: exakter Commit, 20 exakte Hashes, reduzierte
Feldallowlist, vollständige Provenienz, Attribution, Quellenkennzeichnung und
deterministisches Manifest. Keine externen Genehmigungen werden behauptet.
Deutsche Texte, Rohmirror, Medien, reguläre Affixe und GGG-ID-Behauptungen
bleiben gesperrt.

## Historischer 5M.2.8A Release-Guard

PoB2-Unique-Produktdaten durften in 5M.2.8A nicht veröffentlicht werden. Der
damalige Guard blockierte wegen `distribution-pending-both`; erlaubte
Distributionsartefakte waren leer. 5M.2.8B löst ausschließlich diesen
technischen Blocker ab. Reguläre Affixdaten, Produktivpins,
deutsche Lokalisierung und `translation-missing` bleiben unverändert.

## Unique-Kandidatenaudit 5M.2.7

RePoE-PoE2 Remote-HEAD ist `1a6066ec60d24af274cb7a87d00b6ab1c0975ebd`; dieser Stand wurde nur im Auditbereich geprüft und ersetzt nicht den Produktivpin `b3f38149…`. RePoE-Parser `14e3edc…`, PoB2 `c5300ccd…` und poe2-mcp `163c30a9…` waren unverändert. Keine Quelle wurde aktiviert.

## Zusatzprüfung 5M.2.0 (2026-07-22)

Der RePoE-Parser-Remote-HEAD entsprach exakt `14e3edc89ed705bd4e4eda5c8135756431c76e81`; ein neuerer Kandidat existierte nicht. Ein deutscher Datensatz besitzt keinen Produktpin, weil kein Lauf durchgeführt wurde. Jeder spätere Sprachimport benötigt Spielversionspin, Quellpin, Hashmanifest, vollständigen ID-Vergleich und erneute Approval-Prüfung.

## 5M.1B.0C – unveränderte Pins

Der Socketable-/Spezialmod-Audit verwendet dieselben RePoE-Pins `4.5.4.4.4`/`b3f38149…` und Parser `14e3edc8…`. PoB ist auf `dev@f5b94342…`, poe2-mcp auf `163c30a9…`/`data-v0.5.0-r12` festgehalten. Jeder Versions-, Commit-, Parser- oder Schemawechsel verlangt neue Hashes, Vergleich und manuelle Freigabe; keine Kategorie wird automatisch produktiv aktiviert.

## 5M.1B.0B – Unique-Pins

Am 2026-07-22 entsprachen die geprüften Branches exakt den dokumentierten Commits: RePoE Export `b3f38149`, Parser `14e3edc8`, PoB2 `dev@f5b94342`, PoB2-v2 `dev@7e047f0e`, poe2-mcp `main@163c30a9`. PoBR wurde am Inventarcommit `ff1d07da` mit Datenversion 4.5.4.3 und internem PoB-Vendorpin `29ab8262` geprüft. Kein Pin ist produktiv für Unique-Daten freigegeben; jeder Wechsel verlangt ein neues Audit.

## 5M.1B.0A – gleicher Pin, neue Teilentscheidungen

Die Entscheidung verwendet ausschließlich den unveränderten RePoE-Pin aus 5M.1/5M.1A. Ein Releasevergleich oder Datenimport fand nicht statt. Jeder künftige Import muss je Teilscope Pin, Quelldatei, Feldmenge, Itemkategorie, SHA-256-Manifest, Determinismus und Negativgrenzen erneut nachweisen. Relics bleiben trotz vorhandener Daten `pending`.

## 5M.1A – unveränderter Produktivpin

5M.1A änderte Version `4.5.4.4.4`, Exportcommit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, Parsercommit `14e3edc89ed705bd4e4eda5c8135756431c76e81` und die neun generierten Dateien nicht. Der Audit ermittelte 16.678 rohe Mod-IDs, 3.450 klassenübergreifend referenzierte IDs und 1.597 Referenzen in der festen 29-Klassen-Auswahl; ausgewählte Basistyp-Implicits ergeben die unveränderten 1.828 Records. Ein Releasewechsel muss Klassen, Implicits, Generation Types, Uniques und Socketable-Strukturen melden und manuell freigegeben werden.

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
> 5M.1B-Pin: Export `4.5.4.4.4`/`b3f38149…`, Parser `14e3edc8…`; Wechsel erfordert neue Hashes, Approval und manuelle Freigabe.
> **Lokaler Release-Audit 5M.2.1:** registrierter Clientbuild `4.5.4.53018`; exakter Datenpin ist der Containerhash `a917a56f...a18e28`. Die ItemClass-Ausgabe ist über zwei deutsche Läufe byteidentisch; ein vollständiger Extrakt ist nicht deterministisch bestätigt.
> **Kandidaten-Release-Audit 5M.2.2:** Gegen denselben Containerhash waren zwei PoB2/ooz-Rohextraktionen der fünf Balance-Dateien und 589 CSD-Dateien manifestidentisch. Das belegt nur den Rohzugriff, nicht die strukturierte Lokalisierungsabdeckung. Kein Produktivpin wurde ersetzt; jeder künftige Client-, Schema- oder Parserwechsel benötigt weiterhin einen eigenen Diff, vollständige Strukturtests und manuelle Freigabe.
> **Offline-Parser-Release-Audit 5M.2.3:** Zwei vollständige Parserläufe sind byteidentisch (`c001bcc8…f15f`). Vier Tabellen passen exakt zum Schema; ItemClasses weicht um ein unbekanntes Byte je Zeile ab. Ein neuer Client-, Schema- oder Parserpin darf deshalb nicht automatisch aktiviert werden.
# 5M.2.4 Release-Audit

Der lokale Spielpin 4.5.4.53018/Content-SHA `a917a56f...8a18e28` blieb unverändert. Zwei Referenztabellenextraktionen und zwei Audits waren byteidentisch. Es erfolgte kein Release-, Produktivpin- oder Approval-Wechsel; ein neuer Release verlangt weiterhin eine vollständige erneute Prüfung.

## 5M.2.5 Release-Audit

Zwei Schema-/Enum-Läufe waren byteidentisch (`b9cb4850…5d701c7`). Container-, PoB2-, ooz-, Schema-, Produktiv- und Approval-Pins blieben unverändert; unbekannte Bytes bleiben Releaseblocker.

## 5M.2.6 Release-Audit

Zwei Unique-Extraktionen und Audits waren byteidentisch (`fd9a0418…8759283`). Alle Pins blieben unverändert. Ein neuer Release muss Identitäts-, Basis-, Mod- und Variantenketten vollständig neu prüfen.

## PoB2-Updatevertrag 5M.2.8

Ein neuer PoB2-Stand darf nicht automatisch übernommen werden. Commit, Archiv, 20-Datei-Allowlist, Einzelhashes, Lizenzdatei, Schema, Unique-/Varianten-/Wertediff und Approval müssen erneut geprüft werden. Unbekannte Dateien oder Felder, Herkunftsverlust und Variantenkonflikte brechen ab. Der bisherige technische RePoE-/PyPoE-Pin bleibt unverändert.
