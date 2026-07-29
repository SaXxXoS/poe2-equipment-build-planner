# Schritt 68 – belegtes Wut-Schadensfenster

## Ergebnis

Angriffe mit einer bestätigten Wutgewinnkette erhalten jetzt zusätzlich zum
konservativen Dauerschadenswert ein getrenntes Voll-Wut-Vergleichsfenster.

Die App zeigt:

- den bestätigten maximalen Wutvorrat,
- den inhärenten Multiplikator von einem Prozent mehr Angriffsschaden je Wut,
- den vergleichbaren Treffer- beziehungsweise Sekundenschaden bei vollem
  bestätigtem Vorrat und
- soweit berechenbar die maximale Dauer ohne weitere Treffer oder Wutgewinne.

Der Voll-Wut-Wert ersetzt den normalen Schadenswert nicht. Ohne belegten
Wutgewinn bleibt der Vergleich blockiert und erzeugt keinen positiven Bonus.
Zauber erhalten den inhärenten Angriffsbonus nicht.

## Quellenkette

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- `src/Modules/ConfigOptions.lua`
  - inhärent `1% More Attack Damage` je Wut
- `src/Modules/CalcPerform.lua`
  - Wutwirkung wird als `MORE Damage` auf Angriffe angewandt
- bestätigter Maximalvorrat und natürliche Verlustdauer aus den Schritten 66
  und 67

Der Generator prüft den gepinnten Formelsatz fail-closed und speichert
Dateihash sowie reduzierten Faktor in der Schadensreferenz.

## Grenzen

- Ein aktueller Wutstand wird nicht erfunden.
- Der volle Vorrat ist ein ausdrücklich bezeichnetes Vergleichsszenario.
- Erhöhte oder vervielfachte Wutwirkung sowie die Umleitung auf Zauberschaden
  sind noch nicht allgemein modelliert.
- Trefferfolgen, mehrere Ziele und Wiederholungen verlängern das Fenster nur,
  wenn ihre Gewinnkette später vollständig belegt wird.

## Prüfung

- Schadensrechner: `3.10.0`
- Wutvergleichsmodell: `1.0.0`
- Schadensreferenzschema: `12`
- 73 fokussierte Tests erfolgreich
- Typecheck erfolgreich
- Referenzinhalt-Hash:
  `990d334f4072e1ad05b13789ea250ad41d9c790dc8fd9d6777f2b735b2d788ca`
