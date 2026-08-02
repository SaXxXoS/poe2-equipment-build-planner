# Schritt 163 – Attunement-Unterstützungen exakt modelliert

## Ergebnis

Der Schadensrechner verarbeitet die vier gepinnten Attunement-Unterstützungen jetzt als eigenständige Wirkungen:

- `Fire Attunement`: 25 % des Ausgangsschadens als zusätzlichen Feuerschaden; 50 % weniger finaler Kälte- und Blitzschaden,
- `Cold Attunement`: 25 % des Ausgangsschadens als zusätzlichen Kälteschaden; 50 % weniger finaler Feuer- und Blitzschaden,
- `Lightning Attunement`: 25 % des Ausgangsschadens als zusätzlichen Blitzschaden; 50 % weniger finaler Kälte- und Feuerschaden,
- `Chaos Attunement`: 25 % des Ausgangsschadens als zusätzlichen Chaosschaden; 50 % weniger finaler Nicht-Chaosschaden.

Der zusätzliche Schaden wird aus der unbestraften Ausgangsbasis erzeugt und anschließend in der bestehenden PoB-Modifikatorreihenfolge skaliert. Die Finalstrafen werden danach schadensartspezifisch angewandt. Verschiedene Attunement-Familien können gemeinsam wirken; ihre Finalstrafen werden multiplikativ kombiniert. Mehrere Ränge derselben Familie werden fail-closed blockiert.

Die Integration gilt auch für temporäre Schadensfenster und Rage-Vergleiche. Bei nativem Schaden über Zeit gelten die belegten schadensartspezifischen Finalstrafen. Ein „Gain as Extra“-Anteil wird für nativen Schaden über Zeit nicht erfunden.

## Quellen und Grenzen

Verwendet werden ausschließlich die strukturierten Werte aus `generated/pob2/damage-reference.json` am bestehenden PoB2-Pin. Die Unterstützungen werden nur bei den gepinnt kompatiblen Fertigkeitstypen produktiv. Inkompatible Skills, unbekannte Records und doppelte Familien bleiben wirkungslos und werden als blockiert ausgewiesen.

Es wurden keine technischen GGG-IDs erzeugt, keine sichtbaren deutschen Texte als technische Quelle benutzt und keine externe Datenquelle ergänzt. Vollständige Gleichwertigkeit mit Path of Building 2 ist weiterhin nicht belegt; geschlossen ist der dokumentierte Attunement-Wirkungsumfang.

## Prüfungen

- fokussiert: 2 Dateien, 86 Tests erfolgreich,
- vollständige Parallelsuite: 157 Dateien und 1.865 Tests erfolgreich; zwei Vollbaumtests erreichten unter Parallellast das bestehende 5-Sekunden-Limit,
- serieller Wiederholungslauf dieser zwei Vollbaumdateien: 197 Tests erfolgreich,
- vollständige serielle Suite: 159 Dateien, 1.867 Tests erfolgreich,
- Typecheck, Lint, Produktions- und Pages-Build erfolgreich,
- 240 getrackte beziehungsweise neu erzeugte JSON-Dateien validiert und `git diff --check` erfolgreich,
- Produktpins, Quellenfreigaben und Offline-Grenzen unverändert.
