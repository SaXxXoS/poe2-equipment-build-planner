# Schritt 50 – Mehrere Ziele einer Meta-Trigger-Fertigkeit

## Ziel

Mehrere in einer Meta-Fertigkeit eingebettete aktive Fertigkeiten müssen
dieselbe belegte Energieauslösung verwenden, ohne ihre individuellen
Abklingzeiten miteinander zu vermischen.

## Technische Grundlage

Maßgeblich bleibt der lokal gepinnte Stand von
`PathOfBuildingCommunity/PathOfBuilding-PoE2` am Commit
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

Der reduzierte Schadensreferenzexport enthält nun auch die exakten Stat-IDs
der aktiven Fertigkeiten und ihrer internen Trigger-Supports. Für die
betroffenen Meta-Fertigkeiten belegen sie zwei getrennte Regeln:

- Der maximale Energiebedarf ist die Summe der Wirkzeiten aller eingebetteten
  aktiven Fertigkeiten.
- Bei voller Energie werden alle eingebetteten Fertigkeiten ausgelöst.

Deshalb wird für diese Meta-Fertigkeiten keine rotierende Zielauswahl
angenommen. Die generische PoB2-Rotationsberechnung gilt für andere
Triggerarten, ist aber kein Beleg dafür, die hier gemeinsam ausgelösten
Fertigkeiten abwechselnd zu behandeln.

## Berechnung

1. Die Wirkzeiten aller kompatiblen eingebetteten Fertigkeiten bestimmen den
   gemeinsamen Energiebedarf.
2. Ereignisrate, Monsterstärke und Energiegewinn bestimmen eine gemeinsame
   Aktivierungsrate.
3. Jede eingebettete Fertigkeit erhält diese Aktivierungsrate.
4. Für jedes Ziel wird anschließend dessen eigene Basis-Abklingzeit auf den
   gepinnten Server-Takt von `0,033` Sekunden aufgerundet.
5. Nur die Rate dieses Ziels wird durch dessen eigene Abklingzeit begrenzt.

Ein langsames Ziel reduziert damit nicht fälschlich die mögliche Rate eines
zweiten, schnelleren Ziels.

## Produktdarstellung

Die Ergebnisansicht nennt für jede Triggerzeile den sichtbaren Zielnamen.
Wenn die beiden exakten Stat-IDs vorliegen, zeigt sie außerdem die Anzahl der
gemeinsam eingebetteten Fertigkeiten. Interne Ziel-IDs dienen nicht mehr als
primäre Beschriftung.

## Tests

Der fokussierte Test bettet `Comet` und `Snap` gemeinsam in
`Cast on Critical` ein. Er belegt den gemeinsamen Energiebedarf und zwei
unabhängige Ziel-Cooldowns.

## Grenzen

Noch offen bleiben Cooldown-Recovery und explizite Cooldown-Overrides,
Trigger mit tatsächlich rotierender Zielauswahl, gespeicherte Nutzungen mit
fertigkeitsspezifischer Verbrauchslogik sowie weitere Triggerbedingungen.

Die Änderung verändert weder den englischen Unique-Produktbestand noch dessen
deutsche Anzeigeschicht.
