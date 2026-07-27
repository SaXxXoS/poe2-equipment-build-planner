# Automatische Rotations- und Triggerfenster – Schritt 11

## Ziel

Schritt 11 verbindet die vorhandene Rotationsplanung mit strukturierten
Aktivierungszeiten, Wirkzeiten, Abklingzeiten und Triggerintervallen. Die
Berechnung läuft automatisch im Hintergrund und fügt keine neue
Nutzereinstellung hinzu.

## Quellen und Zuordnung

Die Zeitwerte stammen ausschließlich aus
`generated/pob2/damage-reference.json` am bereits gepinnten PoB2-Commit.
Fertigkeiten werden über ihren bestätigten englischen Quellnamen zugeordnet.
Eine Übersetzung oder sichtbare Textähnlichkeit dient nicht als technische
Identität.

## Zeitwerte

Das Modell übernimmt, soweit strukturiert vorhanden:

- Aktivierungs- beziehungsweise Wirkzeit
- Effekt-Wirkzeit
- Abklingzeit
- Trigger- oder Stapelintervall
- geplantes Aktualisierungsintervall bei bereits als aufrechterhaltbar
  modellierten Buffs und Debuffs

## Status

- `permanent`: bestehender Fertigkeitsdatensatz kennzeichnet den Effekt als
  dauerhaft
- `maintainable`: Wirkzeit ist belegt und die bestehende Rotation verlangt
  Aktualisierung
- `windowed`: Wirkzeit ist belegt, aber lückenlose Aufrechterhaltung nicht
- `cooldown-limited`: Abklingzeit ist belegt, tatsächliche Nutzungshäufigkeit
  nicht
- `trigger-limited`: Trigger- oder Stapelintervall ist belegt
- `unresolved`: keine vollständige numerische Zeitkette vorhanden

## Fail-closed-Verhalten

Eine bekannte Wirkzeit erzeugt allein keine behauptete Dauerwirkung. Eine
bekannte Abklingzeit bedeutet nicht, dass die Fertigkeit automatisch bei
jedem Ablauf genutzt wird. Ohne bestätigte numerische Wirkung verändert ein
Zeitfenster außerdem keinen Schadenswert.

## Anzeige

Mapping- und Bossrotation nennen bei jedem belegten Fertigkeitsschritt
Aktivierungszeit, Wirkzeit, Abklingzeit oder Triggerintervall. Dazu erscheint
eine deutsche Erklärung, ob der Effekt dauerhaft, aufrechterhaltbar,
zeitbegrenzt oder weiterhin unbekannt ist.

## Determinismus

Identische Fertigkeitsauswahl und identischer Quellenpin erzeugen identische
Zeitwerte, Status und Rotationsschritte. Das Rotations-Zeitmodell trägt
Version `1.0.0`.

## Grenzen

- keine erfundene Buff- oder Debuff-Uptime
- keine Annahme sofortiger Wiederverwendung nach Cooldown
- keine freie Kampfzeit
- keine Triggerfrequenz ohne strukturierten Triggerwert
- keine vollständige Path-of-Building-Gesamt-DPS-Simulation

## Ergebnis

Die bestehende Rotation besitzt nun belegte numerische Zeitfenster. Bekannte
Zeitdaten werden automatisch verwendet; unbekannte Ausführungs- und
Aufrechterhaltungsbedingungen bleiben sichtbar ungelöst.

## Nächster Schritt

Als nächstes kann die numerische Wirkung zeitlich belegter Buffs, Debuffs und
Trigger erweitert werden. Eine Wirkung darf nur in die Schadensrechnung
gelangen, wenn Betrag, Ziel, Aktivierungsregel und Zeitfenster gemeinsam
strukturiert belegt sind.
