# Build-Assistent – zusätzliche Cooldown-Nutzungen (Schritt 55)

## Ergebnis

Der Schadenspfad berücksichtigt zusätzliche Nutzungen einer Fertigkeit jetzt
aus lokal gepinnten, technisch eindeutigen Quellen:

- Ausrüstung: `grenade_skill_cooldown_count_+`
- Passivbaum: Knoten `58714` (`Grenadier`) mit
  `[Grenade] Skills have +1 Cooldown Use`

Die Wirkung ist strikt auf Fertigkeiten mit dem strukturierten Skilltyp
`Grenade` begrenzt.

## Waffenset-Trennung

Für die Berechnung eines Setups werden nur Waffenmodifikatoren des aktiven
Waffensets gelesen. Der Passiveffekt wird aus dem für dasselbe Set geplanten
Knotenbestand gelesen. Ein Bonus aus Set 1 kann daher nicht unbemerkt in die
Berechnung von Set 2 gelangen.

## Rechenregel

Zusätzliche Nutzungen erhöhen den kurzfristig verfügbaren Vorrat:

`Gesamtnutzungen = Basisnutzungen + zusätzliche Nutzungen`

Sie erhöhen nicht die nachhaltige Wiederaufladerate. Die nachhaltige Rate
bleibt:

`1 / effektive Abklingzeit`

Wie in der gepinnten PoB2-Referenz wird eine Abklingzeit bei mehreren
gespeicherten oder zusätzlichen Nutzungen nicht auf den nächsten
33-Millisekunden-Server-Takt aufgerundet.

## Fail-closed-Grenzen

- Andere Fertigkeitstypen erhalten keinen Grenade-Bonus.
- Sichtbarer Text ohne den belegten Passivknoten oder die technische Stat-ID
  erzeugt keinen Bonus.
- Ein Bonus aus dem inaktiven Waffenset wird nicht verwendet.
- Gespeicherte Nutzungen werden nicht als dauerhafter DPS-Multiplikator
  behandelt.

## Prüfung

Fokussierte Tests decken ab:

- Ausrüstung und Passivknoten werden addiert.
- Das inaktive Waffenset bleibt ausgeschlossen.
- Nicht-Grenade-Skills bleiben unverändert.
- Der Vorrat steigt, die nachhaltige Cooldown-Rate jedoch nicht.
