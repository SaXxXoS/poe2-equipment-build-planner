# Build-Assistent – Schritt 45: Meta-Trigger-Energie und Zielkompatibilität

## Ergebnis

Die gepinnte PoB2-Referenz enthält nun zusätzlich die internen
Trigger-Supportdefinitionen. Damit kann die App für eingebettete
Meta-Fertigkeiten folgende Teile strukturiert prüfen:

- benötigte Fertigkeitstypen,
- ausgeschlossene Fertigkeitstypen,
- Energiebedarf aus der gesamten Basis-Wirkzeit der eingebetteten Ziele,
- Basisenergie pro auslösendem Ereignis,
- erhöht erzeugte Energie auf dem gewählten Gemmenlevel,
- erforderliche Ereignisse bei Monsterstärke eins.

## Fail-closed-Regeln

- Ein inkompatibles eingebettetes Ziel erhält
  `blocked-incompatible-target`.
- Eine unbekannte Ziel-ID bleibt `blocked-missing-target`.
- Energiebedarf und Energie pro Ereignis werden nicht mit einer
  Ereignisfrequenz verwechselt.
- Ohne belegte Ereignisse pro Sekunde entsteht weiterhin kein
  zusätzlicher Trigger-DPS.
- Gegnerstärke eins ist eine ausdrücklich ausgewiesene Vergleichsgröße,
  keine Behauptung über jeden Gegner.

## Datenherkunft

Quelle ist ausschließlich der lokal gepinnte PoB2-Commit
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`. Das Referenzschema ist Version
`11`; das Trigger-Teilmodell ist Version `1.2.0`.

## Nächste technische Lücke

Für produktive Trigger-DPS fehlen noch die jeweils passende Ereignisrate,
Gegnerstärke und bei bedingten Ereignissen die vollständig belegte
Treffer-, Krit-, Block-, Zustands-, Tötungs- oder Betäubungskette.
