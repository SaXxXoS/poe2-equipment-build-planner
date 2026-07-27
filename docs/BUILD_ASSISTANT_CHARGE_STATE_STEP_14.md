# Automatisches Ladungszustandsmodell – Schritt 14

## Ziel

Schritt 14 führt einen getrennten, automatischen Zustand für Power-, Frenzy-
und Endurance Charges ein. Ladungsabhängige Effekte dürfen nur wirken, wenn
Erzeugung, Anzahl, Verbrauch und zeitliche Verfügbarkeit gemeinsam belegt
sind.

Es gibt keine neue Nutzereinstellung.

## Belegter Datenstand

Der gepinnte Schadensdatensatz belegt:

- Charge Regulation verbraucht alle zehn Sekunden je eine Frenzy-, Power- und
  Endurance-Charge.
- Charged Staff besitzt einen strukturierten zusätzlichen Blitzschadenswert
  pro Power Charge.
- Disengage gewährt drei Frenzy Charges, aber nur nach Verbrauch eines
  Parry-Debuffs.

Nicht vollständig belegt sind:

- eine allgemeine Power-Charge-Erzeugung,
- eine allgemeine Endurance-Charge-Erzeugung,
- die Erzeugung und Verfügbarkeit des für Disengage erforderlichen
  Parry-Debuffs,
- eine wiederholbare Ladungs-Uptime,
- die belastbare Buffdauer von Charged Staff.

## Verhalten der App

Sobald eine relevante Fertigkeit ausgewählt ist, zeigt die Ergebnisansicht:

- den getrennten Zustand aller drei Ladungsarten,
- bedingte Quellen mit ihrer belegten Anzahl,
- Ladungsverbrauch und Intervall,
- den konkreten Grund, weshalb ein Effekt nicht numerisch wirkt.

`conditional-unresolved` ist keine aktive Ladung. Dieser Status erzeugt
keinen positiven Schadens-, Geschwindigkeits- oder Kritbonus.

## Charge Regulation

Der Verbrauch alle zehn Sekunden ist strukturiert belegt. Ohne belegte
Erzeugung aller benötigten Ladungsarten wird kein Bonus angewandt.

## Charged Staff

Die Blitzschadenswerte pro Power Charge sind strukturiert vorhanden. Ohne
belegte Power-Charge-Anzahl, Verbrauchszeitpunkt und Buffdauer wird dieser
Schaden nicht zur Hauptfertigkeit addiert.

## Disengage

Drei Frenzy Charges sind als bedingtes Ergebnis belegt. Die App markiert die
Quelle jedoch als `conditional-unresolved`, weil die vorgelagerte
Parry-Debuff-Kette fehlt.

## Implementierung

- Modell:
  `src/engine/damage-estimation/charge-state.ts`
- Integration:
  `src/engine/damage-estimation/temporal-offensive-effects.ts`
- Modellversion:
  `1.0.0`
- Audit:
  `docs/audits/build-assistant-charge-state-step-14.json`

## Sicherheitsgrenzen

- Keine Ableitung der Ladungsart allein aus einem sichtbaren Skillnamen.
- Keine angenommene maximale Ladungszahl.
- Keine angenommene Startladung.
- Keine angenommene Uptime.
- Keine Übertragung eines bedingten Zustands in einen positiven Score.
- Keine zusätzliche Nutzereinstellung.

## Schlussfolgerung

Die App kann Ladungsquellen und -verbrauch jetzt nachvollziehbar darstellen.
Der aktuelle gepinnte Datenstand erlaubt jedoch noch keinen produktiven
dauerhaften Ladungsbonus. Charge Regulation und Charged Staff bleiben deshalb
korrekt fail-closed.

## Als Nächstes

Schritt 15 modelliert die Beziehung zwischen vorbereitender Fertigkeit und
dem konkret folgenden Angriff. Priorität haben Exerted Attacks, einmalige
Folgeangriffe und verbrauchbare Trigger. Erst eine geschlossene Ziel- und
Verbrauchskette darf Schaden verändern.
