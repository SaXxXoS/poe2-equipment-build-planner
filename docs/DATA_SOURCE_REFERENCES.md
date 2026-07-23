# Quellenverzeichnis zur Datenfreigabe

## 5M.2.8B – Entscheidungsprovenienz

Die in 5M.2.8A geprüften PoB2- und GGG-Primärquellen bleiben maßgeblich für
die offengelegte Unsicherheit. Neu ist ausschließlich die interne
Auftraggeberentscheidung; sie ist keine neue externe Quelle. Beide
Anfrageentwürfe sind `not-pursued`, nicht versendet und ohne Antwort.

## Historischer Stand 5M.2.8A – primäre Distributionsbelege

- PoB2, exakter Pin:
  `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- PoB2 `LICENSE.md`, `README.md`, `CONTRIBUTING.md`, Dateiköpfe der 20
  `src/Data/Uniques/*.lua` und pfadbezogene Git-Historie
- GGG Terms of Use:
  <https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy>
- GGG Developer Documentation:
  <https://www.pathofexile.com/developer/docs>

Abrufdatum der Webquellen: 23. Juli 2026. Die Quellen belegen weder eine
ausdrückliche MIT-Datenlizenz noch eine GGG-Distributionszustimmung; Status
führte damals zu `distribution-pending-both`. Die Beleglage bleibt
unverändert, während 5M.2.8B den technischen Projektstatus neu setzt.

## 5M.2.7 – Unique-Quellenkandidaten

Am 2026-07-23 wurden die offiziellen GGG Developer Docs einschließlich API-Referenz, Changelog und Terms, der offizielle Passivbaumexport, `repoe-fork/poe2@1a6066ec…`, RePoE-Parser `14e3edc…`, `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccd…`, `HivemindOverlord/poe2-mcp@163c30a9…`, PoBR und das Communityinventar geprüft. Wikis/PoE2DB/Trade blieben Kandidaten ohne Datenübernahme. Details: `POE2_UNIQUE_SOURCE_CANDIDATE_DECISION.md`.

## Auditquellen 5M.2.0

- RePoE-PoE2 `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`: englischer Export mit leerem `German`-Feld.
- RePoE-Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81`: `de_DE.utf8`, StatDescriptions, BaseItems und ItemClasses; MIT-Code, keine automatische Spieldatenlizenz.
- PoB2 `f5b94342eeea413a94c339af3e881c5e2a4df0df`, poe2-mcp `163c30a9fd45f815d330cc54e6ab51a797693d31`, PoBR `ff1d07da2a2b38959e34eea077d842d222f631b4`: nur Audit-/Kontrollquellen.
- GGG Developer Docs/API Reference/Terms wurden offiziell geprüft. PoE2DB wurde nicht automatisiert abgerufen.

## 5M.1B.0C Socketable-/Spezialmod-Audit

- Primär: `repoe-fork/poe2@b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, Version `4.5.4.4.4`, insbesondere `data/augments.json`.
- Parser: `repoe-fork/repoe@14e3edc89ed705bd4e4eda5c8135756431c76e81`, insbesondere `repoe/parser/poe2/augments.py`.
- Kontrollen: `PathOfBuildingCommunity/PathOfBuilding-PoE2@f5b94342eeea413a94c339af3e881c5e2a4df0df` und `HivemindOverlord/poe2-mcp@163c30a9fd45f815d330cc54e6ab51a797693d31`/`data-v0.5.0-r12`.
- PoE2DB wurde nicht abgerufen. Vollständige Pins, Hashes und Feldabdeckung: `docs/audits/poe2-socketable-special-mod-source-comparison.json`.

## Quellenentscheidung 5M.1B.0B

- RePoE-PoE2 `repoe-fork/poe2@b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, Version 4.5.4.4.4; Parser `repoe-fork/repoe@14e3edc89ed705bd4e4eda5c8135756431c76e81`.
- PoB2 `PathOfBuildingCommunity/PathOfBuilding-PoE2@f5b94342eeea413a94c339af3e881c5e2a4df0df` (`dev`); historisches PoB2-v2 `7e047f0e86c5539b6fe983606c209066c3569083`.
- poe2-mcp `HivemindOverlord/poe2-mcp@163c30a9fd45f815d330cc54e6ab51a797693d31`.
- PoBR `ackness/pobr@ff1d07da2a2b38959e34eea077d842d222f631b4`, derivative PoB-Kontrollquelle.
- Entscheidung: `docs/POE2_UNIQUE_ITEM_SOURCE_DECISION.md`; maschinenlesbar: `docs/audits/poe2-unique-source-comparison.json`.
- PoE2DB blieb manuelle Referenz; kein Abruf, Scraping oder Import.

## Quellenentscheidung 5M.1B.0A

Hauptquelle bleibt ausschließlich der bestehende RePoE-Pin `repoe-fork/poe2@b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`/Version `4.5.4.4.4`; Parserbeleg `repoe-fork/repoe@14e3edc89ed705bd4e4eda5c8135756431c76e81`. Verwendbar sind nur `version.txt`, `mods.json`, `mods_by_base.json`, `base_items.json`, `item_classes.json` und `tags.json` mit den scopebezogenen Feldern. Path of Building PoE2 und poe2-mcp bleiben reine Kontrollquellen. Keine neue produktive Quelle wurde hinzugefügt.

## Auditkontrollen 5M.1A (keine Produktivquellen)

- Path of Building PoE2: `dev@f5b94342eeea413a94c339af3e881c5e2a4df0df`; historische v2: `dev@7e047f0e86c5539b6fe983606c209066c3569083`.
- poe2-mcp: `main@163c30a9fd45f815d330cc54e6ab51a797693d31`.
- poe2-tools Build Planner: `master@a173f7b0d398951693fee83ee5ee40f327d4a749`.
- GitHub-Topic `path-of-exile-2`: 51 Repositories, Snapshot 22.07.2026; Commits und Relevanzklassen stehen in `docs/audits/poe2-community-source-inventory.json`.

Diese Quellen wurden nur strukturell verglichen. Code-Lizenzen gewähren keine Rechte an GGG-abgeleiteten Spieldaten. Es wurden keine Dateien, sichtbaren Texte oder Parserteile übernommen.

## Ergänzung Aufgabe 5M.0 (22. Juli 2026)

- RePoE-PoE2-Export: <https://github.com/repoe-fork/poe2/tree/b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c>, Version `4.5.4.4.4`
- RePoE-Parser und Schema: <https://github.com/repoe-fork/repoe/tree/14e3edc89ed705bd4e4eda5c8135756431c76e81>
- RePoE-Lizenztrennung: <https://github.com/repoe-fork/repoe/blob/14e3edc89ed705bd4e4eda5c8135756431c76e81/LICENSE.md>
- Aktuelles Path of Building PoE2: <https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2/tree/f5b94342eeea413a94c339af3e881c5e2a4df0df>; geprüfter Release `v0.22.0`
- Archiviertes PoB-PoE2-v2: <https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2-v2/tree/7e047f0e86c5539b6fe983606c209066c3569083>
- Offizielle GGG-Exportgrenze: <https://www.pathofexile.com/developer/docs/data>
- GGG-Nutzungsbedingungen: <https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy>
- PoE2DB-Disclaimer: <https://poe2db.tw/de/General_disclaimer>

Der RePoE-Fork extrahiert mit PyPoE aus GGG-Spieldateien. `mods.json`, `mods_by_base.json`, `base_items.json`, `item_classes.json`, `tags.json` und Statbeschreibungen sind technisch geeignet, aber nicht durch die MIT-Codelizenz als frei weiterverteilbare GGG-Daten ausgewiesen. Path of Building enthält eine breite, laufzeitspezifische Lua-Aufbereitung und dient nur als möglicher Auditvergleich. PoE2DB bleibt eine manuelle deutsche Referenz ohne Daten-, Code-, HTML-, CSS-, Asset- oder API-Übernahme.

Die eng begrenzte Projektrisikoentscheidung, Ausschlüsse und Updatebedingungen stehen in `POE2_AFFIX_SOURCE_DECISION.md`. Es wurden in 5M.0 keine Affixdatendateien abgerufen oder importiert.

## Ergänzung 5D.3

Assetquelle: offizielles GGG-Repository <https://github.com/grindinggear/poe2-skilltree-export>, Release 0.5.2, Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6`. Visuelle Referenz: <https://pathofexile2.com/game/passive-skill-tree>. Approval-Umfang und rechtliche Begrenzung stehen in `POE2_TREE_ASSETS.md`.

## Ergänzung Aufgabe 5C

- Offizielles Repository: <https://github.com/grindinggear/poe2-skilltree-export>
- Release 0.5.2 „Path of Exile 2: Runes of Aldur“: <https://github.com/grindinggear/poe2-skilltree-export/releases/tag/0.5.2>
- Geprüfter Commit: <https://github.com/grindinggear/poe2-skilltree-export/commit/1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6>
- Offizielle GGG-Datendokumentation: <https://www.pathofexile.com/developer/docs/data>

Am 20. Juli 2026 wurden Tag und Commit über die GitHub-API verifiziert und nur die commit-gepinnte `data.json` abgerufen. SHA-256: `f83c94ce7b09f2bfc5b3b1d63523c2ab3d2582d0e964f6aeec34b8b0390abcfe`. Das Schema enthält englische Texte und Grafikreferenzen, aber keine Locale-Auswahl oder eindeutig markierten Cluster-Sockel. Grafikreferenzen werden nicht exportiert.

Prüfdatum: 20. Juli 2026. Kurzzusammenfassungen, keine Vollkopien. Abruf diente ausschließlich der Dokumentationsprüfung; es wurden keine Spieldatensätze, Medien oder API-Nutzdaten geladen. Dies ist keine Rechtsberatung.

| Quelle | Betreiber | Dokument/URL | Geprüfte Frage | Ergebnis und Grenze |
|---|---|---|---|---|
| Path of Exile Developer Docs | Grinding Gear Games (GGG) | [Overview](https://www.pathofexile.com/developer/docs) | unterstützte Ressourcen, Automatisierung, User-Agent, Notice, Stabilität, Rate Limits | Nur Referenz-/Export-Ressourcen werden unterstützt; API-Nutzung verlangt identifizierbaren User-Agent, dynamische Rate-Limit-Auswertung und bei öffentlichen Apps einen Nichtzugehörigkeitshinweis. Neue Anwendungen werden laut Seite aktuell nicht bearbeitet. Keine pauschale statische Datennutzung. |
| API Reference | GGG | [Reference](https://www.pathofexile.com/developer/docs/reference) | PoE2-Abdeckung, Formate, Authentifizierung | Dokumentierte HTTPS-/JSON-Endpunkte, häufig OAuth; PoE2-Unterstützung ist begrenzt und deckt die benötigten statischen Kategorien nicht vollständig ab. |
| Authorization | GGG | [OAuth 2.1](https://www.pathofexile.com/developer/docs/authorization) | Authentifizierung und Clientarten | Fast alle APIs benötigen Autorisierung; öffentliche und vertrauliche Clients haben unterschiedliche Möglichkeiten und Laufzeiten. Keine Importfreigabe für statische Spieldaten. |
| Data Exports | GGG | [PoE2 Data Exports](https://www.pathofexile.com/developer/docs/data) | offizielle statische PoE2-Daten | GGG erklärt den Passivbaum ausdrücklich zur einzigen Ausnahme außerhalb unterstützter APIs. Das belegt Bereitstellung, aber nicht eindeutig öffentliche Weiterverteilung. |
| Terms of Use | GGG | [Terms](https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy) | Rechte, Speicherung, Automatisierung, Extraktion, kommerzielle Nutzung | GGG beansprucht Rechte an Texten, Namen, Bildern und Spielelementen; Lizenz ist grundsätzlich persönlich/nichtkommerziell. Ohne vorherige schriftliche Zustimmung sind u. a. Speicherung/Verbreitung außerhalb der Lizenz, automatisierte Software, Extraktionswerkzeuge und Reverse Engineering beschränkt. Konkrete dokumentierte APIs/Exporte sind zusätzlich nach ihren Richtlinien zu beurteilen. |
| PoE2 Passive Skill Tree Export | GGG | [Repository](https://github.com/grindinggear/poe2-skilltree-export) | Format, Versionen, Lizenz, Medien | Öffentliches `data.json`, Assets und Releases; keine separate LICENSE-Datei oder ausdrückliche Repository-Weiterverteilungserlaubnis sichtbar. Daten und Medien bleiben für dieses öffentliche Repository blockiert. |
| RePoE | repoe-fork, Community | [Repository](https://github.com/repoe-fork/repoe) | Abdeckung, Format, Stabilität, Eigentum | JSON für Stats, Mods, Gems, Basistypen, Tags, Klassen, Cluster und eingeschränkte Uniques; Formate können jederzeit wechseln. README nennt GGG als Rechteinhaber sämtlicher Datendateien. Werkzeuglizenz ist keine Datenlizenz. |
| RePoE hosted exports | repoe-fork, Community | [Exportindex](https://repoe-fork.github.io/) | PoE2-Verfügbarkeit und Zugriff | Öffentliche PoE2-JSON-Exporte und Schemas sind technisch gut maschinenlesbar; sie werden aus Spieldateien erzeugt. Abrufbarkeit ersetzt keine GGG-Nutzungs-/Weiterverteilungsfreigabe. |
| PoE2DB | Community/PoE2DB | [Startseite](https://poe2db.tw/), [Disclaimer](https://poe2db.tw/pt/General_disclaimer) | Lokalisierung, Lizenz, Rechte, Scraping/API | Breite lokalisierte HTML-Daten. Wiki-Inhalte stehen „unless otherwise noted“ unter CC BY-NC-SA 3.0; dieselbe Seite erkennt GGG-Rechte an Spielegrafiken, Texten und Spielelementen an. Umfang für extrahierte Tabellen, automatisierten Abruf, Roh-/Ableitungsdaten und Medien ist nicht eindeutig. |
| GitHub-Lizenzhinweis | GitHub | [Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) | Bedeutung fehlender Repository-Lizenz | Ein öffentliches Repository erlaubt Betrachten/Forken, ist ohne Lizenz aber nicht automatisch frei nutz-, änder- oder verteilbar. Dient nur als Interpretationshilfe für den fehlenden Lizenztext des GGG-Exports. |

## Erforderliche externe Klärung

Vor einem echten Import wird eine schriftliche, quellen- und kategorienbezogene Bestätigung benötigt, die mindestens automatisierten Abruf, lokale Speicherung, normalisierte/abgeleitete Speicherung, Veröffentlichung im öffentlichen Repository/Pages-Artefakt, Attribution, kommerzielle Einordnung und Mediennutzung beantwortet. Für GGG ist der in den Terms genannte Supportkanal der naheliegende Klärungsweg; dieses Projekt hat keine Anfrage versendet.
# RePoE-Affiximport 5M.1

Produktiver technischer Pin: `repoe-fork/poe2` Version `4.5.4.4.4`, Commit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`; Parserreferenz `repoe-fork/repoe` Commit `14e3edc89ed705bd4e4eda5c8135756431c76e81`. Einzeldateien und SHA-256 sind im lokalen `generated/poe2-affixes/affix-source-manifest.json` festgehalten.
> 5M.1B: genaue Eingabe-/Ausgabehashes in `generated/poe2-items/additional-item-source-manifest.json`, Erläuterung in `POE2_ADDITIONAL_ITEM_CLASS_TECHNICAL_IMPORT.md`.
> **Lokale Auditquelle 5M.2.1:** GGG-Standalone-Client `4.5.4.53018`, anonymisiert als `<POE2_INSTALLATION>`, `Content.ggpk` SHA-256 `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`; RePoE-Parsercommit `14e3edc89ed705bd4e4eda5c8135756431c76e81`. Keine Rohtexte sind Referenzdateien im Repository.
> **Lokaler Kandidatenaudit 5M.2.2:** Derselbe Containerpin wurde mit RePoE/PyPoE `14e3ed…`/`c30ad8…`, PoB2 `c5300c…` plus ooz 0.2.4 und poe2-mcp `163c30…` geprüft. Vorbereitung durfte gepinnte Repositories/Artefakte laden; Extraktionsläufe waren offline. Keine Trade-API, kein PoE2DB, keine Rohtexte oder Kandidatenrepositories sind Produktreferenzen. Vollständige Pins: [Kandidatenaudit](POE2_GERMAN_PARSER_CANDIDATE_AUDIT.md).
> **Lokaler Offline-Parser 5M.2.3:** Eingaben bleiben ausschließlich der Containerpin `a917…e28`, PoB2 `c5300c…`, `spec.lua` `268ae3…d30`, ooz 0.2.4 sowie die beiden bekannten Rohmanifeste. Parserausgaben mit Volltext bleiben lokal; nur bereinigte Zahlen und Hashes sind Referenzen. [Parserbericht](POE2_OFFLINE_ITEM_AUDIT_PARSER.md).
# Lokaler Audit 5M.2.4

Auditquelle bleibt ausschließlich die lokal legal vorhandene, gepinnte Content.ggpk. Technische Werkzeuge: PoB2 `c5300ccd`, ooz `0.2.4`, Schema-SHA `268ae3a3`. Das 22-Dateien-Referenzmanifest `a4bbcd99...e971353` ist keine Produkt- oder Distributionsquelle.

## Lokaler Audit 5M.2.5

Belegquellen sind ausschließlich die gepinnten PoB2-Dateien `spec.lua`, `Scripts/enums.lua`, `mods.lua` und `soulcores.lua`. Sie sind Schema-/Codebelege, keine neue Produkt- oder Textquelle.

## Lokaler Audit 5M.2.6

Unique-Referenzen stammen ausschließlich aus 25 lokal aus demselben Content-Pin extrahierten DATC64-Dateien, Manifest `c4fdc6fe…972752c`. Sie sind Auditbelege, keine freigegebene Produkt- oder Distributionsquelle.

## PoB2-Unique-Planerdaten 5M.2.8

Neue getrennte Referenz: `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`. Der minimale spätere Dateiscope umfasst 20 statische `src/Data/Uniques/*.lua`-Dateien mit SHA-256-Manifest. `Special/Generated.lua`, leere Kategorien, Medien, Runtime und Gesamt-Datenbank sind ausgeschlossen. Die MIT-Codelizenz ist belegt; die Verteilungsrechte der mitgelieferten Itemdaten bleiben unbekannt/pending.
