# Engine-UI-Integrationsaudit

## Technische Baumansicht aus Aufgabe 5D

Der offizielle Baumstand 0.5.2 wird nun ausschließlich zur technischen Darstellung über `ImportedPoe2Tree → PassiveTreeViewModel → PassiveTree` geführt. Dies ist keine Engine-UI-Integration: Der Adapter verarbeitet keine `PassiveAnalysis`, keine Scores, Pfade, Punkte oder Empfehlungen. Suche, Filter sowie Klassen-/Aszendenzzentrierung sind reine Ansichtsoperationen und verändern weder Charakter- noch Buildstate. Der bisherige synthetische Sieben-Knoten-Baum wird nicht mehr gerendert; die synthetischen Engine-Fixtures bleiben für Tests bestehen.

Stand: 20. Juli 2026. Dieses Audit beschreibt den Quellcode nach Aufgabe 4I. Es implementiert keine Engine-UI-Anbindung. Bei Widersprüchen ist der Quellcode maßgeblich.

## Ergebnis

Die UI und die synthetische Engine sind technisch getrennt und dürfen vor dem geplanten mobilen Redesign nicht direkt gekoppelt werden. Die UI verwendet `BuildResult` aus `src/domain/build.ts` und feste Daten aus `src/data.ts`; die Engine erzeugt dagegen das wesentlich umfangreichere `BuildAnalysis` aus `src/engine/common/types.ts`. Eine spätere Integration benötigt einen Eingabeadapter, einen Ergebnisadapter, eine stabile ID-Strategie und freigegebene Kandidatendaten.

## Bestehender UI-Datenfluss

| UI-Datum/Funktion | Datei und Typ/State | Heutiger Status | Lücke zu `BuildInput`/Engine |
|---|---|---|---|
| Klasse | `src/App.tsx`, `character: CharacterConfiguration`; `CharacterSection.tsx` | Kontrolliertes Select mit stabiler Klassen-ID | Ableitbar; ID muss gegen freigegebenen Kandidatendatensatz validiert werden |
| Aszendenz | dieselben Dateien, `character.ascendancyId` | Nach Klasse gefiltertes Select | Ableitbar; Klassenbeziehung und ID müssen validiert werden |
| Level | `CharacterSection.tsx`, `character.level` | Number-Input 1–100 | Ableitbar; Adapter muss Ganzzahl und Engine-/Datenanforderungen prüfen |
| Zielprofil | `character.goalProfile` | `balanced`, `mapping` oder `boss` | `BuildInput` besitzt zusätzlich `goalProfile`; Adapter muss eine eindeutige Quelle festlegen |
| Optionaler Hauptskill | `character.desiredMainSkillId` | Select aus den ersten drei lokalen Skills | Ableitbar, aber UI-Auswahl und spätere Kandidatenliste müssen dieselben IDs verwenden |
| Equipment-Slots | `App.tsx`, `equipment: EquipmentEntry[]`; `EquipmentSection.tsx` | Zwölf lokale Einträge aus `initialEquipment` | Ableitbar; Slotdefinitionen, Vollständigkeit und Setzuordnung müssen validiert werden |
| Affixe | `EquipmentEntry.modifierValues`; `AffixDialog.tsx` | Lokale Modifier-ID plus Zahl/Range; UUID nur für angewendeten UI-Eintrag | Ableitbar; Modifier-ID, Wertebereich, Duplikate und Slotzulässigkeit müssen normalisiert werden |
| Waffen-Set 1/2 | Slotdefinitionen in `src/data.ts`; Skill-Selects in `SkillsSection.tsx` | Vier Waffenslots und Setwahl je Skill sichtbar | Equipment-Set aus Slotdefinition ableitbar; Verfügbarkeit/Waffenart fehlt als explizite UI-Eingabe |
| Skillsetups/Supports | `App.tsx`, `setups: SkillSetup[]`; `SkillsSection.tsx` | Sechs feste Skills, feste Supports, änderbar ist nur das Waffen-Set | Als `skillSetups` ableitbar; freie Skill-/Supportauswahl, Kandidatenstatus und Metadaten fehlen |
| Juwelauswahl | lokaler State innerhalb `JewelsSection.tsx` | Je zwei lokale Normal-/Cluster-/Unique-Cluster-Slots | Nicht aus `App` ableitbar und nicht in `BuildInput.selectedJewels` überführt |
| Passiver Baum | `PassiveTree.tsx`, lokaler Zoom/Pan/Full-State | Reiner Demonstrationsbaum mit festen Knoten | Keine Auswahl oder vollständige Kandidaten-/Pfadinformation für die Engine |
| Berechnung | `App.tsx`, `calculate()` | Setzt nur `calculated=true` und scrollt zum Ergebnis | Erstellt keinen `EngineRequest` und ruft `analyzeBuild` nicht auf |
| Ergebnis | `BuildResultSection.tsx`, `BuildResult` | Rendert `buildResult` aus `src/data.ts` | Kein Adapter von `BuildAnalysis`; angezeigte Texte und Rotationen sind feste Platzhalter |

