# Schritt 142 – beidhändige Angriffe mit beiden Waffen

## Ziel

Dieser Schritt schließt die strukturierte PoB2-Regel für Angriffe, die beim beidhändigen Führen einmal mit jeder Waffe treffen. Der Rechner verwendet nicht länger nur den ersten gefundenen Waffenplatz.

## Belegte Quelle

- PoB2-Pin: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Stat: `active_skill_damage_+%_final_while_dual_wielding`
- Wert der neun belegten Fertigkeiten: `-30`
- PoB2-Abbildung: 30 % weniger Schaden bei `DualWielding` und `doubleHitsWhenDualWielding = true`
- PoB2-Offensivberechnung: getrennte Haupt-/Nebenhandwerte, Mittelwert beider Hände, harmonische mittlere Waffengeschwindigkeit und zwei Treffer je Angriffssequenz

Betroffen sind `Boneshatter`, `Earthquake`, `Forge Hammer`, `Hammer of the Gods`, `Leap Slam`, `Perfect Strike`, `Rolling Slam`, `Stampede` und `Sunder`.

## Berechnung

Sind im aktiven Waffenset zwei kompatible, eindeutig aufgelöste Einhandwaffen ausgerüstet, berechnet die App beide Waffenschäden getrennt. Haupt- und Nebenhand werden gemittelt, je Hand mit dem strukturierten Faktor `0,7` multipliziert und als zwei Treffer derselben Sequenz ausgewiesen. Die Sequenzgeschwindigkeit verwendet das harmonische Mittel beider Waffengeschwindigkeiten.

Die linke Hand wird deterministisch als Hauptwaffe gewählt. Ein rechter Waffenplatz wird nur dann allein verwendet, wenn links keine Waffe belegt ist.

## Fail-closed-Verhalten

- Eine einzelne Waffe aktiviert die Dual-Wield-Regel nicht.
- Zwei nicht eindeutig aufgelöste Waffen erzeugen keinen geschätzten Nebenhandschaden.
- Zweihandwaffen und nicht als Einhandwaffe bestätigte Basen werden blockiert.
- Eine für die Fertigkeit inkompatible Hand wird blockiert.
- Fehlende Nebenhand-Endwerte werden nicht aus Namen, Affixen oder der anderen Hand erfunden.
- Die deutsche Anzeigeschicht und sichtbare Itemtexte sind keine technische Waffenquelle.

## Sichtbare Ausgabe

Die Ergebnisansicht erklärt bei angewandter Regel die Mittelung beider Hände, den 30-%-Malus je Hand, die harmonische Geschwindigkeit und beide Treffer. Ein blockierter Zustand wird mit seinem konkreten Grund sichtbar ausgewiesen.

## Versionen

- Schadensrechner: `3.56.0`
- Dual-Wield-Angriffsmodell: `1.0.0`

## Schlussfolgerung

Die neun lokal belegten Dual-Wield-Angriffe verwenden jetzt beide Waffen deterministisch und nach der gepinnten PoB2-Rechenkette. Andere beidhändige Sonderfälle bleiben ohne strukturierte Regel wirkungsneutral. Dies verbessert die Rechenparität, belegt aber noch keine vollständige Path-of-Building-Gleichwertigkeit.
