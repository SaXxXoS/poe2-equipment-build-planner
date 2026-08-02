# Schritt 150 – Schnelle Angriffe und schnelles Zaubern

## Ergebnis

Die strukturierten PoB2-Werte von `Rapid Attacks I–III` und `Rapid Casting I–II` fließen jetzt in die Aktionsfrequenz ein. Erhöhte Geschwindigkeit wird dabei im gemeinsamen additiven Stapel mit Ausrüstung, Passivbaum und Aszendenz verarbeitet und nicht fälschlich als separater Mehr-Multiplikator gerechnet.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Produktreferenz: `generated/pob2/damage-reference.json`
- Quelldateien: `src/Data/Skills/sup_dex.lua`, `src/Data/Skills/sup_int.lua`
- Records: `SupportRapidAttacksPlayer`, `SupportRapidAttacksPlayerTwo`, `SupportRapidAttacksPlayerThree`, `SupportRapidCastingPlayer`, `SupportRapidCastingPlayerTwo`

## Modellierte Wirkung

- Schnelle Angriffe I: 15 % erhöhte Angriffsgeschwindigkeit.
- Schnelle Angriffe II: 25 % erhöhte Angriffsgeschwindigkeit.
- Schnelle Angriffe III: 35 % erhöhte Angriffsgeschwindigkeit und 50 % weniger finaler Schaden.
- Schnelles Zaubern I: 15 % erhöhte Zaubergeschwindigkeit.
- Schnelles Zaubern II: 20 % erhöhte Zaubergeschwindigkeit.
- Erhöhte Geschwindigkeit wird mit anderen erhöhten/reduzierten Geschwindigkeitswerten addiert. Gesonderte mehr/weniger-Effekte bleiben multiplikativ.

## Fail-closed-Grenzen

`Rapid Casting III` bleibt ungelöst: Der gepinnte Wert hängt von der Anzahl verschiedener in den letzten acht Sekunden gewirkter Zauber ab. Ohne vollständig belegten Zustandsverlauf wird daraus weder ein fester Geschwindigkeitswert noch ein DPS-Bonus erzeugt. Kompatibilitäts- und Supportfamilienregeln bleiben unverändert maßgeblich.

## Version und Prüfung

- Schadensrechner: `3.64.0`
- Quantitatives Supportmodell: bestehendes Modell, erweitert um additiv erhöhte Aktionsgeschwindigkeit
- Fokussiert: 3 Testdateien, 72 Tests
- Gesamtlauf: 149 Testdateien, 1.804 Tests
- Typecheck, Lint, Produktions- und Pages-Build: erfolgreich
- JSON-Validierung: 227 Dateien; `git diff --check` und Git-Sicherheitsprüfung erfolgreich
- Desktop 1280 × 720 und Mobil 390 × 844: kein horizontaler Überlauf, keine Browserkonsolenfehler oder -warnungen
- Produktpins, englische PoB2-Produktdaten und Offline-Grenzen bleiben unverändert.
