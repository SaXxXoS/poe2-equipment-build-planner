# Schritt 82 – reproduzierbare PoB2-Mikro-Parität

## Ergebnis

Die Schadensberechnung besitzt jetzt eine eigenständige, versionierte
Vergleichssuite gegen exakt gepinnte PoB2-Eingabewerte. Sie prüft nicht nur,
dass zwei Läufe dasselbe Ergebnis liefern, sondern vergleicht die Ausgabe mit
vorher festgelegten Erwartungswerten.

Abgedeckt sind:

- Ball Lightning auf Gemmenstufe 20: Basisbereich, Wirkfrequenz und
  Krit-Erwartungswert,
- elementare Gegnerabwehr: Widerstandsreduktion und Durchdringung,
- Flameblast: belegtes Vollstufenszenario,
- Detonating Arrow mit Shortbow: Waffenbasis, Angriffstempo und
  Vollstufen-Feuergewinn,
- Volcano: Vollstufenfaktor und die fail-closed Behandlung zusätzlicher
  Projektile.

Die Erwartungswerte stehen getrennt vom Rechner in
`docs/audits/pob2-damage-micro-parity-cases.json`. Jeder Fall nennt seine
PoB2-Quelldateien und ist an Commit
`c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` gebunden.

## Aussagegrenze

Die Suite beweist die abgedeckten Rechenketten. Sie beweist noch keine
vollständige Gleichwertigkeit für komplette PoB2-Builds.

Insbesondere weiterhin offen:

- vollständige Minion-Offensivdaten,
- sämtliche Trigger- und Projektilüberlappungen,
- alle Gemmenlevel- und Qualitätskurven,
- vollständige Buff-, Debuff- und Zustands-Uptime,
- reproduzierbare vollständige Referenzbuilds mit identischer
  Konfiguration und identischer Gesamt-DPS.

Unbelegte Mehrfachtreffer oder Zustände werden weiterhin nicht als positiver
Schadensmultiplikator verwendet.

## Prüfung

- fünf versionierte Referenzfälle,
- sechs fokussierte Paritätstests,
- stabiler PoB2-Pin,
- keine Runtime-Lua-Ausführung,
- kein Runtime-Netzwerk,
- keine Änderung der Produktdatenpins.
