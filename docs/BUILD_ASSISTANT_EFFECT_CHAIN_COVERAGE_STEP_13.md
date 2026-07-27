# Vollständige Offensiv-Wirkungsketten – Schritt 13

## Ziel

Schritt 13 inventarisiert weitere strukturierte Buff-, Trigger- und
Stapelwirkungen und verhindert, dass ein vorhandener Einzelwert ohne seine
notwendigen Aktivierungsbedingungen als Schaden gerechnet wird.

Die Prüfung und Anzeige laufen automatisch. Es gibt keine neue
Nutzereinstellung.

## Ergebnis der Inventur

Im gepinnten Schadensdatensatz wurden zwölf weitere offensive Kandidaten mit
mindestens einem strukturierten Zahlenwert gefunden. Keiner dieser zwölf
Kandidaten besitzt derzeit zugleich eine vollständige Kette aus Betrag, Ziel,
Zustand, Verbrauch beziehungsweise Stapelzahl und belastbarem Wirkfenster.

War Banner bleibt deshalb die einzige produktiv angewandte allgemeine
zeitabhängige Offensivwirkung.

## Blockierte Kandidaten

- Arctic Armour: stationäre Dauer und Identität des ausgelösten Treffers
- Arctic Howl: tatsächliche Warcry-Power, Obergrenze und Folgeangriff
- Charge Regulation: vorhandene Ladungsarten und Ladungs-Uptime
- Charged Staff: verbrauchte Ladungszahl, Buffdauer und betroffene Angriffe
- Elemental Conflux: aktives Element und Wechselzeitpunkt
- Emergency Reload: Zielmunition, Einmalverbrauch und Wiederholungsfrequenz
- Infernal Cry: Warcry-Power, Ladungsverbrauch und Folgeangriff
- Lunar Blessing: Buffdauer und Formbedingung
- Mana Tempest: Manadauer, Abbruchbedingung und verlässliches Wirkfenster
- Mantra of Destruction: Combozustand, Verbrauch und Wirkzeit
- Sigil of Power: erreichte Stufenzahl und Aufbauzeit
- Trinity: gleichzeitig verfügbare Resonanz und Uptime

Wird einer dieser Skills ausgewählt, nennt die Ergebnisansicht den konkreten
Blockgrund. Der Skill erzeugt keinen positiven numerischen Bonus.

## Nicht als Spielerbuff behandelte Daten

Defensive Bannerwerte, Widerstandsaura-Werte und Minion Offerings werden nicht
auf den Schaden der Spielerhauptfertigkeit übertragen. Flüche,
Widerstandsreduktion und Rüstungsbruch bleiben im getrennten
Gegnerwirkungsmodell.

## Datenartefakt

Der maschinenlesbare Inventurbericht liegt unter:

`docs/audits/build-assistant-temporal-offensive-effects-step-13.json`

Er enthält:

- den produktiv angewandten War-Banner-Zustand,
- alle zwölf blockierten Kandidaten,
- die jeweils fehlende Evidenz,
- die Bestätigung, dass keine Werte erfunden und keine Einstellungen ergänzt
  wurden.

## Implementierung

Die Blockregeln befinden sich zusammen mit dem produktiven Wirkungsmodell in:

`src/engine/damage-estimation/temporal-offensive-effects.ts`

Modellversion: `1.1.0`

## Tests

Die Tests prüfen:

- alle produktiven War-Banner-Regeln aus Schritt 12,
- konkrete Blockgründe für Stapel, Ladungen, Resonanz, Power, Combo,
  Folgemunition und unbekannte Wirkzeiten,
- keine positive Wirkung eines blockierten Kandidaten,
- deterministische Wiederholung.

## Schlussfolgerung

Die App unterscheidet jetzt systematisch zwischen „Zahlenwert vorhanden“ und
„vollständige Schadenswirkung belegt“. Dadurch werden mehr Quelleninformationen
sichtbar, ohne eine unvollständige Mechanik als wirksame DPS auszugeben.

## Als Nächstes

Der nächste Schritt sollte die fehlenden Zustandsmodelle einzeln aufbauen.
Priorität haben:

1. Ladungszustände und Ladungsverbrauch,
2. nächste-Fertigkeit- beziehungsweise Exerted-Attack-Beziehungen,
3. Stapel- und Resonanzaufbau,
4. zustandsabhängige Buffdauer.

Erst danach dürfen die dazugehörigen strukturierten Zahlenwerte produktiv
wirken.
