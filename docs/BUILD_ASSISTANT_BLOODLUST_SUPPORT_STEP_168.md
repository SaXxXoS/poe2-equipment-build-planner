# Schritt 168 – Bloodlust gegen blutende Gegner

## Ergebnis

Die gepinnte Unterstützung `Bloodlust` verarbeitet nun ihren belegten bedingten Schadenseffekt:

- gegen ein ausdrücklich als blutend bestätigtes Ziel: 30 % mehr physischer Nahkampfschaden;
- gegen ein bestätigt nicht blutendes Ziel: kein Bonus;
- ohne eindeutigen Blutungszustand: kein angenommener Bonus und fail-closed blockierter Supporteffekt.

Das Modell gilt ausschließlich für Fertigkeiten mit dem gepinnten Fertigkeitstyp `Melee`. Es verstärkt nur physische Schadenskomponenten. Feuer-, Kälte-, Blitz- und Chaosschaden bleiben unverändert. Die App leitet Blutung weder aus dem Namen einer Fertigkeit noch aus demselben Treffer oder aus sichtbarem Text ab. Mehrere Einträge derselben Supportfamilie und inkompatible Fertigkeiten werden blockiert.

## Rechenwirkung

Bei bestätigter Blutung wird jede physische Min-/Max-Schadenskomponente mit dem Faktor `1,3` multipliziert. Nichtphysische Komponenten behalten ihren bisherigen Wert. Der Faktor wird auch in den bereits vorhandenen temporären Schadens- und Rage-Vergleichspfaden in derselben spezialisierten Rechenreihenfolge angewandt.

## Technische Einordnung

- Schadensrechner: `3.82.0`
- Bloodlust-Modell: `1.0.0`
- Quelle: `generated/pob2/damage-reference.json`
- Quellrecord: `SupportBloodlustPlayer`
- Quellstat: `support_bloodlust_melee_physical_damage_+%_final_vs_bleeding_enemies = 30`
- strukturierter Vergleichszustand: `enemyProfile.ailmentStates.bleeding`
- Produktpins, Offline-Grenzen und Quellenfreigaben bleiben unverändert.
- Vollständige Path-of-Building-Gleichwertigkeit ist weiterhin nicht belegt.

## Prüfung

Die fokussierten Modell- und Integrationsprüfungen umfassen 2 Dateien und 85 Tests. Im vollständigen Parallellauf bestanden 1.881 Tests; die drei bekannten ausschließlich unter Vollbaum-Parallellast zeitüberschrittenen Dateien bestanden seriell mit insgesamt 198 Tests. Typecheck, Lint, Produktions-Build, Pages-Build, 244 JSON-Dateien und `git diff --check` waren erfolgreich.
