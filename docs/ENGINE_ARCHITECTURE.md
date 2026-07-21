# Architektur der Build-Engine

## React-Grenze nach 5K

React kennt nur `PassiveAnalysisController`, Adapterfehler und das Compact-Ergebnis. Der Controller besitzt genau einen Worker-Client; nur dessen Dispatcher erreicht den Haupt-Orchestrator. Graph und Prepared Context bleiben ausschließlich im Worker. Renderer, Targeting, Pathfinder, Planner und Pipeline sind unverändert.

## 5J: Browser-Laufzeitadapter

`src/runtime/real-passive-worker/` liegt außerhalb der Engine. Genau ein Client und Dispatcher kapseln Module Worker, Protokoll, Lebenszyklus, Abbruch und Fehler. Der Dispatcher ruft ausschließlich `analyzeBuild`; Engine und Orchestrator importieren keine Browser-API.

## 5I.1: technische Passive-Optimierungsgrenze

`analyzeBuild` ruft weiterhin ausschließlich `runRealPassivePlanningIntegration` auf. Der Adapter ist die einzige Compact-/Full-Projektionsgrenze. Die direkte Pipeline bleibt Full; Targeting kann einen expliziten, versions- und baumidentitätsgeprüften Prepared Context lesen. Es existiert kein globaler Cache. Fachregeln, Pathfinder und Planner sind unverändert.

## Orchestratorintegration 5I

`analyzeBuild` besitzt nun den optionalen Vertrag `EngineRequest.realPassivePlanning`. Genau `runRealPassivePlanningIntegration` verzweigt nach der Equipment-Profilnormalisierung in die bestehende reale Pipeline. Ohne explizite Aktivierung bleiben alter Ablauf, Modultrace und fachliche Ausgabe unverändert; es wird kein Graph aufgebaut. Der synthetische Passive Analyzer läuft weiterhin an seiner bisherigen Stelle und sein Ergebnis bleibt getrennt vom realen Plan. Vollständiger Vertrag und Messwerte: [`POE2_REAL_PASSIVE_ORCHESTRATOR_INTEGRATION.md`](POE2_REAL_PASSIVE_ORCHESTRATOR_INTEGRATION.md).

## Abgrenzung 5D.3

Die Nachbesserung verändert keine Engine- oder Orchestratorverträge. Offizielle Baumassets und Klassen-/Aszendenzregister liegen ausschließlich an der Import-/View-Grenze; sie erzeugen keine Buildentscheidung.

## Datenimportgrenze aus Aufgabe 5C

`scripts/poe2-tree-import.mjs` erzeugt einen separaten, validierten offiziellen Passivbaum-Datenbestand unter `generated/poe2-tree/`. Die Adaptertypen liegen in `src/import/poe2-tree/types.ts`. Weder Engine-Orchestrator noch Passive Analyzer noch React-Komponenten importieren ihn. Aufgabe 5C ändert keine Scores, Regeln, Pfadsuche oder Empfehlungen. Eine spätere Integration benötigt einen getrennten Auftrag; GGG-Rohobjekte dürfen nicht direkt in die Engine gelangen.

Aufgabe 5D ergänzt davon getrennt `src/tree-view/`: Der Darstellungsadapter liest das validierte Importformat und erzeugt ein UI-spezifisches ViewModel. Nur dieses ViewModel erreicht die React-Baumkomponente. Diese Verbindung ist reine Darstellung; `src/engine/`, Passive Analyzer, Orchestrator und fachliche Regeln bleiben unverändert. Details stehen in `docs/POE2_TREE_VIEW_ADAPTER.md`.

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

## Jewel Analyzer (Aufgabe 4F)

Der Jewel Analyzer bewertet einzelne synthetische normale, Cluster- und Unique-Cluster-Juwele gegen BuildProfile, Equipment-, Skill-, Support- und PassiveAnalysis. Zentrale Regeln und Schwellen liegen in `src/engine/jewels/rules.ts` und `config.ts`. Harte Regeln prüfen Referenzen, Aktivstatus, Sockeltyp und -verfügbarkeit, Klasse, Aszendenz, Level, Clustergröße, Pfadkosten, Punktbudget, passive Referenzen, erforderliche Mechaniken und Skillrestriktionen.

