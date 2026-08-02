# Build-Assistent – Sanduhr-Unterstützung (Schritt 160)

`Hourglass` wird als zusammenhängendes, exakt gepinntes Spezialmodell verarbeitet. Eine kompatible schädigende Fertigkeit erhält 30 % mehr Schaden und zugleich einen Cooldown von zehn Sekunden. Beide Wirkungen stammen aus demselben PoB2-Record und werden nicht getrennt oder generisch doppelt angewandt.

## Technische Quelle

- PoB2-Record: `SupportHourglassPlayer`
- `support_hourglass_damage_+%_final = 30`
- `support_hourglass_display_cooldown_time_ms = 10000`
- Supportfamilie: `GrantsCooldown`

Das Modell verlangt mindestens eine der strukturierten Schadens- beziehungsweise Angriffskategorien des Quellrecords. Fertigkeiten mit bestehendem Cooldown, `SupportedByHourglass`, Proxy-Nutzung, Auslösung oder persistenter Wirkung werden entsprechend der gepinnten Ausschlussliste fail-closed blockiert. Mehrere Einträge derselben Supportfamilie blockieren die gesamte Wirkung.

## Rechenwege

- Trefferkomponenten erhalten exakt den Faktor `1,30`.
- Belegter nativer Schaden über Zeit erhält ebenfalls exakt den Faktor `1,30`.
- Die nachhaltige Aktionsrate wird durch den bestehenden Cooldownpfad auf höchstens `0,1` Aktionen pro Sekunde begrenzt.
- Die spezialisierte Sanduhr-ID wird aus der allgemeinen Supportauswertung entfernt. Dadurch entsteht keine Doppelanwendung.
- Mana-Tempest-Fenster und Wutvergleichspfade verwenden denselben spezialisierten Faktor genau einmal.

## Grenzen und Versionen

- Keine zusätzliche Überlappung, Cooldown-Umgehung oder Uptime wird erfunden.
- Vollständige Gleichwertigkeit mit Path of Building 2 ist weiterhin nicht belegt.
- Produktpins, Quellenfreigaben und Offline-Grenzen bleiben unverändert.
- Schadensrechner: `3.74.0`; Sanduhrmodell: `1.0.0`; natives DoT-Modell: `3.4.0`.

## Prüfung

- Fokussiert: 3 Dateien und 82 Tests erfolgreich.
- Typecheck und Lint erfolgreich.
- Der vollständige serielle Lauf bestand mit 156 Dateien und 1.847 Tests.
- Produktions- und Pages-Build, 236 versionierte JSON-Dateien und `git diff --check` sind erfolgreich.
