# Schritt 141 – Blitzableiter-Skalierung durch Schockwirkung

## Ziel

Dieser Schritt schließt eine weitere lokal und strukturiert belegte Schadenskette: `Lightning Conduit` erhält pro vollständigen 5 % erhöhter Schockwirkung auf dem Ziel 10 % mehr Trefferschaden.

## Belegte Quelle

- PoB2-Fertigkeit: `LightningConduitPlayer`
- strukturierter Stat: `lightning_conduit_damage_+%_final_per_5%_increased_damage_taken_from_shock`
- Wert: 10 % mehr Schaden je vollständigem 5-%-Schritt
- Parserregel: Multiplikator `ShockEffect`, Divisor 5, auf den Gegner bezogen

Die Berechnung verwendet ausschließlich die bereits gepinnten lokalen Produkt- und Referenzdaten. Es wurde keine Runtime-Netzwerkquelle ergänzt und kein Datenpin verändert.

## Berechnung

Der Rechner verwendet nur eine bereits aufgelöste und tatsächlich angewandte Schockwirkung. Bei 23 % Schockwirkung entstehen beispielsweise vier vollständige Schritte und damit 40 % mehr Trefferschaden. Ein Rest unterhalb des nächsten vollständigen 5-%-Schritts wird nicht aufgerundet.

Der Multiplikator wird nach Zielmitigation auf die relevanten Trefferwerte angewandt. Er beeinflusst weder eigenständigen Schaden über Zeit noch eine Fertigkeit ohne den exakten Quellrecord.

## Fail-closed-Verhalten

- Ohne bestätigten Schock auf dem Ziel bleibt der Multiplikator 1.
- Blockierte oder nur mögliche Schockquellen aktivieren die Wirkung nicht.
- Andere Fertigkeiten erhalten den Bonus nicht durch Text- oder Namensähnlichkeit.
- Es wird keine Schockwirkung aus sichtbarem Text, Ausrüstungsnamen oder einer deutschen Übersetzung abgeleitet.
- `Attrition`, `Predator's Mark` und weitere laufzeitabhängige Kandidaten bleiben ohne vollständig belegte Zustandskette wirkungsneutral.

## Sichtbare Ausgabe

Die Ergebnisansicht weist die Ziel-Schockwirkung, die vollständigen 5-%-Schritte, den gesamten Mehr-Schaden und den resultierenden Multiplikator aus. Fehlt der Schockbeleg, wird der blockierte Grund sichtbar dargestellt.

## Versionen

- Schadensrechner: `3.55.0`
- Modell zielabhängiger Fertigkeitswirkungen: `1.0.0`

## Schlussfolgerung

Die Blitzableiter-Schockskalierung ist deterministisch und evidenzgebunden integriert. Dies erweitert die Berechnungsbreite, stellt aber weiterhin keine vollständige Path-of-Building-Parität her.
