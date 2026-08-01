# Build-Assistent – Dauer von Beeinträchtigungen auf dem Charakter, Schritt 123

## Ziel

Dieser Schritt ergänzt das Charakter-Schutzmodell um die Dauer von Blindheit und Zuständen auf dem eigenen Charakter. Die App kann damit belegen, ob Entzünden, Kühlen, Einfrieren, Schock, Versengen, Sprödigkeit, Saft, Blutung oder Gift kürzer beziehungsweise länger wirken. Sie erfindet keine gegnerische Grunddauer und deshalb auch keine Dauer in Sekunden.

## Gepinnte Referenz

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- PoB2-Regel: `CalcDefence.lua`
- Baum: `data-sources/poe2-tree/raw/0.5.2/data.json`
- technische Affixe: Produktstand `4.5.4.4.4`

PoB2 verrechnet erhöhte und verringerte Dauer zunächst additiv. Elementare Zustände erhalten zusätzlich die gemeinsame Elementar-Zustandsdauer. Anschließend wird die Dauer durch `100 / (100 + Ablaufgeschwindigkeit)` geteilt. Genau diese belegte Reihenfolge verwendet das lokale Modell.

## Implementiertes Modell

`debuffDurationOnSelf` enthält:

- gemeinsame Ablaufgeschwindigkeit von Beeinträchtigungen
- daraus folgenden gemeinsamen Dauermultiplikator
- Blindheitsdauer
- getrennte Dauermultiplikatoren für Entzünden, Kühlen, Einfrieren, Schock, Versengen, Sprödigkeit, Saft, Blutung und Gift

Die Ausgabe sind relative Prozentwerte. `75` bedeutet beispielsweise 75 Prozent der ursprünglichen Dauer, nicht 75 Sekunden.

Technische Gegenstandswerte werden ausschließlich über bestätigte Stat-IDs übernommen. Unterstützt sind gemeinsame Elementar-Zustandsdauer sowie einzelne Dauerwerte für Kühlen, Einfrieren, Entzünden, Schock, Blutung und Gift. Sichtbarer Text ohne technische Zuordnung erzeugt keine Wirkung.

## Reale Baum-Coverage

Der normalisierte Baum 0.5.2 enthält 19 exakt auswertbare Knoten für diesen Schritt. Repräsentative, gegen das echte Produktartefakt getestete Knoten sind:

- `5335` – 10 % verringerte Dauer von Zuständen auf dem Charakter
- `9968` – 25 % verringerte Schockdauer
- `11330` – Beeinträchtigungen laufen 10 % schneller ab
- `4810` – 40 % verringerte Blutungsdauer und Immunität gegen verderbtes Blut
- `4544` – 40 % verringerte Giftdauer

Weitere reale Knoten decken Einfrieren, Entzünden, allgemeine Zustandsdauer und allgemeine Ablaufgeschwindigkeit ab.

## Fail-closed-Grenzen

- Bedingte Zeilen werden ohne bestätigten Laufzeitzustand in `blockedLines` geführt.
- Spezifische Ablaufgeschwindigkeit einzelner Zustände wird erst verwendet, wenn eine technische Quelle sie belegt.
- `more`/`less`-Dauermultiplikatoren bleiben neutral, solange der lokale Produktbestand keine eindeutige Quelle liefert.
- Fluchdauer ist eine eigene Regelklasse und nicht Teil dieses Schritts.
- Eine konkrete Dauer in Sekunden benötigt zusätzlich eine belegte gegnerische Grunddauer beziehungsweise ein Gegnerprofil.

## Versionen

- Charakter-Schutzmodell: `1.7.0`
- Schadensrechner: `3.37.0`

## Prüfung

- Fokussierte Referenztests: 3 Dateien, 89 Tests, erfolgreich
- Reale Produktreferenzen: 5 Knotenfälle, erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich
- Gesamtsuite: 136 Dateien und 1.698 Tests in kontrollierten Teilmengen ohne fachlichen Testfehler
- Produktionsbuild: erfolgreich
- Pages-Build: erfolgreich

Der große kombinierte Vitest-Lauf meldete nach bestandenen Tests erneut eine bekannte `onTaskUpdate`-RPC-Zeitüberschreitung des Workers. Die schweren Teilmengen wurden separat erfolgreich ausgeführt; dies ist eine Runner-Grenze, kein fachlicher Testfehler.

## Offene Grenze

Das Modell beschreibt Schutzwirkung und relative Dauer. Eine zeitabhängige Kampfsimulation benötigt weiterhin belegte Quellen für gegnerische Anwendungen, Grunddauern, Wiederanwendung und Uptime.
