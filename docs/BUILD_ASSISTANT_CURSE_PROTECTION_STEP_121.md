# Build-Assistent – Schritt 121: Fluchschutz

## Ziel

Schritt 121 bildet die im gepinnten Path-of-Building-2-Stand technisch belegten Unterschiede zwischen verringerter Fluchwirkung, Unbeeinflusstsein und Fluchimmunität im bestehenden Charakter-Schutzmodell ab.

## Quellen und Pins

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Berechnung: `src/Modules/CalcDefence.lua`, insbesondere `CurseAvoidChance` und `CurseEffectOnSelf`
- Parser: `src/Modules/ModParser.lua`, insbesondere `effect of curses on you`, `unaffected by curses` und bedingte Fluchimmunitäten
- Produktiver Baum: `data-sources/poe2-tree/raw/0.5.2/data.json`

## Umgesetzte Regeln

- Fluchwirkung beginnt bei 100 Prozent.
- `increased` und `reduced effect of Curses on you` werden wie PoB2 additiv verrechnet.
- Die effektive Fluchwirkung kann nicht unter null sinken.
- Unbedingtes `Unaffected by Curses` setzt die effektive Wirkung auf null, behauptet aber keine Immunität.
- Fluchimmunität und Fluchvermeidung bleiben eigene Felder. Im aktuellen produktiven Baum wurde keine unbedingte Quelle dafür gefunden.
- Bedingtes Unbeeinflusstsein und bedingte Immunität werden ohne bestätigten Laufzeitzustand fail-closed blockiert.

## Produktive Coverage

Der Baumstand 0.5.2 enthält 5.151 Knoten. Davon besitzen 11 Knoten exakt erkennbare Verringerungen der Fluchwirkung mit Werten von 5 bis 50 Prozent. Diese Knoten werden nun im tatsächlich zugewiesenen Pfad verrechnet.

## Wichtige Abgrenzung

- `immune`: Ein Fluch kann nicht auferlegt werden; PoB2 weist deshalb 100 Prozent Fluchvermeidung aus.
- `unaffected`: Der Fluch kann vorhanden sein, seine Wirkung auf den Charakter beträgt aber null.
- `reduced effect`: Der Fluch wirkt weiterhin mit dem berechneten Restwert.

Diese Zustände werden nicht zusammengeführt.

## Determinismus und Fail-closed-Verhalten

Nur exakt normalisierte englische Quellzeilen werden angewandt. Bedingungen wie „while affected by Zealotry“, „during Flask Effect“ oder Rage-Schwellen erzeugen ohne belegten Laufzeitzustand keinen Schutz und erscheinen in `blockedLines`.

## Versionen

- Charakter-Schutzmodell: `1.5.0`
- Schadensrechner: `3.35.0`

## Ergebnis

Fluchwirkung aus belegten Passivknoten beeinflusst das Charaktermodell jetzt reproduzierbar. Eine vollständige aktive Fluchsimulation ist damit noch nicht erreicht: Konkrete gegnerische Flüche, deren Magnituden und Laufzeitbedingungen werden in späteren Schritten gegen PoB2-Referenzfälle ergänzt.

## Prüfung

- Fokussierte Referenztests: 2 Dateien, 74 Tests, erfolgreich
- Gesamtsuite seriell: 136 Dateien, 1.684 Tests, erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich
- Produktions-Build: erfolgreich
- Pages-Build: erfolgreich
