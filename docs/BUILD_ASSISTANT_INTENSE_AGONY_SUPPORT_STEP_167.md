# Schritt 167 – Intense Agony gegen Ziele auf vollem Leben

## Ergebnis

Die gepinnte Unterstützung `Intense Agony` verarbeitet nun beide gemeinsam belegten Wirkungen:

- gegen ein ausdrücklich als `full-life` bestätigtes Ziel: 50 % mehr nativer Schaden über Zeit;
- immer: 25 % weniger Wirkungsdauer;
- bei einem bestätigt nicht auf vollem Leben befindlichen Ziel: nur die Dauerkürzung;
- ohne eindeutigen Lebenszustand: nur die Dauerkürzung, der bedingte Schadensbonus bleibt fail-closed inaktiv.

Das Modell gilt ausschließlich für Fertigkeiten, deren gepinnte Typen sowohl `Spell` als auch `DamageOverTime` enthalten. Es verändert weder Trefferschaden noch ohne vollständige Identitätskette abgeleitete Zustände wie Entzünden, Gift oder Blutung. Mehrere Einträge derselben Supportfamilie und inkompatible Fertigkeiten werden blockiert.

## Rechenwirkung

Bei bestätigtem vollem Leben steigt der belegte Einzelanwendungs-DPS auf den Faktor `1,5`; die Wirkungsdauer sinkt gleichzeitig auf den Faktor `0,75`. Der Gesamtschaden einer einzelnen Anwendung steigt deshalb auf den kombinierten Faktor `1,125`. Bei unbekanntem oder bestätigt anderem Lebenszustand bleibt der DPS-Faktor `1,0`, während die Dauer weiterhin mit `0,75` berechnet wird.

## Technische Einordnung

- Schadensrechner: `3.81.0`
- Intense-Agony-Modell: `1.0.0`
- Quelle: `generated/pob2/damage-reference.json`
- Quellrecord: `SupportIntenseAgonyPlayer`
- Quellstats:
  - `support_chaotic_assassination_damage_over_time_+%_final_against_full_life_enemies = 50`
  - `support_chaotic_assassination_skill_effect_duration_+%_final = -25`
- Produktpins, Offline-Grenzen und Quellenfreigaben bleiben unverändert.
- Vollständige Path-of-Building-Gleichwertigkeit ist weiterhin nicht belegt.

## Prüfung

Die fokussierten Modell- und Integrationsprüfungen umfassen 2 Dateien und 84 Tests. Im vollständigen Parallellauf bestanden 1.878 Tests; die drei bekannten ausschließlich unter Vollbaum-Parallellast zeitüberschrittenen Dateien bestanden seriell mit insgesamt 198 Tests. Typecheck, Lint, Produktions-Build, Pages-Build, 243 JSON-Dateien und `git diff --check` waren erfolgreich.
