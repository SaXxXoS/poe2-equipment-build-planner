# CHATGPT-Protokoll – PoE2 Equipment Build Planner

## Numerische Schadensberechnung V1 (2026-07-24)

- Auftraggeberentscheidung: Schaden der tatsächlich eingegebenen Ausrüstung numerisch darstellen und Builds vergleichbar machen.
- Referenz: lokale statische PoB2-Skill- und Waffenbasisdateien am Pin `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`; kein Runtime-Netzwerk und keine Lua-Laufzeit.
- Neuer enger Scope: `poe2-pob2-damage-calculation-reference`, Projektentscheidung mit offengelegter Rechteunsicherheit; keine PoB2-/GGG-Genehmigung wird behauptet.
- Produktreferenz: `generated/pob2/damage-reference.json`, 337 Skillrecords, 354 Waffenbasen, Hash `193e1be36e90f6a130fa14e6c737302a41a63aabdcdae5e32e6fb4f3adfc3e22`.
- V1 berechnet Schaden pro Treffer, Aktionen pro Sekunde und begrenzten Trefferschaden pro Sekunde für eindeutig auflösbare Trefferangriffe und -zauber.
- Supports, Passive-/Aszendenzwerte, Krit, Gegnerabwehr, Ailments/DoT, Minions, Mehrfachtreffer und bedingte Effekte fehlen noch. Nicht auflösbare Fälle bleiben `nicht verfügbar`.
- Nächster Ausbau: numerische Supporteffekte, ausgewählte Baum-/Aszendenzstats, Gegnerprofile und Vergleich gespeicherter Ausgangs-/Zielstände.

## Vollständigerer Skill-/Supportkatalog (2026-07-24)

- Ausgangsbestand: 12 kuratierte Skills und 13 kuratierte Supports.
- Gepinnte Quelle: RePoE-PoE2 `4.5.4.4.4`,
  `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`,
  `data/skill_gems.json`, SHA-256
  `2c5a481f1147a87c844b1734a8fd2c660e4e13922145470ac72bca75095a69e3`.
- Produktfilter: `released`, herstellbar (`crafting_level > 0`), aktive,
  Spirit- oder Support-Gem, kein `Coming Soon`.
- Ergebnis: 219 aktive + 16 Spirit = 235 Skills sowie 451 getrennte
  Supportstufen.
- Nach Deduplizierung mit dem kuratierten Bestand zeigt die Produktoberfläche
  241 Fertigkeiten und 463 Unterstützungen.
- Die erwarteten 240/200 werden nicht erzwungen: Der Pin belegt fünf weniger
  auswählbare Skills; Supportstufen werden als getrennte Records geführt.
- Importierte Supports werden nur bei expliziter
  `recommended_supports`-Referenz positiv gerankt. Andernfalls bleiben sie
  auswählbar, aber `insufficient-semantic-evidence`.
- Keine Icons, Medien, Beschreibungen, Effekttabellen, Stat-IDs,
  Runtimequelle oder Rohspiegel.
- Neuer enger Scope: `poe2-repoe-skill-support-catalog`,
  `conditionally-approved` durch ausdrückliche Projektentscheidung mit
  offengelegter externer Rechteunsicherheit.

## Live-Suche für Fertigkeiten und sichtbare Supportplätze (2026-07-24)

- Fokus oder Antippen der Fertigkeitssuche öffnet unmittelbar eine sichtbare,
  scrollbare Trefferliste.
- Die Liste filtert während der Eingabe nach deutschem Namen und englischem
  Fallback.
- Jede leere Fertigkeitskarte zeigt fünf Supportplätze. Nach der Skillwahl
  besitzt jeder Platz eine eigene live-filternde Supportauswahl.
- Historischer Stand dieses UI-Zwischenschritts: 12 Fertigkeiten und 13
  Unterstützungen. Dieser Stand wurde am 24. Juli 2026 durch den gesondert
  gepinnten und freigegebenen RePoE-Auswahlkatalog (241/463 in der
  Produktoberfläche) abgelöst.

## Deutsche Normal-Affix-Anzeigeschicht (2026-07-24)

- Alle 2.255 produktiven normalen Affixe besitzen nun einen deutschen Anzeigetext.
- 2.169 Anzeigen werden über den gepinnten lokalen deutschen CSD-Bestand und technische Stat-ID-/Werteketten aufgelöst.
- 86 Hybrid- und Sonderzeilen verwenden eine separat gekennzeichnete deterministische App-Anzeigeübersetzung.
- `translation-missing`: 0.
- Englische technische Produktdaten, Stat-/Mod-IDs, Affixwerte, Analyzer, Datenpins und Unique-Daten bleiben unverändert.
- Generator: `scripts/poe2-affix-german-display/generate.mjs`.
- Anzeigeschicht: `generated/localization/de/poe2-affixes.json`.
- Coverage: `docs/audits/poe2-german-affix-display-coverage.json`.
- Nächster Schwerpunkt aus der Auftraggeberliste: automatische Befüllung leerer Fertigkeitskarten nach der Analyse beziehungsweise vollständigerer Skill-/Supportbestand.

## Hauptaufgabe V1.2 – funktionale Vollständigkeit

- Ausgangscommit: `1242dd78f0bb4eedacaeb03505390704aefa78d1`.
- Auftraggeberentscheidung: Version 1 wird zuerst funktional abgeschlossen; Design, mobile Benutzerführung, deutsche Restdarstellung und sprachlicher Feinschliff folgen getrennt.
- Das vollständige Funktionsinventar steht in `docs/BUILD_ASSISTANT_V1_2_FUNCTIONAL_COMPLETENESS.md`.
- Die bestehende Architektur bleibt unverändert maßgeblich: Eingabe → BuildProfile → Analyzer → Aggregation → deutsche Ergebnisansicht.
- Geschlossene Kernlücken: erkannte Waffenarten und tatsächlich belegte Waffensets erreichen Skill-, Support-, Unique- und Rotationslogik; ein leeres Set 2 ist keine Wechselgrundlage.
- Rotationen verwenden nur den gewählten Hauptskill und tatsächlich konfigurierte Skill-Setups. Fehlende Rollen werden nicht erfunden.
- Der vorhandene Compact-Passive-Plan ist mit Reihenfolge, Punktkosten, Pfadknoten und Baumfokus in den zusammenhängenden Build-Vorschlag eingebunden.
- Mapping und Boss zeigen nun jeweils die bereits vorhandenen Support-, Passive-, Juwel- und Unique-Ranglisten.
- Nächste Verbesserungen berücksichtigen zusätzlich belegten Widerstands- und allgemeinen Verteidigungsbedarf.
- Offline-Status: statischer lokaler Datenbestand, keine Runtime-API, keine Rohquelle und kein Hotlink als Funktionsvoraussetzung; keine neue PWA-Stufe.
- Datenpins und Produktdateien bleiben unverändert. Keine neue Datenquelle, Übersetzungsphase, Designphase oder allgemeine Architekturänderung.
- Geparkt bleiben normale englische Affixtexte, sichtbare technische Begriffe, `Accuracy|Accuracy|`, mobiler Affixdialog, Zeilenumbrüche, visuelle Hierarchie, Tier-/Item-Level-Gewichtung, Abstände, Schriftgrößen, Touchflächen und Unique-Sprachfeinschliff.
- Funktionaler V1-Abschlussstatus: alle bestätigten Pflichtlücken sind geschlossen; fehlende fachliche Grundlagen bleiben offen als `Unbekannt` oder eingeschränkte Funktion.
- Prüfstatus: 51 fokussierte V1.2-/Rotationsprüfungen, 95 Grenz-/Approval-Prüfungen und die vollständige Suite mit 1.012/1.012 Tests erfolgreich; drei zeitkritische Passive-Performanceprüfungen zusätzlich seriell erfolgreich.
- Lint, Typecheck, Produktions-Build, Pages-Build, 132 JSON-Dateien, `git diff --check` und Git-Sicherheitsprüfung erfolgreich.
- Technische Browserprüfung: Desktop-End-to-End-Ergebnis mit Mapping-/Boss-Ranglisten; 390 × 844 ohne horizontalen Seitenüberlauf, Dialog innerhalb des Viewports, Berechnung erreichbar und Ergebnis sichtbar. Keine neuen Browserfehler oder -warnungen.
- Der lokal geladene Build berechnet vollständig aus gebündelten Daten; kein Laufzeit-Netzwerkzugriff wurde beobachtet. Eine neue Service-Worker-/PWA-Stufe ist weiterhin nicht Bestandteil von V1.2.
- Abschlusscommit der funktionalen Implementierung: `982eb50c62731757b36673d10ec5e43417c32811`.
- GitHub Pages: Workflow „Deploy GitHub Pages“, Lauf 54, erfolgreich; HTTP 200 und V1.2-Asset `index-C3Oush7P.js` ausgeliefert.
- Nächster Auftrag: getrennte Design-, deutsche Darstellungs- und Benutzerfreundlichkeitsphase.

## Hauptaufgabe V1.1 – semantische Analyzer-Breite

- Ausgangscommit: `143e605b3af83e9ed446e27c5c20ba7a1a03ffb0`.
- Die V1-End-to-End-Architektur bleibt unverändert; Orchestrator, BuildProfile, Aggregation und Scoremodelle bleiben maßgeblich.
- Produktive Kandidaten: Skills 6→12, Supports 5→13, Juwelen/Cluster 7→13.
- Affix-Coverage: 2.255 technische Affixe, 1.507 semantisch klassifiziert, 406 mehrzeilig/teilweise abgeleitet, 748 ungelöst.
- Unique-Semantik: 435 Items/579 Varianten; 147 `structured-exact`, 14 `structured-derived`, 274 `text-pattern-exact`. 288 Items liefern produktiv nutzbare Tags oder Restriktionen.
- Evidenzklassen sind `structured-exact`, `structured-derived`, `text-pattern-exact`, `text-pattern-ambiguous` und `unresolved`.
- Nur gemeinsame Variantenzeilen dürfen itemweite Semantik erzeugen. Legacy-only-Eigenschaften werden nicht übertragen.
- Keine technische GGG-ID, keine deutsche Anzeigeschicht als technische Quelle, kein Fuzzy Matching, keine neue Datenquelle und kein Scraping.
- PoB2-Produktpin, RePoE-/GGG-Pins, englische Produktdatei und deutsche Anzeigeschicht bleiben unverändert.
- Hauptskill-Suche und verständliche Unique-Evidenzanzeige ergänzen die vorhandene deutsche UI.
- Coverage und Vorher-/Nachher-Grenzen stehen in `docs/BUILD_ASSISTANT_V1_1_SEMANTIC_EXPANSION.md`.

## Abschlussstatus 5M.2.10 – deutsche PoB2-Unique-Lokalisierungsstrategie

- Ausgangscommit: `8bc97c1e73c2be81134fbb2ea1e9bd2e50360d75`.
- Der englische PoB2-Produktbestand blieb bytegleich: 435 Items, 579 Varianten, 2.345 Modzeilen, 273 Implicits; SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`.
- Geprüfte lokale Quellen: 589 CSD-Dateien, 5.476 englische/deutsche BaseItemTypes, 3.246 englische/deutsche Words-Records, ItemClasses und die Unique-DAT-Audits aus 5M.2.6.
- Namen: 434 eindeutige sichtbare Words-Kandidaten, ein mehrdeutiger Kandidat, 0 sichere Produktjoins.
- Basistypen: 425 eindeutige Textkandidaten, zehn mehrdeutige Kandidaten, 0 sichere Produktjoins.
- Modzeilen: 759 eindeutige und 355 mehrdeutige Templatekandidaten, 1.231 ohne lokalen Kandidaten; 0 technisch sichere deutsche Zeilen.
- Implicits: 57 eindeutige und 46 mehrdeutige Kandidaten, 170 ohne Kandidaten; 0 technisch sichere deutsche Implicits.
- Varianten: 579 variantenspezifisch ungelöst; Current/Legacy dürfen nur als UI-Systemtexte behandelt werden.
- Alle Kandidaten bleiben Audit-only. Keine Namens-, Text-, Basis- oder Zahlenheuristik wurde als Produktwahrheit verwendet.
- Getrenntes Zielmodell: `generated/localization/de/pob2-uniques.json`, in dieser Aufgabe nicht erzeugt; Join nur über stabile `pob2:`-, Varianten- und Zeilen-IDs nach eigener technischer Identitätsfreigabe.
- Gesamtstatus: `audit-only-no-safe-product-link`.
- Keine deutschen Unique-Produkttexte, keine automatische oder KI-Übersetzung, keine erfundenen GGG-IDs, keine externen Anfragen.
- Empfohlener nächster Schritt: 5M.2.10A, Offline-Audit einer stabilen Unique-Identitätsbrücke. Ein deutscher Import kann davor nicht beginnen.
- 5M.2 und 5N sind weiterhin nicht begonnen.

## Aufgabe 5M.2.8B – Auftraggeberentscheidung (2026-07-23)

## Abschlussstatus 5M.2.9

- Ausgangscommit `544d43279ae9369adaffc264b97873610fd4384b`; 5M.2.8B abgeschlossen.
- Buildzeitlicher Offline-Importer unter `scripts/pob2-unique-import/`; kein Lua und kein Runtime-Netzwerk.
- 20 gepinnte Dateien aus PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.
- Produkt `generated/pob2/uniques.json`; SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`; Fachhash `a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329`.
- 435 Uniques, 579 Varianten, 2.345 Modzeilen, 273 Implicit-Zeilen und 1.689 Rollbereiche.
- 104 Skillhinweise auditseitig erkannt, null Skills/Supports produktiv importiert.
- Vollständige Provenienz; Source Kind `pob2-planner-data`; GGG Identity `unknown`.
- Produktregistry stellt dem bestehenden Unique Analyzer 435 Kandidaten bereit; der passive Compact-Worker bleibt unverändert und transportiert keine unnötige Unique-Gesamtregistry. Fixtures bleiben test-only getrennt.
- Englisch ist Quelle; 435-mal Deutsch `translation-missing`; keine deutschen Unique-Texte.
- Zwei Importläufe byteidentisch. Normale Affixe, Craftingdaten, Medien, Flavour Text, Hotlinks, Runtime-Netzwerk und erfundene GGG-IDs bleiben ausgeschlossen.
- Keine externe Genehmigung wird behauptet; bekannte Unsicherheit bleibt dokumentiert.
- Verifikation: 984/984 Gesamttests, 45/45 finale Approval-/Importtests, Lint, Typecheck, Produktions- und Pages-Build, JSON und Git-Sicherheit erfolgreich.
- GitHub Pages: neuer Asset-Fingerprint `index-Bw9HqsFF.js` deployt; Desktop und 390 × 844 ohne Seiten-Horizontalüberlauf und ohne neue Konsolenfehler/-warnungen geprüft.
- 5M.2 und 5N weiterhin nicht begonnen.

- 5M.2.8A endete historisch mit `distribution-pending-both`.
- Der Auftraggeber hat ausdrücklich entschieden, keine externen
  Einzelanfragen an PoB2, Path of Building Community oder GGG zu verfolgen.
  Beide Entwürfe bleiben `not-pursued`, wurden nicht versendet und erhielten
  keine Antwort.
- Keine externe Genehmigung und keine vollständig geklärte Rechtslage werden
  behauptet. Die Datenlizenz bleibt teilweise `Unbekannt`.
- Neuer aktiver Status:
  `distribution-project-approved-with-disclosed-uncertainty`.
- Projektentscheidungswert: `approved-with-disclosed-uncertainty`.
- Externe Permission:
  `not-requested-not-obtained-not-required-by-project-policy`.
- Unsicherheit:
  `unresolved-external-rights-disclosed-and-accepted-by-project-owner`.
- Nur `poe2-pob2-unique-planner-data` wurde geändert; andere pending oder
  blocked Scopes bleiben unverändert. Kein generischer Risiko-Bypass.
- Der Guard verlangt weiterhin exakten Commit, eine der 20 Dateien, exakten
  SHA-256, Feldallowlist, Provenienz, Attribution, Lizenzhinweis,
  Quellenkennzeichnung, deterministische Normalisierung und den exakten
  Produktpfad. Rohmirror, Medien, Flavour Text, Netzwerk, Hotlinks, Scraping,
  reguläre Affixe und GGG-ID-Behauptungen bleiben gesperrt.
- Importvertrag Version 2 erlaubt 5M.2.9 grundsätzlich. Deutsche
  Unique-Texte bleiben `not-approved`; Englisch beziehungsweise
  `translation-missing` bleibt erforderlich.
- Keine PoB2-Produktdaten oder Produktdateien wurden in 5M.2.8B erzeugt.
  UI, Engine, Worker, Analyzer, BuildProfile und reguläre Affixdaten blieben
  unverändert.
- Nächste Aufgabe: 5M.2.9 unter dem exakten Importvertrag.
- 5M.2 und 5N wurden weiterhin nicht begonnen.

## Aufgabe 5M.2.8A – PoB2-Unique-Distribution (2026-07-23)

- 5M.2.8 ist abgeschlossen; 20 statische Unique-Dateien sind exakt gepinnt
  und gehasht, aber es wurden weiterhin keine Produktdaten importiert.
- Alle 20 Dateien tragen den Header `Item data (c) Grinding Gear Games`.
  Ihre Git-Historie zeigt Export-, Patch- und Communitypflege; eine
  recordgenaue Herkunft ist teilweise `Unbekannt`.
- PoB2-Code ist am Pin MIT-lizenziert. Eine ausdrückliche MIT-Lizenzierung
  der GGG-gekennzeichneten statischen Daten ist nicht belegt
  (`license-scope-unknown`).
- Die offiziellen GGG-Bedingungen und Developer-Dokumente wurden geprüft.
  Für Speicherung und öffentliche Distribution des geplanten reduzierten
  Nicht-API-Datensatzes fehlt eine schriftliche GGG-Bestätigung.
- Es wurde keine vorhandene eindeutige PoB2-Maintainerfreigabe gefunden.
  Zwei reviewbare Entwürfe für PoB2 und GGG wurden erstellt und nicht
  versendet.
- Historischer 5M.2.8A-Endstatus: `distribution-pending-both`. Option D war
  damals maßgeblich; der damalige Guard blockierte Produktimport,
  `generated/`, `public/` und 5M.2.9. 5M.2.8B hat diesen technischen Status
  durch die ausdrücklich dokumentierte Auftraggeberentscheidung abgelöst.
- Attribution ist für README, Datenquellendokumentation,
  `THIRD_PARTY_NOTICES.md` und eine spätere sichtbare App-Info geplant. Der
  endgültige Wortlaut bleibt pending.
- Reguläre GGG-/RePoE-Affixe, Produktivpins, Approval-Trennung,
  `translation-missing`, UI, Analyzer, Engine, Worker und BuildProfile
  bleiben unverändert. Deutsche Unique-Texte sind nicht freigegeben.
- Nächster Schritt: Entwürfe menschlich prüfen und manuell an PoB2 und GGG
  senden; beide schriftlichen Antworten anschließend in einer separaten
  Approval-Entscheidung auswerten.
- 5M.2, 5M.2.9 und 5N wurden nicht begonnen. Fotoerkennung bleibt später.

## Aufgabe 5M.2.7 – Unique-Quellenentscheidung (2026-07-23)

