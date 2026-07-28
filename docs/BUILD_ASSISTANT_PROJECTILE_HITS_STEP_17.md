# Build-Assistent – Schritt 17: Projektile und Mehrfachtreffer

## Ziel

Schritt 17 trennt belegte Projektil- und Zielabdeckungswerte von tatsächlich
belegtem Einzelzielschaden. Die App darf mehrere Projektile, Chain, Pierce,
Fork oder Rückkehr nicht pauschal als DPS-Multiplikator behandeln.

## Ausgangsstand

- Ausgangscommit: `bd3e2abe539985b6f79210c2c5a10bb1c8f84300`
- numerische Quelle: vorhandener, gepinnter
  `generated/pob2/damage-reference.json`
- keine neue Quelle, kein Netzwerk und keine Änderung eines Datenpins
- vorhandene Trefferschaden-, Gegnerabwehr-, Zeitfenster- und DoT-Modelle
  bleiben erhalten

## Quelleninventar

Der gepinnte Referenzbestand enthält 337 numerisch referenzierte
Fertigkeiten. Davon tragen 85 strukturierte Projektilmerkmale.

Direkt verwendbare Zahlenfelder:

- `base_number_of_projectiles`: Ice Fragments 4, Rain of Arrows 39, Spark 9
- `number_of_chains`: Arc 9, Orb of Storms 5, Rolling Magma 5,
  His Scattering Calamity 4
- `projectile_base_number_of_targets_to_pierce`: Fragmentation Rounds 4,
  Permafrost Bolts 4
- `tornado_shot_number_of_hits_allowed`: Tornado Shot, Obergrenze 8

## Modell

Modellversion: `1.0.0`

### Boss

Der Einzelziel-Treffermultiplikator bleibt bei `1`, solange keine vollständige
strukturierte Kette belegt, dass mehrere Projektile oder Wiederkontakte
dasselbe Ziel treffen.

### Mapping

Für die Anzeige der möglichen Zielabdeckung wird deterministisch gerechnet:

`Projektile pro Aktion × (1 + Chains + Pierce)`

Der Wert ist ausschließlich eine theoretische Kontaktobergrenze für
verschiedene Ziele. Er ist kein DPS-Wert und verändert den Trefferschaden
nicht.

## Fail-closed-Regeln

- Projektilanzahl ist keine automatische Einzelziel-Trefferzahl.
- Chain und Pierce erhöhen nur mögliche Zielkontakte.
- Eine Trefferobergrenze ist keine garantierte Trefferzahl.
- Fork bleibt ohne strukturierte Anzahl und Zielregel ausgeschlossen.
- Rückkehr bleibt ohne eindeutige Wiederkontaktregel ausgeschlossen.
- Freie Textähnlichkeit erzeugt keine Projektilmechanik.
- Es wird keine situationsabhängige Bossgröße oder Projektilüberlappung
  angenommen.

## Ausgabe

Die Ergebnisansicht zeigt bei Projektilfertigkeiten Projektile pro Aktion,
Einzelzielmultiplikator, mögliche Mapping-Zielkontakte, belegte
Chain-/Pierce-Werte, blockierte Trefferobergrenzen und die Modellgrenzen.
Die vorhandenen DPS-Werte werden durch reine Abdeckungsdaten nicht erhöht.

## Tests

Abgedeckt sind Spark, Arc, Fragmentation Rounds, Tornado Shot, eine
Nicht-Projektilfertigkeit, die Integration in die Trefferschadenausgabe und
der unveränderte Einzelzielschaden.

## Schlussfolgerung

Schritt 17 ist technisch umgesetzt. Die App kann strukturierte Projektile,
Chains und Pierce nun sichtbar und szenariogetrennt ausweisen, ohne daraus
unbelegte Boss-DPS zu erfinden.

Als nächster Schritt kann ein Trigger- und Wiederholungsmodell aufgebaut
werden. Auch dort dürfen nur vollständig belegte Auslöser, Intervalle und
Zielwirkungen produktiv gerechnet werden.
