# Build-Assistent – Ressourcenkosten und Kosteneffizienz (Schritt 58)

## Ergebnis

Das Ressourcenmodell bildet nun weitere belegte Stufen der am PoB2-Commit
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` gepinnten Kostenrechnung ab:

1. Support-Kostenmultiplikatoren werden multipliziert und auf vier
   Nachkommastellen abgerundet.
2. Erhöhte und verringerte Manakosten werden additiv zusammengeführt.
3. Mehr und weniger Manakosten werden multiplikativ angewandt.
4. Allgemeine sowie Mana-Kosteneffizienz werden anschließend als Divisor
   angewandt.
5. Das Ergebnis wird für den ganzzahligen Ressourcenverbrauch abgerundet.

## Passive und Aszendenzen

Nur unbedingte, exakt lesbare Wirkungen vergebener Knoten werden verwendet.
Die Auswertung bleibt an den tatsächlich geplanten gemeinsamen,
waffensetspezifischen und Aszendenzknoten gebunden. Bedingte Texte wie
„während“, „wenn“ oder „kürzlich“ bleiben fail-closed.

Produktiv unterstützt werden jetzt:

- erhöhte Manakosten,
- verringerte Manakosten,
- mehr Manakosten,
- weniger Manakosten,
- erhöhte Mana-Kosteneffizienz,
- erhöhte allgemeine Kosteneffizienz,
- verdoppelte Manakosten.

## Beispiel

Bei Grundkosten von `81`, `20 %` verringerten Manakosten, `25 %` weniger
Manakosten und insgesamt `30 %` erhöhter Kosteneffizienz:

`floor(81 × 0,8 × 0,75 ÷ 1,3) = 37`

## Grenzen

- Die gepinnte Fertigkeitskostentabelle enthält derzeit Mana,
  Mana pro Sekunde, prozentuales Mana pro Sekunde und Raserei pro Sekunde.
- Lebens-, Energieschild- und gemischte Kosten entstehen in PoB2 zusätzlich
  über Modifikatoren und Kostenumwandlungen; diese Wirkungsketten sind noch
  nicht vollständig transportiert.
- Bedingte Kosteneffizienz wird ohne belegten Zustand nicht aktiviert.
- Der bestätigte Mindest-Manapool ist weiterhin keine Behauptung über den
  vollständigen realen Charakterpool.

