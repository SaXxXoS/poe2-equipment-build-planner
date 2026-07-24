# Build-Assistent V1.3.1 – UX-Korrektur

## Nachtrag: Fertigkeits- und Supportauswahl

Die Fertigkeitssuche ist keine Kombination aus Suchfeld und geschlossenem
Browser-Select mehr. Fokus oder Antippen öffnet unmittelbar eine sichtbare,
scrollbare Trefferliste. Jede Eingabe filtert deutsche Namen und englische
Fallbacknamen live; die Auswahl übernimmt den Treffer direkt in die Karte.

Jede leere Fertigkeitskarte zeigt fünf klar erkennbare Supportplätze mit dem
Hinweis, zuerst eine Fertigkeit zu wählen. Nach der Fertigkeitswahl sind die
fünf Plätze einzeln bedienbar. Ein leerer Platz öffnet eine ebenfalls
live-filternde Supportauswahl; gewählte Supports bleiben der jeweiligen
Fertigkeitskarte zugeordnet.

Der produktive Kandidatenbestand bleibt vorerst bei 12 Fertigkeiten und 13
Unterstützungen. Die lokal vorhandenen umfangreicheren RePoE-/Parserbestände
sind für Skills und Supports im maßgeblichen Approval ausdrücklich
`blocked`. Sie wurden deshalb nicht stillschweigend produktiv importiert.
Für einen vollständigen Spielbestand ist als nächster Datenauftrag ein
gesonderter, gepinnter Skill-/Support-Scope mit Feld-, Provenienz- und
Distributionsentscheidung erforderlich.

## 1. Ziel und Ausgangsstand

Ausgangspunkt ist Commit `020ec87f9bc81f9938a5108ef6369153f43fef49`.
V1.3 besitzt bereits den vollständigen Item-Editor, mehrere Affixe und
tatsächliche Werte je Gegenstand, BuildProfile-Transport, Analyzer,
Passive-Pfade, Waffensets sowie Mapping-, Boss- und Build-Ergebnisse.
V1.3.1 ändert diese Fachfunktionen nicht. Korrigiert werden ausschließlich
Charakterauswahl, Initialzustand, Equipment-Anordnung, Skillkarten und die
mobile Zahleneingabe.

## 2. Auftraggeberfeedback und Abweichungen von V1.3

Die V1.3-Oberfläche zeigte Klassen dauerhaft als lange Liste und ergänzte eine
große Charakterkarte. Level und Storypunkte waren sichtbar mit Zahlen
vorbelegt. Der App-Root übernahm zudem das produktive Demo-`skillSetups`-Array:
sechs Beispielskills und deren Supports erschienen dadurch ungefragt beim
ersten Laden. Das Equipment war in voneinander getrennte, gleichförmige
Bereiche aufgeteilt; Skillkarten wurden bei mobiler Breite zu schmal.

Die Ursache der nicht löschbaren Null war die direkte Umwandlung des
Eingabewerts mit `Number(...)`: `Number('')` ergibt `0`, sodass React die
gelöschte Eingabe unmittelbar wieder als Null renderte.

## 3. Charakterbereich vorher und nachher

Der Charakterbereich verwendet jetzt genau zwei kompakte Auswahlzeilen:

1. `Klasse` mit dem leeren Zustand `Klasse auswählen`
2. `Aszendenz` mit `Zuerst Klasse auswählen`, bis eine Klasse gewählt wurde

Eine große Charakterkarte und die permanent sichtbare Klassenliste entfallen.
Ein Klassenwechsel entfernt eine nicht mehr passende Aszendenz
deterministisch.

### Klassenfilterung und deutsche Anzeige

Die Produktliste folgt ausschließlich dem vorhandenen technischen Flag
`selectableInCurrentUi`. Sichtbar sind:

- Hexe
- Waldläuferin
- Krieger
- Zauberin
- Jägerin
- Söldner
- Mönch
- Druide

