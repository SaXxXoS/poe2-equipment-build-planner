# Schritt 110 – Anforderungen bereits eingetragener Basistypen

## Ergebnis

Bereits eingetragene normale Gegenstände werden nun gegen die belegten
Level-, Stärke-, Geschicklichkeits- und Intelligenzanforderungen ihres
technischen Basistyps geprüft. Die Prüfung verwendet ausschließlich den
gepinnten lokalen Basistypkatalog.

## Waffensets und Selbstanforderung

- Waffen werden nur gegen die Attribute ihres tatsächlichen Waffensets geprüft.
- Gemeinsame Rüstung und Schmuck müssen in beiden Waffensets tragbar sein.
- Die Attributmodifikatoren eines Gegenstands dürfen seine eigene
  Ausrüstungsanforderung nicht erfüllen. Für diese Prüfung wird der Gegenstand
  aus der Attributsumme entfernt.
- Bekannte Attributdefizite werden bereits vor der realen Passive-Planung als
  Bedarf an das bestehende Profil übergeben.

## Fail-closed-Verhalten

Ein sichtbarer OCR- oder Freitext-Basistyp ohne technische `itemDefinitionId`
wird nicht als tragbar behauptet. Er erscheint als `unresolved-base`, erzeugt
keinen erfundenen Anforderungswert und bleibt als konkrete Verbesserung
sichtbar.

## Ergebnisdarstellung

Die Build-Auswertung zeigt je eingetragenem normalen Gegenstand betroffene
Waffensets, Status, benötigtes Level, konkrete fehlende Attribute und
unbekannte technische Basen. Blockierte Anforderungen senken die
Build-Eignung und werden vor allgemeinen Verbesserungen genannt.

## Grenzen

Unique-Anforderungen bleiben weiterhin Teil des getrennten Unique-Analyzers.
Bedingte Attributwirkungen und technisch nicht zugeordnete sichtbare Basen
bleiben unbekannt. Eine vollständige Gleichwertigkeit mit Path of Building 2
ist dadurch noch nicht belegt.

## Prüfung

- 13 fokussierte Anforderungs- und Empfehlungstests sind erfolgreich.
- 1.637 Tests der Gesamtsuite sind erfolgreich; zwei bereits bekannte,
  zeitkritische Passive-Targeting-Tests überschritten ausschließlich im
  kombinierten Lauf ihr Fünf-Sekunden-Limit.
- Dieselben beiden Testdateien sind im isolierten Wiederholungslauf mit
  insgesamt 197 Tests vollständig erfolgreich.
- Typecheck, Lint, Produktions-Build, JSON-Validierung und
  `git diff --check` sind erfolgreich.
