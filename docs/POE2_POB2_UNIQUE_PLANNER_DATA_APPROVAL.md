# PoE2 PoB2 Unique Planner Data Approval

## Ziel und Entscheidung

Aufgabe 5M.2.8 setzt die ausdrückliche Entscheidung des Auftraggebers um, den gepinnten Path-of-Building-2-Bestand als **eigenständige Unique-Planerdatenquelle** vorzubereiten. Das Ergebnis ist eine bedingte, eng begrenzte Approval-Entscheidung und ein fehlersicherer Importvertrag. Es wurden keine PoB2-Unique-Daten importiert und keine Produktdateien erzeugt.

5M.2.7 hat bestätigt, dass weder lokale Clientdaten noch die geprüften RePoE-, PoB2- oder Communityquellen die strenge GGG-Kette Unique-ID → Basistyp-ID → Mod-/Stat-ID → strukturierte Werte → CSD vollständig liefern. Die Auftraggeberentscheidung akzeptiert PoB2 deshalb als planerbezogene eigene Provenienzschicht, nicht als technisch bestätigte GGG-Unique-Quelle.

## Grenzen und Quellenpin

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Importvertragsformat: `1`
- Scope: `poe2-pob2-unique-planner-data`
- Quelle: `path-of-building-poe2-unique-planner-c5300ccd`
- Status: `conditionally-approved`
- Produktimport: blockiert
- Distribution: `pending`
- deutsche Unique-Lokalisierung: nicht freigegeben

Kein `latest`, kein Branch-Fallback, kein Runtime-Netzwerk, kein Hotlink, kein Scraping, kein Rohmirror und keine Medien sind zulässig. PoB2 darf niemals die bestehenden RePoE-/GGG-Daten für reguläre Prefixe, Suffixe, Implicits, Corruption-Mods, Mod-/Stat-IDs, Domains, Generation Types, Basistypen, Itemklassen, CSD, Jewels, Charms oder Flasks ersetzen.

## Feldinventar

Die vollständige Feldentscheidung steht in `docs/audits/poe2-pob2-unique-field-approval.json`.

Zulässige planerbezogene Produktfelder für einen späteren, separat freizugebenden Import sind:

- PoB2-Quellidentität, sichtbarer Name, Basisanzeige, Slot und Unique-Kategorie
- Requirement-Level
- PoB2-Varianten und Legacy-Status
- sichtbare PoB2-Modzeilen, Implicits und PoB2-definierte Rollbereiche
- Provenienz und Auflösungsstatus

Audit-only sind Quellpfad und Rohposition. Eine stabile Quellreihenfolge darf eine deterministische `sourceLineId` bilden, ist aber keine GGG-ID.

Pending bleiben Unique-linked Skills und Supports. Sie dürfen später nur übernommen werden, falls PoB2 sie eindeutig strukturiert und eine eigene Feldfreigabe erfolgt.

Verboten sind GGG-Unique-, Base-, Mod- und Stat-ID-Behauptungen, Spawnweights, Domains, Generation Types, Konfliktgruppen, Craftingwerte, Bilder, Icons, Medien, Hotlinks, Flavour Text, deutsche Texte, vollständige Skill-/Supportdefinitionen, Passivbaumdaten, Berechnungsresultate, Communitynotizen und unbekannte Felder. Unbekannte Felder führen zum Abbruch.

## Werteherkunft

Ein Wert ist nur zulässig, wenn er als PoB2-Strukturwert oder als explizit parserdefinierter PoB2-Rollbereich belegt ist. Sichtbare Textdarstellung, intern berechnete oder manuell gepflegte Werte bleiben Audit-only, pending oder unknown. Freies Rückparsen sichtbarer Zahlen ist nicht freigegeben. PoB2-Werte werden als Planerwerte bezeichnet und nicht als technische GGG-Werte.

## Identitäts- und Provenienzmodell

