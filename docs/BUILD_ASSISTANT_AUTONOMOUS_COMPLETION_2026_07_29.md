# Selbstständiger Abschlusslauf des Build-Assistenten

## Ziel und Ausgangspunkt

Dieser Abschlusslauf setzt den Auftrag um, die bisher einzeln entwickelten
Bausteine zu einem belastbaren, lokalen Build-Assistenten zusammenzuführen.
Ausgangscommit war
`15f6fad38c3257ca71bf2c875a156539aed48214`.

Die bestehende Architektur bleibt maßgeblich:

`Eingabe → BuildProfile → vorhandene Analyzer → Paketoptimierung → Ergebnis`

Es wurde keine zweite Build-Engine, keine Runtime-API, kein Scraping und keine
Trade- oder Preisfunktion eingeführt.

## Gepinnte Gegenstandsgrundwerte

Der Buildzeitgenerator
`scripts/poe2-weapon-base-values/generate.mjs` erzeugt die getrennte Datei
`generated/poe2-items/weapon-base-values.json`.

- Schema: `3`
- Quelle: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Waffenbasen: `322`
- Rüstungsbasen: `1.273`
- sonstige Itembasen: `415`
- SHA-256:
  `46aa6ed7f5f17a9b0b2a2962e72a2fcbfa3a33cc65910070b8ec60056305e8c4`

Waffen, Rüstung und sonstige Basen sind strukturell getrennt. Waffen erhalten
keine Rüstungs-, Ausweich- oder Energieschildfelder. Der Editor kann gepinnte
Grundwerte übernehmen und zugleich beobachtete Endwerte aus manueller Eingabe
oder OCR getrennt bewahren.

## Erweiterte lokale Schadensreferenz

`generated/pob2/damage-reference.json` verwendet Schema `6`.

- Skillreferenzen: `337`
- Support-Quelldatensätze: `540`
- Itembasen: `1.833`
- SHA-256:
  `6366ff8f8fb3875e1a10b1cb8e55c47035eb9c22f88756fa900deedb1f60a169`

Strukturierte Supportwirkungen werden nur über eine begrenzte Allowlist
quantitativ verwendet. Nicht eindeutig belegte Wirkungen bleiben ohne
erfundenen Multiplikator.

## Zusammenhängende Optimierung

Die Optimierung bewertet nicht mehr ausschließlich den höchsten isolierten
Skillwert. Sie prüft ein gemeinsames Paket aus:

- Klasse und Aszendenz
- vorhandener Ausrüstung oder geplanter Waffenbasis
- Hauptskill und Set-2-Zusammenhang
- harten Supportregeln
- passiven und Aszendenz-Skalierungen
- Ressourcen- und Rotationsgrenzen
- Juwelen und Uniques
- vorhandener, gepinnter Meta-Referenzevidenz

Equipment-first bleibt verbindlich. Ist echte Ausrüstung vorhanden, besitzt
sie Vorrang. Ohne Ausrüstung darf die App ein geplantes Paket erzeugen; noch
nicht erfüllte Attributanforderungen werden dabei als Ausrüstungsanforderung
und nicht als falsche vorhandene Eigenschaft behandelt.

Die Supportkompatibilität verwendet bei alternativen zulässigen Tags eine
ODER-Regel. Eine Liste wie `Attack oder Spell` verlangt nicht mehr fälschlich
beide Tags gleichzeitig. Harte Ausschlüsse bleiben vorrangig.

## Leerer Build und sichtbares Beispiel

Ein neuer Browserzustand bleibt vollständig leer. Erst eine ausdrückliche
Analyse erzeugt Empfehlungen.

Die Browserprüfung für `Zauberin → Sturmweberin`, Level 90,
24 Story-Passivpunkte und 8 Aszendenzpunkte ergab:

- `Funken` als Hauptschaden in Waffenset 1
- `Gewittersphäre` als zusammenhängende Vorbereitung in Waffenset 2
- `Elementarempfindlichkeit` als belegte Widerstandssenkung in Waffenset 2
- fünf tatsächlich eingetragene, technisch geprüfte Supports für den
  Hauptskill
