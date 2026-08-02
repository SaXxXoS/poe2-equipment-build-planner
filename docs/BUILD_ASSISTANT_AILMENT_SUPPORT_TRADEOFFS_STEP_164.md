# Schritt 164 – Trefferschaden-Trade-offs stärkerer Zustands-Supports

## Ergebnis

Der Schadensrechner verarbeitet jetzt die gepinnten Trefferschaden-Nachteile der sechs Supportstufen, deren Zustandswirkung bereits im Modell vorhanden war:

- `Deadly Poison I`: 25 % weniger finaler Trefferschaden und 75 % höhere Giftwirkung,
- `Deadly Poison II`: 30 % weniger finaler Trefferschaden und 100 % höhere Giftwirkung,
- `Deep Cuts I`: 25 % weniger finaler Trefferschaden und 75 % höhere Blutungswirkung,
- `Deep Cuts II`: 30 % weniger finaler Trefferschaden und 100 % höhere Blutungswirkung,
- `Searing Flame I`: 25 % weniger finaler Trefferschaden und 75 % höhere Entzündungswirkung,
- `Searing Flame II`: 30 % weniger finaler Trefferschaden und 100 % höhere Entzündungswirkung.

Die vorhandene Zustandsverstärkung bleibt ausschließlich im Zustandsmodell. Der neu angebundene Wert wirkt ausschließlich als finaler Multiplikator auf den Trefferanteil. Dadurch wird weder die Zustandswirkung doppelt gezählt noch der kombinierte Treffer-/Zustandsschaden überschätzt.

## Quellen und Grenzen

Verwendet werden ausschließlich die sechs strukturierten Supportrecords aus `generated/pob2/damage-reference.json` am bestehenden PoB2-Pin. Freie Textinterpretation, deutsche Anzeigetexte und technische GGG-ID-Erfindungen werden nicht verwendet.

Die Änderung erfindet keine Trefferchance, Zustandschance, Wirkzeit oder Gegnerkonfiguration. Ein Support beeinflusst die Berechnung nur, wenn er durch den bestehenden Katalog ausgewählt und mit der Fertigkeit kompatibel ist. Vollständige Gleichwertigkeit mit Path of Building 2 bleibt offen; geschlossen ist nur der hier belegte Trade-off.

## Prüfungen

- fokussiert: 3 Dateien, 100 Tests erfolgreich,
- vollständig seriell: 159 Dateien, 1.869 Tests erfolgreich,
- Typecheck und Lint erfolgreich,
- Produktions- und Pages-Build erfolgreich,
- Schadensrechner-Version `3.78.0`,
- Produktpins, Quellenfreigaben und Offline-Grenzen unverändert.
