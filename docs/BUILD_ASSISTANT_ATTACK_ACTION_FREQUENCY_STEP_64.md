# Schritt 64 – Waffenbasierte Aktionsfrequenz

## Ergebnis

Das Ressourcenmodell kann die Aktionsfrequenz eines Angriffs jetzt aus der
aktiven Waffe ableiten. Es verwendet dafür ausschließlich:

- einen vom Nutzer oder der Bilderkennung bestätigten endgültigen Wert
  `Angriffe pro Sekunde`, oder
- den gepinnten Grundwert einer eindeutig erkannten Waffenbasis,
- lokal belegte Angriffsgeschwindigkeit auf der Waffe,
- den strukturierten Angriffsgeschwindigkeitsmultiplikator der gewählten
  Fertigkeitsstufe.

Damit können Kosten pro Verwendung erstmals auch bei Angriffen als laufender
Ressourcenbedarf pro Sekunde ausgewiesen werden.

## Waffensettrennung

Eine Set-1-Fertigkeit liest ausschließlich Set 1, eine Set-2-Fertigkeit
ausschließlich Set 2. Bei einer Fertigkeit mit `beide` wird nur dann eine
gemeinsame Frequenz verwendet, wenn beide Sets denselben eindeutig belegten
Wert liefern. Mehrere voneinander abweichende Waffen bleiben ungelöst.

## Fail-closed-Grenze

Angriffe pro Sekunde sind nicht automatisch erfolgreiche Treffer pro Sekunde.
Trefferchance, Zielkontakt, Mehrfachtreffer und projektilspezifische Treffer
sind dafür zusätzlich erforderlich. Deshalb wird ein Support mit „Raserei pro
Treffer“ weiterhin nicht in eine erfundene Raserei-Erzeugung pro Sekunde
umgerechnet.

## Prüfung

- Ressourcenmodell: Version 13.0.0
- 33 fokussierte Tests erfolgreich
- Typecheck erfolgreich
- Datenpins, Produktdateien und Offline-Grenzen unverändert
