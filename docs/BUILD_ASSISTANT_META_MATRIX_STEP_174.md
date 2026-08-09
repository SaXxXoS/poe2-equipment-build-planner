# Build-Assistent – Meta-Matrix und sichere Snapshot-Aktualisierung (Schritt 174)

## Ziel

Dieser Schritt prüft den leeren Startbuild für jede der 23 produktiv
auswählbaren Aszendenzen als gemeinsames Paket aus Hauptskill, Waffenart,
Supports und Analyzerregeln. Die Prüfung soll keine globale Optimalität
behaupten. Sie muss jedoch verhindern, dass grobe Tags oder eine fehlerhafte
Waffennormalisierung fachlich mögliche Pakete vorzeitig ausschließen.

## Gefundene Fehler

1. Ohne eingegebene Ausrüstung wurden Kandidaten vor der saisonalen
   Referenzwertung auf das Maximum einer groben Klassen-/Aszendenz-Tagheuristik
   reduziert. Dadurch erreichten nur 2 von 23 ausgewählten Hauptskills einen
   der drei beobachteten poe.ninja-Referenzeinträge ihrer Aszendenz.
2. Die technische Itemklasse `Quarterstaves` wurde wegen der Zeichenfolge
   `staves` als normaler `staff` normalisiert. Die Optimierung plante zwar einen
   Viertelstab, der nachfolgende Skill Analyzer blockierte ihn jedoch als
   falsche Waffe. Betroffen waren alle drei Monk-Aszendenzen.
3. Der Meta-Generator versuchte bei einem neuen Snapshot alle offenen Profile
   in einem unteilbaren Lauf abzurufen. Rate-Limits konnten den Lauf abbrechen,
   bevor irgendein Fortschritt gespeichert wurde. Ein kleiner Startbatch eines
   neuen Snapshots durfte außerdem keinen leeren Produktbestand veröffentlichen.

## Korrektur

- Lokal als Hauptskill und Waffe kompatible, saisonal beobachtete Kandidaten
  erreichen jetzt die Meta-Wertung. Harte Rollen-, Waffen-, Ressourcen- und
  Paketregeln bleiben vorrangig.
- Die technische Waffenklassennormalisierung ist zentralisiert. `Quarterstaves`
  wird vor dem allgemeinen `Staves`-Fall als `quarterstaff` aufgelöst und in
  Optimierer, geplante Ausrüstung und Analyzer identisch verwendet.
- Der Meta-Generator arbeitet in deterministischen, begrenzten
  Batches. Zuerst werden Profile mit den wenigsten Versuchen, dann Rang und
  Aszendenzreihenfolge berücksichtigt. Bereits validierte Beobachtungen werden
  wiederverwendet; dadurch verhungern bei kleinen Batches auch spätere
  Aszendenzen nicht.
- Netzwerkabrufe besitzen eine feste Zeitgrenze. Ein neuer Snapshot wird nur
  produktiv promoviert, wenn er mindestens die Zahl validierter Profile und
  produktiver Pakete des aktiven Pins erreicht. Ein leerer oder schwächer
  abgedeckter Kandidat bleibt Auditstand.

## Reproduzierbare Matrix

Der Befehl `pnpm run validate:poe2-meta-optimizer` erzeugt
`docs/audits/build-assistant-current-meta-matrix.json` ohne Runtime-Netzwerk.
Er prüft Level 90, 24 Storypunkte, leere Ausrüstung, leere Skillkarten und das
Zielprofil Allround für jede produktive Aszendenz.

| Messwert | vor der Korrektur | nach der Korrektur |
| --- | ---: | ---: |
| geprüfte Aszendenzen | 23 | 23 |
| ausgewähltes Paket | 20 | 23 |
| vom Paketvalidator kohärent | 19 | 23 |
| geplante Waffenklasse erreicht den Analyzer | Unbekannt | 23 |
| Schnittmenge mit beobachtetem Top-3-Skill | 2 | 19 |
| Schnittmenge mit beobachteter Top-2-Waffe | 15 | 22 |
| verschiedene ausgewählte Hauptskills | 11 | 16 |
| verschiedene ausgewählte Waffenarten | 7 | 8 |