Der vorhandene Prototyp-Hinweis in Header, Ergebnis und Footer kennzeichnet die synthetische Testversion bereits ausreichend. Es wurde kein weiterer UI-Hinweis ergänzt.

## Tatsächlicher Engine-Eingabevertrag

Der Einstiegspunkt ist `analyzeBuild(request, context?, modifiers?)` in `src/engine/orchestration/analyze-build.ts`.

### `EngineRequest`

- `input: BuildInput` ist verpflichtend:
  - `character: CharacterConfiguration` mit Klasse, Aszendenz, Level, Ziel und optionalem Hauptskill.
  - `equipment: EquipmentEntry[]` mit Slot-ID und angewendeten Modifiern.
  - `skillSetups: SkillSetup[]`.
  - `selectedJewels: JewelSelection[]`.
  - `goalProfile: GoalProfile`; derzeit zusätzlich zum Ziel im Charaktermodell.
- `candidates: EngineCandidates` ist verpflichtend:
  - `skills: SkillGemDefinition[]`.
  - `supports: SupportGemDefinition[]`.
  - `passives: PassiveCandidate[]` einschließlich optionaler Knoten, Verbindungen, Cluster, Kosten und Erreichbarkeit.
  - `jewels: AnyJewelDefinition[]`.
  - `uniques: UniqueCandidate[]`.

### Weitere Argumente

- `AnalyzerContext` ist optional und besitzt Engine-Version, zwingenden Fixture-Modus und optionalen Modul-Trace. Der Default bleibt ausdrücklich ein Platzhalterkontext.
- `modifiers: ModifierDefinition[]` ist ein separates optionales Argument. Ohne passende Definitionen können Equipment-Referenzen blockieren.
- Rotationsmetadaten liegen optional auf `SkillGemDefinition` und in den vorgelagerten Empfehlungen; es gibt kein separates UI-Rotationsformular.
- Anzeigenamen stammen aus `GameDataMetadata.displayNameDe` der Kandidaten und Definitionen. Der Orchestrator baut daraus die Explanation-Namensauflösung.

### Herkunftsklassifikation

| Vertragsbereich | Bereits aus UI ableitbar | Derzeit Fixture/lokal | Später freigegebener Datenbestand nötig | Kein stabiles UI-Feld |
|---|---:|---:|---:|---:|
| Klasse, Aszendenz, Level, Ziel | ja | ja | für echte Definitionen ja | nein |
| Equipment-Slot- und Modifierwerte | überwiegend | ja | Slot-/Modifierdefinitionen ja | Waffenart/Verfügbarkeit teilweise |
| SkillSetups | teilweise | ja | Skill-/Supportdefinitionen ja | freie Auswahl fehlt |
| ausgewählte Juwele | Komponente kennt Auswahl | ja | Jeweldefinitionen ja | zentraler State fehlt |
| Skill-/Supportkandidaten | nein | ja | ja | ja |
| Passive-Kandidaten/Graph | nein | ja | ja | ja |
| Jewel-/Unique-Kandidaten | nein | ja | ja | ja |
| Rotationsmetadaten | nein | ja | fachlich validierte Skillmetadaten ja | ja |
| Anzeigenamen/Versionen/Provenienz | nein | ja | ja | ja |

