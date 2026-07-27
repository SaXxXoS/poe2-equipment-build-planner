# Gegnerabwehr und automatische Vergleichsprofile – Schritte 6 und 7

## Ziel

Der berechenbare Trefferschaden kann jetzt gegen ein ausdrücklich
konfiguriertes Vergleichsgegnerprofil ausgewertet werden. Mapping- und
Boss-Zielprofil erzeugen bewusst keine versteckten Gegnerwerte.

## Modell

Das Modell verarbeitet getrennt:

- Feuer-, Kälte-, Blitz- und Chaoswiderstand,
- explizite Widerstandsreduktion, einschließlich bereits aufgelöster
  Fluch- oder Expositionswerte,
- Trefferdurchdringung nach der Widerstandsänderung,
- Rüstung gegen physische Treffer,
- expliziten Rüstungsbruch.

Durchdringung senkt den behandelten Widerstand standardmäßig nicht unter
null. Ein bereits durch Widerstandsreduktion negativer Widerstand bleibt
negativ. Sonderregeln, die Durchdringung unter null erlauben oder Widerstand
ignorieren, benötigen später einen eigenen strukturierten Effekt.

Rüstung wird für Minimum und Maximum eines physischen Treffers getrennt
berechnet. Die derzeit belegte Formel ist `A / (A + 10 × Trefferschaden)` mit
maximal 90 Prozent Reduktion. Da die zugrunde liegende Wiki-Dokumentation
ihren Formelabschnitt selbst als aktualisierungsbedürftig kennzeichnet, ist
dieser Teil als versionierte, austauschbare Vergleichsformel zu behandeln
und nicht als vollständige aktuelle Spielsimulation.

## Fail-closed-Grenze

- Kein Gegnerprofil: keine Gegnerabwehr wird angenommen.
- Keine automatisch erfundenen Mapping-, Boss- oder Pinnacle-Widerstände.
- Keine Fluch-, Expositions-, Durchdringungs- oder Rüstungsbruchwirkung ohne
  expliziten Zahlenwert.
- Keine Wirkung auf Schaden über Zeit; dieser ist weiterhin nicht Teil des
  Trefferschadenmodells.

## Ausgabe

Bei vorhandenem Profil liefert die Berechnung:

- effektive Abwehr je Schadenskomponente,
- Schaden je Komponente nach Abwehr,
- erwarteten Trefferschaden nach Krit und Gegnerabwehr,
- erwarteten Trefferschaden pro Sekunde nach Gegnerabwehr,
- einen zusätzlichen nachvollziehbaren Rechenschritt.

## Prüfungen

Abgedeckt sind Widerstand, Widerstandsreduktion, Durchdringungsgrenze,
Rüstung, Rüstungsbruch, Schadensarttrennung, deterministischer Profilbetrieb
und der unveränderte Zustand ohne Profil.

## Automatische Auswahl im Hintergrund

Der Nutzer muss kein Gegnerprofil einstellen. Der normale Build-Ablauf wählt
deterministisch anhand des bereits vorhandenen Zielprofils:

- `Allround` → neutraler Allround-Grundvergleich,
- `Mapping` → Mapping-Grundvergleich,
- `Boss` → Vergleich für einen anhaltenden Bosskampf.

Die Auswahl ist als `automatic-season-reference` mit der Version
`poe2-0.4-reference-v1` gekennzeichnet und wird im Ergebnis sichtbar genannt.
Bei gleicher Eingabe wird dasselbe Profil verwendet.

Der belegte Standardwiderstand beträgt null. Ein universeller aktueller
Rüstungswert für alle Monster oder Bosse sowie ein numerischer allgemeiner
Wert der zeitlich abklingenden Boss-Anti-Burst-Reduktion sind in den
gepinnten Projektdaten nicht vorhanden. Deshalb unterscheiden sich die
Profile derzeit durch Einsatzzweck und offen ausgewiesene Grenzen, nicht
durch erfundene Abwehrwerte.

Der unveränderte Rohwert vor Gegnerabwehr bleibt zusätzlich sichtbar. Damit
ist ein Vergleich nicht von einer versteckten oder vom Nutzer zu erratenden
Einstellung abhängig.

## Nächster Schritt

Belegte Fluch-, Expositions-, Durchdringungs- und Rüstungsbruchwerte aus
Skills, Supports, Passiven und Aszendenz werden automatisch aus der
gemeinsamen Wirkungskette in dasselbe Gegnerabwehrmodell gespeist.
