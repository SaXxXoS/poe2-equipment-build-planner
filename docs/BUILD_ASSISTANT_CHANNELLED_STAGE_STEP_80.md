# Schritt 80 – kanalisierte Fertigkeitsstufen

## Ergebnis

Der Schadensrechner bildet die strukturiert belegten Stufen von
`Flameblast` und `Supercharged Slam` als getrenntes Vollstufenszenario ab.
Die Berechnung verwendet ausschließlich Werte aus dem gepinnten lokalen
PoB2-Schadensreferenzdatensatz.

## Modell

- `Flameblast`: maximal 10 Stufen, 75 % finaler Schaden je Stufe,
  Vollstufenfaktor 8,5 und 490 ms Mindestkanalzeit je Kanalabschnitt.
- `Supercharged Slam`: maximal 3 Stufen, 40 % finaler Schaden je Stufe,
  Vollstufenfaktor 2,2 und 1.000 ms Mindestkanalzeit je Kanalabschnitt.
- Eine ausdrücklich gewählte Gemmenstufe muss im Referenzdatensatz exakt
  vorhanden sein. Es gibt keine Interpolation.
- Ohne ausdrückliche Stufe wird die gepinnte Referenzstufe 20 verwendet.

## Rechengrenze

Das Vollstufenszenario ist ein vorbereiteter Einzeltreffer. Es verändert den
normalen Dauerschadenswert nicht, weil aktueller Stufenstand, Abbruchzeit,
Trefferfolge und reale Kampf-Uptime nicht allein aus den statischen
Fertigkeitsdaten hervorgehen. Vor und nach einer vorhandenen
Gegnerabwehrberechnung wird der vorbereitete Treffer getrennt ausgewiesen.

## Integration und Prüfung

- Kanalstufenmodell `1.0.0`
- Schadensrechner `3.21.0`
- Transport über die bestehende zeitliche Wirkungskette
- sichtbare Ausgabe im bestehenden Build-Ergebnis
- 64 fokussierte Tests erfolgreich
- Typecheck, Lint und Produktions-Build erfolgreich
- keine Änderung an Produktdaten, Datenpins oder Runtime-Netzwerk

Die vollständige rechnerische Gleichwertigkeit mit Path of Building 2 ist
damit noch nicht belegt. Weitere fertigkeitsspezifische Zustände,
Kampfsequenzen und Referenzvergleiche bleiben erforderlich.