Normale Juwele erhalten Modifier-, Profil-, Sockel- und optionale Knotennutzenwerte. Cluster-Juwele unterscheiden Eintritts-, interne und Sockelpunktkosten, passive und Notable-Nutzen, begrenzten Zusatzsockelwert, `scorePerPoint` und Path-Efficiency. Unique-Cluster ergänzen Mechanik- und Build-Enabler-Scores sowie strukturierte Restriktionen und Trade-offs; Enabler erzeugen Warnungen und reduzierte Confidence und gewinnen nicht automatisch.

Schadensarten, Mechaniken, Defensive, Widerstände, Attribute und Ressourcen werden nur bei passender Profil-/Skill-Evidenz belohnt. Empfehlungen enthalten getrennte Waffen-Set-Scores, Redundanz und Konflikte sowie vom Score unabhängige Confidence. `JewelAnalysis` liefert alle, gültige und blockierte Kandidaten sowie Kategorie-, Damage-, Defensive-, Mapping-, Boss-, Effizienz-, Ascendancy- und Enabler-Ranglisten.

PassiveAnalysis wird nur gelesen: Es werden weder Sockel automatisch belegt noch Pfade oder der Baum verändert. Es gibt keine kombinierte Juweloptimierung, keine Bewertung normaler Unique-Gegenstände, keine Rotation, keine echten Daten, keine DPS-Berechnung und keine UI-Anbindung.

## Unique Analyzer (Aufgabe 4G)

Der Unique Analyzer bewertet einzelne synthetische Gegenstände der Waffen-, Rüstungs-, Accessoire- und Sonderkategorien gegen BuildProfile sowie Equipment-, Skill-, Support-, Passive- und JewelAnalysis. Regeln und Schwellen liegen zentral in `src/engine/uniques/rules.ts` und `config.ts`. Harte Regeln prüfen Referenz, Status, Slot, Klasse, Aszendenz, Skill-Tags, Waffenart, Level, Kernmechaniken und nicht ersetzbare Slots.

Profil-, Skill- und Cross-Module-Treffer erzeugen getrennte Damage-, Defensive-, Ressourcen-, Equipment-, Skill-, Support-, Passive-, Jewel-, Klassen- und Aszendenzwerte. Die synthetische Slotbewertung vergleicht aktuelle und Unique-Utility, berechnet `replacementDelta` und klassifiziert Clear-/Situational-Upgrade, Sidegrade, Downgrade oder Unknown. Sie ersetzt keine Ausrüstung und verwendet keine realen Item- oder DPS-Werte.

Build-Enabler, gewonnene und verlorene Mechaniken, Folgeänderungen, betroffene Module, alternative Build-Tags und `requiresReoptimization` werden nur strukturiert gekennzeichnet. Trade-offs erzeugen negative Gründe; Kernmechanikverlust kann blockieren. Waffen-Sets, Redundanz, Konflikte und Confidence bleiben getrennte Ausgaben. `UniqueAnalysis` liefert alle, gültige und blockierte Kandidaten sowie Current-Build-, Ascendancy-, Equipment-, Damage-, Defensive-, Mapping-, Boss-, Slot-, Upgrade-, Enabler- und Alternativranglisten.

Es gibt keine kombinierte Unique-Ausrüstung, automatische Neuoptimierung, Markt-/Trade-Daten, Preis- oder DPS-Berechnung, Rotationserweiterung oder UI-Anbindung.

## Rotation Generator (Aufgabe 4H)

Der Rotation Generator liest ausschließlich bereits vorhandene Analyseergebnisse und ausgewählte Skill-Empfehlungen. Er bewertet oder ersetzt keine Skills, Supports, Passives, Juwele oder Uniques. Zentrale Regeln stehen in `src/engine/rotations/rules.ts`, alle Schwellen in `config.ts`; `generator.ts` bleibt rein, deterministisch, React- und netzwerkfrei.

### Pläne, Rollen und Aktionen

