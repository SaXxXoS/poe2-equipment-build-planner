# Gemmenstufen und Qualität – Schritt 21

## Ziel

Fertigkeitsstufen, Fertigkeitsqualität, Supportstufen und Supportqualität
werden als eigene technische Berechnungsdimensionen behandelt. Es werden
keine Werte interpoliert oder aus Anzeigenamen abgeleitet.

## Inventar

Der gepinnte numerische PoB2-Referenzbestand enthält 337
Fertigkeitsdatensätze. Alle 337 Datensätze liegen ausschließlich auf
Gemmenstufe 20 vor. Numerische Qualitätsfelder sind in diesem Produktbestand
nicht vorhanden.

`SkillSetup.level` transportiert optional eine Fertigkeitsstufe. Die bisherige
Berechnung ignorierte diesen Wert und verwendete immer Stufe 20. Eine
Fertigkeitsqualität sowie technische Stufen und Qualität je Support werden im
aktuellen BuildProfile nicht transportiert.

## Modell und Regeln

Das Modell `gem-level-quality-model` vergibt genau einen Stufenstatus:

- `exact`: angeforderte und verfügbare Stufe sind 20,
- `default-reference-level`: keine Stufe wurde eingegeben; die einzige
  Referenzstufe 20 wird transparent verwendet,
- `blocked-level-mismatch`: eine andere Stufe wurde angefordert,
- `blocked-missing-reference`: keine eindeutige numerische Fertigkeit.

Bei `blocked-level-mismatch` wird der gesamte numerische Schadenswert
fail-closed abgebrochen. Es gibt keine lineare Skalierung, Interpolation oder
Übernahme von Stufe 20.

## Qualität und Supports

Qualität erzeugt keinen Bonus, weil weder der Eingabetransport noch eine
numerische Qualitätswirkung geschlossen vorhanden ist. Supportstufen und
Supportqualität werden ebenfalls nicht aus I/II-Namen oder kuratierten
Rankingwerten als technische Wirkung abgeleitet.

## Integration

Der Status wird in jedem Schadenergebnis gespeichert und unter
„Gemmenstufe und Qualität“ angezeigt. Modellversion `1.0.0`,
Schadensrechner `3.0.0`.

## Grenzen

Für weitere produktive Stufen und Qualität werden versionierte Tabellen pro
Fertigkeit und Support benötigt. Dazu gehören Basiswerte, Kosten, Zeitwerte,
Stufenanforderungen und die konkrete Qualitätswirkung. Diese Daten fehlen im
aktuellen freigegebenen Produktbestand.

## Nächster Schritt

Schritt 22: Gegenstandswerte und lokale/global wirkende Qualitätsanteile
vollständig trennen, damit Qualität niemals doppelt in Basiswert und Affix
einfließt.
