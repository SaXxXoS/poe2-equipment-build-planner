# Schritt 37: Gegnerabwehr für eigenständigen Schaden über Zeit

## Ergebnis

Eigenständige, strukturierte DoT-Werte aus dem gepinnten PoB2-Datensatz
verwenden nun dasselbe aufgelöste Vergleichsgegnerprofil wie Treffer und
schädigende Zustände.

Berücksichtigt werden:

- der Widerstand der jeweiligen Schadensart,
- belegte Widerstandssenkung aus dem Build,
- negative Widerstände innerhalb der vorhandenen Modellgrenzen.

Penetration wird nicht auf Schaden über Zeit angewendet. Physischer nativer
DoT wird nicht fälschlich durch die Treffer-Rüstungsformel gemindert.

## Ausgabe

Rohwert und gegnerbereinigter Wert bleiben getrennt im Datenmodell erhalten.
Die sichtbare Ergebnisansicht verwendet bei vorhandenem Gegnerprofil den
bereinigten Wert und kennzeichnet ihn als Wert nach Gegnerwiderstand.

Der Wert beschreibt weiterhin genau eine belegte Anwendung. Uptime,
Überlappung und zusätzliche Stapel werden ohne vollständige technische Kette
nicht behauptet.

## Prüfung

- fokussierte DoT- und Schadensschätzungstests
- Widerstandsreduktion wirkt
- Penetration verändert DoT nicht
- TypeScript-Typprüfung

## Offene Grenze

Fertigkeitsspezifische Überlappung, Refresh-Regeln, bedingte Dauer,
Support-Sonderfälle und vollständige Uptime bleiben weitere
PoB2-Paritätsschritte.
