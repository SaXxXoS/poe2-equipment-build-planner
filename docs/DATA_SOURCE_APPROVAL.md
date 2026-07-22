# Verbindliche Datenquellen- und Importfreigabe

## Aufgabe 5M.1B.0A – zusätzliche Itemklassen

Die technische RePoE-Quelle wird nicht pauschal verbreitert. Drei getrennte Scopes sind unter Version `4.5.4.4.4`, Exportcommit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c` und Parsercommit `14e3edc89ed705bd4e4eda5c8135756431c76e81` `conditionally-approved`: normale Jewel-Prefixe/-Suffixe, Charm-Technikdaten und Life-/Mana-Flask-Technikdaten. Der Relic-Scope ist `pending`, da er ausschließlich Sanctum-Spezialcontent betrifft und keine Projektarchitektur besitzt. Alle Bedingungen und Negativgrenzen stehen maschinenlesbar in `data-sources/source-approval.json`.

Approval erlaubt noch keinen Import. Uniques, Cluster-/Radiusmechaniken, corrupted Spezialmods, Runen, Soul Cores, Desecrated/Mutated, Skills, Supports, deutsche Texte, Medien, Rohspiegel, Runtime-Abruf und Hotlinks bleiben gesperrt.

## Aufgabe 5M.0 – eng begrenzte technische Affixdaten

Stand 22. Juli 2026: `repoe-poe2` ist ausschließlich für den Scope `poe2-technical-affix-data-for-build-planner` `conditionally-approved`. Gepinnt sind RePoE-PoE2 `4.5.4.4.4`, Exportcommit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, sowie der geprüfte Parsercommit `14e3edc89ed705bd4e4eda5c8135756431c76e81`.

Dies ist eine bewusste, widerrufbare Projektrisikoentscheidung und keine behauptete GGG-Datenlizenz. RePoEs MIT-Lizenz gilt für Software; sie weist generierte Daten ausdrücklich GGG zu. Erlaubt sind nur normalisierte technische Affixfelder für den Build Planner unter Attribution, SHA-256-Manifest, deterministischem Offlineimport, einfacher Entfernbarkeit und erneuter Prüfung bei jedem Wechsel. Rohdatenspiegel, Medien, andere Datenkategorien und Laufzeitabrufe bleiben ausgeschlossen.

PoE2DB und `display-names` bleiben `blocked`. PoE2DB darf nur manuell als deutsche Darstellungsreferenz geprüft werden; ohne eindeutige technische Zuordnung bleibt ein Text `translation-missing`. Die vollständige Entscheidung steht in `POE2_AFFIX_SOURCE_DECISION.md`.

## Ergänzung 5D.3 – eng begrenzte Exportassets

`official-poe2-passive-tree-export-assets` ist `conditionally-approved`, ausschließlich für Release 0.5.2/Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6` und nur zur Darstellung des zugehörigen offiziellen Passivbaums. Dies ist keine allgemeine Medienlizenz oder rechtliche Garantie. Alle anderen Bilder bleiben blockiert; jeder Releasewechsel verlangt neue Prüfung und Attribution.

## Historische Korrektur aus Aufgabe 5C (20. Juli 2026)

