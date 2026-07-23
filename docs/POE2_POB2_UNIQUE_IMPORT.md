# PoE2 PoB2 Unique Import (5M.2.9)

## 1. Ziel

Der freigegebene minimale englische PoB2-Unique-Planerdatensatz wird buildzeitlich, offline und deterministisch importiert.

## 2. Auftraggeberentscheidung

Die versionierte Projektentscheidung `approved-with-disclosed-uncertainty` erlaubt diesen Import ohne externe Einzelgenehmigung. Sie ist keine Rechtsberatung und behauptet keine Zustimmung von PoB2 oder GGG.

## 3. Approval- und Distributionsstatus

Scope: `poe2-pob2-unique-planner-data`; Approval: `conditionally-approved`; Distribution: `distribution-project-approved-with-disclosed-uncertainty`.

## 4. Quellenpin

Repository `PathOfBuildingCommunity/PathOfBuilding-PoE2`, Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

## 5. Quelldateien

Exakt die 20 Dateien aus `docs/audits/poe2-pob2-unique-source-files.json` werden gelesen. Weitere Dateien oder Includes werden nicht verfolgt.

## 6. Dateihashes

Alle 20 SHA-256-Werte werden vor dem Parsen gegen Importvertrag Version 2 geprüft.

## 7. Importvertragsversion

Vertrag `2`, Parserformat `1`, Produktpfad `generated/pob2/uniques.json`.

## 8. Importarchitektur

`scripts/pob2-unique-import/` trennt Konstanten, Quellparser und Orchestrierung. Die Web-App führt weder Lua noch den Rohparser aus.

## 9. Feldallowlist

Produktiv erlaubt sind ausschließlich Identität, englischer Name, Basisanzeige, Slot/Kategorie, Level, Varianten, sichtbare Modzeilen, Rollbereiche, Implicits, Legacy-Status, Provenienz und Auflösungsstatus.

## 10. Verbotene Felder

Bilder, Medien, Flavour Text, Droptexte, Communitynotizen, Rohmirrors, normale Affixe, Craftingdaten und behauptete GGG-Mod-/Stat-IDs werden nicht ausgegeben.

## 11. Quellenvalidierung

Repositorypin, Commit, Scope, Projektentscheidung, Distributionsstatus, Dateiliste, Hashes und Allowlist werden fail-closed geprüft.

## 12. Identitätsmodell

Die Identität ist eine PoB2-Planeridentität, keine GGG-Identität.

## 13. Namespace

IDs folgen `pob2:<relative-source-path>#<one-based-record-position>`. Die Position ist Teil des freigegebenen `sourceRecordIdentifier`.

## 14. Variantenmodell

PoB2-Varianten bleiben getrennt. `Current` und `Pre …` werden ausschließlich aus strukturierten PoB2-Variantendirektiven klassifiziert; 126 sonstige Varianten bleiben statusmäßig unbekannt.

## 15. Modzeilenmodell

Zeilen erhalten stabile Zeilen-ID, Quellreihenfolge, Variantenscope, normalisierte Planerzeile, Rollbereiche und ausdrücklich leere technische GGG-Links.

## 16. Wertebehandlung

Nur PoB2-definierte Klammer-Rollbereiche werden strukturiert übernommen. Freie Zahlenerkennung und Rückrechnung aus Darstellungstexten finden nicht statt.

## 17. Granted Skills

104 `Grants Skill`-Hinweise wurden auditseitig erkannt. Der Feldstatus ist weiterhin `pending`; daher wurden null Referenzen produktiv importiert.

## 18. Granted Supports

Es wurden null zugelassene Unique-linked Supportreferenzen importiert. Ein Supportvollimport findet nicht statt.

## 19. Provenienz

Alle 435 Datensätze tragen Source Kind, Repository, Commit, Quellrecord, Lizenz-/Unsicherheitsstatus, Identity-, Werte-, Varianten- und Lokalisierungsstatus.

## 20. Lokalisierung

Englische PoB2-Planertexte sind Quelle. Für alle 435 Datensätze gilt deutsch `translation-missing`; keine deutsche Übersetzung oder CSD-Textzuordnung wurde erzeugt.

## 21. Produktdatei

