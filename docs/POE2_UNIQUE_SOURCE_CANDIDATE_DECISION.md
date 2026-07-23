# PoE2 Unique source candidate decision (5M.2.7)

> **5M.2.8A-Update:** PoB2 bleibt der vom Auftraggeber ausgewählte,
> quellengetrennte Unique-Planerdatensatz. Das ist keine Aussage über
> technische GGG-IDs und keine Distributionsfreigabe. Wegen ungeklärter
> PoB2-Datenlizenz und fehlender GGG-Zustimmung gilt
> `distribution-pending-both`; es wurden keine Daten importiert.

## Ziel, Priorität und Ergebnis

Diese Aufgabe prüft ausschließlich Quellen für die in 5M.2.6 fehlende Kette
`Unique-ID → BaseItemType-ID → Itemklasse → Version/Variante → Mod-ID oder direkte Statdefinition → Stat-IDs → strukturierte Werte → CSD`.
Der Auftraggeber priorisiert diese Klärung vor regulärer deutscher Produktlokalisierung, OCR/Fotoerkennung, Socketables, 5M.2 und 5N.

**Entscheidung:** Es wurde **keine technisch geeignete Unique-Quelle** gefunden. RePoE liefert getrennte Stash-/Words-Identitätsfragmente und technische Mods, Path of Building 2 sichtbare Itemblöcke und PoB-eigene Varianten, poe2-mcp allgemeine Mod-/Schemastrukturen. Keine Quelle und keine technisch zulässige Kombination verbindet diese Ebenen durch einen stabilen Unique-Schlüssel. Eine Approval-Aufgabe wäre deshalb verfrüht.

Ausgangscommit: `7b90dd2375e4a32cf6d3ff1a5740c78788b33f7f`. Auditdatum: 2026-07-23.

## Grenzen und Beweisregeln

Der Audit importiert keine Daten, verändert keine Produktdatei, ersetzt keinen Pin und erweitert kein Approval. Vollständige Kandidatendaten liegen nur unter `.local-audits/poe2-unique-source-candidates/`.

Als technische Belege zählen stabile IDs, gepinnte Schemata, Fremdschlüssel, strukturierte Werte und deterministische Exporte. Nicht ausreichend sind Displaynamen, URL-Slugs, Wiki-Titel, Stashpositionen, Bildnamen, Basenamen und aus Text gelesene Zahlen. `Unbekannt` bleibt erhalten, wenn eine Beziehung nicht unabhängig nachgewiesen werden kann.

## Mindestanforderungen

Eine spätere Quelle muss mindestens liefern:

1. einen sprachunabhängigen stabilen Unique-Schlüssel;
2. eine direkte BaseItemType-/Metadata-ID und technische Itemklasse;
3. direkte Mod-IDs oder direkte technische Statdefinitionen;
4. geordnete Stat-IDs sowie feste, variable und mehrwertige strukturierte Werte;
5. Bedingungen, Varianten und Versionsbeziehungen;
6. eine exakte Verbindung zu lokal bestätigten Stat-IDs/CSD-Strukturen;
7. Patch-, Commit-, Parser- und Schemapins, deterministische Sortierung und Hashmanifest;
8. geklärte Feldherkunft, Attribution und eine separate Distributionsentscheidung.

## Offizielle GGG-Quellen

Die GGG Developer Documentation wurde einschließlich API-Referenz, Richtlinien, Changelog und Terms geprüft. Sie dokumentiert aktuell nur begrenzte PoE2-Ressourcen und keinen versionierten Offline-Export für Unique-Definitionen. Account-/Character-Itemantworten sind Instanzdaten; sie bilden keinen vollständigen Definitionsbestand mit stabiler Item-zu-Mod-/Stat-ID-Kette. Nicht dokumentierte Endpunkte bleiben ausgeschlossen.

Die Trade-Seite beziehungsweise Trade-API wurde nur als Kandidat klassifiziert und **nicht aufgerufen**. Sie wäre laufzeitnetzabhängig, liefert primär Such-/Listingdaten und ist ohne separate ausdrückliche Freigabe ausgeschlossen. Sichtbare Affixe oder Filter-IDs ersetzen keine Spiel-Mod-/Stat-IDs.

