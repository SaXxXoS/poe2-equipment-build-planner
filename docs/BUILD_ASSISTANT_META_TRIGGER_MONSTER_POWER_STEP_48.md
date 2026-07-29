# Schritt 48 – Meta-Trigger mit Monsterstärke

## Ergebnis

`Cast on Critical` verwendet nicht mehr nur eine unverbindliche Normierung auf
Monsterstärke eins. Für die automatischen Vergleichsprofile wird die
vollständige, lokal gepinnte Wirkungskette berechnet:

1. Aktionen pro Sekunde
2. Trefferchance
3. effektive kritische Trefferchance
4. kritischer Rohschaden vor Gegnerabwehr
5. Zustands-Schwelle des Gegners auf dessen Stufe
6. Monsterstärke
7. erhöhte Energieerzeugung des Meta-Skills
8. Energiebedarf der eingebetteten Fertigkeiten
9. interner Trigger-Schadensfaktor
10. Schaden des eingebetteten Ziels

## Monsterstärke

Der gepinnte PoB2-Stand
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` belegt in
`src/Modules/ConfigOptions.lua` die Standardwerte:

- normal: 1
- magisch: 2
- selten: 10
- einzigartig/Boss: 20

Das automatische Mapping- und Allround-Profil verwendet einen seltenen
Referenzgegner mit Stärke 10. Das Boss-Profil verwendet Stärke 20.

## Energieformel

Für einen kritischen Treffer gilt:

`Energie = Basisenergie × Monsterstärke × kritischer Rohschaden /
Zustands-Schwelle × Energiemodifikator`

Die Zustands-Schwelle stammt für die Zielstufe aus der bereits gepinnten
`monsterAilmentThresholdTable`. Pro kritischem Treffer kann höchstens eine
Auslösung entstehen; überschüssige Energie oberhalb des Energiebedarfs wird
deshalb nicht als weitere Auslösung desselben Treffers gezählt.

## Ausgabe

Die App weist nun getrennt aus:

- Schaden der Hauptfertigkeit
- Schaden produktiv belegter ausgelöster Fertigkeiten
- gemeinsamen belegten Schaden pro Sekunde
- Monsterstärke, Zustands-Schwelle, Energie und Auslöserate in der
  Trigger-Aufschlüsselung

Eine Triggerquelle bleibt fail-closed, wenn Ziel, Kompatibilität, Treffer- und
Kritrate, Zielstufe, Monsterstärke, Zustands-Schwelle oder Zielschaden fehlen.

## Grenzen

Noch nicht vollständig modelliert sind mehrere rotierende Triggerziele,
fertigkeitsspezifische Cooldown- und Server-Tick-Grenzen, Projektilüberlappung,
Fork- und Rückkehrketten sowie andere Triggerbedingungen als der bereits
geschlossene `Cast on Critical`-Pfad.
