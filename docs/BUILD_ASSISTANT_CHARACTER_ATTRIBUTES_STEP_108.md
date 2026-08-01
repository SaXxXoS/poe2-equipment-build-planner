# Schritt 108 â€“ konkrete Charakterattribute und Anforderungen

## Behobener Fehler

Der Equipment Analyzer verwendete bisher pauschale Zielwerte von jeweils 60
StÃ¤rke, Geschicklichkeit und Intelligenz. Der Skill Analyzer deutete ein daraus
entstandenes Defizit anschlieÃŸend als NichterfÃ¼llung jeder Gemmenanforderung.
Das war keine PoE2-Regel und konnte sowohl gÃ¼ltige Skills blockieren als auch
unnÃ¶tige Attributpfade bevorzugen.

## Neues Modell

`src/engine/character-attributes/model.ts` berechnet fÃ¼r beide Waffensets:

- gepinnte Klassen-Grundattribute aus dem lokalen Baumstand `0.5.2`,
- technisch identifizierte AusrÃ¼stungswerte (`additional_strength`,
  `additional_dexterity`, `additional_intelligence`,
  `additional_all_attributes`),
- exakt strukturierbare Attributwerte der tatsÃ¤chlich belegten normalen,
  waffensetspezifischen und Aszendenzknoten,
- den resultierenden Gesamtwert je Attribut.

Waffen in Set 1 und Set 2 werden getrennt behandelt. Gemeinsame AusrÃ¼stung
gilt in beiden Sets. Unbekannte Klassen und nicht eindeutig strukturierbare
Passivtexte werden nicht geschÃ¤tzt.

## Analyzerwirkung

- Skills werden nur blockiert, wenn ihre konkrete Kataloganforderung in
  beiden verwendbaren Waffensets unterschritten wird.
- Bei einer manuell gewÃ¤hlten Hauptfertigkeit wird das konkrete Defizit als
  Passive-Planungsbedarf verwendet.
- Unique-Kandidaten mit strukturierten Attributanforderungen werden bei einem
  echten Defizit blockiert.
- Ohne konkrete Skill- oder Gegenstandsanforderung bleibt der Bedarf null.

## Sichtbare Ausgabe

Die Ergebnisansicht zeigt StÃ¤rke, Geschicklichkeit und Intelligenz fÃ¼r beide
Waffensets sowie die Anteile aus Basis, AusrÃ¼stung und Passive/Aszendenz.
Ablehnungen besitzen deutsche GrÃ¼nde statt eines pauschalen technischen
Hinweises.

## Tests und Grenzen

- 139 fokussierte Tests erfolgreich, einschliesslich der Waffenset-spezifischen
  Anforderungszuordnung und aller aktualisierten Produktgrenzen-Guards.
- Gesamtsuite seriell: 1.633/1.633 Tests erfolgreich.
- Typecheck, Lint, Produktions-Build, JSON-Validierung und `git diff --check`
  erfolgreich.
- Typecheck erfolgreich.
- Prozentuale oder bedingte Attributwirkungen werden noch nicht angewandt,
  solange ihre lokale Semantik nicht exakt strukturiert ist.
- Anforderungen aller Basistypen sind noch nicht vollstÃ¤ndig in die
  Gegenstandsempfehlung integriert.
- Gleichwertigkeit mit Path of Building 2 ist weiterhin nicht belegt.
