# Schritt 53 – Gespeicherte Nutzungsreserve

## Ziel

Fertigkeiten mit `Can Store N Uses` dürfen weder wie eine einzelne
Cooldown-Nutzung noch wie dauerhaft N-fache DPS behandelt werden.

## Modell

Das bestehende Trigger-/Cooldown-Modell weist nun getrennt aus:

- die am Pin belegte maximale Zahl gespeicherter Nutzungen,
- die effektive Wiederherstellungszeit einer Nutzung,
- die nachhaltige maximale Nutzungsrate,
- die Zeit von einer vollständig leeren bis zu einer vollständig geladenen
  Reserve,
- bei belegtem Zielschaden das Schadenspotenzial einer vollständig geladenen
  Reserve.

Die vollständige Reserve ist ausdrücklich kein DPS-Wert. Eine beliebige
Burst-Zeitspanne, unbelegte gleichzeitige Aktivierung oder dauerhaft
multiplizierte Trefferrate wird nicht erfunden.

## Beispiel Frost Wall

Der gepinnte Datensatz belegt:

- 5 Sekunden Cooldown,
- 3 gespeicherte Nutzungen,
- keine Tick-Rundung wegen mehrerer gespeicherter Nutzungen.

Damit gelten:

- nachhaltige Cooldown-Grenze: 0,2 Nutzungen pro Sekunde,
- leer zu voll: 15 Sekunden,
- vollständig geladene Reserve: dreimal der belegte Schaden einer einzelnen
  ausgelösten Nutzung.

Der interne Trigger-Schadensfaktor wird vor der Multiplikation mit der
Reserve angewendet.

## Quellen

- `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- `src/Modules/CalcOffence.lua`
- gepinnte Fertigkeitsstufen in `src/Data/Skills/*.lua`
- aktuelle Mechanikbeschreibung „Can Store N Use(s)“

## Grenzen

Nicht modelliert werden eine frei gewählte Burst-Dauer, konkrete
Animationsabstände beim schnellen Leeren der Reserve und
waffensetübergreifende Zustandsverluste. Diese Größen erzeugen deshalb weder
zusätzliche DPS noch einen Optimierungsbonus.
