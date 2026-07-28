# Schaden über Zeit und Ailments – Schritt 16

## Ziel

Schritt 16 trennt eigenständigen Schaden über Zeit technisch vom
Trefferschaden. Entzünden, Gift und Blutung werden nicht aus einer
Schadensart oder einem sichtbaren Namen abgeleitet.

Es gibt keine neue Nutzereinstellung.

## Gepinnter Bestand

Der unveränderte PoB2-Schadenspin enthält bei Fertigkeitsstufe 20 fünf
Fertigkeiten mit einem eindeutig typisierten Grundwert pro Minute:

- Contagion: Chaos-Grundwert, keine gemeinsam strukturierte Wirkungsdauer
- Flame Wall: Feuer-Grundwert und `6.400 ms` Wirkungsdauer
- Incinerate: Feuer-Grundwert, keine gemeinsam strukturierte Wirkungsdauer
- Profane Ritual: Chaos-Grundwert, keine gemeinsam strukturierte Wirkungsdauer
- Tornado: physischer Grundwert, keine gemeinsam strukturierte Wirkungsdauer

Tornado besitzt zusätzlich einen elementaren Minutenwert ohne eindeutig
aufgelöste einzelne Schadensart. Dieser Wert wird nicht frei verteilt.

## Produktive Einzelanwendung

Nur Flame Wall besitzt im aktuellen Pin gleichzeitig:

1. einen eindeutig als Feuer typisierten DoT-Grundwert,
2. die technische Einheit pro Minute,
3. eine strukturierte Wirkungsdauer,
4. einen eigenständigen `DamageOverTime`-/`CausesBurning`-Skilldatensatz.

Der technische Minutenwert `3.575` ergibt `59,58` Feuerschaden pro Sekunde.
Für das strukturierte Wirkfenster von `6,4 s` werden `381,33` Schaden einer
Einzelanwendung ausgewiesen.

Der Wert bleibt strikt getrennt von Trefferschaden, kritischen Treffern,
angenommener Wiederholungsrate, angenommener Gegner-Uptime, überlappenden
Anwendungen und zusätzlichen Stapeln. Er wird nicht zum dauerhaften
Build-DPS addiert.

## Fail-closed

Contagion, Incinerate, Profane Ritual und Tornado werden sichtbar blockiert,
weil der lokale Pin keine geschlossene Wirkungsdauer für den jeweiligen
Minutenwert liefert. Ein vorhandener Zahlenwert allein genügt nicht.

Entzünden, Gift und Blutung bleiben vollständig außerhalb der numerischen
Berechnung, solange nicht gemeinsam belegt sind:

- auslösender Treffer oder andere Auslösebedingung,
- ailment-spezifischer Basiswert,
- Chance beziehungsweise garantierte Anwendung,
- Dauer,
- zulässige Stapelzahl,
- Ersetzung oder Überlappung bestehender Instanzen,
- passende Modifikatoren und Gegnerabwehr.

Schadensart, Skillname, deutsche Anzeige oder Textähnlichkeit sind kein
Ersatz für diese Identitätskette.

## Implementierung

- Modell: `src/engine/damage-estimation/damage-over-time.ts`
- Modellversion: `1.0.0`
- Rechner: `src/engine/damage-estimation/estimate.ts`
- Rechnerversion: `2.5.0`
- Ergebnisdarstellung: `src/components/BuildAssistantResultSection.tsx`
- Audit: `docs/audits/build-assistant-damage-over-time-step-16.json`

## Sicherheitsgrenzen

- Keine KI- oder Fuzzy-Klassifizierung.
- Keine Ableitung aus deutschem Anzeigetext.
- Keine erfundene Ailment-Chance, Basisdauer oder Stapelzahl.
- Kein DoT im Krit-Erwartungswert.
- Kein physischer DoT in der Treffer-Rüstungsformel.
- Keine neue Datenquelle und kein geänderter Datenpin.

## Schlussfolgerung

Schaden über Zeit besitzt nun einen eigenen, deterministischen und
fail-closed Ergebniskanal. Die App kann den einen im aktuellen Pin
geschlossenen Einzelanwendungsfall ausweisen und verhindert gleichzeitig,
dass unvollständige DoT- oder Ailmentdaten den Build-DPS künstlich erhöhen.

## Als Nächstes

Schritt 17 erweitert die Schadensrechnung um belegte Mehrfachtreffer- und
Projektilmechaniken. Trefferzahl, Überlappungsbedingung und Zielannahme müssen
je Fertigkeit strukturiert feststehen; bloße Projektilanzahl darf nicht
automatisch als Schadensmultiplikator gelten.