Die Referenzschnittmenge ist ein sekundärer Plausibilitätsbeleg. Die
poe.ninja-Gruppe `Main Skills` kann Heralds, Utility-, Setup- oder
Aszendenzskills enthalten. Skill- und Waffenhäufigkeiten sind zudem marginale
Statistiken und nicht zwingend im selben Charakter korreliert. Deshalb darf
diese Matrix keine harte Spielregel oder DPS-Garantie erzeugen.

## Snapshotstatus

Der aktuelle Quellenindex `1959-20260808-19780` ist nach mehreren kleinen,
fortsetzbaren Batches sicher produktiv promoviert worden. Der Audit klassifiziert
alle 460 fest gepinnten Profilreferenzen: 53 Profile sind als korrelierte
Beobachtungen validiert, 407 blockiert. Daraus entstanden vor der
nachgelagerten Skill-/Waffen-Härtung 15 Rohpakete und 22 weitere reine
Auditpakete. Der aktuelle Produktstand filtert davon nur 6 Pakete mit exakt
lokal belegter Gem-Waffenanforderung produktiv; 9 zuvor produktive profilweite
Zuordnungen sind im separaten Coveragebericht blockiert. Damit erreicht der neue Stand mindestens die
53 validierten Profile und übertrifft die 10 produktiven Pakete des vorherigen
Pins `1924-20260728-10654`.

Die nachgelagert gehärtete Produktdatei besitzt den SHA-256-Wert
`F8F66B99241C4A4E81EFB8B319B936E0604C2B64843276DCF47F2833B79A8937`.
Nach erfolgreicher Promotion wird ein veralteter Kandidatenaudit entfernt.
Ein anschließender Null-Batch verwendet den aktiven Stand wieder und erzeugt
keine zweite widersprüchliche Kandidatendatei.

## Grenzen

- 23 kohärente Startpakete belegen keine weltweit höchste DPS.
- Nicht im Produktkatalog vorhandene Skills werden nicht erfunden.
- Ein populärer Referenzeintrag darf harte lokale Kompatibilität nicht
  überstimmen.
- Nicht jede Aszendenz besitzt zwei gleichartige, korrelierte Profile. Solche
  Einzelbeobachtungen bleiben Audit-only und erzeugen kein produktives Paket.

## Schlussfolgerung

Der leere Startbuild ist über alle produktiven Klassen und Aszendenzen deutlich
breiter und technisch konsistenter. Die App ist dadurch näher an real
beobachteten Builds, bleibt aber ehrlich ein evidenzgebundener Optimierer und
kein bewiesener globaler Meta- oder Path-of-Building-Ersatz.

## Abschlussprüfung

- Die fokussierten Matrix-, Optimierer-, Paket-, Synergie- und
  Promotionsprüfungen bestanden vollständig. Die ergänzte Batch-Fairness ist
  mit 5/5 Generator-Policy-Tests abgesichert.
- Die vollständige fachliche Testsuite bestand stabil aufgeteilt mit 1.915 von
  1.915 Tests. Die Aufteilung vermeidet ausschließlich einen internen
  Vitest-RPC-Timeout des monolithischen Prozesses; kein fachlicher Test wurde
  ausgelassen.
- Lint, Typecheck, Produktions-Build, Pages-Build, 250 JSON-Dateien und
  `git diff --check` bestanden.
- Die lokale Desktop-Browserprüfung erzeugte für Hexe/Infernalistin ohne
  Ausrüstung ein Ergebnis mit Hauptskill, Waffenset-2-Hilfsskill,
  Support-/Kostenmodell und Build-Zusammenfassung. Es trat kein
  Berechnungsfehler auf.
- Bei 390 × 844 blieben die Fertigkeitskarten einspaltig, die zentralen
  Schaltflächen erreichbar und die Seite ohne horizontalen Überlauf.
  Desktop- und Mobilprüfung erzeugten weder Konsolenfehler noch Warnungen.