Das geplante, noch nicht befüllte Modell heißt konzeptionell `Pob2UniquePlannerItem`. Seine Identität ist `pob2:<source-record-id>`. Synthetische Fixtures bleiben unter `fixture:<id>`; bestehende technische IDs behalten ihren eigenen Namespace.

Jeder spätere Datensatz benötigt:

- `sourceKind: pob2-planner-data`
- Repository, Commit und Quellrecord
- Lizenzstatus und Buildzeit-Herkunft
- PoB2-Identitätsstatus
- `gggIdentityStatus: unknown`
- Lokalisierungs-, Werte- und Variantenquelle

Optionale GGG-Verknüpfungen bleiben `null` oder `unknown`, bis ein unabhängiger technischer Nachweis existiert. Namensgleichheit ist kein Nachweis.

## Varianten- und Modzeilenmodell

Varianten behalten `sourceVariantId`, Quellreihenfolge, Current-/Legacy-Status, Modifier-Set, Rollbereiche, Verfügbarkeit und Unsicherheit. Sichtbar gleiche Namen dürfen technisch getrennte PoB2-Varianten nicht zusammenführen.

Planerzeilen besitzen eine stabile Quellzeilenkennung, normalisierte Planerstruktur, Wertplatzhalter, Rollbereiche, Reihenfolge, Variantenscope und Provenienz. `technicalGggStatLink` bleibt ohne unabhängigen Beleg `null`. PoB2-Zeilen gelangen weder in `TechnicalItemMods` noch in reguläre Affixregister, Craftingpools, Spawnweights oder CSD-Mappings.

## Unique Analyzer und Fixtures

Der bestehende Analyzer erwartet Slot, Itemtyp, Level, Modifiertags sowie kuratierte Regelmerkmale wie Klassen-/Aszendenz-/Skillbezug, Enabler, Trade-offs und Reoptimierungsbedarf. Slot, Basisanzeige und Level sind potenziell direkt importierbar. Klassen-, Aszendenz-, Skillrelevanz, Enabler, Trade-offs und Replacement-Verdicts sind nicht sicher aus dem PoB2-Quelldatensatz verfügbar und müssen später durch bestehende App-Logik oder eine gesonderte, belegte Kuratierung entstehen. In 5M.2.8 wurde keine Analyzerlogik geändert.

Synthetische Uniques bleiben reine Testfixtures. Sie werden nicht vermischt oder durch gleiche IDs überschrieben.

## Codelizenz, Datenherkunft und Distribution

Der gepinnte PoB2-Code steht laut `LICENSE.md` unter MIT; Copyright- und Erlaubnishinweis sind bei einer relevanten Codeübernahme zu erhalten. Diese Aufgabe übernimmt keinen PoB2-Code.

Die statischen Unique-Dateien kennzeichnen Itemdaten als GGG-Daten und enthalten Communitypflege. Es ist nicht belegt, dass die MIT-Codelizenz die öffentliche Weiterverteilung dieser Itemdaten vollständig regelt. Das ist keine Rechtsberatung. Daher gilt:

- lokaler Audit: erlaubt
- Buildzeitverarbeitung: bedingt vorbereitbar
- Repository-/Produktdateispeicherung: blockiert beziehungsweise pending
- GitHub-Pages-Auslieferung: pending
- Runtime-Laden, Hotlinks und Scraping: verboten

Der spätere Attributionsplan umfasst README, Datenquellendokumentation, gegebenenfalls Third-Party-Notices, Repository und Commit, Lizenzhinweis sowie den ausdrücklichen Hinweis auf Planner-Provenienz ohne technische GGG-ID-Kette. Eine sichtbare Kennzeichnung direkt an jedem Unique ist nicht zwingend beschlossen; mindestens eine Datenquellenseite beziehungsweise App-Info ist vor Distribution erforderlich.

## Quelldateien und minimaler Umfang