Der offizielle `grindinggear/poe2-skilltree-export` ist reproduzierbar, enthält aber keine Unique-Itemdaten. Weitere offizielle statische Unique-Downloads, Datenexporte oder offizielle GitHub-Repositories mit der benötigten Kette wurden nicht gefunden. Die lokale Clientquelle bleibt der in 5M.2.6 gepinnte `Content.ggpk`; dort ist die vollständige Kette nachweislich nicht materialisiert.

## Kandidateninventar

| Kandidat | Typ | Pin/Stand | Ergebnis |
|---|---|---|---|
| GGG Developer API | offiziell | Dokumentation 2026-07-23 | kein Unique-Definitionsexport, Laufzeitnetz |
| GGG Trade | offiziell, nur Kandidat | nicht aufgerufen | Listing/Text, kein Offlinevertrag |
| GGG Passivbaumexport | offiziell statisch | `1e9eb2d…` | fachlich nicht einschlägig |
| lokaler Client | offiziell lokal | GGPK `a917a56f…` | Teilfragmente, keine Itemkette |
| RePoE-PoE2 | Communityexport | `1a6066ec…` | vertieft; technisch teilweise |
| Path of Building 2 | Communityplaner | `c5300ccd…` | vertieft; Text-/PoB-Semantik |
| poe2-mcp | Communityextraktor | `163c30a9…` | vertieft; Mods, keine Unique-Items |
| PoBR | derivativer Export | `ff1d07da…` | PoB-Ableitung, nicht unabhängig |
| poe2-tools build planner | Communityplaner | `a173f7b0…` | freie Itemtexte/derivative Quellen |
| PoE2 Community Wiki | Wiki | Kandidatenprüfung | kein geprüfter ID-basierter Offlineexport |
| PoE2DB | Drittwebsite | nicht verwendet | blockiert, Herkunft/Distribution ungeklärt |

Wikis und Webseiten wurden ausschließlich als Kandidaten bewertet. Es gab kein Scraping, keine HTML-/API-Datenübernahme und keinen Hotlink.

## Vertiefter Kandidat 1: aktueller RePoE-PoE2-Export

Repository: `repoe-fork/poe2`, Auditpin `1a6066ec60d24af274cb7a87d00b6ab1c0975ebd`. Archiv-SHA-256: `b0d631c987ce3ba388dd6e06fd82162eb02bd6f452b3a8c40f3c8df16f65f21a`. Der Produktivpin bleibt `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`; Parserpin bleibt `14e3edc89ed705bd4e4eda5c8135756431c76e81`.

Der aktuelle Export enthält 449 `uniques.json`-Zeilen, 5.246 Basistypen, 16.678 Mods und 117 Itemklassen. Die Unique-Felder bleiben `id`, Anzeige-/Inventarfelder, `item_class`, `visual_identity`, `renamed_version` und `base_version`. `id` ist weiterhin der sichtbare Words-Schlüssel. Es existiert keine BaseItemType-/Metadata-ID, Modreferenz, Statdefinition oder technische Variantenkette. Der neue Commit änderte Datei-Hashes, aber nicht diese Blocker.

| Datei | SHA-256 |
|---|---|
| `data/uniques.json` | `5c303e991763d4f89c7e41306561c1eb02bb55d79ebe0c26f43520906f9c059b` |
| `data/mods.json` | `e4cfac6ebb1f1a86ea3e6465bab79b6e8a2bb39a317bd9ffe8ba5cc99befa2b1` |
| `data/base_items.json` | `acb63728684a57d61e99ac2e919833fcf3199e9ca185770d57a0df568e60266c` |
| `data/item_classes.json` | `eec6f2a4c3b53a26f6979a26e57c9ab7644f26b914e57c4d3a9f9768a1aed723` |

RePoE ist `technically-partial`, `audit-only`, `license-pending` und `distribution-pending`.

## Vertiefter Kandidat 2: Path of Building 2

Repository/Pin: `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`; `dev` entsprach am Auditdatum diesem Commit. Der Bestand enthält 33 Unique-Quelldateien. Frühere reproduzierbare Zählung: 435 statische Blöcke, 579 Variantendeklarationen und 2.704 sichtbare Modzeilen.

PoB2 ist die reichste sichtbare Kontrollquelle: historische Varianten, Rollnotation, Implicits und Mechaniksonderfälle sind modelliert. Es fehlen jedoch technische Unique-, Base-, Mod- und Stat-IDs. Modwerte werden aus sichtbaren Zeilen geparst und in PoB-interne Semantik überführt. `Special/Generated.lua` erzeugt zudem kombinatorische und QoL-Testvarianten; diese sind keine Spiel-Varianten-IDs.

