# Schritt 46 – Meta-Trigger-Ereignisrate

## Ergebnis

Für `Cast on Critical` verbindet der Schadensrechner jetzt die bereits
berechnete Aktionsrate, Trefferchance und effektive kritische Trefferchance
mit der gepinnten Meta-Energiekette.

Ausgewiesen werden:

- kritische Ereignisse pro Sekunde,
- Energie pro Sekunde bei normierter Monsterstärke 1,
- normierte Auslösungen pro Sekunde,
- normierte Sekunden pro Auslösung.

Die Berechnung ist deterministisch und bleibt fail-closed: Tatsächliche
Monsterstärke, Trigger-Obergrenzen und der Schaden der eingebetteten
Fertigkeit werden noch nicht angenommen. Deshalb erhöht dieser Schritt den
Gesamt-DPS noch nicht.

## Formel

`kritische Ereignisse/s = Aktionen/s × Trefferchance × Kritchance`

`Energie/s bei Monsterstärke 1 = Ereignisse/s × wirksame Energie/Ereignis`

`Auslösungen/s = Energie/s ÷ Energiebedarf`

## Grenze

Andere Meta-Auslöser benötigen Ereignisraten für Blocken, Ausweichen,
Zustände, Betäubungen, Tötungen oder Begleitertode. Diese Raten sind aus einem
statischen Build allein nicht sicher ableitbar und bleiben blockiert.
