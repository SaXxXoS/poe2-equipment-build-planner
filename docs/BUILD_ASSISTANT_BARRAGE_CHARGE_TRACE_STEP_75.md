# Schritt 75 – Ladungsabhängige Barrage-Wiederholungen

## Ergebnis

Der gepinnte PoB2-Datensatz belegt für Barrage neben den zwei
Basiswiederholungen genau eine weitere Wiederholung pro beim Einsatz
verfügbarer Raserei-Ladung. Diese zweite Regel wird nun im Rechennachweis
separat ausgewiesen.

## Fail-closed Grenze

Eine bloß ausgewählte Ladungsfertigkeit bestätigt noch keine dauerhaft
verfügbare Ladungszahl:

- `Combat Frenzy` belegt im Produktdatensatz ein Erzeugungsintervall, aber
  nicht gemeinsam Auslösezustand und tatsächlich erzeugte Ladungszahl.
- `Disengage` belegt drei Raserei-Ladungen erst nach Verbrauch eines
  Parry-Debuffs; dessen Verfügbarkeit ist nicht vollständig aufgelöst.

Deshalb verändern die ladungsabhängigen Wiederholungen den Schadenswert noch
nicht. Die sichere Barrage-Basissequenz bleibt produktiv, der mögliche
Ladungszusatz erscheint als blockierter, technisch belegter Rechenschritt.

## Versionen und Tests

- Schadensrechner: `3.16.0`
- Folgefertigkeitsmodell: `2.1.0`
- Ladungszustandsmodell: `1.1.0`

Die PoB2-Gleichwertigkeit ist weiterhin nicht vollständig belegt. Als
nächste Lücke folgt eine weitere geschlossene Wiederholungs-, Trigger- oder
Projektilkette, deren Quelle, Bedingung, Ziel und Wirkfrequenz gemeinsam aus
dem gepinnten Bestand reproduzierbar sind.
