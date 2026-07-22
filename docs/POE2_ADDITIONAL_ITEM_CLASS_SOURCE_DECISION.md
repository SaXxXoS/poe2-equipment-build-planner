# 5M.1B.0A – Quellen- und Approval-Entscheidung für zusätzliche Itemklassen

> Abgrenzung 5M.1B.0C: Die neuen Socketable-Identitätsscopes ändern die bedingten Jewel-/Charm-/Flask-Scopes nicht. Socketables sind keine zusätzlichen normalen Itemklassen; Unique-Jewels/-Charms/-Flasks bleiben ausgeschlossen. Nichts wurde importiert.

> Abgrenzung nach 5M.1B.0B: Unique-Jewels, Unique-Charms und Unique-Flasks sind ausdrücklich nicht von den normalen Scopes dieses Dokuments umfasst. Das separate Unique-Audit hat keinen produktiven Scope freigegeben und keine Daten importiert.

## 1. Ziel und Ausgangslage

Diese Entscheidung betrifft ausschließlich technische Daten der RePoE-Itemklassen `Jewels`, `Charms`, `Life Flasks`, `Mana Flasks` und `Relics`. Ausgangspunkt ist Commit `828653bb4dce747fa58654ec91f1b104c7c4ae4a` und der unveränderte 5M.1-Pin:

- RePoE-PoE2 `4.5.4.4.4`
- Export `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`
- Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81`

5M.1A wies die fünf Klassen als außerhalb der festen 29-Klassen-Allowlist nach. 5M.1B.0A importiert keine Daten. Die neun generierten 5M.1-Dateien, Register, UI, BuildProfile, Worker und Analyzer bleiben unverändert.

## 2. Zählregeln und erneute Prüfung

- Referenzvorkommen: jedes Auftreten einer Mod-ID in einer Basistyp-/Taggruppe von `mods_by_base.json`; Duplikate eingeschlossen.
- eindeutige Mod-ID: Union dieser Referenzen innerhalb einer Itemklasse.
- Basis-Implicit: Mod-ID aus `base_items.json[].implicits`; separat von `mods_by_base`.
- Statzeile: ein `mods.json[].stats[]`-Element.
- Tier: eine technische Mod-ID innerhalb ihrer Side/Familie; diese Aufgabe erzeugt keine Tiers.
- „exklusiv neu“: ID liegt nicht unter den 1.828 bestehenden Produktivrecords. Das bedeutet noch nicht „freigegeben“ oder „importiert“.

| Klasse | Referenzvorkommen | eindeutige `mods_by_base`-IDs | Basistypen | zusätzliche Basis-Implicits | Union | Überschneidung 5M.1 |
|---|---:|---:|---:|---:|---:|---:|
| Jewels | 1.986 | 446 | 9 | 1 | 447 | 0 |
| Charms | 51 | 51 | 13 | 13 | 64 | 0 |
| Life Flasks | 57 | 57 | 9 | 0 | 57 | 0 |
| Mana Flasks | 52 | 52 | 9 | 0 | 52 | 0 |
| Relics | 139 | 137 | 7 | 0 | 137 | 0 |

Die 5M.1A-Zahlen 446/51/57/52/137 sind damit als eindeutige `mods_by_base`-IDs bestätigt. Sie sind keine sichtbaren Texte, Familien- oder Statzeilenzahlen.

## 3. Jewels

Der Export führt neun Basistypen: drei normale Attribut-Jewels, Diamond/Timeless-Varianten und vier technisch als Radius-Jewels markierte Basen. Ein eigener Cluster-Jewel-Basistyp wurde in dieser Klasse nicht nachgewiesen. Vier Radiusbasen referenzieren `JewelRadiusImplicit`; Radiuswirkung und betroffene Passive sind durch reine Moddaten nicht vollständig abgebildet.

| Side | IDs | Statzeilen | Mehrzeiler | lokale Stat-ID enthalten | Gruppen | Level |
|---|---:|---:|---:|---:|---:|---:|
| prefix | 142 | 144 | 2 | 2 | 66 | 1 |
| suffix | 178 | 178 | 0 | 2 | 87 | 1 |
| corrupted | 11 | 11 | 0 | 0 | 11 | 1 |
| unique | 115 | 121 | 6 | 0 | 87 | 1 |
| Basis-Implicit | 1 | 1 | 0 | 0 | 1 | 1 |

Alle Mods liegen in Domain `misc`; alle 446 `mods_by_base`-IDs besitzen Spawnweights. Das Basis-Implicit ist nicht spawnend. Die 115 `unique`-Side-IDs sind keine Freigabe für Unique-Jewels. Corrupted-, Unique-, Radius-/Passive- und Clustermechaniken bleiben gesperrt.

Architektur: Ein separates Jewel-Domainmodell, `selectedJewels`, Worker-Kandidaten und ein synthetischer Jewel Analyzer existieren. Sie verwenden jedoch fertige `JewelDefinition`-Kandidaten und Passive-/Socketsemantik; ein reiner Modimport reicht für Radius, Timeless oder andere besondere Mechaniken nicht. Normale Prefix-/Suffix-Technikdaten sind „wichtig für vollständige Builds“, benötigen vor Produktivnutzung aber einen getrennten Adapter und fachliche Analyzerprüfung.

Entscheidung: `conditionally-approved` nur für die 320 normalen Prefix-/Suffix-IDs und ihre technischen Felder. Unique-/corrupted-Sides und `JewelRadiusImplicit` sind nicht freigegeben.

## 4. Charms

13 Basistypen liegen in Domain `flask`. Jeder besitzt ein festes, nicht spawnendes Basis-Implicit für eine technische Auslösebedingung sowie `charges_max`, `charges_per_use` und `duration`. Die 51 `mods_by_base`-IDs teilen sich in 27 Prefixe und 24 Suffixe; mit Implicits umfasst die technische Union 64 IDs und 64 Statzeilen.

- Prefixe: Level 1–78, 27 Statzeilen, 5 mit lokaler Stat-ID, zwei Gruppen.
- Suffixe: Level 1–83, 24 Statzeilen, alle mit lokaler Stat-ID, vier Gruppen.
- Implicits: 13 `unique`-Generation-IDs, je einem Basistyp zugeordnet, nicht spawnend.
- Keine corrupted- oder sonstige Side wurde in `mods_by_base["Charms"]` nachgewiesen.

Architektur: Kein Charm-Slot, kein Charm-Domainmodell, keine UI-Auswahl und kein Charm-Analyzer existieren. Das generische EquipmentEntry könnte technische IDs tragen, bildet aber Ladungen, Trigger und Dauer nicht fachlich ab. Ein Import allein würde daher keine Produktunterstützung bedeuten.

Relevanz: wichtig für vollständige Builds. Entscheidung: `conditionally-approved` für Prefixe, Suffixe, eindeutig referenzierte Basis-Implicits und minimale Basiseigenschaften; keine Trigger-/Ladungssimulation und keine Skills.

## 5. Life Flasks

Neun Basistypen liegen in Domain `flask`; feste Eigenschaften sind `charges_max`, `charges_per_use`, `duration` und `life_per_use`. Diese Basiswerte sind keine Affixe.

- 57 eindeutige Referenzen: 33 Prefixe und 24 Suffixe.
- 63 Statzeilen; sechs Prefixe sind mehrzeilig.
- alle 57 besitzen Spawnweights und liegen bei erforderlichem Itemlevel 1–83.
- alle 33 Prefixe und 24 Suffixe enthalten mindestens eine lokale Stat-ID.
- keine Implicits, corrupted-Side oder Enchantment-Referenz in der geprüften Klasse.

Architektur: Kein Flask-Slot/-Domainmodell/-Analyzer und keine Simulation von Wiederherstellung, Dauer oder Ladungen. Ein technisches Register ist möglich, produktive Bewertung nicht. Relevanz: wichtig für vollständige Builds, aber eigener Analyzer/Slot vor UI-Aktivierung erforderlich.

Entscheidung: `conditionally-approved` für technische Prefix-/Suffix- und erforderliche Basistypfelder. Flask-Simulation, Quality-Regeln, Enchantments und Corruption bleiben gesperrt.

## 6. Mana Flasks

Mana Flasks wurden getrennt geprüft. Neun Basistypen besitzen `charges_max`, `charges_per_use`, `duration` und `mana_per_use`.

- 52 eindeutige Referenzen: 28 Prefixe und 24 Suffixe.
- 58 Statzeilen; sechs Prefixe sind mehrzeilig.
- alle besitzen Spawnweights, Level 1–83 und Domain `flask`.
- alle Prefixe und Suffixe enthalten lokale Stat-IDs.
- keine Implicits, corrupted-Side oder Enchantment-Referenz in der geprüften Klasse.

Architektur und Freigabegrenze entsprechen Life Flasks, ohne die Kategorien fachlich gleichzusetzen. Entscheidung: `conditionally-approved` im gemeinsamen Flask-Scope, aber ausschließlich bei explizitem `itemCategory=Mana Flasks`.

## 7. Relics

Sieben Basistypen unterscheiden sich durch Größen-/Content-Tags. Alle 137 eindeutigen IDs liegen in Domain `sanctum_relic`: 69 Prefixe, 67 Suffixe und eine corrupted-ID. Es bestehen 139 Referenzvorkommen, 137 Statzeilen, keine Mehrzeiler, keine Implicits und Level 1–80.

Der Export belegt damit Sanctum-/Spezialcontent, nicht einen permanenten normalen Equipment-Slot. Das Projekt besitzt weder Relic-Slot noch Domainmodell, UI, Workerfeld, Analyzer oder Orchestratorpfad. Aufnahme in Version 1 als normale Ausrüstung wäre irreführend.

Relevanz: nur für Spezialcontent. Entscheidung: `deferred`/maschinenlesbar `pending`; kein Feld und keine Quelldatei ist für Import freigegeben. Die corrupted-ID bleibt zusätzlich im Spezialmod-Scope gesperrt.

## 8. Quellen- und Parserpfade

RePoE reicht als technische Hauptquelle für die eng begrenzzten Entscheidungen aus:

- `version.txt`: exakte Exportversion,
- `data/item_classes.json`: Klassen-ID und technische Klasse,
- `data/base_items.json`: Basistyp-ID, Klasse, Tags, Implicits und minimale technische Basiseigenschaften,
- `data/mods_by_base.json`: Basistyp-/Tag-/Side-/Familienzuordnung,
- `data/mods.json`: Mod-ID, Stats, Werte, Level, Generation Type, Domain, Tags, Spawnweights und Gruppen,
- `data/tags.json`: technische Tagtaxonomie.

Der gepinnte Parser verarbeitet diese Strukturen getrennt unter `repoe/parser/poe2/base_items.py`, `mods.py` und `mods_by_base.py`. Er normalisiert technische Felder, bildet aber keine vollständige Jewel-Radius-/Passivwirkung, Charm-/Flask-Simulation oder normale Equipment-Semantik für Sanctum-Relics.

Path of Building PoE2 und poe2-mcp bleiben ausschließlich Kontrollquellen aus 5M.1A. Keine zusätzliche Quelle oder Parserlogik wurde produktiv freigegeben oder übernommen.

## 9. Feldumfang

Alle freigegebenen Scopes erlauben nur: technische Itemklassen- und Basistyp-ID, Mod-/Stat-ID, Generation Type, Domain, Side, Tierableitung, Wertebereich, Itemlevel, Tags, Spawnweights, Gruppen/Konfliktgruppen, Lokal-/Hybridkennzeichnung, mehrere Statzeilen, Source-Version und Source-Referenz. Charm/Flask dürfen zusätzlich die minimal erforderlichen technischen Basiswerte verwenden.

Ausgeschlossen bleiben insbesondere: Namen/Displaytexte, deutsche Stattexte, Flavour/Lore, Bilder/Icons/Audio/Modelle, vollständige Rohspiegel, Dropchancen/-orte, Preise/Trade, Unique-Definitionen/-Mods/-Varianten, Runen, Soul Cores, Desecrated/Mutated, Skills, Supports, Passive-Jewelmechaniken, Flask-Simulation/Quality/Enchantments, Medien, Laufzeitabrufe und Hotlinks.

## 10. Scope-Design und Entscheidung

Getrennte Scopes sind erforderlich, weil Datenstruktur, Architektur und Risiko verschieden sind:

| Scope | Kategorie | Status | Version-1-Empfehlung |
|---|---|---|---|
| `poe2-technical-jewel-mod-data-for-build-planner` | normale Jewel-Prefixe/-Suffixe | conditionally-approved | nächster technischer Import; besondere Mechaniken getrennt |
| `poe2-technical-charm-mod-data-for-build-planner` | Charm-Affixe/Basis-Implicits | conditionally-approved | technisches Register, produktive UI erst mit Architektur |
| `poe2-technical-flask-mod-data-for-build-planner` | Life-/Mana-Flask-Technik | conditionally-approved | gemeinsamer Import möglich, Klassen getrennt halten; Analyzer später |
| `poe2-technical-relic-mod-data-for-build-planner` | Sanctum Relics | pending/deferred | aus Version 1 ausschließen |

Der bestehende Scope `poe2-technical-affix-data-for-build-planner` wurde nicht erweitert. `normal-jewels`, `cluster-jewels` und alle Unique-Kategorien bleiben in ihren bisherigen blockierten Kategorien bestehen.

## 11. Bedingungen, Risiken und Widerrufbarkeit

Jeder bedingte Scope verlangt exakte Version, Export- und Parsercommit, Approval-Guard vor Verarbeitung, erlaubte Datei und Felder, Itemkategorie, SHA-256-Manifest, deterministische Normalisierung, lokale getrennte Ableitung, Attribution und GGG-Rechtehinweis. Rohspiegel, Runtime-Fetch und Hotlinks müssen explizit `false` sein. Release-, Schema-, Lizenz- oder Nutzungsänderungen verlangen manuelle Neubewertung.

RePoE-Software steht unter MIT; daraus folgt keine Lizenz an generierten GGG-Spieldaten. Diese Entscheidung ist eine enge, widerrufbare Projektrisikoentscheidung, keine allgemeine GGG-Datenlizenz, kein Eigentumsanspruch und keine Weiterfreigabe außerhalb des Projektscopes. Die getrennten Ausgaben müssen mit einem Commit entfernbar sein.

## 12. Guard und Bedeutung der Freigabe

Der Guard validiert für constraint-basierte Scopes Pins, Kategorie, Quelldatei, Feldmenge, Negativkategorien, Manifest, Determinismus, Rohspiegel, Runtime-Fetch und Hotlinks. Ein fehlender oder abweichender Wert blockiert. Der Relic-Scope wird bereits durch seinen Status blockiert.

Approval bedeutet weder Import noch UI-, Engine-, Worker- oder Lokalisierungsunterstützung und keine vollständige Itemdatenbank. Der aktuelle Produktivbestand bleibt 1.828 Mods/29 Klassen.

## 13. Offene Fragen und Folgeaufgabe

Unbekannt bleiben ohne spätere Facharbeit: korrekte passive Radius-/Timeless-Semantik, vollständige Charm-Triggerbewertung, Flask-Wiederherstellungs-/Ladungsmodell und der gewünschte Produktumfang für Sanctum. Unique-Jewels, Cluster Jewels und sämtliche speziellen Mods benötigen getrennte Entscheidungen.

Empfohlener nächster Schritt ist 5M.1B als **reiner technischer Import** der freigegebenen normalen Jewel-, Charm- und Life-/Mana-Flask-Daten in getrennte generierte Register. Relics bleiben ausgeschlossen. Vor produktiver Auswahl sind danach getrennte Slot-/Analyzer-/UI-Aufgaben erforderlich. 5M.1B.0B, 5M.1B.0C, 5M.2 und 5N wurden nicht begonnen.

## 14. Schlussfolgerung

Jewels, Charms sowie Life- und Mana-Flasks besitzen am fest gepinnten RePoE-Stand eine ausreichende technische, reproduzierbare Basis für eng begrenzte conditionally-approved Teilscopes. Relics sind nachweislich Sanctum-Spezialcontent und bleiben deferred. Es wurden keine Mods importiert und keine Produktfunktion erweitert.
> Status 5M.1B: Jewels, Charms, Life Flasks und Mana Flasks sind eng importiert; Relics bleiben deferred, Socketable-Identitäten nicht produktiv importiert.
