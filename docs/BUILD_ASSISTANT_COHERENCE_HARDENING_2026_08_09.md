# Härtung der sichtbaren Buildpakete – 9. August 2026

## Ziel und Ergebnis

Diese Änderung schließt drei konkret belegte Lücken im bestehenden Build-Assistenten, ohne eine zweite Engine oder neue Produktdatenquelle einzuführen:

- automatisch gewählte Haupt- und Ergänzungsfertigkeiten erhalten nur noch Supports aus ihrer eigenen geprüften Rangliste,
- sichtbare Unique-Empfehlungen benötigen mindestens eine positive, belegte Wirkung,
- die vollständige Klassen-/Aszendenzmatrix prüft nun auch die tatsächlich sichtbare Skill-, Support- und Waffensetbelegung.

Die Architektur bleibt unverändert: Eingabe → BuildProfile → bestehende Analyzer → Optimierung → Ergebnisaggregation → deutsche Anzeige.

## Vollständige Produktmatrix

Der deterministische Prüflauf umfasst alle 23 produktiv auswählbaren Klassen-/Aszendenzkombinationen mit Level 90, 24 Story-Passivpunkten, leerer Ausrüstung und leerem Fertigkeitsbereich.

| Messwert | Ergebnis |
| --- | ---: |
| auswählbare Profile | 23/23 |
| kohärente Skill-/Waffenpakete | 23/23 |
| passende geplante Waffenklasse | 23/23 |
| Hauptskill mit fünf Supports | 23/23 |
| Profile mit belegter Ergänzungsfertigkeit | 19/23 |
| Set-1-Fertigkeit | 23/23 |
| Set-2-Fertigkeit | 19/23 |
| verschiedene Hauptfertigkeiten | 16 |
| verschiedene Waffenarten | 8 |

Vier Profile besitzen im aktuellen gepinnten Datenbestand keine ausreichend belegte aktive Ergänzungsfertigkeit:

- Krieger / Titan / Erdspalter / Streitkolben,
- Jägerin / Amazone / Wirbelnder Schlag / Speer,
- Jägerin / Geistwandlerin / Wirbelwind / Speer,
- Söldner / Gemmenlegionär / Wirbelnder Schlag / Speer.

Diese vier Set-2-Slots bleiben leer. Eine beliebige zweite Fertigkeit nur zur optischen Vollständigkeit würde die fachliche Aussage verschlechtern.

## Supportbelegung

Die automatische Befüllung vereinigt bevorzugte Paketsupports, die Analyzer-Rangliste und weitere zugelassene Kandidaten. Vor der sichtbaren Übernahme wird jeder Kandidat erneut gegen die konkrete Fertigkeit geprüft. Doppelte Support-IDs werden entfernt. Ein Support, der nur zu einer anderen Fertigkeit passt, kann dadurch nicht mehr über eine allgemeine Kandidatenliste in die Karte gelangen.

Der gleiche Pfad wird für die automatische Buildbefüllung und die Schaltfläche „Beste vorschlagen“ verwendet.

## Unique-Empfehlungen

Die Ergebnisansicht zeigt nur noch Unique-Kandidaten mit mindestens einem positiven Beleg:

- Build-Enabler,
- Unterstützung des aktuellen Builds,
- positiver Schaden-, Verteidigungs- oder Ressourcenbeitrag,
- positive Aszendenz- oder Ausrüstungssynergie.

Reine Slotkompatibilität oder ein Name reichen nicht aus. Die Liste bleibt auf einen Kandidaten je Slot und höchstens fünf sichtbare Empfehlungen begrenzt.

## Passive-, Waffenset- und Aszendenzbudgets

Die bestehende Pipeline wurde durch einen harten Integrationsfall abgesichert:

- 107 normale Punkte ergeben bei 24 Waffenset-Punkten 83 fest gemeinsame Belegungen,
- jedes aktive Waffenset besitzt 83 gemeinsame plus bis zu 24 eigene Belegungen,
- Waffenset 1 und 2 erzeugen niemals 48 gleichzeitig aktive Zusatzpunkte,
- acht Aszendenzpunkte bleiben ein eigener Topf,
- Juwelfassungen, Keystones und Aszendenzknoten bleiben als Waffenset-Ziele gesperrt.

Rot und Grün erscheinen nur, wenn die beiden belegten Setprofile tatsächlich unterschiedliche Ziele besitzen. Bei identischer fachlicher Verteilung bleibt der gemeinsame Weg gelb.

## Browserprüfung

Der Produktions-Build wurde lokal unter dem echten GitHub-Pages-Unterpfad geprüft. Nach der vollständigen Analyse waren Hauptfertigkeit und fünf Supports sichtbar; eine vorhandene Ergänzungsfertigkeit erhielt ebenfalls fünf eigene Supports. Bei 390 × 844:

- standen die ersten drei geprüften Fertigkeitskarten bei identischem X-Wert und gleicher Breite untereinander,
- betrug die Seitenbreite 375 Pixel bei 390 Pixel Viewportbreite,
- bestand kein horizontaler Überlauf,
- enthielt die Browserkonsole keine Fehler oder Warnungen.

## Prüfstatus

- Lint: erfolgreich, ohne Warnung,
- Typecheck: erfolgreich,
- fokussierte Abschlussprüfung: 54/54 Tests,
- fachliche Gesamtsuite: 1.935/1.935 Tests; drei im gemeinsamen Hochlastlauf zeitüberschrittene Vollbaumtests bestanden im direkten seriellen Wiederholungslauf,
- Produktions- und Pages-Build: erfolgreich,
- Optimierermatrix: erfolgreich,
- JSON- und Diffprüfung: im Abschlusslauf geprüft.

## Ehrliche Grenze

Die Änderung belegt deterministische interne Kohärenz und verhindert mehrere konkrete Falschempfehlungen. Sie beweist weder mathematisch global höchste DPS noch vollständige Gleichwertigkeit mit Path of Building oder allen aktuellen Meta-Builds. Nicht belegte Zusammenhänge bleiben leer beziehungsweise unbekannt.

## Nächster fachlicher Schritt

Die vier noch fehlenden Set-2-Beziehungen benötigen eine versionierte, technisch korrelierte Skillbeziehung im bereits freigegebenen Datenverfahren. Erst danach dürfen diese Slots automatisch befüllt werden. Danach sollte die quantitative Schadensmodellabdeckung der bereits vorhandenen 23 Pakete gegen reproduzierbare Referenzprofile erweitert werden.
