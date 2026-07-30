# Schritt 88 – PoE2-spezifische Passivsemantik

## Ergebnis

Der offizielle Passivbaum erkennt jetzt sechs zuvor ungelöste
PoE2-Mechanikfamilien als getrennte Semantik:

- Stun Buildup,
- Daze,
- Pin und Pinned,
- Slow und Slowing,
- Warcry,
- Grenade.

Zusätzlich wird der Plural `Ailments` von der vorhandenen
Beeinträchtigungsregel erfasst.

## Gemessene Coverage

Die deterministische Messung über alle 5.150 offiziellen Knoten und 5.962
Statzeilen änderte sich wie folgt:

- Klassifikationscoverage: 85,32 % → 89,06 %
- klassifizierte Statzeilen: 5.087 → 5.310
- ungelöste Statzeilen: 875 → 652

Damit wurden 223 weitere offizielle Statzeilen klassifiziert.

## Sicherheitsgrenze

Die neuen Tags beschreiben die belegte Mechanik, erhalten aber ohne ein
entsprechendes Feld im BuildProfile keinen erfundenen Schadensbonus.
Insbesondere werden Kontrollaufbau, Warcry-Tempo und Grenadenschaden nicht
pauschal einer Elementarschadensart zugeordnet.

## Version

- Passivklassifikator: `1.1.0`

## Verifikation

- sieben gezielte Regeltests,
- vollständige Klassifikation aller 5.150 Knoten,
- deterministische Coverage-Messung,
- TypeScript-Prüfung.