`RotationAnalysis` enthält getrennte Mapping- und Bosspläne, alle gültigen und blockierten Pläne sowie bevorzugte Pläne. Aktive Skillrollen sind `setup`, `debuff`, `buff`, `main-damage`, `secondary-damage`, `movement` und `defensive`. Jeder Schritt besitzt genau eine aktive Rolle. Kontrollierte Aktionstypen sind `use-skill`, `switch-weapon-set`, `move`, `wait-for-condition`, `repeat`, `maintain-buff`, `refresh-debuff` und `defensive-response`.

Mapping bevorzugt Movement, eine kurze optionale Vorbereitung, Hauptschaden und schnelle Wiederholung. Buff, Defensive und sekundärer Schaden werden aus der kurzen Mapping-Eröffnung ausgeschlossen. Boss ordnet Setup, Debuff und Buff vor Hauptschaden ein und kann sekundären Schaden und defensive Reaktionen ergänzen. Nur `main-damage` ist zwingend; fehlende optionale Rollen erzeugen szenarioabhängige Warnungen.

### Waffenwechsel und anhaltende Effekte

Ein Wechsel ist immer ein eigener `switch-weapon-set`-Schritt mit vorherigem und nächstem Set, Reason-Code und den auslösenden Empfehlungsreferenzen. Er entsteht nur zwischen aufeinanderfolgenden Fertigkeiten auf verschiedenen konkreten Sets; `both` verursacht keinen Wechsel. Häufige Wechsel werden anhand zentraler Schwellen gewarnt.

Optionale Skill-Metadaten modellieren `persistsAfterWeaponSwap`, `expiresOnWeaponSwap`, `affectsNextSkill`, `durationCategory`, `refreshRequired`, `canBeMaintained` sowie Ziel- und Spielerbezug. Ein beim Wechsel verfallender Setup-Effekt warnt vor einer setfremden Hauptfertigkeit. `affectsNextSkill` wird innerhalb derselben Rolle unmittelbar zuletzt vor dem nachfolgenden Rollenblock sortiert. Aufrechtzuerhaltende Buffs und zu erneuernde Debuffs stehen separat in `maintenanceSequence`.

### Bedingungen, Validierung, Complexity und Confidence

Wiederholungs- und Aktivierungsbedingungen sind kontrollierte Werte wie `on-enemy-group`, `on-boss-phase`, `on-buff-expired`, `on-debuff-expired`, `on-danger`, `continuous` und `once`; echte Sekunden- oder Cooldownwerte existieren nicht. Harte Prüfungen erkennen insbesondere fehlenden Hauptschaden, unbekannte oder blockierte Skills, nicht verfügbare Waffen-Sets, doppelte Schritt-IDs, nicht eindeutige Reihenfolgen, Setup nach Hauptschaden und Wiederholungszyklen ohne Bedingung.

`estimatedComplexity` wird getrennt von Qualität aus Schritt-, Wechsel-, Maintenance-, Setup- und Skillanzahl bestimmt. Confidence berücksichtigt Profilklarheit, Skill-Confidence, Warnungen und Build-Enabler mit erforderlicher Neuoptimierung; eine gültige Rotation kann daher niedrige Confidence besitzen. Gleichstände werden nach Skill-ID und anschließend durch deterministische Step-IDs aufgelöst.

Der Rotation Generator führt keine freie Erklärung, Zeit-, Cooldown- oder DPS-Simulation durch. Er liefert ausschließlich strukturierte Reason- und Constraint-Codes an den nachgelagerten, in Aufgabe 4I ausgebauten Explanation Generator. Zwölf ausdrücklich synthetische Fixture-Gruppen decken Mapping, Boss, Waffenwechsel, Effekte, fehlende Rollen, Complexity, `both` und Build-Enabler ab.

## Explanation Generator (Aufgabe 4I)

Der Explanation Generator liest ausschließlich die bereits erzeugten Equipment-, Skill-, Support-, Passive-, Jewel-, Unique- und Rotationsergebnisse. Er führt keinen Analyzer erneut aus, verändert keine Scores oder Empfehlungen und erzeugt keine neuen fachlichen Bewertungen. Der Orchestrator übergibt außerdem vorhandene deutsche Anzeigenamen; technische IDs dienen ausschließlich als transparenter Fallback.

