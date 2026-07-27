# Build-Assistent – Kritische Treffer und quantitative Support-Schnittstelle

## Ziel

Dieser Schritt erweitert die quantitative Wirkungskette um kritische Treffer
und um eine fail-closed Schnittstelle für numerische Supporteffekte.

## Kritische Treffer

Die Berechnung verwendet:

1. die strukturierte Basis-Kritchance des Zaubers oder den eingegebenen
   endgültigen Kritwert der Waffe,
2. belegte Erhöhungen der Kritchance aus Ausrüstung, Passivbaum und
   Aszendenz,
3. strukturierte `more-critical-chance`-Effekte ausgewählter Supports,
4. den PoE2-Basis-Kritschadensbonus von `+100 %`,
5. belegte zusätzliche Kritschadensboni.

Der sichtbare Erwartungswert lautet:

`normaler DPS × (1 + Kritchance × gesamter Kritschadensbonus)`

Der Wert ist weiterhin kein vollständiger Path-of-Building-DPS-Wert.
Bedingte Kritmechaniken bleiben ausgeschlossen.

Regelreferenz:

- https://www.poe2wiki.net/wiki/Critical_Damage_Bonus

## Quantitative Supporteffekte

`SupportGemDefinition` besitzt nun eine optionale,
streng strukturierte `quantitativeEffects`-Liste.

Zulässige Effekte:

- `more-damage`
- `action-speed`
- `more-critical-chance`
- `critical-damage-bonus`

Jeder Wert benötigt:

- `evidence = structured-exact`
- eine konkrete `sourceReference`
- einen numerischen Prozentwert
- optional eine Begrenzung auf bestimmte Schadensarten

Mehrere „more damage“-Effekte werden nacheinander multipliziert.

## Wichtige Produktgrenze

Der produktive RePoE-Gemmenkatalog enthält aktuell 235 Skills und 451
Supportdatensätze, aber laut seinem versionierten Vertrag keine numerischen
Skill- oder Supporteffekte. Deshalb werden aus Namen, Tags oder sichtbaren
Beschreibungen keine Prozentwerte geschätzt.

Ein ausgewählter Support ohne strukturierten numerischen Effekt:

- bleibt als fachliche Empfehlung erhalten,
- verändert den numerischen Schadenswert nicht,
- wird im Ergebnis ausdrücklich als noch nicht numerisch belegt genannt.

## Nicht enthalten

- Gegnerwiderstände und gegnerische Rüstung
- Flüche, Exposition und Debuffs
- Schaden über Zeit und Ailments
- Mehrfachtreffer und Projektilüberschneidungen
- Triggerfrequenzen
- Buff-Uptime
- bedingte Kritmechaniken

## Prüfungen

Die Tests decken ab:

- Zauber-Basis-Kritchance
- PoE2-Basis-Kritschadensbonus
- deterministischen Krit-Erwartungswert
- multiplikative Supporteffekte
- schadensartgebundene Supporteffekte
- fail-closed Verhalten ohne numerischen Supportwert

## Nächster Schritt

Als nächstes folgt ein transparentes Gegner- und Debuffmodell. Automatische
Bosswiderstände werden erst verwendet, wenn dafür eine versionierte technische
Quelle beziehungsweise ein ausdrücklich gekennzeichnetes Vergleichsprofil
vorliegt.
