# Einheitliche Wirkungsbasis der Build-Varianten

## Ziel

Die automatische Auswahl von Hauptfertigkeit, Waffe, Unterstützungen und
Waffenset-Paket verwendet eine gemeinsame, deterministische Schadensbasis.
Dadurch entscheidet bei tatsächlich eingegebener Ausrüstung nicht mehr ein
isolierter semantischer Teilwert über einen numerisch belegten Kandidaten.

## Gemeinsame Messbasis

Die Vergleichsgröße `sustained-after-mitigation-v1` addiert genau einmal:

- den erwarteten Treffer- und belegten Trigger-Schaden pro Sekunde nach
  Trefferchance, kritischer Erwartung und Gegnerabwehr,
- eigenständigen, strukturiert belegten Schaden über Zeit nach Gegnerabwehr,
- strukturiert belegte schädigende Zustände nach Gegnerabwehr.

Unbelegte Mehrfachtreffer, Uptime, Minion-Schaden oder unbekannte
Wechselwirkungen erzeugen keinen Ersatzwert. Ein nicht berechenbarer Kandidat
bleibt `unavailable`.

## Reihenfolge der Auswahl

Mit echter Nutzerausrüstung werden nur hart kompatible Pakete verglichen. Ein
numerisch vergleichbarer Kandidat besitzt Vorrang vor einem Kandidaten ohne
belegte Schadenswirkung. Danach entscheiden gemeinsamer Schadenswert,
Gesamtpaketwert und stabile IDs.

Ohne Ausrüstung bleibt zuerst die gepinnte, klassen- und
aszendenzspezifische Paketbeobachtung maßgeblich. Das verhindert einen falschen
Vergleich zwischen einem Zauber mit bekannten Gemmen-Grundwerten und einem
Angriff, dessen konkrete Waffenwerte noch fehlen. Innerhalb gleich belegter
Pakete gilt ebenfalls die gemeinsame Schadensbasis.

## Unterstützungen

Die bestehende fachliche und paketbezogene Supportauswahl bleibt der sichere
Ausgangspunkt. Bei echter Ausrüstung prüft der Optimierer zusätzlich eine
begrenzte, deterministische Austausch-Runde unter den acht besten kompatiblen
Kandidaten. Eine Änderung wird nur übernommen, wenn sie auf derselben
Schadensbasis messbar besser ist. Harte Kompatibilität,
Supportfamilien-Eindeutigkeit sowie Mana- und Geist-Guards bleiben erhalten.

Das ist bewusst keine kombinatorische Vollsuche über den gesamten
Gemmenbestand. Sie würde die mobile Laufzeit unverhältnismäßig erhöhen und
dürfte ohne vollständige Wirkungsabdeckung keine globale Optimalität
behaupten.

## Sichtbare Nachvollziehbarkeit

Das Ergebnis zeigt:

- die verwendete Schadensbasis,
- den Vergleichsschaden pro Sekunde, sofern berechenbar,
- die drei Teilkomponenten,
- die numerische Vergleichsabdeckung,
- ob Supports fachlich/paketbezogen gewählt oder anhand der tatsächlichen
  Ausrüstung messbar verbessert wurden.

## Prüfstand

Die feste lokale Matrix umfasst 23 produktive Klassen-/Aszendenzprofile.
Alle 23 erzeugen weiterhin ein kohärentes Paket. Insgesamt sind 36 von 57
geprüften Kombinationen numerisch vergleichbar. Bei den ohne Ausrüstung
ausgewählten Startpaketen besitzen 7 von 23 bereits einen positiven
vollständigen Vergleichswert; für die übrigen schützt die Paketbeobachtung vor
einer erfundenen Zahlenrangfolge.

Ein zusätzlicher equipment-first Regressionstest belegt, dass ein reales
Waffenprofil einen numerisch vergleichbaren Kandidaten auswählt und eine
Supportänderung den Ausgangswert nicht verschlechtert.

## Grenzen

Diese Erweiterung belegt eine einheitlichere und nachvollziehbarere
Variantenwahl. Sie belegt weder globale mathematische Optimalität noch
vollständige Path-of-Building-Parität. Nicht modellierte Trefferzahlen,
Uptime-, Minion- und komplexe Sondermechaniken bleiben ausgeschlossen, bis
strukturierte Quellen und Rechenregeln vorliegen.

## Abschlussprüfung

- fokussierte Optimierer-, Hauptskill- und Supporttests: 34/34,
- vollständiger serieller Regressionstest: 172 Dateien und 1.992/1.992 Tests,
- Typecheck und Lint: erfolgreich,
- Produktions- und Pages-Build: erfolgreich,
- JSON-Validierung: 252/252 Dateien,
- Produkt- und Datenpin-Diff: leer,
- Desktop-Browserprüfung: vollständiges Buildpaket mit gemeinsamer Messbasis,
  Set-2-Setup, 24/24 Waffensetpunkten und 8/8 Aszendenzpunkten,
- mobile Prüfung bei 390 × 844: neun einspaltige Skillkarten, kein
  horizontaler Überlauf und keine Konsolenfehler oder -warnungen.