### Templates und ExplanationEntry

Alle deutschen Texte stehen zentral in `src/engine/explanations/templates.ts`. Jedes `ExplanationTemplate` definiert Template-ID, Sektion, unterstützte ReasonCodes, Pflichtplatzhalter, zentrale Priorität, Schweregrad, deutschen Titel und Text sowie Aktivstatus. `config.ts` enthält Generatorversion, Prioritätsgruppen, Sektionsprioritäten und die kontrollierten Confidence-Texte. Analyzer-Dateien enthalten keine Erklärungstemplates.

Ein `ExplanationEntry` besitzt ID, Sektion, Priorität, Titel, Body, optionalen Kurztext, kontrollierten Ton, Quell-ReasonCodes und -IDs, Empfehlungsreferenzen, optionalen Impact, Confidence, Warnstufe, Status und Template-ID. Sektionen decken Zusammenfassung, Equipment, Haupt- und Zusatzskills, Supports, Passive, Juwele, Uniques, Mapping-/Bossrotation, Waffenwechsel, Affixverbesserungen, Konflikte, Warnungen, Confidence und Grenzen ab.

### Trace, Auflösung und Priorisierung

Zu jedem Eintrag existiert genau ein `ExplainabilityTrace` mit Erklärung und Template, Eingabe-ReasonCodes, Quell-IDs, aufgelösten Platzhaltern, ausgelassenen Gründen und Generatorversion. Vergleichsdaten enthalten keinen Zeitstempel. Unbekannte ReasonCodes werden nicht generisch erklärt, sondern deterministisch in `unresolvedReasonCodes` geführt. Fehlt ein deutscher Anzeigename, wird die technische ID verwendet und zusätzlich in `missingDisplayNames` gemeldet; Namen werden nicht erfunden.

Die zentrale Reihenfolge lautet: Blockierungen, Warnungen, Hauptskill, Rotation/Waffenwechsel, Equipment, Supports, Passive, Juwele/Uniques, Verbesserungen und allgemeine Hinweise. Gleichstände werden über Sektion, technische Quell-ID und Explanation-ID stabil aufgelöst. Rotationsschritte erhalten innerhalb ihrer Prioritätsgruppe eine aus der vorhandenen Schrittreihenfolge abgeleitete stabile Ordnung.

### Fachliche Erklärungsbereiche

Equipment-Texte erklären vorhandene Synergie-, Affix-, Konflikt- und Profilgründe. Skill-, Support-, Passive-, Jewel- und Unique-Texte verwenden ausschließlich deren ReasonCodes, Violations, Trade-offs und strukturierte Felder wie Pfadkosten, Set-Zuordnung, Replacement-Verdict oder Neuoptimierungsmarkierung. Confidence wird getrennt als hohe, mittlere oder niedrige Sicherheit erklärt.

Mapping- und Bossrotation werden Schritt für Schritt mit Reihenfolge, Aktion, Skillname, Set, Grund und kontrollierter Bedingung erklärt. Jeder tatsächlich vorhandene `switch-weapon-set`-Schritt erhält eine eigene Erklärung mit vorherigem/nächstem Set sowie benachbarten Skills. Persistenz, fehlende Persistenzangabe oder Verfall eines vorbereitenden Effekts werden nur anhand der Rotationsmetadaten genannt. Es werden keine nicht vorhandenen Wechsel, Sekunden oder Cooldowns ergänzt.

`ExplanationResult` bündelt Summary, Sektionen, alle sowie blockierende, warnende, positive und rotationsbezogene Einträge, sämtliche Traces, unaufgelöste ReasonCodes, fehlende Anzeigenamen, Confidence-Zusammenfassung, Grenzen, Status und Version. Ein nicht ausblendbarer Template-Hinweis erklärt stets, dass die Regeln und Daten synthetisch sind, keine DPS-Berechnung stattfindet und das Ergebnis keine fachlich verifizierte Buildempfehlung ist.

