# Schritt 93 – Wirkungsrichtung im Passivbaum

## Ziel

Positive und negative Passivwirkungen werden nicht länger über einzelne
Schlüsselwörter wie `reduced`, `taken`, `cost` oder `cannot` gleichgesetzt.
Die Bewertung berücksichtigt den belegten Kontext der englischen
Originalzeile.

## Korrigierte Fälle

- `10% reduced Damage` ist ein negativer eigener Schadenseffekt.
- `10% reduced Mana Cost of Skills` ist eine positive Ressourcenwirkung.
- `15% reduced Effect of Curses on you` ist eine positive Schutzwirkung.
- `Take 30% less Damage` ist eine positive Schutzwirkung.
- `50% reduced effect of Archon Buffs on you` ist ein negativer Buffeffekt.
- `You cannot Regenerate Mana` ist eine negative Einschränkung.

`Damage taken` wird nicht allein wegen des Wortes `Damage` als offensiver
Schadensbonus klassifiziert.

## Bewertungsmodell

Jede klassifizierte Statzeile besitzt jetzt genau eine Wirkungsrichtung:

- `positive`
- `negative`
- `mixed`
- `unknown`

Die Auswertung bestimmt die Richtung je Regel aus den tatsächlich passenden
Statzeilen. Negative Vorkommen erzeugen keinen positiven Kategorie- oder
Profilscore, werden als verlorene Mechanik und Konflikt geführt und senken
bereits vorhandene positive Wirkung derselben Kategorie. Gemischte Zeilen
werden konservativ behandelt.

## Gemessene Coverage

Offizieller Baum, Release `0.5.2`:

- Knoten: 5.150
- Statzeilen: 5.962
- klassifiziert vorher: 5.781
- klassifiziert nachher: 5.786
- ungelöst vorher: 181
- ungelöst nachher: 176
- Coverage vorher: 96,96 %
- Coverage nachher: 97,05 %

Die fünf zusätzlich klassifizierten Zeilen stammen aus eindeutigem
`reduced Damage`. Der Coveragegewinn ist nicht das Hauptziel dieses Schritts;
entscheidend ist die korrigierte Rangrichtung.

## Verifikation und Grenzen

- Klassifikatorversion: `1.6.0`
- Analyzerversion: `1.1.0`
- 98 fokussierte Tests bestanden
- vollständiger 5.150-Knoten-Baum verarbeitet
- keine deutsche Anzeige als technische Quelle
- kein Fuzzy Matching
- keine neue Runtime- oder Netzwerkabhängigkeit

Die Kontextregeln decken nur belegte Formfamilien ab. Komplexe mehrzeilige
Keystones können weiterhin `mixed` oder unbekannt bleiben. Eine klassifizierte
Wirkungsrichtung ersetzt keine vollständige numerische Path-of-Building-
Formel. Vollständige Gleichwertigkeit ist weiterhin nicht belegt.
