# Schritt 115 – Leben und Charakter-Schwellenwerte

## Ergebnis

Die Schadensschätzung transportiert jetzt ein eigenes, waffensetspezifisches Charakter-Überlebensmodell. Es berechnet die lokal exakt belegbaren Teile von maximalem Leben, Betäubungsschwelle und elementarer Beeinträchtigungsschwelle.

## Belegte Formeln

- Grund-Leben: `12 × (Charakterlevel + 16)` aus dem gepinnten PoB2-Referenzartefakt.
- Stärke: `2 Leben je Stärkepunkt` gemäß `CalcPerform.lua`.
- Betäubungsschwelle: standardmäßig maximales Leben gemäß `CalcDefence.lua`.
- Beeinträchtigungsschwelle: standardmäßig 50 % des maximalen Lebens gemäß `CalcSetup.lua`.
- Exakte Baumformen: `+1 Leben je 4 Geschicklichkeit`, `+1 Betäubungsschwelle je Geschicklichkeit`, `+3 Betäubungsschwelle je Stärke` und `+4 Beeinträchtigungsschwelle je Geschicklichkeit`.

Die Rechnung enthält außerdem technisch zugeordnete flache Lebens- und Schwellenwerte sowie unbedingte erhöhte, verringerte, mehr und weniger Wirkungen. Jede Komponente bleibt in der Ausgabe getrennt nachvollziehbar.

## Fail-closed-Grenzen

Bedingte Wirkungen, alternative Schwellenbasen, Chaos Inoculation, Attributersatzregeln, halbierte oder verdoppelte inhärente Attributboni und laufzeitzustandsabhängige Schwellen werden nicht geraten. Sobald eine solche zugeteilte Zeile erkannt wird, bleibt sie in `blockedLines` sichtbar und der Status wird auf `partial-blocked-special-cases` gesetzt.

## Integration

`estimateHitDamage` liefert das Modell als `characterSurvivabilityModel` auch dann aus, wenn für die gewählte Fertigkeit noch kein vollständiger Trefferschaden berechnet werden kann.

## Grenzen und nÃ¤chster Schritt

Die Implementierung ist kein vollständiger Path-of-Building-Nachbau. Als Nächstes müssen die belegbaren alternativen Schwellenbasen und inhärenten Attribut-Sonderregeln als explizite, gegenseitig ausschließende Zustände modelliert werden. Unbekannte Bedingungen bleiben blockiert.
