# 5M.2.0 – Quellenentscheidung für deutsche Gegenstandslokalisierung

## Entscheidung

5M.2.0 ist eine reine Quellen-, ID-, Rechte- und Approval-Prüfung. Es wurde kein deutscher Produktivtext importiert, erzeugt oder frei übersetzt. Alle deutschen Lokalisierungsscopes bleiben `pending`; `photo-derived-unverified` bleibt für Produktivdaten `blocked`. Der sichtbare Fallback `translation-missing` bleibt unverändert. 5M.2, 5N, Fotoerkennung und Lernmodus wurden nicht begonnen.

Die technisch aussichtsreichste Hauptquelle ist ein neuer, exakt gepinnter deutscher RePoE-Lauf auf derselben Spielversion wie der technische Affixexport. Das ist noch keine Freigabe: Ein solcher Lauf muss erst reproduzierbar erzeugt, vollständig gegen die Produkt-IDs geprüft und hinsichtlich der Weitergabe von GGG-Spieltext separat entschieden werden. PoE2DB, PoB und poe2-mcp sind keine freigegebenen Textquellen.

## Ziel und Foto-Modus

Spätere deutsche Texte dürfen Darstellung und Suche unterstützen, aber keine Fachidentität definieren. Die Engine bleibt bei Mod-, Stat-, Base- und Itemklassen-IDs. Ein späteres Foto liefert nur OCR-Kandidaten; erst ein ID-verifiziertes Sprachtemplate darf den Kandidaten auf Familie, Tier und Werte zurückführen. Textähnlichkeit, freie Übersetzung und sichtbare Namen allein sind unzureichend.

Benötigt werden Statbeschreibungen; einzelne, mehrzeilige und hybride Affixe; Familienbezeichnungen; reguläre, Basis-, Corruption-, Jewel-, Charm- und Flask-Texte; Basistyp- und Itemklassennamen; Charm-/Flask-Eigenschaften; Socketable-Namen; UI-Begriffe für Tier/Prefix/Suffix/Implicit; Platzhalter, Bedingungen, Plural, Vorzeichen, Prozent sowie lokale/globale Varianten. Uniques, Skills, Supports, Flavour Text, Lore und Medien sind ausgeschlossen.

## Zählregeln und Produktbestand

Eine Mod-ID ist ein nach dem Laufzeitregister eindeutiger technischer Mod. Eine Statzeile ist ein `statLines`-Eintrag; eine Stat-ID-Kombination ist die geordnete ID-Folge eines Mods. Ein Template mit Platzhaltern zählt einmal, nicht pro Rollwert. Mehrzeiler besitzen mehr als eine Statzeile; Basistypen und Itemklassen zählen nach eindeutiger technischer ID.

| Bereich | Mods | Statzeilen | Stat-IDs | Kombinationen | Mehrzeiler/Hybrid | Basistypen |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Hauptbestand | 1.828 | 2.265 | 290 | 306 | 416 | 0 im generierten Hauptaffixbestand |
| Jewels | 320 | 322 | 164 | 163 | 2 | 8 |
| Charms | 64 | 64 | 22 | 22 | 0 | 13 |
| Life Flasks | 57 | 63 | 13 | 12 | 6 | 9 |
| Mana Flasks | 52 | 58 | 12 | 11 | 6 | 9 |
| Eindeutiges Laufzeitregister | 2.255 | 2.705 | 431 | 444 | 429 | 39 |

Der Hauptbestand enthält 816 Prefixe, 568 Suffixe, 231 Basis-Implicits, 103 Corruption-Implicits und 110 Corruption-Upgrades. 2.220 Statzeilen besitzen ein technisches englisches Template, 485 nicht. Alle produktiven Datensätze bleiben `translation-missing`. Vorhandene deutsche UI-Begriffe sind handgeschriebene Bedienoberfläche, kein verifizierter Spieltextkorpus.

## Offizielle GGG-Datenwege und lokale Installation

Die geprüften offiziellen Developer-Dokumente und der offizielle Skilltree-Export liefern keinen identifizierten Export deutscher Gegenstandsmods, Basistyp- oder Itemklassennamen. Der Skilltree-Export ist fachlich auf den Passivbaum begrenzt. Ob ein weiterer undokumentierter offizieller Export existiert, ist **Unbekannt**.

