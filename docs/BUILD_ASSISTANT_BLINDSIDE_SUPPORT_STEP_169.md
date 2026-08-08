# Schritt 169 – Blindside gegen geblendete Gegner

## Ergebnis

Die gepinnte Unterstützung `Blindside` verarbeitet nun ihre beiden belegten bedingten Krit-Effekte:

- gegen ein ausdrücklich als geblendet bestätigtes Ziel: 15 % mehr kritische Trefferchance und 15 % mehr kritischer Schadensbonus;
- gegen ein bestätigt nicht geblendetes Ziel: kein Bonus;
- ohne eindeutigen Blindzustand: kein angenommener Bonus und fail-closed blockierter Supporteffekt.

Das Modell gilt ausschließlich für passende Armbrustangriffe. Inkompatible Fertigkeiten und mehrere Einträge derselben Supportfamilie werden blockiert. Die App leitet den Blindzustand weder aus Namen noch aus sichtbarem Text ab.

## Rechenwirkung

Die kritische Trefferchance wird nach ihren übrigen belegten Multiplikatoren mit `1,15` multipliziert und weiterhin auf 100 % begrenzt. Der gesamte kritische Schadensbonus wird anschließend mit `1,15` multipliziert. Effekte, die kritische Treffer vollständig verbieten, behalten Vorrang.

## Technische Einordnung

- Schadensrechner: `3.83.0`
- Blindside-Modell: `1.0.0`
- Quelle: `generated/pob2/damage-reference.json`
- Quellrecord: `SupportBlindsidePlayer`
- Quellstats: `support_unseen_critical_strike_chance_+%_final_vs_blinded_enemies = 15` und `support_unseen_critical_damage_multiplier_+%_final_vs_blinded_enemies = 15`
- strukturierter Vergleichszustand: `enemyProfile.blinded`
- Produktpins, Offline-Grenzen und Quellenfreigaben bleiben unverändert.
- Vollständige Path-of-Building-Gleichwertigkeit ist weiterhin nicht belegt.

## Prüfung

Die fokussierten Modell- und Integrationsprüfungen umfassen 2 Dateien und 85 Tests. Im vollständigen Parallellauf bestanden 1.882 Tests; die drei ausschließlich unter Vollbaum-Parallellast zeitüberschrittenen Dateien bestanden seriell mit insgesamt 198 Tests. Typecheck und `git diff --check` waren erfolgreich.
