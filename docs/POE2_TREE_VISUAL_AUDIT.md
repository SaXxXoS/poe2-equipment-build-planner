# Forensischer visueller Baumaudit 5D.4.2

Stand: 21. Juli 2026. Implementierungsquelle ist ausschließlich der offizielle GGG-Export 0.5.2, Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6`. Mobalytics wurde nur als sichtbare Browserreferenz verwendet. Es wurden keine Mobalytics-Dateien, Assets, Netzwerkdaten oder Renderlogik untersucht oder übernommen.

| Region | Offizielle sichtbare Node-IDs / geprüfte Paare | Vorzustand der App | Sichtbare Referenz | Exportbeleg | Korrektur |
|---|---|---|---|---|---|
| Klassenstarts | 47175, 61525, 54447, 50986, 44683, 50459 | Startbereiche mit zu breiten Linien | dünne Grundlinien, gerahmte Knoten | `classStartIndex`, `edges` | Linienlook zentral reduziert; Geometrie bleibt |
| große äußere Gruppen | Gruppe 86: 21218:7066, 21218:13950, 45226:21218, 13950:11666 | Sehnen durchs Gruppeninnere | Kreisbogenabschnitte | `orbit`, `orbitX`, `orbitY` | offizielle Mittelpunktbögen |
| kleine Orbitgruppen | Gruppe 88: 18353:20496, 18353:3544, 11984:42762, 20496:11984 | gerade Polygonsehnen | kreisförmiger Orbit | dieselben Kantenfelder | kurze SVG-Arcs |
| Notable-Gruppen | 60708, 11666, 13950, 7066, 23932, 8423 | rechteckig wirkende Normalmotive neben Notables | runde Normalrahmen | `frame:PSSkillFrame` | offizieller Rahmen ergänzt |
| Keystone | 44017 (Resolute Technique) und Nachbarregion | zu schwere blaue Linien | gedämpfte, dünne Verbindungsebene | echte `edges`; kein Effektflag | zentraler Basisstil |
| Juwelsockel | 55190 sowie angrenzende Gruppe | Sockel korrekt, angrenzende Orbitlinien teils gerade | Sockel im Orbitnetz | `isJewelSocket`, Kantenmittelpunkte | Sockel unverändert, Bögen korrigiert |
| Mastery | Gruppe 86: 58058; Paar 17894:58058; Gruppe 88: 35980; Paar 58197:35980 | grauer Fallbackkreis plus dauerhafte Speiche | im Ruhezustand kein grauer Platzhalter/keine Effektspeiche | `isMastery`, `activeEffectImage` | 365 Zentren und 644 Effektkanten idle verborgen |
| Gruppenübergänge | mehrere angrenzende Gruppen | zusätzlich optisch falsche Querlinien durch Sehnen | getrennte Gruppenstrukturen | 1.733 Kantenmittelpunkte; 40 Layoutübergänge | Arcs; Layoutübergänge bleiben verborgen |
| zentrale Aszendenz | Titan: 32534 mit 32534:35453, :19424, :13715, :51690, :29323 | zentrale Platzierung korrekt, Linien zu schwer | zentrale getrennte Einheit | `ascendancyId`, offizielle Kanten | nur Pfade/Stil; Transform unverändert |
| Smith’s Masterwork | 9988; Smith of Kitava 5852; zwölf bekannte Effektendpunkte | zwölf Linien seit 5D.4.1 verborgen | idle ohne Effektstern | `hideConnection` | unverändert `hiddenUntilActive` |
| sichtbare Kurven | 1.733 Kanten mit Mittelpunkt | alle als `<line>` | Gerade und Bogen klar getrennt | `orbitX/orbitY` | `<path>` mit Kreisradius und Sweep |

Die größte überprüfte Differenz der beiden Endpunktradien einer offiziellen Bogenkante beträgt 0,1082 Weltkoordinaten; die Mittelpunkte sind damit eine belastbare Kreisdefinition. Kanten ohne `orbitCenter` bleiben exakt gerade. Es wurden keine Knoten verschoben, keine Verbindung erfunden und keine Graphkante gelöscht.

Verbleibende Unterschiede: Die App bildet weder animierte Aktivierungs-/Glow-Sequenzen noch vollständige Gruppenornamente und Punktebelegung nach. Sie verwendet SVG-Pfade statt der kompletten offiziellen Linienatlas-Animation. Daher wird keine 1:1-Gleichheit behauptet.

Manuelle Prüfpunkte: Desktop 1280×800 und emuliertes Mobil 390×844; Gesamt-/Nahansicht, Resolute-Technique-Region, Außen- und Kleinorbits, Titan, Smith, Jewel- und Mastery-Bereiche. Die endgültige Prüfung auf einem physischen iPhone bleibt beim Nutzer.