- 5M.2.6 belegt lokal keine vollständige Item-Unique-ID→Base→Mod/Stat-Kette. 5M.2.7 priorisiert deshalb diese Quellenentscheidung vor regulärer Lokalisierung, OCR, Socketables, 5M.2 und 5N.
- Offizielle GGG-Dokumentation/Exports, RePoE, PoB2, poe2-mcp, PoBR, Communityprojekte sowie Wikis/Webseiten wurden klassifiziert. Trade/PoE2DB wurden nicht als Datenquellen aufgerufen; kein Scraping, Hotlink oder Runtime-Abruf.
- Vertieft und exakt gepinnt: RePoE-PoE2 `1a6066ec60d24af274cb7a87d00b6ab1c0975ebd`, PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`, poe2-mcp `163c30a9fd45f815d330cc54e6ab51a797693d31`.
- RePoE hat weiterhin 449 name-/stashbasierte Unique-Zeilen ohne Base-/Mod-/Statbezug. PoB2 besitzt sichtbare Items/Varianten ohne technische Spiel-IDs; poe2-mcp allgemeine Mods ohne Unique-Itemschicht.
- Keine Einzelquelle und keine ID-sichere Kombination liefert die vollständige Kette. Deutsche CSD-Verbindbarkeit und Renderbarkeit bleiben deshalb nicht bestimmbar.
- Code-Lizenzen und GGG-Datenstatus sind getrennt; Distribution bleibt `pending`/`legal-status-unknown`. Solange die technische Quelle fehlt, wird keine Approval-Aufgabe empfohlen.
- Keine Unique- oder deutschen Produktdaten, keine Volltexte, keine Produktdateien, keine UI-/Engine-/Worker-/Analyzeränderung. Produktivpin, Approval und `translation-missing` bleiben unverändert; 5M.2 und 5N sind nicht begonnen.
- Nächster Schritt: offizieller oder reproduzierbarer ID-basierter Unique-Definitionsbestand und erst danach separate Pin-/Approval-/Distributionsaufgabe. Details: `docs/POE2_UNIQUE_SOURCE_CANDIDATE_DECISION.md`.

## Aufgabe 5M.2.4 – Offline-Referenztabellenextraktion (2026-07-23)

- 5M.2.3 ist abgeschlossen; 5M.2.4 erweitert dieselbe Auditpipeline ohne Produktimport. Content-Pin `a917a56f...8a18e28`, PoB2 `c5300ccd`, ooz `0.2.4`, Schema `268ae3a3`, Referenzmanifest `a4bbcd99` und Auditformat 2 sind erzwungen.
- Zwei Offline-Extraktionen lieferten je 22/22 Dateien und 11.884.854 Bytes; zwei Audits waren byteidentisch (`0ce6cb7b...848b7`). Kein HTTP/HTTPS/DNS/API, keine Trade-API, kein PoE2DB, keine Webseite.
- ItemClasses: 117 Zeilen, je ein unbekanntes Byte in englischer und deutscher Tabelle; 33 Produktklassen und `Charm` bleiben ungelöst. Das Byte wurde nicht geraten oder ignoriert.
- 2.255 Produktmods bleiben `partially-resolved`: IDs, Statfolgen, Werte, Tags und Spawnweight-Arrays stimmen; `ModDomains`/`ModGenerationTypes` existieren nicht als lokale DAT-Dateien, `ModFamily` ist keine belegte Konfliktgruppe.
- Deutsche Coverage bleibt: 12 Stat-IDs ohne deutsche CSD-Struktur, 38 Templatelücken und 2.189 OCR-Mehrdeutigkeiten ungelöst. `translation-missing` bleibt produktiv.
- Unique-bezogene Tabellen (449 Stash-, 48 Chest-, eine Mutated-Zeile) bilden keine Unique-ID-Kette. Keine Unique-Freigabe.
- Soul-Core-Audit: 295 Identitätszeilen, 507 Statzeilen, 30 Kategorien, strukturierte StatsValues; Identitätsbyte und Bonded-/Zielkette bleiben offen. Runen/Idols/Abyssal Eyes/Congealed Mist bleiben unbekannt. Keine Socketable-Freigabe.
- Produktivpin und `source-approval.json` bleiben unverändert; keine deutschen Volltexte, Rohdaten oder Produktdateien committed; keine UI-, BuildProfile-, Worker-, Analyzer-, Engine-, Passive-, Baum- oder Planänderung.
- 5M.2 und 5N sind nicht begonnen. PS-Nutzer benötigen später ausgelieferte, separat freizugebende Sprachdaten. Fotoerkennung, Lernmodus, Buildvergleich, Designoptimierung und mobile Textklippung bleiben offen.
- Nächster Schritt: audit-only Schemaentscheidung für die unbekannten ItemClasses-/SoulCores-Bytes und nicht materialisierten Enumtabellen. Details: `docs/POE2_OFFLINE_REFERENCE_TABLE_EXTRACTION.md`.

## Aufgabe 5M.2.0 – deutsche Gegenstandslokalisierung, Quellenentscheidung (2026-07-22)

- Reine Auditentscheidung: keine deutschen Produktivtexte, keine freie/KI-Übersetzung, keine PoE2DB-Automation und keine UI-, BuildProfile-, Worker-, Analyzer-, Engine- oder Baumänderung. `translation-missing` bleibt produktiv.
- Bestand: 2.255 eindeutige Mods, 2.705 Statzeilen, 431 Stat-IDs, 444 geordnete Stat-ID-Kombinationen, 429 Mehrzeiler/Hybride, 39 zusätzliche Basistypen und 33 referenzierte Itemklassen.
- RePoE `4.5.4.4.4`/`b3f38149` besitzt 589 StatDescription-Dateien und deckt 419/431 Produkt-Stat-IDs technisch ab, enthält aber 0 befüllte deutsche Einträge. Parser `14e3edc8` unterstützt `de_DE.utf8`; Remote-HEAD war identisch. Kein lokaler Client war an drei Standardpfaden verfügbar.
- Alle deutschen Stat-, Mod-, Base-, Klassen-, Socketable- und kuratierten Mapping-Scopes bleiben `pending`; photo-derived Mapping bleibt `blocked`. Repository-Weitergabe ist **Unbekannt** und verlangt eine eigene Entscheidung.
- 5M.2 und 5N sowie Fotoerkennung und lokaler Lernmodus sind nicht begonnen. Mobile Textklippung aus 5M.1B bleibt offen. Details: `docs/POE2_GERMAN_ITEM_LOCALIZATION_SOURCE_DECISION.md`.

## Status 5M.1B.0C – Socketable-/Spezialmod-Quellenentscheidung (2026-07-22)

- RePoE `augments.json` belegt 295 technische Socketable-Identitäten: 221 Rune, 34 SoulCore, 35 Idol, 4 AbyssalEye und 1 CongealedMist. Nur minimale technische Identitätsfelder sind unter exakten Pins `conditionally-approved`; es wurde nichts importiert.
- Moddaten bleiben `pending`, weil `augments.py` zwar `StatsValues`/`BondedStatsValues` liest, sie aber nicht strukturiert exportiert. Desecrated und Anointments sind deferred/pending, Mutated bleibt wegen Unique-Kopplung blocked, Enchantments und weitere Corruption-Mods bleiben pending.
- Die vorhandenen 103 Corruption-Implicits und 110 Corruption-Upgrades sowie alle neun 5M.1-Dateien bleiben unverändert; kein Doppelimport. Keine zusätzlichen Itemklassen, Uniques, deutschen Texte, UI-, Engine-, Worker- oder Analyzeränderungen.
- 5M.1B, 5M.2 und 5N sind nicht begonnen. Vor Socketable-Modimport ist ein neu gepinnter verlustfreier Parserexport der normalen und bonded Werte erforderlich. Details: `docs/POE2_SOCKETABLE_AND_SPECIAL_MOD_SOURCE_DECISION.md`.

## Aufgabe 5M.1B.0B – Unique-Quellenentscheidung

- Commit-genau geprüft: RePoE-PoE2 `b3f38149`/Parser `14e3edc8`, PoB2 `dev@f5b94342`, archiviertes PoB2-v2 `7e047f0e`, poe2-mcp `163c30a9` und PoBR `ff1d07da`.
- Keine Quelle liefert eine vollständige ID-basierte Item–Base–Mod–Stat–Varianten-Beziehung. RePoE hat 449 Stashzeilen/441 Namen ohne Base-/Modlink; PoB hat 435 statische Textblöcke, 579 Variantenzeilen und 2.704 sichtbare Modzeilen ohne technische Unique-/Mod-/Stat-ID; poe2-mcp hat technische Mods, aber keine Unique-Item-Tabelle; PoBR ist derivative PoB-Kontrollquelle.
- Unique-Identität bleibt `pending`; Unique-Mods, Varianten und item-granted Effect-Referenzen bleiben `blocked`. Keine Quelldatei und kein Feld wurde für einen Import freigegeben. Unique-Jewels, -Charms und -Flasks sind nicht durch 5M.1B.0A freigegeben.
- Der Analyzer bleibt `0.7.0-synthetic` mit 16 synthetischen Fixtures. Reale Varianten, lokale Waffenwerte, granted Skills/Supports, Charm-/Flasktrigger, Jewel-Radius und gekoppelte Effekte bleiben unsupported.
- Keine Unique-Daten oder Produktdateien, keine UI-/Engine-/Analyzer-/Worker-/BuildProfile-Änderung, keine deutschen Texte. Runen, Soul Cores, Desecrated/Mutated Mods und Medien bleiben gesperrt. 5M.1B, 5M.1B.0C, 5M.2 und 5N wurden nicht begonnen; physische iPhone-Abnahme offen.
- Maßgeblich: `docs/POE2_UNIQUE_ITEM_SOURCE_DECISION.md` und `docs/audits/poe2-unique-source-comparison.json`.

## Aufgabe 5M.0 – kontrollierte Affixquellenfreigabe

- RePoE-PoE2 ist ausschließlich im Scope `poe2-technical-affix-data-for-build-planner` `conditionally-approved`: Version `4.5.4.4.4`, Exportcommit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, geprüfter Parsercommit `14e3edc89ed705bd4e4eda5c8135756431c76e81`.
- Zulässig sind nur normalisierte technische Affix-/Mod-/Stat-IDs, Prefix/Suffix, Tiers, Werte, Item-Level, Itemklassen, Tags, Spawnregeln, Gruppen/Konflikte und Lokalität. Pflicht: Pinning, SHA-256-Manifest, Attribution, deterministischer Offlineimport, kein Rohdatenspiegel, Entfernbarkeit und erneute manuelle Freigabe bei jedem Wechsel.
- Dies ist eine bewusste Projektrisikoentscheidung, keine allgemeine GGG-Datenlizenz. RePoEs MIT-Lizenz gilt für Software; generierte Daten werden dort ausdrücklich GGG zugeordnet. Commercial Use bleibt ungeklärt.
- Path of Building PoE2 wurde als technisch breite, aber laufzeitspezifische und ebenfalls aus Spieldaten abgeleitete Alternative geprüft; es ist keine 5M-Importquelle. Das archivierte `PathOfBuilding-PoE2-v2` ist veraltet.
- PoE2DB und `display-names` bleiben `blocked`. PoE2DB ist ausschließlich manuelle deutsche Sprach-/Darstellungsreferenz. Nicht eindeutig über technische IDs zugeordnete Texte bleiben `translation-missing`; kein Code, HTML, CSS, Asset, Dump, API- oder Laufzeitabruf.
- Der technische Teil von 5M darf nach neuem Auftrag unter diesen Bedingungen beginnen. 5M.0 hat keine Daten importiert, UI/Engine nicht verändert, keine Übersetzungen erzeugt und Aufgabe 5N nicht begonnen.
- Maßgebliche Detailentscheidung: `docs/POE2_AFFIX_SOURCE_DECISION.md`.

## Aufgabe 5L – reale Pfade im Baum

- `buildPassivePlanVisualization` ist die einzige Grenze vom Compact-Ergebnis zur Baumdarstellung. Sie validiert Source/Hash, Node-/Connection-IDs, Zusammenhang, Layout-/Effekt- und Aszendenzgrenzen; es gibt keine UI-Pfadsuche, Zielsortierung oder Budgetberechnung.
- Der vorhandene Baum rendert zusätzliche nicht interaktive Pfad-/Knotenoverlays mit derselben geraden beziehungsweise Orbitgeometrie. Offizielle Motive, Rahmen, Positionen, zentrale Aszendenz, Pinch/Pan, Suche, Filter und Inspektion bleiben erhalten.
- Plan ein/aus und „Plan im Baum anzeigen“ sind bewusste Nutzeraktionen. Completed/partielle Fachresultate erscheinen; stale bleibt gestrichelt, gedimmt und textlich veraltet; laufend, abgebrochen, fehlgeschlagen oder ungültig wird nicht als aktueller Plan gezeigt.
- Targeting, Scores, Tie-Breaker, Pathfinder, Planner, Pipeline, Haupt-Orchestrator, Budgetregeln und Workerprotokoll sind fachlich unverändert. Keine Affix-, Skill- oder Supportdatenänderung. Physische iPhone-Abnahme offen; Aufgabe 5M nicht begonnen.
- Weiter offene Daten-/Produktaufgaben: vollständige reale Affixdaten; deutsche sichtbare Affixnamen/-beschreibungen; vollständige Skilldaten mit deutschen sichtbaren Namen/Beschreibungen; vollständige Supportdaten mit deutschen sichtbaren Namen/Beschreibungen; PoE2DB ausschließlich als deutsche Referenz prüfen, nicht automatisch als technische Wahrheit; Buildvergleich vorher/nachher; Fotoerkennung für Ausrüstung; Designoptimierung für bessere Bedienbarkeit.
- Lokaler Produktionsbrowser: `partial` mit 8 Knoten, 7 Kanten und 2 Zielen erzeugte exakt 8/7/2 Zusatzoverlays bei 17.974 SVG-Nachfahren; Planfokus nur per Button, Zoom danach stabil, stale 8 gedimmte Ringe/7 gestrichelte Kanten, Suche/Filter erhalten den Plan, null Console-Warnungen/-Fehler. Die 390×844-Viewportvorgabe wurde technisch nicht übernommen; mobile Automation und physisches iPhone bleiben offen.

## Nachbesserung 5K.1 – Browserlaufzeit

- Die 8,9–9,7 Sekunden stammen nach Messung nicht aus React, doppelten Requests, Graph- oder Context-Neuaufbau, sondern aus der unveränderten 5K-Planning-Anfrage mit Pool 50 und bis zu 20 Zielen. Reproduziert: 11.511,25 ms Worker, davon 11.211,82 ms Planning und 193,05 ms Targeting; Graph-/Context-Aufbauten null.
- Genau ein workerlokaler Eintrag beantwortet nur ein exakt identisches validiertes Analyze-Payload mit dem unveränderten letzten Compact-Ergebnis. Eingabeänderung, Reinitialisierung, Dispose oder harter Abbruch verhindern beziehungsweise löschen den Treffer. Kein globaler Cache, Storage oder externer Zugriff.
- UI-Request 16.882 B ohne Baum/Graph/Context; Compact 804.888 B. Sechs identische Läufe behielten `fnv1a32-5d6ef45a`; fünf Dispatcher-Treffer lagen bei 0,04–0,09 ms. Pro Klick genau eine Workeranfrage; Cache-Miss genau ein, Cache-Treffer null Orchestratoraufrufe.
- Targeting, Scores, Pathfinder, Planner, Budget, Required-Ziele, Pipelineplan, Ergebnisansicht, Baum und Gesten bleiben unverändert. Geänderte Eingaben bleiben wegen der vollständigen 50/20-Planung langsam. Physische iPhone-Abnahme offen; Aufgabe 5L nicht begonnen.
- Lokaler Pages-Produktionsbrowser: geänderte Anfrage 9.439 ms gesamt/9.032,80 ms Worker; fünf identische Wiederholungen konservativ 619–661 ms bis UI-fertig, Median 630 ms einschließlich 250-ms-Wartezeit und Teststeuerung, Worker 0,00–0,20 ms. Harter Abbruch nach Eingabeänderung zeigte Neuinitialisierung nach 514 ms; keine Browserwarnungen/-fehler. Die 390×844-Übersteuerung blieb wirkungslos, daher mobile Automation und physisches iPhone ausdrücklich offen.

## Aufgabe 5K – kontrollierte UI-Integration

- `src/features/real-passive-analysis/` bildet genau eine React-nahe Grenze: reiner Adapter, sitzungsweiter Controller und textliche Compact-Ansicht. React verwendet ausschließlich den öffentlichen 5J-Client.
- Initialisierung und Analyse sind getrennte Nutzeraktionen. Keine automatische Analyse, kein Budget aus Level/Quests/Aszendenz und keine erfundenen Required-Ziele oder Filter.
- Start kommt ausschließlich aus dem offiziellen Klassenregister. Fachliche Eingabesignaturen markieren alte Ergebnisse `stale`; visuelle Bauminteraktion zählt nicht als Änderung.
- Harte Cancellation verwirft das Resultat und verlangt Neuinitialisierung. Echte Stufen erscheinen zentral deutsch ohne Prozentwerte; Compact bleibt Standard.
- Keine Pfad-/Knotenmarkierung oder Kamerabewegung; Renderer, Engine, Targeting, Pathfinder, Planner und Pipeline bleiben unverändert. Physische iPhone-Abnahme offen. Fotoerkennung, Buildvergleich, Designoptimierung und Aufgabe 5L bleiben offen.
- Dokumentation: `docs/POE2_REAL_PASSIVE_UI_INTEGRATION.md`.

## Aufgabe 5J – Browser-Laufzeitarchitektur

- `src/runtime/real-passive-worker/` kapselt genau einen versionierten Module-Worker-Client und Dispatcher außerhalb der Engine. Der Dispatcher ruft ausschließlich `analyzeBuild` über die 5I-Grenze auf.
- Gewählt ist Architektur C: lokaler gepinnter Baum wird im Worker gebündelt; Graph und Prepared Context werden dort einmal aufgebaut und bis Dispose wiederverwendet. Keine Übertragung dieser Maps/Sets, kein globaler Cache, Storage oder externer Fetch.
- Protokoll 1.0.0, eindeutige Request-IDs, strukturierte Fortschritts-/Fehler-/Cancelnachrichten, eine aktive Analyse, keine Queue. Compact wird erzwungen; Full verlässt den Worker nicht.
- Aktiver Abbruch terminiert den synchron rechnenden Worker ehrlich hart. Resultat wird verworfen, Graph/Context gehen verloren, Neuinitialisierung ist erforderlich; kein kooperativer In-Run-Abbruch wird behauptet.
- Vite baut `realPassiveWorker-<hash>.js` lokal unter dem Pages-Basispfad. Die API wird von React noch nicht gestartet; keine Pfadvisualisierung, Budgetableitung oder Knotenaktivierung. Physisches iPhone nicht geprüft. Aufgabe 5K nicht begonnen.
- Desktop-Browser-Smoke: Module-Worker bereit nach 1.893,60 ms, fünf echte Initialisierungsstufen, 5.150/6.067 Graphbestand, maximale beobachtete 10-ms-Timerdrift 1,30 ms, keine Konsolenfehler. Dies ist keine mobile Ruckelfreiheitsgarantie.
- Dokumentation: `docs/POE2_REAL_PASSIVE_BROWSER_RUNTIME.md`.

## Nachbesserung 5I.1 – Laufzeit und Ergebnisgröße

- Ausschließlich die technische 5I-Grenze wurde optimiert. Targeting-Regeln, Scores, Tie-Breaker, Coverage, Budget, Required-Ziele, Start/Version, Pathfinder, Planner, synthetischer Analyzer, UI und Baumrenderer sind fachlich unverändert.
- `compact` ist Standard von `EngineRequest.realPassivePlanning`; `full` bleibt explizit verfügbar und der direkte `runRealPassivePipeline`-Vertrag bleibt vollständig.
- Genau `projectRealPassivePipelineResult` projiziert auf Plan, IDs, Pfade, Teilbaum, Budget, Required-Diagnosen, Issues, Stufensummaries und unveränderten fachlichen Hash. Keine 5.150er-Rangliste oder Graphkopie in Compact.
- `preparePassiveTargetingContext` hält ausschließlich baumabhängige Klassifikationen. Format, Source-Version und Baumidentität werden geprüft; Profile, Scores und Pläne sind ausgeschlossen. Explizite Wiederverwendung statt globalem Cache.
- 0.5.2-Mehrlaufmessung, Node 24.14.0/Windows x64: Pipeline-Median 2.064,76 ms ohne Context und 414,43 ms mit Context; Targeting-Median 1.797,04 ms gegenüber 134,08 ms; Compact 717.622 B gegenüber Full 34.896.120 B (−97,94 %). Context-Aufbau 1.866,44 ms; drei Profile mit Graph/Context 1.379,08 ms. Heapwerte sind GC-bedingt keine Garantie.
- Keine UI-Anbindung oder Pfadvisualisierung; mobile Eignung nicht behauptet. Aufgabe 5J wurde nicht begonnen. Bericht: `docs/POE2_REAL_PASSIVE_PERFORMANCE_OPTIMIZATION.md`.

## Aufgabe 5I – reale Passive-Pipeline im Haupt-Orchestrator

- `EngineRequest.realPassivePlanning` aktiviert die reale Pipeline ausschließlich explizit; alte Aufrufe erzeugen weder Graph noch Pipelinefeld oder zusätzliche Modulstufe.
- Genau `runRealPassivePlanningIntegration` sitzt nach Equipment/BuildProfile. Sie ergänzt nur Profil und Context und ruft den öffentlichen 5H-Vertrag auf; Targeting, Pathfinder, Planner, Hash und Required-Diagnosen werden nicht dupliziert.
- Budget, Baum, Quellversion, technischer Charakterkontext, Planungs- und Zielmodus sind bei Aktivierung erforderlich. Budget wird nie aus Level, Quests oder Aszendenzpunkten abgeleitet. Startauflösung bleibt explizite Node-ID oder eindeutiges `classStartIndex`.
- Synthetische `passiveAnalysis` und `realPassivePlanning.pipelineResult` bleiben getrennt. Kontrollierte Fehler/Teilresultate erhalten Codes, Stufen und Node-IDs; unabhängige Analyzer laufen weiter. Unerwartete Throws bleiben fatal.
- Graphwiederverwendung ist explizit und versionsgeprüft. Kein globaler Cache und kein Targeting-Cache; mehrere Profile teilen nur den unveränderlichen Graphen.
- Offizielle Einzelmessung: 47,50 ms ohne Pipeline; 3.272,16 ms mit neuem und 2.697,38 ms mit vorbereitetem Graph; Targeting 1.976,99 ms, Planning 202,32 ms, drei Profile 7.901,55 ms, Ergebnis 34.896.050 Bytes, beobachtete Harness-Heap-Differenz 234,07 MiB.
- Keine React-/UI-Anbindung, Baumhervorhebung oder Pfaddarstellung. Aufgabe 5J wurde nicht begonnen.

## Nachbesserung 5D.3 – Exportassets, zentrale Aszendenz und Klassenregister

Der gepinnte Export 0.5.2/`1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6` liefert 36 lokal importierte Atlasdateien mit Hashinventar. `official-poe2-passive-tree-export-assets` ist eng `conditionally-approved`, ohne allgemeine Medien- oder Rechtsfreigabe. Mittel-/Nahansicht verwenden offizielle Motive und Rahmen; Aszendenzen erscheinen als unveränderte Einheit zentral mit Exportbild. Das Register erkennt zwölf Klassen; Witch, Ranger, Warrior, Sorceress, Huntress, Mercenary, Monk und Druid sind unterstützt. Marauder, Duelist, Shadow und Templar bleiben teilunterstützt; Ranger2 und Druid3 mangels Name/Bild nicht verfügbar. Neue Releases aktivieren Klassen nie ungeprüft. Der Nutzer bestätigte den bisherigen Pinch auf physischem iPhone; 5D.3 ist dort noch nicht erneut geprüft. Aufgabe 5I bleibt gestoppt. Engine und Haupt-Orchestrator bleiben unverändert.

## Übergabe nach Aufgabe 5F

Aufgabe 5F ergänzt `src/engine/passive-targeting/` als eigenständige, deterministische, React- und netzwerkfreie Bewertung echter passiver Einzelknoten. Zentrale Regeln klassifizieren unveränderte englische Namen und einzelne Statzeilen nach Schadensarten, Attack/Spell- und weiteren Mechaniken, Defensive, Ressourcen, Attributen und Utility. Die kontrollierte Normalisierung löst GGG-Markup auf sichtbaren englischen Text auf, extrahiert eindeutige Zahlen und erhält jeden Originaltext. Unbekannte Zeilen bleiben `unresolved`.

Der Evaluator liest ausschließlich ein übergebenes synthetisches `BuildProfile`, Charakter-/Aszendenzkontext, Zielprofil und echte Knoten. ScoreReasons dokumentieren Profiltreffer und Konflikte; Score und Confidence sind getrennt. Startknoten sind keine Ziele, fremde Aszendenzen werden blockiert, Juwelsockel nur als `socket-target` geführt und Keystones verlangen Trade-off-/Unsicherheitsreview. Ranglisten wählen keine kombinierte Zielmenge.

Gemessene Coverage auf Release 0.5.2: 5.150 Knoten, 5.962 Statzeilen, 4.850 klassifiziert, 1.112 unresolved, 81,35 %. Beim Lightning-Projectile-Profil waren 1.355 Knoten blockiert. Windows-x64/Node-24.14.0-Einzelmessung: Laden/JSON 56,72 ms, Klassifikation 1.651,62 ms, ein Profil 1.701,13 ms, zehn Profile 16.048,51 ms; Heap-Momentaufnahmen 36,14 MiB nach Klassifikation und 256,50 MiB nach zehn vollständigen Resultaten. Keine Produktgrenzwerte oder stabile Speichergarantie werden behauptet.

Pfadsuchmodul, Passive Analyzer, Orchestrator und UI bleiben per Hash-Vertrag unverändert. Es gibt keine Pfadsuche, Pfadkosten, Zielmengenauswahl, Baumoptimierung, Punkteverteilung, DPS oder deutschen Knotentext. Neue Abhängigkeiten: keine. Vollständige Dokumentation: `docs/POE2_PASSIVE_TARGETING.md`. Abschlussprüfung: 517 reguläre Tests in 21 Dateien, darunter 51 neue Targeting-/Grenz-/Performancetests; Fixture-Import 23/0, Lint, Typecheck, Produktions- und Pages-Build erfolgreich. Unter paralleler Gesamtsuitenlast wurden die höheren Targeting-Einzelwerte 66,53 ms / 3.918,15 ms / 2.248,45 ms / 16.064,89 ms und eine Heap-Gesamtdifferenz von 242,87 MiB beobachtet und dokumentiert.

## Übergabe nach Aufgabe 5E

Aufgabe 5E ergänzt `src/engine/passive-pathfinding/` als eigenständige, React- und netzwerkfreie Grundlage für den offiziellen Passivbaum 0.5.2. Der kontrollierte Graph enthält 5.150 Knoten und 6.067 kanonische ungerichtete Verbindungen, deterministische Nachbarlisten, Typen, Klassen-/Aszendenzzuordnung, Sockel-/Aktivstatus und zentral konfigurierte Traversierungskosten. Fehlerhafte Referenzen, doppelte oder echte selbstgerichtete Kanten und ungültige Kosten blockieren den Graphaufbau; die bekannte offizielle Selbstnachbarschaft wird kontrolliert ignoriert.

Einzelziele verwenden deterministisches Dijkstra für `shortest-path` oder `lowest-cost-path`. Tie-Breaker sind zusätzliche Kosten, neu belegte Knoten, Pfadlänge und die lexikografische technische ID-Folge. Bereits belegte Knoten werden kostenfrei wiederverwendet, technische Starts kosten standardmäßig null, Zielknoten zählen, Budgets und Aszendenzgrenzen werden strukturiert geprüft. `connect-targets` verbindet nur explizit vorgegebene Ziele schrittweise mit dem vorhandenen Teilbaum, dedupliziert gemeinsame Knoten/Kanten und kennzeichnet die Aussage korrekt als `shortest-per-step`, nicht als globale Optimalität.

Passive Analyzer, Orchestrator, UI und sichtbarer Baum blieben fachlich unverändert. Es gibt keine Zielauswahl, Buildoptimierung, automatische Punkteverteilung, Clusterpfade oder DPS-Berechnung. Neue Abhängigkeiten: keine. Dokumentation: `docs/POE2_PASSIVE_PATHFINDING.md`. Performancebeobachtung unter Windows x64/Node 24.14.0: Graphaufbau 329,84–336,35 ms, entferntes Einzelziel 316,35–318,77 ms, zehn Einzelziele 2.973,83–3.040,55 ms, Vierzielverbindung 2.230,54–2.293,60 ms; Heap-Momentaufnahme etwa 6,54–6,55 MiB für den Graphen und 28,34–62,77 MiB Gesamtdifferenz nach den Suchen. Unter paralleler Gesamtsuitenlast lagen Einzelwerte höher und sind ebenfalls in der Fachdokumentation festgehalten. Abschlussprüfung: 466 reguläre Tests in 18 Dateien, Fixture-Import 23/0, Lint, Typecheck, Produktions- und Pages-Build erfolgreich. Dies sind Beobachtungen ohne Produktgrenzwert oder stabile Speichergarantie.

## Übergabe nach Aufgabe 5D

Aufgabe 5D ist technisch umgesetzt. `src/tree-view/adapter.ts` bildet den validierten offiziellen Baumstand 0.5.2 einmalig auf ein reines `PassiveTreeViewModel` ab; React erhält keine Import- oder GGG-Rohobjekte. Das ViewModel enthält 5.150 Knoten, 6.067 Verbindungen, 1.621 Gruppen, 6 Klassenstarts, 36 Aszendenzstarts und 19 Juwelsockel. Es werden keine Cluster-Sockel erzeugt. Offizielle Koordinaten bleiben relativ unverändert; Bounds erhalten nur einen einheitlichen Rand.

Der bisherige synthetische Sieben-Knoten-Baum ist aus der sichtbaren Baumkomponente entfernt. Die technische SVG-Ansicht besitzt Gesamtansicht, 1×–12× Zoom, Pointer-/Touch-Pan, Vollbild, einzelne Inspektionsauswahl per Klick/Tap/Tastatur, englische Details, lokale Suche, rein visuelle Filter und Orientierung an Klassen-/Aszendenzstarts. Lade- und Fehlerzustände fallen niemals auf erfundene Daten zurück. Der Baum wird als gehashtes lokales Vite-Asset geladen; es gibt keinen Zugriff auf GGG/GitHub zur Laufzeit.

Engine, Passive Analyzer, Buildstate und restliche Fachmodule blieben unverändert. Es gibt keine Pfadsuche, Optimierung, Punktvergabe, automatische Belegung, Juwelbelegung oder Analyzer-Anbindung. Keine deutschen Knotentexte wurden erfunden und keine GGG-Assets übernommen. Neue Abhängigkeiten: keine.

Abschlussprüfung: Fixture-Import 23/0; 432 reguläre Tests in 15 Dateien erfolgreich, darunter 20 Adapter- und 16 Baumkomponententests; Lint, Typecheck, Produktions- und Pages-Build erfolgreich. Build-Asset: 7.580,63 kB, gzip 596,81 kB; SVG-DOM 11.219 Elemente. Öffentliche Pages-Einzelmessungen: kalt 5.157 ms bis zur sichtbaren Ansicht (Daten/JSON 313,8 ms, Adapter 129,7 ms, erste Render-Markierung 653,2 ms), warm 726 ms (58,2 / 131,9 / 347,6 ms); der Browser bot keine verlässliche Arbeitsspeichermessung. Desktop 1280 × 800 und Mobil 390 × 844 wurden ohne Dokumentüberlauf, ohne Konsolenfehler und mit Suche, Filter, Klassen-/Aszendenznavigation, Auswahl, Tastaturbedienung, Zoom und Pan geprüft. Ein beim Mobiltest sichtbarer zu breiter Suchtrefferstreifen wurde vor Abschluss behoben. Bekannte Risiken: großes JSON und SVG-DOM können auf schwachen Mobilgeräten merkliche Lade-/Interaktionskosten erzeugen. Bekannte reproduzierbare Bugs: keine. Nächste empfohlene Aufgabe: gezielte Darstellungsperformance und Barrierefreiheit weiter härten; fachliche Pfadsuche oder Engine-Anbindung weiterhin nur in einem getrennten Auftrag.

## Übergabe nach Aufgabe 5C

Aufgabe 5C ist abgeschlossen. Die damalige 5B-Bewertung wurde korrigiert: `ggg-poe2-skilltree-export` ist ausschließlich für die fest gepinnte offizielle `data.json` und passive Knoten, Verbindungen, Gruppen, Klassen-/Aszendenzstarts sowie explizite Juwelsockel `conditionally-approved`. Andere echte Kategorien, PoE2DB, RePoE, Medien und andere GGG-Dateien blieben zu diesem Zeitpunkt blockiert; die spätere 5M.0-Ausnahme betrifft ausschließlich den gepinnten technischen Affixscope.

Verwendete Quelle: <https://github.com/grindinggear/poe2-skilltree-export>, Release `0.5.2` „Runes of Aldur“, Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6`, Quellhash `f83c94ce7b09f2bfc5b3b1d63523c2ab3d2582d0e964f6aeec34b8b0390abcfe`. Importiert: 5.150 Knoten, 6.067 Verbindungen, 1.621 Gruppen, 6 Klassenstarts, 36 Aszendenzstarts, 19 Juwelsockel, 0 Cluster-Sockel. Übersprungen: Root-Pseudoknoten und zwölf mehrdeutige `jewelSlots`-Referenzen. Bericht: drei Warnungen (eine offizielle Selbstkante, zwölf mehrdeutige Slotreferenzen, 22 offiziell isolierte Knoten), null Fehler, null unbekannte Felder.

