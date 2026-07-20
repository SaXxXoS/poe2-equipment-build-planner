# CHATGPT-Protokoll – PoE2 Equipment Build Planner

Stand: 20. Juli 2026. Bei Widersprüchen ist der Quellcode die maßgebliche Wahrheit.

## 1. Projektbeschreibung

Mobile-first Web-App zur Planung eines Path-of-Exile-2-Builds ausgehend von vorhandener Ausrüstung. Der aktuelle Stand ist ein klickbarer React-Prototyp mit lokalen Platzhalterdaten auf einer einzigen langen Seite.

## 2. Projektziel

Langfristig analysiert eine erklärbare Engine Klasse, Aszendenz, Level, Ausrüstungsaffixe, beide Waffen-Sets, eine optionale Hauptfertigkeit und das Ziel Ausgeglichen, Mapping oder Boss. Daraus leitet sie den bestmöglichen restlichen Build ab. Die Ausrüstung ist die Grundlage; nicht der passive Skilltree bestimmt die Ausrüstung.

## 3. Vollständiger langfristiger Projektplan

### Grundprinzip und Eingaben

Die Engine analysiert Klasse, Aszendenz, Charakterlevel, Ausrüstungsaffixe, Waffen-Set 1 und 2, optional eine Hauptfertigkeit sowie das Ziel Ausgeglichen, Mapping oder Boss.

### Geplante Engine-Ausgaben

- Beste Hauptfertigkeit, weitere Fertigkeitsgems, kompatible Unterstützungsgems und deren optimale Kombination
- Optimale Belegung und Nutzung beider Waffen-Sets
- Optimaler passiver Skilltree mit effizienten Pfaden und waffen-set-spezifischen Knoten
- Normale Juwele, Cluster-Juwele, Unique-Cluster-Juwele und passende Unique-Gegenstände inklusive Aszendenz-Synergien
- Verbesserbare, schlecht genutzte oder nutzlose Affixe; fehlende Attribute, Widerstände und defensive Schwächen
- Mapping- und Boss-Rotation einschließlich Fertigkeits- und Waffenwechselreihenfolge
- Später gegebenenfalls genaue offensive/defensive Werte und eine detaillierte DPS-Simulation

### Erklärungsprinzip

Jede Empfehlung soll Gründe, Vor- und Nachteile erklären: Auswahl von Haupt- und Zusatzfertigkeiten, Supports, passiven Knoten und Pfaden, Juwelen, Clustern, Uniques und Affix-Verbesserungen. Rotationen sollen Reihenfolge, Waffenwechsel, vorbereitende Effekte, deren Fortbestand und Unterschiede zwischen Mapping und Bossen nachvollziehbar machen.

### Geplanter Bedienablauf

1. Klasse, Aszendenz, Level und Ziel wählen.
2. Ausrüstung über Affixe eingeben und beide Waffen-Sets konfigurieren.
3. Optional eine Hauptfertigkeit wählen.
4. Build berechnen.
5. Hauptfertigkeit, weitere Fertigkeiten, Supports, Juwele/Cluster und passiven Baum anzeigen.
6. Mapping- und Boss-Rotation, Build-Erklärung, Affix-Verbesserungen und Uniques anzeigen.

### Geplante Oberfläche

Eine einzige lange Planer-Seite ohne klassische Homepage: Charakter, Ausrüstung, Fertigkeiten/Supports, normale Juwele, Cluster, Unique-Cluster, passiver Skilltree, Berechnung, Ergebnis, Mapping-Rotation, Boss-Rotation, Erklärung, Affix-Verbesserungen und Unique-Empfehlungen.

### Ausrüstungseingabe

Slots speichern mehrere Affixe mit jeweils einem Wert. Ein anklickbarer Dialog bietet Suche, scrollbare Liste, Auswahl, Hinzufügen und Entfernen. Vollständige Gegenstände können später optional ergänzt werden.

### Passiver Skilltree

Langfristig importiert und füllt die Engine den echten Baum. Er soll ausgewählte Pfade, normale/Notable-/Keystone-Knoten, Juwel- und Cluster-Sockel sowie waffen-set-spezifische Pfade darstellen und per Maus und Touch verschiebbar, zoombar, anklickbar und vergrößerbar sein.

### Geplante Datenquellen

