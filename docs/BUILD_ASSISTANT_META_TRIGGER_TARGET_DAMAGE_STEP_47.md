# Schritt 47 – Meta-Trigger-Zielschaden

## Ergebnis

Der Schadensrechner kann den eingebetteten Zielskill eines kompatiblen
`Cast on Critical`-Setups jetzt rekursionssicher als eigenen Treffer
berechnen.

Dabei werden dieselben belegten Eingaben verwendet wie beim Hauptskill:

- Gemmenstufenreferenz,
- Ausrüstung und Waffenset,
- Passive und Aszendenz,
- kompatible Supports des Meta-Setups,
- Krit-Erwartungswert,
- optional das gewählte Gegnerprofil.

Der interne Trigger-Schadensfaktor aus der gepinnten PoB2-Definition wird
anschließend genau einmal angewendet.

## Ausgewiesene Teilwerte

- erwarteter Zieltrefferschaden,
- erwarteter Zieltrefferschaden nach Gegnerabwehr,
- normierter Trigger-DPS bei Monsterstärke 1,
- normierter Trigger-DPS nach Gegnerabwehr bei Monsterstärke 1.

## Fail-closed-Grenze

Diese Werte werden noch nicht zum tatsächlichen Gesamt-DPS addiert. Dafür
fehlen weiterhin die reale Monsterstärke beziehungsweise ein explizites
Ereignisprofil sowie vollständig belegte Trigger-Obergrenzen. Der Teilwert
ist deshalb ausdrücklich normiert und das Trigger-Modell bleibt
`productive: false`.
