# Deterministische Build-Variantenoptimierung

## Ziel

Die automatische Buildwahl prüft eine Fertigkeit nicht mehr isoliert. Eine
produktive Variante besteht aus:

- Klasse und Aszendenz,
- Hauptfertigkeit,
- kompatibler Waffenart,
- kompatiblen Supports ohne doppelte Supportfamilie,
- einer belegten Set-2-Vorbereitung, soweit vorhanden,
- den vorhandenen Skill- und Equipment-Analyzerwerten,
- den aus dem gepinnten Klassen- und Aszendenzbaum belegten Affinitäten,
- und anschließend dem echten berechneten Passive-Pfad.

## Ablauf

1. Harte Klassen-, Aszendenz- und Waffenregeln entfernen inkompatible
   Kombinationen.
2. Mit eingetragener Ausrüstung werden ausschließlich die vorhandenen
   Waffenarten geprüft (Equipment-first).
3. Ohne Ausrüstung werden nur durch strukturierte Skilldaten belegte
   Waffenbindungen verwendet. Für ungebundene Zauber ist der Zauberstab die
   dokumentierte Standardvariante; andere ungebundene Fälle bleiben ungelöst.
4. Kompatible Supports werden nach belegter Tag-Überdeckung geordnet.
   Mehrere Stufen derselben Supportfamilie dürfen nicht gleichzeitig in einer
   Variante vorkommen.
5. Eine fachlich verbundene Vorbereitung wird für Waffenset 2 gesucht. Auch
   ihre Waffenanforderung muss erfüllt sein.
6. Die Varianten werden deterministisch sortiert. Die beste vollständige
   Kombination wird in die bestehende Build- und Passive-Pipeline gegeben.
7. Erst für diese Gewinnerkombination berechnet die vorhandene
   Passive-Tree-Engine den konkreten Pfad. So wird nicht für jede theoretische
   Kombination ein vollständiger Baumlauf gestartet.

## Grenzen

Die Variantenzahl ist eine relative, nachvollziehbare Projektbewertung und
keine behauptete vollständige Path-of-Building-DPS. Fehlende strukturierte
Zusammenhänge bleiben unbekannt und erzeugen keinen Bonus. Eine manuell
gewählte Hauptfertigkeit wird nicht ersetzt; für sie wird lediglich die
kompatible Gesamtvariante geprüft.
