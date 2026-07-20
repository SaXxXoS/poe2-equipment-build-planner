# Architektur der Build-Engine

## Ziel und Abgrenzung

Die Engine bereitet eine erklärbare, Equipment-first ausgerichtete Build-Analyse vor. Aufgabe 4A enthält ausschließlich deterministische Architektur- und Testlogik mit synthetischen Fixtures. Sie enthält keine echten PoE2-Daten, keine DPS- oder Schadensformeln, keine echte Optimierung, keine Graphsuche und keine Verbindung zur Benutzeroberfläche. Der dokumentierte Profilwertebereich ist 0 bis 100; Werte sind normierte Affinitäten, keine Spielwerte.

## Datenfluss und Module

`BuildInput → Equipment Analyzer → BuildProfile → Skill Analyzer → Support Analyzer → Passive Analyzer → Jewel Analyzer → Unique Analyzer → Rotation Generator → Explanation Generator → BuildAnalysis`

- `common`: zentrale Typen, kontrollierte Bewertungskategorien, Score-Helfer und stabile Sortierung.
- `equipment`: wendet zentral definierte synthetische Regeln auf strukturierte Modifier an, analysiert beide Waffen-Sets getrennt und erzeugt den kombinierten Profil- und Konfliktbericht.
- `skills`: bewertet synthetische Kandidaten regelbasiert gegen Equipment-Profil, Charakter und Ziel, prüft harte Ausschlüsse und erzeugt Rollen-, Set- und Ranglistenberichte.
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

## Equipment Analyzer (Aufgabe 4B)

Der Equipment Analyzer ist ausschließlich für Ausrüstung zuständig. Er wählt keine Skills oder Supports, berechnet keine passiven Pfade, bewertet keine Juwele oder Uniques und erzeugt keine Rotation. Seine Ausgabe ist das Eingabeprofil für spätere Module, keine endgültige Buildentscheidung.

### Regelmodell und Konfiguration

Alle Affinitätsregeln stehen zentral in `src/engine/equipment/rules.ts`. Jede Regel besitzt technische ID, Description-Key, anwendbare synthetische Modifier-IDs beziehungsweise Tags, genau ein Profilfeld, Gewicht, optionalen Mindestwert, maximale Contribution, optionalen Waffen-Set-Scope, Reason-Code, Evidenzart und Aktivstatus. Direkte Hinweise wie Projektilschaden sind höher gewichtet als indirekte Hinweise wie Angriffsgeschwindigkeit als Attack-Indiz.

`src/engine/equipment/config.ts` enthält sämtliche künstlichen Grenzwerte: Normalisierungsbereich, Rohwertdivisor, Widerstands- und Defensivziel, Konfliktstärken, Klarheits-, Unused- und Weak-Use-Schwellen sowie Fixture-Attributziele. Diese Werte sind ausdrücklich keine PoE2-Grenzwerte.

### Normalisierung

`normalizeContribution(raw, weight, maximum)` berechnet `raw × weight ÷ rawValueDivisor`, begrenzt zunächst auf die maximale Regel-Contribution und anschließend zentral auf 0–100. Negative und nicht endliche Werte werden zu 0. Mehrere Contributions addieren sich am Profilfeld und werden erneut auf 0–100 begrenzt. Jeder Grund enthält Regel-ID, Rohwert, Contribution, Evidenzart und resultierenden Profilwert.

### Schadens-, Mechanik- und Defensivanalyse

Getrennt bewertet werden Physical, Fire, Cold, Lightning und Chaos sowie Attack, Spell, Projectile, Melee, Area, Critical, Damage-over-Time, Minion, Movement, Buff und Debuff. Geschwindigkeit, Leben, Rüstung, Ausweichen und Energieschild besitzen eigene Affinitäten. Widerstands- und allgemeiner Defensivbedarf ergeben sich relativ zu konfigurierbaren synthetischen Zielwerten. Stärke, Geschick und Intelligenz werden nur gegen künstliche Fixture-Anforderungen geprüft.

### Waffen-Sets

Waffen-Set 1 und 2 erhalten eigene Profile. `combinedProfile` analysiert die gesamte Ausrüstung. Der Bericht nennt Differenzen, Spezialisierungen und das dominante Set; bei identischen Scores lautet das Ergebnis stabil `balanced`. Es wird daraus keine Rotation abgeleitet.

