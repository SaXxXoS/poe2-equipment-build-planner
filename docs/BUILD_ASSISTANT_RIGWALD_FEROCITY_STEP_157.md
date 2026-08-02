# Build-Assistent – Rigwalds Wildheit (Schritt 157)

## Ziel

Schritt 157 ergänzt die Schadensberechnung um die lokal gepinnte, ausdrücklich waffensetspezifische Wirkung von `Rigwald's Ferocity`. Der Support verändert denselben Angriff in Waffenset 1 und Waffenset 2 unterschiedlich.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Quelldatei: `src/Data/Skills/sup_dex.lua`
- Quellrecord: `SupportRigwaldsFerocityPlayer`
- Familie: `RigwaldLineage`
- Voraussetzung: `Attack`
- ausgeschlossen: `NoAttackOrCastTime`, `Instant`

## Strukturierte Wirkung

| Aktives Set | Angriffsgeschwindigkeit | Finaler Schaden | Kombinierter DPS-Faktor bei sonst identischer Grundlage |
| --- | ---: | ---: | ---: |
| Waffenset 1 | +30 % | −15 % | `1,30 × 0,85 = 1,105` |
| Waffenset 2 | −10 % | +30 % | `0,90 × 1,30 = 1,17` |

Die Faktoren werden nicht gegeneinander verrechnet oder auf beide Sets gleichzeitig angewandt. Der aktive Set-Kontext des Fertigkeitsaufbaus entscheidet, welche beiden gepinnten Werte gelten.

## Rechenmodell

- Der finale Schadensfaktor verändert Treffer und belegten nativen Schaden über Zeit der unterstützten Angriffsfertigkeit.
- Der Angriffsgeschwindigkeitsfaktor verändert die Aktionsrate vor einer gegebenenfalls vorhandenen Cooldown-Grenze.
- Zauber, sofortige Fertigkeiten und Fertigkeiten ohne normale Angriffs-/Wirkzeit werden fail-closed blockiert.
- Mehrere Gemmen derselben Supportfamilie werden fail-closed blockiert.
- Der Support wird aus der generischen Liste ungelöster Supports entfernt, sobald sein strukturiertes Modell angewandt oder fachlich blockiert wurde.

## Ergebnis

- Schadensrechner: `3.71.0`
- Rigwald-Modell: `1.0.0`
- Produktpins, Quellenfreigaben und Offline-Grenzen unverändert

## Grenzen

Das Modell berechnet exakt die vier gepinnten Supportwerte. Es entscheidet nicht selbst, wann der Spieler das Waffenset wechselt, und erzeugt keine unbelegte Wechsel-Uptime. Vollständige Path-of-Building-Gleichwertigkeit bleibt weiterhin nicht belegt.
