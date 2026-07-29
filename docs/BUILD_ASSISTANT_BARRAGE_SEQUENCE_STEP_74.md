# Schritt 74 – Barrage-Wiederholungssequenz

## Ergebnis

Die App modelliert die gepinnte Basiswirkung von `Barrage` auf den
unmittelbar folgenden kompatiblen Projektilangriff.

Produktiv gelten nur vollständig geschlossene Belege:

- die Rotation enthält `Barrage` direkt vor dem Hauptangriff,
- der Zielskill besitzt in den gepinnten PoB2-Daten den Skilltyp
  `Barrageable`,
- `empower_barrage_base_number_of_barrage_repeats = 2`,
- `empower_barrage_damage_-%_final_with_repeated_projectiles = 50`.

Damit besteht die vorbereitete Sequenz aus dem ursprünglichen Treffer und
zwei Wiederholungen mit jeweils 50 Prozent weniger Schaden:

`1 + 2 × 0,5 = 2,0` Trefferschäden.

## Fail-closed-Grenzen

- Ein Zauber wie Spark wird nicht durch Barrage vervielfacht.
- Ohne unmittelbare Rotationsfolge entsteht kein Bonus.
- Zusätzliche Wiederholungen pro Raserei-Ladung werden ohne bestätigte
  Ladungszahl nicht eingerechnet.
- Die Sequenz wird als vorbereitetes Wirkungsfenster ausgewiesen und nicht
  stillschweigend zum normalen Dauer-DPS addiert.

## Version und Prüfung

- Schadensrechner: `3.15.0`
- Folgefertigkeitsmodell: `2.0.0`
- 49 fokussierte Tests erfolgreich
- Typecheck erfolgreich

Die vollständige PoB2-Gleichwertigkeit bleibt offen. Nächste Lücken sind
bestätigte Raserei-Zustände für Barrage, weitere fertigkeitsspezifische
Wiederholungen und Trigger-/Projektilketten.
