# Build-Assistent – konkrete Dauer angewendeter Zustände, Schritt 124

## Ziel

Schritt 124 verbindet die in Schritt 123 berechneten relativen Dauermultiplikatoren mit den im gepinnten PoB2-Stand vorhandenen Spieler-Grunddauern. Damit kann die App erstmals für eine tatsächlich angewendete Beeinträchtigung einen belegten Sekundenwert ausgeben.

## Gepinnte Quellen

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Konstanten: `src/Data/Misc.lua`
- Zuordnung der schädigenden Zustände: `src/Modules/Data.lua`
- Dauermodifikatoren: `src/Modules/CalcDefence.lua`

## Grunddauern

Produktiv übernommen werden ausschließlich die sechs lokal belegten Werte:

| Zustand | Grunddauer auf dem Spieler |
| --- | ---: |
| Entzünden | 4 s |
| Kühlen | 2 s |
| Einfrieren | 2 s |
| Schock | 4 s |
| Blutung | 5 s |
| Gift | 2 s |

Für Blindheit, Versengen, Sprödigkeit und Saft enthält der gepinnte lokale Referenzbestand keine gleichwertige sichere Grunddauer. Sie werden in `unknownBaseDuration` ausgewiesen und erhalten keinen erfundenen Sekundenwert.

## Berechnung

Für jeden belegten Zustand gilt:

`effektive Dauer = Grunddauer × relativer Dauermultiplikator / 100`

Die Reihenfolge der erhöhten/verringerten Dauer und der Ablaufgeschwindigkeit bleibt unverändert aus Schritt 123. Werte werden deterministisch auf sechs Nachkommastellen gerundet.

Die Ausgabe heißt bewusst `effectiveWhenAppliedSeconds`: Sie beschreibt eine einzelne erfolgreiche Anwendung. Sie behauptet keine Uptime.

## Wiederanwendung und Uptime

Eine Uptime benötigt zusätzlich mindestens:

- eine belegte Anwendungschance oder garantierte Anwendung,
- Treffer- beziehungsweise Anwendungshäufigkeit,
- Regeln für Ersetzen, Verlängern oder Stapeln,
- gegebenenfalls Gegner- oder Schwellenwerte.

Diese Größen sind nicht für jede eingehende Beeinträchtigung im aktuellen Buildprofil vorhanden. Deshalb wird noch keine pauschale Uptime erzeugt. Dies verhindert scheinpräzise, aber falsche Ergebnisse.

## Versionen

- Charakter-Schutzmodell: `1.8.0`
- Schadensrechner: `3.38.0`

## Prüfung

- Fokussierte Referenztests: 3 Dateien, 90 Tests, erfolgreich
- Zeitkritische reale Baumtests: 3 Dateien, 236 Tests, isoliert erfolgreich
- Kontrolliert partitionierte Gesamtsuite: 136 Dateien, 1.699 Tests ohne fachlichen Fehler
- Typecheck: erfolgreich
- Lint: erfolgreich
- Produktionsbuild: erfolgreich
- Pages-Build: erfolgreich

Im parallelen Gesamtlauf überschritten zwei bekannte große Baumtests ihr 5-Sekunden-Einzellimit und der Worker meldete `onTaskUpdate`-RPC-Timeouts. Beide Tests sowie die zugehörige Pipeline bestanden im isolierten Lauf. Es liegt kein fachlicher Regressionsfehler vor.

## Nächste fachliche Lücke

Der nächste sinnvolle Baustein ist die ausgehende Zustandsseite: belegte Grundschäden, Dauer auf Gegnern, Chance, Stapelregeln und daraus berechenbare Schaden-über-Zeit-Uptime. Diese muss getrennt vom hier modellierten Schutz des Charakters bleiben.
