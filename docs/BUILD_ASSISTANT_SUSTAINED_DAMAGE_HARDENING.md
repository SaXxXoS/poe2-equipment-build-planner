# Nachhaltige Schadens- und Trefferfrequenz-Härtung

## Ziel

Dieser Schritt schließt die nächste belegbare Rechenlücke des Build-Assistenten. Trefferfrequenz, Uptime und eigenständiger Schaden über Zeit werden nur dann in den Variantenvergleich aufgenommen, wenn die gepinnten lokalen Daten Dauer, Intervall und gegebenenfalls Einzelzielgrenzen eindeutig liefern.

Die bestehende Architektur bleibt unverändert:

`Eingabe -> BuildProfile -> Damage Engine -> Variantenoptimierer -> Analyzer -> Ergebnisansicht`

## Quellenstand

- PoB2-Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Produktivpin: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Lokale numerische Referenz: `generated/pob2/damage-reference.json`
- Enthaltene Fertigkeitsrecords: 337
- Erkannte Records mit strukturierten Trefferschadensfeldern: 184
- Erkannte DoT-Kandidaten: 15
- Erkannte Minion-/Begleiterkandidaten: 28

Der Pin wurde nicht geändert. Aktuellere Upstream-Daten werden nicht stillschweigend mit dem freigegebenen Produktbestand vermischt.

## Behobener Waffen-DPS-Fehler

Bei einer Waffe aus dem gepinnten Basiskatalog konnte die Aktionsgeschwindigkeit intern als boolesches `false` statt als fehlender beobachteter Wert ankommen. Dadurch wurde die vorhandene Basisgeschwindigkeit nicht verwendet und ein ansonsten berechenbarer Angriff erhielt null Aktionen pro Sekunde.

Die Auswahl verwendet nun korrekt:

1. einen tatsächlich beobachteten finalen Waffenwert, wenn vorhanden;
2. andernfalls die gepinnte Basisgeschwindigkeit;
3. darauf nur technisch zugeordnete lokale Geschwindigkeitsmodifikatoren.

Ein Regressionstest mit Kompositbogen und Eisschuss belegt einen positiven, deterministischen Angriffswert. Außerdem transportiert der Variantenoptimierer die gewählte Charakterklasse in die Trefferchanceberechnung.

## Nachhaltige Trefferfrequenz

Das neue Modell `sustained-hit-frequency` trennt Aktivierungen von tatsächlichen periodischen Schadensereignissen. Es ist bewusst auf drei vollständig strukturierte Fälle begrenzt:

- `Orb of Storms`: Dauer, autonomes Blitzintervall und maximale Trefferzahl;
- `Solar Orb`: Dauer und Pulsintervall;
- `Thunderstorm`: Dauer, Trefferintervall und Einzelziel-Treffersperre.

Für diese Fertigkeiten wird die nachhaltige Einzelzielrate aus Dauer, Intervall, Uptime und belegten Begrenzungen berechnet. Erneutes Wirken erhöht nicht nochmals künstlich die Pulsfrequenz. Unterstützungen, Ressourcenverbrauch und Cooldowns verwenden weiterhin die Aktivierungsrate; Schaden, Zustandsauslösung und bestätigte Trigger verwenden die tatsächliche Ereignisrate.

## Schaden über Zeit

Eigenständige strukturierte DoT-Effekte besitzen nun zusätzlich:

- Anwendungsrate;
- aufrechterhaltbare Uptime;
- nachhaltigen DPS vor Gegnerabwehr;
- nachhaltigen DPS nach Gegnerabwehr.

Die Uptime ist auf 100 Prozent begrenzt. Zusätzliche Stapel, Überlappung oder Mehrfachanwendungen werden nicht erfunden. Der Variantenoptimierer verwendet nur den nachhaltigen Wert und addiert nicht länger einen bloßen Einzelanwendungswert als vermeintlichen dauerhaften DPS.

## Bereits vorhandene Modelle

Die folgenden Systeme bleiben in derselben Damage Engine verbunden:

- bestätigte Meta- und interne Trigger einschließlich Energie, Ereignisrate, Cooldown und gespeicherter Nutzungen;
- Mana-, Leben-, Geist- und Wutkosten sowie belegte Support-Kostenmultiplikatoren;
- Gemmenstufe und belegte Qualitätswerte;
- Trefferchance, kritische Treffer, Gegnerwiderstände und Rüstung;
- vollständig belegte Entzünden-, Gift- und Blutungsketten;
- Waffenset-, Passive- und Aszendenzwirkungen;
- Projektilabdeckung ohne erfundene Boss-Mehrfachtreffer.

## Fail-closed Grenzen

Folgende Fälle erzeugen weiterhin keinen positiven erfundenen DPS:

- `Ball Lightning`: Trefferintervall ist vorhanden, aber eine belastbare Lebensdauer beziehungsweise Gesamt-Trefferkette fehlt im Pin;
- `Firestorm`: Bolzenintervall ist vorhanden, die räumliche Einzelziel-Trefferwahrscheinlichkeit ist nicht belegt;
- `Storm Lance`, `Twister` und ähnliche anhaltende Objekte: Kontakt-, Bewegungs-, Detonations- oder Überlappungsregeln sind nicht vollständig genug;
- zusätzliche ausgelöste `Orb of Storms`-Blitze ohne vollständige Setup-Beziehung;
- Minions und Begleiter: Kreaturen-Grundschaden, eigene Angriffs-/Zauberfrequenz und aktive Uptime fehlen im freigegebenen Referenzvertrag.

Diese Grenzen sind kein stiller Fehler: Die Engine gibt sie als blockierte beziehungsweise unbekannte Teile aus und erzeugt daraus keinen Rankingbonus.

## Optimierermatrix

Die erneuerte Produktmatrix bestätigt:

- 23/23 Profile ausgewählt;
- 23/23 Pakete kohärent;
- 23/23 Waffenpläne passen zum gewählten Paket;
- 23/23 ausgewählte Pakete besitzen eine positive vergleichbare Schadensbasis;
- 23/23 Hauptskills und 23/23 Setup-Gruppen besitzen konkrete Supports;
- 21 belegte Zwei-Set-Pakete und 2 fachlich begründete Ein-Set-Pakete;
- 0 Phantom-Waffensets;
- 0 doppelte Hauptsupportfamilien;
- 57/57 geprüfte Kombinationen numerisch vergleichbar.

Die Matrix belegt interne Konsistenz innerhalb der gepinnten Daten. Sie beweist weder globale höchste DPS noch vollständige Path-of-Building-Parität oder Überlegenheit gegenüber allen Live-Meta-Builds.

## Determinismus und Tests

Die Modellberechnungen verwenden keine Zeitstempel, Zufallswerte oder Runtime-Netzwerkdaten. Gleiche Eingaben und gleiche Pins erzeugen dieselben Ereignisraten, Uptime-Werte und Rangfolgen.

Fokussierte Tests decken insbesondere ab:

- positive Angriffsgeschwindigkeit aus gepinnter Waffenbasis;
- Solar-Orb-Pulsrate;
- Orb-of-Storms-Treffergrenze;
- Thunderstorm-Einzelzielsperre und Uptime;
- DoT-Uptime unter und bei voller Aufrechterhaltung;
- vollständige produktive Klassen-/Aszendenzmatrix.

## Abschlussprüfung

- Der vollständige serielle Lauf umfasste 173 Testdateien und 2.004 Tests.
  2.000 Tests bestanden unmittelbar; vier sehr große Vollbaum-, Optimierer-
  und Performancefälle überschritten ausschließlich ihr gemeinsames
  Laufzeitfenster. Dieselben vier Fälle bestanden anschließend unverändert
  und ohne gelockerte Facherwartung isoliert. Damit sind 2.004/2.004
  fachliche Assertions erfolgreich.
- Typecheck, Lint, Produktions-Build, Pages-Build und die native Validierung
  aller 253 JSON-Dateien sind erfolgreich.
- Die Produktionsoberfläche wurde mit dem tatsächlich erzeugten Pages-Build
  geprüft. Das leere Profil Zauberin/Sturmweberin, Stufe 90, 24 Storypunkte
  und acht Aszendenzpunkte erzeugte ohne Ausrüstung ein zusammenhängendes
  Paket mit Komet als Hauptskill, Set-1- und Set-2-Fertigkeiten, konkreten
  Supports, 24/24 Waffenset-Punkten je Set sowie 8/8 Aszendenzpunkten.
- Desktop 1280 × 720 und die eingebettete mobile Prüfgröße 390 × 844 besitzen
  keinen horizontalen Überlauf. Die mobile Skillliste verwendet exakt eine
  321 Pixel breite Spalte; die Karten stehen untereinander. Die direkte
  Produktionsseite erzeugte keine Browserkonsolenfehler oder -warnungen.

## Schlussfolgerung

Der Build-Assistent vergleicht jetzt alle 23 produktiven Startpakete auf einer positiven, gemeinsamen und nachhaltigeren Schadensbasis. Die zuvor belegbar fehlenden Waffen-Aktionswerte, periodischen Einzelzieltreffer und DoT-Uptime sind geschlossen.

Nicht belegte räumliche Mehrfachtreffer, Minion-DPS und komplexe Sonderfälle bleiben ausdrücklich unbekannt. Deshalb ist die App innerhalb ihres freigegebenen lokalen Datenstands kohärenter und belastbarer, aber weiterhin kein vollständiger Path-of-Building-Ersatz.