Der Code steht unter MIT. Die Unique-Dateien kennzeichnen Itemdaten als GGG-Inhalt. Das ist keine allgemeine Daten- oder Distributionslizenz. PoB2 ist `technically-partial`, `requires-text-matching`, `audit-only`, `license-pending` und `distribution-pending`.

## Vertiefter Kandidat 3: poe2-mcp

Repository/Pin: `HivemindOverlord/poe2-mcp@163c30a9fd45f815d330cc54e6ab51a797693d31`, Datenstand `data-v0.5.0-r12`; Remote-HEAD war unverändert. Der frühere Audit weist 16.788 allgemeine Mods und 1.019 Schemafingerprints aus.

Der Kandidat ist eine Mod-/Schema-Kontrolle, besitzt aber keine Unique-Itemtabelle, Unique-ID, Base-/Itembeziehung oder Varianten. Allgemeine Mod-/Stat-IDs können keinem Unique-Gegenstand zugeordnet werden. Ergebnis: `technically-unsuitable`, `audit-only`, Lizenz/Distribution ungeklärt.

## Ausgeschlossene Kandidaten

- PoBR ist ein nachvollziehbarer, aber derivativer PoB-Export; ihm fehlen dieselben Spiel-IDs.
- `poe2-tools/poe2-build-planner` nutzt freie Itemtexte beziehungsweise derivative Daten.
- Community-Wikis bieten sichtbare Inhalte, aber kein nachgewiesenes gepinntes Offlinepaket mit stabilen Spiel-IDs.
- PoE2DB ist blockiert und wurde nicht als Datenquelle verwendet.
- Preis-/Tradeprojekte liefern Instanzen, Namen und Preise, nicht den vollständigen Definitionsbestand.
- Filter-, Clipboard- und OCR-Projekte identifizieren sichtbare Texte, nicht technische Korpusidentität.

## Lokaler ID-, Werte- und Lokalisierungsabgleich

5M.2.6 bestätigt lokal 449 Stashfragmente, aber null technische Itemidentitäten, Base- oder Itemklassenreferenzen. 311 Chest-/Mutations-Modreferenzen verbinden 265 Mods mit 278 strukturierten Statzeilen und je 261 deutschen/englischen CSD-Zeilen; sie sind keine Item-Unique-Affixe.

- RePoE: allgemeine Mods/BaseItems sind vergleichbar, aber aus Unique-Zeilen nicht erreichbar.
- PoB2: Basenamen, Affixtexte und Rolls wären nur über verbotene Namens-/Textjoins vergleichbar.
- poe2-mcp: allgemeine Mod-/Statwerte sind vorhanden, aber kein Unique-Schlüssel startet die Kette.

Basistyp-, Mod-, Stat-ID- und Werteparität je Unique sind daher **nicht bestimmbar**, nicht null. Deutsche CSD-Verbindbarkeit und Renderbarkeit bleiben nicht bestimmbar.

## Varianten, Implicits, Skills und Supports

PoB2 beschreibt diese Bereiche sichtbar und PoB-intern, RePoE hat nicht verbindende Versionsfelder und poe2-mcp keine Unique-Itemschicht. Aktuelle/Legacy-, Mutated-, Vaal-/Corruption-, Roll- und Modvarianten sind nicht durch stabile technische Varianten-IDs verbunden. Dasselbe gilt für Unique-Implicits und Spezialeffekte.

PoB2 kann sichtbare Granted-Skill-/Supportsemantik darstellen; lokale 65 `ModGrantedSkills`-Referenzen sind nicht item-Unique-verknüpft. Eine Unique-linked Skill-/Support-ID-Kette wurde nicht nachgewiesen.

## Kombinations- und Provenienzmodell

Drei Kombinationen wurden verworfen:

1. RePoE-Identity plus lokale Mods: Unique→Base/Mod-Fremdschlüssel fehlt.
2. PoB2-Identity/Varianten plus lokale CSD: der Join wäre Name/Text/Range-basiert.
3. poe2-mcp-Mods plus lokaler Client: beiden fehlt die Itemidentitätskante.

Ein zulässiges Modell muss je Feld `sourceIdentity`, `sourceBaseReference`, `sourceModReference`, `sourceStats`, `sourceValues`, `sourceVariant` und `sourceLocalization` führen. Aktuell erfüllen null Kombinationen diese Anforderung.

