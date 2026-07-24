# Rückkopplung von Passiv- und Aszendenzskalierungen

## Ziel

Die tatsächlich belegten normalen Passiv-, Waffen-Set- und
Aszendenzknoten beeinflussen nach der Planung die weiteren Empfehlungen des
Build-Assistenten. Das ist eine semantische Rückkopplung und keine exakte
DPS- oder Charakterwertsimulation.

## Reihenfolge

1. Der Equipment Analyzer erzeugt das gemeinsame Profil und die getrennten
   Profile für Waffenset 1 und 2.
2. Die Aszendenzplanung verwendet das ursprüngliche Equipmentprofil.
3. Sicher erkannte Wirkungen belegter Aszendenzknoten werden in das Profil
   übernommen.
4. Der gemeinsame normale Passivplan wird mit diesem erweiterten Profil
   erstellt.
5. Sicher erkannte Wirkungen des gemeinsamen Plans werden in das gemeinsame
   Profil und in beide Waffen-Set-Profile übernommen.
6. Die getrennten Waffen-Set-Pläne verwenden ihre jeweiligen erweiterten
   Profile.
7. Skill-, Support-, Passive-, Juwel-, Unique-, Rotations- und
   Erklärungsauswertung verwenden anschließend das wirksame gemeinsame
   Profil.

## Technische Evidenz

Verwendet werden ausschließlich bereits vorhandene, deterministische
Knotenklassifikationen und die bestehenden Passive-Zielregeln. Positive
Wirkungen erhöhen passende Affinitäten; positive defensive Wirkungen
verringern passende Bedarfswerte. Eindeutig negative Wirkungen werden in
umgekehrter Richtung berücksichtigt.

Klassen- und Aszendenzstartknoten, unbekannte Knoten sowie nicht sicher
klassifizierbare Knotenzeilen erzeugen keine Skalierung. Alle semantischen
Profilwerte bleiben im vorhandenen Bereich von 0 bis 100.

## Grenzen

- Es werden keine neuen Spielregeln oder technischen IDs erfunden.
- Die Rückkopplung berechnet keine exakten Schadens-, Widerstands- oder
  Charakterwerte.
- Set-spezifische Pfade bleiben getrennt. Gemeinsame und
  Aszendenzwirkungen werden dagegen bewusst in beide Waffenprofile
  übernommen.
- Nicht auflösbare Wirkungen bleiben ohne positiven Score.