Der Export enthält englische Namen/Stats, keine Locale-Felder und keine dokumentierte deutsche Variante. Englische Quelltexte bleiben unverändert; deutsche Texte wurden nicht erfunden. Die Lokalisierungsgrenze und der Fallback verifiziertes Deutsch → offizielles Englisch → technische ID sind vorbereitet. Keine Assets wurden kopiert oder hotgelinkt.

Der Import ist offline, hashgeprüft und reproduzierbar. Er verlangt einen expliziten bekannten Release; `main`, `latest` und fehlende Versionen werden blockiert. `check:poe2-tree-update` validiert und vergleicht ohne produktive Dateien zu ersetzen. Saisonwechsel benötigen Pinning, Hash, Schemaaudit, Diff, vollständige Tests und dokumentierte manuelle Freigabe gemäß `docs/POE2_TREE_UPDATE_PROCESS.md`.

Engine, Passive Analyzer und UI sind fachlich unverändert; es gibt keine Baumoptimierung oder Pfadsuche. Risiken: Das offizielle Schema kann sich ändern; isolierte Knoten und mehrdeutige `jewelSlots` benötigen bei neuen Releases erneute Prüfung; eine verifizierte deutsche Quelle fehlt. Bekannte Bugs: keine reproduzierbaren Bugs aus 5C; die genannten Warnungen sind bewusst behandelte Quelldatenbesonderheiten. Nächste empfohlene Aufgabe: ein eigener Integrationsaudit/Adapter für die reine Baumdarstellung, weiterhin ohne Optimierung und erst nach ausdrücklichem Auftrag.

Abschlussprüfung 5C: reproduzierbarer lokaler Abhängigkeitsbestand ohne neue Bibliothek; Fixture-Import 23/0; reguläre Suite 13 Dateien und 396 Tests erfolgreich, einschließlich 22 neuer Baumimporttests und 16 Approval-Tests; Lint, Typecheck, Produktions-Build und separater Pages-Build erfolgreich. Prüfmodus ließ den generierten Baumhash unverändert; fehlende, unbekannte und `latest`-Versionen endeten jeweils mit Exitcode 1. Stichproben normaler/Notable-/Start-/Sockelknoten und Verbindungen waren konsistent; generierte Daten enthalten keine Assetpfade oder Laufzeit-URLs. Die öffentliche Pages-Version war auf Desktop und 390 × 844 erreichbar, zeigte weiterhin sieben Testbaumknoten, hatte keinen horizontalen Überlauf und keine Browserkonsolenwarnungen/-fehler. Nicht auf physischem Touchgerät geprüft; kein importierter echter Baum wird in der UI dargestellt.

Stand: 20. Juli 2026. Bei Widersprüchen ist der Quellcode die maßgebliche Wahrheit.

## 1. Projektbeschreibung

Mobile-first Web-App zur Planung eines Path-of-Exile-2-Builds ausgehend von vorhandener Ausrüstung. Der aktuelle Stand ist ein klickbarer React-Prototyp mit lokalen Platzhalterdaten auf einer einzigen langen Seite.

## 2. Projektziel

Langfristig analysiert eine erklärbare Engine Klasse, Aszendenz, Level, Ausrüstungsaffixe, beide Waffen-Sets, eine optionale Hauptfertigkeit und das Ziel Ausgeglichen, Mapping oder Boss. Daraus leitet sie den bestmöglichen restlichen Build ab. Die Ausrüstung ist die Grundlage; nicht der passive Skilltree bestimmt die Ausrüstung.

## 3. Vollständiger langfristiger Projektplan

### Grundprinzip und Eingaben

Die Engine analysiert Klasse, Aszendenz, Charakterlevel, Ausrüstungsaffixe, Waffen-Set 1 und 2, optional eine Hauptfertigkeit sowie das Ziel Ausgeglichen, Mapping oder Boss.

### Geplante Engine-Ausgaben

- Beste Hauptfertigkeit, weitere Fertigkeitsgems, kompatible Unterstützungsgems und deren optimale Kombination
- Optimale Belegung und Nutzung beider Waffen-Sets
- Optimaler passiver Skilltree mit effizienten Pfaden und waffen-set-spezifischen Knoten
- Normale Juwele, Cluster-Juwele, Unique-Cluster-Juwele und passende Unique-Gegenstände inklusive Aszendenz-Synergien
- Verbesserbare, schlecht genutzte oder nutzlose Affixe; fehlende Attribute, Widerstände und defensive Schwächen
- Mapping- und Boss-Rotation einschließlich Fertigkeits- und Waffenwechselreihenfolge
- Später gegebenenfalls genaue offensive/defensive Werte und eine detaillierte DPS-Simulation

### Erklärungsprinzip

Jede Empfehlung soll Gründe, Vor- und Nachteile erklären: Auswahl von Haupt- und Zusatzfertigkeiten, Supports, passiven Knoten und Pfaden, Juwelen, Clustern, Uniques und Affix-Verbesserungen. Rotationen sollen Reihenfolge, Waffenwechsel, vorbereitende Effekte, deren Fortbestand und Unterschiede zwischen Mapping und Bossen nachvollziehbar machen.

### Geplanter Bedienablauf

1. Klasse, Aszendenz, Level und Ziel wählen.
2. Ausrüstung über Affixe eingeben und beide Waffen-Sets konfigurieren.
3. Optional eine Hauptfertigkeit wählen.
4. Build berechnen.
5. Hauptfertigkeit, weitere Fertigkeiten, Supports, Juwele/Cluster und passiven Baum anzeigen.
6. Mapping- und Boss-Rotation, Build-Erklärung, Affix-Verbesserungen und Uniques anzeigen.

### Geplante Oberfläche

Eine einzige lange Planer-Seite ohne klassische Homepage: Charakter, Ausrüstung, Fertigkeiten/Supports, normale Juwele, Cluster, Unique-Cluster, passiver Skilltree, Berechnung, Ergebnis, Mapping-Rotation, Boss-Rotation, Erklärung, Affix-Verbesserungen und Unique-Empfehlungen.

### Ausrüstungseingabe

Slots speichern mehrere Affixe mit jeweils einem Wert. Ein anklickbarer Dialog bietet Suche, scrollbare Liste, Auswahl, Hinzufügen und Entfernen. Vollständige Gegenstände können später optional ergänzt werden.

### Passiver Skilltree

Langfristig importiert und füllt die Engine den echten Baum. Er soll ausgewählte Pfade, normale/Notable-/Keystone-Knoten, Juwel- und Cluster-Sockel sowie waffen-set-spezifische Pfade darstellen und per Maus und Touch verschiebbar, zoombar, anklickbar und vergrößerbar sein.

### Geplante Datenquellen

PoE2DB ist als mögliche Hauptquelle deutschsprachiger Daten vorgesehen: Klassen, Aszendenzen, Ausrüstung, Affixe, Skills, Supports, passive Knoten, Juwele, Cluster und Uniques. Vor Nutzung sind Schnittstelle, Nutzungsbedingungen, Importerlaubnis, Normalisierung, lokale Speicherung, Versionierung und Updatepflege zu prüfen. Laufzeitberechnungen sollen keine Live-Abhängigkeit von PoE2DB haben.

