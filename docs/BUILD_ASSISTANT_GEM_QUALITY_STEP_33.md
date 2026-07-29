# Schritt 33 – Gemmenstufe und normale Gemmenqualität

## Ergebnis

Die Schadensberechnung verwendet für aktive Fertigkeiten jetzt die vom Nutzer
gewählte Gemmenstufe und normale Qualität. Beide Eingaben werden gegen den
lokal gepinnten PoB2-Bestand geprüft.

## Berechnung

- Gemmenstufen werden nur bei einer exakt vorhandenen Stufenzeile angewendet.
- Ohne Eingabe wird die vorhandene Stufe 20, andernfalls die höchste
  Referenzstufe verwendet und sichtbar ausgewiesen.
- Normale Qualität ist auf ganzzahlige Werte von 0 bis 23 begrenzt.
- Die Wirkung stammt aus `qualityStats` der gepinnten PoB2-Lua-Datei.
- Wie PoB2 wird `perQuality × Qualität` gegen null abgerundet.
- Qualitätsstats werden vor Treffer-, Projektil-, Ailment- und weiteren
  nachgelagerten Berechnungen in die Skillstats eingerechnet.

## Grenzen

Alternative Qualitätsarten und Supportqualität werden noch nicht angewendet.
Die Supportvarianten des Pins besitzen jeweils eine strukturierte Stufenzeile;
diese wird verwendet, aber nicht frei hochskaliert. Unbekannte oder ungültige
Werte erzeugen keinen Bonus.

## Verifikation

Der Referenzgenerator schreibt Schema 8 deterministisch. Fokussierte Tests
prüfen exakte Stufen, Standardstufe, normale Qualität, ungültige Qualität und
Determinismus.
