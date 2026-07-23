# Deutsche Lokalisierungsstrategie für PoB2-Unique-Planerdaten (5M.2.10)

## 1. Ziel

Diese Aufgabe prüft ausschließlich offline, ob der produktive englische PoB2-Unique-Bestand sicher mit bereits vorhandenen deutschen Clientdaten verbunden werden kann. Sie importiert keine deutschen Produkttexte.

## 2. Ausgangsstand

Ausgangscommit ist `8bc97c1e73c2be81134fbb2ea1e9bd2e50360d75`. Der englische Produktbestand bleibt unverändert.

## 3. Produktiver PoB2-Unique-Bestand

`generated/pob2/uniques.json` enthält 435 Items, 579 Varianten, 2.345 Modzeilen, 273 Implicit-Zeilen und 1.689 strukturierte Rollbereiche. SHA-256 ist `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`, Fachhash `a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329`.

## 4. Bestehende deutsche Datenquellen

Geprüft wurden die 589 normalisierten CSD-Dateien, englische/deutsche `BaseItemTypes`, `Words`, `ItemClasses` sowie die in 5M.2.6 extrahierten Unique-bezogenen DAT-Tabellen. Vollständige Einzelheiten stehen im Quelleninventar.

## 5. Quellenpins

- Content.ggpk: `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`
- PoB2: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Schema: `268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30`
- Referenzmanifest: `a4bbcd99f21490520b516c83800e67bf3a0b691e971d0da59e318dfe6e971353`

## 6. Datenformate

CSD liegt als normalisiertes Audit-JSON mit Stat-IDs und Sprachvarianten vor. Balancequellen liegen als gepinnte DATC64-Extrakte und normalisierte Audit-JSONs vor. Der PoB2-Produktbestand ist normalisiertes JSON.

## 7. Deutsche Unique-Namen

Die lokale `Words`-Tabelle besitzt 3.246 sprachparallele Records. 434/435 PoB2-Namen führen über exakten sichtbaren englischen Text zu genau einem Words-Record, ein Name zu mehreren Records; 392 der eindeutigen Kandidaten besitzen eine abweichende deutsche Anzeige.

Diese 434 Treffer sind `display-text-only`, nicht `deterministic-exact`: PoB2 liefert keinen gemeinsamen Words-Schlüssel, `HASH32` oder eine technische GGG-Unique-ID. Produktfreigabe: 0/435.

## 8. Deutsche Basistypen

425/435 Items besitzen genau einen englischen Anzeigenamen-Kandidaten in `BaseItemTypes`; zehn sind mehrdeutig. Die zugehörigen deutschen BaseItem-Namen sind lokal vorhanden. Der Einstieg erfolgt jedoch über `baseDisplayName`, nicht über eine BaseItem-ID. Daher sind 425 `textCandidateOnly`, zehn `ambiguous` und null produktionssicher.

## 9. Deutsche Modzeilen

Ein Auditvergleich normalisiert englische PoB2-Zeilen und englische CSD-Templates nur zur Kandidatensuche. Ergebnis: 759 eindeutige Templatekandidaten, 355 mehrdeutige Kandidaten und 1.231 Zeilen ohne lokalen Templatekandidaten. Technisch exakte, template-genau freigegebene oder wertparametrisch sichere Produktzuordnungen: jeweils 0.

## 10. Deutsche Implicits

Von 273 Implicit-Zeilen besitzen 57 einen eindeutigen Auditkandidaten, 46 mehrere Kandidaten und 170 keinen Kandidaten. Ohne bestätigte PoB2→BaseItem-/Mod-/Stat-ID sind weder Basistyp- noch Unique-Implicits sicher wiederverwendbar. Sichere Coverage: 0.

## 11. Varianten

Alle 579 Varianten bleiben in ihrer PoB2-Struktur getrennt. Deutsche variantenspezifische Inhalte sind für 0 Varianten sicher verbunden.

## 12. Legacy

250 Legacy-, 203 Current- und 126 statusmäßig unbekannte Varianten bleiben unverändert. „Aktuell“, „Legacy“ und „Unbekannter Variantenstatus“ können später als UI-Systemtexte lokalisiert werden; sie sind keine Übersetzung der Unique-Datensätze.

## 13. Technische Identitätsketten

Eine zulässige Produktverbindung erfordert einen gemeinsamen stabilen Unique-Schlüssel oder eine vollständig reproduzierbare technische Kette bis BaseItem-/Mod-/Stat-ID und Variantenzeile. Keine geprüfte Quelle liefert diese Verbindung zu den `pob2:`-Records.

## 14. Fehlende GGG-ID-Kette im PoB2-Datensatz

`technicalGggModLink` ist stets `null`, `technicalGggStatLinks` ist leer und `gggIdentityStatus` ist `unknown`. Dies ist beabsichtigt und wurde nicht verändert.

## 15. Zulässige Zuordnungsmethoden

Zulässig für eine spätere Freigabe sind gemeinsame stabile technische IDs, vollständig reproduzierbare Ableitungen aus freigegebenen eindeutigen technischen Feldern und Feldprovenienz. Textvergleich darf nur Auditkandidaten erzeugen.

## 16. Unzulässige Zuordnungsmethoden

Verboten bleiben Name-only-, Textähnlichkeits-, Basistypanzeigen- und Zahlen-only-Joins, erfundene GGG-IDs, freie oder KI-Übersetzung sowie Variantenverschmelzung.

## 17. Textmatching als Audit

Die Kandidatenmessung behauptet keine technische Identität. Alle Kandidaten tragen sinngemäß `candidate-only`, `not-product-approved` und `no-technical-identity-proof`.

## 18. Parameter- und Werteprüfung

