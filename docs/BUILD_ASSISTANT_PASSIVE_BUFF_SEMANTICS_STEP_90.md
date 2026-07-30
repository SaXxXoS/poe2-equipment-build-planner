# Schritt 90 – Buff-, Kontroll- und Konstruktionsemantik im Passivbaum

## Ziel

Die noch häufigen offiziellen PoE2-Statzeilen zu Buffs, kontrollierenden
Effekten und eigenständigen Konstruktionen sollen erkannt werden, ohne aus
einem Schlüsselwort einen nicht belegten Schadens- oder Buildbonus abzuleiten.

## Belegte Mechanikfamilien

Der Klassifikator unterscheidet nun zusätzlich:

- Buff
- Puppet Master
- Command
- Ballista
- Arcane Surge
- Thorns
- Knockback
- Volatility
- Blind
- Exposure
- Archon

Die Regeln arbeiten ausschließlich auf normalisiertem englischem Originaltext
des gepinnten offiziellen Baums. Es gibt kein Fuzzy Matching und keine
Klassifikation aus deutschen Anzeigetexten.

## Fail-closed-Grenze

Die neuen Tags besitzen zunächst keine freien `BuildProfile`-Felder. Daher
werden Zeilen wie „15% increased Ballista damage“ oder „10% increased
Exposure Effect“ fachlich erkannt, erzeugen aber ohne eine passende belegte
Buildmechanik keinen positiven Elementar-, Waffen- oder Schadensscore.

Das ist absichtlich strenger als eine Stichwortheuristik. Die Tags bilden die
Grundlage für spätere getrennte Wirkungsmodelle und verhindern zugleich, dass
beispielsweise „Buff“ pauschal als eigener Schadensmultiplikator behandelt
wird.

## Gemessene Coverage

Vollständiger offizieller Baum des gepinnten Release `0.5.2`:

- Knoten: 5.150
- Statzeilen: 5.962
- klassifiziert vorher: 5.523
- klassifiziert nachher: 5.637
- ungelöst vorher: 439
- ungelöst nachher: 325
- Coverage vorher: 92,64 %
- Coverage nachher: 94,55 %
- zusätzlich fachlich aufgelöst: 114 Statzeilen

## Determinismus und Performance

- Klassifikatorversion: `1.3.0`
- fokussierter Lauf: 77 Tests bestanden
- Klassifikation aller 5.150 Knoten: 2.632 ms im dokumentierten Windows-Lauf
- zehn vollständige Profilbewertungen: 19.752 ms
- Zeitstempel und Laufzeitwerte beeinflussen keine fachliche Ausgabe

Die Laufzeitmessung ist ein lokaler Messwert und kein Produktgrenzwert.

## Verbleibende Grenzen

Die häufigsten ungelösten Familien umfassen nun unter anderem Pierce,
Immobilisation, Ladungs-Sonderfälle, Combo, Reservation, Herald und Quiver.
Sie werden nicht geschätzt. Vollständige rechnerische Gleichwertigkeit mit
Path of Building 2 ist durch diesen Schritt nicht belegt.
