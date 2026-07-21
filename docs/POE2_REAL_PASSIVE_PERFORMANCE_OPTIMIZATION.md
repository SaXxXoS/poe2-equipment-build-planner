# Reale Passive-Integration: Performanceoptimierung 5I.1

## Nutzung durch 5J

5J baut Graph und Prepared Context einmal im Module-Worker und hält beide dort. Dadurch verschiebt sich die bekannte synchrone Rechenlast vom UI-Hauptthread; Compact bleibt mit ungefähr 718 KB der einzige normale Workertransport. Fachliche Laufzeiten werden nicht als schneller behauptet.

## Umfang und Baseline

5I.1 optimiert ausschließlich Laufzeit, Speicherbindung und Transportgröße der 5I-Adaptergrenze. Targeting-Regeln, Gewichte, Scores, Tie-Breaker, Coverage, Required-Ziele, Budget, Startauflösung, Pathfinder, Planner, Graphgeometrie, UI und Baumrenderer bleiben fachlich unverändert. Aufgabe 5J wurde nicht begonnen.

Gemessen wurde der lokale offizielle Baum 0.5.2 mit identischem Lightning-/Projectile-Profil, 15 Punkten, Klassenstart 0, Modus `balanced`, Pool 10 und einem Ziel. Umgebung: Windows x64, Node 24.14.0; ein Warm-up, drei Messläufe. JIT, GC und Systemlast verursachen Unsicherheit; Heap-Differenzen sind keine Speichergarantie.

## Größenaufschlüsselung

| Feld | Anzahl | Größe | Verwendung |
|---|---:|---:|---|
| `targetingResult` | 5.150 | 34.177.501 B | Planner und Full; nicht Compact |
| `allCandidates` | 5.150 | 16.628.239 B | intern/Full |
| `eligibleCandidates` | 3.765 | 13.435.446 B | duplizierte Kandidatenreferenzen/Full |
| `blockedCandidates` | 1.366 | 3.162.190 B | Audit/Full |
| zwölf Rankings | 12 Arrays | 830.254 B | Audit/Full |
| Coverage | 607 unresolved Patterns | 32.044 B | Compact als Summary |
| `planningResult` | 1 Ziel | 2.194 B | Compact als finaler Plan |
| ausgewähltes Ziel | 1 | 781 B | Compact mit Pfad-IDs |
| Selection Steps | 1 | 299 B | Full; Stufensummary Compact |
| Pipeline-Stufen | 8 | 1.649 B | Compact erhalten |
| Issues | 7.143 | 713.156 B | Compact strukturiert erhalten |
| Graphdiagnose | 1 | 115 B | Metadaten; keine Graphkopie |

Die 34,9 MB entstehen aus vollständigen Kandidatenobjekten, die in All-/Eligible-/Blocked-Listen und Rankings mehrfach serialisiert werden. Planning-Pfade sind klein; der Graph war bereits kein Ergebnisbestandteil.

## Compact, Full und Projektion

`EngineRequest.realPassivePlanning.resultDetailMode` akzeptiert `compact` oder `full`; Compact ist Adapterstandard. Der direkte `runRealPassivePipeline`-Aufruf bleibt unverändert Full.

`projectRealPassivePipelineResult(...)` ist die einzige Projektion. Compact enthält Status, Versionen, Start, finalen Plan, Ziele, Pfade als Node-ID-Folgen, Teilbaum-IDs, Budget, Required-Diagnosen, unresolved-Stat-Summary, Issues, Stufen-, Graph-, Targeting- und Planning-Summaries, Heuristikhinweis und den unveränderten fachlichen Pipelinehash. Es enthält kein `targetingResult`, keine 5.150er-Rangliste und keinen Graph. Full gibt das vollständige Pipelineobjekt zurück. Die Projektion bewertet nichts neu und mutiert das Quellobjekt nicht.

## Prepared Targeting Context und Cacheentscheidung

`preparePassiveTargetingContext(nodes, sourceVersion)` materialisiert einmalig ausschließlich profilunabhängige Klassifikationen, Tags, Regel-IDs, normalisierte Statfakten, Signaturindex, Knotenanzahl, Formatversion, Source-Version und Baumidentität. Profilwerte, Scores, Ziele, Required-Status und Pläne sind ausgeschlossen.

Formatversion, Source-Version, Anzahl und Baumidentität werden vor Wiederverwendung geprüft. Fremde Releases oder Bäume werden abgewiesen. Der Kontext ist explizit aufruferverwaltet und eingefroren. Es gibt keinen globalen Cache, keine Persistenz und kein Browser-Storage. Graph und Context werden unabhängig explizit wiederverwendet.

## Vorher/Nachher

| Messwert | 5I bzw. lokale Baseline | 5I.1 | Änderung |
|---|---:|---:|---:|
| ohne Pipeline | 47,50 ms alte Serie | Median 8,82 ms (8,03–10,43) | nicht direkt vergleichbar |
| vorbereiteter Graph, ohne Context | 2.697,38 ms alte Serie | Median 2.064,76 ms (1.958,97–2.074,51) | reproduzierte Baseline |
| Graph + Context | – | Median 414,43 ms (410,21–447,55) | −79,9 % lokal |
| Targeting ohne Context | 1.976,99 ms alte Serie | Median 1.797,04 ms (1.702,20–1.798,10) | reproduzierte Baseline |
| Targeting mit Context | – | Median 134,08 ms (131,42–154,14) | −92,5 % lokal |
| Planning | 202,32 ms | 202,12 ms | praktisch unverändert |
| Validierung | – | 0,03 ms | Stichprobe |
| Context-Aufbau einmalig | – | 1.866,44 ms | amortisierbar |
| Graphaufbau | 318,63 ms | 353,92 ms | andere Serie |
| zwei Läufe, Graph/Context | 5.422,55 ms | 926,88 ms | −82,9 % |
| drei Profile, Graph/Context | 7.901,55 ms | 1.379,08 ms | −82,5 % |
| Full-Größe | 34.896.050 B | 34.896.120 B | neue Diagnosen |
| Compact-Größe | – | 717.622 B | −97,94 % gegen Full |
| Full Heap-Differenz | 234,07 MiB alte Serie | Median 47,46 MiB (37,75–53,28) | nicht vergleichbar |
| Compact Heap-Differenz | – | Median −11,44 MiB (−75,66 bis −10,13) | GC-dominiert |

Full-Projektion lag unter 0,01 ms, Compact-Projektion bei 0,41 ms, Compact-Serialisierung im Median bei 2,93 ms. Die Full-Serialisierung/Größe wurde separat gemessen; Full bleibt bewusst groß.

## Äquivalenz, verworfene Ansätze und Grenzen

Context-Treffer und -Miss erzeugen identische Targeting-Ergebnisse. Compact und Full erhalten Status, Zielreihenfolge, Pfade, Teilbaum, Budget, Required-Diagnosen, Issues, Heuristik und fachlichen Hash. Profile teilen keine veränderlichen Resultatarrays.

Verworfen wurden Kandidatenreduktion, Distanzvorfilter, geänderte Reasons, Score-/Tie-Breaker-Anpassung, globaler Cache und fachliche Lazy-Auswertung. Diese könnten Semantik oder Release-/Testisolation verändern.

Die synchrone Pipeline ist trotz Verbesserung nicht als ruckelfrei, mobil speichersicher oder sofort UI-tauglich bestätigt. Der einmalige Context-Aufbau bleibt teuer. Voraussetzung für 5J ist eine ausdrückliche UI-/Laufzeitarchitekturentscheidung samt späterer physischer Mobilprüfung.
