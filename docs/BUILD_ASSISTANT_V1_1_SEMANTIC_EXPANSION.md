# Build-Assistent V1.1 – semantische Erweiterung

## 1. Ziel

V1.1 erweitert die fachlich verwertbaren Eingaben der vorhandenen Analyzer. Es entsteht keine zweite Engine.

## 2. Ausgangsstand

Ausgangscommit ist `143e605b3af83e9ed446e27c5c20ba7a1a03ffb0`. V1 arbeitete produktiv mit 6 Skills, 5 Supports, 7 Juwel-/Clusterkandidaten, 2.255 technischen Affixen ohne breite Analyzer-Tags und 435 PoB2-Uniques ohne Ranking-Semantik.

## 3. Bestehende End-to-End-Architektur

`Eingabe → BuildProfile → vorhandene Analyzer → Ergebnisaggregation → deutsche Ergebnisansicht` bleibt unverändert. Orchestrator, Scoremodelle und Zielprofilgewichte bleiben maßgeblich.

## 4. Kandidatenbestand vorher

6 Skills, 5 Supports und 7 Juwel-/Clusterkandidaten.

## 5. Kandidatenbestand nachher

12 Skills, 13 Supports und 13 Juwel-/Clusterkandidaten. Testfixtures gelangen nicht in den produktiven Pool.

## 6. Skill-Erweiterung

Ergänzt wurden Explosivgranate, Eisschlag, Knochensturm, Funke, Ansteckung und Erdbeben. Die kuratierten V1.1-Regeln führen Attack/Spell, Mechaniken, Schadensarten, Rollen, Waffenanforderungen und Mapping-/Boss-Basiswerte mit versionierter Projektprovenienz.

## 7. Support-Erweiterung

Ergänzt wurden drei elementare Zusatzschaden-Supports, Brutalität, Kontrollierte Zerstörung, Konzentrierte Wirkung, Vergrößerter Wirkungsbereich und Schnelles Leiden. Harte `requiredTags`/`excludedTags` bleiben blockierend; Zielprofil und Trade-offs wirken über den bestehenden Analyzer.

## 8. Jewel-Erweiterung

Drei normale Juwelen, zwei Cluster und ein besonderes defensives Cluster ergänzen den Bestand. Sockel-, Eintritts- und interne Punktkosten werden weiterhin vom vorhandenen Kostenmodell berechnet.

## 9. Normale Affix-Semantik

Die vorhandenen 2.255 technischen Affixe werden über bestätigte Stat-IDs klassifiziert. 1.507 besitzen verwertbare Tags, davon 406 mehrzeilige beziehungsweise abgeleitete Klassifikationen; 748 bleiben ungelöst. Sichtbare deutsche Texte sind keine technische Quelle.

## 10. Unique-Semantik

Eine getrennte Laufzeit-Ableitung klassifiziert englische PoB2-Planerzeilen. Die Produktdatei und deutsche Anzeigeschicht bleiben bytegleich.

## 11. Evidenzklassen

`structured-exact`, `structured-derived`, `text-pattern-exact`, `text-pattern-ambiguous` und `unresolved` sind explizit. Nur belastbare Klassen können Ranking-Signale liefern.

## 12. Zulässige Ableitungen

Zulässig sind Slot, Kategorie, Level, exakte Waffenartkategorien sowie eng begrenzte reguläre Ausdrücke für klar benannte Schadensarten, Mechaniken und Defensivwerte.

## 13. Unzulässige Ableitungen

Verboten bleiben Fuzzy Matching, freie Textähnlichkeit, Itemnameninterpretation, deutsche Anzeigetexte, KI-Klassifizierung sowie erfundene GGG-Mod-/Stat-IDs.

## 14. Variantenbehandlung

Itemweite Semantik verwendet ausschließlich Quellzeilen, die in jeder Variante vorkommen. Variantenspezifische Eigenschaften werden nicht auf andere Varianten übertragen.

## 15. Legacy-Behandlung

Legacy-only-Zeilen werden nicht itemweit gerankt. Die bestehende Legacy-Anzeige bleibt unverändert.

## 16. Negative Effekte

21 Items besitzen ein eng erkanntes negatives Muster. Gespeichert wird nur eine Quellzeilenreferenz, nicht eine frei erfundene Wirkungsinterpretation.

## 17. Enabler

Das enge gemeinsame-Varianten-Muster erkannte keinen itemweiten Enabler. Daher wird kein zusätzlicher Enabler behauptet.

## 18. Analyzer-Integration

Neue Kandidaten verwenden unverändert Skill-, Support-, Equipment-, Jewel- und Unique-Analyzer. Technische Affix-Tags fließen über `ModifierDefinition.relevantTags` in den Equipment Analyzer.

## 19. Ergebnisaggregation

Unverändert. Es gibt keine neue globale Gewichtung.

## 20. Sichtbare Änderungen

Die Hauptskill-Auswahl enthält Suche, deutsche Namen und englischen Fallback. Unique-Empfehlungen zeigen die Evidenzklasse in verständlichem Deutsch.

## 21. Mapping

Bestehende Mapping-Gewichte unterscheiden weiterhin Projektil-, Flächen- und Bewegungskandidaten.

## 22. Boss

Bestehende Boss-Gewichte priorisieren weiterhin Einzelziel-, Kritisch-, DoT- und Debuffsignale.

## 23. Confidence

Die Analyzer-Confidence bleibt erhalten. Experimentelle und unvollständige Daten senken die Sicherheit weiterhin.

## 24. Coverage

Siehe `docs/audits/build-assistant-v1-1-semantic-coverage.json` und `docs/audits/pob2-unique-analyzer-semantics-coverage.json`.

## 25. Vorher-/Nachher-Vergleich

Der feste Vergleich misst eine größere evidenztragende Kandidatenbasis, nicht spielerische Optimalität. Siehe `docs/audits/build-assistant-v1-1-recommendation-diff.json`.

## 26. Determinismus

Regeln, Sortierung und Quellzeilenauswahl sind deterministisch; gleiche Eingaben erzeugen gleiche Ergebnisse.

## 27. Mobile Prüfung

Die vorhandene mobile Struktur bleibt bestehen. Das zusätzliche Suchfeld und längere Evidenzhinweise werden bei 390 × 844 geprüft.

## 28. Tests

Fokussierte Tests decken Kandidatenbreite, harte Supportregeln, Stat-ID-Semantik, Evidenzklassen, Variantenisolation, fehlende GGG-IDs und Determinismus ab.

## 29. Bekannte Lücken

Der Bestand ist keine vollständige Skill-/Supportdatenbank. Komplexe Trigger, variantenspezifisches Unique-Ranking, vollständige Zustandsberechnung, Stun und DPS bleiben nicht verfügbar.

## 30. Grenzen der semantischen Ableitung

`text-pattern-exact` ist PoB2-Planersemantik und keine technische GGG-Identität. Mehrdeutige oder unbekannte Muster erzeugen keinen positiven Score.

## 31. Klare Schlussfolgerung

Die Analyzer erhalten mehr reale, fachlich begrenzte Kandidaten und 1.507 technisch klassifizierte Affixe. 288 Uniques besitzen produktiv nutzbare gemeinsame Semantik oder sichere Waffenrestriktionen; unbelegte Zusammenhänge bleiben ausgeschlossen.

## 32. Nächster sinnvoller Hauptauftrag

Als nächster Schritt bietet sich ein kuratierter, gepinnter Ausbau der internen Skill-/Supportregeln für weitere häufige Mechaniken an, ohne die V1-Architektur oder Datenquellen zu ändern.