### Entwicklungsphasen

1. **Klickbarer Prototyp:** Vite, React, TypeScript, mobile-first, lokale Platzhalterdaten, kompletter Ablauf; keine Engine oder DPS-Berechnung. (Abgeschlossen)
2. **Normalisiertes Datenmodell:** Klassen, Aszendenzen, Slots, Affixe, Skills, Supports, Waffen-Sets, Juwelen/Cluster/Uniques, passive Knoten, Rotationen, Empfehlungen und Erklärungen. (Abgeschlossen)
3. **Spieldatenimport:** Quelle und Importformat prüfen, Importskripte erstellen, normalisieren, validieren und versionieren; keine externe Laufzeitabhängigkeit. (Offizieller Passivbaum begrenzt abgeschlossen; andere echte Daten bleiben bis zur Quellenfreigabe blockiert)
4. **Regelbasierte Ausrüstungsanalyse:** Waffen-/Schadensarten und Tags erkennen, Angriff/Zauber sowie Tempo, Krit, Attribute, Anforderungen und Defensive bewerten, Konflikte und schlecht genutzte Affixe erkennen.
5. **Skill- und Support-Empfehlungen:** Haupt- und Zusatzfertigkeiten sowie Supportkombinationen bewerten; Mapping/Boss und Waffen-Sets berücksichtigen.
6. **Passiver Skilltree:** echten Baum importieren, Knoten/Verbindungen darstellen, Knoten und Pfade inklusive Kosten, Cluster-Effizienz und Waffen-Set-Punkte bewerten; Varianten vergleichen.
7. **Juwele und Cluster:** normale, Cluster- und Unique-Cluster-Juwele samt Sockel-, Pfadkosten und Synergien bewerten.
8. **Unique- und Affix-Empfehlungen:** Aszendenz-Synergien und Build-Enabler erkennen, Rare/Unique vergleichen, fehlende Attribute/Widerstände und bessere Affixe mit Vor-/Nachteilen erläutern.
9. **Rotationen und Erklärungen:** Mapping/Boss, Buffs/Debuffs, Skillreihenfolge, Waffenwechsel, anhaltende Effekte sowie Vorbereitung/Hauptschaden modellieren.
10. **Genauere Berechnungen:** Schaden und Defensive präzisieren, Varianten und Einzeländerungen vergleichen. Eine detaillierte DPS-Simulation beginnt erst bei stabilem Datenmodell, korrekt modellierten Skills, Supports, Affixen, passiven Knoten und Waffen-Sets sowie ausreichenden Referenztests.

### Dauerhaft nicht geplant (ohne neue Anweisung)

Anmeldung, Benutzerkonten, klassische Homepage, Community-Funktionen, öffentliche Build-Datenbank, Cloud-Speicherung, Build-Sharing-Plattform, Trade-API, Preisberechnung, Crafting-Simulator, Forum, soziale Funktionen und unnötige Mehrseiten-Navigation.

## 4. Aktueller Entwicklungsstand

### Aufgabe 5H – isolierte reale Passive-Pipeline abgeschlossen (21. Juli 2026)

- Neues Modul `src/engine/real-passive-pipeline/` verbindet `BuildProfile → passive-targeting → passive-pathfinding → passive-planning`, ohne den bestehenden Haupt-Orchestrator oder die UI anzubinden.
- `pointBudget` ist zwingend und wird nie aus Level, Quest- oder Aszendenzpunkten erfunden.
- Ein expliziter Klassenstart wird gegen `classStartIndex` geprüft; andernfalls muss genau eine offizielle Klassenzuordnung existieren. Namen und Geometrie werden nicht ausgewertet.
- Quellversion und Baumdaten werden vor Ausführung geprüft. Ein vorbereiteter Graph wird wiederverwendet; andernfalls wird der bestehende Graphbuilder genau einmal aufgerufen.
- Acht Stufen protokollieren Status, Codes und Summaries. Targeting- und Planning-Resultate bleiben vollständig erhalten.
- Required-Ziele werden von Baum über Targeting bis Planung einzeln mit ursprünglichen Codes diagnostiziert.
- Die Ausgabeprüfung sichert Referenzen, Eindeutigkeit, Zusammenhang, Budget, Versionsgleichheit und vollständigen Ausschluss von Aszendenzknoten aus normalen Punkten.
- Der kanonische `fnv1a32`-Resultathash enthält keine Laufzeiten, Zeitstempel, Speicher- oder Plattformwerte.
- `optimalityClaim: heuristic` wird unverändert übernommen; globale Optimalität wird nicht behauptet.
- Targeting-Regeln, Pathfinder, Planner, synthetischer Passive Analyzer, Haupt-Orchestrator und UI sind per SHA-256-Grenztest unverändert.
- Isolierte offizielle Messung: vollständiger Lauf mit neuem Graph 2.482,74 ms, mit wiederverwendetem Graph 1.845,79 ms, Targeting 1.558,52 ms, Planning 191,07 ms, zwei Läufe 3.623,40 ms, drei Profile 5.528,99 ms, Heap-Differenz der Gesamtmessung 174,34 MiB.
- Targeting klassifiziert aktuell je Profil erneut. 5H führt bewusst keinen profilübergreifenden Klassifikationscache ein.
- Vollständiger Vertrag: `docs/POE2_REAL_PASSIVE_PIPELINE.md`.

### Aufgabe 5G – begrenzte Passive-Planung abgeschlossen (21. Juli 2026)

- `src/engine/passive-planning/` enthält Typen, Konfiguration, Kandidatenaufbau, Validator, Planner, Fixtures, Exporte sowie Unit-, Boundary- und Performanceprüfungen.
- Der Planer liest nur vorbereitete `PassiveTargetAnalysis`-Ergebnisse und ruft nur `findPassivePath` auf. Targeting, Pathfinder, Passive Analyzer, Orchestrator und UI sind per SHA-256-Vertrag unverändert abgesichert.
- Der Pool wird vor Suchen deterministisch gefiltert und auf 50 begrenzt. Starts, alle Aszendenzknoten, unbekannte Typen, reguläre Juwelsockel, blockierte, ausgeschlossene, zu schwache oder nicht freigegebene Reoptimierungsziele sind ausgeschlossen.
- Required-Ziele werden zuerst validiert und verbunden; Unerreichbarkeit oder Budgetüberschreitung blockiert ausdrücklich.
- Zentrale Werte kombinieren nur vorhandenen Targeting-Score, Profilsynergie, Mapping-/Bosswerte und Confidence. Vorhandene Konflikt-, Unresolved-, Reoptimierungs- und Redundanzfelder erzeugen kontrollierte Abzüge.
- `value-first`, `efficiency-first` und `balanced` verwenden zentrale Gewichte und bewerten nach jeder Auswahl am erweiterten Teilbaum neu.
- Belegte Pfade werden wiederverwendet. Ein exakter Request-Cache verhindert identische Pathfinder-Aufrufe; Ergebniszähler weisen echte Suchen und Treffer aus.
- Aszendenzen bleiben mangels getrenntem Aszendenzbudget außerhalb des Normalplans.
- Die Strategie ist heuristisch und behauptet keine globale Build-, Steiner-Tree- oder kombinatorische Optimalität.
- Sicherheitsgrenzen: 50 Kandidaten, 12 Ziele, 123 normale Punkte, 4.000 Pfadsuchen, 12 optionale Iterationen.
- Messung mit 5.150 Knoten und vorbereitetem Targeting: 10/25/50 Kandidaten in 208,48/415,05/811,32 ms; warmer 25er-Cache 77,58 ms, 0 echte Suchen, 25 Treffer; Heap-Differenz 85,43 MiB.
- Vollständiger Vertrag: `docs/POE2_PASSIVE_PLANNING.md`.

Phase 1 und Phase 2 sind implementiert. Phase 3 besitzt eine geprüfte Offline-Importgrundlage und seit Aufgabe 5C den getrennten offiziellen Passivbaum-Datenbestand; andere echte Daten sind nicht freigegeben. Aufgaben 4A bis 4I und damit Aufgabe 4 insgesamt sind abgeschlossen. Sie lieferten die vollständige synthetische Engine-Kette: Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer, Rotation Generator und templatebasierten Explanation Generator. Dieser erzeugt deutsche Erklärungen und maschinenlesbare Traces ausschließlich aus vorhandenen strukturierten Ergebnissen. Die Engine optimiert nicht neu und berechnet weder Zeiten noch DPS. Aufgabe 5A ergänzt die GitHub-Pages-Konfiguration sowie Engine-UI- und Datenfreigabeaudits. Aufgabe 5B ergänzte das Import-Gate; Aufgabe 5C korrigierte dessen Passivbaumfreigabe eng begrenzt. UI und Engine bleiben getrennt.

## 5. Fertige Funktionen

- Bedienbare Charakter-, Aszendenz-, Level-, Ziel- und Hauptfertigkeitsauswahl
- Zwölf Ausrüstungsslots; Affixdialog mit Suche, Wert, mehreren Affixen und Entfernen
- Sechs Skills mit Rolle, Waffen-Set und fünf sichtbaren Supportplätzen
- Auswahl-/Suchdialoge für normale, Cluster- und Unique-Cluster-Juwele, jeweils entfernbar
- SVG-Testbaum mit markiertem Pfad, Knotentypen, Button-/Rad-Zoom, Pointer-/Touch-Pan und Vollbildmodus
- Deutlich markierte feste Testberechnung mit allen geforderten Ergebnisbereichen und Rotationen
- Dunkles responsives mobile-first Design
- Normalisierte Definitionen und Konfigurationen mit stabilen technischen IDs
- Gemeinsame Quellen-, Versions-, Status- und Tag-Metadaten
- Strukturierte Modifier-, Equipment-, Skill-, Juwel-, Passivbaum-, BuildInput- und BuildResult-Typen
- Reine lokale Datenvalidierung und automatische Vitest-Modelltests
- Quellenbericht unter `docs/DATA_SOURCES.md` mit Primärlinks, Unsicherheiten und ausgeschlossenen Verfahren
- Versioniertes Importmanifest und kanonisches Rohdatenformat für elf Kategorien
- Reine Offline-Pipeline mit deterministischen IDs/Hashes, strukturiertem Bericht und Domänenabbildung
- Künstliche gültige und fehlerhafte Fixtures sowie `npm run import:fixture`
- React-freie Engine-Struktur unter `src/engine/` mit Equipment-first-Datenfluss und zentralem `analyzeBuild`
- Strukturierte Scores, Gründe, harte Verstöße, kontrollierte weiche Kategorien und normiertes `BuildProfile`
- Schnittstellen und künstliche Testlogik für Equipment, Skills, Supports, Passive, Juwele, Uniques, Rotationen und Erklärungen
- Regelbasierter synthetischer Rotation Generator mit Mapping-/Bossplan, zentralen Regeln, expliziten Waffenwechseln, anhaltenden Effekten, strukturierten Bedingungen, Complexity und Confidence
- Regelbasierter deutscher Explanation Generator mit zentralen Templates, vollständigen Traces, Priorisierung, Anzeigenamen-Fallbacks, unbekannten ReasonCodes und verpflichtendem Platzhalterhinweis
- Drei eindeutig synthetische Engine-Fixtures und 20 deterministische Engine-Architekturtests
- Vollständige Architekturdokumentation unter `docs/ENGINE_ARCHITECTURE.md`
- Zentral konfigurierte Equipment-Regeln und Normalisierung für fünf Schadensarten, Mechaniken, Geschwindigkeit, Defensive und künstliche Attribute
- Getrennte Profile für beide Waffen-Sets, kombiniertes Profil, stabile Dominanzen, Set-Differenzen und Spezialisierungen
- Strukturierte Equipment-Konflikte sowie Klassifikation ungenutzter, schwach genutzter und konfliktbehafteter Modifier
- Fünf synthetische Equipment-Fixtures und 36 dedizierte Equipment-Analyzer-Tests
- Zentral konfigurierte Skill-Regeln, harte Kompatibilitätsprüfung und weiche Bewertung für Schadensarten, Mechaniken, Geschwindigkeit, Klasse, Aszendenz und Ziele
- Skillrollen, getrennte Waffen-Set-Scores, Profilnutzung, Confidence sowie gültige/blockierte, Main-, Utility-, Movement-, Mapping- und Bossranglisten
- Zehn künstliche Skill-Kandidaten und 38 dedizierte Skill-Analyzer-Tests
- Zentral konfigurierte Support-Regeln für Tags, Schadensarten, Mechaniken, Rollen, Waffen, Ziele, Profile und Trade-offs
- Einzelne Support-Empfehlungen mit Set-Scores, Confidence sowie gültigen/blockierten und fünf kategorisierten Ranglisten
- Zehn künstliche Support-Kandidaten und 33 dedizierte Support-Analyzer-Tests
- Dreizehn synthetische Passive-Kandidaten für Einzelknoten, Keystones, Ascendancy und kleine Cluster
- Vereinfachte Graphprüfung, Pfadkosten, scorePerPoint, Path-Efficiency, Set-Scores, Redundanz, Konflikte, Confidence und acht Ranglisten
- 36 dedizierte Passive-Analyzer-Tests
- Vierzehn synthetische Juwelkandidaten und 47 dedizierte Jewel-Analyzer-Tests
- Getrennte Normal-/Cluster-/Unique-Cluster-Bewertung mit Sockeln, Kosten, Effizienz, Enablern, Trade-offs und dreizehn Ranglisten

## 6. Teilweise fertige Funktionen

- Baum und Empfehlungen demonstrieren nur spätere Interaktionen; sie nutzen keine echten Spieldaten.
- Skills zeigen feste Support-Testdaten; freie Skill-/Supportbearbeitung ist noch nicht vorgesehen.
- `BuildInput` ist vollständig typisiert, wird von der Platzhalterberechnung aber noch nicht verarbeitet.
- Der offizielle PoE2-Passivbaumexport ist technisch geeignet, aber Lizenz-/Asset- und Weiterverteilungsfragen sind vor echtem Import noch zu klären.

## 7. Noch offene Aufgaben

- Freigabe, Attribution und zulässigen Importumfang für echte Quellen klären
- Einen echten, eng begrenzten Importadapter erst nach Quellenfreigabe implementieren
- Nach der Pages-Veröffentlichung die öffentliche Version gemeinsam mobil prüfen und gezielt überarbeiten
- Referenztests und automatisierte UI-Tests ausbauen
- Barrierefreiheit mit spezialisiertem Audit prüfen
- Echte PoE2-Daten erst nach Quellen-/Lizenzprüfung importieren

## 8. Bekannte Bugs

Zum dokumentierten Stand sind nach automatischen Tests sowie Desktop- und Mobilprüfung keine reproduzierbaren Bugs bekannt. Einschränkungen der Platzhalter- und Fixture-Logik sind keine fertigen Produktfunktionen.

## 9. Letzte Änderungen

- Erstes Vite-/React-/TypeScript-Projekt erstellt
- Vollständigen klickbaren Phase-1-Ablauf und responsive Gestaltung implementiert
- README und offizielles Projektgedächtnis angelegt
- Einzelne Modelldatei durch `src/domain/` mit normalisierten Definitionen und Konfigurationen ersetzt
- Sämtliche Platzhalterdaten auf stabile IDs, gemeinsame Metadaten und kontrollierte Tags migriert
- Datenvalidierung und sieben Vitest-Tests ergänzt; UI auf ID-basierte Auflösung umgestellt
- PoE2DB, offizielle GGG-API, GGG-Nutzungsbedingungen und offiziellen PoE2-Passivbaumexport anhand von Primärseiten geprüft
- Datenherkunftsmetadaten, Importmanifest, kanonisches Rohdatenformat und reine Importpipeline ergänzt
- Künstliche Fixtures, strukturierte Fehler-/Importberichte, deterministische Hashes/IDs und zwölf Pipeline-Tests ergänzt
- Remote-Synchronisation nach einer widersprüchlichen GitHub-Webcache-Anzeige erneut geprüft: `git fetch origin` bestätigte Aufgabe-3-Commit `01dc66e61f77271a4fb884b37ae7144951ada3ac` auf `origin/main`; GitHub-API und unveränderliche Raw-SHA-URLs bestätigten die öffentlichen Pflichtdateien. Es war kein History-Eingriff und kein Force-Push erforderlich.
- Aufgabe 4A umgesetzt: eigenständige Engine-Ordnerstruktur, zentrale Typen, getrennte harte/weiche Regeln, normiertes BuildProfile, alle geforderten Analyzer-Schnittstellen, strukturierte Rotation/Erklärung und Orchestrator in verbindlicher Reihenfolge ergänzt
- Drei künstliche Engine-Fixtures, 20 Engine-Tests und `docs/ENGINE_ARCHITECTURE.md` ergänzt; README auf den Platzhalterstatus aktualisiert
- Aufgabe 4B umgesetzt: zentrales Regel-/Konfigurationsmodell, nachvollziehbare Normalisierung, vollständiger synthetischer Equipment-Bericht, Waffen-Set-Analyse, Konflikte und Modifier-Nutzung ergänzt
- Equipment-Fixtures auf fünf Szenarien erweitert und 36 dedizierte Equipment-Tests ergänzt; Architektur und README abgeglichen
- Aufgabe 4C umgesetzt: Skill-Domäne gezielt optional erweitert, zentrale Regeln/Konfiguration, harte Ausschlüsse, weiche Kategorien, Zielgewichtung, Rollen, Set-Eignung, Confidence und Ranglisten ergänzt
- Zehn künstliche Skill-Kandidaten und 38 Skill-Analyzer-Tests ergänzt; Support Analyzer fachlich unverändert gelassen
- Aufgabe 4D umgesetzt: Support-Domäne gezielt optional erweitert, zentrale Regeln/Konfiguration, harte Kompatibilität, weiche Kategorien, Zielgewichtung, Trade-offs, Set-Eignung, Confidence und Ranglisten ergänzt
- Zehn künstliche Support-Kandidaten und 33 Support-Analyzer-Tests ergänzt; Skill und Passive Analyzer fachlich unverändert gelassen
- Aufgabe 4E umgesetzt: Passive-Domäne, zentrale Regeln/Konfiguration, Einzelknoten-/Clusterbewertung, Graphvalidierung, Pfadkosten, Trade-offs, Set-Eignung, Redundanz, Konflikte, Confidence und Ranglisten ergänzt
- Dreizehn synthetische Passive-Kandidaten und 36 Passive-Analyzer-Tests ergänzt; Jewel-, Unique- und Rotationsmodule unverändert gelassen

## 10. Zuletzt getestete Bereiche

Am 20. Juli 2026 nach Abschluss von Aufgabe 3 erfolgreich geprüft:

- `npm install`: Bestand aktuell, 191 Pakete geprüft, 0 gemeldete Schwachstellen; keine neue Abhängigkeit
- `npm run import:fixture`: 23 künstliche Datensätze, 0 verworfen, Status `fixture`, keine Fehler
- `npm run test`: zwei Testdateien, 19 Tests erfolgreich; die bestehenden sieben Domänentests bleiben enthalten
- `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich
- Entwicklungsserver startet fehlerfrei und liefert die Planer-Seite direkt aus
- Charakter: Klassenwechsel auf Zauberin aktualisiert die sichtbaren Aszendenzoptionen
- Affixdialog: Suche nach „Widerstand“, Feuerwiderstand hinzugefügt und wieder entfernt
- Normale Juwelauswahl weiterhin bedienbar
- Sechs Skills und 30 Supportplätze sichtbar
- Testberechnung zeigt weiterhin alle 14 geforderten Ergebnisgruppen
- Skilltree: sieben Testknoten sichtbar, Button-Zoom von 100 auf 120 Prozent
- Desktopdarstellung bei 1280 × 800 und Mobilansicht bei 390 × 844; zwölf Equipment- und sechs Skill-Slots vorhanden, kein horizontaler Überlauf
- Browserkonsole ohne Warnungen oder Fehler
- Repository-Dateiliste auf versehentliche HTML-Dumps, fremde Assets und echte Datenbestände geprüft; keine gefunden
- Nachbesserungsprüfung erneut vollständig ausgeführt: `npm install`, `npm run import:fixture`, `npm run test`, `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich; UI auf Desktop und 390-Pixel-Mobilbreite erneut geprüft, Browserkonsole ohne Warnungen oder Fehler

