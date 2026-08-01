# Schritt 137 – Rüstungsbruch und vollständig gebrochene Rüstung

## Ziel

Die bisher pauschale Rüstungsbruchbehandlung wird mit den lokal gepinnten PoB2-Feldern, ausgewählten Supports, Gemmenqualität und tatsächlich zugewiesenen Passivknoten verbunden.

## Produktive Wirkung

- Direkter Rüstungsbruch aus `apply_X_armour_break_on_hit` und `warcry_grant_break_X_armour_on_hit`.
- `Armour Break I–III` erzeugt Rüstungsbruch aus dem berechneten durchschnittlichen physischen Treffer derselben Fertigkeitskarte.
- `Armour Demolisher I–II` multipliziert nur den Rüstungsbruch der Karte, in der der Support gewählt ist.
- Gemmenqualität wirkt auf direkte Rüstungsbruchwerte, wenn der Skill die gepinnte Qualitätszeile `armour_break_amount_+%` besitzt.
- Unbedingte zugewiesene Passivwerte für Bruchmenge, Dauer und Wirkung werden waffensetgenau übernommen.
- Vollständig gebrochene Rüstung setzt die Zielrüstung für physische Treffer auf null und erhöht standardmäßig den erlittenen physischen Trefferschaden um 20 %.
- Exakt zugewiesene Baumknoten können diese Wirkung auf Feuer, Kälte und Blitz oder auf alle Trefferschadensarten erweitern. Schaden über Zeit erhält diesen Trefferbonus nicht.

## Fail-closed-Grenzen

- Bedingte Bruchregeln wie „gegen beeinträchtigte Ziele“, kritische Zauberregeln, Pinning und Heavy Stun werden ohne geschlossene Zustandskette nicht angewandt.
- Bruchwerte verschiedener unabhängig ausgeführter Fertigkeiten werden nicht frei addiert. Für den nachhaltigen Vollbruch wird eine belegte Fertigkeitsquelle mit eigener Aktionsrate verwendet.
- `Imploding Impacts` erweitert die Vollbruchwirkung auf alle Treffer; das zusätzliche Überbrechen unter null bleibt bis zur vollständigen Regelkette blockiert.
- Ohne bekannte Zielrüstung können Trefferzahl und Vollbruchzustand nicht behauptet werden.

## Versionen

- Schadensrechner: `3.51.0`
- Rüstungsbruchmodell: `2.0.0`
- Gepinnte PoB2-Schadensreferenz bleibt unverändert.

## Ergebnis

Rüstungsbruch ist nicht länger nur ein pauschaler Skillwert. Seine Quelle, Menge, Dauer, Aufbaugeschwindigkeit und schadensartspezifische Vollbruchwirkung sind reproduzierbar an die konkrete Fertigkeitskarte und den aktiven Baum gebunden.

## Prüfung

- Fokussiert: 3 Dateien, 90 Tests erfolgreich.
- Gesamtlauf: 139 Dateien und 1.747 Tests erfolgreich; zwei zeitkritische Passivbaumdateien überschritten nur unter gemeinsamer Last das 5-Sekunden-Limit.
- Isolierter serieller Wiederholungslauf: 2 Dateien, 197 Tests erfolgreich.
- Typecheck, Lint, Produktions-Build und Pages-Build erfolgreich.
