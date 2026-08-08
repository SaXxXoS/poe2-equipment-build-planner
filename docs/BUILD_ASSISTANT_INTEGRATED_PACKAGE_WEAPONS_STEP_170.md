# Integrierte Paketprüfung mit geplanten Waffen – Schritt 170

## Problem

Bei einem leeren Charakterprofil nutzte der Variantenoptimierer eine passende
Waffenbasis für die Schadensschätzung. Die anschließende gemeinsame Prüfung
erhielt jedoch weiterhin leere Waffenslots. Auswahl, Begründung und sichtbarer
Waffenvorschlag konnten deshalb unterschiedliche Kontexte bewerten.

## Korrektur

- Haupt- und Setup-Waffe stammen aus lokal gepinnten Basen und erfüllen die
  bekannten Level- und Attributanforderungen.
- Vorhandene Nutzerausrüstung bleibt vorrangig und wird niemals ersetzt.
- Geplante Einträge existieren nur während der Paketbewertung und werden nicht
  stillschweigend als Nutzerausrüstung gespeichert.
- Alle beteiligten Analyzer sehen denselben Waffen- und Set-Kontext.

## Nachweis

Der Referenzfall Stormweaver/Funken prüft Hauptskill, Supports und beide
geplanten Waffensets in einem gemeinsamen Paket. Ein Regressionstest belegt,
dass der produktive leere Initialzustand unverändert bleibt.

## Grenze

Eine Basis ohne Affixe erhält keinen erfundenen positiven Equipment-Score.
Vollständige globale Path-of-Building-Gleichwertigkeit ist noch nicht belegt.
