# Gemeinsame Build-Paket-Optimierung

## Ziel

Die sechs Haupt-Analyzer sollen nicht länger nur voneinander getrennte
Ranglisten liefern. Der Build-Assistent bewertet mehrere vollständige
Build-Pakete und wählt nur ein technisch gültiges, gemeinsam belegtes Paket
als Empfehlung.

## Ausgangsproblem

Der vorhandene Variantenoptimierer verband bereits Hauptfertigkeit,
Waffenart, Supports, Charakteraffinität, Ressourcen und ein ergänzendes
Waffenset-Setup. Passive, Juwelen, Uniques und Rotation entschieden jedoch
nicht gemeinsam über den Gewinner. Dadurch konnte ein hoher isolierter
Skillwert fachlich schwächere Gesamtpakete überdecken.

## Paketbestandteile

Jede näher geprüfte Variante enthält:

- Klasse und Aszendenz,
- Hauptfertigkeit,
- technisch kompatible Waffenart,
- Hauptwaffenset,
- begrenzte kompatible Supportkombination,
- belegtes Setup für das zweite Waffenset, soweit vorhanden,
- Equipment-Analyzer-Ergebnis,
- Skill-Analyzer-Ergebnis,
- Support-Analyzer-Ergebnis,
- Passive-Analyzer-Ergebnis,
- Jewel-Analyzer-Ergebnis,
- Unique-Analyzer-Ergebnis,
- Ressourcenstatus,
- Rotationsstatus.

## Harte Grenzen

Ein Paket wird vollständig blockiert, wenn der Hauptskill oder ein
eingesetzter Support durch den zuständigen Analyzer technisch blockiert
wird. Ein hoher Einzelwert darf diese Sperre nicht aufheben.

Equipment-first bleibt verbindlich. Eingetragene Waffen werden nicht
stillschweigend ersetzt. Ohne Ausrüstung dürfen nur lokal belegte
Skill-Waffen-Kombinationen untersucht werden.

## Gemeinsame Bewertung

Die Paketbewertung verwendet nachvollziehbare Teilwerte von 0 bis 100:

| Teilbereich | Gewicht |
| --- | ---: |
| Ausrüstung | 14 % |
| Hauptskill | 24 % |
| Supports | 16 % |
| Passive | 16 % |
| Juwelen | 7 % |
| Uniques | 7 % |
| Ressourcen | 10 % |
| Rotation | 6 % |

Die Gewichte ersetzen keine Analyzerregeln. Sie vergleichen ausschließlich
Kandidaten, die zuvor die harten Regeln bestanden haben. Fehlende Belege
erzeugen keinen positiven Teilwert. Pakete mit mehreren unbelegten
Teilbereichen werden als `limited` gekennzeichnet.

## Suchumfang

Der bestehende Variantenoptimierer erzeugt weiterhin alle technisch
zulässigen Skill-Waffen-Kombinationen. Die höchstbewerteten acht Varianten
werden anschließend erneut als vollständige Build-Eingabe durch den
gemeinsamen Orchestrator und alle sechs Analyzer geschickt.

Dies begrenzt die Rechenzeit, ohne einen einzelnen vorläufigen Gewinner
ungeprüft zu übernehmen.

## Sichtbares Ergebnis

Die Ergebnisansicht zeigt:

- Paketstatus,
- gemeinsamen Paketwert,
- acht Teilwerte,
- konkrete Paketbelege,
- fehlende fachliche Belege.

Damit ist erkennbar, warum eine Kombination gewonnen hat und welcher Teil des
Builds noch schwach oder unbekannt ist.

## Determinismus und Grenzen

Gleiche Eingaben erzeugen dieselbe Kandidatenreihenfolge, dieselben
Teilwerte und denselben Gewinner. Die Optimierung denkt nicht frei und
erfindet keine Spielregeln. Sie ist eine deterministische Suche innerhalb
der belegten lokalen Daten.

Eine vollständige globale PoE2-Optimierung ist weiterhin nicht behauptet.
Insbesondere begrenzen unvollständige Skill-, Support-, Passive- und
Meta-Profilbelege die erreichbare Qualität.