## Zukünftige Adaptergrenze

```text
UIState
  → BuildInputAdapter
  → EngineRequest + AnalyzerContext + ModifierDefinition[]
  → analyzeBuild
  → BuildAnalysis
  → BuildResultViewModel
  → React-UI
```

`BuildInputAdapter` soll UI-State sammeln, Zielduplikate auflösen, IDs gegen einen versionierten Datensatz prüfen, Zahlen normalisieren, Slot-/Setbeziehungen herstellen, Juwelstate übernehmen und strukturierte Validierungsfehler liefern. Kandidatendaten dürfen nicht aus React-Komponenten zusammengesetzt werden; sie kommen aus einem freigegebenen, versionierten Repository-Layer.

`BuildResultViewModel` soll nur die für einen Bildschirm benötigten, bereits priorisierten Daten auswählen, technische IDs über vorhandene Anzeigenamen auflösen und Status, Confidence, Blockierungen und synthetischen Datenstatus erhalten. Es darf weder Scores neu berechnen noch Empfehlungen umsortieren.

Vor dem Engine-Aufruf sind Schema, IDs, Level, Wertebereiche, Slotzulässigkeit, Setverfügbarkeit, doppelte Eingaben und Kandidatendatenversion zu prüfen. Bei fehlenden Kandidaten wird nicht mit Teilwissen weitergerechnet: Die UI zeigt einen strukturierten Daten-/Konfigurationsfehler. Blockierte Analysen bleiben sichtbar und dürfen nicht als Erfolg dargestellt werden. `placeholder`/`experimental` muss bis zu ViewModel und UI durchgereicht werden.

Engine-Typen werden nicht direkt auf viele React-Komponenten verteilt. Vorgesehen sind ein einziger Anwendungsservice und zwei Adapter mit Vertragstests.

## UI-zu-Engine-Ergebnismatrix

| UI-Bereich | Engine-Ausgabe | Bereits darstellbar | ViewModel | Zusätzliche UI | Echte Daten | Früheste Integration |
|---|---|---:|---:|---:|---:|---|
| Charakterprofil | `BuildProfile` / `EquipmentAnalysis` | teilweise | ja | kompakte Profil-/Warnungsansicht | ja | nach Redesign und Adaptervertrag |
| Skills | `SkillAnalysis` | Karten vorhanden | ja | Ranking, blockierte Zustände, Confidence | ja | erste Minimalintegration |
| Supports | `SupportAnalysis` | feste Slots vorhanden | ja | Einzelgründe/Trade-offs | ja | nach Skillauswahl |
| Passive Tree | `PassiveAnalysis` | nur Testbaum | ja | Kandidaten-/Pfadstatus | ja | später; keine Gesamtoptimierung behaupten |
| Normale Juwele | `JewelAnalysis` | Picker vorhanden | ja | Rang/Blockierung | ja | nach zentralem Juwelstate |
| Cluster-Juwele | `JewelAnalysis` | Picker vorhanden | ja | Kosten/Effizienz | ja | später |
| Unique-Cluster | `JewelAnalysis` | Picker vorhanden | ja | Enabler-/Trade-off-Hinweise | ja | später |
| Uniques | `UniqueAnalysis` | Ergebnisliste vorhanden | ja | Replacement/Neuoptimierung | ja | später |
| Mapping-Rotation | `RotationAnalysis.mappingRotation` | Platzhalterbereich vorhanden | ja | Stepstatus/Conditions | Metadaten ja | nach Skill-/Setintegration |
| Boss-Rotation | `RotationAnalysis.bossRotation` | Platzhalterbereich vorhanden | ja | Maintenance/Warnings | Metadaten ja | nach Skill-/Setintegration |
| Erklärung | `ExplanationResult` | Textbereich vorhanden | zwingend | Sektionen, Tone, Trace optional | Anzeigenamen ja | nach erster Ergebnisintegration |
| Affixverbesserungen | `EquipmentAnalysis` / `ExplanationResult` | Liste vorhanden | ja | Konflikt-/Bedarfsdetails | Modifierdaten ja | erste Minimalintegration möglich |

