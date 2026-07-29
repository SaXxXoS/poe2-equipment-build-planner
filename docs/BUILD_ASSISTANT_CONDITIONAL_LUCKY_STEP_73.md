# Schritt 73 – bedingte Lucky-Trefferschadenswürfe

## Ergebnis

Der Trefferschadensrechner kann die im gepinnten PoB2-Baum belegten
vollständigen Lucky-Bedingungen jetzt fail-closed auswerten:

- `Damage with Hits is Lucky against Enemies that are on Low Life`
- `Damage with Hits is Lucky against Heavy Stunned Enemies`

## Zustandsmodell

Das Gegnerprofil kann die ausdrücklich belegten Zustände `low-life` und
`heavyStunned` transportieren. Der jeweilige Knoten wirkt nur, wenn genau
dieser Zustand bestätigt ist.

Ohne bestätigten Zustand:

- entsteht kein positiver Schadensbonus,
- bleibt der Knoten als blockierter Lucky-Effekt im Rechennachweis sichtbar,
- wird keine Wahrscheinlichkeit oder Zustands-Uptime erfunden.

Mit bestätigtem Zustand wird der Trefferwurf zu 100 Prozent als Lucky
behandelt. Für einen gleichverteilten Min-/Max-Wurf verwendet die App damit
denselben Erwartungswert wie beim bereits belegten unbedingten Lucky-Modell:

`Minimum + 2/3 × (Maximum − Minimum)`.

## Trennung

Defensive Unlucky-Texte, Ausweich-/Deflektionszustände sowie freie
Textähnlichkeit werden nicht als offensiver Lucky-Schaden eingelesen.
Der Zustand verändert weder Schaden über Zeit noch Zustände, sondern nur
Trefferschadenswürfe.

## Version und Prüfung

- Schadensrechner: `3.14.0`
- Lucky-Modell: `2.0.0`
- 45 fokussierte Tests erfolgreich
- Typecheck erfolgreich

Die vollständige PoB2-Gleichwertigkeit ist damit weiterhin nicht belegt.
Als nächste Rechenlücke folgen fertigkeitsspezifische Wiederholungsformeln
und weitere belegbare bedingte Trefferzustände.
