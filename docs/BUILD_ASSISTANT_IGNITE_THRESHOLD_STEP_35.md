# Schritt 35: Gegnerabhängige Entzünden-Kette

## Ergebnis

Die Schadensschätzung berechnet Entzünden nun ausschließlich dann, wenn
Feuerschaden, Wirkfrequenz, Trefferchance und Gegnerlevel vollständig
vorliegen. Ohne diese Kette bleibt der Effekt blockiert.

## Gepinnte PoB2-Grundlagen

- `src/Data/Misc.lua`
- `monsterAilmentThresholdTable`
- `IgniteChanceMultiplier = 20`
- `IgniteHitDamagePercentPerMinute = 1200`
- `BaseIgniteDuration = 4`
- Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`

Der Buildzeitgenerator speichert die 100 levelabhängigen Schwellenwerte und
die drei Konstanten in der reduzierten Schadensreferenz. Zur Laufzeit wird
weder Lua geladen noch ein Netzwerkzugriff durchgeführt.

## Rechenweg

1. Feuerschaden des Treffers bestimmen.
2. Gegnerschwelle anhand des Vergleichsgegnerlevels wählen.
3. Entzündungschance mit dem gepinnten PoB2-Multiplikator bestimmen.
4. Chance-, Dauer- und Effektmodifikatoren anwenden.
5. Erwartete aktive Einzelentzündung aus Wirkfrequenz und Trefferchance
   bestimmen.
6. DPS und Gesamtschaden pro Anwendung getrennt ausgeben.

## Bewusste Grenze

Kritische Ailment-Sonderfälle, alternative Schadensarten, besondere
Stapelregeln, gegnerische DoT-Widerstände und bedingte `as though dealing`-
Effekte bleiben ausgeschlossen, bis ihre vollständige Identitäts- und
Anwendungskette implementiert ist.
