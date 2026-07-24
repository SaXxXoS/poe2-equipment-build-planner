# Schadensberechnung V1

Die App besitzt einen ersten deterministischen numerischen Rechenkern. Für unterstützte Trefferfertigkeiten zeigt er Schaden pro Treffer, Aktionen pro Sekunde und den daraus abgeleiteten Trefferschaden pro Sekunde. Das ist ein transparenter Teilwert, keine vollständige Path-of-Building-Gesamt-DPS.

## Quelle und Pin

Die Buildzeit-Referenz stammt aus `PathOfBuildingCommunity/PathOfBuilding-PoE2` am unveränderten Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`. Verwendet werden nur `src/Data/Skills/act_str.lua`, `act_dex.lua`, `act_int.lua` und numerische Waffenbasen aus `src/Data/Bases/*.lua`. Der Offline-Generator erzeugt `generated/pob2/damage-reference.json`; zur Laufzeit werden weder Lua noch Netzwerkquellen geladen.

Der Scope `poe2-pob2-damage-calculation-reference` ist eine ausdrückliche Projektentscheidung mit offengelegter Rechteunsicherheit. Keine PoB2- oder GGG-Genehmigung und keine technische GGG-ID-Kette werden behauptet.

## Rechenumfang

Zauber verwenden strukturierte Basis-Schadensbereiche und die Basis-Zauberzeit. Angriffe verwenden Waffenbasis, lokale flache Schadenswerte, lokalen physischen Prozentwert, Skill-Angriffsmultiplikator und Basis-Angriffsgeschwindigkeit. Sicher erkannte globale Schadens- und Geschwindigkeitswerte aus eingegebenen Affixwerten werden additiv berücksichtigt.

Noch nicht enthalten: kritische Treffer, Gegnerwiderstände und Rüstung, numerische Supporteffekte, numerische Passive- und Aszendenzwerte, Ailments und DoT, Minions, Mehrfachtreffer, Projektilanzahl, bedingte Effekte und vollständige Unique-Wirkungen. Fehlt eine eindeutige Fertigkeits- oder Waffenbasiszuordnung, zeigt die App `nicht verfügbar`.

Zwei Werte sind nur sinnvoll vergleichbar, wenn Fertigkeit, Gemmenstufe und ausgeschlossene Mechaniken gleich sind. Der nächste Ausbau muss Supports, Baum-/Aszendenzstats und Gegnerprofile numerisch integrieren.
