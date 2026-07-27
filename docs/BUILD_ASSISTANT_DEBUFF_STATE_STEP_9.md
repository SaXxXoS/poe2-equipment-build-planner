# Automatisches Debuff- und Rüstungsbruchmodell – Schritt 9

## Ziel

Zeit- und Zielzustände der bereits belegten Gegnerwirkungen werden ohne
zusätzliche Nutzereingaben nachvollziehbar modelliert.

## Automatische Zielklasse

Das vorhandene Zielprofil bestimmt die Vergleichsklasse:

- `Mapping` verwendet einen seltenen Gegner als aussagekräftigen
  Grundvergleich.
- `Boss` verwendet einen einzigartigen Gegner im anhaltenden Kampf.
- `Allround` verwendet einen seltenen neutralen Vergleich.

Die Widerstandsgrundwerte bleiben null, solange keine gepinnte
Zieldefinition andere Werte belegt.

## Flüche

Elemental Weakness und Despair führen ihre strukturierte Wirkzeit von
7,4 Sekunden. Die Fluchwirkung wird automatisch entsprechend der
Zielseltenheit behandelt:

- normal: volle Wirkung,
- magisch: 15 Prozent weniger Wirkung,
- selten: 30 Prozent weniger Wirkung,
- einzigartig: 50 Prozent weniger Wirkung.

Wegen des normalen Fluchlimits wird höchstens ein für die verursachten
Schadensarten relevanter Fluch angesetzt. Die Berechnung nimmt an, dass der
im Build ausgewählte Fluch während seines Wirkfensters angewandt wurde.

## Rüstungsbruch

Rüstungsbruch hält gegen Monster 12 Sekunden. Ein strukturierter Betrag pro
Treffer wird gegen normale Gegner verdreifacht und gegen magische Gegner
verdoppelt. Bei bekannter Zielrüstung berechnet die App deterministisch,
wie viele Treffer innerhalb der Wirkzeit für vollständig gebrochene Rüstung
benötigt werden.

Reicht ein belegter Treffer bereits aus, gilt für den Vergleichszustand:

- gegnerische Rüstung ist vollständig gebrochen,
- physische Treffer verursachen 20 Prozent mehr Schaden.

Benötigt der Aufbau mehrere Treffer, wird der Effekt sichtbar als
`wird aufgebaut` markiert. Ohne bekannte Zielrüstung werden weder benötigte
Treffer noch vollständig gebrochene Rüstung erfunden.

## Exposition und bedingte Zustände

Frost Bomb besitzt im lokalen Pin eine Gegnerstufengrenze, aber keinen
eindeutigen numerischen Expositionsbetrag. Daher entsteht weiterhin kein
erfundener Bonus. Bedingte Durchdringung wird erst aktiv, wenn der
zugehörige Zustand im Buildmodell technisch belegt ist.

## Grenzen

Das Modell simuliert noch keine sekundengenaue Rotation, Trefferfolge,
Abklingzeit oder Debuff-Uptime. Es vergleicht belegte Zustände. Individuelle
Bossabwehr und Kartenmodifikatoren bleiben unbekannt, solange keine
versionierte Zieldefinition vorliegt.

## Nächster Schritt

Strukturierte Zustandsaktivierung aus der Rotation: Buff- und Debuff-Uptime,
bedingte Durchdringung, Exposition mit belegtem Betrag sowie konsumierte
Payoff-Zustände.
