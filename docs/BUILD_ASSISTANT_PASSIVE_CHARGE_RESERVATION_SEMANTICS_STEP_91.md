# Schritt 91 – Projektil-, Ladungs- und Reservierungssemantik

## Ziel

Weitere häufige Originaltexte des offiziellen PoE2-Passivbaums werden
deterministisch klassifiziert. Gleich benannte, aber fachlich verschiedene
Ladungsarten bleiben getrennt.

## Neue Mechanikfamilien

- Pierce
- Immobilisation
- Combo
- Endurance Charge
- Frenzy Charge
- Power Charge
- Reservation
- Herald
- Quiver
- Passive Skill Point

## Ladungstrennung

Endurance-, Frenzy- und Power-Charges werden über ihre vollständigen
Originalphrasen erkannt. Das Wort `Charges` allein ist absichtlich keine
Kampf-Ladungsregel: Flask- und Charm-Charges werden dadurch nicht als
Endurance-, Frenzy- oder Power-Charge klassifiziert.

## Fail-closed-Wirkung

Die neuen Tags besitzen noch keine frei angenommenen Profilfelder. Daher
erzeugt beispielsweise ein Quiver-, Herald- oder Combo-Text ohne dazu
passende belegte Wirkungsregel keinen positiven Schaden. Reservation wird als
Ressourcenfamilie erkannt, aber nicht pauschal als mehr verfügbarer Spirit
interpretiert.

## Gemessene Coverage

Offizieller Baum, Release `0.5.2`:

- Knoten: 5.150
- Statzeilen: 5.962
- klassifiziert vorher: 5.637
- klassifiziert nachher: 5.731
- ungelöst vorher: 325
- ungelöst nachher: 231
- Coverage vorher: 94,55 %
- Coverage nachher: 96,13 %
- zusätzlich aufgelöst: 94 Statzeilen

## Verifikation

- Klassifikatorversion: `1.4.0`
- 88 fokussierte Tests bestanden
- Typecheck bestanden
- keine Klassifikation aus deutschen Anzeigetexten
- keine Vermischung von Flask-/Charm-Charges mit Kampf-Ladungen

## Verbleibende Grenzen

Zu den häufigeren ungelösten Familien gehören Quality, Jagged Ground, Parry,
Culling Strike, schneller wirkende Ignites, Seal und Darkness. Vollständige
Path-of-Building-2-Gleichwertigkeit bleibt unbewiesen.
