# Build-Assistent V1.3 – Equipment-first-Bedienung

## Ziel und Entscheidung

V1.3 setzt die ursprüngliche Produktidee sichtbar um: Der Spieler bildet Charakter und vorhandene Gegenstände nach; die bestehende Analyzer-Kette leitet daraus den Build-Vorschlag ab. Die fachliche Pipeline bleibt `Eingabe → BuildProfile → Analyzer → Aggregation → Ergebnis`.

Festgelegt sind der Start mit der Klassenliste, die nachgelagerte Aszendenzwahl, Level und Story-Passivpunkte als Zahlenfelder, automatisch berechnete Gesamtpunkte sowie die anschließende Ausrüstung. Die erwähnten Referenzbilder lagen bei der Implementierung nicht als lokale Dateien vor. Deshalb wurden ausschließlich die schriftlich festgelegte räumliche Slotlogik und neutrale lokale Platzhalter umgesetzt.

## Vorher und Abweichung

Das bisherige Equipment-Modell konnte bereits mehrere `modifierValues` transportieren und der Equipment Analyzer wertete sie vollständig aus. Die sichtbare Oberfläche vermittelte dies jedoch nicht: Affixe wurden in einem generischen Hinzufügen-Dialog gesammelt, ohne erkennbare Rare-3/3-Struktur. Die Fertigkeitsansicht bestand aus technisch wirkenden Karten ohne Suche, Änderung oder Supportverwaltung.

## Neuer Hauptablauf

1. Klasse als mobile Liste
2. passende Aszendenz als separate Liste
3. Level, Story-Punkte, Gesamtpunkte und Zielprofil
4. räumlich gruppierte Ausrüstung
5. sechs Fertigkeitskarten und optionale weitere Karten
6. Berechnung und bestehende Ergebnisansicht

Zustand liegt weiterhin zentral in `App`; ein Wechsel zwischen Abschnitten löscht keine Eingaben.

## Charakter und Passivpunkte

Unterstützte Klassen werden als Liste dargestellt; nicht unterstützte Klassen bleiben sichtbar gekennzeichnet und deaktiviert. Nach der Klasse erscheinen nur zugehörige Aszendenzen. Die Vorbelegung der normalen Passivpunkte lautet `max(0, Level - 1) + zusätzliche Story-Punkte` und wird durch das technische Maximum der bestehenden Passive-Pipeline begrenzt. Eine Quest-Checkliste wurde nicht ergänzt.

## Spielähnliche Ausrüstungsanordnung

Helm, Amulett, Körperrüstung, Handschuhe, Gürtel, Ringe und Schuhe bilden ein kompaktes Paperdoll-Raster. Waffenset 1 und 2 besitzen getrennte Paare. Juwelen, Charms und Fläschchen stehen in einem eigenen Bereich. Leere Slots zeigen eine klare Hinzufügeaktion; belegte Slots fassen Seltenheit, Basis/Itemklasse, Sockel und tatsächliche Affixwerte zusammen.

## Item-Editor

Ein leerer Slot öffnet zuerst `Normal`, `Magisch`, `Selten` oder `Einzigartig`. Ein belegter Slot bietet Bearbeiten, Ersetzen oder Entfernen.

- Normal: keine regulären Prefixe/Suffixe
- Magisch: ein Prefix und ein Suffix
- Selten: drei sichtbare Prefixe und drei sichtbare Suffixe
- Einzigartig: PoB2-Unique und Variante; keine normalen Affixe

Implicits, Prefixe, Suffixe und Sockel sind getrennte Bereiche. Der Editor startet mit einem Sockel. Weitere Sockel können hinzugefügt, zuletzt hinzugefügte entfernt werden. Ein technisch sicherer, basistypabhängiger maximaler Sockelwert ist im aktuellen Produktbestand unbekannt; deshalb wird keine unbestätigte harte Obergrenze behauptet. Sockelinhalte sind ebenfalls noch unbekannt.

## Affixgruppen, Suche und Werte

Die Auswahl wird weiterhin mit den vorhandenen Regeln nach Slot, Itemklasse, Generation Type, optionalem Item-Level und bei Implicits nach Basistyp gefiltert. Die Suche filtert live. Enge deutsche Suchaliasse wie „Leben“, „Feuer“ oder „Angriff“ beruhen auf der bestehenden technischen Affixsemantik; sie erzeugen keine neue technische Identität.

Sichtbare Texte werden von Parser-Auswahlmarkern wie `Accuracy|Accuracy|` bereinigt. Wo keine deutsche Spielbeschreibung vorhanden ist, bleibt der bereinigte englische technische Text der transparente Fallback.

Das Tier ist keine Pflichtauswahl. Für jede variable technische Statzeile wird der tatsächliche Wert innerhalb des bestätigten Bereichs eingegeben. Feste Werte erzeugen kein Feld. Integer/Dezimal, Prozent und bestätigte Grenzen bleiben erhalten. Mehrwert-Affixe besitzen je Statzeile ein Feld; bei einer erkennbaren Zweiwertdarstellung werden Minimum und Maximum getrennt geführt.

## Mehrfach-Affix-Modell und Migration

Es wurde keine parallele Item-Engine eingeführt. `modifierValues` bleibt die einzige kanonische Liste; `affixSide` trennt Implicit, Prefix und Suffix. Ergänzt wurden nur:

- `rarity`
- `sockets`
- `baseDisplayName` als reine Anzeigeangabe, wenn der freigegebene technische
  Basistypkatalog eine Itemklasse nicht abdeckt; daraus wird keine technische
  Basistypidentität abgeleitet

