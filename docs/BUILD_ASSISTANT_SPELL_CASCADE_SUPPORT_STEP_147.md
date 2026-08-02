# Schritt 147 – Zauberkaskade

## Ergebnis

`Spell Cascade` (`Zauberkaskade`) ist als eigener, gepinnter und fail-closed arbeitender Supporteffekt in die bestehende Schadensberechnung eingebunden.

## Quelle und Pin

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Produktreferenz: `generated/pob2/damage-reference.json`
- Quellrecord: `SupportSpellCascadePlayer`
- Quelldatei: `src/Data/Skills/sup_int.lua`

Der Quellrecord belegt eine zusätzliche Kaskade pro Seite, 20 % weniger finale Wirkungsfläche und 30 % weniger finalen Schaden.

## Rechenregel

Die Wirkung wird ausschließlich auf Fertigkeiten mit dem strukturierten Skilltyp `Cascadable` angewandt. Treffer und eigenständiger nativer Schaden über Zeit erhalten den Faktor `0,70`. Die Wirkungsfläche erhält getrennt den Faktor `0,80`.

Eine Kaskade pro Seite ergibt drei Wirkungsbereiche. Daraus wird ausdrücklich kein dreifacher Einzelzielschaden abgeleitet: Ohne belegte Positionierung und Überlappung bleibt der Einzelziel-Überlappungsfaktor `1,00`.

Mehrere Vertreter derselben Supportfamilie werden blockiert. Nicht kaskadierbare Fertigkeiten bleiben unverändert und erhalten einen sichtbaren Blockierungsgrund.

## Integration und Verifikation

- Schadensrechner: `3.61.0`
- Zauberkaskadenmodell: `1.0.0`
- DoT-Modell: `3.3.0`
- Fokussiert: 3 Dateien, 73 Tests erfolgreich.
- Gesamtsuite seriell: 148 Dateien, 1.793 Tests erfolgreich.
- Typecheck, Lint, Produktions-Build, Pages-Build, JSON-Validierung und `git diff --check` erfolgreich.
- Desktop-Browserprüfung erfolgreich.
- Mobilprüfung 390 × 844: kein horizontaler Überlauf.
- Browserkonsole: keine Warnungen oder Fehler.

## Grenzen

Nicht modelliert werden gegnerspezifische Flächenabdeckung, räumliche Kaskadenpositionierung, tatsächliche Überlappungen oder zusätzliche Treffer. Nicht strukturierte Supportstufen bleiben wirkungsneutral. Dieser Schritt ist ein weiterer belegter Baustein, keine behauptete vollständige Path-of-Building-Gleichwertigkeit.

