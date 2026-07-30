# Schritt 76 – belegte Unleash-Folgezaubersequenz

## Ergebnis

Die gepinnte PoB2-Fertigkeit `Unleash` wird jetzt als vorbereitender Effekt
für den unmittelbar folgenden Zauber ausgewertet. Der Quellenwert
`staff_unleash_number_of_seals_for_next_skill = 2` belegt zwei
Wiederholungen. Zusammen mit der ursprünglichen Ausführung ergibt dies eine
vorbereitete Sequenz aus drei Ausführungen.

## Fail-closed-Grenzen

- Das Ziel muss im gepinnten Fertigkeitsdatensatz ausdrücklich den Skilltyp
  `Unleashable` besitzen.
- `Unleash` und Ziel müssen in der belegten Bossrotation unmittelbar
  aufeinander folgen.
- Angriffe, nicht entfesselbare Zauber und nicht direkt verbundene
  Fertigkeiten erhalten keinen Multiplikator.
- Der Sequenzfaktor ist kein behaupteter dauerhafter DPS-Multiplikator.
- Es werden weder Textähnlichkeit noch freie Spielannahmen verwendet.

## Rechenmodell

`Sequenzfaktor = 1 + Anzahl belegter Siegel`

Für den gepinnten Stand: `1 + 2 = 3`.

Der Faktor wird auf die bereits aufgelösten Schadenskomponenten des
Folgezaubers angewendet und als `repeated-spell-sequence` im Rechennachweis
ausgegeben.

## Versionen und Tests

- Folgefertigkeitsmodell: `3.0.0`
- Schadensrechner: `3.17.0`
- Testfälle: direkter entfesselbarer Zauber und geblockter Angriff

## Offene Grenze

Eine nachhaltige DPS-Aussage benötigt weiterhin den vollständigen
Rotationszeitraum einschließlich Siegelaufbau, Wirkzeit und Ressourcen.
