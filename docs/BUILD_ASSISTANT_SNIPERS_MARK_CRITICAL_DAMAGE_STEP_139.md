# Schritt 139 – Scharfschützenmal im kritischen Erwartungsschaden

## Ziel

Der strukturierte Bonus von `Sniper's Mark` wird gegen das markierte Ziel in die bestehende Krit-Schadenskette eingebunden, ohne normale Treffer oder reinen Schaden über Zeit pauschal zu verstärken.

## Produktive Wirkung

- Die gepinnte PoB2-Referenz liefert `enemy_additional_critical_strike_multiplier_against_self` je Gemmenstufe.
- Stufe 20 liefert 77 zusätzlichen kritischen Schadensbonus.
- Normale Gemmenqualität wird über den gepinnten Wert von 0,75 pro Qualität und Abrundung gegen null berücksichtigt; 20 Qualität ergeben damit insgesamt 92.
- Nur ein im aktiven Waffenset gewähltes Scharfschützenmal wirkt.
- Mehrere gleichartige Markierungen werden deterministisch auf den stärksten belegten Wert reduziert.
- Der Wert erhöht nur die Schadenshöhe kritischer Treffer und damit deren gewichteten Erwartungsanteil.
- Nichtkritische Treffer, native DoT-Wirkungen und Treffergrundwerte bleiben unverändert.

## Wirkfenster und Grenzen

- Die Quelle belegt 8 Sekunden Wirkzeit und 0,5 Sekunden Wirkzeitbeginn durch das Wirken.
- Die Berechnung weist deshalb ein angenommenes aktives Wirkfenster aus, aber keine garantierte dauerhafte Uptime ohne Rotationsbeleg.
- Eine Markierung auf einem inaktiven Waffenset wirkt nicht.
- Es wird weder eine unbekannte Mark-Wirkung noch eine technische Identität aus sichtbarem Text erfunden.

## Versionen

- Schadensrechner: `3.53.0`
- Scharfschützenmal-Kritmodell: `1.0.0`
- Gepinnte PoB2-Schadensreferenz bleibt unverändert.

## Ergebnis

Kritische Builds können Scharfschützenmal jetzt reproduzierbar als zielgebundenen Krit-Schadensbaustein verwenden. Der Effekt kann weder fremde Waffensets noch nichtkritische Schadensanteile unbemerkt verstärken.

## Prüfung

- Fokussiert: 4 Dateien, 119 Tests erfolgreich.
- Gesamtlauf: 139 Dateien und 1.754 Tests erfolgreich; zwei zeitkritische Passivbaumdateien überschritten nur unter gemeinsamer Last das 5-Sekunden-Limit.
- Isolierter serieller Wiederholungslauf: 2 Dateien, 197 Tests erfolgreich.
- Typecheck, Lint, Produktions-Build und Pages-Build erfolgreich.