Touch-Pan wurde durch die gemeinsame Pointer-Event-Implementierung und mobile Layoutprüfung abgedeckt, jedoch nicht auf einem physischen Touchgerät ausgeführt.

Am 20. Juli 2026 nach Aufgabe 4A zusätzlich erfolgreich geprüft:

- lokaler Abhängigkeitsbestand wiederhergestellt; keine neue Abhängigkeit in `package.json` oder `package-lock.json`
- `npm run import:fixture`-äquivalenter lokaler Skriptlauf: 23 künstliche Datensätze, 0 verworfen, keine Fehler
- `npm run test`: drei Testdateien und 39 Tests erfolgreich, einschließlich 20 neuer Engine-Tests
- `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich; 37 Module gebaut
- App startet unverändert direkt mit dem Planer; Charakterwechsel, Affixdialog, normale Juwelauswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren
- Desktop bei 1280 Pixeln und Mobil bei 390 × 844 geprüft; 14 Ergebnisgruppen, sechs Skills und sieben Testbaumknoten sichtbar, kein horizontaler Überlauf
- Browserkonsole ohne Warnungen oder Fehler
- `src/engine/` enthält keine React-Imports, Netzwerkzugriffe, echten PoE2-Daten oder DPS-Formeln
- Nicht auf physischem Touchgerät geprüft; Touch-Pan bleibt durch Pointer-Events und mobile Layoutprüfung abgedeckt

Am 20. Juli 2026 nach Aufgabe 4B zusätzlich erfolgreich geprüft:

- 75 reguläre Tests in vier Dateien erfolgreich, davon 36 dedizierte Equipment-Analyzer-Tests; bestehende 39 Tests bleiben erfolgreich
- Import-Fixture, Lint, Typecheck und Produktions-Build erfolgreich
- Charakterauswahl, Affixdialog, normale Juwelauswahl, Test-Skilltree und Platzhalterberechnung auf Desktop und 390 × 844 weiterhin funktionsfähig
- Kein horizontaler Überlauf und keine neuen Browserkonsolenfehler
- Equipment-Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten oder DPS-/Schadensformeln
- Nicht auf physischem Touchgerät geprüft; keine automatisierten Browser-Regressionstests vorhanden

Am 20. Juli 2026 nach Aufgabe 4C zusätzlich erfolgreich geprüft:

- 113 reguläre Tests in fünf Dateien erfolgreich, davon 38 dedizierte Skill-Analyzer-Tests; bestehende 75 Tests bleiben erfolgreich
- Import-Fixture, Lint, Typecheck und Produktions-Build erfolgreich
- Charakterauswahl, Affixdialog, normale Juwelauswahl, Test-Skilltree und Platzhalterberechnung auf Desktop und 390 × 844 weiterhin funktionsfähig
- Kein horizontaler Überlauf und keine neuen Browserkonsolenfehler
- Skill Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten oder DPS-/Schadensformeln
- Support Analyzer gegenüber Aufgabe 4A fachlich und dateiseitig unverändert
- Nicht auf physischem Touchgerät geprüft; keine automatisierten Browser-Regressionstests vorhanden

Am 20. Juli 2026 nach Aufgabe 4D zusätzlich erfolgreich geprüft:

- 146 reguläre Tests in sechs Dateien erfolgreich, davon 33 dedizierte Support-Analyzer-Tests; bestehende 113 Tests bleiben erfolgreich
- Installation mit unverändertem Lockfile, Import-Fixture (23 importiert, 0 verworfen), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Support Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten, kombinatorische Supportauswahl oder DPS-/Schadensformeln
- Skill und Passive Analyzer fachlich und dateiseitig unverändert
- Charakterwechsel auf Zauberin, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop bei 1280 × 800 und Mobil bei 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf physischem Touchgerät geprüft; Touch-Verhalten bleibt durch Pointer-Events und mobile Layoutprüfung abgedeckt

Am 20. Juli 2026 nach Aufgabe 4E zusätzlich erfolgreich geprüft:

- 182 reguläre Tests in sieben Dateien erfolgreich, davon 36 dedizierte Passive-Analyzer-Tests; bestehende 146 Tests bleiben erfolgreich
- Installation unverändert; Fixture-Import (23 importiert, 0 verworfen), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Passive Engine ohne React, Netzwerk, echte PoE2-Daten, globale Baum-/Pfadsuche oder DPS-Formeln
- Skill-, Support-, Jewel-, Unique- und Rotationsmodule fachlich unverändert
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop bei 1280 × 800 und Mobil bei 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf physischem Touchgerät geprüft; Pointer-Events und mobile Layoutprüfung decken das Touch-Verhalten indirekt ab

Am 20. Juli 2026 nach Aufgabe 4F zusätzlich erfolgreich geprüft:

- 229 reguläre Tests in acht Dateien erfolgreich, davon 47 dedizierte Jewel-Analyzer-Tests; bestehende 182 Tests bleiben erfolgreich
- Fixture-Import (23/0), Lint, Typecheck und Build mit 37 Modulen erfolgreich
- Keine kombinierte Sockelbelegung, echten Daten, DPS oder Änderungen an normalen Unique-, Rotation- und Explanation-Modulen
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren; Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf, Konsole fehlerfrei

Am 20. Juli 2026 nach Aufgabe 4G zusätzlich erfolgreich geprüft:

- 279 reguläre Tests in neun Dateien erfolgreich, davon 50 dedizierte Unique-Analyzer-Tests; bestehende 229 Tests bleiben erfolgreich
- Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Keine kombinierte Unique-Optimierung, Neuoptimierung, echten Daten, Preise, Trade-API oder DPS
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren; Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf, Konsole fehlerfrei

Am 20. Juli 2026 nach Aufgabe 4H zusätzlich erfolgreich geprüft:

- 318 reguläre Tests in zehn Dateien erfolgreich, davon 39 dedizierte Rotation-Generator-Tests; bestehende 279 Tests bleiben erfolgreich
- Zwölf synthetische Rotations-Fixtures für Mapping, Boss, Waffenwechsel, Effekte, fehlende Rollen, Complexity, `both` und Build-Enabler
- Installation unverändert; Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer sowie Explanation Generator fachlich unverändert
- Keine freie Textgenerierung, echten Daten, Netzwerkzugriffe, DPS-, Cooldown- oder Zeitsimulation und keine UI-Anbindung
- Charakterwechsel auf Zauberin, Helm-Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf einem physischen Touchgerät geprüft; mobile Breite und Pointer-basierte bestehende Bedienung wurden indirekt abgedeckt

Am 20. Juli 2026 nach Aufgabe 4I zusätzlich erfolgreich geprüft:

- 358 reguläre Tests in elf Dateien erfolgreich, davon 40 dedizierte Explanation-Generator-Tests; bestehende 318 Tests bleiben erfolgreich
- Elf synthetische Explanation-Szenarien für klare und widersprüchliche Profile, Rotation, Waffenwechsel, Enabler, Blockierungen, unbekannte Codes und Namens-Fallbacks
- Zentrale deutsche Templates und Confidence-Texte; jede Erklärung besitzt genau einen maschinenlesbaren Trace
- Unbekannte ReasonCodes und fehlende Anzeigenamen werden sichtbar gemeldet; synthetischer Begrenzungshinweis ist immer vorhanden
- Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer sowie Rotation Generator fachlich unverändert
- Keine freie Textgenerierung, KI-/LLM-Anbindung, echten Daten, Netzwerkzugriffe, DPS-, Cooldown- oder Zeitsimulation und keine UI-Anbindung
- Installation unverändert; Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Charakterwechsel auf Zauberin, Helm-Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf einem physischen Touchgerät geprüft; mobile Breite und bestehende Pointer-Bedienung wurden indirekt abgedeckt

## 11. Wichtige Architekturentscheidungen

### Aufgabe 5B – verbindliche Quellenprüfung und Import-Gate

- Geprüft wurden GGG Developer Docs/API/Terms, der offizielle PoE2-Passivbaumexport, RePoE-PoE2, PoE2DB, nicht dokumentierte Endpunkte/Spieldateien und manuelle Erfassung. Belege und Interpretationsgrenzen stehen in `docs/DATA_SOURCE_REFERENCES.md`.
- `data-sources/source-approval.json` ist die maschinenlesbare Wahrheit für Quellenstatus, zehn kontrollierte Bedingungen, Kategoriezuordnungen, globale Sperren und Review-Trigger. Sie enthält ausschließlich Metadaten, keine Spieldaten.
- Historischer 5B-Stand: Nur `local-synthetic-fixtures` war `approved`; GGG-Baumexport, RePoE und PoE2DB waren damals `blocked`. Spätere eng begrenzte Entscheidungen für Baumexport und 5M.0-Affixscope stehen am Anfang dieses Protokolls und in der maschinenlesbaren Approval-Datei.
- Keine der 24 geprüften echten Datenkategorien ist freigegeben. Bilder/Icons sind separat blockiert. Technische Erreichbarkeit, öffentliche Git-Repositories oder die Lizenz eines Extraktionswerkzeugs gelten nicht als Datenlizenz.
- `src/import/approval.ts` enthält Approval-Typen, JSON-Parser, strukturelle Validierung und `evaluateImportApproval`. Der Guard ist rein, deterministisch und netzwerkfrei. Fehlende/ungültige Dateien, unbekannte Quellen/Kategorien, nicht freigegebene Status, falsche Zuordnung und unerfüllte Bedingungen blockieren; synthetische Fixtures bleiben unabhängig erlaubt.
- Aufgabe 5C darf noch keinen echten Import implementieren. Zuerst ist eine schriftliche, kategorienbezogene Erlaubnis erforderlich. Bevorzugtes enges Klärungsziel ist der offizielle Passivbaumexport ohne Assets, einschließlich Release-Abruf, lokaler Speicherung, normalisierter Ableitungen, öffentlicher Repository-/Pages-Weiterverteilung, Attribution und kommerzieller Einordnung.
- Keine echten Daten wurden geladen oder eingecheckt, kein Scraper/Crawler implementiert, keine Quelle praktisch abgerufen, keine neue Abhängigkeit ergänzt und Engine/UI fachlich nicht verändert.
- Automatische 5B-Prüfung: 372 reguläre Tests in zwölf Dateien, darunter 14 Approval-/Guard-Tests; Fixture-Import 23 Datensätze/0 verworfen; Lint, Typecheck und Pages-Produktionsbuild erfolgreich. Approval-Datei mit sieben Quellen und 24 Kategorien erfolgreich validiert; Artefakt ohne lokale Windows-Pfade oder bekannte Secret-Muster, Guard ohne Netzwerkcode.

### Aufgabe 5A – Deployment- und Auditstand

- GitHub Pages wird aus `main` über `.github/workflows/deploy-pages.yml` mit ausschließlich offiziellen GitHub-Actions gebaut und veröffentlicht. Der Workflow nutzt minimale Berechtigungen (`contents: read`, `pages: write`, `id-token: write`), das Environment `github-pages` und eine Concurrency-Gruppe mit Abbruch veralteter Läufe.
- Maßgeblicher Paketmanager ist npm wegen `package-lock.json`; CI verwendet Node 22 und `npm ci`. Es wurde kein weiteres Lockfile und keine Abhängigkeit ergänzt.
- Vite verwendet im Produktions-Build zentral `/poe2-equipment-build-planner/`, lokal weiterhin `/`. Das Build-Skript benennt `vite.config.ts` explizit, damit eine veraltete ignorierte JavaScript-Ausgabe die Pages-Konfiguration nicht übersteuern kann.
- Die öffentliche URL `https://saxxxos.github.io/poe2-equipment-build-planner/` ist erreichbar. Die zuvor fehlende Pages-Aktivierung wurde extern vorgenommen; am 20. Juli 2026 wurden Seite, JavaScript/CSS, Reload und Kerninteraktionen auf der echten Pages-Domain bestätigt.
- `docs/ENGINE_UI_INTEGRATION_AUDIT.md` dokumentiert den tatsächlichen React-State, den `analyzeBuild`-Vertrag, Datenherkunft, Validierungs- und Fehlergrenzen, die geplante Adapterkette, Ergebniszuordnung sowie bewertete Integrationsrisiken. Empfohlen ist nach dem UI-Redesign nur ein kleiner vertikaler Adapter-Schnitt; Engine-Typen bleiben außerhalb der React-Komponenten.
- `docs/DATA_SOURCE_RELEASE_AUDIT.md` dokumentiert Pipeline, vollständige Datenbedarfsmatrix, mögliche Quellen, offene Lizenz-/Zugriffs-/Attributionsfragen und die verbindliche Freigabecheckliste. Der Gesamtstatus echter PoE2-Daten ist `blocked`; PoE2DB wurde nicht aufgerufen, es wurden keine externen Daten heruntergeladen oder importiert.
- Die sichtbare Berechnung bleibt ein Platzhalter und ruft `analyzeBuild` nicht auf. Es wurden weder Analyzer, Preise, DPS, Cooldowns, Zeitmodelle noch fachliche Regeln verändert.
- 5A-Prüfung: Fixture-Import mit 23 synthetischen Datensätzen und 0 Verwerfungen; 358 reguläre Tests in elf Dateien, Lint, Typecheck und Produktions-Build erfolgreich. Der gebaute HTML-Einstieg referenziert JavaScript und CSS unter `/poe2-equipment-build-planner/assets/`; keine lokalen Windows-Pfade, bekannten Schlüssel-/Tokenmuster oder eingecheckten Build-Artefakte gefunden. GitHub bestätigte `npm ci` und Build. Öffentliches Deployment und Pages-Browser-Smoke-Tests bleiben bis zur einmaligen Aktivierung ungetestet und dürfen nicht als erfolgreich gelten.
- Der Produktionsbuild wurde zusätzlich in einer lokalen statischen Project-Pages-Verzeichnisstruktur geprüft. Bei 390 × 844 (effektive Dokumentbreite 375 Pixel) und 1280 × 800 (effektive Dokumentbreite 1265 Pixel) entsprach `scrollWidth` jeweils `clientWidth`; es gab keine Browserkonsolenfehler. Klasse/abhängige Aszendenz, Level, Ziel, Affixdialog und -suche, Hinzufügen/Entfernen eines Affixes, Waffen-Set-Auswahl, Rubinjuwel-Auswahl, Testbaum-Zoom auf 120 Prozent und Platzhalterberechnung funktionierten. JavaScript und CSS wurden über den Pages-Unterpfad geladen; ein Reload der statischen Projekt-URL funktionierte.
- Öffentlicher Smoke-Test am 20. Juli 2026: Charakterwechsel auf Zauberin aktualisiert die Aszendenz, Affixdialog/-suche, Rubinjuwel-Auswahl, Testbaum-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren. JavaScript/CSS laden unter dem Repository-Unterpfad; Mobil (390 × 844, effektive Breite 375) und Desktop (1280 × 800, effektive Breite 1265) ohne horizontalen Überlauf oder Konsolenfehler. Nicht auf einem physischen Touchgerät getestet.
- Bekannte Risiken: umfangreiche Engine-Ergebnisse benötigen später ViewModels; UI- und Engine-IDs sowie nicht im App-State gehaltene Juweldaten müssen vor einer Integration normalisiert werden; echte Daten bleiben bis zur dokumentierten Freigabe gesperrt.

- Eine React-Einzelseite ohne Router, Backend, Datenbank oder Authentifizierung
- Lokaler React-State; normalisierte Platzhalterdaten zentral in `src/data.ts`
- Flache Domänenstruktur in `src/domain/` mit Barrel-Export; Definitionen sind von konkreten Konfigurationen getrennt
- Anzeigenamen sind keine Primärschlüssel; Beziehungen speichern stabile String-IDs
- Gemeinsame `GameDataMetadata` modellieren Quelle, Version, Status und kontrollierte Mechanik-Tags
- Keine Laufzeit-Validierungsbibliothek; reine TypeScript-Funktionen liefern verständliche Fehlerlisten
- Vitest ist die einzige für Aufgabe 2 neu hinzugefügte Testabhängigkeit
- Importformat ist eine Entkopplungsgrenze: externe Strukturen dürfen weder UI noch Engine direkt erreichen
- Importpipeline ist rein, netzwerkfrei und dateisystemfrei; der CLI-Testlauf nutzt die vorhandene Vitest-Toolchain, daher keine neue Abhängigkeit
- FNV-1a-32 dient als reproduzierbare Integritätskennung, nicht als kryptografischer Sicherheitsnachweis
- Importfehler sind strukturierte `ImportIssue`-Objekte und werden niemals stillschweigend ignoriert
- Echte PoE2DB-Daten bleiben blockiert, bis Abruf, Speicherung, Attribution und Weiterverteilung ausdrücklich geklärt sind
- Der offizielle GGG-Passivbaumexport ist der bevorzugte technische Kandidat für einen späteren eng begrenzten Import; Rechte und Assets bleiben vorab zu klären
- Reines CSS ohne UI-Bibliothek; SVG für den Demonstrationsbaum
- Keine externen APIs oder geschützten Spielgrafiken
- Engine und UI sind strikt getrennt; `src/engine/` importiert ausschließlich Domänentypen und besitzt keine React-Abhängigkeit
- Verbindlicher Engine-Datenfluss: Equipment, BuildProfile, Skills, Supports, Passive, Juwele, Uniques, Rotationen, Erklärungen, BuildAnalysis
- Harte Regeln sind blockierende `ConstraintViolation`; weiche Regeln verwenden ausschließlich zentral definierte Bewertungskategorien
- `BuildProfile` nutzt normierte Affinitäten im dokumentierten Bereich 0 bis 100 und enthält keine realen Spiel- oder DPS-Werte
- Empfehlungen werden deterministisch nach Score und bei Gleichstand nach technischer ID sortiert
- Orchestrator und Analyzer verwenden in Aufgabe 4A ausschließlich übergebene synthetische Kandidaten und keine Datei-, Zeit-, Zufalls- oder Netzwerkabhängigkeit
- Equipment-Regeln und sämtliche fachlichen Schwellen sind zentral in `rules.ts` und `config.ts`; die Normalisierung liegt in einer reinen Funktion
- Direkte Equipment-Hinweise werden stärker gewichtet als indirekte; jede Contribution bleibt über strukturierte Reason-Details nachvollziehbar
- Waffen-Sets werden separat und kombiniert analysiert, ohne Rotationslogik aus Aufgabe 4H vorwegzunehmen
- Equipment-Konflikte sind weiche Warnungen; nur technisch unbekannte Modifier-Referenzen blockieren als harte Verstöße
- Dominanz-Gleichstände werden deterministisch nach technischer ID beziehungsweise bei Waffen-Sets als `balanced` aufgelöst
- Skill-Regeln und Schwellen liegen zentral in `src/engine/skills/rules.ts` und `config.ts`; Skill-Metadaten wurden nur optional erweitert
- Blockierte Skills bleiben erklärbar sichtbar, werden jedoch stets hinter gültigen Kandidaten sortiert
- `profileClarity` beeinflusst Confidence getrennt vom Score; Zielprofile beeinflussen Mapping-/Bossranglisten über synthetische Gewichte
- Skill-Set-Scores erzeugen nur Eignungshinweise und nehmen keine Rotationslogik vorweg
- Support-Regeln, Schwellen, Trade-off-Gewichte und Normalisierung liegen zentral in `src/engine/supports/rules.ts` und `config.ts`
- Jeder Support wird unabhängig gegen den bereits ausgewählten Skill bewertet; es gibt bewusst keine kombinatorische Suche
- Blockierte Supports bleiben erklärbar sichtbar, sind aber nicht auswählbar und stehen hinter gültigen Kandidaten
- Set-Eignung und Confidence sind vom Gesamtscore getrennte Ausgaben; technische IDs entscheiden jeden Ranglisten-Gleichstand
- Passive-Regeln und Schwellen liegen zentral in `src/engine/passives/rules.ts` und `config.ts`
- Die Graphprüfung validiert ausschließlich den übergebenen Kandidatenpfad; es gibt keine alternative, kürzeste oder globale Pfadsuche
- `scorePerPoint` und `pathEfficiencyScore` sind getrennte synthetische Effizienzsignale; Pfadknoten bleiben explizite Kosten und können eigenen Nutzen beitragen
- Jewel- und Cluster-Sockel sind nur Anschlusswerte und lösen keine Juwelbewertung aus
- Rotationsregeln und sämtliche Schwellen liegen zentral in `src/engine/rotations/rules.ts` und `config.ts`; der Generator liest vorgelagerte Ergebnisse ausschließlich
- Waffenwechsel sind explizite Schritte und entstehen nur zwischen unterschiedlichen konkreten Sets; `both` löst keinen Wechsel aus
- Maintenance, Wiederholung, Complexity und Confidence sind strukturierte, voneinander getrennte Ausgaben ohne echte Zeitwerte oder Qualitätsbehauptung
- Erklärungstemplates, Prioritäten und Confidence-Formulierungen liegen zentral unter `src/engine/explanations/`; Analyzer liefern weiterhin ausschließlich strukturierte Daten
- Jede Erklärung besitzt einen deterministischen Trace; unbekannte Codes verschwinden nie stillschweigend und fehlende Anzeigenamen verwenden nur technische IDs
- Der verpflichtende Begrenzungshinweis basiert auf einem kontrollierten Template und nennt synthetische Regeln, fehlende echte Daten, fehlende DPS und fehlende fachliche Verifikation

