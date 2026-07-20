# Architektur der Build-Engine

## Ziel und Abgrenzung

Die Engine bereitet eine erklärbare, Equipment-first ausgerichtete Build-Analyse vor. Aufgabe 4A enthält ausschließlich deterministische Architektur- und Testlogik mit synthetischen Fixtures. Sie enthält keine echten PoE2-Daten, keine DPS- oder Schadensformeln, keine echte Optimierung, keine Graphsuche und keine Verbindung zur Benutzeroberfläche. Der dokumentierte Profilwertebereich ist 0 bis 100; Werte sind normierte Affinitäten, keine Spielwerte.

## Datenfluss und Module

`BuildInput → Equipment Analyzer → BuildProfile → Skill Analyzer → Support Analyzer → Passive Analyzer → Jewel Analyzer → Unique Analyzer → Rotation Generator → Explanation Generator → BuildAnalysis`

- `common`: zentrale Typen, kontrollierte Bewertungskategorien, Score-Helfer und stabile Sortierung.
- `equipment`: erkennt künstliche Modifier-Tags, Waffen-Sets, Anforderungen und ungenutzte Modifier; erzeugt das Profil.
- `skills`: bewertet Kandidatentags gegen das Profil und weist Rollen sowie Mapping-/Bosswerte aus.
- `supports`: prüft erforderliche und ausgeschlossene Tags und blockiert inkompatible Kandidaten.
- `passives`: bewertet künstliche Nutzwerte abzüglich vorgegebener Pfadkosten; keine Pfadsuche.
- `jewels`: gemeinsame Bewertung normaler, Cluster- und Unique-Cluster-Juwele.
- `uniques`: künstliche Aszendenz- und Equipment-Synergie samt Trade-offs und Build-Enabler-Markierung.
- `rotations`: erzeugt feste, strukturierte Mapping- und Bossfolgen einschließlich begründetem Waffenwechsel.
- `explanations`: überführt Reason- und Constraint-Codes in strukturierte Einträge, nicht in freie Texte.
- `orchestration`: ruft Module in der verbindlichen Reihenfolge auf und bündelt `BuildAnalysis`.
- `fixtures`: drei ausdrücklich synthetische Engine-Szenarien.

## Bewertungsmodell und Regeln

Jede Empfehlung enthält Ziel-ID, Gesamtpunktzahl, strukturierte positive/negative/neutrale Gründe, Verstöße, kontrollierte Kategoriewerte, Vertrauen und Status. `ScoreReason` besitzt Code, Kategorie, Message-Key, Impact, Polarität, Quelltyp, optionale Quell-ID, betroffene Tags und optionale Details. Freie, erfundene Langtexte sind ausgeschlossen.

Harte Regeln werden als blockierende `ConstraintViolation` modelliert, etwa unbekannte Referenzen, unerreichbare Passivkandidaten oder inkompatible Supports. Weiche Regeln verändern Scores ausschließlich in den Kategorien `damage`, `defence`, `mapping`, `boss`, `speed`, `utility`, `resource`, `ascendancy-synergy`, `equipment-synergy` und `path-efficiency`.

## BuildProfile

Das Profil enthält normierte Affinitäten für fünf Schadensarten; Angriffs-, Zauber-, Projektil-, Nahkampf-, Flächen-, Krit-, DoT-, Minion-, Bewegungs-, Buff- und Debuffmechaniken; Angriffs-, Zauber- und Bewegungsgeschwindigkeit; Leben, Rüstung, Ausweichen, Energieschild, Widerstands- und allgemeinen Defensivbedarf; Attribut- und Ressourcenbedarf sowie Mapping-, Boss-, Defensiv- und Schadensziele. Der geplante Bereich ist 0–100. Es handelt sich weder um DPS noch um exakte Charakterwerte.

## Rotation und Erklärung

Rotationsschritte speichern Reihenfolge, Skill-ID, Waffen-Set, Aktionstyp, Reason-Codes und optionale Wiederholungs-/Dauerbedingungen. Der Testablauf setzt Debuff und Buff auf Set 2, gibt den Wechsel zu Set 1 als eigenen begründeten Schritt aus und verwendet danach den Hauptangriff. `ExplanationEntry` bündelt Abschnitt, Priorität, Titel-Key, Reason-Codes, Quell-IDs, Impact, Warnstufe und optionale Empfehlungs-ID.

## Determinismus

Alle Funktionen sind rein bezogen auf ihre Eingaben, verwenden keine Zeit, Zufallswerte, Dateien oder Netzwerkzugriffe. Empfehlungen werden nach Score und bei Gleichstand nach stabiler technischer ID sortiert. Gleiche Eingaben erzeugen dieselbe Struktur, Gründe und Rotationen.

## Nächste Module

Folgeaufgaben können zunächst Regeln der Equipment-Analyse und danach Skill-/Supportregeln erweitern. Echte Daten, DPS-Formeln, passive Graphsuche und kombinatorische Optimierung benötigen jeweils getrennte Freigaben, Datenquellen und Referenztests.
