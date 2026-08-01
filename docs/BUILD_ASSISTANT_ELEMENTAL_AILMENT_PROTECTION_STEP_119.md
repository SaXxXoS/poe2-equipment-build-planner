# Schritt 119 – einzelne Elementarbeeinträchtigungen

## Ziel

Das Überlebensmodell behandelt Entzünden, Kühlen, Einfrieren und Schock getrennt. Ein allgemeiner Sammelwert allein reicht nicht aus, weil PoB2 für jede Beeinträchtigung eine eigene effektive Vermeidung und Immunität berechnet.

## Belegte Rechenregel

Die Implementierung folgt dem gepinnten PoB2-Verhalten:

- individuelle Vermeidung plus allgemeine Elementarbeeinträchtigungsvermeidung,
- Deckelung je Beeinträchtigung auf 100 %,
- individuelle Immunität wirkt nur auf die passende Beeinträchtigung,
- allgemeine Elementarbeeinträchtigungsimmunität wirkt auf alle vier Typen,
- Immunität ergibt effektiv 100 % Vermeidung.

Die vier Ergebnisse enthalten jeweils `chance`, `immune` und `immunitySource`.

## Fail-closed

Bedingte Zeilen wie „Cannot be Ignited while on Low Life“ werden ohne bestätigten Laufzeitzustand nicht als permanente Immunität verwendet. Sie erzeugen einen blockierten Spezialfall. Freie Textähnlichkeit und deutsche Anzeigetexte sind keine technische Quelle.

## Quellen

- gepinntes PoB2 `src/Modules/ModParser.lua`: `AvoidIgnite`, `AvoidChill`, `AvoidFreeze`, `AvoidShock` und die zugehörigen Immunitätsflags
- gepinntes PoB2 `src/Modules/CalcDefence.lua`: Addition, Deckelung und Immunitätsvorrang je Elementarbeeinträchtigung
- lokaler Passivbaum `data-sources/poe2-tree/raw/0.5.2/data.json`

## Coverage-Grenze

Die aktuelle lokale Baumversion enthält in den geprüften Statzeilen keine direkt belegten Einzelvermeidungszeilen. Das Rechenmodell ist deshalb für freigegebene technische Eingaben vorbereitet, behauptet aber keine gegenwärtige Baum-Coverage, die in den Quelldaten nicht vorhanden ist. Bedingte Transfers wie „Schockvermeidung gilt für alle Elementarbeeinträchtigungen“ bleiben bis zur gesonderten Modellierung blockiert.

## Versionen

- `CHARACTER_SURVIVABILITY_MODEL_VERSION`: `1.3.0`
- Schadensrechner: `3.33.0`

## Nächster Schritt

Schritt 120 prüft und modelliert belegbare nicht-elementare Beeinträchtigungen wie Blutung und Gift einschließlich ihrer getrennten Vermeidung und Immunität.
