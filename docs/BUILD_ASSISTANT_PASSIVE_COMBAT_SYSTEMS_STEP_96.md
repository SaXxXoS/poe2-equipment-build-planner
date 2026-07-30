# Schritt 96 – regelrelevante Passivsysteme

## Ziel

Der offizielle Passivbaum enthält weitere eigenständige Mechaniken, die nicht
als allgemeiner Schaden oder als erfundene technische Wirkung behandelt
werden dürfen. Schritt 96 klassifiziert diese Familien reproduzierbar und
fail-closed.

## Ergänzte Familien

- Reveal Weakness
- Sinister Jewel Socket
- Strike
- Splash Damage
- Dodge Roll
- zusätzlicher Ring-Slot
- Aftershock
- Effekt von Boni gesockelter Juwelen
- Slam
- Shapeshift
- Surrounded

Die Regeln arbeiten ausschließlich auf den englischen Originalzeilen des
gepinnten Baums. Zusammengesetzte Zeilen behalten mehrere getrennte Tags:
Eine Shapeshift-Slam-Zeile mit zusätzlichem Aftershock wird beispielsweise
als `shapeshift`, `slam` und `aftershock` erfasst.

## Spezialknoten

Regeln dürfen nun auch belegte Stattexte an Klassenstarts,
Aszendenzstarts und Juwelsockeln klassifizieren. Das verändert ihre
Eligibility nicht:

- Klassen- und Aszendenzstarts bleiben gesperrt.
- Juwelsockel bleiben ausschließlich Sockelziele.
- Eine Klassifikation erzeugt keine freie Punktevergabe.

## Fail-closed-Grenze

Die neuen Tags besitzen keine erfundenen:

- Elementarschadensarten,
- Attributanforderungen,
- DPS-Multiplikatoren,
- Trefferwahrscheinlichkeiten oder
- globalen Rankingboni.

Die Klassifikation macht die Mechanik auffindbar. Eine quantitative Wirkung
darf erst ein späteres, belegtes Wirkungsmodell hinzufügen.

## Gemessene Coverage

- Release: `0.5.2`
- Knoten: 5.150
- Statzeilen: 5.962
- klassifiziert vorher: 5.833
- klassifiziert nachher: 5.852
- ungelöst vorher: 129
- ungelöst nachher: 110
- Coverage: 97,84 % → 98,15 %
- Klassifikator: `1.9.0`
- Analyzer: `1.1.0`

Vollständige Path-of-Building-2-Gleichwertigkeit ist dadurch nicht belegt.
Die 110 verbleibenden Statzeilen sowie quantitative Wechselwirkungen bleiben
offene, messbare Arbeit.
