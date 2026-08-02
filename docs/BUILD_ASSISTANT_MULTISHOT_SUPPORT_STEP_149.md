# Schritt 149 – Mehrfachprojektil I/II

## Ergebnis

`Multishot I` und `Multishot II` besitzen jetzt ein eigenes strukturiertes Schadensmodell. Die zuvor generische Teilabbildung wurde entfernt, damit keine Wirkung doppelt gerechnet wird.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Produktreferenz: `generated/pob2/damage-reference.json`
- PoB2-Quelldatei: `src/Data/Skills/sup_dex.lua`
- Records: `SupportMultishotPlayer`, `SupportMultishotPlayerTwo`

## Modellierte Wirkung

- Multishot I: zwei zusätzliche Projektile, 35 % weniger finaler Schaden, 20 % weniger finale Fertigkeitsgeschwindigkeit.
- Multishot II: zwei zusätzliche Projektile, 25 % weniger finaler Schaden, 20 % weniger finale Fertigkeitsgeschwindigkeit.
- Die Zusatzprojektile erhöhen die mögliche Zielabdeckung. Ohne gesonderten Mehrfachtrefferbeleg bleibt der Einzelzielmultiplikator `1,00`.
- Finale Fertigkeitsgeschwindigkeit wird vor einer belegten nachhaltigen Cooldown-Grenze angewandt. Eine Cooldown-Grenze kann deshalb den sichtbaren Frequenzunterschied neutralisieren.

## Fail-closed-Grenzen

Die Wirkung wird nur bei den strukturierten Fertigkeitstypen `Projectile` und `ProjectileNumber` angewandt. `ProjectilesNumberModifiersNotApplied`, inkompatible Fertigkeiten und mehrere Stufen derselben Supportfamilie blockieren die Wirkung. Namen, deutsche Anzeigetexte und freie Textähnlichkeit sind keine technische Grundlage.

## Versionen und Prüfung

- Schadensrechner: `3.63.0`
- Mehrfachprojektilmodell: `1.0.0`
- Projektiltreffermodell: `1.2.0`
- Fokussiert: 4 Testdateien, 75 Tests
- Gesamtlauf: 149 Testdateien, 1.801 Tests
- Typecheck, Lint, Produktions- und Pages-Build: erfolgreich
- JSON-Validierung: 226 Dateien
- Desktop 1280 × 720 und Mobil 390 × 844: kein horizontaler Überlauf, keine Browserkonsolenfehler oder -warnungen

Produktpins, englische PoB2-Produktdaten und Offline-Grenzen bleiben unverändert.
