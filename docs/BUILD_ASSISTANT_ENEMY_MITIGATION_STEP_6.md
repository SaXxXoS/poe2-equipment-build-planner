# Gegnerabwehr und Vergleichsprofile – Schritt 6

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

## Nächster Schritt

Das Vergleichsprofil wird als persistente, klar beschriftete Eingabe in die
App integriert. Anschließend können belegte Fluch-, Expositions-,
Durchdringungs- und Rüstungsbruchwerte aus Skills, Supports, Passiven und
Aszendenz automatisch in dasselbe Modell gespeist werden.
