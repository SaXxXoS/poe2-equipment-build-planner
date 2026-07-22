# 5M.1 – Technischer PoE2-Affiximport

> 5M.1B.0C ändert diesen Import nicht. Alle neun generierten Dateien, 1.828 Mods sowie 103 Corruption-Implicits und 110 Corruption-Upgrades bleiben bytegleich. Socketable-Identitäten wurden nur als künftiger Scope bewertet; keine Rune, kein Soul Core und kein Spezialmod wurde importiert.

> Ergänzung 5M.1A: Die 1.828 Mods sind kein vollständiger PoE2-Itemmod-Bestand. Der Importfilter lässt unter anderem Jewel-, Charm-, Flask- und Relic-Zuordnungen aus; Unique-Mods, Runen und Soul-Core-Effekte sind nicht Teil dieses Imports. Der reine Audit steht in `docs/POE2_ITEM_MOD_COMPLETENESS_AUDIT.md`. Keine Fachdatei oder Approval-Regel wurde verändert. Nächster Schritt ist 5M.1B.0; 5M.2 und 5N wurden nicht begonnen.

## Ergebnis und Freigabe

Der vorherige Bestand bestand aus 18 manuell erzeugten deutschen Platzhaltern ohne reale Familien, Tiers, Itemklassen, Spawnregeln oder Konfliktgruppen. 5M.1 ersetzt ihn im Affixdialog durch einen abgeleiteten technischen Bestand aus `repoe-fork/poe2` Version `4.5.4.4.4`, Commit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`; geprüfter Parsercommit ist `14e3edc89ed705bd4e4eda5c8135756431c76e81`. Der Scope `poe2-technical-affix-data-for-build-planner` ist ausschließlich `conditionally-approved`; dies ist keine allgemeine GGG-Datenlizenz.

Verwendet werden `version.txt`, `data/mods.json`, `data/mods_by_base.json`, `data/base_items.json`, `data/item_classes.json` und `data/tags.json`. Größe und SHA-256 stehen vollständig in `generated/poe2-affixes/affix-source-manifest.json`. Aus `mods` werden technische ID, Generation Type, Domain, Level, Stats, Bereiche, Tags, Spawnweights, Gruppen und technische Identifikation gelesen; `mods_by_base` liefert die tatsächliche Klassen-/Familien-/Seiteneinordnung; `base_items` liefert Implicit-Referenzen; `item_classes` löst technische Klassen-IDs auf. `tags` wird gehasht, damit die verwendete Taxonomiequelle gepinnt ist. Goldwerte, Skills, Effekte, Visuals, Flavour, Medien, Uniques, Supports und Craftingwahrscheinlichkeiten werden verworfen. `stats.json` existiert an diesem Exportstand nicht; zusätzliche Statübersetzungstabellen sind nicht nötig, weil 5M.2 ausdrücklich nicht begonnen wurde.

## Import und Ausgaben

`scripts/poe2-affix-import.mjs` verlangt Source-Verzeichnis, Version, Export- und Parsercommit, prüft Approval sowie alle Quellhashes und sortiert jede Ausgabe stabil. Zwei Läufe erzeugen dieselben fachlichen Hashes; Zeitstempel fehlen bewusst. Das Repository enthält keinen Rohdatenspiegel, sondern nur:

- `technical-affixes.json`, Familien, Tiers und Konflikte
- technisches Itemklassenregister und Klassenindex
- Quellmanifest, Import-, Coverage- und Klassenmatrixbericht

Der aktuelle Bestand umfasst 1.828 Mods: 816 Prefixe, 568 Suffixe, 231 Implicits, 213 Special, 0 Unknown, 445 Familien, 1.828 technische Tiers, 2.265 Statzeilen, 416 strukturelle Mehrzeiler/Hybride, 29 Itemklassen und 201 Konfliktgruppen. Es gibt 0 verwaiste Referenzen. Alle 1.828 Einträge bleiben `translation-missing`; eine fachlich vollständige deutsche Anzeige wird nicht behauptet.

## Modell, UI und Laufzeitgrenze

`src/affixes/model.ts` ist das zentrale technische Modell. Familien entstehen aus Export-Familie plus Affixseite, nicht aus sichtbaren Namen. Tiers werden innerhalb dieser Grenze nach erforderlichem Item Level und technischer ID geordnet. Mehrere Statzeilen bleiben zusammen. Lokalität wird nur dann `true`, wenn alle technischen Stat-IDs explizit `local` enthalten; sonst ist sie `false` beziehungsweise bei fehlenden Stats `null`. Das ist eine bekannte technische Ableitung, keine neue Spielregel.

Der Affixdialog filtert zuerst nach der expliziten RePoE-Itemklasse, dann nach Prefix/Suffix und optional Item Level. Er blockiert Quell-Konfliktgruppen, validiert jede Statzeile gegen ihren Bereich und übernimmt echte Nutzerwerte. Bogen und Armbrust sowie Waffen-/Offhandklassen bleiben getrennt. Unbekanntes Item Level wählt keinen höchsten Tierwert automatisch. Der englische technische Fallback ist sichtbar mit „Deutsche Übersetzung noch nicht verfügbar“ markiert; IDs steuern Suche und Fachlogik, nicht der sichtbare Text.

Das normalisierte `AppliedModifier` trägt Mod-ID, Stat-IDs und Werte, Itemklasse, Seite, Tier, Level, Lokalität, Hybridstatus, Quellversion und Datenstatus. Das vorhandene BuildProfile wird strukturiert geklont und über den unveränderten Workerrequest an den Equipment Analyzer gegeben. Die vorhandene Eingabesignatur umfasst die Equipmentobjekte; fachliche Änderungen machen Ergebnisse stale, bloßes Öffnen/Schließen nicht. Alte IDs werden nicht textbasiert migriert und erscheinen kontrolliert als nicht auflösbare Legacy-Affixe.

## Grenzen, Betrieb und Update

Der Klassenindex ist eine Klassen-Union der vom Export gelieferten Basistypgruppen; ohne konkreten Basistyp kann keine feinere Tagkombination garantiert werden. Spawnweights werden erhalten und die Auswahl basiert auf der exportierten `mods_by_base`-Zulässigkeit, aber es werden keine Chancen berechnet. Die bestehende synthetische Analyzer-Semantik bewertet noch nicht jede reale Stat-ID fachlich; alle technischen IDs und Werte erreichen sie dennoch unverändert. Daher wird keine vollständige reale Buildabnahme behauptet.

Pages verwendet ausschließlich gebündelte lokale JSON-Dateien; es gibt keine Hotlinks oder Laufzeitabfragen. Ein Update verlangt neuen Pin, Hashinventar, Diff, erneute manuelle Approval-Entscheidung und vollständigen Import-/Testlauf. Zum Widerruf können `generated/poe2-affixes`, Importer und Registry in einem Commit entfernt werden. Physische iPhone-Abnahme des 5M.1-Stands ist offen und wird nicht behauptet.

Gemessener Stand: neun generierte Fach-/Manifestdateien, davon `technical-affixes.json` 3.450.039 Bytes, Tiers 2.256.717 Bytes und Klassenindex 233.526 Bytes. Der Produktionsbuild benötigte 1,77 s, der Pages-Wiederholungsbuild 1,43 s; das Hauptbundle beträgt 3.600,78 kB beziehungsweise 304,31 kB gzip. Die Desktopprüfung bei 1280 px öffnete den Helm-Dialog, filterte Item Level 1, speicherte einen realen Rollwert und meldete weder Konsolenfehler noch horizontalen Überlauf. Der angeforderte automatisierte 390×844-Viewport konnte vom Browser-Backend nicht wirksam gesetzt werden; er wird deshalb ebenso wie ein physisches iPhone ausdrücklich nicht als geprüft geführt.

Nächster fachlicher Schritt ist ausschließlich 5M.2: ID-basierte, separat freigegebene deutsche Lokalisierung und vollständige deutsche Suche. 5N wurde nicht begonnen.
> 5M.1B ergänzt separat vier freigegebene Kategorien, ohne die 1.828 bestehenden 5M.1-Records zu regenerieren oder zu duplizieren. Details: `POE2_ADDITIONAL_ITEM_CLASS_TECHNICAL_IMPORT.md`.