Die 1.689 Rollbereiche verteilen sich auf 1.490 Modzeilen- und 199 Implicit-Rollbereiche. Bei Modzeilen besitzen 382 Rollbereiche einen eindeutigen Kandidaten mit passender Parameterzahl; 1.108 sind nicht sicher zuordenbar. Bei Implicits sind es 35 beziehungsweise 164. Auch passende Parameterzahlen ersetzen keine technische Identität; wertparametrisch sichere Produktzuordnungen bleiben null.

## 19. Coverage

- Items: 435 geprüft, 0 sicher deutsch verbunden, 435 `translation-missing`
- Varianten: 579 geprüft, 0 sicher deutsch verbunden
- Modzeilen: 2.345 geprüft, 0 sicher deutsch verbunden
- Implicits: 273 geprüft, 0 sicher deutsch verbunden
- Text-/Templatekandidaten bleiben ausschließlich Auditdaten

## 20. Ungelöste Zuordnungen

Ungelöst bleiben Unique-Identität, PoB2→Words-Schlüssel, PoB2→BaseItem-ID, PoB2-Zeile→Mod-/Stat-ID, Variantenlokalisierung und die sichere Werteparameterbindung.

## 21. Lokalisierungsdatenmodell

Ein späteres Artefakt kann `generated/localization/de/pob2-uniques.json` heißen. Es enthält nur Anzeigeübersetzungen und verbindet über `uniqueId`, `sourceVariantId` und `sourceLineId`. Vorgesehen sind `localizedName`, `localizedBaseDisplayName`, `localizedVariants`, `localizedModifiers`, `localizedImplicits`, Feldstatus, Quellenreferenz, Auflösungsmethode, Confidenceklasse und ungelöste Felder.

In 5M.2.10 wurde dieses Produktartefakt nicht erzeugt.

## 22. Fallbackmodell

Spätere Reihenfolge: (1) technisch gesicherter deutscher Text, (2) englischer PoB2-Text, sofern die Produktpolicy ihn erlaubt, (3) `translation-missing`. Eine automatisch erzeugte Übersetzung existiert nicht.

## 23. Getrennte Provenienz

PoB2 bleibt englische Strukturquelle. Jeder deutsche Feldwert benötigt eigene Quelle, Pin und Auflösungsmethode. Englische Varianten, Rollbereiche, Analyzerfelder und Provenienz werden nicht in einer deutschen Datei dupliziert.

## 24. Neuer möglicher Approval-Scope

Vorgeschlagen, aber nicht angelegt oder freigegeben: `poe2-local-german-unique-localization`. Voraussetzung ist eine gemeinsame stabile Identitätsbrücke oder eine separat geprüfte deterministische Lokalisierungsquelle.

## 25. Erlaubte Felder

Nach einer späteren Freigabe wären ausschließlich Name, Basistypanzeige, Variantenlabel, einzelne Mod-/Implicit-Anzeigezeilen, Feldstatus und Provenienz zulässig.

## 26. Verbotene Felder

Verboten bleiben englische Strukturduplikate, technische Rollbereiche, erfundene GGG-IDs, normale Affixdaten, Medien, Flavour Text und automatisch erzeugte Übersetzungen.

## 27. Produkttrennung

`generated/pob2/uniques.json`, Registry, Unique Analyzer, normale Affixdaten, RePoE-/GGG-Pins und PoB2-Pin wurden nicht verändert.

## 28. Updateverfahren

Ein späteres Update muss Produkt- und Quellenhash prüfen, nur freigegebene Schlüssel verwenden, jeden Feldstatus neu berechnen, deterministisch sortieren und bei Identitätsverlust abbrechen.

## 29. Determinismus

Zwei getrennte lokale Auditläufe erzeugten denselben Fachhash `b5b221932409df1619636f3e47f08af781d04ca866b9ca82d12eebf350926b68` und byteidentische Manifeste.

## 30. Risiken

Textkandidaten können trotz identischer Darstellung andere technische Bedeutungen, Bedingungen oder Varianten besitzen. Parametergleichheit und Zahlenparität sind keine Identitätsbeweise. Nicht belegbare Punkte bleiben `Unbekannt`.

## 31. Gesamtstatus

`audit-only-no-safe-product-link`

## 32. Klare Schlussfolgerung

Lokale deutsche Inhalte sind umfangreich vorhanden, aber kein geprüfter Pfad verbindet sie technisch sicher mit den 435 PoB2-Items oder ihren Zeilen. Ein deterministischer deutscher Produktimport kann daher jetzt **nicht** beginnen.

## 33. Ausführbarer Folgeauftrag

Nächster Auftrag: **5M.2.10A – Offline-Audit einer stabilen Unique-Identitätsbrücke**. Er soll ausschließlich prüfen, ob ein gepinnter PoB2-Generatorinput oder eine bereits lokale technische Quelle einen gemeinsamen Words-/Unique-/Base-/Mod-/Stat-Schlüssel liefert. Ohne solchen Nachweis bleiben alle deutschen Unique-Felder `translation-missing`.
## Umsetzung 5M.2.11

Die Auftraggeberentscheidung ersetzt die zuvor nur technisch erlaubte Lokalisierungsbrücke durch eine ausdrücklich getrennte App-Anzeigeschicht. Sie behauptet keine GGG-Lokalisierung und erzeugt keine GGG-IDs. Ergebnis: 435/435 Namen, 435/435 Basistypen, 579/579 Varianten, 2.345/2.345 Modzeilen und 273/273 Implicits besitzen Anzeigeeinträge. Status: 1.992 `reviewed-app-translation`, 2.080 `review-required`, 0 `verified-local-source`, 0 `translation-missing`. Der englische Produktbestand bleibt unverändert; Details stehen in `POE2_POB2_UNIQUE_GERMAN_DISPLAY_LAYER.md`.
