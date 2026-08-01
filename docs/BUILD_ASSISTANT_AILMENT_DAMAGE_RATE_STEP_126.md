# Build-Assistent – Ablaufrate schädigender Zustände, Schritt 126

## Ziel

Schritt 126 verbindet die im realen Passivbaum belegten Werte für schneller oder langsamer verursachten Schaden von Entzünden, Gift und Blutung mit der laufenden Schadensberechnung.

## Gepinnte Quelle

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Formelreferenz: `src/Modules/CalcOffence.lua`
- Produktbaum: `generated/poe2-tree/tree.json`

## Berechnung

PoB2 trennt Magnitude und Ablaufrate. Die produktive Reihenfolge lautet:

`Ratenmultiplikator = (1 + Summe schneller / 100) / (1 + Summe langsamer / 100)`

`DPS = DPS vor Ablaufrate × Ratenmultiplikator`

`Dauer = Dauer vor Ablaufrate / Ratenmultiplikator`

Dadurch steigt bei einer schnelleren Ablaufrate der Schaden pro Sekunde und die Dauer sinkt proportional. Der Gesamtschaden derselben einzelnen Anwendung bleibt unverändert.

## Produktive Baumabdeckung

Im gepinnten Baumstand sind neun bedingungsfrei und exakt auswertbare Knoten vorhanden:

- drei allgemeine Knoten für schädigende Zustände,
- fünf Knoten für Entzünden,
- ein Knoten für Blutung.

Die Auswertung verwendet die tatsächlich aktive Waffenset-Planung sowie zugewiesene Aszendenzknoten. Ein Set-1-Knoten wirkt nicht automatisch in Set 2.

## Evidenzgrenzen

- Nur exakt definierte englische PoB2-Baumzeilen werden erkannt.
- Bedingte Texte werden nicht durch Teilstring- oder Ähnlichkeitssuche aktiviert.
- Im aktuellen lokalen Produktbaum wurde kein gleichwertiger bedingungsfreier Gift-spezifischer Knoten gefunden.
- Eine vollständige gegnerseitige `DamageTakenOverTime`-Kette ist in den bisher gepinnten Produktreferenzen nicht sicher belegt und wurde deshalb nicht erfunden.

## Versionen

- Zustandsmodell: `2.7.0`
- Schadensrechner: `3.40.0`

## Prüfung

- Fokussierte Referenztests: 4 Dateien, 69 Tests, erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich
- Produktionsbuild: erfolgreich
- Pages-Build: erfolgreich
- Serielle Gesamtsuite: 139 Dateien, 1.706 Tests, erfolgreich

## Nächster Schritt

Als nächstes wird eine belegte gegnerseitige Schaden-über-Zeit-Aufnahme aus Flüchen, Flüchenzuständen, Flüchen und sonstigen Debuffs inventarisiert. Produktiv wird sie nur, wenn Quelle, Bedingung, Schadensart und Stapelregel vollständig verbunden sind.
