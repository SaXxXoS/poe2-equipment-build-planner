# Schritt 70 – Wutwirkung und Schadensziel

## Ergebnis

Die Schadenskette bildet nun die gepinnte PoB2-Reihenfolge für Wut ab:

1. bestätigten maximalen Wutvorrat bestimmen,
2. erhöhte, verringerte, mehr und weniger Wutwirkung verrechnen,
3. das Ergebnis wie PoB2 abrunden,
4. einen exakten Override wie `No Rage effect` anwenden,
5. den inhärenten Mehr-Schaden nur auf die belegte Zielart anwenden.

Ohne Umleitung gilt die Wirkung für Angriffe. Die exakt belegbare Regel
`Rage grants Spell Damage instead of Attack Damage` leitet sie auf Zauber
um. Die entsprechende Geschwindigkeitsumleitung wird in der Ressourcenkette
transportiert, aber erst dann quantitativ auf die Aktionsrate angewandt, wenn
der gepinnte saisonale Grundwert der inhärenten Angriffsgeschwindigkeit
vollständig belegt ist.

## Quellenbeleg

- gepinnter PoB2-Commit:
  `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- `src/Modules/CalcPerform.lua`: Berechnung von `RageEffect` und Anwendung
  auf Angriff beziehungsweise Zauber
- `src/Modules/ModParser.lua`: exakte Parserregeln für doppelte, dreifache
  und aufgehobene Wutwirkung sowie Schadens- und Geschwindigkeitsumleitung

## Fail-closed-Grenzen

- Kein positiver Wutbonus ohne belegte Wutgewinnkette.
- Kein voller Wutstand ohne belegte Anlauf- beziehungsweise Vorratskette.
- Keine Anwendung auf Zauber ohne exakte Umleitungsregel.
- Bedingte oder freie Textähnlichkeiten erzeugen keine Wirkung.

## Version und Prüfung

- Ressourcenmodell: `18.0.0`
- Schadensrechner: `3.11.0`
- Wutvergleich: `2.0.0`
- 77 fokussierte Tests erfolgreich
- Typecheck erfolgreich