## Integrationsrisiken

Bewertung: Wahrscheinlichkeit `niedrig`, `mittel`, `hoch`; Auswirkung `niedrig`, `mittel`, `hoch`, `kritisch`.

| Risiko | Auswirkung | Wahrscheinlichkeit | Gegenmaßnahme | Frühester Schritt |
|---|---|---|---|---|
| Unterschiedliche UI-/Engine-IDs | kritisch | hoch | zentraler Datensatz, ID-Migrations- und Adaptertests | vor jeder Integration |
| UI-State ist weniger normalisiert | hoch | hoch | `BuildInputAdapter` mit Schema-/Referenzprüfung | direkt nach Redesign |
| Fixture-Kandidaten wirken wie echte Daten | kritisch | hoch | Status sichtbar halten; keine Produktfreigabe ohne Datenaudit | sofort/fortlaufend |
| Sehr großes `BuildAnalysis` | mittel | hoch | bereichsspezifisches ViewModel, keine Komplettübergabe an jede Komponente | erste Integration |
| Große Ranglisten auf Mobilgeräten | hoch | hoch | priorisierte Kurzlisten, progressive Details im Redesign | mobiles Redesign |
| Blockierte Kandidaten werden übersehen | hoch | mittel | eigene blockierte Darstellung vor positiven Ergebnissen | erste Ergebnisansicht |
| Confidence/Warnungen werden als Qualität missverstanden | hoch | mittel | feste Labels und Erklärung, keine Farbsemantik allein | Redesign/ViewModel |
| Passive-Ergebnis wird als Gesamtbaum verkauft | kritisch | mittel | klare Kandidaten-/Fixture-Kennzeichnung | vor Passive-UI |
| Explanation wirkt wie echte Beratung | kritisch | hoch | nicht ausblendbaren synthetischen Begrenzungshinweis übernehmen | erste Explanation-UI |
| Synchroner Aufruf wird bei großen Daten langsam | hoch | mittel | Messung, Datenbegrenzung; Worker erst nach belegtem Bedarf | nach echten Testdaten |
| Keine fachlich validierten Referenzergebnisse | kritisch | hoch | kuratierte Referenzfälle und Review-Gate vor Produktstatus | vor echten Empfehlungen |

## Integrationsentscheidung

Nach der Pages-basierten mobilen UI-Überarbeitung ist als kleinste sinnvolle Integrationsaufgabe ein nicht produktiver Adapter-Vertical-Slice vorgesehen: zentraler `UIState`, reiner `BuildInputAdapter`, Aufruf über einen Anwendungsservice und ein kleines `BuildResultViewModel` für Equipmentwarnungen plus Top-Hauptskill. Vorher müssen Charakter/Ziel als eindeutige Quelle, zentraler Juwelstate, Equipment-/Modifier-IDs und frei wählbare beziehungsweise bewusst feste Skillsetups stabilisiert werden.

Zuerst sichtbar werden sollten Datenstatus, blockierende Fehler, Equipmentprofil/Affixwarnungen und genau eine Top-Skill-Empfehlung mit Confidence. Vollständige Ranglisten, Passive-Pfade, Cluster-/Unique-Enabler, Rotationen und umfassende Erklärungen bleiben zunächst verborgen. Sämtliche Kandidaten bleiben Fixtures, bis das Datenfreigabeaudit vollständig freigegeben ist. Die unverletzbare Grenze lautet: React kennt ViewModels und Adapterfehler, nicht die internen Analyzer oder deren Auswahl-/Scoringlogik.