Der Generator besitzt keine KI-, LLM-, Netzwerk-, Zufalls-, Zeit- oder React-Abhängigkeit. Freie unkontrollierte Textgenerierung, echte PoE2-Daten, DPS-/Cooldown-/Zeitsimulation und UI-Anbindung bleiben ausgeschlossen. Elf synthetische Explanation-Szenarien und dedizierte Tests sichern Templates, Traces, Fallbacks, Priorisierung und Determinismus.

## Isolierte Pfadsuch-Grundlage (Aufgabe 5E)

`src/engine/passive-pathfinding/` ist ein eigenständiges Infrastrukturmodul neben der synthetischen Analyzer-Kette. Es übernimmt den normalisierten offiziellen Baum 0.5.2 in einen geprüften, wiederverwendbaren ungerichteten Graphen und berechnet deterministisch `shortest-path`, `lowest-cost-path` und schrittweise `connect-targets` für ausschließlich vorgegebene Ziele. Kosten, Budget, blockierte/belegte Knoten, erlaubte Typen, Aszendenz- und optionale Waffen-Set-Grenzen gehören zum Anfragevertrag.

Der vorhandene Passive Analyzer importiert oder verwendet das Modul nicht. Ebenso bleiben Orchestrator, UI und Baumdarstellung unberührt. Die Mehrzielstrategie ist ausdrücklich `shortest-per-step` und keine globale Steiner- oder Buildoptimierung. Vollständiger Vertrag und Messwerte: [`POE2_PASSIVE_PATHFINDING.md`](POE2_PASSIVE_PATHFINDING.md).

## Isolierte Zielknotenbewertung (Aufgabe 5F)

`src/engine/passive-targeting/` liegt als zweites echtes Baum-Infrastrukturmodul neben der synthetischen Analyzer-Kette. Es klassifiziert ausschließlich die normalisierten englischen Namen und Statzeilen des offiziellen Releases 0.5.2 über zentrale Regeln, gleicht erkannte Kategorien mit einem unveränderten `BuildProfile` ab und erzeugt strukturierte Einzelknotenbewertungen, Confidence, Ranglisten und einen gemessenen Coverage-Bericht.

Das Modul importiert weder `passive-pathfinding` noch den synthetischen Passive Analyzer. Pfadkosten, automatische Zielmengen, Baumbelegung, Orchestrator und UI bleiben ausgeschlossen. Node-IDs bilden nur eine dokumentierte spätere Adaptergrenze. Details und reale Messwerte stehen in [`POE2_PASSIVE_TARGETING.md`](POE2_PASSIVE_TARGETING.md).

## Isolierte begrenzte Passive-Planung (Aufgabe 5G)

`src/engine/passive-planning/` ist die einzige neue gerichtete Verbindung von 5F zu 5E: vorbereitete Empfehlungen fließen in einen früh auf 50 begrenzten Pool; inkrementelle Kosten kommen ausschließlich aus `findPassivePath`. Required-Ziele werden zuerst verbunden. Danach wird der beste positive Kandidat schrittweise anhand zentraler `value-first`-, `efficiency-first`- oder `balanced`-Gewichte an den Teilbaum angeschlossen. Nach jeder Auswahl erfolgt eine Neubewertung, damit gemeinsam belegte Pfadteile wiederverwendet werden.

Die Schicht besitzt Validierung, zentrale Nutzen-/Konflikt-/Redundanzabzüge, exakten Pfadrequest-Cache, Budget- und Sicherheitsgrenzen sowie einen reichen deterministischen Ergebnisvertrag. Aszendenzknoten sind vollständig ausgeschlossen, weil kein getrenntes Budget existiert. `optimalityClaim: heuristic` ist verbindlich. Targeting-Regeln und Pathfinder bleiben unverändert; Passive Analyzer, Orchestrator und UI importieren den Planer nicht. Details: [`POE2_PASSIVE_PLANNING.md`](POE2_PASSIVE_PLANNING.md).

## Isolierte reale Passive-Pipeline (Aufgabe 5H)