## Lizenzen, Herkunft und Distribution

Code- und Datenlizenz wurden getrennt. MIT der Parser-/Planerprojekte deckt deren Software ab; daraus wird keine Lizenz für GGG-Spieltexte oder exportierte Spieldaten abgeleitet. Die GGG API-Bedingungen geben keinen hier gefundenen Unique-Definitionsdump zur Repository- oder Web-App-Verteilung frei.

Lokaler Audit ist von Repositoryspeicherung, Buildverarbeitung, Web-App-Verteilung, Runtime-Laden und öffentlicher Bereitstellung getrennt. Der Distributionsstatus bleibt `pending` beziehungsweise `legal-status-unknown`. Dies ist keine Rechtsberatung.

## Update-, Determinismus- und Ausfallvertrag

Ein späterer Import müsste Quelle, Parser, Schema und Patch fest pinnen, deterministisch sortieren, Hashmanifest und Coverage-Diff erzeugen sowie neue, gelöschte und geänderte Uniques/Varianten separat melden. Identitätsverlust, Variantenkonflikt oder Teilaktualisierung müssen abbrechen. `latest`, stiller Fallback, Runtime-Scraping und Hotlinks bleiben verboten.

RePoE wurde als commitgenaues Archiv gehasht; PoB2 und poe2-mcp hatten gegenüber den lokalen Pins keine Remote-HEAD-Änderung. Determinismus heilt keine fehlende technische Beziehung.

## Bewertung

| Kriterium | RePoE aktuell | PoB2 | poe2-mcp |
|---|---|---|---|
| stabiler technischer Unique-Schlüssel | nein | nein | nein |
| BaseItemType-ID | nicht Unique-verknüpft | sichtbarer Name | nein |
| Itemklassen-ID | nein | nein | nein |
| Mod-/direkte Statreferenz | nein | Textparser | nein |
| Stat-IDs | allgemeine Mods | nein | allgemeine Mods |
| strukturierte Werte | allgemeine Mods | Textnotation | allgemeine Mods |
| Versionen/Varianten | keine belastbare Kette | PoB-lokal | nein |
| Granted Skills/Supports | nicht itemverknüpft | PoB-Semantik | nein |
| lokale deutsche CSD-Verbindung | nicht erreichbar | nicht erreichbar | nicht erreichbar |
| Offline-Audit | ja | ja | ja |
| Laufzeitnetz nötig | nein | nein | nein |
| Datenverteilung | pending | pending | pending |
| Gesamturteil | technisch teilweise | teilweise/Textmatching | ungeeignet |

## Klare Entscheidung und nächster Schritt

**Wurde eine technisch geeignete Unique-Quelle gefunden? Nein.**

Verbleibende Möglichkeiten:

1. ein offizieller, versionierter GGG-Unique-Definitionsdownload mit stabilen technischen IDs;
2. ein reproduzierbarer Export/Parser, der die fehlende serverseitige Item→Base→Mod/Stat-Beziehung ohne Textmatching nachweist;
3. belastbare Herkunfts- und Distributionsklärung durch GGG beziehungsweise den Datenherausgeber.

Der nächste Schritt ist eine eng begrenzte Quellenbeobachtung oder technische Anfrage nach genau dieser ID-Kette. Erst dann folgt eine eigene Pin-, Feldallowlist-, Lizenz-, Distributions- und Guard-Entscheidung. Bis dahin bleiben Unique-Affixe höchste Priorität, reguläre Produktlokalisierung zurückgestellt, Produktivpin und Approval unverändert, `translation-missing` aktiv sowie 5M.2, 5N, OCR und Fotoerkennung nicht begonnen.

## Auftraggeberentscheidung 5M.2.8

Der Auftraggeber hat PoB2 trotz der fehlenden GGG-ID-Kette als eigenständige Unique-Planerdatenquelle zugelassen. Diese Entscheidung ersetzt nicht das technische Ergebnis aus 5M.2.7: PoB2 bleibt `pob2-planner-data` und darf keine GGG-Mod-/Stat-Identität behaupten. Der neue Scope ist nur bedingt freigegeben; Distribution und Produktimport bleiben pending. Details und Guards stehen in `POE2_POB2_UNIQUE_PLANNER_DATA_APPROVAL.md`.
