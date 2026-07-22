# 5M.1B – Technischer Import zusätzlicher Itemklassen

## Umfang und Freigabe

Importiert werden ausschließlich normale Jewels, Charms, Life Flasks und Mana Flasks aus `repoe-fork/poe2` Export `4.5.4.4.4`, Commit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`; dokumentierter Parsercommit: `14e3edc89ed705bd4e4eda5c8135756431c76e81`. Die drei Scopes bleiben eng `conditionally-approved`; dies ist keine allgemeine Lizenzfreigabe.

Relics bleiben deferred. Unique-Items/-Mods, Runen, Soul Cores, Idols, Abyssal Eyes, Congealed Mist, Socketable-Wirkungen, Desecrated/Mutated Mods, weitere Corruption-Daten, Enchantments, Anointments, Skills, Supports, Anzeigenamen, deutsche Texte und Medien sind ausgeschlossen. 5M.2 und 5N wurden nicht begonnen.

## Import und Provenienz

`scripts/poe2-additional-item-import.mjs` verlangt alle Pins, prüft Approval und SHA-256 vor Verarbeitung und schreibt stabil sortiertes JSON nach `generated/poe2-items/`. Manifest, Eingabegrößen/-hashes, verwendete Felder, Ausgabehashes, Attribution und Entfernbarkeit stehen in `additional-item-source-manifest.json`. Kein Laufzeitabruf, Hotlink, Windows-Pfad oder Rohdatenspiegel.

Der saubere Commit-Checkout besitzt andere Quelldateihashes als der ältere 5M.1-Importer. Deshalb wurden dessen 1.828 Records nicht regeneriert. Der neue Import blockiert ID-Überschneidungen; tatsächlich gibt es null. Diese Provenienzdifferenz bleibt Risiko eines späteren kontrollierten 5M.1-Reaudits.

## Inventar und Zählregeln

Eine Referenz ist eine eindeutige Mod-ID je Kategorie in erlaubten Prefix-/Suffix-Maps. Ein Tier entspricht einem technischen Mod; eine Statzeile einem `stats[]`-Eintrag. Geteilte Flask-IDs bleiben in Kategorieausgaben nachvollziehbar und werden im Laufzeitregister nach technischer ID dedupliziert.

| Kategorie | Referenzen | Kategorie-Mods | Basen | Prefix | Suffix | Implicit | Statzeilen | Mehrzeiler/Hybrid |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Jewels | 320 von 446 auditierten | 320 | 8 released | 142 | 178 | 0 | 322 | 2 |
| Charms | 51 | 64 inkl. Basis-Implicits | 13 | 27 | 24 | 13 | 64 | 0 |
| Life Flasks | 57 | 57 | 9 | 33 | 24 | 0 | 63 | 6 |
| Mana Flasks | 52 | 52 | 9 | 28 | 24 | 0 | 58 | 6 |

Bei Jewels bleiben 115 `unique`- und 11 `corrupted`-Referenzen sowie die `unique_only`-Basis ausgeschlossen. Das Laufzeitregister enthält 427 eindeutige neue IDs. Es wird nie anhand sichtbarer Texte verbunden.

## Modelle, UI, Worker und Analyzer

Das bestehende Affixmodell wurde nur um Basereferenzen ergänzt. `TechnicalBaseItem` bewahrt Klasse, technische Base-ID, minimale erlaubte Eigenschaften, Tags, Implicits, Quelle und Status. Die Eigenschaften sind Daten; Flask- oder Charm-Simulation gibt es nicht.

Sechs Slots (zwei normale Jewels, zwei Charms, Life Flask, Mana Flask) verwenden den vorhandenen Affixdialog. Er unterstützt Base, Itemlevel, Affixseite, technische ID-/Stat-Suche, Tier, begrenzte reale Rollwerte, Konflikte und Entfernung. Charm-Implicits werden über die gewählte Base aufgelöst. `translation-missing` ist sichtbar; Unique-/Cluster-Picker werden nicht angezeigt.

Datenfluss: UI → `EquipmentEntry`/technisches Jewel → `BuildProfile.technicalItems` → Workerrequest → Orchestrator. Base, Klasse, Mod, Tier, Stat-ID, Wert, Source-Version und Status bleiben erhalten. Der Jewel Analyzer erhält reale Jewel-Selektionen und markiert deren technische Stat-IDs transparent unsupported; sichtbare Texte steuern keine Bewertung. Charms/Flasks sind `transport-only`. Die vollständige Equipment-Signatur setzt Ergebnisse bei Klasse, Base, Mod, Tier, Wert, Itemlevel, Implicit oder Flasktyp stale; Dialog öffnen/schließen startet oder veraltet nichts. Unsichere Altwerte bleiben `legacy-unresolved`.

## Vollständigkeit, Performance und Grenzen

Alle 427 Laufzeit-IDs sind auswählbar; fachlich verarbeitbare neue Stats: 0, absichtlich unsupported: 427. Kategoriebezogen sind 493 Records `translation-missing`, wobei geteilte technische IDs mehrfach zählen. Details: `additional-item-coverage-report.json`.

Beobachteter Import: unter 1 s. Normalisierte Fachausgaben ohne Manifest: rund 0,75 MiB in elf Dateien; größte Datei `jewel-mods.json` mit 459.174 Bytes. Exakte Größen/Hashes stehen im Manifest. Weitere verlässliche Dialog-, Such-, Filter- und Speicherwerte sind bis zur Browsermessung **Unbekannt**. Daten werden statisch lokal gebündelt; externe Requests: 0.

Charmaktivierung, Charges, Recovery, Flaskqualität, Restoration, Trigger und Spezialmechaniken werden nicht simuliert. Physische iPhone-Abnahme ist offen und wird nicht behauptet. Neue Releases verlangen neue Pins, Hashes, Approval, Kategoriediff, Überschneidungsprüfung, zwei deterministische Läufe und manuelle Freigabe.

Empfohlener Folgeschritt: verlustfreie Parserentscheidung für Socketable-Wirkungen oder kontrollierte deutsche Affixtextentscheidung.

## Abnahmeprotokoll

- Zwei Importläufe: alle zwölf Dateien einschließlich Manifest byteidentisch.
- Produktions-/Pages-Build: 1,15 s beziehungsweise 1,20 s; Haupt-JS 4.145,97 kB (gzip 336,98 kB). Die bestehende Vite-Warnung für große Chunks bleibt; die neuen Daten sind statisch im Hauptbundle und wurden nicht vorschnell architektonisch umgebaut.
- Desktop 1280×720 (Vorgabe 1280×800 technisch nicht exakt verfügbar): Jewel-Dialog, Base, technische Suche und Charm-Implicit geprüft; Sucheingabe beobachtet 47 ms, vier Treffer; Dialog vertikal scrollbar; keine Console-Warnung/-Fehler.
- Mobilautomation 390×844 und 430×932: Dokumentbreite 376/415 px bei Viewport 390/430 px, kein Seitenüberlauf; Dialoge vertikal scrollbar. Lange technische Optionen werden innerhalb eines horizontal geklippten Dialogs gehalten. Keine Console-Warnung/-Fehler.
- Asset-/Daten-404: keine im lokalen Browser beobachtet. Physisches iPhone: nicht geprüft. Touch wurde nur über bestehende Gestenregressionen abgedeckt.
- Zuverlässige Parse-/Index-/Filter-/Heap-Einzelmessungen: **Unbekannt**. Es werden keine erfundenen Werte angegeben.
