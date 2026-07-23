# Build-Assistent V1.2 – funktionale Vollständigkeit

## 1. Ziel

V1.2 schließt bestätigte Integrationslücken des bestehenden Build-Assistenten. Die Architektur bleibt Eingabe → BuildProfile → Analyzer → Aggregation → Ergebnis.

## 2. Auftraggeberentscheidung

Zuerst wird Version 1 funktional abgeschlossen. Design, mobile Benutzerführung, deutsche Restübersetzung und sprachlicher Feinschliff bilden einen getrennten Folgeabschnitt.

## 3. Abgrenzung zu Design und Übersetzung

Keine Datenquelle, kein Produktpin, keine Affix- oder Unique-Produktdatei und keine Übersetzung wurde geändert. Affixdialog, Farben, Icons, Animationen und Gesamtdesign blieben unverändert.

## 4. Ausgangsstand

Ausgangscommit: `1242dd78f0bb4eedacaeb03505390704aefa78d1`. V1.1 stellte 12 Skills, 13 Supports, 13 Juwel-/Clusterkandidaten, 1.507 semantisch klassifizierte Affixe und 288 rankbare PoB2-Uniques bereit.

## 5. Funktionsinventar

| Funktion | Vorher | Nachher | Komponente/Analyzer | bekannte Grenze |
|---|---|---|---|---|
| Klasse/Aszendenz | vollständig produktiv | unverändert | CharacterSection/BuildProfile | Beta-Inhalte werden nicht erfunden |
| normale Ausrüstung/Affixe/Implicits | produktiv | unverändert | EquipmentSection/Equipment Analyzer | sichtbare Affixtexte später |
| PoB2-Uniques/Varianten/Legacy | produktiv | unverändert | Registry/Unique Analyzer | nur evidenzbasiert rankbar |
| Waffenset 1/2 | teilweise verbunden | funktional verbunden | Equipment/Skill/Support/Unique/Rotation | unbekannte Waffenart bleibt `any` |
| Hauptskill/Supports | produktiv | Waffenkontext ergänzt | Skill/Support Analyzer | Kandidatenbreite bleibt V1.1 |
| Passive-Schwerpunkte | produktiv | unverändert | Passive Analyzer | heuristische Empfehlung |
| konkrete Passive-Pfade | separat sichtbar | im Gesamtergebnis verbunden | Worker/Pipeline/Tree | bewusster manueller Rechenstart |
| Juwelen/Cluster | produktiv | unverändert | Jewel Analyzer | begrenzte Rangliste |
| Mapping/Boss | teilweise | alle Kandidatengruppen sichtbar | vorhandene Rankings | identische Resultate werden nicht künstlich getrennt |
| Rotation | zu breit gespeist | nur konfigurierte Skills | Rotation Generator | fehlende Rollen bleiben offen |
| nächste Schritte | produktiv, begrenzt | defensive Bedarfe ergänzt | Aggregation | keine Item-DPS-Bewertung |
| unvollständige Eingaben | produktiv | unverändert abgesichert | Validierung/Analyzer | Klasse, Hauptskill und Profil sind Pflicht |
| Offline | produktiv statisch | bestätigt | Pages-Bundle | keine neue PWA-Ausbaustufe |

## 6. Version-1-Grenze

Kategorie A umfasste Waffenkontext, Set-Verfügbarkeit, konkrete Passive-Pfade im Gesamtergebnis, vollständige Mapping-/Boss-Ranglisten und eine belegte Rotationsauswahl. Kategorie B umfasst Darstellung und Übersetzung. Preis-, Trade-, DPS-, Crafting-, Foto-, Account-, Cloud- und Communityfunktionen sind Kategorie C.

## 7. Platzhalter vorher

Keine zentrale Schaltfläche war wirkungslos. Die bestätigten Lücken waren technisch vorhandene, aber nicht vollständig verbundene Resultate. Interne historische Status- und Versionsnamen mit `placeholder`/`synthetic` bleiben technische Altbezeichnungen; die produktiven V1-Ergebnisse stammen nicht aus Testfixtures.

