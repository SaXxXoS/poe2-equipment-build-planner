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

## In diesem Schritt geschlossen

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

## Bereits vorhandene Teilmodelle

- Waffen- und Zauberbasiswerte
- einstufige Umwandlungen
- additive Schadens- und Geschwindigkeitswerte
- ausgewählte strukturierte Support-Multiplikatoren
- kritischer Erwartungswert bei belegter Basis
- explizite Gegnerwiderstände, Durchdringung und Rüstung
- begrenzte zeitliche Wirkungen
- Ressourcen- und Geist-Teilmodell
- fail-closed Modelle für Trigger, Projektile, DoT und Minions

## Noch notwendige Arbeit

1. mehrstufige Umwandlungspriorität und vollständige Modifier-Anwendbarkeit
2. Gemmenlevel, Qualität und Variantenformeln
3. Entzünden, Gift, Blutung, Stapelung und Ailment-Magnitude
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