- einen sichtbaren Build-Vorschlag und passive Planung

Das ist ein deterministisches Ergebnis des lokalen Datenstands, keine frei
erzeugte Spielberatung.

## Passive Tree und Aszendenz

Der Passivzieler erkennt zusätzlich allgemeine Schadens-, Skilltempo- und
Auraeffektzeilen, ohne daraus eine Schadensart zu erfinden.

- offizieller Baum: `5.150` Knoten und `6.067` Verbindungen
- klassifizierte Statzeilen: `5.087 / 5.962`
- gemessene Coverage: `85,32 %`
- ungeklärte Statzeilen: `875`
- normale Punkte, bis zu 24 umschaltbare Set-Punkte je aktivem Waffenset und
  maximal 8 Aszendenzpunkte bleiben getrennt

Juwelsockel werden weiterhin nicht als set-spezifische Punkte geplant.
Gelb, Rot, Grün und Violett bleiben die sichtbaren Ebenen für gemeinsam,
Set 1, Set 2 und Aszendenz.

## UI, Speicherung und Gegenstandsvorschläge

- Eingaben werden versioniert ausschließlich im Browser gespeichert.
- `Alles zurücksetzen` synchronisiert nun auch die sichtbaren leeren
  Level-, Story- und Aszendenzfelder.
- Vorgeschlagene Waffenarten öffnen eine Detailansicht, die ausdrücklich
  zwischen Waffenart-Empfehlung und einem belegten fertigen Item
  unterscheidet.
- Produktive Uniques zeigen vorhandene Varianten und Eigenschaften; fehlende
  Daten bleiben `Unbekannt`.
- Rüstungs- und Waffenfelder werden im Editor passend zur Itemart angezeigt.
- OCR-Werte und gepinnte Grundwerte werden nicht doppelt in die
  Schadensberechnung eingerechnet.

## Verifikation

Die Browserprüfung umfasste Desktop und `390 × 844`.

- keine horizontale Überbreite
- einspaltige Skillkarten
- Skill- und Supportempfehlungen sichtbar
- Set-1-/Set-2-Zuordnung sichtbar
- Ausrüstungsvorschlagsdetails bedienbar
- keine neuen Browserkonsolenfehler oder -warnungen

Der serielle Gesamtlauf bestand `1.314 / 1.314` Tests. Nach den abschließenden
UI-/Typkorrekturen bestand der fokussierte Lauf weitere `31 / 31` Tests.
Lint, Typecheck, Produktions-Build und Pages-Build waren erfolgreich.
`166` JSON-Dateien wurden geparst; `git diff --check` war erfolgreich und
keine lokalen Audit-Rohdaten wurden versioniert.

## Ehrliche Grenzen

Folgende Punkte sind **Unbekannt beziehungsweise nicht vollständig belegt**:

- globale mathematische Optimalität eines Builds
- Gleichwertigkeit oder Überlegenheit gegenüber allen aktuellen Meta-Builds
- vollständige Simulation sämtlicher PoE2-Sondermechaniken
- vollständige Klassifikation der verbleibenden 875 Passiv-Statzeilen
- vollständige, korrelierte Meta-Abdeckung aller Klassen und Aszendenzen
- exakte PoB-DPS für jede Trigger-, Minion-, DoT-, Mehrfachtreffer- und
  bedingte Uptime-Konstellation

Die App behauptet diese Punkte nicht. Sie erzeugt den bestbewerteten,
zusammenhängenden Build innerhalb der tatsächlich gepinnten und getesteten
Projektdaten.

## Schlussfolgerung

Der Build-Assistent ist im belegten Projektumfang als equipment-first und
ohne Ausrüstung nutzbarer, deterministischer Planer verbunden. Empfehlungen
besitzen eine geprüfte Skill-, Waffen-, Support- und Paketbeziehung.
Unbelegte Beziehungen erzeugen keinen positiven Bonus.

Der nächste fachlich sinnvolle Auftrag ist kein weiterer UI-Platzhalter,
sondern die kontrollierte Erweiterung der verbleibenden Mechanik- und
Meta-Coverage bei unverändert fail-closed arbeitender Optimierung.
