# Build-Assistent V1 – End-to-End-Integration

## 1. Ziel

Die Aufgabe verbindet die vorhandenen Eingaben und Analyzer zu einem sichtbaren, deterministischen Build-Vorschlag. Ausgangscommit: `4f242d9e0cb15624ebe1d0f455d81ee08c9159f9`.

## 2. Ausgangsstand

Charakter, Ausrüstung, Skills, realer Passive-Worker und PoB2-Unique-Katalog waren einzeln sichtbar. „Test-Build berechnen“ zeigte jedoch nur das feste `buildResult` aus `src/data.ts`.

## 3. Vorhandene Analyzer

Der bestehende `analyzeBuild`-Orchestrator für Equipment, Skill, Support, Passive, Jewel, Unique, Rotation und Erklärung wird wiederverwendet. Keine Bewertungsformel oder Datenpipeline wurde neu geschrieben.

## 4. Vorherige Platzhalter

- Das sichtbare Ergebnis war fest codiert und von Eingaben entkoppelt.
- Der gewählte Hauptangriff steuerte die Supportanalyse nicht.
- Produktive Uniques waren nicht im Ausrüstungsdialog wählbar.
- Lauf-, Eingabe- und Fehlerzustände fehlten.

Die alte `BuildResult`-Fixture bleibt für Bestandstests erhalten, wird von `App.tsx` aber nicht mehr geladen.

## 5. Eingabeflow

`Charakter + Ausrüstung + Hauptangriff + Zielprofil → BuildInput → analyzeBuild → Analyzerresultate → deutsche Ergebnisansicht`.

Klasse, Aszendenz, Level, Zielprofil, Equipment, Affixe, PoB2-Uniques, Varianten und Skill-Setups bleiben erhalten. Nur Klasse, Hauptangriff und Zielprofil sind Mindesteingaben.

## 6. BuildProfile

Der bestehende Equipment Analyzer normalisiert Affixwerte in ein gemeinsames Profil für Schadensarten, Mechaniken, Geschwindigkeit, Defensive, Anforderungen, Ziele und beide Waffensets.

## 7. Worker

Die reale Passive-Tree-Analyse bleibt im vorhandenen Worker und erhält denselben Charakter-, Equipment- und Skillzustand. Der schnelle Gesamtbericht nutzt den bestehenden synchronen Orchestrator. Es entsteht weder eine zweite Engine noch ein unnötiger Transport aller 435 Uniques durch den Passive-Worker.

## 8. Analyzer-Orchestrierung

Stabile Reihenfolge: Equipment → Skills → Supports → Passives → Jewels → Uniques → Rotation → Erklärungen. Der gewählte Hauptangriff ist jetzt Support- und Rotationstreiber; Inkompatibilität wird nicht durch automatische Neuauswahl verdeckt.

## 9. Ergebnisaggregation

Die Ansicht verwendet strukturierte Analyzerfelder. Sie führt keine neue globale Scoreformel ein. Scores, Gründe, Konflikte, Confidence, Trade-offs, Replacement-Verdicts und Waffensetangaben bleiben Modulergebnisse.

## 10. Equipment-Ergebnis

Sichtbar sind belegte und leere Slots, gewählte Uniques und Varianten, dominantes Waffenset, Konflikte sowie Einschränkungen durch fehlende Daten.

## 11. Skill-Ergebnis

Der Hauptangriff erscheint mit Rangwert, Confidence und Kompatibilitätsstatus. Attack-/Spell- und Mechaniksignale stammen aus den vorhandenen Definitionen und Regeln.

## 12. Support-Ergebnis

Zulässige Supports werden gerankt; blockierte Supports erscheinen getrennt mit Grund. Mapping- und Bossgewichte reagieren tatsächlich auf das Zielprofil.

## 13. Passive-Ergebnis

Die strukturierte Empfehlung zeigt begrenzte Kandidaten, Punktkosten und Confidence. Der reale Passive-Worker und die Baumvisualisierung bleiben zusätzlich verfügbar.

## 14. Jewel-Ergebnis

Normale, Cluster- und besondere Juwelen werden typisiert bewertet. Die Ausgabe ist auf die besten Kandidaten begrenzt.

