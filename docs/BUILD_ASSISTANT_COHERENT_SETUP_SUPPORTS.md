# Zusammenhängende Supportplanung für Skillgruppen

## Ziel

Der Optimierer muss dasselbe konkrete Skillpaket bewerten, das anschließend in
der Oberfläche erscheint. Bis zu dieser Korrektur wurden Unterstützungen des
Hauptskills bereits während der Variantenwahl berücksichtigt. Unterstützungen
zusätzlicher Setup-, Utility-, Trigger- und Waffenset-Fertigkeiten wurden erst
nach der Auswahl in die sichtbaren Karten eingetragen.

## Korrektur

- Jede geplante Fertigkeit erhält bereits im Variantenoptimierer eine
  deterministische Supportbelegung.
- Harte Skill-, Rollen-, Waffen-, Klassen- und Aszendenzregeln bleiben vor der
  Rangfolge wirksam.
- Beobachtete Supports aus dem gepinnten Buildpaket derselben Aszendenz und
  Skillgruppe werden nur als Reihenfolgesignal verwendet. Sie umgehen keine
  technische Kompatibilitätsregel.
- Doppelte Supportfamilien werden innerhalb jeder einzelnen Fertigkeit
  blockiert.
- Mana- und Geistprüfung berücksichtigt die bereits belegten Skills der
  gesamten geplanten Gruppe sequenziell.
- Auslösende Meta-Skills erhalten zuerst eine kompatible eingebettete
  Fertigkeit. Nur die danach verbleibenden Sockelplätze werden mit Supports
  belegt.
- Optimierer, Paketprüfung, automatische Befüllung und Ergebnisansicht
  transportieren nun dieselben Support- und Embedded-Skill-IDs.

## Sichtbare Wirkung

Unter „Zusammenhängende Skillgruppe“ zeigt die Ergebnisansicht jetzt neben
Skill, Waffenset, Waffe und Begründung auch:

- eingebettete Fertigkeiten aus belegten Meta-/Trigger-Regeln;
- die konkret für diesen Skill geprüften Unterstützungen.

Damit lässt sich nachvollziehen, welche Gemmenbelegung tatsächlich Teil des
bewerteten Pakets war.

## Vollmatrix

Die lokale, gepinnte Matrix umfasst weiterhin alle 23 produktiv auswählbaren
Klassen-/Aszendenzkombinationen:

- 23/23 ausgewählte und kohärente Pakete;
- 23/23 Hauptskills mit Supportbelegung;
- 23/23 Profile mit mindestens einer im Optimierer belegten Unterstützung für
  eine geplante Zusatzfertigkeit;
- 671 Supportzuordnungen über sämtliche geprüften geplanten Skillgruppen;
- 8 automatisch und regelgebunden eingebettete Trigger-Fertigkeiten;
- 21 kohärente Zwei-Waffenset-Pakete, 2 bewusst belegte Ein-Set-Pakete;
- 0 Phantom-Waffenset-Pakete und 0 doppelte Hauptsupportfamilien.

Die hohe Zahl der Supportzuordnungen zählt alle vom Optimierer betrachteten
Zusatzkarten, nicht nur die zuerst sichtbare Set-2-Fertigkeit. Sie ist keine
Behauptung über eine maximale Gemmenzahl im Spiel.

## Grenzen

Diese Korrektur beseitigt eine interne Bewertungsabweichung. Sie belegt keine
globale Meta-Optimalität und keine vollständige Path-of-Building-Parität.
Nicht numerisch belegte Mehrfachtreffer, Uptime, Minion-Grundwerte und weitere
Sondermechaniken bleiben ohne erfundenen Schadenswert. Die englischen PoB2-
Produktdaten, technischen Datenpins und die Offline-Runtimegrenze bleiben
unverändert.

## Verifikation

- Der fokussierte Optimierertest bestand mit 28/28 Fällen.
- Der vollständige serielle Lauf bestand fachlich mit 1.993/1.993 Fällen in
  172 Dateien. Zwei Vollbaumtests überschritten im gemeinsamen Lauf lediglich
  das feste Fünf-Sekunden-Zeitlimit und bestanden isoliert mit angemessenem
  30-Sekunden-Limit (197/197 Fälle).
- Typecheck, Lint, Produktions-Build, Pages-Build, 252 JSON-Dateien und
  `git diff --check` waren erfolgreich.
- Die lokale Produktionsprüfung mit Zauberin/Sturmweberin, Stufe 90, 24
  Story-Passivpunkten und 8 Aszendenzpunkten erzeugte ohne Ausrüstung ein
  zusammenhängendes Zwei-Set-Paket. Die Ergebnisansicht zeigte für jede
  geplante Zusatzfertigkeit die tatsächlich bewerteten Supports; der
  Trigger-Skill „Zaubern bei kritischem Treffer“ enthielt „Auge des Winters“
  sowie vier geprüfte Supports.
- Desktop (1280 × 720) und Mobil (390 × 844) blieben ohne horizontalen
  Überlauf. Die Browserkonsole enthielt keine Fehler oder Warnungen.

## Nächster fachlicher Schritt

Als Nächstes sind die weiterhin strukturiert belegbaren Wirkungsmodelle zu
erweitern, beginnend mit solchen Mehrfachtreffer- und Uptime-Regeln, die aus
gepinnter Skillstruktur und vorhandenen lokalen Rechendaten ohne freie
Schätzung reproduzierbar sind.
