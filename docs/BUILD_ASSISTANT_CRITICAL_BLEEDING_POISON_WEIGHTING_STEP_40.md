# Build-Assistent – kritische Blutungs- und Giftgewichtung (Schritt 40)

Blutung und Gift verwenden jetzt wie die gepinnte PoB2-Funktion
`CalcOffence.calcAilmentDamage` eine nach normalen und kritischen Treffern
gewichtete ungeminderte Schadensbasis.

Damit wirken belegte Kritchance und kritischer Trefferschadensmultiplikator
nicht nur auf den direkten Treffer, sondern auch auf die daraus tatsächlich
abgeleitete Zustandsbasis. Die Wahrscheinlichkeit mindestens eines kritisch
ausgelösten aktiven Zustands wird separat ausgewiesen.

Nicht umgesetzt sind bedingte Sonderstats wie „Gift bei kritischem Treffer“,
„erhöhte Magnitude bei kritischem Treffer“ oder bedingte Aggravation. Diese
benötigen zusätzlich eine vollständig belegte Quelle-, Waffen-, Treffer- und
Bedingungskette und bleiben bis dahin fail-closed.

Der Referenztest prüft eine kritische Blutung mit kontrollierter Trefferbasis,
Kritchance, Kritmultiplikator, Dauer und PoB2-Grundschaden.
