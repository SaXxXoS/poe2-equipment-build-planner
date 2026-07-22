# 5M.0 – Quellenentscheidung für reale PoE2-Affixdaten

Stand: 22. Juli 2026. Diese technische Projektentscheidung ist keine Rechtsberatung und behauptet keine allgemeine Lizenz von Grinding Gear Games (GGG).

> 5M.1B.0A ergänzt ausschließlich neue, getrennte Approval-Teilscopes: normale Jewel-Mods, Charms und Life-/Mana-Flasks sind unter exakten Pins und Negativgrenzen `conditionally-approved`; Relics bleiben `pending`. Der bestehende 5M.1-Scope ist unverändert. Kein Import, keine UI-/Enginearbeit und keine Lokalisierung erfolgte.

> Audit 5M.1A: 5M.1 deckt eine feste Auswahl von 29 Itemklassen ab, nicht alle PoE2-Gegenstandsmodifikatoren. Ausgeschlossene RePoE-Klassen, Unique-Daten und Socketables benötigen getrennte Folgeentscheidungen. Path of Building PoE2 und poe2-mcp wurden ausschließlich als commit-gepinnte Kontrollen untersucht. Keine Quelle, Kategorie oder Lokalisierung wurde zusätzlich freigegeben; `data-sources/source-approval.json` blieb bytegleich.

## Entscheidung

`repoe-poe2` wird ausschließlich im Scope `poe2-technical-affix-data-for-build-planner` als `conditionally-approved` geführt. Maßgeblich ist der unveränderliche Exportcommit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, dessen `version.txt` den Spiel-/Exportstand `4.5.4.4.4` nennt. Der zugehörige RePoE-Parser wurde bei Commit `14e3edc89ed705bd4e4eda5c8135756431c76e81` geprüft.

Die Entscheidung erlaubt noch keinen ungeprüften Import. Ein 5M-Importer muss vor jedem Abruf den Approval-Guard mit allen Pflichtbedingungen passieren, exakt diese Commits verwenden, jede tatsächlich gelesene Quelldatei mit SHA-256 manifestieren und nur die erlaubten technischen Felder normalisieren. Ein Commit- oder Versionswechsel verlangt eine neue Prüfung.

## Getrennte Rechts- und Technikschichten

1. **Programmcode:** RePoE steht unter MIT. Path of Building enthält eine MIT-Lizenz sowie Hinweise für eingebettete Drittkomponenten.
2. **Generierte/enthaltene Daten:** RePoEs Lizenzdatei erklärt ausdrücklich, dass Inhalte der generierten `data`-Dateien GGG gehören und nur im Einklang mit GGGs Bedingungen verwendet oder veröffentlicht werden dürfen. Die MIT-Lizenz ist daher keine GGG-Datenlizenz.
3. **GGG-Spieltexte und -daten:** GGG stellt keinen allgemeinen PoE2-Affixexport bereit. Rechte und Weiterverteilung bleiben rechtlich nicht ausdrücklich geklärt.
4. **Technische Nutzbarkeit:** RePoE ist maschinenlesbar und bildet die für 5M benötigten technischen Beziehungen am vollständigsten ab.
5. **Projektinterne Risikoentscheidung:** Das Projekt akzeptiert bedingt nur einen minimierten, attributierten, austauschbaren technischen Ableitungsbestand. Eine allgemeine Nutzungserlaubnis wird nicht behauptet.

## Geprüfte Quellen

