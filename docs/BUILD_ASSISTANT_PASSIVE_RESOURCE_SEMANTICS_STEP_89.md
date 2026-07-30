# Schritt 89 – Ressourcen- und Gegenstandssemantik im Passivbaum

## Ergebnis

Der offizielle Passivbaum erkennt jetzt zehn weitere PoE2-spezifische
Mechanikfamilien getrennt:

- Meta-Fertigkeiten und deren Energie,
- Glory,
- Hazards,
- Rage,
- allgemeine Debuffs,
- Remnants,
- Charms,
- Crossbows,
- Electrocute,
- Flasks.

## Gemessene Coverage

Die deterministische Messung über alle 5.150 offiziellen Knoten und 5.962
Statzeilen änderte sich wie folgt:

- Klassifikationscoverage: 89,06 % → 92,64 %
- klassifizierte Statzeilen: 5.310 → 5.523
- ungelöste Statzeilen: 652 → 439

Damit wurden weitere 213 offizielle Statzeilen klassifiziert.

## Sicherheitsgrenze

Die neuen Tags beschreiben ausschließlich die im englischen Quelltext
belegte Mechanik. Solange das BuildProfile keine passend belegte Zielgröße
enthält, erzeugen sie keinen Schadenstyp-, Waffen- oder sonstigen
Rankingbonus. Beispielsweise wird ein Crossbow-Reload-Knoten nicht allein
wegen des Wortes `Crossbow` für jeden Angriff positiv bewertet.

## Version

- Passivklassifikator: `1.2.0`

## Verifikation

- zehn gezielte Regeltests,
- vollständige Klassifikation aller 5.150 Knoten,
- deterministische Coverage-Messung,
- wiederverwendete Token-Regulärausdrücke statt erneuter Kompilierung je
  Statzeile; die fokussierte Klassifikationsmessung sank von 2.227 ms auf
  1.561 ms,
- TypeScript-Prüfung.
