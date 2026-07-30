# Schritt 81 – aufgeladene Fertigkeitsszenarien

## Ergebnis

`Detonating Arrow` und `Volcano` besitzen jetzt getrennte, aus den gepinnten
PoB2-Feldern abgeleitete Vollstufenszenarien.

- Detonating Arrow: vier Stufen und 120 % des Schadens als zusätzlicher
  Feuerschaden je Stufe ergeben im vorbereiteten Vollstufenszenario 480 %.
- Volcano: vier Gesamtstufen bedeuten drei zusätzliche Stufen, Faktor 5,5
  für die Anfangsexplosion und zwölf zusätzliche Projektile.
- Die zusätzlichen Volcano-Projektile werden ohne belegte
  Einzelzielüberlappung nicht als Schadensmultiplikator verwendet.
- Aktuelle Stufen und dauerhafte Uptime werden nicht erfunden.
- Eine nicht vorhandene angeforderte Gemmenstufe bleibt blockiert.

Das normale Dauerschadenergebnis bleibt unverändert. Der vorbereitete
Vollstufentreffer wird getrennt vor und nach verfügbarer Gegnerabwehr
ausgewiesen.

## Version und Prüfung

- Aufladungsmodell `1.0.0`
- Schadensrechner `3.22.0`
- 66 fokussierte Tests erfolgreich
- Typecheck, Lint und Produktions-Build erfolgreich
- keine Änderung an Produktpins oder Runtime-Netzwerk

Die vollständige Path-of-Building-2-Gleichwertigkeit bleibt offen.
