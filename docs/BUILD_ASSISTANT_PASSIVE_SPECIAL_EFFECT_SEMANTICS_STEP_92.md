# Schritt 92 – Spezialeffekt-Semantik im Passivbaum

## Ziel

Weitere klar benannte Mechanikfamilien aus dem gepinnten offiziellen
PoE2-Passivbaum werden deterministisch getrennt. Gleichzeitig wird eine
Pluralform-Lücke der Markup-Normalisierung geschlossen.

## Neue Mechanikfamilien

- Gem Quality
- Jagged Ground
- Parry
- Culling Strike
- Seal
- Withered
- Darkness

Die Regeln arbeiten ausschließlich auf den englischen Originaltexten des
gepinnten Baums. Es gibt kein Fuzzy Matching und keine Klassifikation aus
deutschen Anzeigetexten.

## Korrektur sichtbarer Markup-Formen

Das offizielle Format `[Begriff|sichtbarer Text]` wird auf den sichtbaren Text
normalisiert. Dadurch entstehen beispielsweise `Curses` und `Ignites`.
Diese belegten Pluralformen werden nun ausdrücklich von den vorhandenen
Curse- beziehungsweise Ailment-Regeln erfasst.

## Fail-closed-Wirkung

Die neuen Tags besitzen keine frei angenommenen Profilfelder. Sie lösen daher
ohne eine separate belegte Wirkungsregel keinen profilbezogenen Schadens- oder
Ressourcenbonus aus. Die allgemeine Utility- und Datenqualitätsbewertung des
bestehenden Klassifikators bleibt davon unberührt. Insbesondere werden:

- Quality nicht pauschal in mehr Gemmenschaden umgerechnet,
- Culling Strike nicht ohne Gegnerzustand als DPS angenommen,
- Darkness nicht wie Mana oder Spirit behandelt,
- Parry nicht als allgemeiner Angriffsschaden interpretiert,
- Withered nicht ohne Chaos- und Zustandskette verrechnet.

## Gemessene Coverage

Offizieller Baum, Release `0.5.2`:

- Knoten: 5.150
- Statzeilen: 5.962
- klassifiziert vorher: 5.731
- klassifiziert nachher: 5.781
- ungelöst vorher: 231
- ungelöst nachher: 181
- Coverage vorher: 96,13 %
- Coverage nachher: 96,96 %
- zusätzlich aufgelöst: 50 Statzeilen

## Verifikation

- Klassifikatorversion: `1.5.0`
- 96 fokussierte Tests bestanden
- vollständiger offizieller Baum im Coverage-Lauf verarbeitet
- keine Klassifikation aus deutschen Anzeigetexten
- keine frei ergänzten technischen IDs
- keine neue Netzwerk- oder Runtime-Abhängigkeit

## Verbleibende Grenzen

Zu den häufigeren noch ungelösten Familien gehören Light Radius, Corpse
Consumption, Bolt Speed, Banner, Deflection und Decimating Strike. Die
Kategorisierung einer Mechanik beweist außerdem noch keine vollständige
numerische Wirkungsformel. Vollständige Path-of-Building-2-Gleichwertigkeit
bleibt unbewiesen.
