# Vollständiger Regel- und Funktionsaudit – 29.07.2026

## Ergebnis

Die App ist ein lokaler, deterministischer und fail-closed arbeitender
Build-Planer. Sie ist derzeit **kein vollständiger Ersatz für Path of
Building** und versteht noch nicht jede aktuelle PoE2-Wechselwirkung.

Diese Prüfung hat mehrere systemische Fehlbewertungen korrigiert:

- Meta-Häufigkeit kann technische Regeln nicht mehr überstimmen.
- Mehrere Element-Tags geben nicht länger mehrere gleichartige
  Klassenboni.
- Passive und Uniques zählen nur noch zum geprüften Build-Paket, wenn ein
  fachlicher Bezug zur Hauptfertigkeit belegt ist.
- Ein allgemeiner Tag wie `spell` oder `attack` reicht nicht mehr aus, um
  ein Unique als passend zu bezeichnen.
- Unbekannte Zusammenhänge erzeugen weiterhin keinen positiven Score.

Die maschinenlesbare Matrix steht in
`docs/audits/poe2-complete-app-rule-gap-matrix.json`.

## Waffenset-Punkte

Die vorhandene Budgetdarstellung folgt dem belegten Grundprinzip:

- maximal 24 Spezialisierungsbelegungen,
- ein normaler Passivpunkt kann eine Set-1- und eine Set-2-Alternative
  tragen,
- daraus entstehen keine 48 gleichzeitig aktiven Zusatzpunkte,
- gemeinsame Verbindungswege müssen in beiden Zuständen gültig bleiben,
- Juwelenfassungen werden nicht set-spezifisch vergeben.

Wenn beide Skill-/Waffenpakete dieselbe belegte Skalierung verwenden, bleibt
der Pfad gemeinsam. Rot und Grün sind nur zulässig, wenn tatsächlich zwei
unterschiedliche, jeweils gültige Set-Ziele vorhanden sind. Die App darf
keinen künstlichen zweiten Pfad erzeugen.

## Datenbestand und aktuelle Grenze

Lokal vorhanden sind 235 aktive Fertigkeiten, 451 Unterstützungen und 36
Aszendenzen. Das bedeutet nicht, dass alle Datensätze vollständig
semantisch modelliert sind. Nur 22 Aszendenzen besitzen derzeit produktiv
nutzbare abgeleitete Schwerpunkte.

Der lokale Passive-Tree-Pin gehört zu 0.5.2, während die beobachtete
Live-Patchfamilie weiter fortgeschritten ist. Ein Pinwechsel darf nach den
bestehenden Projektguards nicht still erfolgen; hierfür ist der vorhandene
versionierte Quellen- und Approval-Prozess erforderlich.

## Noch fehlende Fachmodelle

Für eine belastbare Gleichwertigkeit mit vollständigen Meta-Builds fehlen
insbesondere:

- vollständige Umwandlungs- und Gain-as-extra-Ketten,
- sämtliche Treffer-, Wirkzeit- und Mehrfachtrefferregeln,
- vollständiges Ailment- und Schaden-über-Zeit-Modell,
- Triggerketten und Meta-Gem-Belegung für alle Skills,
- Minion-Basiswerte und Minion-Skalierungen,
- Gegner-Rüstung, Widerstände und situationsabhängige Debuffs,
- Buff-, Fluch-, Expositions- und Uptime-Modelle,
- vollständige Gemmenlevel-, Qualitäts- und Skillvariantenformeln,
- aktuelle, reproduzierbare Meta-Pakete mit Ausrüstung, Gemmen,
  Passive-IDs, Waffensets und Rotation,
- vollständige technische Semantik aller Uniques.

## Schlussfolgerung

Die in dieser Änderung behobenen Fehler machen das Ranking strenger und
nachvollziehbarer. Eine Aussage wie „die App findet garantiert einen
Meta-Build oder einen besseren Build“ ist mit dem aktuellen Daten- und
Formelstand nicht belegt.

Der nächste notwendige technische Schritt ist ein versionierter
Saison-Updateauftrag: aktuelle Passive-, Gemmen-, Support-, Aszendenz- und
Basisdaten pinnen, danach die noch offenen Formelmodule einzeln gegen
reproduzierbare Referenzfälle testen. Bis dahin muss die App bei nicht
belegbaren Paketen weniger oder keine Empfehlung ausgeben, statt plausible
wirkende Kombinationen zu erfinden.