Der gepinnte RePoE-Parser kann `Content.ggpk` explizit lesen, stellt `German -> de_DE.utf8` bereit und kann `--language German` beziehungsweise `all` ausführen. StatDescriptions, `BaseItemTypes.dat64` und `ItemClasses.dat64` behalten technische IDs und lesen sprachabhängige Felder. Damit ist ein lokaler, ID-basierter deutscher Export technisch plausibel. An drei üblichen Installationspfaden wurde keine Installation und keine `Content.ggpk` gefunden; ein deutscher Lauf wurde daher nicht ausgeführt. Exakte Spielversion, reale Vollständigkeit und Parserlauf sind **Unbekannt**.

Die MIT-Lizenz des Parsers gilt für Code, nicht automatisch für extrahierte GGG-Spieltexte. Die geprüften GGG-Nutzungsbedingungen enthalten Einschränkungen für Vervielfältigung, Veränderung und Extraktion. Ob ein eng normalisierter deutscher Sprachdatensatz im Repository veröffentlicht werden darf, ist **Unbekannt** und benötigt eine separate Risiko-/Rechteentscheidung. Ein ausschließlich lokal durch den Nutzer erzeugtes Mapping bleibt ebenfalls `pending`, bis Eingabe, Pin, Speicherung, Review und Entfernung vertraglich festgelegt sind.

## RePoE-Export und Parser

