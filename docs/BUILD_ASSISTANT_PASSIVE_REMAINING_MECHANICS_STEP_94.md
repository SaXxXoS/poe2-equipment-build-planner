# Schritt 94 – weitere offizielle Passivmechaniken

## Ziel

Weitere klar benannte Mechanikfamilien des gepinnten offiziellen
Passivbaums werden getrennt klassifiziert. Die Klassifikation darf ohne
belegte Wirkungsformel keinen freien Schadens-, Elementar- oder
Profilbonus erzeugen.

## Ergänzte Mechanikfamilien

- Leichenverbrauch (`corpse`)
- Bolzen (`bolt`)
- Banner (`banner`)
- Leben bei Tötung (`life-on-kill`)
- zusätzlich gleichzeitig wirkende Gifte (`poison-limit`)
- Deflection (`deflection`)
- Decimating Strike (`decimating-strike`)
- Maim (`maim`)

Die Tags beschreiben nur die belegte Mechanik der englischen Originalzeile.
Sie behaupten keine technische GGG-Stat-ID und ersetzen keine numerische
Wirkungsformel.

## Wirkungsrichtung

`-5% to amount of Damage Prevented by Deflection` wird als negative
Deflection-Wirkung erkannt. Positive Deflection-Zeilen bleiben davon
getrennt. Die Erkennung ist auf die belegte Form begrenzt.

## Gemessene Coverage

Offizieller Baum, Release `0.5.2`:

- Knoten: 5.150
- Statzeilen: 5.962
- klassifiziert vorher: 5.786
- klassifiziert nachher: 5.819
- ungelöst vorher: 176
- ungelöst nachher: 143
- Coverage vorher: 97,05 %
- Coverage nachher: 97,60 %

Damit wurden 33 weitere offizielle Statzeilen klassifiziert. Unbekannte
Mechaniken bleiben weiterhin ungelöst.

## Verifikation und Grenzen

- Klassifikatorversion: `1.7.0`
- Analyzerversion: `1.1.0`
- 108 fokussierte Tests bestanden
- vollständiger 5.150-Knoten-Baum verarbeitet
- keine deutsche Anzeige als technische Quelle
- kein Fuzzy Matching
- keine neue Runtime- oder Netzwerkabhängigkeit

Die neuen Mechanikfamilien sind semantisch auffindbar, aber nur dann
quantitativ rankbar, wenn eine getrennt belegte Wirkungsregel vorhanden ist.
Vollständige Path-of-Building-2-Gleichwertigkeit ist weiterhin nicht belegt.
