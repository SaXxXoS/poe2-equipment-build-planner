# Build-Assistent – feste Schockquellen, Schritt 132

## Ziel

Schritt 132 inventarisiert feste Schockquellen und verbindet die erste vollständig identifizierte Ausrüstungsquelle mit dem Gegnerstatusmodell. Ein nicht belegter Laufzeitzustand bleibt schadensneutral.

## Gepinnte Evidenz

Maßgeblich ist `PathOfBuildingCommunity/PathOfBuilding-PoE2` bei Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

- `Wake of Destruction`, Produkt-ID `pob2:src/Data/Uniques/boots.lua#21`, besitzt in allen Varianten die exakte Zeile `Drop Shocked Ground while moving, lasting 8 seconds`.
- PoB2 ordnet dieses eng begrenzte Muster `ShockBase` zu und setzt bei `OnShockedGround` einen festen `ShockOverride`.
- Die gepinnte Damage-Reference belegt 20 % Grundwirkung für Schock.
- Die Zeile belegt eine Wirkzeit von acht Sekunden.
- PoB2 behandelt `EnemyOnShockedGround` als gesonderten Bedingungszustand. Das bloße Ausrüsten der Stiefel belegt daher nicht, dass ein Gegner auf dem Boden steht.

## Umsetzung

- Nur die exakte produktive Unique-ID und die exakte englische PoB2-Quellzeile erzeugen einen Kandidaten.
- Die ausgewählte Variante wird berücksichtigt; die relevante Zeile gilt für alle Varianten.
- Der Kandidat enthält feste Wirkung 20 %, Wirkzeit 8.000 ms, Aktivierungsbedingung, Evidenzklasse und genaue Quellenreferenzen.
- Er erscheint getrennt als `blockedEnemyEffects` und nicht unter den angewendeten Effekten.
- Weder Treffer- noch DoT-Schaden erhalten dadurch einen Bonus.
- Ein gleichzeitig belegter Trefferschock funktioniert unverändert; der blockierte Bodeneffekt wird nicht addiert und verdrängt keine andere Quelle.

## Bewusst blockiert

- angenommener Gegnerstandort,
- OCR- oder manuell eingegebener Text ohne produktive Unique-Identität,
- nicht im aktuellen Produktkatalog enthaltene `Shock Ground`- oder `Vaal Lightning Trap`-Pfade,
- gemeinsame PoB2-/PoE1-Parserpfade ohne aktuelle produktive Fertigkeitsquelle,
- Fläschchen-Overrides ohne aktuelle PoE2-Produktkette,
- freie Textähnlichkeit und deutsche Anzeigetexte als technische Evidenz.

## Versionen

- Schadensrechner `3.46.0`
- Schockmodell `1.4.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

- exakte Unique- und Variantenidentität,
- fester Wert und Dauer,
- keine Ableitung aus OCR oder manueller Freitextzeile,
- kein Schadensbonus ohne bestätigte Bodenbelegung,
- Koexistenz mit normalem Trefferschock,
- deterministische und rückwärtskompatible Ausgabe ohne leeres Zusatzfeld.

Fokussiert wurden 2 Dateien mit 27 Tests geprüft. Die serielle Gesamtsuite bestand aus 140 Dateien mit 1.729 Tests. Typecheck, Lint, Produktions-Build, Pages-Build und JSON-Validierung waren erfolgreich.

## Nächster Schritt

Schritt 133 untersucht die nächste vollständig lokal belegbare Gegnerzustandskette. Ein Bodeneffekt wird erst produktiv, wenn die Aktivierung durch eine vorhandene Rotation oder einen anderen bestätigten Laufzeitzustand reproduzierbar nachgewiesen werden kann.
