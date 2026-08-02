# Schritt 161 – Heavy Swing exakt modelliert

## Ergebnis

Der Rechner behandelt `Heavy Swing` nicht mehr als unvollständigen generischen Schadensbonus. Die gepinnte PoB2-Definition `SupportMeleePhysicalDamagePlayer` wird als zusammengehörige Wirkung ausgewertet:

- `support_melee_physical_damage_+%_final = 35`: 35 % mehr physischer Schaden,
- `support_melee_physical_damage_attack_speed_+%_final = -10`: 10 % weniger Angriffsgeschwindigkeit,
- erforderlicher Fertigkeitstyp `Melee`,
- Supportfamilie `HeavySwing`.

Der physische Faktor wirkt ausschließlich auf physische Trefferschadenskomponenten und auf einen belegten nativen physischen DoT derselben kompatiblen Nahkampffertigkeit. Nichtphysische Komponenten bleiben unverändert. Die Angriffsgeschwindigkeit wird separat mit `0,9` multipliziert. Inkompatible Fertigkeiten und doppelte Supportfamilien werden fail-closed blockiert.

## Produkttrennung und Grenzen

Es wurden keine technische GGG-ID, keine externe Quelle und keine freie Textinterpretation ergänzt. Die englische PoB2-Produktdatei, Unique-Daten, Affixdaten und Datenpins bleiben unverändert. Der Rechner verwendet nur die bereits gepinnte strukturierte Supportdefinition.

`Heavy Swing` ist damit für den belegten Wirkungsumfang exakt modelliert. Dies beweist weiterhin keine vollständige Gleichwertigkeit mit Path of Building 2; weitere Support-, Skill- und Wechselwirkungsmodelle bleiben separat zu schließen.

## Prüfungen

- fokussiert: 3 Dateien, 83 Tests erfolgreich,
- vollständig stabil seriell: 157 Dateien, 1.851 Tests erfolgreich,
- Typecheck und Lint erfolgreich,
- Produktions- und Pages-Build erfolgreich,
- 237 getrackte JSON-Dateien mit Node validiert,
- `git diff --check` erfolgreich.

Der erste parallele Volltestlauf überschritt bei zwei bestehenden Vollbaumtests deren 5-Sekunden-Limit. Der Wiederholungslauf mit einem Worker und 30-Sekunden-Testlimit war vollständig erfolgreich; es bestand kein fachlicher Heavy-Swing-Fehler.
