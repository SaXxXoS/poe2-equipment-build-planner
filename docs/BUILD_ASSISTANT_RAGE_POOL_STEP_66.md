# Schritt 66 – belegter Rasereivorrat

## Ergebnis

Das Ressourcenmodell verbindet den gepinnten PoB2-Grundwert von 30 maximaler
Raserei mit exakt erkannten Ausrüstungswerten sowie unbedingt wirksamen
Passiv- und Aszendenzknoten.

Für rasereiverbrauchende Fertigkeiten zeigt die App nun:

- Raserei-Verbrauch pro Sekunde,
- Raserei-Erzeugung pro erfolgreichem Treffer und pro Sekunde,
- Nettoverbrauch,
- bestätigte maximale Raserei,
- das kostenfreie Anfangsfenster und
- die maximale Nutzungsdauer bei Start mit vollem Rasereivorrat.

Wenn die belegte Erzeugung den Verbrauch vollständig deckt, wird die Kette als
dauerhaft tragfähig ausgewiesen.

## Quellenkette

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Grundwert: `src/Data/Misc.lua`, `BaseMaximumRage = 30`
- Passive und Aszendenz: vergebene Baumknoten mit exakt lesbaren,
  unbedingten `Maximum Rage`-Wirkungen
- Ausrüstung: technische Stat-ID `maximum_rage`

Der Referenzgenerator prüft den Grundwert fail-closed. Eine Änderung am
gepinnten Wert bricht die Generierung ab.

## Grenzen

- Der aktuelle Rasereistand wird nicht erfunden.
- Die Dauer ab vollem Vorrat ist eine obere Nutzungsgrenze und keine
  Behauptung über den tatsächlichen Startzustand.
- Bedingte Wirkungen wie „während Gestaltwandlung“ oder „beim Führen einer
  Axt“ werden noch nicht ohne bestätigten Laufzeitzustand angewandt.
- Treffer auf mehrere Ziele und Mehrfachtreffer werden nicht pauschal als
  zusätzliche Rasereierzeugung angenommen.

## Prüfung

- Ressourcenmodell: `15.0.0`
- 74 fokussierte Tests erfolgreich
- Typecheck erfolgreich
- deterministische Referenzdatei neu erzeugt