Die im Register nicht produktiv auswählbaren Einträge `Marauder`, `Duelist`,
`Shadow` und `Templar` werden vollständig ausgeblendet. Interne IDs und
technische Registerbezeichnungen bleiben unverändert. Die deutschen Namen
sind App-Anzeigebezeichnungen; daraus wird keine neue technische Quelle
abgeleitet.

### Aszendenzflow

Vor der Klassenwahl ist die Aszendenzauswahl deaktiviert. Danach enthält sie
nur Aszendenzen der gewählten Klasse, deren bestehender Registereintrag
ebenfalls produktiv auswählbar ist. Die sichtbaren Namen werden in der
kompakten Auswahl auf Deutsch dargestellt.

### Charakterdaten und Zahlenfeldkorrektur

Der kompakte Datenbereich trennt:

- Level
- Passivpunkte durch Level
- Story-Passivpunkte
- Gesamtpunkte

Level und Storypunkte besitzen lokale Textentwürfe. Ein leerer String bleibt
während der Eingabe sichtbar leer; erst Validierung oder Berechnung
interpretiert den Zustand fachlich. `inputMode="numeric"` und das
Ziffernmuster aktivieren eine geeignete mobile Tastatur, ohne den leeren
Entwurf wie ein HTML-Zahlenfeld zu verlieren. Die vorhandene
Passivpunktberechnung bleibt unverändert und zählt Storypunkte genau einmal.

## 4. Produktiver Leerzustand und Fixture-Trennung

`App.tsx` erzeugt nun einen eigenen leeren Produktzustand:

- keine Klasse oder Aszendenz
- Level und Storypunkte sichtbar leer
- alle Equipment-Slots leer
- genau sechs leere Skillkarten
- keine Skills, Supports oder Build-Ergebnisse

Die früheren Beispiele Blitzpfeil, Kugelblitz, Sturmrufer, Flammenwand,
Zeitverzerrung und Sprungschlag werden nicht mehr im Produktinitialzustand
geladen. Ihre Fixtures und weitere Beispielprofile bleiben ausschließlich in
Tests beziehungsweise expliziten Datenmodulen erhalten.

## 5. Ausrüstungsreferenzen und neue Anordnung

Die schriftliche spielähnliche Referenz des Auftraggebers sowie die
Mobalytics-Equipmentansicht wurden ausschließlich als Layout- und
Bedieninspiration verwendet. Es wurden weder fremde CSS-Regeln noch Bilder,
Logos, Quellcode oder sonstige Assets übernommen. Die in früheren Aufgaben
erwähnten lokalen Referenzbilder waren im aktuellen Workspace nicht
verfügbar; deshalb wird keine erneute visuelle Prüfung dieser Dateien
behauptet.

### Waffenset-Umschalter

Ein kompakter Umschalter `Waffenset 1 | Waffenset 2` wechselt ausschließlich
die beiden Waffenplätze. Helm, Brust, Handschuhe, Schuhe, Gürtel, Amulett und
Ringe bleiben an ihrer Position und behalten ihren Zustand.

### Spielähnliche Slotanordnung

Die Hauptausrüstung ist ein zusammenhängendes räumliches Raster:

- Helm oben mittig
- Amulett und Brust in der Mittelachse
- Hauptwaffe links und Offhand rechts
- Handschuhe, Gürtel, Ringe und Schuhe in erkennbarer Körperanordnung

Leere Slots verwenden eine kompakte Hinzufügeaktion. Belegte Slots zeigen
Name, Seltenheit, Affixanzahl und Sockelanzahl; Details verbleiben im
unveränderten Item-Editor.

Juwelen, Charms und Fläschchen stehen darunter in getrennten kompakten
Gruppen. Es wurden keine neuen Slotregeln eingeführt.

## 6. Fertigkeitsbereich vorher und nachher

Vorher wurden produktive Demo-Setups als vorhandene Skills gerendert. Jetzt
zeigt der erste App-Start sechs kompakte leere Karten. Eine leere Karte
enthält nur Slotnummer, Suchfeld und Fertigkeitsauswahl. Rollen,
Waffensetdetails, Supportliste und Vorschlagsaktionen erscheinen erst nach
einer tatsächlichen Skillwahl.

