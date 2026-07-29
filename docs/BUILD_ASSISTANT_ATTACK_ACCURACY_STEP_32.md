# Angriffstrefferchance – Paritätsschritt 32

## Ziel

Angriffsschaden und schädigende Zustände dürfen nicht länger implizit von
100 Prozent Trefferchance ausgehen. Der Rechenpfad verwendet deshalb die
Formel und Basistabellen des gepinnten PoB2-Commits
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

## Implementierte Kette

- Basisgenauigkeit: `6 × (Charakterlevel − 1)`
- Klassengeschicklichkeit aus dem gepinnten PoB2-Baum
- `6` Genauigkeit je Geschicklichkeit
- exakt zugeordnete flache und erhöhte Genauigkeit aus Ausrüstung
- lokale Genauigkeit ausschließlich aus dem aktiven Waffenset
- exakt lesbare Geschicklichkeits-, Attribut- und Genauigkeitszeilen aus den
  tatsächlich belegten Passive- und Aszendenzknoten
- Gegner-Ausweichen aus der 100-stufigen PoB2-Tabelle
- PoB2-Formel:
  `Accuracy × 1,25 / (Accuracy + Evasion × 0,3)`
- PoB2-Rundung und reguläre Begrenzung auf `5–100 %`

Die App zeigt Genauigkeit, Gegner-Ausweichen, Trefferchance sowie
trefferbereinigten Schaden getrennt vom bisherigen theoretischen
Aktionswert. Für kritische Treffer wird außerdem der zweite
Genauigkeitsanteil im Erwartungswert berücksichtigt.

## Grenzen

- Vergleichsdistanz ist die PoB2-Standarddistanz von zwei Metern.
- Gegnerblocken ist noch nicht Teil dieser Kette.
- Bedingte Genauigkeit gegen bestimmte Gegnerzustände oder Waffenklassen
  bleibt ohne exakten strukturierten Wert wirkungslos.
- Ohne Level oder bekannte Klasse bleibt die Angriffstrefferchance
  fail-closed.
- Vollständige PoB2-Gesamt-DPS-Parität ist damit noch nicht erreicht.

## Nächster Rechenblock

Als nächstes folgt die systematische Support-Level-/Qualitätswirkung und
fertigkeitsspezifische Qualitätsformel. Danach werden noch fehlende
Projektile, Triggerketten, Miniongrundwerte und vollständige
Referenzbuild-Vergleiche geschlossen.