Alte Einträge ohne Seltenheit werden deterministisch aus Unique-Status und vorhandenen expliziten Affixen migriert. Bestehende tatsächliche `statValues` bleiben unverändert. IDs neuer Editorplätze sind deterministisch aus Item-ID, Seite und Position aufgebaut. Der gemeinsame Request-Adapter migriert vor der Analyzerübergabe; sämtliche belegten Affixe erreichen daher weiterhin den Equipment Analyzer.

## Fertigkeitskarten und Supports

Sechs Karten sind standardmäßig vorhanden. Weitere manuelle Plätze lassen sich hinzufügen und entfernen. Jede Karte enthält neutralen Bildplatz, deutschen Namen mit englischem Fallback, Rolle, Waffenset, Herkunft, Suche und eigenen Supportbereich.

Die produktiven V1.1-Kandidaten ersetzen in der Auswahl den früheren kleinen Demo-Bestand. Unterstützungen werden pro Karte gespeichert. „Beste vorschlagen“ führt die vorhandene Analyzer-Kette für genau diese Fertigkeit aus; harte Inkompatibilitäten bleiben maßgeblich.

Eine manuelle Hauptfertigkeit bleibt Build-Treiber. Ohne manuelle Hauptfertigkeit nimmt der Orchestrator den bestbewerteten gültigen Hauptskill statt den ersten Datensatz. Technisch bestätigte automatische Aszendenzfertigkeiten sind im aktuellen Bestand **Unbekannt**; daher wird keine erfunden. Durch Ausrüstung gewährte Fertigkeiten sind im freigegebenen Minimalbestand ebenfalls nicht verlässlich verfügbar und werden nicht automatisch aktiviert.

## Equipment-first-Analyse und Ergebnis

Alle tatsächlichen Affixwerte bleiben im BuildProfile-Transport erhalten. Die Ausrüstung bildet weiterhin das Profil für Schaden, Mechanik, Verteidigung, Ressourcen, Konflikte und Confidence.

Die Ergebnisansicht ergänzt:

- stark passende Affixe
- teilweise genutzte Affixe
- Konflikte/unpassende Affixe
- fehlende defensive Grundlage
- tatsächliche gespeicherte Werte

Als Build-Eignung wird bewusst eine Kategorie statt einer Prozentzahl angezeigt. Die Kategorien verwenden vorhandene Profilklarheit, Skillvalidität und Confidence; sie sind keine DPS-Aussage. Eine freie Marketingzahl wurde nicht eingeführt.

## Waffensets, Passive, Mapping, Boss und Rotation

Die bestehenden getrennten Waffensets, Passive-Pipeline, Mapping-/Boss-Ranglisten und Rotationsguards bleiben bestehen. Der Editor schreibt das Waffenset weiterhin über die Slot-ID; Skills transportieren ihre Setzuordnung. Rotation erscheint nur bei vorhandener Evidenz.

## Mobile Benutzerführung

Der Editor nutzt einen viewportgebundenen Dialog mit festem Kopf, einer primären internen Scrollfläche und fest erreichbaren Aktionen. Paperdoll, Waffenpaare, Suche, Wertefelder, Plus/Minus und Skillkarten sind für 390 × 844 ausgelegt. Touchflächen besitzen mindestens die bestehende 46-Pixel-Mindesthöhe.

## Tests und Grenzen

19 fokussierte V1.3-/End-to-End-Tests decken Seltenheitsgrenzen, 3/3 plus
Implicit, deterministische Migration, Parsertextbereinigung, Klassenstart,
räumliche Equipmentgruppen und sechs Skillkarten ab. Im vollständigen
Parallel-Lauf bestanden 1.016/1.019 Tests; drei ausschließlich zeitbedingt
abgebrochene Passive-/Offline-Auditprüfungen bestanden im vorgeschriebenen
seriellen Wiederholungslauf mit 50/50 Tests. Lint, Typecheck, Produktions- und
Pages-Build sind erfolgreich.

Die technische Browserprüfung bestätigte Desktop und 390 × 844 ohne
horizontalen Dokumentüberlauf. Der Item-Editor blieb vollständig im Viewport,
zeigte 3/3 Affixplätze und einen Startsockel; die Live-Suche „Leben“ lieferte
46 technisch passende Helm-Prefixe. Die Browserkonsole enthielt keine neuen
Fehler oder Warnungen.

Bekannte Grenzen:

- exakte Sockelmaxima pro Basistyp: **Unbekannt**
- technisch belegte Sockelinhalte: **Unbekannt**
- automatisch gewährte Aszendenzfertigkeiten: im vorhandenen Bestand nicht bestätigt
- ausrüstungseigene Skillreferenzen: im reduzierten PoB2-Produktbestand nicht vollständig freigegeben
- viele normale Affixtexte besitzen weiterhin nur englischen technischen Fallback
- echte Item-/Skillbilder sind nicht freigegeben; neutrale lokale Platzhalter werden verwendet

## Schlussfolgerung und nächster Auftrag

Der vorhandene Charakter kann mit getrennten Raritäten, mehreren Affixen, tatsächlichen Werten, Implicits, Sockelanzahl, Waffensets und bearbeitbaren Fertigkeitskarten abgebildet werden. Die Eingaben laufen durch die bestehende Build-Engine; keine zweite Engine und keine neue Quelle wurden eingeführt.

Der nächste sinnvolle Auftrag ist ein eng begrenzter V1.3.1-Praxistest und UX-Feinschliff mit den tatsächlich gewünschten Referenzbildern als lokal bereitgestellte Dateien, insbesondere für Sockelregeln, Dialognavigation und sprachliche Affixdarstellung.
