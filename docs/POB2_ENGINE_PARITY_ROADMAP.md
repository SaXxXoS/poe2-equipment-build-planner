# PoB2-Rechenparität: technischer Fahrplan

## Ziel

Path of Building 2 dient als technische Referenz dafür, welche
Rechenbereiche ein belastbarer PoE2-Buildplaner benötigt. Die Web-App
übernimmt weder Lua zur Laufzeit noch vollständige PoB2-Rohdaten. Die
vorhandene TypeScript-Engine bleibt maßgeblich und wird schrittweise um
belegte, getestete Rechenketten ergänzt.

Referenz:

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- lokal verifizierter Commit:
  `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- bestehender Entscheidungsstatus:
  `approved-with-disclosed-uncertainty`
- keine externe Zustimmung wird behauptet

## Warum die App trotz vieler Analyzer noch falsche Ergebnisse liefern kann

Die Analyzer beantworten unterschiedliche Teilfragen. PoB2 führt
Modifikatoren dagegen in einer zentralen, geordneten Rechenkette zusammen.
Fehlt diese Ordnung, können einzeln plausible Tags oder Scores gemeinsam
eine fachlich falsche Empfehlung ergeben.

Die notwendige Reihenfolge ist sinngemäß:

1. aktive Fertigkeit und zulässige Modifikatoren bestimmen
2. Basiswerte und lokale Gegenstandswerte bilden
3. Schadensumwandlung anwenden
4. zusätzlichen Schaden aus der belegten Ausgangsbasis erzeugen
5. additive Erhöhungen und Verringerungen gruppieren
6. multiplikative Mehr-/Weniger-Wirkungen anwenden
7. kritische Treffer, Frequenz, Wiederholungen und Trefferanzahl bestimmen
8. Zustände, Buffs, Debuffs und Gegnerabwehr anwenden
9. Dauer- und Ailmentschaden getrennt auswerten
10. Ressourcen, Geist, Kosten und Aufrechterhaltbarkeit prüfen
11. jeden Beitrag in einem Rechenprotokoll ausweisen

## Geschlossene Rechenblöcke

`Gain … as Extra Damage` ist nun ein eigener Effekt und keine
Schadensumwandlung:

- der Ursprungsschaden bleibt erhalten
- die zusätzliche Komponente wird separat erzeugt
- sie berücksichtigt belegte Skalierung der Ursprungs- und Zielschadensart
- bedingte oder nicht exakt lesbare Zeilen bleiben wirkungslos
- Herkunft, Prozentsatz und Rechenstufe werden im Ergebnis transportiert

Damit ist ein zuvor fehlender zentraler Teil der PoE-Schadensreihenfolge
geschlossen. Eine vollständige PoB-Gesamt-DPS wird weiterhin nicht
behauptet.

Zusätzlich verarbeitet die Engine jetzt:

- mehrstufige Umwandlungen in der belegten PoE-Reihenfolge
  `Physisch -> Blitz -> Kälte -> Feuer -> Chaos`
- Herkunftslinien für umgewandelten Schaden, damit belegte Modifikatoren der
  Ausgangs- und Zielschadensarten erhalten bleiben
- sämtliche exakt vorhandenen Skill-Levelzeilen des gepinnten PoB2-Stands
- levelabhängige Basiswerte, kritische Trefferchance und Ressourcenkosten
- konstante Skillwerte gemeinsam mit der jeweiligen Levelzeile
- fail-closed Verhalten für nicht vorhandene Level; es wird weder
  interpoliert noch ein Wert erfunden

## Bereits vorhandene Teilmodelle

- Waffen- und Zauberbasiswerte
- mehrstufige Umwandlungen mit geordneter Herkunftslinie
- exakt vorhandene Skill-Level und levelabhängige Kosten
- additive Schadens- und Geschwindigkeitswerte
- ausgewählte strukturierte Support-Multiplikatoren
- kritischer Erwartungswert bei belegter Basis
- explizite Gegnerwiderstände, Durchdringung und Rüstung
- begrenzte zeitliche Wirkungen
- Ressourcen- und Geist-Teilmodell
- fail-closed Modelle für Trigger, Projektile, DoT und Minions

## Noch notwendige Arbeit

1. Qualität und fertigkeitsspezifische Variantenformeln
2. exakte Trennung von Skill- und globaler Umwandlungspriorität
3. Entzünden mit gegnerabhängigem Schwellenwert/Aufbau sowie Sonderfälle
   für Blutung und Gift
4. fertigkeitsspezifische Projektile, Mehrfachtreffer, Fork und Return
5. geschlossene Trigger- und Wiederholungsketten
6. Minion- und Begleitergrundwerte
7. vollständige Defensive, Recovery und Ressourcen
8. durchgängiges Beitragsprotokoll für jede Empfehlung
9. reproduzierbare Referenzbuilds mit festen Eingaben und erwarteten
   Zwischenergebnissen
10. Optimierer erst anschließend gegen diese vollständige Rechenkette
    kalibrieren

## Produktgrenze

Die aktuelle App ist ein deterministischer, evidenzgebundener Teilrechner und
Buildplaner. Sie ist noch kein vollständiger Path-of-Building-Ersatz.
Gleichwertigkeit mit den besten Meta-Builds ist erst belegbar, wenn
repräsentative Builds mit identischen Eingaben und Rechenbedingungen
reproduziert werden. Bis dahin bleiben fehlende Mechaniken sichtbar
`Unbekannt` und erzeugen keinen positiven Bonus.

## Schädigende Zustände: belegter Teilstand

Blutung und Gift besitzen nun eine eigene, von Trefferschaden und
eigenständigem DoT getrennte Rechenkette. Verwendet werden ausschließlich
strukturierte Werte aus dem gepinnten PoB2-Stand:

- Grundschaden pro Sekunde und Grunddauer
- Auslösechance
- relevante ungeminderte Ausgangsschadensarten
- Wirkfrequenz; die allgemeine Angriffstrefferchance ist inzwischen aus
  Genauigkeit und Gegner-Ausweichen integriert
- Zustandswirkung, Dauer und maximale Stapelzahl
- die von PoB2 verwendete gewichtete Schadensroll-Behandlung

Angriffs-Zustände verwenden nun die vollständig belegte allgemeine
Accuracy-Gegnerkette. Bedingte Genauigkeits-Sonderfälle bleiben fail-closed.
Entzünden bleibt weiterhin gesperrt, bis
Gegner-Ailment-Schwelle und Aufbau reproduzierbar modelliert sind. Damit
erzeugt eine bloß plausible, aber unvollständige Zustandskette keinen
positiven Schaden.

## Angriffstrefferchance

Der allgemeine Angriffspfad verwendet nun die PoB2-Formel, die
levelabhängige Basisgenauigkeit, Klassengeschicklichkeit, exakt belegte
Attribut-/Genauigkeitswerte und die gepinnte Gegner-Ausweichtabelle.
Lokale Genauigkeit stammt ausschließlich aus der aktiven Waffe. Die
Ergebnisansicht trennt theoretischen Aktionswert, trefferbereinigten Wert und
den Wert nach Gegnerabwehr. Gegnerblocken und bedingte Genauigkeit bleiben
bis zu einer vollständigen technischen Kette ausgeschlossen.
# Fortschreibung 2026-07-29: Gemmenqualität

Normale aktive Gemmenqualität ist jetzt aus den gepinnten PoB2-`qualityStats`
produktiver Bestandteil der Schadenskette. Exakte Gemmenstufen werden bereits
verwendet. Alternative Qualität und Supportqualität bleiben offen; sie werden
nicht geschätzt.
# Fortschreibung 2026-07-29: Umwandlungspriorität

Intrinsische Skillumwandlung wird jetzt aus dem gepinnten Skilldatensatz
erfasst und vor globaler Umwandlung angewendet. Globale Umwandlung skaliert
nur den verbleibenden Anteil; mehrstufige Vorwärtsketten bleiben erhalten.
# Fortschritt Schritt 35

- Die gepinnte levelabhängige Gegner-Ailmentschwelle ist Bestandteil der
  reduzierten Buildzeitreferenz.
- Entzünden nutzt Feuerschaden, Schwelle, PoB2-Chancemultiplikator, Dauer,
  Wirkfrequenz und Trefferchance.
- Fehlendes Gegnerlevel oder fehlende Wirkparameter blockieren die
  Berechnung weiterhin.
# Fortschritt Schritt 36

- Entzünden und Gift werden nach dem belegten Gegnerwiderstand berechnet.
- Widerstandsreduktion wirkt; Trefferpenetration wird nicht auf den
  Zustandsschaden übertragen.
- Roh-DPS und widerstandsbereinigte DPS bleiben getrennt nachvollziehbar.

# Fortschritt Schritt 37

- Eigenständiger strukturierter Schaden über Zeit übernimmt das aufgelöste
  Vergleichsgegnerprofil.
- Elementarer und Chaosschaden über Zeit berücksichtigen Widerstand und
  belegte Widerstandssenkung.
- Penetration und die Treffer-Rüstungsformel werden nicht fälschlich auf DoT
  angewandt.
- Rohwert und gegnerbereinigter Einzelanwendungswert bleiben getrennt.
# Schritt 38 – PoB2-Zustandskonstanten und passive Aggravation

- Blutungs- und Giftgrundschaden sowie ihre Basisdauer stammen jetzt aus dem
  exakt gepinnten `Misc.lua`.
- Der vollständige unbedingte passive Aggravationsknoten wird mit Dauer,
  Magnitude und Aggravationsmultiplikator gemeinsam angewendet.
- Bedingte oder nur ähnliche Aggravationstexte bleiben fail-closed.
- Das deterministische Schadensreferenzschema ist Version 10.
- Offen bleiben insbesondere kritische Ailment-Sonderfälle, bedingte
  Aggravation und Bewegungserkennung.

# Schritt 39 – Kritische Entzünden-Gewichtung

- Normale und kritische Treffer erhalten getrennte Entzündenchancen.
- Der Entzündenschaden verwendet die nach beiden Auslösepfaden gewichtete
  Feuerschadensbasis aus `CalcOffence.calcAilmentDamage`.
- Die Wahrscheinlichkeit mindestens eines kritisch ausgelösten aktiven
  Entzündens wird nach der gepinnten PoB2-Formel ausgewiesen.
- Kritische Gift-/Blutungs-Sonderregeln bleiben bis zur vollständigen
  Stat- und Bedingungskette fail-closed.

# Schritt 40 – Kritische Blutungs- und Giftgewichtung

- Blutung und Gift verwenden ebenfalls die gewichtete normale/kritische
  Quellschadensbasis aus `CalcOffence.calcAilmentDamage`.
- Die Wahrscheinlichkeit mindestens eines kritisch ausgelösten aktiven
  Zustands wird separat ausgewiesen.
- Bedingte Krit-Zustandsstats bleiben ohne vollständige Quelle-, Waffen- und
  Bedingungskette fail-closed.
# Schritt 41 – bedingte kritische Zustandschance

- Normale und kritische Gift-/Blutungschancen können getrennt transportiert
  und nach effektiver Kritchance gewichtet werden.
- `Critical Hits Poison the enemy` wird über stabile Unique-ID, exakte
  englische PoB2-Zeile und den gepinnten Modifikatorpfad aufgelöst.
- Variantenbezug wird fail-closed geprüft.
- OCR, Freitext, deutsche Anzeige und Ähnlichkeitssuche erzeugen keine
  technische Zustandswirkung.
- Weitere bedingte Zustandsstats bleiben offen.
# Schritt 42 – kritische Angriffs-Aggravation

- Eine exakte Unique-Bedingung verschärft nur Blutung aus kritischen
  Angriffstreffern.
- Normale Treffer, Zaubertreffer und bereits global verschärfte Blutungen
  erhalten keinen unzulässigen zusätzlichen Multiplikator.
- Varianten- und Quellenauflösung bleiben fail-closed.

# Fortschritt Schritt 50 – gemeinsame Meta-Auslösung und Ziel-Cooldowns

- Exakte Stat-IDs aus dem gepinnten PoB2-Stand belegen den gemeinsamen
  Energiebedarf und die gemeinsame Auslösung aller eingebetteten Ziele.
- Jedes Ziel erhält anschließend seine eigene server-taktgerundete
  Cooldown-Grenze. Ein langsames Ziel begrenzt kein anderes Ziel.
- Eine rotierende Zielauswahl wird für diese Meta-Fertigkeiten nicht
  erfunden.
- Trigger-Teilmodell `1.6.0`.

# Fortschritt Schritt 51 – gespeicherte Nutzungen

- Ziele mit mehreren gespeicherten Nutzungen behalten ihren exakten
  Cooldown; nur Ziele mit höchstens einer Nutzung werden auf Server-Ticks
  aufgerundet.
- Die Nutzungszahl wird sichtbar ausgewiesen, aber nicht fälschlich als
  dauerhafter Schadensmultiplikator verwendet.
- Trigger-Teilmodell `1.7.0`.

# Fortschritt Schritt 75 – ladungsabhängige Barrage-Wiederholungen

- Die gepinnte Regel `+1 Barrage-Wiederholung pro Raserei-Ladung` wird im
  Rechennachweis getrennt von den sicheren Basiswiederholungen ausgewiesen.
- Ohne bestätigte verfügbare Ladungszahl entsteht kein erfundener
  Schadensbonus.
- `Combat Frenzy` transportiert sein belegtes Erzeugungsintervall;
  `Disengage` transportiert seine bedingten drei Ladungen. Beide bleiben
  ohne vollständige Auslösekette nicht produktiv.
- Folgefertigkeitsmodell `2.1.0`, Ladungszustandsmodell `1.1.0`.

# Fortschritt Schritt 76 – Unleash-Folgezaubersequenz

- Zwei gepinnte Unleash-Siegel werden als zwei Wiederholungen des unmittelbar
  folgenden Zaubers verarbeitet.
- Nur ein ausdrücklich `Unleashable` markierter Zielzauber erhält den
  vorbereiteten Sequenzfaktor `3`; Angriffe und nicht direkt verbundene
  Fertigkeiten bleiben blockiert.
- Der Faktor beschreibt eine vorbereitete Sequenz und wird nicht als
  dauerhafter DPS-Multiplikator ausgegeben.
- Folgefertigkeitsmodell `3.0.0`, Schadensrechner `3.17.0`.

# Fortschritt Schritt 77 – Fertigkeitssiegel

- `Freezing Salvo` transportiert seine belegten zehn Siegel, eine
  Wiederholung je Siegel, 750 ms Aufbauintervall und 7.500 ms vollständige
  Vorbereitungszeit.
- Ohne bestätigten aktuellen Siegelstand entsteht kein erfundener
  Sequenz- oder DPS-Multiplikator.
- Siegelzustandsmodell `1.0.0`, Schadensrechner `3.18.0`.

# Fortschritt Schritt 78 – aufladbare Projektilfolgen

- Ember Fusillade transportiert maximal zehn Projektile, 100 ms
  Freigabeabstand, 1.300 ms Wirkzeit und 5 % finalen Schaden je
  abgefeuertem Ember.
- Ohne aktuellen Emberstand, bestätigte Trefferzahl und Zielüberlappung wird
  kein falscher DPS-Multiplikator erzeugt.
- Siegel- und Projektilzustände werden nun im Ergebnis sichtbar erklärt.
- Projektilaufbaumodell `1.0.0`, Schadensrechner `3.19.0`.

# Fortschritt Schritt 79 – stufengenaue Zustandskapazität

- Siegel und aufladbare Projektile werden aus der exakt angewandten
  Gemmenstufe gelesen.
- Ember Fusillade besitzt dadurch auf Stufe 1 sechs, auf Stufe 10 sieben und
  auf Stufe 20 zehn mögliche Projektile.
- Nicht vorhandene angeforderte Stufen werden weder interpoliert noch durch
  einen Referenzhöchstwert ersetzt.
- Siegelzustand `1.1.0`, Projektilaufbau `1.1.0`, Schadensrechner `3.20.0`.

# Fortschritt Schritt 80 – kanalisierte Fertigkeitsstufen

- Flameblast und Supercharged Slam besitzen jetzt ein strukturiertes,
  gemmenstufengebundenes Vollstufenszenario.
- Voll aufgeladene Treffer werden getrennt vom normalen Dauerschaden vor und
  nach verfügbarer Gegnerabwehr ausgewiesen.
- Ein aktueller Stufenstand oder eine dauerhafte Vollaufladung wird nicht
  erfunden.
- Kanalstufenmodell `1.0.0`, Schadensrechner `3.21.0`.
- Detaildokument:
  `docs/BUILD_ASSISTANT_CHANNELLED_STAGE_STEP_80.md`.

# Fortschritt Schritt 81 – aufgeladene Fertigkeitsszenarien

- Detonating Arrow transportiert vier Stufen und im Vollstufenszenario
  480 % des Schadens als zusätzlichen Feuerschaden.
- Volcano transportiert drei zusätzliche Stufen, Faktor 5,5 für die
  Anfangsexplosion und zwölf zusätzliche Projektile.
- Unbelegte Projektilüberlappung und dauerhafte Vollaufladung werden nicht
  als Schaden angenommen.
- Aufladungsmodell `1.0.0`, Schadensrechner `3.22.0`.
- Detaildokument:
  `docs/BUILD_ASSISTANT_CHARGED_SKILLS_STEP_81.md`.

# Fortschritt Schritt 82 – reproduzierbare Mikro-Parität

- Sechs unabhängige Erwartungsfälle prüfen Basiszauber, Krit-Erwartung,
  elementare Gegnerabwehr, Waffenangriff, Kanalisierung und Aufladung.
- Jeder Fall ist an den freigegebenen PoB2-Commit und konkrete
  Quelldateien gebunden.
- Zusätzliche Projektile bleiben ohne Trefferbeleg ein sichtbarer
  Mechanikwert und kein erfundener Einzelzielmultiplikator.
- Die Suite belegt einzelne Rechenketten; vollständige Build-Parität bleibt
  ausdrücklich offen.
- Detaildokument:
  `docs/BUILD_ASSISTANT_POB2_MICRO_PARITY_STEP_82.md`.

# Fortschritt Schritt 83 – persistente Stufenzustände

- Arktische Rüstung transportiert auf Gemmenstufe 20 fünf stationäre Stapel,
  725 ms Aufbau je Stapel und ein vollständig vorbereitetes
  Vergeltungsszenario von 505–760 zusätzlichem Kälteschaden.
- Siegel der Macht transportiert vier Stufen, 14 % finalen Zauberschaden je
  Stufe und damit Faktor 1,56 im Vollstufenszenario.
- Beide Szenarien bleiben ohne belegten aktuellen Zustand vom Dauerschaden
  getrennt.
- Persistentes Stufenmodell `1.0.0`, zeitabhängiges Offensivmodell `1.3.0`,
  Schadensrechner `3.23.0`.
- Detaildokument:
  `docs/BUILD_ASSISTANT_PERSISTENT_STAGE_STATES_STEP_83.md`.

# Fortschritt Schritt 84 – Charged Staff je Power Charge

- Charged Staff liest Schaden und Dauer je verbrauchter Power Charge aus der
  exakt angewandten Gemmenstufe.
- Stufe 20 ergibt 1–22 zusätzlichen Blitzschaden und 6 Sekunden Dauer je
  Charge; Stufe 10 ergibt 1–7.
- Eine nicht belegte Ladungszahl erzeugt keinen permanenten Bonus.
- Der Mikro-Paritätsbestand umfasst nun sechs Fälle.
- Ladungszustandsmodell `1.2.0`, Schadensrechner `3.24.0`.
- Detaildokument:
  `docs/BUILD_ASSISTANT_CHARGED_STAFF_STEP_84.md`.
# Schritt 85: Elementarzustände und Resonanz

Elemental Conflux und Trinity sind als strukturierte, nicht produktive Zustandsszenarien integriert. Aktives Element und aktuelle Resonanz bleiben ohne belegten Laufzeitzustand unbekannt; dadurch entsteht kein erfundener Dauerschadensbonus. Details: `BUILD_ASSISTANT_ELEMENTAL_STATES_STEP_85.md`.