PoE2DB ist als mögliche Hauptquelle deutschsprachiger Daten vorgesehen: Klassen, Aszendenzen, Ausrüstung, Affixe, Skills, Supports, passive Knoten, Juwele, Cluster und Uniques. Vor Nutzung sind Schnittstelle, Nutzungsbedingungen, Importerlaubnis, Normalisierung, lokale Speicherung, Versionierung und Updatepflege zu prüfen. Laufzeitberechnungen sollen keine Live-Abhängigkeit von PoE2DB haben.

### Entwicklungsphasen

1. **Klickbarer Prototyp:** Vite, React, TypeScript, mobile-first, lokale Platzhalterdaten, kompletter Ablauf; keine Engine oder DPS-Berechnung. (Abgeschlossen)
2. **Normalisiertes Datenmodell:** Klassen, Aszendenzen, Slots, Affixe, Skills, Supports, Waffen-Sets, Juwelen/Cluster/Uniques, passive Knoten, Rotationen, Empfehlungen und Erklärungen. (Abgeschlossen)
3. **Spieldatenimport:** Quelle und Importformat prüfen, Importskripte erstellen, deutsche Daten normalisieren, validieren und versionieren; keine externe Laufzeitabhängigkeit. (Importgrundlage und Quellenprüfung abgeschlossen; echter Datenimport bis zur Quellenfreigabe blockiert)
4. **Regelbasierte Ausrüstungsanalyse:** Waffen-/Schadensarten und Tags erkennen, Angriff/Zauber sowie Tempo, Krit, Attribute, Anforderungen und Defensive bewerten, Konflikte und schlecht genutzte Affixe erkennen.
5. **Skill- und Support-Empfehlungen:** Haupt- und Zusatzfertigkeiten sowie Supportkombinationen bewerten; Mapping/Boss und Waffen-Sets berücksichtigen.
6. **Passiver Skilltree:** echten Baum importieren, Knoten/Verbindungen darstellen, Knoten und Pfade inklusive Kosten, Cluster-Effizienz und Waffen-Set-Punkte bewerten; Varianten vergleichen.
7. **Juwele und Cluster:** normale, Cluster- und Unique-Cluster-Juwele samt Sockel-, Pfadkosten und Synergien bewerten.
8. **Unique- und Affix-Empfehlungen:** Aszendenz-Synergien und Build-Enabler erkennen, Rare/Unique vergleichen, fehlende Attribute/Widerstände und bessere Affixe mit Vor-/Nachteilen erläutern.
9. **Rotationen und Erklärungen:** Mapping/Boss, Buffs/Debuffs, Skillreihenfolge, Waffenwechsel, anhaltende Effekte sowie Vorbereitung/Hauptschaden modellieren.
10. **Genauere Berechnungen:** Schaden und Defensive präzisieren, Varianten und Einzeländerungen vergleichen. Eine detaillierte DPS-Simulation beginnt erst bei stabilem Datenmodell, korrekt modellierten Skills, Supports, Affixen, passiven Knoten und Waffen-Sets sowie ausreichenden Referenztests.

### Dauerhaft nicht geplant (ohne neue Anweisung)

Anmeldung, Benutzerkonten, klassische Homepage, Community-Funktionen, öffentliche Build-Datenbank, Cloud-Speicherung, Build-Sharing-Plattform, Trade-API, Preisberechnung, Crafting-Simulator, Forum, soziale Funktionen und unnötige Mehrseiten-Navigation.

## 4. Aktueller Entwicklungsstand

Phase 1 und Phase 2 sind implementiert. Phase 3 besitzt eine geprüfte Offline-Importgrundlage; echter Datenimport ist nicht freigegeben. Aufgaben 4A bis 4H lieferten Engine-Architektur sowie eigenständige Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer und einen regelbasierten Rotation Generator. Dieser erzeugt getrennte Mapping- und Bosspläne mit Rollen, kontrollierten Aktionen, expliziten Waffenwechseln, Effekten, Maintenance, Wiederholung, Complexity und Confidence. Die Engine optimiert nicht neu und berechnet weder Zeiten noch DPS. 318 reguläre Vitest-Tests sichern Domäne, Importpipeline und Engine.

## 5. Fertige Funktionen

