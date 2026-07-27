# Schritt 3 – Einheitliches Wirkungsmodell

## Ziel

Schritt 3 verbindet die belegbaren Wirkungen aus Ausrüstung, Fertigkeiten,
Unterstützungen, normalem Passivbaum, Waffenset-Spezialisierungen und
Aszendenz in einem deterministischen Modell. Das Modell ist keine vollständige
DPS-Simulation. Es verhindert, dass nicht belegte oder fachlich fremde Werte
als positiver Build-Bonus behandelt werden.

## Vorheriger Zustand

Die Analyzer lieferten bereits eigene Bewertungen. Die sichtbaren Hinweise zu
den besten Schadensskalierungen wurden jedoch teilweise direkt aus Skill-Tags
formuliert. Eine gemeinsame, prüfbare Wirkungskette mit Quelle, Waffenset,
Evidenz und Offensiv-/Defensivtrennung fehlte.

## Datenmodell

`BuildEffectModel` enthält je Wirkung ID, Quelle, Quell-ID, Waffenset,
Wirkungsbereich, Wirkungsart, Mechanik-Tags, optionale Zahlenwerte,
Evidenzklasse, produktive Nutzbarkeit und eine Erklärung.

Evidenzklassen:

- `structured-exact`: direkt aus einem strukturierten Feld,
- `structured-derived`: deterministisch aus kompatiblen strukturierten
  Feldern abgeleitet,
- `unresolved`: keine produktiv nutzbare Wirkung.

## Quellen und Trennung

- Tatsächliche Waffen-Schadensbereiche, Angriffe pro Sekunde und kritische
  Basis-Trefferchance werden offensiv erfasst.
- Rüstung, Ausweichwert und Energieschild werden ausschließlich defensiv
  erfasst.
- Die Hauptfertigkeit legt die zulässigen Schadensarten und Mechaniken fest.
- Supports wirken nur bei erfüllten Pflicht-Tags, Ausschlüssen und
  Schadensarten.
- Mehrere Stufen derselben Supportfamilie werden nicht doppelt gezählt.
- Nur tatsächlich angewandte Profiländerungen aus der realen Pfadplanung
  werden übernommen.
- Gemeinsame Passive, Set 1, Set 2 und Aszendenz bleiben getrennt.

## Schadensumwandlungen

Das Modell besitzt einen eigenen Typ für Umwandlungen. Aktuell wird keine
Umwandlung erzeugt, solange keine bestätigte Von-/Nach-Schadensart und kein
bestätigter Prozentsatz vorliegen. Dadurch wird Feuerschaden beispielsweise
nicht als Blitzskalierung ausgegeben, nur weil beide Werte vorkommen.

## Waffen und Verteidigungswerte

Waffenklassen dürfen keine angezeigten Rüstungs-, Ausweich- oder
Energieschild-Endwerte in das Buildprofil einbringen. Solche Eingaben werden
blockiert und erzeugen keinen Bonus. Defensive Offhand-Klassen wie Schilde
werden nicht pauschal als Waffen behandelt.

## Sichtbare Ergebnisdarstellung

„Beste Schadensskalierungen“ verwendet nun ausschließlich die gemeinsame
Wirkungskette, nennt belegte Quellen und zeigt die Anzahl offensiver,
defensiver und ungelöster Wirkungen. Unbekannte oder inkompatible
Zusammenhänge erzeugen keinen positiven Hinweis.

## Noch offene numerische Mechaniken

- vollständige Gemmenlevel- und Qualitätswirkungen,
- exakte `increased`-/`more`-Multiplikatoren aller Supports,
- vollständige Umwandlungsketten,
- komplexe Trefferfrequenz, Projektile und Mehrfachtreffer,
- Schaden über Zeit, Trigger und Minions,
- gegnerische Widerstände und Rüstung,
- Flüche, Exposition, Debuffs und Buff-Uptime.

Diese Lücken bleiben sichtbar ungelöst.

## Tests und Schlussfolgerung

Die Tests prüfen Offensiv-/Defensivtrennung, Waffenklassen, kompatible und
inkompatible Supports, fehlende Umwandlungen und Determinismus. Schritt 3
schafft damit die gemeinsame Grundlage für belastbarere Build-Optimierung und
spätere konkrete seltene Ausrüstungsvorschläge.

## Nächster Schritt

Als Nächstes sollte das Modell um bestätigte numerische Skill- und
Supporteffekte sowie explizite Schadensumwandlungen erweitert werden. Erst
danach lassen sich seltene Ausrüstungsvorschläge zuverlässig nach einem
quantitativ vergleichbaren Schadensnutzen ranken.