## 12. Nächste empfohlene Aufgabe

Aufgabe 5B gibt noch keine Aufgabe 5C mit echtem Import frei. Zuerst eine schriftliche, kategorienbezogene Freigabe für den offiziellen PoE2-Passivbaumexport ohne Assets einholen. Sie muss automatisierten Release-Abruf, lokale Speicherung, normalisierte Ableitungen, öffentliche Repository-/Pages-Weiterverteilung, Attribution und kommerzielle Einordnung beantworten. Nur bei positiver dokumentierter Antwort darf ein neuer Auftrag 5C auf Passive Nodes, Passive Connections und Jewel Sockets eines fest gepinnten Releases begrenzt werden. Unabhängig davon bleibt die gemeinsame mobile UI-/Designüberarbeitung eine zulässige, getrennte Folgeaufgabe.

## 13. Übergabe für einen neuen Chat

Zuerst Quellcode und dieses Protokoll vergleichen; der Code gewinnt. Danach `data-sources/source-approval.json`, `docs/DATA_SOURCE_APPROVAL.md`, Belege, Import-Fixture, Tests, Lint, Typecheck und Build prüfen. Alle Analyzer, Rotation und Explanation besitzen getrennte Regel-/Template-Module und zentrale Konfigurationen. Der Approval-Guard ist eine vorgeschaltete, reine Sperre; er ist noch mit keinem echten Importer verbunden, weil es keinen echten Importer gibt. Keine echte Kategorie ist freigegeben. Vor Aufgabe 5C muss eine schriftliche Freigabe dokumentiert und die maschinenlesbare Entscheidung geprüft geändert werden. Engine und UI bleiben getrennt; Fixtures und Regeln sind künstlich und keine echten Spieldaten, Zeit-/DPS-Simulation, kombinierte Optimierung, Preise oder fachlich verifizierte Empfehlung.

## Aufgabe 5M.1A – Itemmod-Vollständigkeitsaudit (22. Juli 2026)

- 5M.1 bleibt technisch abgeschlossen, ist aber kein vollständiger PoE2-Itemmod-Bestand. Der Pin enthält 16.678 rohe Mods und 3.450 klassenübergreifende `mods_by_base`-Referenzen; die feste 29-Klassen-Auswahl plus deren Basistyp-Implicits ergibt unverändert 1.828 Records.
- Alle Records sind kategorisiert: 816 Prefixe, 568 Suffixe, 231 Basis-Implicits, 103 Corruption-Implicits und 110 Corruption-Upgrades; kein Special bleibt unresolved.
- Nachgewiesene Filterlücken sind unter anderem Jewels (446 eindeutige Referenzen), Charms (51), Life Flasks (57), Mana Flasks (52) und Relics (137). Wegen Überschneidungen nicht addieren.
- Unique-Items/Unique-Modzeilen, Runen, Soul-Core-Effekte und weitere Spezialkategorien bleiben fachlich beziehungsweise approval-seitig offen. Keine unbekannte Gesamtzahl schätzen.
- 51 Topic-Repositories wurden inventarisiert; die vertieften Quellen wurden commit-genau nur als Auditkontrollen geprüft.
- Maßgeblich sind `docs/POE2_ITEM_MOD_COMPLETENESS_AUDIT.md` und die drei JSON-Berichte. Die neun generierten 5M.1-Dateien und `data-sources/source-approval.json` bleiben bytegleich.
- Keine Approval-Erweiterung, deutschen Texte oder UI-/Engine-/Workeränderung. 5M.1B, 5M.2 und 5N wurden nicht begonnen. Physische iPhone-Abnahme bleibt offen.
- Nächster Schritt: 5M.1B.0 für getrennte technische Scope-/Quellenentscheidungen; Lokalisierung erst nach stabiler technischer Ziel-ID-Menge.

## Aufgabe 5M.1B.0A – zusätzliche Itemklassen (22. Juli 2026)

- RePoE-Pin bleibt `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81`.
- `poe2-technical-jewel-mod-data-for-build-planner`: conditionally-approved nur für 142 normale Prefix- und 178 normale Suffix-IDs; Unique-/corrupted-Sides, Radius-/Passive- und Clustermechaniken blockiert.
- `poe2-technical-charm-mod-data-for-build-planner`: conditionally-approved für 27 Prefixe, 24 Suffixe, 13 basistypreferenzierte Implicits und minimale technische Basiswerte; keine Trigger-/Ladungssimulation.
- `poe2-technical-flask-mod-data-for-build-planner`: conditionally-approved für Life Flasks (33/24) und Mana Flasks (28/24) plus minimale Basiswerte; Kategorien getrennt, keine Flask-Simulation/Quality/Enchantments.
- `poe2-technical-relic-mod-data-for-build-planner`: pending/deferred; 137 IDs liegen ausschließlich in `sanctum_relic`, keine normale Equipmentarchitektur.
- Der Guard prüft bei neuen Scopes Pins, Itemkategorie, Datei, Felder, Negativkategorien, SHA-256-Manifest, Determinismus, Rohspiegel, Runtime-Abruf und Hotlinks. Der bestehende 5M.1-Scope bleibt unverändert.
- Kein Import, keine neuen produktiven Itemklassen, keine UI-, BuildProfile-, Worker-, Analyzer-, Engine- oder Orchestratoränderung. Keine deutschen Texte.
- Uniques bleiben getrennt gesperrt. Runen, Soul Cores, Desecrated, Mutated und andere Spezialmods benötigen getrennte Folgeentscheidungen. 5M.1B, 5M.1B.0B, 5M.1B.0C, 5M.2 und 5N nicht begonnen; iPhone-Abnahme offen.
- Später getrennt: Fotoerkennung, ID-basierter Übersetzungs-Lernmodus, Buildvergleich vorher/nachher und Designoptimierung.
- Nächster Schritt: 5M.1B als technischer, getrennter Import nur der freigegebenen Jewel-/Charm-/Life-/Mana-Flask-Daten; Relics ausschließen.

## 14. Arbeitsregeln des Projekts

## Aufgabe 5M.1 – technischer Affiximport (22. Juli 2026)

- RePoE-PoE2 `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81`, ist ausschließlich im bedingten Scope `poe2-technical-affix-data-for-build-planner` importiert.
- Der minimierte Bestand enthält 1.828 Mods, 445 Familien, 1.828 Tiers, 2.265 Statzeilen, 416 Mehrzeiler/Hybride, 29 Itemklassen und 201 Konfliktgruppen; kein Rohdatenspiegel und keine PoE2DB-Daten.
- UI-Auswahl verwendet technische Itemklasse, Prefix/Suffix, Item Level, Wertebereiche und Konfliktgruppen. Alle sichtbaren technischen Fallbacks sind `translation-missing` und als „Deutsche Übersetzung noch nicht verfügbar“ gekennzeichnet.
- Offene Aufgabe 5M.2: ID-basierte deutsche Affixlokalisierung und vollständige deutsche Affixsuche. Ebenfalls offen bleiben vollständige reale Skill-/Supportdaten, deutsche Skill-/Supporttexte, echte vollständige Buildabnahme, Buildvergleich, Fotoerkennung und Designoptimierung.
- Aufgabe 5M insgesamt ist noch nicht abgeschlossen. 5N wurde nicht begonnen. Physische iPhone-Abnahme des 5M.1-Stands ist offen.

- Ausschließlich im verbundenen Repository arbeiten; `main` ist der Standardbranch.
- Quellcode ist die maßgebliche Wahrheit; keine erfundenen Funktionen oder Tests dokumentieren.
- Kein Routing, Backend, Datenbank, Login, externe API, PoE2DB-Import, echte DPS-/Optimierungs-Engine oder echter Skilltree ohne ausdrückliche Folgeanweisung.
- Bestehende Funktionen nicht unnötig umschreiben, keine unnötigen Abhängigkeiten/Refactorings und keine Dateien ohne Notwendigkeit löschen.
- Mobile und Desktop prüfen; neue Funktionalität angemessen testen.
- README und dieses Projektgedächtnis nach relevanten Änderungen aktualisieren.
## Nachbesserung 5D – offizielle Baumgeometrie (21. Juli 2026)

- Ursache: 40 layoutübergreifende Aszendenzreferenzen wurden als lange Linien gezeichnet; nicht skalierende 14-/16-Pixel-Striche verdichteten die Gesamtansicht optisch zur Kugel.
- Der Import war korrekt. Offizielle `node.x/y` sind bereits absolute Weltkoordinaten; Gruppe und Orbit werden nicht erneut addiert. `resolvePassiveNodeWorldPosition` ist die einzige Auflösung.
- Hauptbaum-Bounds verwenden sichtbare Nicht-Aszendenzknoten plus einmalig 420 Padding; `worldBounds` hält alle Layoutpositionen vor.
- 6.027 von 6.067 Referenzen werden innerhalb desselben Layouts gezeichnet; 40 `layout-transition`-Referenzen bleiben fachlich erhalten. Eine SVG-ViewBox transformiert Knoten und Linien gemeinsam.
- Diagnose: 5.150 Knoten, 1.621 Gruppen, 19 Juwelsockel, sechs getrennte Klassenstarts und null 0/0-Fallbacks, fehlende Gruppen, nicht endliche Positionen oder Ausreißer.
- Pathfinder, Targeting, Planner, reale Pipeline, Passive Analyzer und `analyzeBuild` sind unverändert. Keine anderen Datenquellen oder Assets.
- Aufgabe 5I ist gestoppt und nicht begonnen. Erst nach Abnahme darf sie neu beauftragt werden.
## Nachbesserung 5D.2 – Touch und ausgewählte Aszendenz

- Pointer-Map mit Ein-Pointer-Pan, Zwei-Pointer-Pinch, Mittelpunktanker, sauberem Up/Cancel und sprungfreiem Pinch-zu-Pan-Wechsel.
- Zentrale Zoomgrenzen und Faktoren in `src/tree-view/gestures.ts`; Wheel verwendet den Mauspunkt.
- Explizite UI-ID-Zuordnung verbindet vorhandenen Charakter-State ohne Engine mit offiziellen Klassenindizes und Aszendenz-IDs.
- Hauptbaum bleibt geometrisch unverändert; genau die gewählte Aszendenz erscheint mit offizieller relativer Geometrie als Inset. Keine langen Layoutübergänge.
- Der offizielle 0.5.2-Commit enthält einen Assetordner und `data.json` enthält Bild-/Iconpfade. Mangels ausdrücklicher Medienlizenz beziehungsweise belastbarer Repository-/Pages-Weiterverteilungsfreigabe bleibt `icons-images` blockiert. Keine Assets heruntergeladen, kopiert oder hotgelinkt.
- SVG-Rahmen und zoomabhängige Detailstufen verbessern die Hierarchie ohne fremde Bilddaten.
- Aufgabe 5I ist weiterhin gestoppt und nicht begonnen; Engine und Orchestrator bleiben unverändert.

## Nachbesserung 5D.4 – Knotenmotive

- Behoben: Der Assetimport verwendete die innere Skillkennung `node.id` statt der technischen Baum-ID aus dem äußeren `data.json.nodes`-Schlüssel. Dadurch fehlte etwa für Skill Speed `26798` die Auflösung.
- Behoben: `.tree-viewport svg` skalierte verschachtelte Sprite-SVGs auf Viewportgröße. Die Regel gilt nur noch für das direkte Baum-SVG; Spriteausschnitte verwenden lokalen ViewBox, negativen Atlasoffset und ClipPath.
- Skill Speed `26798`: `attackspeed.png`, inaktiv `skills-disabled.webp`, aktiv `skills.webp`, jeweils `884/136/34/34`.
- 20 Referenzknoten sind maschinenlesbar und als deterministische SVG-Vergleichstafel dokumentiert. 51 nicht als normale Motive auflösbare Pfade gehören ausschließlich zu 365 Mastery-Knoten und bleiben gemeldete Fallbacks; Mastery-Hintergrundmuster werden nicht als normale Icons zweckentfremdet.
- Nutzerbestätigt vor 5D.4: physisches iPhone mit Pinch, Pan, Baum, zentraler Aszendenz und Wechseln. Physische Abnahme des neuen Motivstands bleibt offen.
- Keine Änderung an Gesten, Aszendenzplatzierung, Klassenregister, Engine, Orchestrator, Pathfinder, Targeting oder Planner. Aufgabe 5I bleibt nicht begonnen.

## Nachbesserung 5D.4.1 – Verbindungssichtbarkeit

- Ursache: Der Renderer zeichnete alle 6.027 gleichlayoutigen Exportkanten dauerhaft. Dabei ging das offizielle `hideConnection`-Signal von zwölf Smith-of-Kitava-Spezialknoten verloren.
- Der Baumimport leitet daraus ausschließlich `hideInDefaultState` an den zwölf Kanten zu Smith’s Masterwork (`9988`) ab. Keine Kante wird gelöscht; 6.067 logische Kanten und 6.027 gleichlayoutige Kanten bleiben erhalten.
- Zentrale Entscheidung in `src/tree-view/connections.ts`: `normalVisible`, `hiddenUntilActive`, `decorative`, `glowOnly`, `unknown`. Aktueller Exportbestand: 6.015 normal sichtbare Kanten, zwölf im Ruhezustand verborgene Effektkanten, null eindeutig dekorative/glow-only Kanten und 40 weiterhin getrennte Layoutübergänge.
- Aktivierung verlangt explizit beide aktiven Endpunkte. Die aktuelle reine Baumansicht besitzt keine Punktebelegung; Auswahl wird nicht als Aktivierung interpretiert. Dadurch bleiben die zwölf Effektverbindungen im Ruhezustand unsichtbar.
- `orbit/orbitX/orbitY` bleiben Geometrieangaben. Mastery- und Jewel-Verbindungen werden ohne Exportflag nicht pauschal ausgeblendet.
- Knotenmotive, Spriteatlanten, Assetimport, Geometrie, Gesten, Klassenregister, Aszendenzplatzierung, Engine, Orchestrator, Pathfinder, Planner und Targeting bleiben unverändert. Aufgabe 5I bleibt nicht begonnen.
# Nachbesserung 5D.4.2 – forensische Baumdarstellung

- Der öffentliche Vorzustand und Mobalytics wurden in mehreren Baumregionen direkt visuell verglichen. Mobalytics war ausschließlich sichtbare Referenz; kein Code, CSS, HTML, Netzwerkdatensatz, Asset oder proprietäre Konfiguration wurde übernommen.
- Offizielle Ursache: 1.733 Kanten besitzen `orbitX/orbitY`; der alte Renderer verwarf diese Felder und zeichnete Sehnen. Der Import bewahrt sie, `resolveTreeConnectionGeometry` zeichnet deterministische kurze Kreisbögen. Knoten- und Gruppenkoordinaten bleiben unverändert.
- 365 offizielle Mastery-Zentren und ihre 644 Effektkanten sind im Ruhezustand verborgen. Damit entfallen erfundene graue Fallbackkreise und dauerhafte Mastery-Speichen; `activeEffectImage` wird nicht als gewöhnliches Knotenmotiv missbraucht.
- Verbindungssichtbarkeit, Geometrie und Stil sind zentral. Normale Grundlinien sind dünner und warmgrau; normale Passiven nutzen den bereits importierten offiziellen `PSSkillFrame`.
- Klassenregister, zentrale Aszendenzplatzierung, Pinch/Pan, Engine, Orchestrator, Pathfinder, Targeting und Planner bleiben unverändert. Aufgabe 5I wurde nicht begonnen. Die physische iPhone-Abnahme des neuen Stands bleibt offen.
## Aufgabe 5M.1B – Jewels, Charms und Flasks (2026-07-22)

- Gepinnt importiert: 320 normale Jewel-Mods, 64 Charm-Mods inklusive 13 Base-Implicits, 57 Life-Flask- und 52 Mana-Flask-Mods; Laufzeit dedupliziert gemeinsame IDs auf 427, Überschneidung mit 5M.1: null.
- UI, BuildProfile und Worker transportieren Base/Klasse/Mod/Tier/Stat/Wert/Source. Jewel-Stats bleiben unsupported, Charms/Flasks transport-only; keine Textheuristik, Simulation oder automatische Analyse.
- Relics deferred; Uniques und Socketables ausgeschlossen beziehungsweise blocked/pending; keine deutschen Texte; 5M.2/5N nicht begonnen; physisches iPhone offen. Details: `docs/POE2_ADDITIONAL_ITEM_CLASS_TECHNICAL_IMPORT.md`.
## Aufgabe 5M.2.1 – lokaler deutscher Extraktions-Preflight (2026-07-22)

- Ausgang: 5M.2.0 abgeschlossen; 5M.2.1 als rein lokaler, nichtproduktiver Audit gestartet.
- Lokaler Spielpin: GGG-Standalone `4.5.4.53018`, `Content.ggpk` SHA-256 `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`.
- Parserpin: RePoE `14e3edc89ed705bd4e4eda5c8135756431c76e81`; lokale PyPoE-Abhängigkeit `c30ad895282fc703a804d77e26e8e5c939f57b93`.
- Ergebnis: ItemClasses erfolgreich; 117 deutsche/117 englische IDs, vollständige ID-Parität, zwei deutsche Ausgaben byteidentisch. 32/33 produktreferenzierte IDs haben deutsche Namen; `Charm` fehlt.
- Mods, Statzeilen, Stat-IDs, Kombinationen, Mehrzeiler/Hybride, Basistypen und Templatelücken sind `not-assessable`: aktuelles Clientschema und PyPoE-Spezifikation führen zu `struct.error` vor Ausgabe.
- StatDescriptions wurden nicht gestartet, da das gepinnte Modul zwingend die Trade-API abfragt; Netzwerk-/Trade-Daten waren verboten.
- Mehrdeutigkeiten, Bedingungen, Varianten, Platzhalter und OCR-Tauglichkeit bleiben für Stattexte Unbekannt. Foto-Modus ist derzeit nicht geeignet.
- Distributionsstatus: keine Produktfreigabe. Alle deutschen Scopes bleiben `pending`; `translation-missing` bleibt produktiv aktiv. Keine deutschen Volltexte oder Spieldateien im Repository.
- 5M.2 und 5N wurden nicht begonnen. Fotoerkennung und Übersetzungs-Lernmodus bleiben spätere Aufgaben.
- Für PlayStation ist später ein ausgelieferter Web-Datensatz oder ein separates Sprachpaket nötig; dafür ist eine separate Approval-Entscheidung erforderlich.
- Buildvergleich, Designoptimierung und mobile Textklippung bleiben offen.
- Nächster empfohlener Schritt: gesonderter Kandidatenaudit eines aktualisierten Parser-/PyPoE-Stacks gegen denselben Containerpin, ohne Trade-API und ohne Änderung des bestehenden Pins.