- Bedienbare Charakter-, Aszendenz-, Level-, Ziel- und Hauptfertigkeitsauswahl
- Zwölf Ausrüstungsslots; Affixdialog mit Suche, Wert, mehreren Affixen und Entfernen
- Sechs Skills mit Rolle, Waffen-Set und fünf sichtbaren Supportplätzen
- Auswahl-/Suchdialoge für normale, Cluster- und Unique-Cluster-Juwele, jeweils entfernbar
- SVG-Testbaum mit markiertem Pfad, Knotentypen, Button-/Rad-Zoom, Pointer-/Touch-Pan und Vollbildmodus
- Deutlich markierte feste Testberechnung mit allen geforderten Ergebnisbereichen und Rotationen
- Dunkles responsives mobile-first Design
- Normalisierte Definitionen und Konfigurationen mit stabilen technischen IDs
- Gemeinsame Quellen-, Versions-, Status- und Tag-Metadaten
- Strukturierte Modifier-, Equipment-, Skill-, Juwel-, Passivbaum-, BuildInput- und BuildResult-Typen
- Reine lokale Datenvalidierung und automatische Vitest-Modelltests
- Quellenbericht unter `docs/DATA_SOURCES.md` mit Primärlinks, Unsicherheiten und ausgeschlossenen Verfahren
- Versioniertes Importmanifest und kanonisches Rohdatenformat für elf Kategorien
- Reine Offline-Pipeline mit deterministischen IDs/Hashes, strukturiertem Bericht und Domänenabbildung
- Künstliche gültige und fehlerhafte Fixtures sowie `npm run import:fixture`
- React-freie Engine-Struktur unter `src/engine/` mit Equipment-first-Datenfluss und zentralem `analyzeBuild`
- Strukturierte Scores, Gründe, harte Verstöße, kontrollierte weiche Kategorien und normiertes `BuildProfile`
- Schnittstellen und künstliche Testlogik für Equipment, Skills, Supports, Passive, Juwele, Uniques, Rotationen und Erklärungen
- Regelbasierter synthetischer Rotation Generator mit Mapping-/Bossplan, zentralen Regeln, expliziten Waffenwechseln, anhaltenden Effekten, strukturierten Bedingungen, Complexity und Confidence
- Drei eindeutig synthetische Engine-Fixtures und 20 deterministische Engine-Architekturtests
- Vollständige Architekturdokumentation unter `docs/ENGINE_ARCHITECTURE.md`
- Zentral konfigurierte Equipment-Regeln und Normalisierung für fünf Schadensarten, Mechaniken, Geschwindigkeit, Defensive und künstliche Attribute
- Getrennte Profile für beide Waffen-Sets, kombiniertes Profil, stabile Dominanzen, Set-Differenzen und Spezialisierungen
- Strukturierte Equipment-Konflikte sowie Klassifikation ungenutzter, schwach genutzter und konfliktbehafteter Modifier
- Fünf synthetische Equipment-Fixtures und 36 dedizierte Equipment-Analyzer-Tests
- Zentral konfigurierte Skill-Regeln, harte Kompatibilitätsprüfung und weiche Bewertung für Schadensarten, Mechaniken, Geschwindigkeit, Klasse, Aszendenz und Ziele
- Skillrollen, getrennte Waffen-Set-Scores, Profilnutzung, Confidence sowie gültige/blockierte, Main-, Utility-, Movement-, Mapping- und Bossranglisten
- Zehn künstliche Skill-Kandidaten und 38 dedizierte Skill-Analyzer-Tests
- Zentral konfigurierte Support-Regeln für Tags, Schadensarten, Mechaniken, Rollen, Waffen, Ziele, Profile und Trade-offs
- Einzelne Support-Empfehlungen mit Set-Scores, Confidence sowie gültigen/blockierten und fünf kategorisierten Ranglisten
- Zehn künstliche Support-Kandidaten und 33 dedizierte Support-Analyzer-Tests
- Dreizehn synthetische Passive-Kandidaten für Einzelknoten, Keystones, Ascendancy und kleine Cluster
- Vereinfachte Graphprüfung, Pfadkosten, scorePerPoint, Path-Efficiency, Set-Scores, Redundanz, Konflikte, Confidence und acht Ranglisten
- 36 dedizierte Passive-Analyzer-Tests
- Vierzehn synthetische Juwelkandidaten und 47 dedizierte Jewel-Analyzer-Tests
- Getrennte Normal-/Cluster-/Unique-Cluster-Bewertung mit Sockeln, Kosten, Effizienz, Enablern, Trade-offs und dreizehn Ranglisten

