# Build-Assistent – Schritt 18: Trigger und Wiederholungen

## Ergebnis

Schritt 18 ergänzt ein fail-closed Trigger- und Wiederholungsmodell. Eine
Auslösung verändert den Schadenswert nur, wenn Quelle, Bedingung, Ziel und
Intervall gemeinsam strukturiert belegt sind.

## Quelleninventur

Der gepinnte numerische PoB2-Referenzbestand enthält:

- 19 Datensätze mit `Triggered` und `InbuiltTrigger`,
- 16 Datensätze mit `Triggers`,
- drei Datensätze mit `base_cooldown_modifiable_repeat_interval_ms`,
- keine vollständige BuildProfile-Verknüpfung zwischen Triggerquelle und
  ausgelöster Zielfertigkeit,
- keine belastbare allgemeine Triggerfrequenz aus den vorhandenen
  Energieerzeugungswerten.

## Technische Entscheidung

- `Triggerable` bedeutet nur, dass eine Fertigkeit ausgelöst werden kann.
- `Triggered` beziehungsweise `InbuiltTrigger` bedeutet, dass die Fertigkeit
  nicht über eine normale Cast- oder Angriffsgeschwindigkeit gerechnet werden
  darf.
- Namen eindeutig identifizierter Meta-Fertigkeiten dürfen ihre
  Auslösebedingung belegen, etwa `Cast on Critical`.
- Ein Energieerzeugungsbonus ist keine Auslösefrequenz.
- Ein Wiederholungsintervall ist nur eine zeitliche Grenze und kein Beleg für
  durchgehende Aktivierung.

## Produktwirkung

Eine primäre eingebaute Triggerfertigkeit ohne vollständige Auslöserkette
erhält keinen erfundenen DPS-Wert. Konfigurierte Triggerquellen werden mit
bekannter Bedingung und fehlenden Verknüpfungen sichtbar ausgegeben, bleiben
aber unproduktiv.

## Grenzen

Noch nicht numerisch enthalten:

- ausgelöste Zielfertigkeiten ohne explizite BuildProfile-Verknüpfung,
- Triggerenergie-Schwellen und tatsächliche Energieerzeugung pro Ereignis,
- interne Abklingzeiten ohne strukturierten Wert,
- Triggerketten,
- wiederholte oder überlappende Sekundärtreffer.

## Nächster Schritt

Als nächster Schritt kann das Modell für Minions und Begleiter aufgebaut
werden. Auch dort dürfen Anzahl, Angriffsraten und Wirkungen nur aus
vollständigen strukturierten Ketten stammen.
