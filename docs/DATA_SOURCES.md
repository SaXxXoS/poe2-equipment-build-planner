# Datenquellenprüfung für PoE2-Spieldaten

Prüfdatum: 20. Juli 2026

## 1. Zweck

Dieses Dokument bewertet mögliche Quellen für einen späteren kontrollierten Offline-Import. Es ist keine Rechtsberatung und keine Importfreigabe. Technische Erreichbarkeit, öffentlich sichtbare Inhalte oder fehlende technische Sperren werden ausdrücklich nicht als Erlaubnis zum automatisierten Abruf, Speichern oder Weiterverteilen verstanden.

In Aufgabe 3 wurden keine echten Spieldaten abgerufen, kopiert oder in das Repository aufgenommen. Die Importpipeline wird ausschließlich mit erkennbar künstlichen Fixtures getestet.

## 2. Geprüfte Quellen

### 2.1 PoE2DB

- **Name/URL:** [PoE2DB](https://poe2db.tw/), exemplarisch [deutsche Fertigkeitsgems](https://poe2db.tw/de/Skill_Gems), [deutsche Modifier](https://poe2db.tw/de/Modifiers) und die [PoB-Seite mit beschriebener öffentlicher API](https://poe2db.tw/us/pob)
- **Betreiber:** PoE2DB/PoEDB-Projekt; eine verantwortliche juristische Person war auf den geprüften Seiten nicht eindeutig ausgewiesen.
- **Untersuchte Datenbereiche:** Fertigkeitsgems, Tags, Beschreibungen, Gemcutting-Listen, Modifier sowie lokalisierte Inhalte. Weitere Bereiche sind über die Seitennavigation sichtbar, wurden aber nicht automatisiert ausgelesen.
- **Schnittstellen/Format:** Die untersuchten Spieldaten erscheinen als gerenderte HTML-Seiten und Tabellen. Die einzige auf einer geprüften PoE2DB-Seite ausdrücklich als „Public API“ bezeichnete Schnittstelle betrifft das Abrufen und Erstellen von Build-Paste-Daten (`/pob/:id/raw`, `/pob/api/gen`), nicht einen allgemeinen Export der Spieldatenbank. Dafür wird ein identifizierbarer User-Agent verlangt.
- **Aktualisierung:** Sichtbare Seiteninhalte werden von PoE2DB gepflegt; ein belastbarer, dokumentierter Versions-/Releasevertrag für einen vollständigen Datenexport wurde nicht gefunden.
- **Sprachen:** Sprachpfade wie `/de/` und `/us/` zeigen mindestens deutsche und englische Inhalte; einzelne geprüfte deutsche Seiten enthalten auch englische Resttexte. Vollständigkeit und Übersetzungsstand sind daher pro Datensatz zu prüfen.
- **Erkennbare Nutzungsbedingungen:** Der Footer der geprüften PoB-Seite nennt CC BY-NC-SA 3.0 für Wiki-Inhalte, „unless otherwise noted“. Ob diese Angabe sämtliche strukturierten Spieldaten, deren Herkunft, automatisierten Massenabruf und Weiterverteilung abdeckt, ist nicht eindeutig feststellbar. Eine ausdrückliche Freigabe für Scraping oder einen vollständigen Offline-Datenimport wurde nicht gefunden.
- **Technische Beschränkungen:** Für die PoB-API wird ein identifizierbarer User-Agent gefordert. Für allgemeine Spieldaten wurde keine dokumentierte Export-API festgestellt. HTML-Strukturen sind kein stabiler Importvertrag.
- **Offline-Eignung:** Inhaltlich breit und wegen deutscher Ansichten potenziell relevant, derzeit aber rechtlich und technisch **klärungsbedürftig**. Ein automatisierter Import bleibt blockiert, bis Betreiber, zulässiger Umfang, Abrufverfahren, Rate Limits, Attribution und Weiterverteilung ausdrücklich geklärt sind.

### 2.2 Offizielle Path-of-Exile-Entwickler-API

- **Name/URL/Betreiber:** [Path of Exile Developer Docs](https://www.pathofexile.com/developer/docs/index), [API-Referenz](https://www.pathofexile.com/developer/docs/reference) und [Changelog](https://www.pathofexile.com/developer/docs/changelog), betrieben von Grinding Gear Games Limited (GGG).
- **Untersuchte Datenbereiche:** Kontoprofil, Itemfilter, Ligen, Charaktere, bestimmte Gegenstandsstrukturen und Currency Exchange. Die Referenz kennzeichnet mehrere PoE2-Felder und den Realm `poe2`, warnt aber ausdrücklich vor nur begrenzten PoE2-APIs.
- **Schnittstellen/Format:** Dokumentierte HTTPS-API unter `https://api.pathofexile.com`; die Mehrzahl der Antworten ist JSON. Viele Ressourcen benötigen OAuth-Scopes. Die Dokumentation beschreibt dynamische Rate-Limit-Header, Fehlercodes und einen vorgeschriebenen identifizierbaren User-Agent.
- **Aktualisierung:** Die API-Dokumentation besitzt ein Changelog mit PoE2-spezifischen Einträgen; GGG behält Änderungen und Entfernung von Endpunkten vor und garantiert weder Verfügbarkeit noch Stabilität.
- **Sprachen:** API-Felder und Dokumentation sind primär englisch. Ein allgemeiner deutschsprachiger statischer PoE2-Spieldatenexport ist nicht dokumentiert.
- **Nutzungsbedingungen:** Anwendungen müssen API-Richtlinien sowie [GGGs Nutzungsbedingungen](https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy) einhalten. Die Entwicklerdokumentation verlangt für öffentliche Anwendungen einen Nichtzugehörigkeits-/Nichtendorsement-Hinweis und beschränkt unterstützte Ressourcen auf die dokumentierte API bzw. gelistete Exporte.
- **Technische Beschränkungen:** OAuth 2.1 je nach Ressource, dynamische Rate Limits, mögliche Zugriffsentziehung und derzeit laut Dokumentation keine Bearbeitung neuer Application-Registrierungen. Nicht dokumentierte interne Endpunkte sollen nicht reverse-engineered werden.
- **Offline-Eignung:** Für exakt dokumentierte, erforderliche API-Daten später denkbar, sofern Scope, Registrierung, Cache-/Speicherregeln, Datenschutz und konkrete Nutzungsbedingungen geklärt werden. Die API deckt den benötigten vollständigen statischen PoE2-Datenbestand derzeit nicht ab.

### 2.3 Offizieller PoE2-Passivbaumexport

- **Name/URL/Betreiber:** [GGG-Datenexportseite](https://www.pathofexile.com/developer/docs/data) und das dort verlinkte Repository [grindinggear/poe2-skilltree-export](https://github.com/grindinggear/poe2-skilltree-export), veröffentlicht durch GGG.
- **Datenabdeckung:** Passiver PoE2-Skilltree. Das Repository beschreibt sich als exportierte Daten für den passiven Baum und enthält sichtbar eine `data.json` sowie Assets. Es deckt nicht Klassen, Gems, Modifier, Juwele oder Uniques als allgemeinen Spieldatenexport ab.
- **Format/Aktualisierung:** Versionierte GitHub-Releases und JSON/Assets im öffentlichen Repository. Zum Prüfdatum zeigte GitHub Releases; ein belastbarer automatischer Updatevertrag ist nicht zugesichert.
- **Sprachen:** Auf der geprüften Repositoryseite war keine garantierte deutsche Lokalisierungsabdeckung erkennbar.
- **Nutzungsbedingungen:** GGG listet den PoE2-Passivbaum ausdrücklich als Ausnahme zu der Aussage, außerhalb unterstützter APIs keine In-Game-Daten bereitzustellen. Im geprüften Repository war keine separate LICENSE-Datei sichtbar. Daraus wird hier keine pauschale Erlaubnis zur Weiterverteilung, Bearbeitung oder Nutzung der Assets abgeleitet; die GGG-Nutzungsbedingungen und eine mögliche direkte Klärung bleiben relevant.
- **Technische Beschränkungen/Offline-Eignung:** Technisch ist ein kontrollierter, versionsgebundener Offline-Import aus einem Release grundsätzlich gut vorbereitbar. Vor Aufnahme echter Daten sind Lizenz-/Attributionsumfang, Asset-Nutzung, Updatepolitik und erlaubte Weiterverteilung ausdrücklich zu klären. Bilder/Assets sollen zunächst ausgeschlossen bleiben.

### 2.4 Weitere offizielle GGG-Datenquellen

- **API-Changelog:** Das [offizielle Changelog](https://www.pathofexile.com/developer/docs/changelog) dokumentiert PoE2-Felder und Realm-Unterstützung, ist aber selbst keine vollständige Datenquelle.
- **Offizielle Nutzungsbedingungen:** Die [Terms of Use](https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy) gelten für Websites, Materialien und Dienste einschließlich Website-APIs. Sie reservieren Rechte an Texten, Bildern und Spielelementen, beschränken automatisierte Software sowie Datenextraktionswerkzeuge und nennen `support@grindinggear.com` für Rückfragen. Dieses Dokument nimmt keine definitive juristische Auslegung vor.
- **Nicht dokumentierte Endpunkte/Clientdaten:** Laut Entwicklerdokumentation werden nur in API-Referenz oder Data Exports genannte Ressourcen unterstützt. Reverse Engineering nicht dokumentierter Endpunkte bzw. Interaktion mit Spieldateien ist daher ausdrücklich keine geplante Quelle.

## 3. Datenabdeckung im Vergleich

| Quelle | Statische Kernspieldaten | Passivbaum | Deutsch | Dokumentiertes maschinenlesbares Format | Vorläufiger Status |
| --- | --- | --- | --- | --- | --- |
| PoE2DB | Sichtbar breit | Sichtbar vorhanden | Ja, nicht garantiert vollständig | Keine allgemeine Spieldaten-API gefunden | Blockiert bis Klärung |
| Offizielle GGG-API | Begrenzte Konto-/Service-/Objektdaten | Keine allgemeine Baumquelle über API belegt | Nicht als vollständiger DE-Datensatz | JSON, dokumentierte Endpunkte | Nur fallbezogen prüfen |
| Offizieller PoE2-Baumexport | Nein | Ja | Unklar | Git-Release, `data.json` | Technisch bevorzugt; Rechte klären |
| Changelog/Terms | Keine Importdaten | Nein | Terms mehrsprachig verfügbar | HTML-Dokumentation | Nur Nachweis/Regeln |

## 4. Offene Fragen und Risiken

1. Darf PoE2DB automatisiert und wiederholt für dieses Projekt abgerufen werden, und wenn ja mit welchem Umfang, Rate Limit und User-Agent?
2. Welche PoE2DB-Inhalte fallen tatsächlich unter die im Footer genannte Wiki-Lizenz, und welche stammen aus GGG-Materialien mit eigenen Rechten?
3. Darf ein normalisierter Datenauszug aus PoE2DB öffentlich im Repository weiterverteilt werden?
4. Welche Nutzung und Weiterverteilung erlaubt GGG konkret für `poe2-skilltree-export`, insbesondere `data.json` gegenüber Bild-Assets?
5. Welche Attribution und Versionierung erwartet GGG für einen öffentlichen Build-Planer?
6. Wie vollständig und stabil sind deutsche Bezeichnungen je Quelle und Spielversion?
7. Neue OAuth-Anwendungen können laut Entwicklerseite derzeit nicht registriert werden; dies kann API-basierte Pläne blockieren.

## 5. Vorläufige Empfehlung

1. **Keine PoE2DB-Automatisierung beginnen.** Zuerst schriftlich Umfang, Technik, Attribution, Speicherung und Weiterverteilung mit dem Betreiber klären.
2. **Offizielle Quellen bevorzugen.** Für den Passivbaum ist der ausdrücklich gelistete GGG-Export der technisch stärkste Kandidat; vor echtem Import trotzdem Lizenz-/Assetfragen klären und zunächst nur strukturierte Daten, keine Grafiken, betrachten.
3. **API nur dokumentiert verwenden.** Nur unterstützte Endpunkte, offizielle Scopes, User-Agent und Rate-Limit-Regeln; keine internen Endpunkte und keine Laufzeitabhängigkeit der Buildberechnung.
4. **Importe reproduzierbar einfrieren.** Quelle, Release/Version, Sprache, Zeit, Importerversion und Hash im Manifest speichern; jeden Import reviewen und testen.
5. **Bis zur Klärung bei künstlichen Fixtures bleiben.** Phase 3 ist technisch vorbereitet, aber ein breiter echter Spieldatenimport ist nicht freigegeben.

## 6. Ausdrücklich ausgeschlossene Vorgehensweisen

- PoE2DB-Scraping oder Browserautomatisierung gegen PoE2DB
- Speichern vollständiger HTML-Seiten oder fremder Datenbestände
- Nutzung nicht dokumentierter GGG-Endpunkte oder Umgehung von Zugriffsbeschränkungen
- Reverse Engineering des Clients, der Website oder interner Schnittstellen
- Download und Veröffentlichung von Icons, Grafiken oder anderen Assets ohne geklärte Rechte
- Annahme, dass robots.txt, öffentliche Sichtbarkeit oder technische Abrufbarkeit eine Nutzungserlaubnis darstellen
- Live-Abfragen externer Seiten während einer Buildberechnung

## 7. Verwendete Primärlinks

- https://poe2db.tw/
- https://poe2db.tw/de/Skill_Gems
- https://poe2db.tw/de/Modifiers
- https://poe2db.tw/us/pob
- https://www.pathofexile.com/developer/docs/index
- https://www.pathofexile.com/developer/docs/reference
- https://www.pathofexile.com/developer/docs/data
- https://www.pathofexile.com/developer/docs/changelog
- https://github.com/grindinggear/poe2-skilltree-export
- https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy
