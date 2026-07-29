# Build-Assistent – PoB2-Zustandskonstanten und Aggravation (Schritt 38)

## Ergebnis

Blutung und Gift verwenden keine lokal hart codierten Grundwerte mehr. Der
Generator prüft und übernimmt aus dem unveränderten PoB2-Pin:

- Blutungsschaden pro Minute,
- Giftschaden pro Minute,
- Blutungsdauer,
- Giftdauer,
- den Multiplikator für bewegte beziehungsweise aggravierte Blutung.

Das Referenzschema wurde deterministisch auf Version 10 angehoben.

## Passive Aggravation

Der exakt belegte passive Effekt
`Bleeding you inflict is Aggravated / Base Bleeding Duration is 1 second /
50% more Magnitude` wird nur bei tatsächlich belegtem Knoten des aktiven
Waffensets angewendet. Alle drei Bestandteile werden gemeinsam transportiert:

- aggravierte Blutung,
- eine Sekunde Basisdauer,
- 50 % mehr Magnitude.

Der zusätzliche Aggravationsmultiplikator stammt aus
`BloodstainedMultiplierWhenMovingOrBleedingAggravated = 2`.

Ähnliche, bedingte Texte wie eine Chance bei kritischem Treffer werden nicht
übernommen. Freie Textähnlichkeit und erfundene technische IDs werden nicht
verwendet.

## Grenzen

Kritische Ailment-Sonderfälle, bedingte Aggravation, Bewegungserkennung und
weitere zustandsspezifische Sonderregeln bleiben bis zu einer vollständig
belegten Eingabekette gesperrt. Eine vollständige Path-of-Building-Parität ist
damit noch nicht erreicht.