## Aufgabe 5M.2.2 – deutscher Parser-Kandidatenaudit (2026-07-22)

- 5M.2.1 scheiterte für Mods und Basistypen an der inkompatiblen PyPoE-Tabellenspezifikation; StatDescriptions wurden wegen des vor lokaler CSD-Verarbeitung zwingenden Trade-API-Aufrufs nicht gestartet.
- Drei genaue Kandidaten wurden vertieft geprüft: RePoE `14e3edc89ed705bd4e4eda5c8135756431c76e81` + PyPoE `c30ad895282fc703a804d77e26e8e5c939f57b93`; PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` + ooz 0.2.4; poe2-mcp `163c30a9fd45f815d330cc54e6ab51a797693d31`.
- RePoE/PyPoE hat keinen neueren Remote-Head und bleibt für Mods/Basistypen inkompatibel sowie für StatDescriptions ohne Offline-Modus ungeeignet. Der bestehende Produktivpin wurde nicht verändert.
- PoB2/ooz extrahierte offline und zweimal manifestidentisch fünf Balance-DATC64-Dateien sowie 589 CSD-Dateien. Der GUI-orientierte DatView-Pfad belegt jedoch keinen unbeaufsichtigten verlustfreien deutschen/englischen Strukturexport; Produktcoverage bleibt `notAssessable`.
- poe2-mcp besitzt am geprüften Pin den dokumentierten Gesamt-Entrypoint nicht und keinen vollständigen aktuellen Schema-/Locale-Vertrag; der Start endete mit Exitcode 2.
- Keine Trade-API, kein PoE2DB, kein Webseiten-Scraping und keine externe Laufzeitdatenquelle wurden verwendet. Kandidaten, Rohdaten, Volltexte, Tools und Logs bleiben ausschließlich unter `.local-audits/`.
- `StatsValues` ist im PoB2-Schema sichtbar, aber end-to-end nicht verifiziert; `BondedStatsValues` und die Socketable-Eignung bleiben unbekannt beziehungsweise ungeeignet für Freigabe.
- Keine 2.255-Mod-, 2.705-Statzeilen-, 431-Stat-ID-, 444-Kombinations-, 429-Mehrzeiler-/Hybrid-, 39-Basistyp- oder 485-Lücken-Coverage konnte belastbar erzeugt werden. Fehlgeschlagene Kandidaten werden nicht als Null-Coverage dargestellt.
- `Charm` bleibt als technische ItemClass-ID ungeklärt. Keine Zuordnung wurde aus sichtbarem Text abgeleitet.
- Klare Empfehlung: Kein Kandidat ist ausreichend; eine begrenzte eigene Parseranpassung benötigt einen separaten Auftrag. Danach sind ein eigener Pin-, Approval- und Distributionsentscheid erforderlich.
- Alle deutschen Produktlokalisierungsscopes bleiben `pending`, `translation-missing` bleibt aktiv, keine deutschen Produkt- oder Volltexte wurden committed.
- 5M.2 und 5N wurden nicht begonnen. Fotoerkennung, Übersetzungs-Lernmodus, PlayStation-Sprachpaket, Buildvergleich, Designoptimierung und mobile Textklippung bleiben spätere getrennte Aufgaben.
- Nächster empfohlener Schritt: begrenzter Parseranpassungsauftrag nur für einen gepinnten unbeaufsichtigten Offline-Auditexport, noch ohne Produktimport oder Approval.

## Aufgabe 5M.2.3 – gepinnter Offline-Item-Auditparser (2026-07-23)

- 5M.2.2 ist abgeschlossen. 5M.2.3 implementiert ausschließlich `scripts/poe2-offline-item-audit/index.mjs`; keine Produktpipeline wurde ersetzt.
- Pins: Container `a917a56f…a18e28`, PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`, Schema `268ae3a3…d3d30`, ooz 0.2.4/Artefakt `e6d7e728…94af4`, Parserformat 1, Node 24.14.0.
- Architektur: Pin-/Pfadguard → deterministische Lua-Schemaextraktion → DATC64-Dekodierung → technische Referenzen → UTF-16LE-CSD-Struktur → Produktvergleich → lokale Voll- und bereinigte Berichte.
- Tabellen: Mods 16.678/677 Bytes, Stats 27.178/106, BaseItemTypes 5.476/360 und Tags 1.327/44 passen exakt. ItemClasses 117/150 besitzt gegenüber 149 Schemabytes ein unbekanntes Byte und bleibt vollständig ungelöst.
- Produktcoverage: 2.255/2.255 Mod-IDs, Statfolgen und Werteintervalle stimmen; 2.705 Statzeilen, 431 Stat-IDs und 444 Kombinationen sind vorhanden. 429 Mehrzeiler/Hybride und 39 Basistyp-IDs stimmen technisch, bleiben wegen fehlender Zieltabellen teilweise aufgelöst. 33 Itemklassen bleiben ungelöst.
- Deutsche CSD: 589 Dateien, 19.916 Einträge, 324.035 Varianten, 16.284 deutsche Stat-IDs. 419/431 Produkt-Stat-IDs und 447/485 bisherige Templatelücken besitzen deutsche CSD-Strukturen. 33 Deutsch-/Englisch-Strukturkonflikte bleiben sichtbar.
- Unique-Ergebnis: Identitäten, Basistypketten, Varianten, Mods, Rollbereiche und Skill-/Supportreferenzen Unbekannt, weil die notwendigen Tabellen fehlen. Keine Unique-Freigabe.
- Socketable-Ergebnis: Identitäten Unbekannt; `StatsValues` nicht Ende-zu-Ende aufgelöst; `BondedStatsValues` `schema-unknown`. Frühere Zahlen wurden nicht ungeprüft übernommen. Keine Socketable-Freigabe.
- Charm-ID bleibt ungelöst; keine Namens- oder Textähnlichkeitszuordnung.
- OCR-Audit lokal: 25.648 normalisierte deutsche Strukturen, 2.189 mehrdeutig. Reguläre Items teilweise geeignet; Uniques/Socketables Unbekannt. Keine OCR/Fotofunktion implementiert.
- Zwei vollständige Läufe sind byteidentisch: Normalisierung `c001bcc8…f15f`, bereinigter Bericht `065c3b26…d5016`.
- Offlinegarantie: kein HTTP/HTTPS/DNS, keine Trade-API, kein PoE2DB, keine Webseite, kein Hotlink. Volltexte und Rohdaten bleiben unter `.local-audits/`.
- Produktivpin, `source-approval.json`, Produktdaten, UI, BuildProfile, Worker, Analyzer, Engine, Baum und `translation-missing` sind unverändert.
- 5M.2 und 5N wurden nicht begonnen. PS-Sprachbestand, Fotoerkennung, Lernmodus, mobile Textklippung, Buildvergleich und Designoptimierung bleiben spätere Aufgaben.
- Nächster Schritt: separater gepinnter Input-Erweiterungsaudit für fehlende Enum-/Referenz-, Unique- und Augments/Socketable-Tabellen sowie die ItemClasses-Schemadrift; noch kein Produktimport.

## Aufgabe 5M.2.5 – Abschlussstatus

- Audit-only mit unveränderten Pins. ItemClasses: 117 EN/117 DE, 150 statt 149 Schema-Bytes; 49 mögliche Offsets (65–113), exakter Offset/Semantik `unknown`, 33 Produktklassen partial.
- `Charms` stammt aus RePoE/Projekt-Normalisierung (`project-normalized-id`), nicht aus Namensableitung.
- 295 SoulCores bleiben partial; 552 StatsValues- und 510 BondedStats-Wertepaare sowie 30 Category→ItemClass[]-Kategorien sind strukturell belegt, das Zusatzbyte bleibt unbekannt.
- Domain und Generation Type sind durch Schema, Enumgenerator und Consumercode für 2.255/2.255 Mods bestätigt. ModFamily/ModType sind Referenzen, Konfliktsemantik bleibt `unknown`; 0 resolved/2.255 partial.
- Lokalisierung unverändert: 419/431 Stat-IDs, 12 fehlend, 38 Templatelücken, 2.189 OCR-Mehrdeutigkeiten. Zwei Läufe byteidentisch (`b9cb4850…5d701c7`), vollständig offline.
- Produktivpin, Approval, Produktdaten, `translation-missing`, UI, Worker, Analyzer, Engine und Baum unverändert. Keine Rohdaten/Volltexte committed; 5M.2/5N nicht begonnen.
- Nächster Schritt: gepinntes Schemaquellen-Audit für die Restbytes und Konfliktgruppensemantik; Fotoerkennung, PS-Sprachbestand und mobile Textklippung bleiben offen.

## Aufgabe 5M.2.6 – Abschlussstatus und Priorität

- Auftraggeberpriorität: Unique-Affixe sind vor regulärer deutscher Lokalisierung, OCR/Foto, Soul Cores, 5M.2 und 5N zu klären.
- 25 lokale Unique-Kandidatendateien wurden zweimal offline extrahiert (25.477.050 Bytes; Manifest `c4fdc6fe…972752c`) und zweimal auditiert (`fd9a0418…8759283`, byteidentical).
- Gefunden: 449 UniqueStashLayout-Fragmente, 17.163 VisualIdentity-Zeilen, 48 UniqueChests, 1 Mutated-Modset, 14 Legacy-Mage-Definitionen, 65 ModGrantedSkills. Keine davon bildet eine vollständige Item-Unique-Identität.
- Technische Unique-Item-Identitäten 0; Basis-/Itemklassenreferenzen 0; Versionen/Varianten 0; Item-Modreferenzen und direkte Unique-Statdefinitionen 0.
- 311 nicht-itembezogene Modreferenzen auf 265 Mods, 278 Statzeilen/Werte und je 261 deutsche/englische CSD-Zeilen wurden getrennt belegt und nicht als Item-Affixe gezählt.
- Granted Skills mit Unique-Item-Zuordnung 0; Granted Supports `unknown`. Unique-Implicits/Spezialeffekte mangels Identitätskette nicht beurteilbar.
- Importfähigkeit: Nein. Unique-Affixe technisch vollständig geklärt: **Nein**. Blocker sind fehlende Item-Unique-ID-, Unique→Base-, Unique→Mod/Stat- und Version-/Variantenketten.
- Keine Rohdaten/Volltexte oder Unique-Daten importiert; Produktivpin, Approval, Analyzer, UI, Engine und `translation-missing` unverändert. 5M.2/5N nicht begonnen.
- Nächster Schritt: separate lokale Quellenentscheidung, ob serverseitige Unique-Definitionen überhaupt im Clientcontainer materialisiert sind oder eine zulässige offizielle ID-Quelle benötigt wird.

## Aufgabe 5M.2.8 – PoB2-Unique-Planerdaten-Approval

- 5M.2.7 abgeschlossen: keine geprüfte Quelle liefert die vollständige GGG-Unique-ID-/Base-/Mod-/Stat-/Werte-/CSD-Kette.
- Auftraggeberentscheidung: `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` darf als eigenständige `pob2-planner-data`-Quelle für Uniques vorbereitet werden.
- Neuer Scope `poe2-pob2-unique-planner-data`: `conditionally-approved`, aber Distribution `pending`, Produktimport blockiert und 5M.2.9 erforderlich.
- Erlaubt geplant: PoB2-Quellidentität, Name, Basisanzeige, Slot/Kategorie, Level, Varianten, sichtbare Planerzeilen, belegte PoB2-Rollbereiche, Implicits, Legacy- und Provenienzstatus.
- Verboten: technische GGG-IDs, reguläre Affixe, Crafting-/Spawnweight-/CSD-Daten, deutsche Texte, Medien, Hotlinks, Runtime-Netzwerk, Scraping, Socketables und Skill-/Support-Vollimporte. Unique-linked Skill-/Supporthinweise bleiben pending.
- Modell: Namespace `pob2:<source-record-id>`, Fixtures `fixture:<id>`; `gggIdentityStatus: unknown`; keine implizite Feldherkunft. Varianten und Modzeilen bleiben quellenspezifisch.
- 20 statische Unique-Quelldateien sind mit SHA-256 festgelegt; `Special/Generated.lua`, Loader, leere Kategorien und Voll-Datenbank sind ausgeschlossen.
- MIT-Codelizenz bestätigt; Herkunft/Weiterverteilung der mitgelieferten GGG-/Community-Itemdaten nicht eindeutig durch MIT gedeckt und deshalb `distribution-pending`. Attribution ist Pflicht; keine Rechtsfreigabe behauptet.
- Dedizierter Approval-, Feld-, Produkttrennungs-, Provenienz- und Distributionsguard implementiert. Er erlaubt nur Audit und blockiert `generated/`, `public/` sowie Produktimport.
- Keine PoB2-Unique-Daten, deutschen Unique-Texte oder Produktdateien importiert; Unique Analyzer, UI, Engine, Worker, BuildProfile, RePoE-/PyPoE-Pin und bestehende Approval-Scopes unverändert.
- 5M.2 und 5N weiterhin nicht begonnen. Fotoerkennung und mobile Textklippung bleiben offen; PlayStation-Nutzer benötigen später ausgelieferte Daten.
- Nächster Schritt: Distributionsstatus der statischen PoB2-Unique-Planerdaten klären; erst danach Aufgabe 5M.2.9 unter dem festgelegten Importvertrag.
## Aufgabe 5M.2.11 – deutsche PoB2-Unique-Anzeigeschicht

- 5M.2.10 ist abgeschlossen. 5M.2.11 setzt die ausdrückliche Entscheidung für eine eigenständige deutsche App-Lokalisierung um; sie ist keine offizielle oder technische GGG-Lokalisierung.
- Englisch bleibt technische Unique-Struktur: 435 Items, 579 Varianten, 2.345 Modzeilen, 273 Implicits; Produkt-SHA `db3837b5…a2452`, Fachhash `a5a7e7ba…04329`, PoB2-Pin `c5300ccd…7d0`.
- Neue reine Anzeigedatei: `generated/localization/de/pob2-uniques.json`; Verbindung ausschließlich über `pob2:`-ID, Varianten-ID und Zeilen-ID. Keine Duplikation von Rollbereichen, Provenienz, Analyzer- oder Registrydaten.
- Coverage: 435 Namen, 435 Basistypen, 579 Variantenlabels, 2.345 Modzeilen, 273 Implicits und fünf Systemtexte. Status: 1.992 `reviewed-app-translation`, 2.080 `review-required`, 0 `verified-local-source`, 0 `translation-missing`.
- Der Resolver verwendet Deutsch, danach englischen PoB2-Fallback, danach `translation-missing`. Es gibt keine Runtime-Übersetzung, API, PoE2DB-Automatisierung, Textheuristik als technische Wahrheit oder erfundene GGG-ID.
- Die UI besitzt eine minimale deutsche Unique-Suche und Detailanzeige. Registry, Unique Analyzer, Engine, Worker, BuildProfile, Crafting, normale Affixe und RePoE-Daten bleiben unverändert.
- Nächster Schritt: manueller Sprachreview der `review-required`-Felder. 5M.2 und 5N bleiben nicht begonnen.

## Hauptaufgabe V1 – End-to-End-Integration des Build-Assistenten

- Ausgangscommit: `4f242d9e0cb15624ebe1d0f455d81ee08c9159f9`.
- Die Datenbasisphase ist beendet. 5M.2.11 ist abgeschlossen; 2.080 `review-required`-Texte bleiben späterer Feinschliff und wurden nicht erneut geprüft.
- Der sichtbare statische `buildResult`-Pfad wurde aus `App.tsx` entfernt. Seine Fixture bleibt nur für bestehende Tests.
- Neuer Fluss: Charakter, Ausrüstung, Hauptangriff und Zielprofil → BuildInput → vorhandener `analyzeBuild`-Orchestrator → Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer → Rotation und Erklärung → deutscher V1-Bericht.
- Der gewählte Hauptangriff steuert Support und Rotation. Inkompatibilität wird sichtbar und nicht durch stille Skillwahl verdeckt.
- Normale Affixe, leere Slots, PoB2-Uniques und Varianten werden verlustfrei transportiert.
- Die bestehende reale Passive-Analyse bleibt im Worker und verwendet denselben Charakter-, Equipment- und Skillzustand. Keine zweite Engine oder neue Workerarchitektur.
- Der Unique Analyzer verarbeitet 435 produktive `pob2:`-Kandidaten; `fixture:` ist ausgeschlossen. Deutsche Anzeige und englischer Fallback stammen aus der getrennten Lokalisierungsschicht.
- Belegte Grenze: Die PoB2-Kandidaten besitzen keine technischen Mechanik-Tags oder GGG-Stat-Links. Ohne echtes Matchsignal wird keine scheinpräzise Unique-Empfehlung ausgegeben.
- Sichtbar: Zusammenfassung, Equipment, Hauptangriff, gerankte und blockierte Supports, passive Schwerpunkte, Juwelen, belegbare Uniques, Mapping, Boss, Rotation oder Rotationslücke, Konflikte, Trade-offs, Confidence und nächste Schritte.
- Neue UI-Texte sind Deutsch. Unbekannte Inhalte bleiben unbekannt oder nicht verfügbar. Leere optionale Slots sind zulässig.
- Fokussierte Tests prüfen sechs Analyzertransporte, Zielprofilwirkung, Unique-/Fixture-Trennung, Varianten, leere Slots, Determinismus und deutsche Ergebnisbereiche.
- Keine neue Datenquelle, kein Audit, keine Pin-, Crafting- oder Produktdatenänderung, keine Preisberechnung, DPS-Simulation, externe API oder Scraping.
- Maßgeblich: `docs/BUILD_ASSISTANT_V1_END_TO_END.md`.
- Nächster Hauptauftrag: bereits zulässige Kandidatenmetadaten gezielt vertiefen, besonders semantische PoB2-Unique-Signale; keine neue Datenquellenphase.
# Abschluss HAUPTAUFGABE V1.3 – Equipment-first (2026-07-23)

- Ausgangscommit: `d609834125e3a11222a814314cb8eb218a576efe`.
- V1.2 war abgeschlossen; V1.3 korrigiert die sichtbare Produktvision auf „vorhandenen Charakter und reale Ausrüstung nachbauen, daraus Build ableiten“.
- Architektur bleibt unverändert: zentrale React-Eingabe, BuildProfile, vorhandener Orchestrator und bestehende Analyzer.
- Charakterflow: Klassenliste, danach passende Aszendenzen, Level, zusätzliche Story-Passivpunkte und automatisch abgeleitete Gesamtpunkte.
- Equipment-first: räumliche Paperdoll-Gruppierung, getrennte Waffensets sowie eigene Utility-/Juwelbereiche.
- Itemmodell kompatibel erweitert um `rarity`, generische `sockets` und eine
  rein sichtbare `baseDisplayName`-Angabe ohne behauptete technische
  Basistypidentität; `modifierValues` bleibt kanonisch.
- Rare zeigt drei Prefix- und drei Suffixplätze; Implicits bleiben getrennt. Magic nutzt 1/1, Normal 0/0.
- Werteingabe verwendet bestätigte Statzeilen und Grenzen; Tier ist keine Pflichtauswahl.
- Sichtbarer Affixtext bereinigt Parser-Auswahlmarker; deutsche Suchaliasse nutzen vorhandene technische Semantik.
- Sechs dynamische Fertigkeitskarten verwenden den produktiven Skill-/Supportbestand. Supports bleiben kartenbezogen und können durch den vorhandenen Analyzer vorgeschlagen werden.
- Ohne manuelle Hauptfertigkeit wird der beste gültige Hauptskill des bestehenden Rankings verwendet; Nutzerwahl wird nicht heimlich ersetzt.
- Automatische Aszendenz- und Equipmentskills bleiben aus, solange keine technisch belegte Zuordnung vorliegt.
- Ergebnis ergänzt Affixskalierung und eine deterministische Eignungskategorie statt einer nicht belastbaren Prozentzahl.
- Bestehende Waffensets, Passive-Pfade, Mapping, Boss und evidenzgebundene Rotation bleiben erhalten.
- Produktpins, PoB2-Produktdaten, RePoE-Daten, Crafting Engine und Datenquellen wurden nicht geändert.
- Lokale Referenzbilder waren im Workspace nicht verfügbar; die schriftliche Layoutvorgabe wurde mit neutralen Platzhaltern umgesetzt.
- Bekannte Grenzen: Sockelmaxima/-inhalte pro Basis, automatische gewährte Skills und viele deutsche normale Affixtexte sind **Unbekannt** beziehungsweise nicht vollständig belegt.
- Hauptdokument: `docs/BUILD_ASSISTANT_V1_3_EQUIPMENT_FIRST_UX.md`.
- Prüfung: 19/19 fokussierte V1.3-/End-to-End-Tests; vollständiger
  Parallel-Lauf 1.016/1.019 mit drei Zeitüberschreitungen ohne
  Assertion-Fehler; serieller Wiederholungslauf der betroffenen Dateien 50/50.
  Lint, Typecheck, Produktions- und Pages-Build erfolgreich.
