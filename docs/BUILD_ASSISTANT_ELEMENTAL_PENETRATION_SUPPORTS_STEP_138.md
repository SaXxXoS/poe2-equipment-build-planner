# Schritt 138 – skillgebundene Elementardurchdringung

## Ziel

Die lokal gepinnten Werte der Elementardurchdringungs-Supports werden mit genau der Fertigkeitskarte verbunden, in der der Support ausgewählt ist. Andere Fertigkeiten und Schaden über Zeit dürfen den Trefferbonus nicht erhalten.

## Produktive Wirkung

- `Fire Penetration I`, `Cold Penetration` und `Lightning Penetration` liefern jeweils ihren strukturierten Wert von 30 %.
- Die Wirkung wird nur aus dem Support des aktuell berechneten Hauptskills gelesen.
- Die Schadensart des tatsächlichen Treffers muss zur Durchdringungsart passen.
- Das aktive Waffenset muss die betreffende Fertigkeitskarte enthalten.
- Durchdringung wirkt nur in der Trefferminderung. Eigenständiger Schaden über Zeit sowie Entzünden, Gift und Blutung ignorieren Trefferpenetration.
- Die bestehende PoE2-Grenze bleibt erhalten: Durchdringung senkt einen positiven Widerstand im Vergleichsmodell nicht unter null.

## Fail-closed-Grenzen

- Ein gleichnamiger Support auf einer anderen Fertigkeitskarte verändert den Haupttreffer nicht.
- Ein Support ohne strukturierten numerischen Wert erzeugt keine Wirkung. Das betrifft derzeit insbesondere `Fire Penetration II`, dessen gepinnter Datensatz keinen entsprechenden Zahlenwert enthält.
- Supportqualität wird nicht geschätzt, weil das aktuelle SkillSetup keine getrennte Qualität je Support speichert und die drei produktiven Records keine freigegebene Qualitätszeile besitzen.
- Widerstandsreduktion, Exposition und Durchdringung bleiben getrennte Rechenschritte.

## Versionen

- Schadensrechner: `3.52.0`
- Elementardurchdringungs-Supportmodell: `1.0.0`
- Gepinnte PoB2-Schadensreferenz bleibt unverändert.

## Ergebnis

Ein ausgewählter Elementardurchdringungs-Support verändert jetzt reproduzierbar den passenden Treffer gegen einen Vergleichsgegner. Er kann weder fremde Fertigkeiten noch DoT unbemerkt verstärken.

## Prüfung

- Fokussiert: 4 Dateien, 117 Tests erfolgreich.
- Gesamtlauf: 139 Dateien und 1.751 Tests erfolgreich; zwei zeitkritische Passivbaumdateien überschritten nur unter gemeinsamer Last das 5-Sekunden-Limit.
- Isolierter serieller Wiederholungslauf: 2 Dateien, 197 Tests erfolgreich.
- Typecheck, Lint, Produktions-Build und Pages-Build erfolgreich.
