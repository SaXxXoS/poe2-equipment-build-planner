# Schritt 143 – finale Angriffsgeschwindigkeit beim beidhändigen Führen

## Ziel

Dieser Schritt ergänzt die bisher fehlende finale Angriffsgeschwindigkeit von Fertigkeiten, die bei zwei kompatiblen Einhandwaffen beide Hände abwechselnd verwenden.

## Belegte Quelle

- PoB2-Pin: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Stat: `active_skill_attack_speed_+%_final_while_dual_wielding`
- PoB2-Abbildung: `Speed`, Typ `MORE`, Angriffsflag und Bedingung `DualWielding`
- PoB2-Offensivberechnung: Haupt- und Nebenhand werden getrennt berechnet; abwechselnde Angriffe verwenden den mittleren Handwert und die harmonische mittlere Waffengeschwindigkeit.

Die gepinnte Referenz enthält vier konstante Fälle:

- `Armour Breaker`: `+40 %` final
- `Earthshatter`: `-30 %` final
- `Molten Blast`: `-15 %` final
- `Volcanic Fissure`: `-30 %` final

## Berechnung

Bei zwei eindeutig aufgelösten, kompatiblen Einhandwaffen wird der Trefferwert beider Hände gemittelt. Die Grundaktionsrate ist das harmonische Mittel der beiden Waffengeschwindigkeiten. Danach wird der strukturierte finale Geschwindigkeitsfaktor multiplikativ angewandt (`1,40`, `0,70` oder `0,85`). Diese vier Fälle erhalten keinen erfundenen zweiten gleichzeitigen Treffer.

Die bereits in Schritt 142 modellierten Doppel-Treffer-Fertigkeiten behalten ihre getrennte Schadens- und Trefferregel. Falls eine Fertigkeit beide strukturierten Stats besäße, werden beide Regeln deterministisch kombiniert.

## Fail-closed

- Eine einzelne Waffe aktiviert die Regel nicht.
- Unaufgelöste, inkompatible oder nicht bestätigte Einhandwaffen werden blockiert.
- Ein bloßer Fertigkeitsname oder sichtbarer deutscher Text erzeugt keinen Faktor.
- Skills ohne den gepinnten Stat erhalten keinen Geschwindigkeitsbonus oder -malus.

## Versionen

- Schadensrechner: `3.57.0`
- Dual-Wield-Angriffsmodell: `1.1.0`

## Schlussfolgerung

Die vier belegten Geschwindigkeitsfälle verwenden jetzt beide Hände und den exakten finalen PoB2-Faktor. Das schließt eine weitere konkrete Paritätslücke, belegt aber noch keine vollständige Gleichwertigkeit mit Path of Building 2.