### Konflikte, Modifier-Nutzung und Klarheit

Nicht blockierende Warnungen erkennen starke Attack-/Spell- und Melee-/Projectile-Mischungen, konkurrierende Schadensarten, isoliertes Critical oder Minion sowie unpassendes Angriffs- beziehungsweise Zaubertempo. Warnungen erzeugen negative `ScoreReason`-Einträge und referenzieren betroffene Modifier-IDs. Unbekannte Modifier bleiben dagegen blockierende harte Referenzverstöße.

Ein bekannter Modifier ist ungenutzt, wenn seine Contribution höchstens der zentralen Unused-Schwelle entspricht und er keine separat ausgewertete Attribut- oder Widerstandsfunktion besitzt. Eine Contribution unterhalb des konfigurierten Anteils am stärksten Modifier gilt als schwach genutzt. Konfliktbehaftete Modifier werden getrennt ausgewiesen. `conflictLevel` ist die normalisierte Summe der konfigurierten Konfliktstärken; `profileClarity` ist deren Gegenwert im Bereich 0–100. Gleichstände bei Dominanzen werden nach technischer ID stabil aufgelöst.

Der gesamte Analyzer arbeitet ausschließlich mit künstlichen Fixture-Definitionen. Er enthält keine echten Spieldaten, Schadens- oder DPS-Formeln und keine fachlich verbindlichen PoE2-Empfehlungen.

## Skill Analyzer (Aufgabe 4C)

Der Skill Analyzer bewertet ausschließlich übergebene künstliche Skill-Kandidaten. Eingaben sind `BuildProfile`, beide Waffen-Set-Profile, `profileClarity`/`conflictLevel`, Klasse, Aszendenz, Zielprofil, synthetische Waffenverfügbarkeit und `AnalyzerContext`. Er wählt keine Support-Gems, bildet keine Skillkombination und erzeugt weder passive Pfade noch Rotationen.

### Regeln und harte Kompatibilität

`src/engine/skills/rules.ts` enthält zentral die kontrollierten Skill-Regeln mit ID, Description-Key, benötigten/ausgeschlossenen Tags, Profilfeldern, Kategorie, Gewicht, Schwelle, Contribution-Limit, Reason-Code und Aktivstatus. Sämtliche Gewichte, Scoregrenzen, Klarheits- und Ausschlussschwellen liegen in `config.ts`.

Blockierend sind deaktivierte oder ungültige Kandidaten, technisch exklusive Attack-/Spell-Widersprüche, falsche beziehungsweise ausgeschlossene künstliche Waffenarten, nicht passende oder ausgeschlossene Klassen/Aszendenzen, fehlende Pflicht-Tags, vorhandene Ausschluss-Tags und künstliche Attributdefizite. Gemischte Equipment-Profile blockieren nicht automatisch. Blockierte Kandidaten bleiben mit technischem Score sichtbar, werden aber hinter gültigen Kandidaten sortiert.

### Weiche Bewertung und Zielprofile

Schadensarten, Mechanik-Tags und ausschließlich passende Geschwindigkeiten werden gegen normalisierte Profilfelder bewertet. Critical-, DoT- oder Minion-Affinität wirkt nur bei entsprechendem Skill-Tag. Klassen- und Aszendenzpräferenzen, Resource-/Defence-Hinweise sowie Mapping-/Boss-Basiswerte erzeugen strukturierte Gründe. `mapping`, `boss` und `balanced` verwenden zentral konfigurierte Gewichtungen; Mapping belohnt zusätzlich Area, Projectile und Movement, Boss synthetische Debuff-Eignung. Jede Kategorie wird auf 0–100 begrenzt; negative Konflikt- und Unused-Gründe reduzieren den ebenfalls auf 0–100 begrenzten Gesamtwert.

### Rollen, Waffen-Sets und Profilnutzung

Mögliche und empfohlene Rollen sind `main`, `secondary`, `utility`, `movement` und `defensive`. Movement, Buff/Debuff und Defensive haben eindeutige Rollenprioritäten; schadensbezogene Kandidaten können Main oder Secondary sein. Jede Rollenwahl besitzt einen Reason-Code.

