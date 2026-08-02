# Schritt 148 – Verkettung

## Ergebnis

`Chain I–III` (`Verkettung I–III`) sind als eigene, gepinnte und fail-closed arbeitende Supporteffekte in die bestehende Schadens- und Projektilberechnung eingebunden.

## Quelle und Pin

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Produktreferenz: `generated/pob2/damage-reference.json`
- Quelldatei: `src/Data/Skills/sup_dex.lua`
- Quellrecords: `SupportChainPlayer`, `SupportChain2Player`, `SupportChain3Player`

Die gepinnten Records belegen:

- Chain I: eine zusätzliche Verkettung und 30 % weniger finaler Trefferschaden.
- Chain II: zwei zusätzliche Verkettungen und 50 % weniger finaler Trefferschaden.
- Chain III: zwei zusätzliche Verkettungen und 40 % weniger finaler Trefferschaden.

## Rechenregel

Die Wirkung wird ausschließlich auf Fertigkeiten angewandt, die strukturiert sowohl `Projectile` als auch `Chains` besitzen. `CannotChain` und `ProjectileNoCollision` blockieren die Wirkung. Mehrere Vertreter derselben Supportfamilie werden ebenfalls blockiert.

Der jeweilige finale Trefferschadensfaktor wird auf Trefferkomponenten angewandt. Eigenständiger Schaden über Zeit bleibt unverändert. Die zusätzlichen Verkettungen erhöhen die mögliche Zielabdeckung im Mapping. Für ein einzelnes Ziel bleibt der Treffermultiplikator ausdrücklich `1,00`: Ohne belegte Rückkehr-, Aufprall- oder Mehrfachtrefferregel wird kein zusätzlicher Boss-Schaden erfunden.

Natürliche Verkettungen der Fertigkeit und zusätzliche Verkettungen durch den Support werden getrennt ausgewiesen und anschließend nur für die Coverage-Schätzung addiert. Die frühere generische Abbildung des Schadensstats wurde entfernt, damit der Faktor nicht doppelt angewandt wird.

## Integration und Verifikation

- Schadensrechner: `3.62.0`
- Verkettungs-Supportmodell: `1.0.0`
- Projektiltreffermodell: `1.1.0`
- Fokussiert: 3 Dateien, 70 Tests erfolgreich.
- Gesamtsuite seriell: 148 Dateien, 1.796 Tests erfolgreich.
- Typecheck, Lint, Produktions-Build, Pages-Build, JSON-Validierung und `git diff --check` erfolgreich.
- Desktop-Browserprüfung bei 1280 × 720 erfolgreich.
- Mobilprüfung bei 390 × 844 ohne horizontalen Überlauf.
- Browserkonsole ohne Warnungen oder Fehler.

## Grenzen

Nicht modelliert werden konkrete Gegnerpositionen, Kettenreichweite, Rückkehr zum selben Gegner oder weitere Treffer ohne gesonderten strukturierten Beleg. Nicht strukturierte Supportstufen bleiben wirkungsneutral. Dieser Schritt ist ein weiterer belegter Baustein, keine behauptete vollständige Path-of-Building-Gleichwertigkeit.