Der Dateiscope enthält 20 statische `src/Data/Uniques/*.lua`-Dateien mit tatsächlichen Plannerrecords. Pfad und SHA-256 stehen vollständig in `docs/audits/poe2-pob2-unique-source-files.json`.

`Special/Generated.lua`, Special-Loader und leere Kategorien sind ausgeschlossen. Es wird keine vollständige PoB2-Datenbank, keine Lua-Engine und keine PoB2-Runtime eingebettet.

## Updateprozess

Ein späteres Update wählt ausdrücklich einen Commit, hasht Archiv und Quelldateien, validiert Lizenzdatei und Allowlist, erkennt Schema-, Unique-, Varianten- und Werteänderungen, erzeugt einen deterministischen Diff- und Coveragebericht und verlangt erneute Approval-Prüfung. Ungepinnte Quellen, unbekannte Dateien oder Felder, Hashabweichungen, Schemaänderungen, Herkunftsverlust und Variantenkonflikte brechen ab.

## Guards

`src/import/pob2-unique-approval.ts` implementiert den Approval-, Feld-, Produkttrennungs-, Provenienz- und Distributionsguard.

- exakter Scope, Repository, Commit, Quelldatei und Feldallowlist
- SHA-256-Manifest und deterministische Normalisierung
- kein normaler Affix-, GGG-ID-, Crafting-, CSD-, Socketable-, Medien-, Skill-/Support-Vollscope
- keine Ausgabe nach `generated/` oder `public/`
- kein Runtime-Netzwerk, Hotlink, Scraping oder Rohmirror
- vollständige Provenienz und `pob2:`-Namespace
- Produktimport blockiert, solange Distribution pending ist

Der Guard ist Auditcode und wird nicht von der Web-App geladen.

## Importvertrag für 5M.2.9

Der maschinenlesbare Vertrag steht in `docs/audits/poe2-pob2-unique-import-contract.json`. 5M.2.9 darf erst beginnen, nachdem der Distributionsstatus separat geklärt wurde. Danach muss sie den exakten Pin und Dateihashes prüfen, nur erlaubte Felder importieren, deterministische IDs und Sortierung erzeugen, Varianten getrennt halten, Provenienz vollständig ausgeben sowie Manifest, Coverage und Diffbericht erstellen. Jeder Fehler muss fail-closed sein.

Die geplante Datei `generated/pob2/uniques.json` ist nur ein möglicher späterer Zielpfad; sie wurde in dieser Aufgabe nicht erstellt.

## Deutsche Lokalisierungsoptionen

PoB2 ist nicht als Quelle deutscher Unique-Texte freigegeben. Später denkbar sind separat freigegebene PoB2-Texte, vorübergehend englische Plannerdaten, lokal bestätigte deutsche CSD nur bei echter technischer Stat-ID-Verbindung oder eine separat gepflegte Übersetzung. Alle Optionen bleiben pending; Textähnlichkeit darf keine CSD-Verknüpfung vortäuschen.

## Approval-Entscheidung

PoB2 ist **nur unter Bedingungen** als eigenständige Unique-Planerdatenquelle für einen späteren Import freigegeben:

1. ausschließlich der Scope `poe2-pob2-unique-planner-data`;
2. exakter Commit und die 20 gehashten Quelldateien;
3. nur die freigegebenen Plannerfelder mit vollständiger Provenienz;
4. keine GGG-ID-Behauptung oder Vermischung mit technischen Affixdaten;
5. keine deutschen Texte, Skills/Supports, Medien oder Runtimequelle ohne eigene Freigabe;
6. Distributionsklärung und separate Aufgabe 5M.2.9 vor jedem Produktimport.

Aktuell erlaubt der Guard nur Audit. Produktimport und öffentliche Distribution bleiben blockiert. 5M.2 und 5N wurden nicht begonnen. Empfohlener nächster Schritt ist die eng begrenzte Klärung der Weiterverteilung der statischen PoB2-Unique-Planerdaten; erst danach folgt 5M.2.9.