Set 1, Set 2 und das kombinierte Profil werden separat bewertet. Die Empfehlung enthält beide Scores, Differenz und `set-1`, `set-2`, `both` oder `none`; Gleichstand und setunabhängige Utility-/Movement-Skills ergeben `both`. Es wird keine Waffenwechselrotation erzeugt. Zusätzlich werden stark und schwach passende Profilfelder, ungenutzte dominante Felder und Konfliktfelder ausgewiesen.

### Confidence und Ranglisten

`profileClarity` beeinflusst ausschließlich `confidence`, nicht die fachliche Punktzahl. Hohe Klarheit mit Profiltreffern ergibt `high`, mittlere Klarheit `medium`, geringe Klarheit `low`; hoher `conflictLevel` und geringe Klarheit erzeugen Warnungen. `SkillAnalysis` enthält alle, gültige und blockierte Kandidaten, Top-Main-, Utility- und Movement-Gruppen sowie getrennte Mapping- und Bossranglisten. Gleichstände werden über stabile Skill-IDs aufgelöst; sofern verfügbar werden drei Main-Kandidaten bereitgestellt.

Der Analyzer verwendet keine echten PoE2-Skills, Werte oder DPS-Formeln. Die Skillbewertung selbst bleibt vom nachgelagerten Support Analyzer getrennt.

## Support Analyzer (Aufgabe 4D)

Der Support Analyzer bewertet jeden übergebenen synthetischen Support einzeln gegen einen bereits ausgewählten `SkillRecommendation`, dessen Definition, das kombinierte und die beiden Waffen-Set-Profile, Klasse, Aszendenz, Zielprofil und `AnalyzerContext`. Ausgabe ist eine `SupportAnalysis` mit allen, gültigen und blockierten Kandidaten sowie Damage-, Mapping-, Boss-, Utility- und Defensive-Ranglisten. Er wählt weder einen anderen Skill noch eine Support-Kombination.

### Regeln, Kompatibilität und Bewertung

`src/engine/supports/rules.ts` enthält das zentrale Regelmodell mit IDs, Description-Keys, benötigten und ausgeschlossenen Skill-/Support-Tags, Profilfeldern, Kategorien, Gewichten, Schwellen, Contribution-Limits und Aktivstatus. Scoregrenzen, Zielgewichte, Trade-off-Abzüge, Profil- und Confidence-Schwellen liegen ausschließlich in `config.ts`.

Harte Prüfungen blockieren fehlende oder ungültige Skill-/Supportreferenzen, deaktivierte Supports, fehlende Pflicht-Tags, vorhandene Ausschluss-Tags oder Schadensarten, unpassende Schadensarten und Mechaniken, Waffen- oder Rollenwidersprüche, ausgeschlossene Klasse/Aszendenz sowie ein nicht verfügbares Pflicht-Waffen-Set. Blockierte Supports bleiben mit mindestens einer `ConstraintViolation` sichtbar, sind nicht auswählbar und werden hinter gültigen Supports sortiert.

Gültige Supports erhalten nachvollziehbare `ScoreReason`-Beiträge in `damage`, `defence`, `mapping`, `boss`, `speed`, `utility`, `resource`, `ascendancy-synergy` und `equipment-synergy`; `path-efficiency` ist ausgeschlossen. Attack, Spell, Projectile, Melee, Area, Critical, DoT, Minion, Movement, Buff, Debuff und fünf Schadensarten werden nur bei direkter Skill- oder Profilrelevanz belohnt. Eine Schadensumwandlung oder reale Multiplikatoren existieren nicht. Mapping, Bossing und Balanced verwenden zentral konfigurierte synthetische Gewichte.

### Trade-offs, Waffen-Sets und Confidence

Geschwindigkeits-, Ressourcen-, Defensive-, Mapping- und Bossnachteile sowie eingeschränkte Skill- oder Waffen-Set-Nutzung werden als strukturierte `SupportTradeOff`-Einträge und negative Gründe ausgegeben. Nur eine zugehörige harte Anforderung blockiert. Matched, schwach genutzte, ungenutzte und konfliktbehaftete Tags beziehungsweise Profilfelder bleiben getrennt nachvollziehbar.

