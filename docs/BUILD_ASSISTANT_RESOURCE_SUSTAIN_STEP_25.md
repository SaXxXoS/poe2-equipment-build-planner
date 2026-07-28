# Schritt 25 – automatische Ressourcen-Nachhaltigkeit

## Ziel

Die App prüft Fertigkeits- und Supportkosten automatisch gegen einen technisch
belegten Charakter-Mindestpool. Der Nutzer muss dafür keine weitere Einstellung
vornehmen.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Grundwerte: `src/Data/Misc.lua`
- Rechenformeln: `src/Modules/CalcSetup.lua`
- Fertigkeitskosten und Supportmultiplikatoren: unverändert aus Schritt 24

Die Referenz belegt:

- Leben: `12 × (Charakterlevel + 16)`
- Mana: `4 × (Charakterlevel + 30)`
- natürliche Manaregeneration: `240 %` des Manapools pro Minute

Das Charakterlevel stammt aus dem vorhandenen BuildProfile-Transport.
Eindeutig erkannte flache Lebens-/Manawerte und erhöhte Manaregeneration aus
der Ausrüstung werden ergänzt.

## Fail-closed-Modell

Der berechnete Wert heißt bewusst **bestätigter Mindestpool**. Nicht vollständig
transportierte Passive-, Aszendenz-, bedingte oder besondere Unique-Wirkungen
werden nicht geschätzt.

Eine Kette erhält genau einen Status:

- `sustainable-on-confirmed-minimum`: Schon die konservativ belegte
  Regeneration deckt den Verbrauch.
- `burst-affordable-on-confirmed-minimum`: Ein Einsatz ist durch den
  Mindestpool gedeckt; dauerhafte Deckung ist noch nicht belegt.
- `blocked-missing-action-frequency`: Für den Verbrauch pro Sekunde fehlt eine
  sichere Wirkfrequenz, etwa bei einem Angriff ohne vollständige Waffenbasis.
- `blocked-missing-character-level`: Das erforderliche Charakterlevel fehlt.
- `blocked-missing-exact-cost-chain`: Grundkosten oder Supportmultiplikatoren
  sind unvollständig.

Aus einem zu kleinen Mindestwert folgt niemals automatisch „nicht spielbar“,
weil unbekannte positive Wirkungen existieren können.

## Anzeige und Grenzen

Die Ergebnisansicht zeigt Mindest-Mana, Mindest-Leben, natürliche
Manaregeneration, supportangepasste Kosten, Verbrauch pro Sekunde und den
Status der Kette. Der Status verändert aktuell weder DPS noch
Support-Ranglisten. Geistreservierungen, Lebensregeneration, Leech, Recoup,
Fläschchen, Kostenumleitungen und bedingte Wiederherstellung bleiben
fail-closed.

## Ergebnis

Schritt 25 liefert erstmals eine belegte positive Nachhaltigkeitsaussage, wenn
bereits der konservative Mindestwert genügt. Für Angriffe und komplexe
Ressourcenwechselwirkungen bleiben nicht geschlossene Ketten sichtbar
unbekannt.

## Nächster Schritt

Schritt 26 soll Passive-, Aszendenz- und weitere technisch belegte
Ressourcenwirkungen in denselben Pooltransport integrieren. Erst danach dürfen
negative Nachhaltigkeitsurteile oder eine ressourcenabhängige automatische
Supportoptimierung erwogen werden.