Nach der Auswahl zeigt die belegte Karte weiterhin Bildplatzhalter,
deutschen Namen mit bestehendem Fallback, Herkunft, Rolle, Waffenset und die
zugeordneten Supports. Supports stehen untereinander und bleiben der
richtigen Karte zugeordnet. Zusätzliche manuelle Slots können hinzugefügt und
wieder entfernt werden; die sechs Startplätze bleiben erhalten.

Auf mobilen Viewports bis einschließlich 430 Pixel sind die Karten zwingend
einspaltig. Bei 390 × 844 wurden sechs Karten mit jeweils 321 Pixel Breite,
keine gemeinsame Kartenzeile und kein horizontaler Dokumentüberlauf
gemessen.

## 7. Unveränderte Fachfunktion

Unverändert bleiben:

- vollständiger Normal-/Magisch-/Selten-/Unique-Item-Editor
- drei Prefix- und drei Suffixplätze für Rare
- Implicits, Sockel und tatsächliche Affixwerte
- Mehrfach-Affix-Normalisierung und BuildProfile
- Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer
- automatische Hauptskill-Empfehlung nach einer ausgelösten Analyse
- Passive-Pfade, Waffensets, Mapping, Boss, Rotation und Build-Ergebnis

V1.3.1 fügt keine Skill-, Support-, Datenquellen- oder Analyzerregel hinzu und
ändert keine Scores.

## 8. Tests und mobile Prüfung

Die neuen fokussierten Tests prüfen kompakte Klassen- und
Aszendenzauswahl, produktive Registerfilterung, deutsche Namen, löschbare
Zahlentwürfe, leere Initialfabriken, Waffensetumschaltung, getrennte
Utility-Gruppen sowie sechs leere Skillkarten ohne Supports.

Der vollständige Paralleltestlauf bestand 1.017 von 1.020 Tests; drei
rechenintensive, unveränderte Baum-/Lokalisierungsaudits überschritten unter
paralleler Last ausschließlich ihr Zeitlimit. Der vorgeschriebene serielle
Wiederholungslauf der beiden betroffenen Dateien bestand 50/50 Tests. Lint,
Typecheck, Produktions-Build und Pages-Build sind erfolgreich. 132
Repository-JSON-Dateien wurden mit `JSON.parse` validiert.

Die Browserprüfung umfasst Desktop und 390 × 844. Sie bestätigt die echte
Tastaturlöschung, einspaltige Karten, Breiten, fehlenden horizontalen
Überlauf, Waffensetwechsel, Skillaktivierung und eine leere Fehler- und
Warnkonsole. Der Item-Editor öffnet weiterhin mit der
Seltenheitsauswahl. Der Deployment- und finale Git-Status wird im
Abschlussbericht mit den tatsächlich gemessenen Resultaten angegeben.

## 9. Bekannte Grenzen

- Echte Item- und Skillbilder sind weiterhin nicht freigegeben; neutrale
  lokale Platzhalter bleiben bestehen.
- Vollständiger sprachlicher Affixfeinschliff ist nicht Teil dieser Aufgabe.
- Automatische Skills aus Aszendenz oder Equipment bleiben ohne bestätigte
  technische Zuordnung **Unbekannt**.
- Die Referenzbilder des Auftraggebers waren im aktuellen Workspace nicht
  vorhanden; ihre schriftlich festgelegte Geometrie wurde umgesetzt.

## 10. Schlussfolgerung und nächster Schritt

Die sichtbare Benutzerführung startet leer, verwendet kompakte abhängige
Charakterauswahlen, eine zusammenhängende Equipmentansicht mit
Waffensetumschaltung und einspaltige mobile Skillkarten. Die bestehende
V1.3-Fachfunktion bleibt erhalten.

Nach erfolgreicher Gesamt- und Deploymentprüfung ist der nächste sinnvolle
Schritt ein enger Auftraggeber-Praxistest des korrigierten Flows. Erst daraus
abgeleitete konkrete Darstellungs- oder Sprachkorrekturen sollten folgen.
