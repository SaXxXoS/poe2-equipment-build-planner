# Automatische Gegnerwirkungen – Schritt 8

## Ziel

Belegte Flüche, Durchdringung und Rüstungsbruch fließen ohne zusätzliche
Nutzereinstellung aus dem konfigurierten Build in das automatische
Gegnervergleichsprofil.

## Produktive Wirkungen

- `Elemental Weakness` senkt anhand des strukturierten Gemmenwerts die
  Elementarwiderstände.
- `Despair` senkt anhand des strukturierten Gemmenwerts den
  Chaoswiderstand.
- Wegen des normalen Fluchlimits wird höchstens der stärkste für die
  tatsächlich verursachten Schadensarten relevante Fluch angesetzt.
- Strukturierter Rüstungsbruch pro Treffer wird nicht zwischen mehreren
  Quellen addiert; der stärkste Einzelwert wird geführt.
- Unbedingte, numerisch eindeutige Durchdringung aus tatsächlich belegten
  normalen oder Aszendenzknoten wird schadensartspezifisch addiert.

Jede verrechnete Wirkung erscheint mit Quelle, Betrag, Evidenz und
Bedingungsstatus in der Ergebnisansicht.

## Fail-closed-Grenzen

Anwendung und Wirkzeit eines gewählten Fluchs sowie Treffer für
Rüstungsbruch werden für den Vergleichswert vorausgesetzt und sichtbar als
Grenze genannt. Exposition wird nicht numerisch angerechnet, wenn der lokale
Pin nur die Gegnerstufengrenze oder den Begriff `Exposure`, aber keinen
eindeutigen Betrag enthält. Bedingte Durchdringung bleibt ausgeschlossen,
solange ihr Zustand nicht im Buildzustand belegt ist. Rüstungsbruch-Aufbau
und vollständig gebrochene Rüstung werden noch nicht zeitlich simuliert.

## Spielregeln

Die Umsetzung hält Widerstandssenkung und Durchdringung getrennt.
Durchdringung wirkt nur auf Treffer und drückt den Widerstand ohne
Sonderregel nicht unter null. Widerstandssenkung durch Fluch oder Exposition
kann dagegen negative Werte erzeugen. Standardmäßig kann ein Ziel einen
Fluch tragen. Rüstungsbruch baut gegnerische Rüstung ab und besitzt eine
Wirkdauer.

## Tests

Abgedeckt sind Elemental Weakness, Despair, Fluchauswahl, Rüstungsbruch,
Frost Bomb ohne erfundenen Expositionsbetrag, unbedingte Baumdurchdringung,
bedingte blockierte Durchdringung, Integration in den Schadenswert und
Determinismus.

## Nächster Schritt

Zeit- und Zustandsmodell für Fluchwirkzeit, Exposition, aufgebauten
Rüstungsbruch, vollständig gebrochene Rüstung und bedingte Durchdringung.