| Quelle | Pin | Herkunft und Lizenz | Technische Abdeckung | Entscheidung |
|---|---|---|---|---|
| `repoe-fork/poe2` | `4.5.4.4.4`, `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c` | Mit RePoE/PyPoE aus GGG-Spieldateien erzeugter Export; keine eigene Datenlizenz im Exportrepository | `mods`, `mods_by_base`, `base_items`, `item_classes`, `tags`, Statbeschreibungen, IDs, Bereiche, Spawngewichte, Gruppen, Domains und Generation Types; Schema-/Releaseabweichungen möglich | Primäre technische Quelle, eng bedingt |
| `repoe-fork/repoe` | `14e3edc89ed705bd4e4eda5c8135756431c76e81` | Parsercode MIT; Lizenz trennt GGG-generierte Daten ausdrücklich vom Softwaregrant | Dokumentierte JSON-Schemas und Parser für Mods, Stats und Basistypen; Filter/Whitelists können Datensätze ausschließen | Parser- und Schemaherkunft, nicht alleiniger Datenpin |
| `brather1ng/RePoE` | `8023a1d696dbddc836c05ac3fcedd072da1767d2` | ursprüngliches RePoE; seit 2022 nicht der aktuelle PoE2-Export | Historische Grundlage, für den aktuellen PoE2-Stand ungeeignet | Nicht ausgewählt |
| `PathOfBuildingCommunity/PathOfBuilding-PoE2` | `f5b94342eeea413a94c339af3e881c5e2a4df0df`; letzter geprüfter Release `v0.22.0` | Build-Planner-Code MIT, zahlreiche Drittkomponenten; enthaltene Lua-Daten sind abgeleitete Spieldaten ohne separate GGG-Freigabe | Breite Bases-, Mod-, Statbeschreibungs- und Berechnungsdaten, aber stark auf PoBs Laufzeitmodell zugeschnitten; keine neutrale vollständige Spawnregelquelle garantiert | Nur Audit-/Plausibilisierungskandidat, nicht Importquelle 5M |
| `PathOfBuildingCommunity/PathOfBuilding-PoE2-v2` | `7e047f0e86c5539b6fe983606c209066c3569083` | gleiche grundsätzliche Lizenztrennung; Repository ist archiviert | historischer Vorläufer, geringere und veraltete Abdeckung | Nicht ausgewählt |
| vorhandenes Projekt | `main` vor 5M.0: `7ac24adb387939d8a462963fb0a35273bc437e9e` | synthetische Fixtures und vereinfachte lokale Platzhalter | kein vollständiger realer Affix-, Tier-, Stat- oder Itemklassendatensatz | Keine reale Quelle vorhanden |
| PoE2DB | nur manuelle sichtbare Referenz | Community-Wiki; Disclaimer ordnet Spieltexte/-elemente GGG zu, CC-Hinweis ist nicht eindeutig auf extrahierte Tabellen übertragbar | deutsche sichtbare Darstellung vorhanden; technische ID-Zuordnung und Vollständigkeit nicht belegt | Bleibt `blocked`; kein Abruf/Import/Spiegeln |

## Exakter Freigabeumfang

Zulässig sind ausschließlich für die Equipment-Buildanalyse notwendige:

- Affix-, Mod- und Stat-IDs,
- Prefix/Suffix beziehungsweise Generation Type und Domain,
- Tiers und Item-Level-Schwellen,
- Wertebereiche und zusammengehörige Statzeilen,
- Itemklassen- und Basistypzuordnungen,
- Tags und Spawnregeln zur Zulässigkeitsprüfung,
- Gruppen und Konfliktgruppen,
- lokale/globale Kennzeichnungen,
- technische Quellversion und Provenienz.

Ausgeschlossen bleiben Bilder, Audio, Assets, Website-Code, JavaScript, CSS, HTML, PoE2DB-Dateien, proprietäre oder undokumentierte APIs, Laufzeit-Scraping, Hotlinks, vollständige unkontrollierte Rohdatenspiegel sowie Skills, Supports, Uniques und andere nicht zum Affixscope gehörende Daten.

## Bedingungen für 5M