`src/engine/real-passive-pipeline/` ist ein neuer Entry Point außerhalb des Haupt-Orchestrators. Die gerichtete Abhängigkeit lautet `BuildProfile → evaluatePassiveTargets → planPassiveTargets`; der Planner nutzt seinerseits unverändert `findPassivePath`. Die Pipeline validiert Quelle und explizites Budget, löst den Klassenstart ausschließlich über offizielle `classStartIndex`-Zuordnung auf, baut genau einen Graph oder übernimmt einen vorbereiteten Graph und validiert anschließend Existenz, Eindeutigkeit, Zusammenhang, Budget, Quellversion und Aszendenzgrenze des Resultats.

Alle Teilresultate bleiben vollständig erhalten. Acht kontrollierte Stufen, Required-Target-Diagnosen, Issues mit Quellmodul/Stufe, Graph-/Targeting-/Planning-Diagnosen und ein laufzeitfreier kanonischer Resultathash bilden die Integrationsdiagnose. Die Pipeline führt keine Fachlogik der drei Module erneut aus und besitzt keine Abhängigkeit zu synthetischem Passive Analyzer, `analyzeBuild`, React oder Tree-ViewModel. Vollständiger Vertrag: [`POE2_REAL_PASSIVE_PIPELINE.md`](POE2_REAL_PASSIVE_PIPELINE.md).

## Nächste Module

Die geschlossene reale Passive-Pipeline ist technisch vorbereitet, aber nicht produktiv angebunden. Ein Adapter zum Haupt-Orchestrator erfordert eine ausdrückliche Entscheidung über Profilquelle, Budgeteingabe, Fehlerdarstellung und Laufzeitstrategie. UI-Anzeige, getrennte Aszendenzplanung, Juwelbelegung, Levelpfade, Targeting-Klassifikationscache, globale Baumoptimalität, weitere echte Daten und DPS bleiben getrennte Aufgaben.
## Geometriegrenze der Baumansicht (Nachbesserung 5D)

`src/tree-view/geometry.ts` ist die einzige Quelle finaler Weltkoordinaten für die technische Baumansicht. Release 0.5.2 liefert bereits absolute Knotenpositionen; der View-Adapter übernimmt sie validiert und unverändert. Hauptbaum-Bounds, Gesamtwelt-Bounds und layoutübergreifende Aszendenzreferenzen bleiben außerhalb von `src/engine/`. Pfadsuche, Targeting, Planner, reale Pipeline, Passive Analyzer und Haupt-Orchestrator sind unverändert. Aufgabe 5I ist nicht begonnen.
## Touch- und Aszendenzdarstellung 5D.2

Touchkamera, visuelle Charakterzuordnung und Aszendenz-Inset liegen vollständig unter `src/components/` und `src/tree-view/`. Die gerichtete Abhängigkeit endet beim vorhandenen UI-State; Engine, Analyzer, Pathfinder, Targeting, Planner, reale Pipeline und Haupt-Orchestrator bleiben unberührt. Aufgabe 5I ist nicht begonnen.
# UI-Darstellungsgrenze 5L

Der reale Compact-Plan fließt nach dem Worker ausschließlich durch `buildPassivePlanVisualization` in den Baumrenderer. Diese Grenze validiert und klassifiziert IDs, bewertet aber nichts neu. Targeting, Pathfinder, Planner, Pipeline und Haupt-Orchestrator importieren keine React- oder Baumdarstellungsmodule. Kamera, Rollen und Overlays sind Viewzustand und kein Engineinput. Keine automatische Budgetableitung; keine Affix-, Skill- oder Supportdatenänderung. Aufgabe 5M nicht begonnen.
# Technische Affixgrenze 5M.1

Die UI erzeugt ein normalisiertes `AppliedModifier` mit technischer Mod-/Statidentität und real eingegebenen Werten. BuildProfile und bestehender Worker transportieren dieses Objekt unverändert zum Equipment Analyzer; sichtbare Fallbacktexte entscheiden keine Engine-Regel. Die synthetische Bewertungssemantik ist weiterhin begrenzt und wird durch 5M.1 nicht als reale vollständige Berechnung ausgegeben.