Geprüft wurden Export `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c` und Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81`. Der Parser-Remote-HEAD war am 22.07.2026 identisch; es gibt deshalb keinen neueren Parserkandidaten.

Der Export enthält 589 JSON-Dateien unter `data/stat_translations`, 19.460 Translationseinträge und 16.432 eindeutige IDs. Alle 19.460 Einträge haben Englisch; exakt null haben ein befülltes `German`-Feld. `stat_descriptions.json` deckt 419 der 431 produktiven Stat-IDs direkt ab (97,22 % technische ID-Abdeckung), aber 0 % deutsche Textabdeckung. Zwölf IDs fehlen; sie sind im maschinenlesbaren Bericht vollständig aufgelistet. `base_items.json` und `item_classes.json` enthalten technische IDs und englische Namen, keinen deutschen Parallelbestand.

Der Parser selbst unterstützt Sprache bereits: CLI-Locale, Statbedingungen, Platzhalter, Reihenfolge, Pluralvarianten, Base- und Klassenanzeigenamen. Eine begrenzte Parsererweiterung ist daher nicht als Voraussetzung belegt; erforderlich ist zunächst ein deutscher, versionsgleicher Lauf. Der Socketable-Parser rendert zwar sprachabhängig, verwirft aber weiterhin strukturierte `StatsValues`/`BondedStatsValues`; dies verhindert eine Freigabe der Effekte.

Relevante Hashes und Dateigrößen stehen in `docs/audits/poe2-german-item-localization-source-comparison.json`. Der 10.605.429-Byte-StatDescription-Hash lautet `5501ffe60e12546a8f3cf3bee42d47f6148514d7e92d596d2c277fb29ffbef3a`.

## PoE2DB, PoB, poe2-mcp und weitere Quellen

PoE2DB bleibt ausschließlich eine manuelle Anzeige-/Sprachreferenz. Es erfolgten kein Scraping, Download, API-Aufruf, HTML-/CSS-/Dump-Import oder Mapping. Ein kleines manuelles Verfahren könnte technische ID, Quellenreferenz, Hash und zwei Reviews speichern. Für mehr als 2.000 Mods ist es langsam, patchanfällig und besonders bei Bedingungen, Hybriden und gleichen sichtbaren Texten fehleranfällig. Ohne separaten Scope bleibt es `pending`; PoE2DB-Inhalte selbst bleiben blocked.

Path of Building PoE2 `f5b94342eeea413a94c339af3e881c5e2a4df0df` enthält englische Modparser-/Laufzeitdaten und interne Namen, aber keinen belegten vollständigen deutschen ID-Datensatz. Seine MIT-Code-Lizenz trennt die Rechte an eingebetteten Spieldaten nicht auf. Es bleibt Architektur-/Kontrollquelle.

poe2-mcp `163c30a9fd45f815d330cc54e6ab51a797693d31`/`data-v0.5.0-r12` erkennt in CSD-Dateien Sprachen einschließlich German, exportiert absichtlich nur englische Templates und hält lediglich `languages_available`. Es besitzt Stat-/Mod-IDs, aber keinen vollständigen deutschen Base-/Klassenbestand. MIT gilt für Code; ein separater Textdatengrant wurde nicht gefunden. PoBR `ff1d07da2a2b38959e34eea077d842d222f631b4` ist eine derivative PoB-Kontrollquelle. Im vorhandenen 51-Repository-Inventar wurde keine weitere Quelle mit nachgewiesenem vollständigem deutschen, ID-basierten und freigegebenen Itemkorpus identifiziert.

## Matching, Mehrdeutigkeit und Vertrauen

Priorität: direkte Stat-ID; direkte Mod-ID; Base-/Metadata-ID; Itemklassen-ID; geordnete Stat-ID-Kombination mit Bedingungen; Template-/Platzhalterstruktur; normalisierter Strukturhash; englischer Text nur als Kontrolle; manuelle ID-Bestätigung. Eine Stat-ID kann abhängig von Bedingungen, Vorzeichen und Plural mehrere Zeilen haben. Hybride und Mehrzeiler müssen als geordnete Einheit abgeglichen werden. Gleiche deutsche Texte können mehrere IDs repräsentieren; deshalb ist Textgleichheit nie ausreichend.

Empfohlen werden `source-id-verified`, `source-structure-verified`, `manually-id-matched`, `dual-reviewed`, `photo-derived-unverified`, `user-confirmed-local`, `ambiguous`, `translation-missing`, `deprecated` und `source-conflict`. Produktiv zulässig wäre später nur ein zum Scope passender ID-/Strukturnachweis; manuell kuratierte Einträge zusätzlich `dual-reviewed`. `photo-derived-unverified` bleibt ein Kandidat, nie eine neue Fach-ID.

Für OCR sind ID-verknüpfte deutsche Templates grundsätzlich geeignet: Zahlen können als Platzhalter entfernt, Vorzeichen/Prozent/mehrere Werte gelesen und Bereiche gegen Itemklasse, Item-Level und Tier geprüft werden. Der aktuelle Export ist wegen null deutschen Templates ungeeignet. Charm-/Basis-/Corruption-/Socketable-Unterscheidung benötigt zusätzlich Basis-, Domain- und Mod-IDs. Mehrdeutigkeit muss sichtbar bleiben.

## Approval je Teilbereich

| Teilbereich | Hauptquelle | Kontrolle | Schlüssel | Status |
| --- | --- | --- | --- | --- |
| Stattemplates | neuer deutscher RePoE-Lauf | lokales Spiel/poe2-mcp-Struktur | Stat-ID + Bedingungen | pending |
| reguläre Affixe, Implicits, Corruption, Jewels, Charms, Flasks | deutscher RePoE-Lauf | technischer Produktbestand | Mod-ID + Statstruktur | pending |
| Basistypnamen | deutscher RePoE-Lauf | lokales Spiel | Metadata-/Base-ID | pending |
| Itemklassennamen | deutscher RePoE-Lauf | lokales Spiel | Itemklassen-ID | pending |
| Socketable-Namen | deutscher RePoE-Lauf | technische Identitätsregister | Socketable-/Base-ID | pending |
| technische Suchbegriffe | geprüfte lokalisierte Templates | UI-Kontrolle | ID + Locale | pending |
| manuell kuratierte Mappings | manuelle Transkription | Spiel/PoE2DB nur visuell | technische ID + Doppelreview | pending |
| lokal nutzererzeugte Mappings | eigener gepinnter Clientlauf | Hash-/Coverage-Bericht | technische ID + Spielpin | pending |
| photo-derived Mapping | keine | Nutzerbestätigung | OCR-Kandidat | blocked |

Neue Approval-Kategorien bilden diese Trennung maschinenlesbar ab. Keine besitzt erlaubte Dateien oder Felder, weil nichts `conditionally-approved` wurde. Minimal denkbare spätere Felder sind Locale, technische IDs, Template, Platzhalter, Bedingungen, Reihenfolge, Plural-/Vorzeichenregel, Quellenpin/-referenz, Review-, Confidence- und Datenstatus. Ausgeschlossen bleiben Webseitenkopien, PoE2DB-HTML/CSS/API/Dumps, Medien, Rohtextspiegel, Lore/Flavour, freie/ungeprüfte Maschinenübersetzungen, Unique-/Skill-/Supporttexte, Runtimeabrufe und Hotlinks.

Widerruf ist durch getrennte Sprachdateien, keine Fachlogik in Texten und Quellmanifest möglich. Trigger sind Spiel-/Export-/Parserwechsel, neue Lizenz-/API-Auskunft, Rechtebeanstandung oder Scope-Ausweitung.

## Voraussetzungen für 5M.2 und Schlussfolgerung

Vor 5M.2 sind erforderlich: eine legal vorhandene, exakt versionsgepinnt dokumentierte deutsche Spielquelle; reproduzierbarer Offline-RePoE-Lauf; SHA-256-Manifest; Coverage gegen alle 431 Stat-IDs, 444 Kombinationen, 39 Basistypen und 33 Klassen; Tests für Bedingungen, Plural, Vorzeichen und 429 Mehrzeiler/Hybride; getrennte Rechte-/Risikoentscheidung für Repository- oder nur lokale Nutzung; minimaler widerrufbarer Scope und Doppelreview-Stichprobe. Erst danach darf eine eigene Freigabe deutsche Texte produktiv machen.

Die klare Schlussfolgerung lautet: Die ID-basierte Architektur ist vorhanden und ein deutscher RePoE-Lauf ist technisch plausibel, aber am geprüften Pin existiert kein deutscher Textkorpus und die Weitergabe ist nicht belegt. Daher wird keine Freigabe erzwungen. Empfohlener nächster Schritt ist eine eigenständige, nicht produktive 5M.2-Vorprüfung auf einem legal installierten, exakt gepinnten deutschen Client mit lokalem Coverage-/Hashbericht; erst nach deren Rechteentscheidung beginnt der Produktimport. Der lokale Lernmodus und die mobile Textklippung bleiben separat offen.

Quellen: [GGG Developer Docs](https://www.pathofexile.com/developer/docs), [GGG API Reference](https://www.pathofexile.com/developer/docs/reference), [GGG Terms](https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy), [RePoE Parser](https://github.com/repoe-fork/repoe), [RePoE PoE2 Export](https://github.com/repoe-fork/poe2), [Path of Building PoE2](https://github.com/PathOfBuildingCommunity/PathOfBuilding-PoE2), [poe2-mcp](https://github.com/HivemindOverlord/poe2-mcp).
> **Update 5M.2.1 (2026-07-22):** Die lokale deutsche Installation wurde gegen Containerpin `a917a56f...a18e28` geprüft. Nur ItemClasses war erfolgreich (32/33 Produkt-IDs); Mods, Basistypen und StatDescriptions sind technisch beziehungsweise regelbedingt nicht vollständig extrahierbar. Keine Produktfreigabe; Details: [lokaler Preflight](POE2_GERMAN_LOCAL_EXTRACTION_PREFLIGHT.md).
> **Update 5M.2.2 (2026-07-22):** Der Audit dreier commitgenauer Kandidaten fand keinen ausreichenden verlustfreien Offline-Stack. PoB2/ooz ist nur als deterministischer Rohdatenextraktor belegt. Die Quellenentscheidung bleibt `pending`; ein neuer Pin, Produktimport oder Distributionsstatus wurde nicht beschlossen. Details: [Kandidatenaudit](POE2_GERMAN_PARSER_CANDIDATE_AUDIT.md).
> **Update 5M.2.3 (2026-07-23):** Der eigene gepinnte Offline-Auditparser beweist weitgehende technische Mod-/CSD-Abdeckung, aber keine vollständige Referenz- oder Distributionsfähigkeit. Alle deutschen Scopes bleiben `pending`, `translation-missing` bleibt aktiv und der Produktivpin bleibt unverändert. Details: [Offline-Parser](POE2_OFFLINE_ITEM_AUDIT_PARSER.md).
