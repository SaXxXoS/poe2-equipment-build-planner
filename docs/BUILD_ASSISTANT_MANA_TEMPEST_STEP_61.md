# Build-Assistent – Schritt 61: Mana Tempest

## Ziel

Die bislang blockierte Wechselwirkung von `Mana Tempest` wird als begrenztes
aktives Schadensfenster ausgewertet. Der normale Dauerschaden bleibt davon
getrennt. Grundlage sind ausschließlich die bereits lokal vorhandenen,
gepinnten PoB2-Daten; es gibt keinen Runtime-Netzwerkzugriff.

## Gepinnte Regeln

Die gewählte Gemmenstufe liefert strukturiert:

- den prozentualen maximalen Manaverbrauch des Sturms pro Sekunde;
- `30 %` der von Fertigkeiten verbrauchten Mana- und Lebenskosten als
  zusätzlichen Verbrauch pro Sekunde;
- `78 %` des Schadens unterstützter mana-verbrauchender Zauber als
  zusätzlichen Blitzschaden auf Gemmenstufe 20.

Die Referenzen stammen aus `src/Data/Skills/act_int.lua` und den zugehörigen
gepinnten Statbeschreibungen am unveränderten PoB2-Commit
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

## Berechnung

Mana Tempest wirkt nur, wenn:

- die Hauptfertigkeit ein Zauber ist;
- sie belegbar Mana pro Nutzung verbraucht;
- Mana Tempest und Ziel im selben Waffenset aktiv sind oder die Quelle für
  beide Waffensets gilt;
- Manareserve, Regeneration, Aktionsrate und Kostenkette vollständig
  berechenbar sind;
- keine zusätzliche, derzeit nicht vollständig modellierte Kostenart
  vorhanden ist.

Für den normierten Dauergebrauch gilt:

`Gesamtverbrauch/s = Grundverbrauch des Sturms + Mana/s der Hauptfertigkeit × 1,30`

`Nettoverbrauch/s = max(0, Gesamtverbrauch/s − Manaregeneration/s)`

`bestätigtes Fenster = verfügbares Mana / Nettoverbrauch/s`

Bei der fokussierten Stufe-20-Referenz ergibt sich ein Fenster von
`6,489 Sekunden`. Ist der Nettoverbrauch nicht positiv, wird keine erfundene
Enddauer ausgegeben.

## Schadensreihenfolge

Der Blitzgewinn wird nicht nachträglich auf einen bereits fertigen DPS-Wert
geschlagen. Er durchläuft als eigene `gain as extra`-Wirkung dieselbe
Reihenfolge wie andere belegte Zusatzschäden:

1. Basisschaden;
2. Umwandlungen;
3. zusätzlicher Schaden;
4. schadensartspezifische Steigerungen;
5. Supportwirkungen;
6. zeitlich begrenzte Multiplikatoren.

Dadurch bleibt der normale Vergleichswert unverändert und der Bonus erscheint
ausschließlich im aktiven Mana-Tempest-Fenster.

## Fail-closed-Grenzen

Nicht als dauerhafter Bonus gerechnet werden:

- Mana Tempest in einem getrennten, nicht gleichzeitig aktiven Waffenset;
- Zauber ohne belegte Manakosten;
- Angriffe;
- unbekannte Manareserve oder Regeneration;
- nicht unterstützte zusätzliche Kostenarten;
- normales Qualitäts-Lingering und alternative Qualität ohne vollständig
  gewählte Qualitätsvariante;
- Verlassen des Sturms, Bewegung und reale Kampfunterbrechungen.

Diese Fälle bleiben blockiert oder werden als nicht belegte Grenze
ausgewiesen.

## Versionen und Prüfung

- Temporalmodell: `1.2.0`
- Ressourcenmodell: `10.0.0`
- Schadensrechner: `3.9.0`
- fokussierte Tests: `54` erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich
- Produktions-Build: erfolgreich

Produktpins, PoB2-Produktdaten, deutsche Anzeigedaten und Offline-Grenzen
bleiben unverändert.
