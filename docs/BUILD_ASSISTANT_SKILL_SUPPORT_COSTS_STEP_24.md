# Fertigkeitsgrundkosten und Supportmultiplikatoren – Schritt 24

## Ziel

Schritt 24 schließt den technisch belegbaren Anfang der Kostenkette:
Grundkosten einer Fertigkeit auf Referenzstufe 20 werden mit den
Kostenmultiplikatoren der tatsächlich gewählten Supports verbunden. Das
Ergebnis beschreibt Kosten pro Einsatz beziehungsweise laufende Kosten pro
Sekunde. Es ist noch keine vollständige Aussage darüber, ob der Charakter
diese Kosten dauerhaft tragen kann.

## Gepinnte Quellen

- PoB2 `PathOfBuildingCommunity/PathOfBuilding-PoE2`,
  Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Fertigkeitszeilen:
  `src/Data/Skills/act_str.lua`, `act_dex.lua`, `act_int.lua`
- Kostendivisoren: `src/Data/Costs.lua`,
  SHA-256 `4d59ec2732a0dc2bdcd524b5fbd831f70a74e7f3a528d1c7539ee849d6d5d16a`
- RePoE-Version `4.5.4.4.4`,
  Commit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`
- Supportidentität: `data/skill_gems.json`
- Support-Kostenmultiplikator: `data/skills.json`,
  SHA-256 `1a83f007c1015c1d2fc0e3e22503dc8deb2debed0e3ea450cf64bc3714f378c7`

Es wurde keine neue Quelle und kein Runtime-Netzwerk eingeführt.

## Coverage

- 337 PoB2-Fertigkeitsreferenzen insgesamt
- 235 mit strukturierter Kostentabelle
- 178 mit mindestens einem von null verschiedenen Kostenwert
- 57 mit ausschließlich strukturierten Nullkosten
- 224 Mana-Kostenzeilen pro Einsatz
- 12 laufende Mana-Kostenzeilen
- 1 laufende prozentuale Mana-Kostenzeile
- 2 laufende Raserei-Kostenzeilen
- 451 produktive Supportdatensätze
- 450 mit exakt aufgelöstem Kostenmultiplikator
- 1 blockiert wegen fehlendem Wert in der gewährten Support-Fertigkeit

## Identitätsketten

Fertigkeitskosten werden ausschließlich über den englischen technischen
Fertigkeitsnamen zur bereits verwendeten PoB2-Schadensreferenz verbunden.
Supportmultiplikatoren verwenden:

`Support-Gem-ID → grants_skills → technische Support-Skill-ID → cost_multiplier`

Namen, Beschreibungen, deutsche Texte und Ähnlichkeitssuche erzeugen keine
Kostenwerte.

## Berechnung

Die Multiplikatoren aller gewählten Supports werden multipliziert und wie in
der gepinnten PoB2-Kostenlogik nach vier Dezimalstellen abgerundet. Die
Stufe-20-Grundkosten werden anschließend mit diesem Faktor verbunden.
Laufende `PerMinute`-Quellwerte verwenden ausschließlich den in
`Costs.lua` belegten Divisor 60.

Die Ausgabe trennt:

- Grundbetrag,
- Supportmultiplikatoren je Support,
- gemeinsamen Supportmultiplikator,
- supportangepassten Betrag,
- Ressource und Rhythmus.

## Fail-closed-Grenzen

Eine fehlende Fertigkeitskostentabelle oder ein fehlender ausgewählter
Supportmultiplikator blockiert die exakte Kette. Der eine nicht auflösbare
Support wird nicht geschätzt.

Noch nicht enthalten sind:

- vollständiger Mana-, Lebens-, Geist- oder Rasereipool,
- Regeneration, Leech, Fläschchen und andere Wiederherstellung,
- Kostenänderungen durch Passive, Aszendenz, Ausrüstung oder Zustände,
- vollständige Reservierungsbeträge,
- stufengenaue Kosten außerhalb der Referenzstufe 20.

Darum verändert Schritt 24 weder Wirkfrequenz noch DPS. „Dauerhaft nutzbar“
wird erst behauptet, wenn Kosten, Pool und Wiederherstellung geschlossen
vorliegen.

## Technischer Status

- `resource-spirit-model`: Version `3.0.0`
- Schadensrechner: Version `3.3.0`
- PoB2-Schadensreferenzschema: Version `2`
- RePoE-Gemkatalogschema: Version `2`
- Produktpins: unverändert
- externe Genehmigung: nicht vorhanden und nicht behauptet

## Prüfstatus

- 1.242 Tests in 97 Testdateien erfolgreich
- Lint, Typecheck, Produktions-Build und Pages-Build erfolgreich
- alle fünf geänderten JSON-Artefakte validiert
- beide Generatoren mit identischem Fachhash wiederholt
- Desktop technisch geladen
- Mobilansicht bei 390 × 844 ohne horizontalen Überlauf
- Browserkonsole ohne neue Fehler oder Warnungen

## Nächster Schritt

Schritt 25 soll den vollständigen Charakter-Ressourcenpool und die belegbare
Wiederherstellung verbinden. Erst danach kann die App Kosten pro Sekunde mit
verfügbarem Mana/Leben/Geist und Regeneration vergleichen.
