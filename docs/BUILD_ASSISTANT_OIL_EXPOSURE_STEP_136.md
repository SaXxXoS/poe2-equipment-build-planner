# Build-Assistent – Ölexposition, Schritt 136

## Ziel

Schritt 136 verbindet die produktive Fertigkeit `Oil Grenade` mit dem bestehenden Gegnerzustands- und Widerstandsmodell. Die Wirkung wird ausschließlich aus strukturierten Werten der gepinnten PoB2-Referenz abgeleitet.

## Gepinnte Quelle

Maßgeblich ist `PathOfBuildingCommunity/PathOfBuilding-PoE2` bei Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

Quellrecord `OilGrenadePlayer` belegt:

- `skill_base_oil_exposure_-_to_total_elemental_resistance = 20`,
- `base_secondary_skill_effect_duration = 6000`,
- `base_skill_detonation_time = 1600`,
- vier Sekunden Abklingzeit und
- drei gespeicherte Nutzungen.

## Produktive Wirkung

Die Ölgranate senkt die Widerstände der im aktuellen Build tatsächlich verwendeten Elementarschadensarten um 20 %. Die sechssekündige Ölfläche kann bei einer Abklingzeit von vier Sekunden erneuert werden und ist deshalb als aufrechterhaltbar modelliert. `Potent Exposure` erhöht den Wert auf derselben Fertigkeitskarte strukturiert auf 24 %.

Die Wirkung ist an Fertigkeitskarte und Waffenset gebunden. Sie verwendet dieselbe Expositionsgruppe wie Frostbombe und die drei Expositionssupports. Pro Element wirkt deshalb nur die stärkste belegte Exposition; Flüche bleiben eine getrennte additive Gruppe.

## Fail-closed

Keine Ölexposition wird angerechnet bei:

- falschem Waffenset,
- rein physischem oder reinem Chaosschaden,
- fehlender strukturierter Magnitude,
- fehlender Wirkzeit oder Abklingzeit oder
- einer Wirkzeit, die keine Erneuerung auf Abklingzeit erlaubt.

Die anwachsende Frostbomben-Exposition bleibt blockiert: Die lokal gepinnten Zahlen belegen weiterhin keine vollständige Puls-, Reset- und Überlappungsregel. `Exposing Cry` bleibt ebenfalls blockiert, weil Dauer und „on hit“-Stat allein die vollständige Exert-/Trefferkette nicht belegen.

## Versionen

- Schadensrechner `3.50.0`
- Expositionsmodell `1.3.0`
- Schockmodell `1.4.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

Die fokussierte Prüfung umfasst zwei Dateien und 86 Tests. Die serielle Gesamtsuite bestand mit 140 Dateien und 1.745 Tests. Typecheck, Lint, Produktions-Build, Pages-Build und die Validierung von 208 JSON-Dateien waren erfolgreich. `git diff --check` wird vor dem Commit abschließend geprüft.

## Nächster Schritt

Als nächster Baustein folgt eine weitere lokal vollständig geschlossene Gegnerwirkung. Unvollständige Trigger-, Puls- oder Laufzeitzustände bleiben weiterhin wirkungsneutral.