## 6. Teilweise fertige Funktionen

- Baum und Empfehlungen demonstrieren nur spätere Interaktionen; sie nutzen keine echten Spieldaten.
- Skills zeigen feste Support-Testdaten; freie Skill-/Supportbearbeitung ist noch nicht vorgesehen.
- `BuildInput` ist vollständig typisiert, wird von der Platzhalterberechnung aber noch nicht verarbeitet.
- Der offizielle PoE2-Passivbaumexport ist technisch geeignet, aber Lizenz-/Asset- und Weiterverteilungsfragen sind vor echtem Import noch zu klären.

## 7. Noch offene Aufgaben

- Freigabe, Attribution und zulässigen Importumfang für echte Quellen klären
- Einen echten, eng begrenzten Importadapter erst nach Quellenfreigabe implementieren
- Aufgaben 4H und 4I der Reihe nach umsetzen; 4A bis 4G sind abgeschlossen
- Referenztests und automatisierte UI-Tests ausbauen
- Barrierefreiheit mit spezialisiertem Audit prüfen
- Echte PoE2-Daten erst nach Quellen-/Lizenzprüfung importieren

## 8. Bekannte Bugs

Zum dokumentierten Stand sind nach automatischen Tests sowie Desktop- und Mobilprüfung keine reproduzierbaren Bugs bekannt. Einschränkungen der Platzhalter- und Fixture-Logik sind keine fertigen Produktfunktionen.

## 9. Letzte Änderungen

- Erstes Vite-/React-/TypeScript-Projekt erstellt
- Vollständigen klickbaren Phase-1-Ablauf und responsive Gestaltung implementiert
- README und offizielles Projektgedächtnis angelegt
- Einzelne Modelldatei durch `src/domain/` mit normalisierten Definitionen und Konfigurationen ersetzt
- Sämtliche Platzhalterdaten auf stabile IDs, gemeinsame Metadaten und kontrollierte Tags migriert
- Datenvalidierung und sieben Vitest-Tests ergänzt; UI auf ID-basierte Auflösung umgestellt
- PoE2DB, offizielle GGG-API, GGG-Nutzungsbedingungen und offiziellen PoE2-Passivbaumexport anhand von Primärseiten geprüft
- Datenherkunftsmetadaten, Importmanifest, kanonisches Rohdatenformat und reine Importpipeline ergänzt
- Künstliche Fixtures, strukturierte Fehler-/Importberichte, deterministische Hashes/IDs und zwölf Pipeline-Tests ergänzt
- Remote-Synchronisation nach einer widersprüchlichen GitHub-Webcache-Anzeige erneut geprüft: `git fetch origin` bestätigte Aufgabe-3-Commit `01dc66e61f77271a4fb884b37ae7144951ada3ac` auf `origin/main`; GitHub-API und unveränderliche Raw-SHA-URLs bestätigten die öffentlichen Pflichtdateien. Es war kein History-Eingriff und kein Force-Push erforderlich.
- Aufgabe 4A umgesetzt: eigenständige Engine-Ordnerstruktur, zentrale Typen, getrennte harte/weiche Regeln, normiertes BuildProfile, alle geforderten Analyzer-Schnittstellen, strukturierte Rotation/Erklärung und Orchestrator in verbindlicher Reihenfolge ergänzt
- Drei künstliche Engine-Fixtures, 20 Engine-Tests und `docs/ENGINE_ARCHITECTURE.md` ergänzt; README auf den Platzhalterstatus aktualisiert
- Aufgabe 4B umgesetzt: zentrales Regel-/Konfigurationsmodell, nachvollziehbare Normalisierung, vollständiger synthetischer Equipment-Bericht, Waffen-Set-Analyse, Konflikte und Modifier-Nutzung ergänzt
- Equipment-Fixtures auf fünf Szenarien erweitert und 36 dedizierte Equipment-Tests ergänzt; Architektur und README abgeglichen
- Aufgabe 4C umgesetzt: Skill-Domäne gezielt optional erweitert, zentrale Regeln/Konfiguration, harte Ausschlüsse, weiche Kategorien, Zielgewichtung, Rollen, Set-Eignung, Confidence und Ranglisten ergänzt
- Zehn künstliche Skill-Kandidaten und 38 Skill-Analyzer-Tests ergänzt; Support Analyzer fachlich unverändert gelassen
- Aufgabe 4D umgesetzt: Support-Domäne gezielt optional erweitert, zentrale Regeln/Konfiguration, harte Kompatibilität, weiche Kategorien, Zielgewichtung, Trade-offs, Set-Eignung, Confidence und Ranglisten ergänzt
- Zehn künstliche Support-Kandidaten und 33 Support-Analyzer-Tests ergänzt; Skill und Passive Analyzer fachlich unverändert gelassen
- Aufgabe 4E umgesetzt: Passive-Domäne, zentrale Regeln/Konfiguration, Einzelknoten-/Clusterbewertung, Graphvalidierung, Pfadkosten, Trade-offs, Set-Eignung, Redundanz, Konflikte, Confidence und Ranglisten ergänzt
- Dreizehn synthetische Passive-Kandidaten und 36 Passive-Analyzer-Tests ergänzt; Jewel-, Unique- und Rotationsmodule unverändert gelassen