Der offizielle Export `ggg-poe2-skilltree-export` wurde ausschließlich für die gepinnte `data.json` und passive Knoten, Verbindungen, Gruppen, Klassen-/Aszendenzstarts sowie explizite Juwelsockel `conditionally-approved`. Release 0.5.2 ist auf Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6` festgelegt. Attribution, Hash, Offline-Reproduzierbarkeit, manuelle Saisonfreigabe und Asset-Ausschluss sind Pflichtbedingungen. RePoE und PoE2DB waren zu diesem Zeitpunkt blockiert. Die spätere, ausschließlich affixbezogene RePoE-Entscheidung aus 5M.0 steht oben; `data-sources/source-approval.json` ist maßgeblich.

Stand: 20. Juli 2026. Maßgeblich für technische Entscheidungen ist `data-sources/source-approval.json`. Dieses Dokument erklärt die Entscheidung; es ist keine Rechtsberatung.

## Entscheidung

**Historischer 5B/5C-Stand: `blocked`.** Diese Aussage gilt nicht für die später einzeln freigegebenen Baum- und 5M.0-Affixscopes.

Freigegeben sind nur `local-synthetic-fixtures` für Tests. Die offizielle GGG-Entwickler-API ist `conditionally-approved` ausschließlich für konkret dokumentierte Endpunkte und nur nach OAuth-/User-Agent-/Rate-Limit-/Notice-/manueller Freigabeprüfung. Sie liefert keinen vollständigen statischen PoE2-Datensatz und ist keiner derzeit importierbaren Kategorie zugewiesen.

| sourceId | Betreiber/Art | Zugriff/Format | Status | Kerngrund |
|---|---|---|---|---|
| `local-synthetic-fixtures` | Projektintern | TypeScript/In-Memory | `approved` | künstlich, keine echten Spieldaten |
| `ggg-developer-api` | GGG, offiziell | HTTPS/JSON, meist OAuth, dynamische Rate Limits | `conditionally-approved` | nur dokumentierte Endpunkte; Notice, User-Agent, Limits und manuelle Prüfung erforderlich; Speicherung/Weiterverteilung statischer Daten ungeklärt |
| `ggg-poe2-skilltree-export` | GGG, offiziell | ausschließlich gepinnte `data.json` | `conditionally-approved` | nur dokumentierte Baumstruktur/-texte; Attribution, Hash, Offlineimport, manuelle Freigabe und Asset-Ausschluss |
| `repoe-poe2` | Community, inoffiziell | GitHub/hosted JSON, extrahiert aus Spieldateien | damals `blocked`; seit 5M.0 eng `conditionally-approved` | Werkzeuglizenz deckt GGG-Daten nicht; Projektrisikoentscheidung gilt nur für den gepinnten technischen Affixscope |
| `poe2db` | Community, inoffiziell | lokalisierte HTML-Seiten | `blocked` | keine allgemeine Daten-API/Abrufregeln; Wiki-Lizenzumfang für extrahierte Spieltabellen und Medien unklar |
| `ggg-game-files-undocumented-endpoints` | GGG-Inhalte, nicht unterstützt | Clientdateien/interne Endpunkte | `rejected` | offizielle Richtlinien und Terms schließen diese Methode aus |
| `manual-transcription` | manuelle Ableitung | manuell | `pending` | manuell bedeutet nicht rechtefrei; Herkunft, Version und Weiterverteilung offen |

## Historische Quellensteckbriefe vor 5M.0

Die vollständigen maschinenlesbaren Steckbriefe enthalten `sourceId`, Namen, Status, zehn kontrollierte Bedingungen, Pflichtbedingungen, Belege und Begründung. Ergänzend gilt:

- **GGG API:** offizielle Quelle; Betreiber GGG; Dokumentations- und Terms-URLs im Quellenverzeichnis; Authentifizierung meist erforderlich; Rate Limits dynamisch über Antwortheader; Datenqualität für dokumentierte Felder hoch, PoE2-Vollständigkeit niedrig; Stabilität nicht garantiert.
- **GGG Baumexport:** offizielle Quelle; statisches JSON und Medien, keine Authentifizierung; Releases liefern Patchbezug; Datenqualität/Graphvollständigkeit voraussichtlich hoch; Lizenz-, Attribution-, Speicher- und Redistributionsumfang `unknown`.
- **RePoE:** inoffizieller strukturierter Export; JSON/Schemas, keine Authentifizierung für öffentliche Dateien; breite technische Abdeckung; Schemaänderungsrisiko ausdrücklich genannt; GGG-Datenrechte bleiben getrennt von der Werkzeuglizenz.
- **PoE2DB:** inoffizielle HTML-/JavaScript-Weboberfläche; deutsch und weitere Sprachen; keine allgemeine dokumentierte Spieldaten-API, keine belegten Rate Limits; Vollständigkeit und Patchvertrag nicht garantiert; Rechte an Wiki-Text, extrahierten Daten und GGG-Medien sind nicht gleichzusetzen.
- **Medien:** Icons, Bilder und Assets sind separat `blocked`; weder Download noch Hotlinking noch Repository-Speicherung ist freigegeben. Technische Platzhalter bleiben bestehen.

### Identität und technischer Zugriff

| sourceId | Name / Betreiber / Einordnung | Quelle / Dokumentation / Bedingungen | Zugriff / Format / Authentifizierung | Rate Limit / Automation | Patch / Aktualisierung |
|---|---|---|---|---|---|
| `local-synthetic-fixtures` | lokale Fixtures / Projekt / intern | Repository; eigene Testdaten | TypeScript, In-Memory; keine Authentifizierung | kein Netz, nicht anwendbar | `fixture-1`, nur kontrollierte Projektänderung |
| `ggg-developer-api` | PoE Developer API / GGG / offiziell | Developer Docs, Reference und GGG Terms laut Belegregister | HTTPS/JSON; je Ressource OAuth 2.1 oder Servicezugriff | dynamische Header zwingend auswerten; dokumentierter automatisierter API-Zugriff unter Policies | Changelog vorhanden; Endpunkte/Verfügbarkeit nicht garantiert |
| `ggg-poe2-skilltree-export` | PoE2 Skill Tree Export / GGG / offiziell | GGG Data Exports, GitHub-Repository, GGG Terms; keine separate Lizenz gefunden | statische Git-Dateien, JSON und Assets; keine Authentifizierung für öffentliche Ansicht | kein dokumentiertes Abruflimit; Automation nicht ausdrücklich geklärt | GitHub Releases, unregelmäßig/patchebezogen |
| `repoe-poe2` | RePoE PoE2 / repoe-fork / inoffiziell | GitHub, Exportindex, Werkzeuglizenz; GGG-Rechte an Daten ausdrücklich genannt | Git/HTTPS-JSON und Schemas; keine Authentifizierung | GitHub-/Hostingregeln; automatisierte Nutzung der GGG-Daten nicht geklärt | laufende Community-Exporte; Formate können jederzeit wechseln |
| `poe2db` | PoE2DB / Community / inoffiziell | Website/Disclaimer; CC BY-NC-SA nur für Wiki-Inhalt „unless otherwise noted“ | HTML/JavaScript-Seiten; keine allgemeine dokumentierte Spieldaten-API; keine Authentifizierung für Ansicht | keine belegten Rate Limits oder allgemeine Automationsfreigabe | laufende Websitepflege; kein stabiler Releasevertrag |
| `ggg-game-files-undocumented-endpoints` | Clientdaten/interne Endpunkte / GGG-Inhalte / nicht unterstützt | GGG Developer Docs und Terms | Spieldateien/interne Protokolle; potenziell proprietäre Formate | Extraktion, Bots und Reverse Engineering ausgeschlossen | client-/patchabhängig, kein unterstützter Vertrag |
| `manual-transcription` | manuelle Erfassung / Projekt / abgeleitet | sichtbare GGG-Inhalte und Terms | manuell, ohne API/Authentifizierung | kein automatisierter Abruf | hohe Wartungs- und Fehlerlast pro Patch |

### Rechte, Eignung und Entscheidung

| sourceId | Lizenz / Speicherung / Verarbeitung | Rohdaten / Ableitungen / Attribution / kommerziell | Qualität / Vollständigkeit / Stabilität | rechtliche und technische Unsicherheiten | Status / Begründung |
|---|---|---|---|---|---|
| `local-synthetic-fixtures` | projektintern; lokal und im Repository erlaubt | Roh-/Ableitungsverteilung erlaubt; keine externe Attribution; geklärt | kontrolliert, absichtlich unvollständig, stabil | darf nie als echtes PoE2-Wissen erscheinen | `approved` nur für Tests |
| `ggg-developer-api` | GGG Terms/API Policies; Cache-/Repository-Speicherung für diesen Datensatzumfang `unknown` | Roh-/Ableitungsverteilung `unknown`; sichtbarer Third-Party-Notice erforderlich; grundsätzlich persönliche/nichtkommerzielle Terms | hohe Qualität je Endpoint, geringe statische Vollständigkeit, veränderlich | konkrete Scopes, neue App-Registrierung, Speicher-/Redistributionsumfang | `conditionally-approved` nur für dokumentierte Endpunkte und erfüllte Bedingungen; keine Kategorie freigegeben |
| `ggg-poe2-skilltree-export` | öffentlich bereitgestellt, aber ohne separate Lizenz; Speicherung/Verarbeitung/Repository `unknown` | Roh-/Ableitung/Attribution/kommerziell `unknown` | hohe erwartete Baumqualität, vollständiger Baum, releasebasiert | exakter Rechteumfang für JSON und Assets, Abrufpolitik, Lokalisierung | `blocked`, bis schriftliche Erlaubnis vorliegt |
| `repoe-poe2` | Werkzeuglizenz betrifft Code; Datendateien laut README Eigentum GGG; Speicherung `unknown` | Roh-/Ableitung/Attribution/kommerziell nicht belastbar freigegeben | breit und maschinenlesbar; PoE2-Abdeckung je Datei prüfen; Schema instabil | Extraktionsgrundlage, GGG-Rechte, Patchkohärenz, keine Datenlizenz | `blocked` |
| `poe2db` | Wiki-Lizenz nicht sicher auf Tabellen/Spieldaten/Medien übertragbar; Speicherung `unknown` | Roh-/Ableitung/Attribution/kommerziell unklar; CC-Lizenz wäre nichtkommerziell/share-alike | breit und lokalisiert, Vollständigkeit/Übersetzung/Schema nicht garantiert | Betreiber, API, Rate Limit, Daten-/Medienrechte, Versionsvertrag | `blocked` |
| `ggg-game-files-undocumented-endpoints` | keine zulässige Projektmethode; Speicherung/Verarbeitung ausgeschlossen | keine Veröffentlichung; Attribution unerheblich | technisch potenziell breit, aber instabil und nicht unterstützt | Terms verbieten die vorgesehene Methode | `rejected` |
| `manual-transcription` | keine eigene Datenlizenz; Speicherung/Verarbeitung `unknown` | Roh-/Ableitung/Attribution/kommerziell `unknown` | fehleranfällig, unvollständig, schlecht reproduzierbar | manuelle Kopie löst GGG-Rechte und Patchherkunft nicht | `pending` |

## Maschinenlesbare Bedingungen

Jede Quelle führt diese Felder mit `true`, `false` oder `unknown`: `attributionRequired`, `rawRedistributionAllowed`, `derivedRedistributionAllowed`, `automatedAccessAllowed`, `localStorageAllowed`, `repositoryStorageAllowed`, `commercialUseClarified`, `patchVersionRequired`, `rateLimitKnown`, `manualApprovalRequired`. `unknown` ist niemals erfüllt. Bei `conditionally-approved` müssen alle `requiredConditions` durch den späteren Aufrufer ausdrücklich als erfüllt übergeben werden.

## Historische Datenquellenmatrix vor 5M.0

| Kategorie | benötigte Felder | Domäne/Import | Primär / Ersatz | Status | Transformation/Qualität/Version | Speicherung |
|---|---|---|---|---|---|---|
| Klassen | ID, DE/EN-Name, Basiswerte, Version | `ClassDefinition` / `classes` | RePoE / PoE2DB | `blocked` | externe IDs/Namen/Version normalisieren; Vollständigkeit prüfen | `unknown`, offline |
| Aszendenzen | ID, Klasse, Namen, Tags | `AscendancyDefinition` / `ascendancies` | RePoE / PoE2DB | `blocked` | Klassenreferenz und Patchzuordnung | `unknown`, offline |
| Skills | ID, Namen, Tags, Mechaniken, Anforderungen, Waffen | `SkillGemDefinition` / `skills` | RePoE / PoE2DB | `blocked` | Rohschema stark erweitern; hohe Patchabhängigkeit | `unknown`, offline |
| Support Gems | ID, Namen, Tags, Kompatibilität, Kosten | `SupportGemDefinition` / `supports` | RePoE / PoE2DB | `blocked` | Kompatibilitätssemantik fehlt teilweise | `unknown`, offline |
| Skill-/Support-Tags | stabile IDs, Übersetzung, Bedeutung | `MechanicTag` / eingebettet | RePoE / PoE2DB | `blocked` | externe Taxonomie auf kontrollierte Tags abbilden | `unknown`, offline |
| Schadensarten | ID, Name, Semantik | `MechanicTag` / keine Kategorie | manuell / RePoE | `pending` | kleine Taxonomie, aber Herkunftsfreigabe fehlt | `unknown`, offline |
| Waffenarten | ID, Hand, Tags, Kompatibilität | `SyntheticWeaponType` / keine Kategorie | RePoE / PoE2DB | `blocked` | echten Domänentyp/Adapter später ergänzen | `unknown`, offline |
| Itemklassen | ID, Namen, Tags | kein eigener Typ / keine Kategorie | RePoE / PoE2DB | `blocked` | neues Rohschema nötig | `unknown`, offline |
| Equipment-Slots | ID, Name, Set, Hand | `EquipmentSlotDefinition` / keine Kategorie | manuell / RePoE | `pending` | lokale Platzhalter nicht als echte Daten deklarieren | `unknown`, offline |
| Affixe/Affix-Tiers | ID, Gruppe, Tier, Werte, Spawnregeln, Patch | teilweise `ModifierDefinition` / `modifiers` | RePoE / PoE2DB | `blocked` | Gruppen-/Tier-/Spawnmodell fehlt; hohe Patchabhängigkeit | `unknown`, offline |
| Modifier | ID, Stats, Werte, Scope, Slots, Tags | `ModifierDefinition` / `modifiers` | RePoE / PoE2DB | `blocked` | komplexe Stats/Übersetzungen normalisieren | `unknown`, offline |
| Anforderungen | Level, Attribute, Klasse, Waffe | verteilt / eingebettet | RePoE / PoE2DB | `blocked` | einheitlicher Quelladapter nötig | `unknown`, offline |
| Passive Nodes/Connections | ID, Name, Typ, Position, Stats, Kanten, Patch | `PassiveNodeDefinition`, `PassiveConnection` / beide Kategorien | GGG Baumexport / RePoE | `blocked` | technisch direktester Kandidat; Sonderkanten/Lokalisierung prüfen | `unknown`, offline |
| Jewel Sockets | Node-ID, Sockeltyp, Position | Passive-Typ / eingebettet | GGG Baumexport / RePoE | `blocked` | aus Knoten ableiten | `unknown`, offline |
| normale Juwele | ID, Namen, Mods, Regeln | `JewelDefinition` / `jewels` | RePoE / PoE2DB | `blocked` | Generierungsregeln und Anforderungen | `unknown`, offline |
| Cluster-Juwele | Größe, Pools, Knoten, Kosten | `ClusterJewelDefinition` / `clusterJewels` | RePoE / PoE2DB | `blocked` | PoE2-Vollständigkeit und Pfadmodell prüfen | `unknown`, offline |
| Unique-Cluster | Mechanik, Struktur, Restriktionen | `UniqueClusterJewelDefinition` / eigene Kategorie | PoE2DB / RePoE | `blocked` | vollständige Semantik fehlt | `unknown`, offline |
| normale Uniques | ID, Slot, Mods, Anforderungen, Mechaniken | `UniqueItemDefinition` / `uniques` | PoE2DB / RePoE | `blocked` | RePoE nennt nur Namen/Artpfade; Referenzprüfung nötig | `unknown`, offline |
| Anzeigenamen | DE/EN, Provenienz, Patch | `GameDataMetadata` / verteilt | PoE2DB / RePoE | `blocked` | Lokalisierung je Datensatz prüfen | `unknown`, offline |
| Icons/Bilder | Asset-ID, Rechte, Varianten | kein Medienmodell | keine / keine | `blocked` | Platzhalter beibehalten | `false`, kein Abruf |
| Patch/Version | Spielpatch, Release, Importer, Hash | `DataProvenance`, `ImportManifest` | GGG API / Baumexport | `pending` | kategorienübergreifende Versionsbindung fehlt | `unknown`, offline |

Ein Quellenwechsel ist nur zulässig, wenn Ersatzquelle, Rechtsgrundlage, Kategorieumfang, Patch und Attribution neu geprüft sowie `source-approval.json` versioniert aktualisiert werden. Daten mehrerer Quellen dürfen erst nach getrennten Provenienzen und kompatibler Patchbindung gemischt werden.

## Schema-Eignung

Direkt abbildbar sind grundsätzlich technische IDs, Namen, einfache Tags, Zahlenbereiche, Positionen und Referenzen. Umzubenennen/normalisieren sind externe IDs, Stat-/Tagtaxonomien, Itemklassen, lokalisierte Namen und Patchkennungen. Im heutigen Rohschema fehlen insbesondere Itemklassen, Slots, Waffenarten, Affixfamilien/-tiers, Medien, vollständige Skill-/Supportmechaniken und Patchhistorie. Quellenfelder dürfen das Domänenmodell nicht diktieren; ein späterer Adapter muss instabile Pfade/IDs kapseln und stabile interne IDs erzeugen.

## Import-Gate

`src/import/approval.ts` validiert Schema und kontrollierte Werte und liefert mit `evaluateImportApproval` eine reine deterministische Entscheidung. Fehlende/ungültige Datei, unbekannte Quelle/Kategorie sowie `pending`, `blocked`, `rejected`, falsche Zuordnung oder unerfüllte Bedingungen blockieren. `approved` erlaubt; `conditionally-approved` erlaubt nur nach explizit erfüllten Pflichtbedingungen. Der Guard liest keine Datei und kein Netzwerk; ein späterer Importer muss die eingecheckte Datei laden und vor jedem echten Abruf prüfen. Synthetische Fixture-Importe bleiben durch `fixture: true` unabhängig erlaubt.

## Entscheidung zu Aufgabe 5C

Es wird **keine echte Importaufgabe** empfohlen. Nächster Schritt ist eine externe, schriftliche Rechteklärung – bevorzugt zuerst für den offiziellen GGG-Passivbaumexport ohne Assets – zu automatisiertem Release-Abruf, lokaler Speicherung, normalisierten Ableitungen, öffentlicher Repository-/Pages-Weiterverteilung, Attribution und kommerzieller Einordnung. Erst bei positiver dokumentierter Antwort wäre Aufgabe 5C eng auf `passive-nodes`, `passive-connections` und `jewel-sockets` eines fest gepinnten Releases zu begrenzen.

Priorität nach Freigabe: (1) offizieller Passivbaum ohne Medien, (2) Klassen/Aszendenzen, (3) Skills/Supports/Tags, (4) Itemklassen/Waffen/Slots, (5) Modifier/Affixe/Tiers/Anforderungen, (6) Juwele/Uniques, (7) lokalisierte Namen, (8) Medien zuletzt und nur separat freigegeben.
# 5M.1-Umsetzung

Der Scope `poe2-technical-affix-data-for-build-planner` wird seit 5M.1 ausschließlich für die minimierten, manifestierten Ausgaben unter `generated/poe2-affixes/` genutzt. Die Entscheidung bleibt `conditionally-approved`; sie umfasst weder Rohspiegel noch Medien, PoE2DB, Skills, Supports, Uniques oder deutsche Display-Namen.
