# Schritt 144 – strukturierte Wirkungsdauer-Supports

## Ziel

Der Schadensrechner soll die lokal und am bestehenden PoB2-Pin belegten finalen Wirkungsdauerwerte von `Compressed Duration I/II` und `Prolonged Duration I/II` anwenden, ohne eine längere Dauer fälschlich als höheren Schaden pro Sekunde auszugeben.

## Quelle und Pin

- Produktquelle: `generated/pob2/damage-reference.json`
- PoB2-Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- PoB2-Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Quellabbildung: `src/Data/Skills/sup_str.lua`
- Verwendete Stats:
  - `support_reduced_duration_skill_effect_duration_+%_final`
  - `support_more_duration_skill_effect_duration_+%_final`

## Berechnung

- `Compressed Duration I`: Faktor `0,70`
- `Compressed Duration II`: Faktor `0,65`
- `Prolonged Duration I`: Faktor `1,30`
- `Prolonged Duration II`: Faktor `1,35`
- Verschiedene Familien werden multiplikativ kombiniert.
- Mehrere Stufen derselben Familie werden vollständig blockiert.
- Die Fertigkeit muss den strukturierten PoB2-Typ `Duration` besitzen.

Der Faktor verändert `base_skill_effect_duration`. Der native Schaden pro Sekunde bleibt gleich. Der Gesamtschaden einer einzelnen Anwendung wird aus unverändertem DPS und neuer Dauer berechnet.

## Produktgrenze

Schritt 144 bindet die Supportdauer zunächst an den bereits strukturierten nativen DoT-Einzelanwendungswert an. Aufrechterhaltene Uptime, Überlappung, Stapel, Triggerzeiten und alle allgemeinen Buff-/Debuff-Dauern werden nicht daraus erfunden. Die App bleibt deshalb ein belegter Teilrechner und noch kein vollständiger Path-of-Building-Ersatz.

## Sichtbarkeit

Die Ergebnisansicht nennt bei angewandter Dauer den Faktor und erklärt ausdrücklich, dass kein DPS-Bonus entsteht. Blockierte Mehrfachstufen oder inkompatible Fertigkeiten werden mit ihrem Grund angezeigt.

## Verifikation

- fokussierte Dauer-, DoT- und Integrationsprüfung: 3 Dateien, 68 Tests
- Typecheck, Lint, vollständige serielle Testsuite, Produktions- und Pages-Build: siehe Auditbericht und `AI_PROJECT/CHATGPT_PROTOCOL.md`

## Nächster Schritt

Weitere strukturierte Wirkungsdauerziele nur einzeln anbinden, wenn ihre Laufzeit-, Uptime-, Stapel- und Zielregeln vollständig geschlossen sind. Als nächster Rechenbaustein wird die verbleibende PoB2-Supportwirkung nach reproduzierbarer numerischer Relevanz priorisiert.