Set 1 und Set 2 werden unabhängig bewertet; die Empfehlung enthält beide Scores, Differenz, Set-Gründe und `set-1`, `set-2`, `both` oder `none`. Gleichstand ergibt `both`; eine Waffenwechselrotation wird nicht erzeugt. `confidence` wird getrennt vom Score aus Skillgültigkeit und -Confidence, Profilklarheit, direkten Treffern, Konflikten und experimentellem Status ermittelt. Gleichstände in allen Ranglisten werden nach technischer Support-ID aufgelöst; bei ausreichender Kandidatenzahl werden mindestens fünf gültige Top-Kandidaten ausgegeben.

Der Analyzer arbeitet rein, deterministisch, React- und netzwerkfrei mit synthetischen Fixtures. Er optimiert keine mehreren Supports, berücksichtigt keine Sockel oder Links und berechnet weder Schaden noch DPS. Diese Grenzen bleiben späteren, ausdrücklich freizugebenden Aufgaben vorbehalten.

## Passive Analyzer (Aufgabe 4E)

Der Passive Analyzer bewertet ausschließlich übergebene synthetische Einzelknoten und kleine, bereits definierte Cluster. Eingaben sind Build- und Waffen-Set-Profile, EquipmentAnalysis, der ausgewählte Skill, ausgewählte einzelne Supportempfehlungen, Charakter, Zielprofil, Knoten, Verbindungen und `AnalyzerContext`. `PassiveAnalysis` trennt alle, gültige und blockierte Kandidaten und liefert Damage-, Defensive-, Mapping-, Boss-, Path-Efficiency-, Ascendancy-, Keystone- und Cluster-Ranglisten.

`src/engine/passives/rules.ts` definiert Tags, Profilfelder, Kategorien, Gewichte, Schwellen und Contributions zentral; `config.ts` enthält Scoregrenzen, Knotentyp-Boni, Pfadkosten, Bedarfs-, Trade-off-, Set- und Confidence-Schwellen. Harte Regeln blockieren unbekannte oder deaktivierte Knoten, ungültige Verbindungen, Selbstverbindungen, doppelte oder nicht zusammenhängende Pfade, unerreichbare Cluster, falsche Klasse/Aszendenz, fehlende Eingangsknoten und überschrittene Punktbudgets. Der Analyzer validiert nur den angegebenen Pfad und sucht weder Alternativen noch kürzeste Wege.

Schadensarten und Attack-, Spell-, Projectile-, Melee-, Area-, Critical-, DoT- und Minion-Tags erhalten nur bei passender Profil- und Skill-Evidenz positive `ScoreReason`s. Defensive, Widerstands-, Ressourcen- und Attributknoten reagieren auf synthetische Bedarfe. Normal, Notable, Keystone, Ascendancy sowie Jewel-/Cluster-Socket werden unterschieden; Sockel bleiben reine Anschlusswerte ohne Juwelbewertung. Keystone-Nachteile werden als strukturierte Trade-offs und negative Gründe ausgegeben, nicht pauschal blockiert.

Ziel- und Pfadpunktkosten ergeben `totalPointCost`; `scorePerPoint` teilt den synthetischen Nutzen durch mindestens einen Punkt, während `pathEfficiencyScore` Pfadkosten und nützliche beziehungsweise wertlose Durchgangsknoten berücksichtigt. Beide Waffen-Sets werden getrennt bewertet. Redundanzen, Profilkonflikte und schwache Pfadknoten erzeugen strukturierte Listen und Warnungen. Confidence bleibt vom Score getrennt und berücksichtigt Profilklarheit, Pfadgültigkeit, direkte Treffer, Konflikte, schwache Durchgangsknoten und experimentellen Status.

Es wird kein vollständiger Baum zusammengestellt, kein alternativer Pfad gesucht, kein Jewel oder Unique bewertet und keine Rotation erzeugt. Der Analyzer verwendet keinen echten PoE2-Skilltree, keine echten Daten und keine Schadens- oder DPS-Formeln; die Engine bleibt von der UI getrennt.

## Nächste Module

Nächster abgegrenzter Schritt ist Aufgabe 4F. Echte Daten, DPS-Formeln, globale passive Graphsuche und kombinatorische Optimierung benötigen jeweils getrennte Freigaben, Datenquellen und Referenztests.
