# Deutsche PoB2-Unique-Anzeigeschicht (5M.2.11)

## Ziel und Abgrenzung

Aufgabe 5M.2.11 ergänzt die 435 englischen PoB2-Unique-Planerdatensätze um eine getrennte deutsche Anzeigeschicht. Sie ist eine App-Lokalisierung, keine technische oder offizielle GGG-Lokalisierung. `generated/pob2/uniques.json`, Registry, Unique Analyzer, Engine, Crafting- und RePoE-Daten bleiben unverändert.

## Quellen und Pins

- englische Produktstruktur: `generated/pob2/uniques.json`, SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`, Fachhash `a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329`
- PoB2: `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- lokaler GGG-Client: `Content.ggpk` SHA-256 `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`
- Schema: SHA-256 `268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30`
- Referenzmanifest: SHA-256 `a4bbcd99f21490520b516c83800e67bf3a0b691e971d0da59e318dfe6e971353`

Lokale Words-/BaseItem-Daten dienen als geprüfte sprachliche Grundlage. Mangels technischer Unique-ID-Brücke werden solche Übernahmen als `reviewed-app-translation`, nicht als `verified-local-source`, ausgewiesen. CSD-Kandidaten werden nur als Übersetzungshilfe genutzt; sie erzeugen keine GGG-Mod- oder Stat-ID.

## Modell und Identität

`generated/localization/de/pob2-uniques.json` enthält ausschließlich Anzeigefelder. Die Verbindung erfolgt nur über `uniqueId`, `sourceVariantId` und `sourceLineId`. Englische Struktur, Rollbereiche, Analyzerfelder, technische IDs und vollständige Provenienz werden nicht dupliziert.

Jedes Feld besitzt genau einen Status:

- `verified-local-source`: technisch identische lokale Quelle; im aktuellen Bestand 0
- `reviewed-app-translation`: geprüfte lokale Anzeigeübernahme oder App-Übersetzung
- `review-required`: verständlicher App-Entwurf mit verbliebener sprachlicher Mehrdeutigkeit
- `translation-missing`: kein deutscher Text; englischer Fallback

Die Laufzeitauflösung ist: deutscher Anzeigetext, sonst englischer PoB2-Text, sonst `translation-missing`. Wertebereiche werden ausschließlich aus dem unveränderten englischen Produktdatensatz in die vorhandenen Platzhalter eingesetzt.

## Coverage

| Feldgruppe | Gesamt | reviewed-app-translation | review-required | translation-missing |
|---|---:|---:|---:|---:|
| Unique-Namen | 435 | 434 | 1 | 0 |
| Basistypnamen | 435 | 425 | 10 | 0 |
| Variantenbezeichnungen | 579 | 579 | 0 | 0 |
| Modzeilen | 2.345 | 474 | 1.871 | 0 |
| Implicits | 273 | 75 | 198 | 0 |
| Systemtexte | 5 | 5 | 0 | 0 |
| Summe | 4.072 | 1.992 | 2.080 | 0 |

`verified-local-source` ist 0, weil PoB2 weiterhin keine technisch belegte gemeinsame Unique-/Mod-/Stat-ID-Kette mit den lokalen GGG-Daten besitzt. Die 2.080 `review-required`-Felder sind anzeigbar, werden aber als sprachlich nachzuprüfen gekennzeichnet.

## Generator, Runtime und Sicherheit

`scripts/pob2-unique-german-display/generate.mjs` prüft Produkt-, PoB2-, Client-, Schema- und Referenzpins, erzeugt deterministisch die reine Anzeigedatei und bricht bei Struktur- oder Pinabweichung ab. `src/localization/pob2-uniques-de.ts` verbindet beide Schichten ID-basiert. Die neue bestehende UI-Sektion bietet Suche, Auswahl, Varianten, Implicits und Modzeilen; Registry und Analyzer werden nicht verändert.

Es gibt keine Runtime-Übersetzung, keine Onlinequelle, keine API, kein Scraping, keine PoE2DB-Automatisierung und keine Textheuristik als technische Wahrheit. Englische Produktdaten und technische GGG-/RePoE-Daten werden nicht überschrieben oder vermischt.

## Schlussfolgerung

Die App ist für deutschsprachige Spieler vollständig bedienbar: alle vorgesehenen Unique-Anzeigefelder besitzen einen deutschen Anzeigetext, und der definierte englische Fallback bleibt funktionsfähig. Sprachlicher Feinschliff ist für 2.080 Felder offen. Diese Aussage betrifft ausschließlich App-Verständlichkeit; sie behauptet weder offizielle GGG-Texte noch technische GGG-Identitäten.

Nächster Auftrag: gezielter manueller Sprachreview der `review-required`-Felder, priorisiert nach Nutzung, ohne Änderung der englischen PoB2-Struktur oder technische ID-Zuordnung.

