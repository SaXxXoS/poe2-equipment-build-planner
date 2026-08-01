# Build Assistant – Aktionsgeschwindigkeit Schritt 105

## Ergebnis

Die quantitative Wirkungskette unterscheidet nun auch bei Angriffs-, Zauber- und kritischer Trefferchance zwischen der additiven Gruppe `increased/reduced` und den getrennten Multiplikatoren `more/less`.

Vor diesem Schritt wurden alle Geschwindigkeitswerte addiert. Dadurch konnte ein belegtes `more` zu schwach und ein belegtes `less` sogar mit falschem Vorzeichen wirken.

## Rechenfolge

1. alle `increased`- und `reduced`-Werte addieren,
2. jeden `more`- und `less`-Wert als eigenen Faktor anwenden,
3. negative Gesamtskalierung bei null begrenzen,
4. anschließend bestehende Support- und Cooldownregeln anwenden.

## Grenzen

- Bedingte Werte bleiben ohne bestätigten Zustandsnachweis blockiert.
- Aktionsgeschwindigkeit ist nicht identisch mit Cooldown-Erholung; beide Modelle bleiben getrennt.
- Der Schritt belegt keine vollständige PoB2-Gleichwertigkeit.

## Prüfung

- additive und multiplikative Verknüpfung: abgedeckt,
- `more Cast Speed`: abgedeckt,
- `less Cast Speed`: abgedeckt,
- fokussierte Rechentests: 60/60 erfolgreich,
- Typecheck: erfolgreich.
