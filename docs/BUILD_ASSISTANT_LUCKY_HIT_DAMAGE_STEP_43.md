# Build-Assistent – Lucky-Trefferschadenswürfe (Schritt 43)

Die unbedingten, am gepinnten Passivbaum exakt belegten Formen

- `#% chance for Damage with Hits to be Lucky`
- `#% chance for <Damage Type> Damage with Hits to be Lucky`

sind in den Trefferschaden-Erwartungswert integriert.

Ein Lucky-Schadenswurf verwendet bei einem gleichverteilten Bereich den
besseren von zwei Würfen. Die App berechnet dessen Erwartungswert als
`Minimum + 2/3 × (Maximum − Minimum)` und mischt ihn mit dem normalen
Erwartungswert entsprechend der belegten Chance. Mehrere anwendbare Chancen
werden deterministisch addiert und bei 100 Prozent begrenzt.

Die Auflösung ist waffensetgetrennt und berücksichtigt nur tatsächlich
belegte normale oder Aszendenzknoten. Schadensartspezifische Effekte wirken
nur auf die passende Komponente.

Bedingte Aussagen wie Lucky gegen Gegner auf niedrigem Leben oder gegen
schwer betäubte Gegner bleiben fail-closed, solange der erforderliche
Gegnerzustand nicht vollständig belegt ist. Defensive Unlucky-Würfe,
kritische Sonderbedingungen sowie freie Textähnlichkeit werden nicht
übernommen.

Der englische PoB2-Produktbestand, Datenpins und Runtime-Grenzen bleiben
unverändert. Rechenmodell: `3.7.0`; Lucky-Teilmodell: `1.0.0`.