## 8. Geschlossene Lücken

- `EngineRequest.weaponContext` transportiert erkannte Waffenarten und tatsächlich belegte Sets.
- Skill-, Support- und Unique-Analyzer erhalten diesen Kontext.
- Set 2 ist nur verfügbar, wenn dort ein Item liegt.
- Rotation verwendet nur Hauptskill und konfigurierte Skill-Setups.
- Der Compact-Passive-Plan erscheint mit Reihenfolge, Kosten und Pfadknoten im Build-Ergebnis.
- Mapping und Boss zeigen getrennte Supports, Passive, Juwelen und Uniques.
- Defensive Bedarfe fließen in priorisierte nächste Schritte ein.

## 9. Verbleibende Grenzen

Unbekannte Waffenklassen bleiben bewusst `any`. Eine Rotation ohne belegte Rollen wird nicht ergänzt. Der Passive-Pfad wird wegen der vorhandenen Worker-Architektur weiterhin ausdrücklich gestartet. Spielerische globale Optimalität wird nicht behauptet.

## 10. Ausrüstung

Alle 18 vorhandenen Slots bleiben auswählbar und optional leer. Normale Items transportieren technische Klasse, Basis, Itemlevel und Affixe in das BuildProfile.

## 11. Normale Affixe

Prefix, Suffix und Implicit bleiben getrennt. Die technische Semantik aus V1.1 bleibt maßgeblich; sichtbare englische oder fehlerhaft formatierte Texte sind geparkte Darstellungsarbeit.

## 12. Uniques

435 echte PoB2-Uniques und 579 Varianten bleiben quellengetrennt. Ranking, Level, Slot, Evidenz, Trade-offs, Replacement-Verdict und Reoptimierungsbedarf bleiben im bestehenden Unique Analyzer.

## 13. Waffenset 1

Belegte linke/rechte Slots aktivieren Set 1. Technisch erkannte Waffenklassen werden in synthetische Analyzer-Waffenkategorien überführt.

## 14. Waffenset 2

Set 2 wird nur bei tatsächlicher Belegung aktiviert. Ein leeres Set 2 blockiert nicht und erzeugt keinen erfundenen Wechsel.

## 15. Hauptskill

Der ausgewählte `desiredMainSkillId` bleibt Build-Treiber. Eine unpassende reale Waffenart erzeugt einen harten Konflikt.

## 16. Supports

Harte Skill- und Waffenregeln bleiben vorrangig. Mapping- und Bosslisten werden aus den vorhandenen profilgewichteten Rankings angezeigt.

## 17. Passive Analyzer

Schwerpunkte, Knoten, Cluster, Keystones, Kosten und Trade-offs bleiben durch den vorhandenen Analyzer bestimmt.

## 18. Konkrete Passive-Pfade

Das Compact-Ergebnis der realen Passive-Pipeline wird ohne zweite Pfadberechnung in den Build-Vorschlag übernommen. Es zeigt Zielreihenfolge, inkrementelle Kosten, Pfadknoten, Budgetverbrauch und Confidence; der vorhandene Baum erhält denselben Plan.

## 19. Juwelen

Normale Juwelen, Cluster und besondere Juwelen bleiben getrennte Kandidatenarten mit Sockel-, Eintritts- und internen Punktkosten.

## 20. Cluster

Cluster werden durch den bestehenden Jewel Analyzer bewertet. Es wurde kein Kostenmodell vereinfacht.

## 21. Mapping

Mapping zeigt vorhandene Support-, Passive-, Juwel- und Unique-Ranglisten sowie die belegte Mapping-Rotation.

## 22. Boss

Boss zeigt dieselben vier Kandidatengruppen aus den Boss-Rankings sowie die belegte Boss-Rotation.

## 23. Rotation

Nur der Hauptskill und tatsächlich konfigurierte Skill-Setups dürfen Schritte liefern. Nicht konfigurierte Empfehlungen werden nicht als ausgeführte Rotation dargestellt; fehlende Rollen bleiben sichtbar.

## 24. Nächste Verbesserungen

Schritte werden aus Konflikten, Widerstands-/Verteidigungsbedarf, Support-, Passive- und Unique-Ergebnissen sowie leeren Slots abgeleitet.

## 25. Fehlerfälle

Unbekannte Semantik, Variante, Übersetzung, Baumreferenz oder leere Kandidatenliste darf keine UI-Ausnahme erzeugen. Nicht belegbare Ergebnisse bleiben unbekannt oder nicht verfügbar.

## 26. Unvollständige Eingaben

Klasse, Hauptskill und Zielprofil sind Mindestangaben. Aszendenz und Ausrüstung dürfen fachlich unvollständig sein; leere optionale Slots reduzieren nur die Sicherheit.

## 27. Offline-Nutzung

Produktive Daten und Berechnungslogik liegen im statischen Build. Es bestehen keine Runtime-API, Rohquellenabfrage oder Hotlink-Abhängigkeit. Eine zusätzliche PWA-/Service-Worker-Stufe wurde nicht begonnen.

## 28. Determinismus

Gleiche Eingaben, Pins und Kandidaten erzeugen gleiche Analyzerresultate, Rangfolgen, Rotationen und nächste Schritte.

## 29. Tests

Fokussierte Tests decken Waffentypen, beide Sets, leeres Set 2, harte Waffeninkompatibilität, konfigurierte Rotation, Mapping/Boss, unvollständige Eingaben und Determinismus ab. Die komplette Suite, ein serieller Wiederholungslauf, Lint, Typecheck, Builds, JSON- und Git-Prüfungen sind Abschlussbedingungen.

Ergebnis: 51 fokussierte V1.2-/Rotationstests und 95 Grenz-/Approval-Tests bestanden. Die Gesamtsuite bestand mit 1.012/1.012 Tests. Drei zeitkritische Passive-Performanceprüfungen bestanden zusätzlich seriell. Lint, Typecheck, Produktions- und Pages-Build sowie 132 JSON-Dateien waren erfolgreich. Die technische Browserprüfung zeigte Desktop und 390 × 844 ohne horizontalen Seitenüberlauf oder neue Konsolenfehler/-warnungen; der mobile Ausrüstungsdialog blieb innerhalb des Viewports.

## 30. Funktionaler Abschlussstatus

Alle bestätigten Kategorie-A-Lücken sind geschlossen. Funktionen mit fehlender fachlicher Datengrundlage sind als begrenzt dokumentiert und nicht erfunden.

## 31. Ausdrücklich geparkte Designpunkte

- Affixdialog mobil zu groß oder unübersichtlich
- ungünstige Zeilenumbrüche
- Tier und Item-Level visuell zu dominant
- visuelle Hierarchie, Abstände, Schriftgrößen und Touchflächen
- Farben, Icons, Animationen und Gesamtgestaltung
- mobile Benutzerführung

## 32. Ausdrücklich geparkte Übersetzungspunkte

- normale Affixe noch teilweise englisch
- sichtbare technische Begriffe
- Darstellungen wie `Accuracy|Accuracy|`
- deutsche Restlokalisierung
- sprachlicher Feinschliff der Unique-Anzeigetexte

## 33. Klare Schlussfolgerung

Version 1 besitzt den vorgesehenen technischen End-to-End-Umfang. Belegte Grenzen bei Rotation, unbekannten Waffenarten und globaler Build-Optimalität bleiben transparent.

## 34. Nächster Auftrag

Als nächster getrennter Projektabschnitt kann die Design-, deutsche Darstellungs- und Benutzerfreundlichkeitsphase beginnen. Sie soll die geparkten Punkte bearbeiten, ohne die nun abgeschlossene fachliche Pipeline neu zu entwerfen.
