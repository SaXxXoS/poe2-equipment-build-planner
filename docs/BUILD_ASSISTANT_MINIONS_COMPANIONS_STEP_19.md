# Build-Assistent – Minions und Begleiter, Schritt 19

## Ziel

Schritt 19 trennt Minion- und Begleiterwirkungen vom Trefferschaden des
Spielers. Bekannte Anzahlen, Dauern, Reservierungsmerkmale und Offering-Boni
werden sichtbar, ohne daraus eine unbelegte Minion-DPS zu bilden.

## Quellenbestand

Verwendet wird ausschließlich der bereits gepinnte lokale Referenzbestand:

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Produkt: `generated/pob2/damage-reference.json`
- Gesamtbestand: 337 Fertigkeitsdatensätze
- minion- oder begleiterbezogen: 27
- davon Companion/CreatesCompanion: 5
- mit strukturierter Maximalanzahl: 2
- mit strukturierter Dauer: 2
- mit strukturiertem Minion-Schaden-/Tempobonus: 1
- mit Reservierungsmerkmal: 19

## Technische Entscheidung

Das Modell ist fail-closed. Produktiver Minion-DPS wäre nur zulässig, wenn
folgende Kette für dieselbe Kreatur geschlossen belegt ist:

1. Kreaturentyp und zugehörige Fertigkeit,
2. Grundschaden beziehungsweise konkrete Minion-Offensivwerte,
3. eigene Angriffs- oder Wirkfrequenz,
4. aktive Anzahl,
5. Uptime beziehungsweise Lebensdauer und Wiederbeschwörung,
6. angewandte Supports, Passive- und Aszendenzwirkungen,
7. gegebenenfalls verfügbare Geistbilanz und Reservierung.

Der aktuelle lokale Referenzbestand enthält keine vollständige solche Kette.
Das Modell bleibt daher numerisch nicht produktiv.

## Sichtbar ausgewiesene Teilinformationen

- `Unearth`: strukturierte Maximalanzahl von 20 Skelettkonstrukten.
- `Summon Wolf`: strukturierte Maximalanzahl von 6 Wölfen.
- `Tame Beast`: strukturierte Dauer von 11,8 Sekunden.
- `Ravenous Swarm`: strukturierte Dauer von 9,8 Sekunden.
- `Pain Offering`: 58 % Minion-Schaden und 29 % Angriffs-/Wirktempo.
- Reservierungsmerkmale werden als Voraussetzung, nicht als aktive
  Kreaturenzahl behandelt.

Diese Werte werden nur angezeigt. Maximalanzahl ist nicht gleich aktive
Anzahl; ein Offering ohne verknüpftes aktives Minion-Ziel verändert weder den
Spieler- noch einen Minion-Schadenswert.

## Behobener Fehler

Minion- und Begleiterfertigkeiten mit technischem `attack`- oder
`spell`-Merkmal konnten zuvor in das normale Spieler-Treffermodell gelangen.
Dadurch bestand das Risiko, Spielerwaffenschaden oder Spieler-Wirktempo als
Minionwirkung zu interpretieren. Solche Hauptfertigkeiten werden nun vor der
Spielerberechnung erkannt und mit einer erklärten Datenlücke beendet.

## Ergebnisdarstellung

Der Abschnitt „Minions und Begleiter“ zeigt je konfigurierter Quelle:

- Art,
- bekannte Maximalanzahl,
- bekannte Dauer,
- bekannte Minion-Schaden-/Tempoboni,
- Reservierungsanforderung,
- Blockierungsgrund.

## Grenzen

- keine Schätzung aus Namen oder sichtbaren Beschreibungstexten,
- keine Spielerwaffe als Minion-Basis,
- keine Maximalanzahl als Schadensmultiplikator,
- keine angenommene permanente Uptime,
- keine geschätzte Geistbilanz,
- keine Vermischung von Totems und Minions,
- keine neue Datenquelle und keine Runtime-Abfrage.

## Schlussfolgerung

Schritt 19 verhindert falsche Minion-DPS und macht die belegten Teilwerte
transparent. Eine belastbare numerische Minion-DPS bleibt unbekannt, bis eine
versionierte Quelle die vollständige Kreaturen- und Wirkungsverkettung liefert.

## Nächster Schritt

Schritt 20: Ressourcen- und Geistmodell. Mana-, Lebens- und Geistkosten,
Reservierungen, verfügbare Kapazität und Aufrechterhaltbarkeit müssen getrennt
und nur anhand strukturierter Werte modelliert werden.