- Abruf ausschließlich commit-gepinnt; kein `latest`, ungepinnter Branch oder Laufzeitabruf.
- SHA-256 für jede gelesene Quelldatei sowie deterministisches Quellenmanifest und Importbericht.
- RePoE-MIT-Hinweis und Herkunftshinweis auf GGG mitliefern.
- Nur normalisierte benötigte Ableitungen einchecken; keine vollständige Kopie von `data/`.
- Keine fachliche Bedeutungsänderung, keine erfundenen IDs oder Zuordnungen.
- Keine Medien oder fremden Programmcode übernehmen.
- Daten in einem separaten generierten Verzeichnis halten, damit sie mit einem Commit entfernt oder ersetzt werden können.
- Bei Upstream-, Schema-, Lizenz-, Versions- oder Commitwechsel sowie bei Beanstandung erneute manuelle Freigabe; keine automatische Produktivaktivierung.
- Commercial Use bleibt ungeklärt; die Entscheidung ist widerrufbar und risikobasiert.

## Deutsche Lokalisierung und PoE2DB

PoE2DB bleibt ausschließlich eine manuelle Sprach- und Darstellungsreferenz. Es wurden keine Seiten gespiegelt und keine Texte übernommen. Eine sichtbare deutsche Vorlage darf erst produktiv werden, wenn sie deterministisch über eine technische Stat-ID, Mod-ID oder eine separat kontrollierte Mappingtabelle zugeordnet und ihre Herkunft dokumentiert ist.

Die Prüfung von PoE2DB belegt nicht, dass einzelne deutsche Texte bereits eindeutig technischen RePoE-Stat-IDs zugeordnet werden können. Bis zu einer solchen Prüfung ist der Status `translation-missing`; PoE2DB bleibt als Quelle und `display-names` als Kategorie blockiert. Englischer technischer Text darf später nur entsprechend der ausdrücklich dokumentierten 5M-Fallbackstrategie gekennzeichnet erscheinen.

## Datenvollständigkeit und bekannte Lücken

RePoE besitzt die strukturell stärkste Abdeckung der geprüften Kandidaten, verspricht aber keine fachliche Vollständigkeit. Parser-Whitelists, nicht unterstützte Domains, Formatänderungen, deaktivierte Mods und neue Patchfelder müssen im späteren Importbericht sichtbar bleiben. Path of Building kann Stichproben plausibilisieren, darf aber nicht stillschweigend fehlende RePoE-Felder ersetzen.

Deutsche Abdeckung, vollständige Hybridsemantik, alle Sonderdomains und die genaue Tierfamilienbildung sind in 5M erst datenbasiert zu messen. 5M.0 behauptet hierfür keine Zahlen.

## Update-, Lösch- und Austauschprozess

Ein Update beginnt mit einem neuen Kandidatencommit, Versionsdatei, Schemavergleich und SHA-256-Inventar. Danach folgen Diffbericht, neue/entfernte IDs, Feldänderungen, Übersetzungsstatus, vollständige Tests und manuelle Freigabe. Erst anschließend darf ein neuer Pin produktiv werden.

Alle erzeugten Affixdaten müssen unter einem eigenen `generated/affixes/`-Bereich und ausschließlich über Manifestreferenzen angebunden werden. Ein Widerruf entfernt Manifest, Ableitungen und Attribution gemeinsam; synthetische Fixtures und die bestehende Anwendung bleiben ausführbar.

## Darf Aufgabe 5M beginnen?

**Ja, begrenzt:** Der technische Importteil von 5M darf mit dem oben gepinnten RePoE-PoE2-Export begonnen werden, sofern der Importer alle Bedingungen nachweislich erfüllt. **Nein für ungeprüfte deutsche Produktivtexte:** PoE2DB-Import, automatische Spiegelung und eine Freigabe von `display-names` bleiben gesperrt. Nicht eindeutig zugeordnete Texte müssen `translation-missing` bleiben.

5M.0 importiert keine Affixdaten, verändert keine UI oder Engine und beginnt weder 5M praktisch noch Aufgabe 5N.

## Umsetzung 5M.1

Der bedingt freigegebene Scope ist nun technisch umgesetzt. Manifest, Hashes, Coverage, Grenzen und Updateprozess stehen in `docs/POE2_REAL_AFFIX_TECHNICAL_IMPORT.md`. Die Freigabe bleibt eng, widerrufbar und versionsgebunden; Display-Namen bleiben blockiert und 5M.2 ist offen.
