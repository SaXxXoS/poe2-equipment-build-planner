# Build-Assistent – bedingte kritische Zustandschance (Schritt 41)

Die Schadensschätzung unterscheidet jetzt belegbar zwischen der Chance eines
normalen Treffers und der Chance eines kritischen Treffers, Blutung oder Gift
auszulösen.

Produktiv integriert ist zunächst genau die gepinnte PoB2-Zeile
`Critical Hits Poison the enemy`. Der PoB2-Modifikatorpfad setzt für diese
Bedingung die Giftchance bei kritischen Treffern auf 100 Prozent. Die normale
Giftchance bleibt unverändert. Anschließend werden beide Chancen mit der
effektiven Kritchance gewichtet.

Die Auflösung verwendet ausschließlich:

- die stabile `pob2:`-Produkt-ID des ausgerüsteten Uniques,
- eine zur gewählten Variante passende oder itemweit gültige Quellzeile,
- den exakten englischen PoB2-Quelltext,
- die dokumentierte PoB2-Modifikatorregel.

OCR-Texte, manuelle Freitexte, deutsche Anzeigetexte, Fuzzy Matching und
Textähnlichkeit können keine technische Wirkung aktivieren. Eine
variantenspezifische Zeile wird ohne gewählte passende Variante nicht
angewendet.

Offen bleiben weitere kritische Zustandsbedingungen, kritische
Magnitudenmodifikatoren und bedingte Aggravation, bis ihre vollständige
gepinnt belegte Stat- und Bedingungskette erschlossen ist.