- Browser: Desktop und 390 × 844 technisch bedienbar, kein horizontaler
  Überlauf, Rare-Editor mit 3/3 Slots und Startsockel, Live-Suche „Leben“ mit
  46 technisch möglichen Prefixen, keine neuen Konsolenfehler/-warnungen.
- Nächster empfohlener Auftrag: V1.3.1-Praxistest und enger UX-/Sprachfeinschliff mit lokal bereitgestellten Referenzbildern.

# Abschluss Aufgabe V1.3.1 – sichtbare UX-Korrektur (2026-07-23)

- Ausgangscommit: `020ec87f9bc81f9938a5108ef6369153f43fef49`.
- Auftraggeberfeedback: Die V1.3-Oberfläche zeigte eine lange Klassenliste,
  eine große Charakterkarte, nicht löschbare sichtbare Nullwerte, getrennte
  Equipmentblöcke, zweispaltig gequetschte mobile Skillkarten und ungefragt
  vorgefüllte Demo-Skills samt Supports.
- Charakter: genau eine kompakte Klassen- und eine abhängige
  Aszendenzauswahl. Sichtbar sind nur die acht durch
  `selectableInCurrentUi` produktiv bestätigten Klassen Hexe,
  Waldläuferin, Krieger, Zauberin, Jägerin, Söldner, Mönch und Druide.
  Marauder, Duelist, Shadow und Templar bleiben ausgeblendet.
- Level, Passivpunkte durch Level, Story-Passivpunkte und Gesamtpunkte stehen
  in einem kompakten Bereich. Lokale Texteingabeentwürfe beseitigen die
  `Number('') === 0`-Rücksetzung; Level und Storypunkte lassen sich vollständig
  löschen und bleiben bis zur Validierung sichtbar leer.
- Der Produktinitialzustand verwendet eigene leere Fabriken: keine Klasse,
  Aszendenz, Ausrüstung, Fertigkeit, Supports oder Ergebnisse; genau sechs
  leere Startkarten. Demo-Setups bleiben ausschließlich Test-/Datenfixtures.
- Equipment: eine zusammenhängende räumliche Hauptausrüstung mit kompaktem
  Waffenset-1/2-Umschalter; nur die Waffenplätze wechseln. Juwelen, Charms und
  Fläschchen bleiben getrennte kompakte Bereiche. Der Item-Editor und die
  Mehrfach-Affix-Funktion sind unverändert.
- Die Mobalytics-Ansicht wurde nur als Bedien- und Layoutreferenz betrachtet.
  Kein fremder Code, CSS, Bild, Logo oder Asset wurde übernommen. Die
  Auftraggeber-Referenzbilder waren im aktuellen Workspace nicht verfügbar;
  ihre schriftlichen Vorgaben blieben maßgeblich.
- Fertigkeiten: mobil genau eine Kartenspalte; leere Karten zeigen nur Suche
  und Auswahl. Rollen, Waffenset und Supports erscheinen erst nach Skillwahl.
  Blitzpfeil, Kugelblitz, Sturmrufer, Flammenwand, Zeitverzerrung und
  Sprungschlag werden nicht mehr vorausgefüllt.
- BuildProfile, Analyzer, Scores, Ergebnisaggregation, Passive-Pfade,
  Mapping, Boss, Rotation, Datenquellen und Pins bleiben unverändert.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_V1_3_1_UX_CORRECTION.md`.
- Prüfung: 20/20 fokussierte UX-/V1.3-Regressionstests; vollständiger
  Parallel-Lauf 1.017/1.020 mit drei ausschließlichen Zeitüberschreitungen;
  serieller Wiederholungslauf der betroffenen Dateien 50/50. Lint, Typecheck,
  Produktions- und Pages-Build sowie 132/132 JSON-Dateien erfolgreich.
- Browser: Desktop und 390 × 844 ohne horizontalen Überlauf; mobil sechs
  Karten mit 321 Pixel Breite und ohne gemeinsame Kartenzeile. Level und
  Storypunkte bleiben nach echter Tastaturlöschung leer, Waffenset 2 wechselt
  nur die Waffenplätze, der Editor öffnet weiterhin, und die Browserkonsole
  enthält keine Fehler oder Warnungen.
- Pages- und finaler Git-Status werden nach Deployment im Abschlussbericht
  festgehalten.
- Nächster Schritt nach erfolgreicher Verifikation: Auftraggeber-Praxistest
  des korrigierten leeren Equipment-first-Flows; danach nur konkret
  beobachtete UX- und Sprachkorrekturen.

## V1.3.1 – Paperdoll-Nachkorrektur nach Foto 2

- Die vom Auftraggeber bereitgestellte Datei `Foto 2.jpg` wurde als konkrete
  Layoutreferenz geprüft.
- Die Ausrüstung verwendet nun eine eigene kompakte Paperdoll: hohe
  Waffenplätze außen, Helm und Brust zentral, kleine Schmuckplätze körpernah,
  Handschuhe/Gürtel/Schuhe darunter sowie Fläschchen und Charms in einer
  unteren Schnellplatzreihe. Juwelen stehen abgetrennt darunter.
- Der Umschalter heißt kompakt `Set 1 | Set 2`; nur die Waffenplätze wechseln.
- Es wurden keine Bilder, CSS-Regeln, Logos oder sonstigen fremden Assets aus
  der Referenz übernommen. Leere Plätze verwenden eigene neutrale
  CSS-/Textsymbole.
- Item-Editor, Mehrfach-Affixe, Werteingabe, Analyzer und Build-Ergebnis sind
  unverändert.
- Mobile Prüfung 390 × 844: 321 Pixel breite Paperdoll, kein horizontaler
  Überlauf, Item-Editor erreichbar und Browserkonsole ohne Fehler/Warnungen.
- Fokussierte Equipment-/Editor-Regression: 8/8; Lint, Typecheck und
  Pages-Build erfolgreich.

## Paperdoll – Größe, dritter Charm und variable Juwelenzahl

- Die Desktop-Paperdoll wurde von 690 auf 820 Pixel Maximalbreite vergrößert;
  mobil bleibt sie responsiv innerhalb der verfügbaren Seitenbreite.
- Ein dritter produktiver Charm-Platz wurde in Equipmentdefinition,
  Affixfilter und Initialzustand ergänzt.
- Die Juwelenanzeige besitzt eine sichtbare Anzahl sowie Plus/Minus. Neue
  Plätze erhalten deterministische IDs `slot-jewel-<n>` und werden als normale
  Equipment-Einträge durch den vorhandenen Editor und BuildProfile-Transport
  geführt.
- Minus entfernt ausschließlich den letzten vollständig leeren Juwelenplatz.
  Ein belegter Platz wird nicht stillschweigend gelöscht.
- Mobile Browserprüfung: drei Charms, Änderung von zwei auf vier und zurück
  auf drei Juwelenplätze, kein horizontaler Überlauf. Desktopbreite: 820
  Pixel. Browserkonsole ohne Fehler/Warnungen.

## Paperdoll – zweite Größen- und Ringkorrektur

- Auf ausdrückliches Auftraggeberfeedback wurde die maximale Desktopbreite
  von 820 auf 960 Pixel erhöht. Mobil nutzt der Equipmentbereich reduzierte
  Seitenabstände; bei 390 Pixel Viewport wuchs die Paperdoll von 321 auf 340
  Pixel.
- Ring 1 und Ring 2 liegen nun in exakt derselben Gridzeile. Das Amulett steht
  darunter, ohne den Brust- oder Schmuckplatz zu überlagern.
- Browsermessung 390 × 844: identische Ring-Oberkante, kein horizontaler
  Überlauf. Desktopmessung: 960 Pixel. Browserkonsole ohne Fehler/Warnungen.

## Paperdoll – Vollbreite und Schmuckpositionen

- Die Paperdoll verwendet nun 100 Prozent der nutzbaren Breite des
  Ausrüstungsbereichs statt einer festen Maximalbreite. Die seitlichen
  Innenabstände des Equipment-Abschnitts wurden auf ein kompaktes Maß
  reduziert.
- Amulett: nach oben neben den Helm versetzt.
- Ring 1 und Ring 2: gemeinsam nach unten neben die Brust versetzt und exakt
  auf derselben Rasterhöhe ausgerichtet.
- Browserprüfung bei 590 × 1280: Paperdoll 539 Pixel bei 555 Pixel
  Abschnittsbreite, entsprechend rund 97 Prozent der gesamten Sectionbreite
  einschließlich deren Rahmen. Bei 390 × 844 weiterhin 340 Pixel und kein
  horizontaler Überlauf. Browserkonsole ohne Fehler/Warnungen.

## Paperdoll – Höhenkorrektur und tatsächlicher Schmucktausch

- Klarstellung des Auftraggebers: Die Breite war bereits ausreichend; nur die
  vertikale Größe sollte wachsen.
- Die vier Equipment-Rasterzeilen wurden deutlich erhöht. Bei 590 × 1280
  misst die Paperdoll nun 539 × 974 Pixel; bei 390 × 844 misst sie 340 × 824
  Pixel.
- Schmucktausch entsprechend der gemeinten Ausgangslage: Das Amulett
  übernimmt den früheren oberen Schmuckplatz. Ring 1 und Ring 2 stehen
  gemeinsam in der darunterliegenden Schmuckreihe und besitzen eine exakt
  identische Oberkante.
- Breite und sonstige Funktionen blieben unverändert. Kein horizontaler
  Überlauf und keine Browserfehler/-warnungen.

## Mobile Skalierung – eigentliche Ursache der zu kleinen Höhe

- Die Auftraggeber-Screenshots zeigten trotz mobiler Gerätebreite weiterhin
  Desktopmerkmale, insbesondere zweispaltige Fertigkeitskarten.
- Ursache: `index.html` besaß überhaupt keinen `viewport`-Metaeintrag. Safari
  verwendete deshalb eine breite virtuelle Desktopfläche und skalierte die
  gesamte Anwendung einschließlich des Equipmentbereichs nachträglich klein.
- Korrektur: vollständiges HTML-Grundgerüst mit `lang="de"`, UTF-8,
  `width=device-width, initial-scale=1, viewport-fit=cover`, Theme-Farbe und
  Seitentitel.
- Der zuvor vergrößerte Equipmentbereich bleibt 340 × 824 Pixel bei einem
  echten 390 × 844 CSS-Viewport. Die Skillansicht verwendet dort eine
  321-Pixel-Einzelspalte. Kein horizontaler Überlauf und keine
  Browserfehler/-warnungen.

## Paperdoll – kompaktere vertikale Abstimmung

- Nach erneutem Auftraggeberfeedback blieb die passende mobile Breite von
  340 Pixel unverändert; nur die zuvor zu stark gestreckte Höhe wurde
  reduziert.
- Die Rasterzeilen, Waffenplätze, Schnellslots, Juwelenplätze und vertikalen
  Innenabstände wurden proportional kompakter ausgelegt.
- Browsermessung bei 390 × 844: 340 × 715 Pixel statt zuvor 340 × 824
  Pixel. Amulett sowie die auf gleicher Höhe liegenden Ringe behalten ihre
  festgelegten Positionen.
- Kein horizontaler Überlauf; Browserkonsole ohne Fehler oder Warnungen.

## Folgekorrekturen – Arbeitspaket 1: Unique-Eigenschaften und Varianten

- Die sieben vom Auftraggeber bestätigten Folgekorrekturen werden
  nacheinander bearbeitet. Begonnen wurde mit der vollständigen sichtbaren
  Unique-Eigenschaftsdarstellung und der variantengenauen Analyzerwirkung.
- Der bestehende englische PoB2-Produktbestand und die getrennte deutsche
  Anzeigeschicht bleiben unverändert. Der Editor verbindet beide weiterhin
  ausschließlich über stabile Unique-, Varianten- und Zeilen-IDs.
- Der Unique-Editor zeigt nun benötigtes Level, Implicits und sämtliche für
  die gewählte Variante geltenden Unique-Eigenschaften. Bei mehreren
  Varianten ist eine konkrete Auswahl erforderlich; ohne Auswahl werden nur
  gemeinsame Eigenschaften angezeigt und Speichern bleibt gesperrt.
- Die Analyzer-Registry enthält für alle 579 Varianten getrennte
  Evidenzdaten. Ist ein Unique mit Varianten-ID ausgerüstet, verwendet der
  Unique Analyzer dessen Tags, Einschränkungen, Trade-offs, Enablerstatus und
  Waffenanforderungen statt der vorsichtigen itemweiten Schnittmenge.
- Es werden weiterhin keine technischen GGG-Mod-/Stat-IDs behauptet und
  normale Affixe bleiben vollständig getrennt.
- Mobile Browserprüfung 390 × 844: sechs aufgelöste Zeilen für die aktuelle
  Variante des Ambosses, Dialogbreite rund 364 Pixel, kein horizontaler
  Überlauf, Speichern erst nach Variantenwahl, keine Konsolenfehler oder
  -warnungen.
- Nächster Arbeitspunkt: vollständigerer produktiver Skill- und
  Supportbestand.

## Deutsche Originalnamen für Skills und Supports (2026-07-24)

- Auf ausdrücklichen Auftraggeberwunsch wurden keine frei übersetzten Namen
  verwendet, sondern ausschließlich die deutschen Bezeichnungen der lokal
  installierten deutschen PoE2-Clientversion `4.5.4.53018`.
- Die lokale Extraktion ist an `Content.ggpk` SHA-256
  `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`
  und PoB2-Schema-Commit
  `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` gebunden.
- Alle 686 reduzierten Katalogeinträge wurden deterministisch über ihre
  technische `BaseItemTypes`-ID sowie die positionsgleiche
  `SkillGems`-/`GemEffects`-Kette aufgelöst: 235 Skills und 451
  Supportstufen, kein englischer Fallback am aktuellen Pin.
- Produktdatei:
  `generated/localization/de/poe2-gems.json`; sie enthält nur deutsche
  Anzeigenamen und ID-Provenienz. Der englische RePoE-Katalog, Skillsemantik,
  Supportregeln, Analyzer und Scores bleiben unverändert.
- Keine automatische Übersetzung, kein Textmatching, keine Icons, Medien,
  Beschreibungen, Stat-IDs oder Laufzeitquelle wurden hinzugefügt.
- Die Anzeigeschicht bleibt innerhalb der eng begrenzten Projektentscheidung
  für `poe2-repoe-skill-support-catalog`; sie behauptet keine externe
  Lizenzfreigabe oder vollständige rechtliche Klärung. Die übrigen deutschen
  Lokalisierungsscopes bleiben unverändert.
# Waffen-Set-Passivplanung

- Waffen-Set-Punkte werden als Aufteilung normaler Passivpunkte behandelt,
  nicht als zusätzliche Punkte.
- Die reale Passive-Pipeline plant einen gemeinsamen Stamm sowie getrennte
  Ergänzungen für Waffenset 1 und Waffenset 2.
- Beide Set-Pläne verwenden denselben gemeinsamen Stamm und bleiben jeweils
  innerhalb des normalen Gesamtbudgets.
- Bei null aufgeteilten Punkten bleibt die bisherige Einzelplanung erhalten.
- Die UI kann zwischen gemeinsamem Plan, Set 1 und Set 2 umschalten; der
  offizielle Baum zeigt den jeweils gewählten Plan.
- Aszendenzpunkte bleiben getrennt und werden nicht automatisch eingerechnet.
- Datenpins, Baumquelle und bestehende Pfadsuche bleiben unverändert.

# Vollständige Nutzung des normalen Passivpunktebudgets

- Der frühe Planungsstopp nach wenigen hochwertigen Zielen wurde behoben.
- Die bestehende strategische Auswahl bleibt die erste Planungsphase.
- Eine zweite, deterministische Abschlussphase nutzt Restpunkte nur für
  erreichbare Kandidaten mit positiver Evidenz und ohne bekannte Konflikte.
- Kandidaten- und Iterationsrahmen decken das produktive maximale
  Normalbudget ab; die Pfadsuche traversiert bereits belegte Teilbäume
  weiterhin kostenfrei.
- Ein Test mit dem offiziellen Produktbaum weist für ein repräsentatives
  Profil 121 von 121 verwendete normale Punkte nach.
- Wenn nicht genügend sichere Kandidaten existieren, bleibt das Restbudget
  sichtbar. Unbekannte oder negative Knoten werden nicht erfunden.
- Waffen-Set-Aufteilungen bleiben Teil des normalen Budgets.
- Aszendenzpunkte bleiben ein separater Punkttyp und sind weiterhin nicht
  Bestandteil dieser Planung.
- Baumdaten und sämtliche Datenpins bleiben unverändert.

# Separate Aszendenzpunkte und Aszendenzplanung

- Im Charakterbereich kann der Nutzer nun separat angeben, wie viele
  Aszendenzpunkte verfügbar sind. Erlaubt sind ausschließlich 0 bis 8.
- Aszendenzpunkte werden weder zum normalen Passivpunktebudget addiert noch
  als Waffen-Set-Punkte behandelt.
- Die reale Passive-Pipeline verwendet dafür den versionierten Scope
  `ascendancy` und löst den offiziellen Start der gewählten Aszendenz auf.
- Der getrennte Plan darf ausschließlich Start- und Passivknoten der
  ausgewählten Aszendenz enthalten. Normale Baumknoten und andere
  Aszendenzen sind fail-closed ausgeschlossen.
- Die Oberfläche bietet nach der Analyse einen eigenen Aszendenz-Reiter und
  zeigt Budget, verwendete und verbleibende Aszendenzpunkte separat.
- Fehlende positive Evidenz wird nicht durch künstliches Auffüllen ersetzt:
  Restpunkte bleiben sichtbar, statt konfliktbehaftete Knoten zu erfinden.
- Passive Planner `5G-1.2.0`, reale Passive-Pipeline `5H-1.1.0`.
- Baumquelle, Produktdaten, Datenpins, Analyzerarchitektur und
  Waffen-Set-Regel bleiben unverändert.

# Rückkopplung der Passive-Skalierungen

- Die bisherige Integrationslücke ist geschlossen: belegte normale Passiv-
  und Aszendenzknoten beeinflussen jetzt die nachfolgenden Analyzer.
- Die feste Reihenfolge lautet Equipmentprofil, Aszendenzplan,
  Aszendenzwirkung, gemeinsamer Passivplan, gemeinsame Wirkung,
  Waffen-Set-Pläne und nachgelagerte Analyzer.
- Gemeinsame Passiv- und Aszendenzwirkungen werden in beide getrennten
  Waffen-Set-Profile übernommen; die Set-Pfade bleiben weiterhin getrennt.
- Verwendet werden ausschließlich vorhandene semantische Profilfelder,
  Knotenklassifikationen und Passive-Zielregeln.
- Unbekannte oder nicht sicher klassifizierbare Knotenzeilen erzeugen keine
  Skalierung.
- Die Passive-Ansicht weist die Zahl der berücksichtigten Aszendenz- und
  gemeinsamen Baumknoten aus.
- Das Ergebnis ist eine deterministische semantische Rückkopplung und keine
  exakte DPS- oder Charakterwertsimulation.
