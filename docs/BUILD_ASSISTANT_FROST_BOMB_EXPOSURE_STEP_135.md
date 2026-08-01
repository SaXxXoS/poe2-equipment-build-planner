# Build-Assistent – Frostbomben-Exposition, Schritt 135

## Ziel

Schritt 135 verbindet die produktive Fertigkeit `Frost Bomb` mit dem bestehenden Gegnerzustands- und Widerstandsmodell. Die Integration verwendet ausschließlich strukturierte Werte der gepinnten PoB2-Referenz und keine Textähnlichkeit.

## Gepinnte Quelle

Maßgeblich ist `PathOfBuildingCommunity/PathOfBuilding-PoE2` bei Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

Quellrecord `FrostBombPlayer` belegt:

- `active_skill_all_elemental_exposure_magnitude = 20`,
- `base_secondary_skill_effect_duration = 8000`,
- `base_skill_detonation_time = 4000`,
- eine Abklingzeit von sechs Sekunden,
- `frost_bomb_exposure_does_not_apply_to_enemies_of_level_higher_than_X` je Gemmenstufe,
- `active_skill_all_elemental_exposure_compounding_magnitude = 2` und
- `active_skill_all_elemental_exposure_compounding_magnitude_cap = 50`.

## Produktive Wirkung

Der belegte Grundwert von 20 % Exposition wird auf die im aktuellen Build tatsächlich verwendeten elementaren Schadensarten angewandt. Mit gewähltem `Potent Exposure` steigt dieser Wert anhand dessen strukturierten 20-%-Effektmodifikators auf 24 %.

Die Wirkung ist nur produktiv, wenn:

- Frostbombe im aktiven Waffenset liegt,
- mindestens eine relevante elementare Schadensart vorhanden ist,
- das Gegnerlevel bekannt ist,
- das Gegnerlevel die Grenze der gewählten Gemmenstufe nicht überschreitet und
- Wirkzeit und Abklingzeit eine Erneuerung des Grundwerts erlauben.

Frostbombe verwendet dieselbe Expositionsgruppe wie die drei Expositionssupports. Je Element wirkt dadurch weiterhin nur der stärkste belegte Expositionswert; Flüche und Exposition bleiben getrennte additive Gruppen.

## Fail-closed

Keine Frostbomben-Exposition wird angerechnet bei:

- unbekanntem Gegnerlevel,
- zu hohem Gegnerlevel,
- falschem Waffenset,
- rein physischem oder reinem Chaosschaden,
- fehlender strukturierter Wirkzeit oder Abklingzeit.

Der anwachsende Wert von 2 bis zur Obergrenze 50 wird noch nicht produktiv addiert. Die gepinnten Zahlen sind vorhanden, aber die vollständige Reset-, Puls-, Ersetzungs- und Überlappungsregel ist in der bestehenden lokalen Wirkungskette noch nicht eindeutig geschlossen. Die App weist deshalb nur den sicheren Grundwert aus.

## Versionen

- Schadensrechner `3.49.0`
- Expositionsmodell `1.2.0`
- Schockmodell `1.4.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

Fokussiert wurden zwei Dateien mit 83 Tests geprüft. Die serielle Gesamtsuite bestand mit 140 Dateien und 1.742 Tests. Typecheck, Lint, Produktions-Build und Pages-Build waren erfolgreich. Die JSON-Validierung und `git diff --check` werden im Abschlussaudit festgehalten.

## Nächster Schritt

Als nächster Baustein wird die anwachsende Frostbomben-Exposition nur dann ergänzt, wenn Puls-, Reset- und Überlappungsverhalten aus den gepinnten lokalen Quellen vollständig reproduzierbar belegt werden kann. Andernfalls folgt die nächste geschlossene Gegnerzustandskette.
