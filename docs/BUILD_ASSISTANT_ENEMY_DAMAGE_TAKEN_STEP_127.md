# Build-Assistent – gegnerseitige Schadenserhöhung, Schritt 127

## Ziel

Schritt 127 verbindet erstmals eine vollständig belegte gegnerseitige Schadenserhöhung mit Treffer-, nativem DoT- und schädigendem Zustandsmodell. Produktiv integriert wird ausschließlich `Wither`/`Withered` für Chaosschaden.

## Gepinnte Quelle

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Trefferformel: `src/Modules/CalcOffence.lua`, insbesondere `DamageTaken` und typisierter `DamageTaken`
- DoT-Formel: `src/Modules/CalcOffence.lua`, insbesondere `DamageTakenOverTime`, `ChaosDamageTaken` und `ChaosDamageTakenOverTime`
- Withered-Stapelregel: `src/Modules/CalcPerform.lua`, `ChaosDamageTaken` mit Multiplikator `WitheredStack` und Limit 10
- Fertigkeitswerte: `generated/pob2/damage-reference.json`

## Produktive Berechnung

Für jede Schadensart gilt nach Widerstand beziehungsweise Rüstung:

`Schaden nach Gegnerabwehr = Schaden nach Widerstand/Rüstung × max(0, 1 + erhöhte erlittene Schadensmenge / 100)`

`Wither` liefert am Pin je Stapel 6 % erhöhten erlittenen Chaosschaden. Die aufrechterhaltbare Stapelzahl wird reproduzierbar aus strukturierter Wirkungsdauer und Wirkzeit berechnet und bei 10 gedeckelt:

`Stapel = min(10, floor(Withered-Dauer / Wirkzeit))`

Auf Gemmenstufe 20 sind damit bei fortgesetztem Kanalisieren 10 Stapel und 60 % erhöhter erlittener Chaosschaden erreichbar. Auf Stufe 1 sind es anhand der gepinnten Werte 8 Stapel beziehungsweise 48 %.

## Geltungsbereich

- Die Fertigkeit muss im aktiven Waffenset ausgewählt sein.
- Der aktive Build muss belegten Chaosschaden als Treffer, nativen DoT oder schädigenden Zustand besitzen.
- Die konkret gewählte Gemmenstufe wird verwendet; fehlt sie, bleibt die bestehende gepinnte Standardreferenz maßgeblich.
- Treffer, nativer Chaos-DoT und Gift verwenden denselben typisierten gegnerseitigen Multiplikator.
- Reine DoT-Fertigkeiten ohne Trefferkomponente werden weiterhin getrennt ausgewertet und brechen nicht mehr vor der Gegnerstatusauflösung ab.

## Evidenzgrenzen

- Das Ergebnis beschreibt ein aufrechterhaltenes Kanalisierungsszenario, keine garantierte reale Rotation oder permanente Uptime.
- Unterbrechungen, Bewegung und Zielwechsel können die tatsächliche Stapelzahl reduzieren.
- `Withering Touch`, `Withering Presence`, Schock sowie generische `MORE DamageTaken`-Quellen sind noch nicht produktiv verbunden, solange Chance, Magnitude, Zielzustand und Uptime nicht vollständig belegt sind.
- Unpassende Waffensets und Builds ohne Chaosschaden erhalten keinen positiven Effekt.
- Es werden keine technischen GGG-IDs, Stapel oder Uptime-Werte aus sichtbaren Texten erfunden.

## Versionen

- Schadensrechner: `3.41.0`
- zeitliches Gegnerstatusmodell: `2.0.0`
- nativer DoT: `3.0.0`
- schädigende Zustände: `2.8.0`
- gegnerseitiger Schadensmultiplikator: `1.0.0`

## Prüfung

- Fokussierte Referenz- und Integrationstests: 6 Dateien, 91 Tests, erfolgreich
- Serielle Gesamtsuite: 140 Dateien, 1.714 Tests, erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich
- Produktionsbuild: erfolgreich
- Pages-Build: erfolgreich

## Nächster Schritt

Schritt 128 inventarisiert und integriert Schock sowie weitere generische gegnerseitige `DamageTaken`-Zustände nur dort, wo Anwendung, Magnitude, Dauer, Ersetzung und Uptime am Pin gemeinsam reproduzierbar sind.
