# PoB2-Rechenparität: technischer Fahrplan

## Ziel

Path of Building 2 dient als technische Referenz dafür, welche
Rechenbereiche ein belastbarer PoE2-Buildplaner benötigt. Die Web-App
übernimmt weder Lua zur Laufzeit noch vollständige PoB2-Rohdaten. Die
vorhandene TypeScript-Engine bleibt maßgeblich und wird schrittweise um
belegte, getestete Rechenketten ergänzt.

Referenz:

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- lokal verifizierter Commit:
  `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- bestehender Entscheidungsstatus:
  `approved-with-disclosed-uncertainty`
- keine externe Zustimmung wird behauptet

## Warum die App trotz vieler Analyzer noch falsche Ergebnisse liefern kann

Die Analyzer beantworten unterschiedliche Teilfragen. PoB2 führt
Modifikatoren dagegen in einer zentralen, geordneten Rechenkette zusammen.
Fehlt diese Ordnung, können einzeln plausible Tags oder Scores gemeinsam
eine fachlich falsche Empfehlung ergeben.

Die notwendige Reihenfolge ist sinngemäß:

1. aktive Fertigkeit und zulässige Modifikatoren bestimmen
2. Basiswerte und lokale Gegenstandswerte bilden
3. Schadensumwandlung anwenden
4. zusätzlichen Schaden aus der belegten Ausgangsbasis erzeugen
5. additive Erhöhungen und Verringerungen gruppieren
6. multiplikative Mehr-/Weniger-Wirkungen anwenden
7. kritische Treffer, Frequenz, Wiederholungen und Trefferanzahl bestimmen
8. Zustände, Buffs, Debuffs und Gegnerabwehr anwenden
9. Dauer- und Ailmentschaden getrennt auswerten
10. Ressourcen, Geist, Kosten und Aufrechterhaltbarkeit prüfen
11. jeden Beitrag in einem Rechenprotokoll ausweisen

## Geschlossene Rechenblöcke

`Gain … as Extra Damage` ist nun ein eigener Effekt und keine
Schadensumwandlung:

- der Ursprungsschaden bleibt erhalten
- die zusätzliche Komponente wird separat erzeugt
- sie berücksichtigt belegte Skalierung der Ursprungs- und Zielschadensart
- bedingte oder nicht exakt lesbare Zeilen bleiben wirkungslos
- Herkunft, Prozentsatz und Rechenstufe werden im Ergebnis transportiert

Damit ist ein zuvor fehlender zentraler Teil der PoE-Schadensreihenfolge
geschlossen. Eine vollständige PoB-Gesamt-DPS wird weiterhin nicht
behauptet.

Zusätzlich verarbeitet die Engine jetzt:

- mehrstufige Umwandlungen in der belegten PoE-Reihenfolge
  `Physisch -> Blitz -> Kälte -> Feuer -> Chaos`
- Herkunftslinien für umgewandelten Schaden, damit belegte Modifikatoren der
  Ausgangs- und Zielschadensarten erhalten bleiben
- sämtliche exakt vorhandenen Skill-Levelzeilen des gepinnten PoB2-Stands
- levelabhängige Basiswerte, kritische Trefferchance und Ressourcenkosten
- konstante Skillwerte gemeinsam mit der jeweiligen Levelzeile
- fail-closed Verhalten für nicht vorhandene Level; es wird weder
  interpoliert noch ein Wert erfunden

## Bereits vorhandene Teilmodelle

- Waffen- und Zauberbasiswerte
- mehrstufige Umwandlungen mit geordneter Herkunftslinie
- exakt vorhandene Skill-Level und levelabhängige Kosten
- additive Schadens- und Geschwindigkeitswerte
- ausgewählte strukturierte Support-Multiplikatoren
- kritischer Erwartungswert bei belegter Basis
- explizite Gegnerwiderstände, Durchdringung und Rüstung
- begrenzte zeitliche Wirkungen
- Ressourcen- und Geist-Teilmodell
- fail-closed Modelle für Trigger, Projektile, DoT und Minions

## Noch notwendige Arbeit

1. Qualität und fertigkeitsspezifische Variantenformeln
2. exakte Trennung von Skill- und globaler Umwandlungspriorität
3. Entzünden mit gegnerabhängigem Schwellenwert/Aufbau sowie Sonderfälle
   für Blutung und Gift
4. fertigkeitsspezifische Projektile, Mehrfachtreffer, Fork und Return
5. geschlossene Trigger- und Wiederholungsketten
6. Minion- und Begleitergrundwerte
7. vollständige Defensive, Recovery und Ressourcen
8. durchgängiges Beitragsprotokoll für jede Empfehlung
9. reproduzierbare Referenzbuilds mit festen Eingaben und erwarteten
   Zwischenergebnissen
10. Optimierer erst anschließend gegen diese vollständige Rechenkette
    kalibrieren

## Produktgrenze

Die aktuelle App ist ein deterministischer, evidenzgebundener Teilrechner und
Buildplaner. Sie ist noch kein vollständiger Path-of-Building-Ersatz.
Gleichwertigkeit mit den besten Meta-Builds ist erst belegbar, wenn
repräsentative Builds mit identischen Eingaben und Rechenbedingungen
reproduziert werden. Bis dahin bleiben fehlende Mechaniken sichtbar
`Unbekannt` und erzeugen keinen positiven Bonus.

## Schädigende Zustände: belegter Teilstand

Blutung und Gift besitzen nun eine eigene, von Trefferschaden und
eigenständigem DoT getrennte Rechenkette. Verwendet werden ausschließlich
strukturierte Werte aus dem gepinnten PoB2-Stand:

- Grundschaden pro Sekunde und Grunddauer
- Auslösechance
- relevante ungeminderte Ausgangsschadensarten
- Wirkfrequenz und Trefferchance
- Zustandswirkung, Dauer und maximale Stapelzahl
- die von PoB2 verwendete gewichtete Schadensroll-Behandlung

Angriffs-Zustände bleiben gesperrt, solange die Accuracy-Gegnerkette nicht
vollständig vorliegt. Entzünden bleibt ebenfalls gesperrt, bis
Gegner-Ailment-Schwelle und Aufbau reproduzierbar modelliert sind. Damit
erzeugt eine bloß plausible, aber unvollständige Zustandskette keinen
positiven Schaden.
