# Build-Assistent – Bedachtes Zaubern und Support-Doppelzählung (Schritt 159)

`Considered Casting` wird als exaktes, gepinntes Supportmodell verarbeitet. Ein kompatibler selbst gewirkter Trefferzauber erhält 35 % mehr Schaden und 15 % weniger Wirkgeschwindigkeit. Der kombinierte ungeminderte DPS-Faktor beträgt 1,1475 vor Server-Takt-Rundung.

## Technische Quelle und Kompatibilität

- PoB2-Record: `SupportConsideredCastingPlayer`
- `support_slow_cast_spell_damage_+%_final = 35`
- `support_slow_cast_cast_speed_+%_final = -15`
- Supportfamilie: `ConsideredCasting`
- Kostenmultiplikator im gepinnten Gemmenkatalog: 115 %

Das Modell verlangt einen schädigenden Zauber. Proxy-, Trigger-, persistente, reservierende und fest getaktete Fertigkeiten werden entsprechend der strukturierten Ausschlussliste fail-closed blockiert. Mehrere Einträge derselben Supportfamilie blockieren die gesamte Wirkung.

## Korrektur einer Doppelzählung

Exakt modellierte Supports konnten anschließend nochmals durch die allgemeine numerische Auswertung laufen. Schritt 159 trennt alle spezialisierten Support-IDs vor dieser Auswertung ab. Für Kontrollierte Zerstörung und Bedachtes Zaubern gilt dies auch in Mana-Tempest- und Wutvergleichspfaden. Ein Regressionstest belegt für Kontrollierte Zerstörung exakt 1,25 statt einer falschen Doppelanwendung von 1,5625.

## Grenzen und Versionen

- Keine Ableitung für unbelegte Selbstwirk-, Treffer- oder native DoT-Sonderfälle.
- Vollständige Gleichwertigkeit mit Path of Building 2 ist weiterhin nicht belegt.
- Produktpins, Offline-Betrieb und Quellenfreigaben bleiben unverändert.
- Schadensrechner: `3.73.0`; Considered-Casting-Modell: `1.0.0`.

## Prüfung

- Fokussiert: 74 Rechentests bestanden.
- Gesamtsuite: 1.840 Tests im gemeinsamen Lauf bestanden; drei unter Parallel-Last zeitüberschrittene Vollbaumtests bestanden isoliert (2 + 195 + 1 Tests). Damit sind alle 1.843 fachlichen Tests erfolgreich.
- Typecheck, Lint, Produktions-Build und Pages-Build bestanden.
- 2.549 JSON-Dateien und `git diff --check` bestanden.