`generated/pob2/uniques.json`, 2.921.928 Bytes, SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`.

## 22. Manifest

Das bereinigte Manifest liegt in `docs/audits/poe2-pob2-unique-import-manifest.json`; Rohquelldaten bleiben lokal und gitignored.

## 23. Deterministische Sortierung

Items werden nach Produkt-ID, Varianten nach Quellreihenfolge und Zeilen nach `lineOrder` sortiert.

## 24. Fachlicher Hash

`a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329`; Zeitstempel sind ausgeschlossen.

## 25. Coverage

435/435 Records importiert, 579 Varianten, 2.345 sichtbare Modzeilen, 273 Implicit-Zeilen und 1.689 Rollbereiche.

## 26. Blockierte Datensätze

Null. Unbekannte Schemas oder Felder hätten den gesamten Lauf abgebrochen.

## 27. Verworfene Datensätze

Null. Bekannte, nicht freigegebene Steuerdirektiven wurden gezählt und nicht ausgegeben.

## 28. Bekannte Lücken

126 Varianten besitzen keine technisch bestätigte Current-/Legacy-Klassifikation; 1.018 Zeilen besitzen keinen strukturierten Rollbereich; Skills/Supports und GGG-IDs bleiben ungelöst.

## 29. Bestehende Einschränkungen

Planerzeilen sind keine regulären Affixe und keine technische GGG-Statwahrheit. Die dokumentierte externe Rechteunsicherheit bleibt bestehen.

## 30. Integration in Runtime

`src/uniques/pob2-registry.ts` lädt ausschließlich die normalisierte Produktdatei offline. Rohdateien, Parser und Netzwerk sind nicht Teil der Runtime.

## 31. Integration in Unique Analyzer

Die Produktregistry stellt dem bestehenden Unique Analyzer 435 quellenmarkierte Kandidaten bereit. Der passive Worker transportiert weiterhin keine Unique-Gesamtdaten, da dort keine Unique-Auswahl stattfindet und sein Compact-Vertrag unverändert bleibt. Sichere Slot- und Levelinformationen werden genutzt; Tags, GGG-Stats und nicht belegte Regeln bleiben leer beziehungsweise unbekannt.

## 32. Trennung von Fixtures

Produkt-IDs beginnen mit `pob2:`. Synthetische Testdaten bleiben ausschließlich in `src/engine/fixtures` und besitzen getrennte Fixture-IDs.

## 33. Trennung von regulären Affixen

Keine PoB2-Zeile wird in die technische Affixregistry geschrieben.

## 34. Trennung von Craftingdaten

Keine PoB2-Zeile gelangt in Craftingpools, Spawnweights oder Konfliktgruppen.

## 35. Attribution

README, Datenquellendokumentation und `THIRD_PARTY_NOTICES.md` nennen Path of Building Community, Repository, Commit und Unsicherheitsstatus.

## 36. Third-Party-Notices

Der bestehende Hinweis bleibt verbindlich; keine Zugehörigkeit oder Billigung durch PoB2 beziehungsweise GGG wird behauptet.

## 37. Sicherheitsguards

Pin-, Scope-, Projektentscheidungs-, Feld-, Provenienz-, Produkttrennungs- und Distributionsguards bleiben aktiv.

## 38. Determinismus

Zwei getrennte Importläufe und die Produktdatei sind byteidentisch. Details: `docs/audits/poe2-pob2-unique-import-determinism.json`.

## 39. Tests

Importer-, Parser-, Guard-, Registry- und Analyzerprüfungen: 16/16 fokussierte Tests erfolgreich. Gesamtsuite: 984/984. Approval-Finalprüfung: 45/45. Lint, Typecheck, Produktions-Build, Pages-Build, JSON-Validierung, `git diff --check` und Git-Sicherheitsprüfung erfolgreich. Die deployte GitHub-Pages-Version wurde auf Desktop und mit 390 × 844 geprüft; keine neue Konsolenwarnung oder kein Konsolenfehler und kein Seiten-Horizontalüberlauf.

## 40. Klare Schlussfolgerung

Der minimale englische PoB2-Unique-Planerdatensatz ist produktiv importiert und quellengetrennt verfügbar. Er ersetzt keine GGG-/RePoE-Technikdaten.

## 41. Empfohlener nächster Schritt

Nach Stabilisierung dieses Imports ist eine separate, eng begrenzte Aufgabe für die noch fehlende deutsche Unique-Darstellung zu entscheiden. 5M.2 und 5N sind weiterhin nicht begonnen.

## Folgestand 5M.2.10

Das Offline-Lokalisierungsaudit bestätigt den unveränderten englischen Bestand. Deutsche `Words`-, BaseItem- und CSD-Inhalte liefern zahlreiche Textkandidaten, aber keine gemeinsame technische Identität zu den `pob2:`-Records. Status: `audit-only-no-safe-product-link`; alle 435 Items bleiben deutsch `translation-missing`. Es wurden weder deutsche Produktdaten noch automatische Übersetzungen erzeugt.
## Deutsche Anzeigeschicht 5M.2.11

Der englische Import bleibt unverändert und maßgeblich. Die deutsche Anzeige liegt separat unter `generated/localization/de/pob2-uniques.json` und referenziert ausschließlich PoB2-Item-, Varianten- und Zeilen-IDs. Sie dupliziert keine Rollbereiche oder Analyzerfelder und erzeugt keine technische GGG-Verbindung.
