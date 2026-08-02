# Schritt 151 – finale Cooldown-Geschwindigkeit

## Ziel

Die bislang ignorierte finale Cooldown-Geschwindigkeit von `Second Wind I–III` wird aus dem gepinnten PoB2-Datensatz erschlossen, ohne sie mit Cooldown-Recovery oder zusätzlichen Nutzungen gleichzusetzen.

## Strukturierte Werte

- `Second Wind I`: `base_cooldown_speed_+%_final = -50`
- `Second Wind II`: `base_cooldown_speed_+%_final = -40`
- `Second Wind III`: `base_cooldown_speed_+%_final = -40`
- Quelle: `src/Data/Skills/sup_dex.lua` am PoB2-Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`

## Rechenreihenfolge

1. Basis- oder belegter Cooldown-Override
2. additive erhöhte Cooldown-Recovery
3. finale Cooldown-Geschwindigkeit als eigener Multiplikator
4. vorhandene Server-Tick-Rundung für Fertigkeiten ohne mehrere gespeicherte Nutzungen

Zusätzliche gespeicherte Nutzungen bleiben ein kurzfristiger Vorrat. `Second Wind` erzeugt aus den gepinnten Feldern keine zusätzliche Nutzung.
Mehrere Stufen derselben Supportfamilie werden auch im Rechner nicht doppelt angewandt.

## Fail-closed-Status

Die Supportdefinition verlangt gleichzeitig `Cooldown` und `AffectedByCooldownRate` und schließt `Triggered`, `Instant` und `Meta` aus. Unter den aktuell gepinnten Skillrecords erfüllt kein produktiver Skill diese vollständige Kombination. Deshalb ist die Rechenregel implementiert und mit einer strukturell kompatiblen Testfixture geprüft, wird aber noch keinem inkompatiblen Produkt-Skill aufgezwungen.

## Versionen

- Schadensrechner: `3.65.0`
- Trigger-/Wiederholungsmodell: `1.11.0`

Produktpins, Runtime-Netzwerkstatus und Quellenfreigaben bleiben unverändert.