## 10. Zuletzt getestete Bereiche

Am 20. Juli 2026 nach Abschluss von Aufgabe 3 erfolgreich geprüft:

- `npm install`: Bestand aktuell, 191 Pakete geprüft, 0 gemeldete Schwachstellen; keine neue Abhängigkeit
- `npm run import:fixture`: 23 künstliche Datensätze, 0 verworfen, Status `fixture`, keine Fehler
- `npm run test`: zwei Testdateien, 19 Tests erfolgreich; die bestehenden sieben Domänentests bleiben enthalten
- `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich
- Entwicklungsserver startet fehlerfrei und liefert die Planer-Seite direkt aus
- Charakter: Klassenwechsel auf Zauberin aktualisiert die sichtbaren Aszendenzoptionen
- Affixdialog: Suche nach „Widerstand“, Feuerwiderstand hinzugefügt und wieder entfernt
- Normale Juwelauswahl weiterhin bedienbar
- Sechs Skills und 30 Supportplätze sichtbar
- Testberechnung zeigt weiterhin alle 14 geforderten Ergebnisgruppen
- Skilltree: sieben Testknoten sichtbar, Button-Zoom von 100 auf 120 Prozent
- Desktopdarstellung bei 1280 × 800 und Mobilansicht bei 390 × 844; zwölf Equipment- und sechs Skill-Slots vorhanden, kein horizontaler Überlauf
- Browserkonsole ohne Warnungen oder Fehler
- Repository-Dateiliste auf versehentliche HTML-Dumps, fremde Assets und echte Datenbestände geprüft; keine gefunden
- Nachbesserungsprüfung erneut vollständig ausgeführt: `npm install`, `npm run import:fixture`, `npm run test`, `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich; UI auf Desktop und 390-Pixel-Mobilbreite erneut geprüft, Browserkonsole ohne Warnungen oder Fehler

Touch-Pan wurde durch die gemeinsame Pointer-Event-Implementierung und mobile Layoutprüfung abgedeckt, jedoch nicht auf einem physischen Touchgerät ausgeführt.

Am 20. Juli 2026 nach Aufgabe 4A zusätzlich erfolgreich geprüft:

- lokaler Abhängigkeitsbestand wiederhergestellt; keine neue Abhängigkeit in `package.json` oder `package-lock.json`
- `npm run import:fixture`-äquivalenter lokaler Skriptlauf: 23 künstliche Datensätze, 0 verworfen, keine Fehler
- `npm run test`: drei Testdateien und 39 Tests erfolgreich, einschließlich 20 neuer Engine-Tests
- `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich; 37 Module gebaut
- App startet unverändert direkt mit dem Planer; Charakterwechsel, Affixdialog, normale Juwelauswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren
- Desktop bei 1280 Pixeln und Mobil bei 390 × 844 geprüft; 14 Ergebnisgruppen, sechs Skills und sieben Testbaumknoten sichtbar, kein horizontaler Überlauf
- Browserkonsole ohne Warnungen oder Fehler
- `src/engine/` enthält keine React-Imports, Netzwerkzugriffe, echten PoE2-Daten oder DPS-Formeln
- Nicht auf physischem Touchgerät geprüft; Touch-Pan bleibt durch Pointer-Events und mobile Layoutprüfung abgedeckt

Am 20. Juli 2026 nach Aufgabe 4B zusätzlich erfolgreich geprüft:

- 75 reguläre Tests in vier Dateien erfolgreich, davon 36 dedizierte Equipment-Analyzer-Tests; bestehende 39 Tests bleiben erfolgreich
- Import-Fixture, Lint, Typecheck und Produktions-Build erfolgreich
- Charakterauswahl, Affixdialog, normale Juwelauswahl, Test-Skilltree und Platzhalterberechnung auf Desktop und 390 × 844 weiterhin funktionsfähig
- Kein horizontaler Überlauf und keine neuen Browserkonsolenfehler
- Equipment-Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten oder DPS-/Schadensformeln
- Nicht auf physischem Touchgerät geprüft; keine automatisierten Browser-Regressionstests vorhanden

Am 20. Juli 2026 nach Aufgabe 4C zusätzlich erfolgreich geprüft:

- 113 reguläre Tests in fünf Dateien erfolgreich, davon 38 dedizierte Skill-Analyzer-Tests; bestehende 75 Tests bleiben erfolgreich
- Import-Fixture, Lint, Typecheck und Produktions-Build erfolgreich
- Charakterauswahl, Affixdialog, normale Juwelauswahl, Test-Skilltree und Platzhalterberechnung auf Desktop und 390 × 844 weiterhin funktionsfähig
- Kein horizontaler Überlauf und keine neuen Browserkonsolenfehler
- Skill Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten oder DPS-/Schadensformeln
- Support Analyzer gegenüber Aufgabe 4A fachlich und dateiseitig unverändert
- Nicht auf physischem Touchgerät geprüft; keine automatisierten Browser-Regressionstests vorhanden

Am 20. Juli 2026 nach Aufgabe 4D zusätzlich erfolgreich geprüft:

- 146 reguläre Tests in sechs Dateien erfolgreich, davon 33 dedizierte Support-Analyzer-Tests; bestehende 113 Tests bleiben erfolgreich
- Installation mit unverändertem Lockfile, Import-Fixture (23 importiert, 0 verworfen), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Support Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten, kombinatorische Supportauswahl oder DPS-/Schadensformeln
- Skill und Passive Analyzer fachlich und dateiseitig unverändert
- Charakterwechsel auf Zauberin, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop bei 1280 × 800 und Mobil bei 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf physischem Touchgerät geprüft; Touch-Verhalten bleibt durch Pointer-Events und mobile Layoutprüfung abgedeckt

Am 20. Juli 2026 nach Aufgabe 4E zusätzlich erfolgreich geprüft:

- 182 reguläre Tests in sieben Dateien erfolgreich, davon 36 dedizierte Passive-Analyzer-Tests; bestehende 146 Tests bleiben erfolgreich
- Installation unverändert; Fixture-Import (23 importiert, 0 verworfen), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Passive Engine ohne React, Netzwerk, echte PoE2-Daten, globale Baum-/Pfadsuche oder DPS-Formeln
- Skill-, Support-, Jewel-, Unique- und Rotationsmodule fachlich unverändert
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop bei 1280 × 800 und Mobil bei 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf physischem Touchgerät geprüft; Pointer-Events und mobile Layoutprüfung decken das Touch-Verhalten indirekt ab

Am 20. Juli 2026 nach Aufgabe 4F zusätzlich erfolgreich geprüft:

- 229 reguläre Tests in acht Dateien erfolgreich, davon 47 dedizierte Jewel-Analyzer-Tests; bestehende 182 Tests bleiben erfolgreich
- Fixture-Import (23/0), Lint, Typecheck und Build mit 37 Modulen erfolgreich
- Keine kombinierte Sockelbelegung, echten Daten, DPS oder Änderungen an normalen Unique-, Rotation- und Explanation-Modulen
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren; Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf, Konsole fehlerfrei

Am 20. Juli 2026 nach Aufgabe 4G zusätzlich erfolgreich geprüft:

- 279 reguläre Tests in neun Dateien erfolgreich, davon 50 dedizierte Unique-Analyzer-Tests; bestehende 229 Tests bleiben erfolgreich
- Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Keine kombinierte Unique-Optimierung, Neuoptimierung, echten Daten, Preise, Trade-API oder DPS
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren; Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf, Konsole fehlerfrei

Am 20. Juli 2026 nach Aufgabe 4H zusätzlich erfolgreich geprüft:

- 318 reguläre Tests in zehn Dateien erfolgreich, davon 39 dedizierte Rotation-Generator-Tests; bestehende 279 Tests bleiben erfolgreich
- Zwölf synthetische Rotations-Fixtures für Mapping, Boss, Waffenwechsel, Effekte, fehlende Rollen, Complexity, `both` und Build-Enabler
- Installation unverändert; Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer sowie Explanation Generator fachlich unverändert
- Keine freie Textgenerierung, echten Daten, Netzwerkzugriffe, DPS-, Cooldown- oder Zeitsimulation und keine UI-Anbindung
- Charakterwechsel auf Zauberin, Helm-Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf einem physischen Touchgerät geprüft; mobile Breite und Pointer-basierte bestehende Bedienung wurden indirekt abgedeckt

## 11. Wichtige Architekturentscheidungen

- Eine React-Einzelseite ohne Router, Backend, Datenbank oder Authentifizierung
- Lokaler React-State; normalisierte Platzhalterdaten zentral in `src/data.ts`
- Flache Domänenstruktur in `src/domain/` mit Barrel-Export; Definitionen sind von konkreten Konfigurationen getrennt
- Anzeigenamen sind keine Primärschlüssel; Beziehungen speichern stabile String-IDs
- Gemeinsame `GameDataMetadata` modellieren Quelle, Version, Status und kontrollierte Mechanik-Tags
- Keine Laufzeit-Validierungsbibliothek; reine TypeScript-Funktionen liefern verständliche Fehlerlisten
- Vitest ist die einzige für Aufgabe 2 neu hinzugefügte Testabhängigkeit
- Importformat ist eine Entkopplungsgrenze: externe Strukturen dürfen weder UI noch Engine direkt erreichen
- Importpipeline ist rein, netzwerkfrei und dateisystemfrei; der CLI-Testlauf nutzt die vorhandene Vitest-Toolchain, daher keine neue Abhängigkeit
- FNV-1a-32 dient als reproduzierbare Integritätskennung, nicht als kryptografischer Sicherheitsnachweis
- Importfehler sind strukturierte `ImportIssue`-Objekte und werden niemals stillschweigend ignoriert
- Echte PoE2DB-Daten bleiben blockiert, bis Abruf, Speicherung, Attribution und Weiterverteilung ausdrücklich geklärt sind
- Der offizielle GGG-Passivbaumexport ist der bevorzugte technische Kandidat für einen späteren eng begrenzten Import; Rechte und Assets bleiben vorab zu klären
- Reines CSS ohne UI-Bibliothek; SVG für den Demonstrationsbaum
- Keine externen APIs oder geschützten Spielgrafiken
- Engine und UI sind strikt getrennt; `src/engine/` importiert ausschließlich Domänentypen und besitzt keine React-Abhängigkeit
- Verbindlicher Engine-Datenfluss: Equipment, BuildProfile, Skills, Supports, Passive, Juwele, Uniques, Rotationen, Erklärungen, BuildAnalysis
- Harte Regeln sind blockierende `ConstraintViolation`; weiche Regeln verwenden ausschließlich zentral definierte Bewertungskategorien
- `BuildProfile` nutzt normierte Affinitäten im dokumentierten Bereich 0 bis 100 und enthält keine realen Spiel- oder DPS-Werte
- Empfehlungen werden deterministisch nach Score und bei Gleichstand nach technischer ID sortiert
- Orchestrator und Analyzer verwenden in Aufgabe 4A ausschließlich übergebene synthetische Kandidaten und keine Datei-, Zeit-, Zufalls- oder Netzwerkabhängigkeit
- Equipment-Regeln und sämtliche fachlichen Schwellen sind zentral in `rules.ts` und `config.ts`; die Normalisierung liegt in einer reinen Funktion
- Direkte Equipment-Hinweise werden stärker gewichtet als indirekte; jede Contribution bleibt über strukturierte Reason-Details nachvollziehbar
- Waffen-Sets werden separat und kombiniert analysiert, ohne Rotationslogik aus Aufgabe 4H vorwegzunehmen
- Equipment-Konflikte sind weiche Warnungen; nur technisch unbekannte Modifier-Referenzen blockieren als harte Verstöße
- Dominanz-Gleichstände werden deterministisch nach technischer ID beziehungsweise bei Waffen-Sets als `balanced` aufgelöst
- Skill-Regeln und Schwellen liegen zentral in `src/engine/skills/rules.ts` und `config.ts`; Skill-Metadaten wurden nur optional erweitert
- Blockierte Skills bleiben erklärbar sichtbar, werden jedoch stets hinter gültigen Kandidaten sortiert
- `profileClarity` beeinflusst Confidence getrennt vom Score; Zielprofile beeinflussen Mapping-/Bossranglisten über synthetische Gewichte
- Skill-Set-Scores erzeugen nur Eignungshinweise und nehmen keine Rotationslogik vorweg
- Support-Regeln, Schwellen, Trade-off-Gewichte und Normalisierung liegen zentral in `src/engine/supports/rules.ts` und `config.ts`
- Jeder Support wird unabhängig gegen den bereits ausgewählten Skill bewertet; es gibt bewusst keine kombinatorische Suche
- Blockierte Supports bleiben erklärbar sichtbar, sind aber nicht auswählbar und stehen hinter gültigen Kandidaten
- Set-Eignung und Confidence sind vom Gesamtscore getrennte Ausgaben; technische IDs entscheiden jeden Ranglisten-Gleichstand
- Passive-Regeln und Schwellen liegen zentral in `src/engine/passives/rules.ts` und `config.ts`
- Die Graphprüfung validiert ausschließlich den übergebenen Kandidatenpfad; es gibt keine alternative, kürzeste oder globale Pfadsuche
- `scorePerPoint` und `pathEfficiencyScore` sind getrennte synthetische Effizienzsignale; Pfadknoten bleiben explizite Kosten und können eigenen Nutzen beitragen
- Jewel- und Cluster-Sockel sind nur Anschlusswerte und lösen keine Juwelbewertung aus
- Rotationsregeln und sämtliche Schwellen liegen zentral in `src/engine/rotations/rules.ts` und `config.ts`; der Generator liest vorgelagerte Ergebnisse ausschließlich
- Waffenwechsel sind explizite Schritte und entstehen nur zwischen unterschiedlichen konkreten Sets; `both` löst keinen Wechsel aus
- Maintenance, Wiederholung, Complexity und Confidence sind strukturierte, voneinander getrennte Ausgaben ohne echte Zeitwerte oder Qualitätsbehauptung

## 12. Nächste empfohlene Aufgabe

Aufgabe 4I als nächstes klar abgegrenztes Engine-Modul umsetzen. Zuvor den verbindlichen Auftrag einholen; den Explanation Generator, echte Daten, Preise, DPS oder UI-Funktionen nicht ohne diesen Auftrag erweitern.

## 13. Übergabe für einen neuen Chat

Zuerst Quellcode und dieses Protokoll vergleichen; der Code gewinnt. Danach Abhängigkeiten, Import-Fixture, Tests, Lint, Typecheck und Build prüfen. Alle Analyzer und der Rotation Generator besitzen getrennte Regelmodule und zentrale Schwellen. `docs/ENGINE_ARCHITECTURE.md` dokumentiert Equipment bis Rotation. Nächster Schritt ist ausschließlich 4I nach Vorlage des verbindlichen Auftrags. Engine und UI bleiben getrennt; Fixtures und Regeln sind künstlich und keine echten Spieldaten, Zeit-/DPS-Simulation, kombinierte Optimierung, Preise oder fachliche Empfehlung.

## 14. Arbeitsregeln des Projekts

- Ausschließlich im verbundenen Repository arbeiten; `main` ist der Standardbranch.
- Quellcode ist die maßgebliche Wahrheit; keine erfundenen Funktionen oder Tests dokumentieren.
- Kein Routing, Backend, Datenbank, Login, externe API, PoE2DB-Import, echte DPS-/Optimierungs-Engine oder echter Skilltree ohne ausdrückliche Folgeanweisung.
- Bestehende Funktionen nicht unnötig umschreiben, keine unnötigen Abhängigkeiten/Refactorings und keine Dateien ohne Notwendigkeit löschen.
- Mobile und Desktop prüfen; neue Funktionalität angemessen testen.
- README und dieses Projektgedächtnis nach relevanten Änderungen aktualisieren.