## 15. Unique-Ergebnis

Der Analyzer verarbeitet ausschließlich 435 produktive `pob2:`-Kandidaten; `fixture:`-Kandidaten sind ausgeschlossen. Deutsche Namen und Basistypen stammen aus der getrennten Anzeigeschicht.

Belegte Grenze: Die produktiven Kandidaten besitzen keine technischen Mechanik-Tags oder GGG-Stat-Links. Kandidaten ohne echtes Synergiesignal werden nicht als scheinpräzise Empfehlung ausgegeben. Ausgerüstete Uniques und Varianten bleiben sichtbar.

## 16. Mapping-Profil

Mapping erhöht über vorhandene Analyzergewichte die Mappingpriorität und zeigt den bestehenden Mapping-Rotationsplan oder eine belegte Rotationslücke.

## 17. Boss-Profil

Boss erhöht vorhandene Bossgewichte und zeigt den separaten Bossplan. Es wird keine Rotation aus Freitext erfunden.

## 18. Rotation

Nur Schritte des `rotationGenerator` werden angezeigt. Skill, Reihenfolge, Waffenset und Confidence bleiben erhalten. Fehlt eine Hauptschadensrolle, lautet der Status „Noch nicht vollständig verfügbar“.

## 19. Nächste Verbesserungen

Die Kurzliste wird nur aus Skill- und Affixkonflikten, bestem Support, effizientem passivem Kandidaten, belegten Unique-Synergien und leeren Slots abgeleitet.

## 20. Deutsche Darstellung

Alle neuen UI-Texte sind Deutsch. Interne Mechaniken erhalten verständliche Bezeichnungen. Unique-Namen verwenden die vorhandene deutsche Schicht mit englischem Fallback.

## 21. Mobile Bedienung

Der Ausrüstungsdialog besitzt eine suchbare Unique-Auswahl mit Slotfilter und Variantenwahl. Ergebnisbereiche sind touchfreundlich aufklappbar; lange Texte umbrechen.

## 22. Leere Zustände

Leere optionale Slots blockieren nicht. Fehlende Mindesteingaben blockieren mit deutscher Meldung. Nicht belegbare Ergebnisse werden als unbekannt oder nicht verfügbar gezeigt.

## 23. Fehlerbehandlung

Die Berechnung kennt `idle`, `running`, `completed` und `error`. Geänderte Eingaben verwerfen alte Ergebnisse. Unerwartete Fehler werden sichtbar gemeldet.

## 24. Determinismus

Analyzer und Listen verwenden stabile ID-Sortierung. Der fokussierte Test vergleicht zwei vollständige Auswertungen derselben Eingabe strukturell.

## 25. Tests

Fokussiert geprüft werden Modultransport, Hauptskillsteuerung, Klasse/Aszendenz/Equipment/Unique/Variante, echte PoB2-IDs, Zielprofilwirkung, Determinismus, leere Slots und alle deutschen Ergebnisbereiche.

## 26. Bekannte Lücken

- Technische Affixe ohne semantische Tags tragen weniger zur Profilbildung bei.
- PoB2-Uniques ohne belegte Mechanik-Tags erlauben keine präzise Synergierangliste.
- Skill-, Support-, Passive- und Jewel-Kandidaten bilden einen kleinen V1-Bestand.
- Der reale Passive-Worker bleibt ein separat auslösbarer Schritt.
- Preis, vollständige DPS-Simulation und freie Rotation sind nicht Bestandteil von V1.

## 27. Grenzen von Version 1

V1 liefert eine echte Analyzeraggregation statt einer festen Demo-Ausgabe. Sie beansprucht weder globale Buildoptimalität noch vollständige Spieldatenabdeckung.

## 28. Klare Schlussfolgerung

Die App erzeugt aus dem aktuellen Formularzustand einen zusammenhängenden Build-Vorschlag. Fehlende technische Tiefe bleibt sichtbar und wird nicht erfunden.

## 29. Nächster sinnvoller Entwicklungsschritt

Als nächstes sollten ausschließlich vorhandene, bereits zulässige Kandidatenmetadaten vertieft werden, besonders semantische PoB2-Unique-Signale. Eine neue Datenquellenphase ist nicht erforderlich.

