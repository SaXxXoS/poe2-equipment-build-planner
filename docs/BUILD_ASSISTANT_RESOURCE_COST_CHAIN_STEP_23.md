# Ressourcenpools und Fertigkeitskosten – Schritt 23

## Ziel

Schritt 23 verbindet die bereits vorhandenen Ressourcenhinweise mit den
tatsächlich belegten Ausrüstungswerten und prüft jede aktive Fertigkeit als
eigene Kostenkette. Es werden keine Grundkosten, Ressourcenpools,
Reservierungsbeträge oder Regenerationswerte geschätzt.

## Quellenbestand

- PoB2-Schadensreferenz: 337 Fertigkeitsdatensätze.
- 82 Datensätze besitzen `HasReservation`.
- 9 Datensätze besitzen `MultipleReservation`.
- 6 Datensätze enthalten einzelne strukturierte Zahlenfelder mit Bezug zu
  Mana, Geist, Ressourcen oder Reservierung.
- Der technische Affixbestand enthält 165 Statzeilen aus der engen
  Ressourcen-Allowlist für maximales Leben, maximales Mana, Geist oder
  Manaregeneration.

Diese Werte bilden keine geschlossene allgemeine Kette aus Charaktergrundwert,
Attributwirkung, Fertigkeitsgrundkosten, Supportmultiplikator,
Reservierungsbetrag, Wiederherstellung und Wirkfrequenz.

## Modell

`resource-spirit-model` Version 2.0.0 führt getrennt:

- exakt erkannte Ausrüstungsbeiträge,
- erkannte Reservierungs- und Manawechselwirkungen,
- eine deterministische Kostenkette je belegtem Fertigkeitsslot,
- semantische Support-Kostenhinweise ausschließlich für das Ranking.

Jeder Ausrüstungsbeitrag behält Gegenstand, Modifikator und Stat-ID. Ähnlich
benannte unbekannte Stat-IDs werden nicht übernommen.

## Fail-closed-Verhalten

Eine Fertigkeitskette bleibt blockiert, solange mindestens einer dieser
Bestandteile fehlt:

1. exakte Grundkosten der verwendeten Gemmenstufe,
2. exakte Kostenmultiplikatoren der gewählten Supports,
3. vollständiger aktueller Lebens-, Mana- oder Geistpool,
4. Reservierungsbetrag,
5. Wiederherstellung beziehungsweise Regeneration.

Ein einzelnes Manaaffix wird deshalb als Teilbeitrag ausgewiesen, aber nicht
als vollständiger Manapool bezeichnet. Eine Reservierungsmarkierung beweist
weder ihren Betrag noch die verfügbare Geistkapazität.

## Wirkung auf die Berechnung

Das Modell verändert derzeit keine Wirkfrequenz und keinen DPS-Wert. Dies ist
absichtlich: Eine Reduktion wegen vermuteter Kosten wäre ebenso falsch wie
eine uneingeschränkte Aufrechterhaltbarkeit zu behaupten.

Rechnerversion: `3.2.0`.

## Nächster Schritt

Als nächster Schritt soll die technische Kette für exakte Gemmen-Grundkosten
und Support-Kostenmultiplikatoren aus bereits gepinnten lokalen Quellen
geprüft und – nur bei vollständiger Identität und Stufenzuordnung – in einen
separaten Produktvertrag überführt werden.
