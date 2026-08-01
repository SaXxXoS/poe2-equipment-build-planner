# Schritt 106 – belegbare Charakterverteidigung

## Ergebnis

Die Berechnung besitzt jetzt ein getrenntes, waffensetspezifisches Modell für
Rüstung, Ausweichwert und Energieschild. Es verbindet ausschließlich:

- eingegebene endgültige Gegenstandswerte,
- unbedingt wirksame, strukturierte Passivbaum-Effekte,
- unbedingt wirksame, strukturierte Aszendenz-Effekte.

Waffenset 1 und Waffenset 2 verwenden ihre jeweils tatsächlich belegten
Knoten. Aszendenzknoten werden beiden Sets zusätzlich zugerechnet.

## Rechenreihenfolge

Für jeden Verteidigungswert gilt deterministisch:

1. endgültige Werte aller Nicht-Waffen-Gegenstände summieren,
2. bestätigte flache Passivwerte addieren,
3. `increased` und `reduced` additiv zusammenfassen,
4. `more` und `less` getrennt multiplikativ anwenden.

Bedingte Zeilen werden nicht stillschweigend als dauerhaft aktiv angenommen.
Sie erscheinen als blockierte Wirkung. Angezeigte Rüstungs-, Ausweich- oder
Energieschildwerte auf Waffen werden ausgeschlossen.

## Bewusste Grenze

Das Ergebnis ist noch kein vollständiger finaler PoB2-Charakterbogen.
Nicht im freigegebenen lokalen Produktbestand belegte Charakter-Grundwerte,
globale Rundungsdetails, gegnerabhängige Schadensminderung und bedingte
Uptime bleiben `Unbekannt`. Zusätzliche PoB2-Rohdateien wurden nicht geladen,
weil der bestehende Importvertrag nur die freigegebenen 20 Dateien erlaubt.

## Prüfung

- getrennte Set-1-/Set-2-Wirkung,
- gemeinsame Aszendenzwirkung,
- Ausschluss bedingter Effekte,
- Ausschluss von Verteidigungswerten auf Waffen,
- deterministische Wiederholung,
- Integration in jedes `DamageEstimate`, auch im Status `unavailable`.

Die Gesamtsuite erreichte im parallelen Lauf 1.624/1.625 erfolgreiche Tests;
der einzige Vollbaum-Performance-Test überschritt dabei seine eigene
90-Sekunden-Grenze. Sein verpflichtender isolierter Wiederholungslauf war in
44,12 Sekunden erfolgreich. Damit sind fachliche Suite und serieller
Performance-Nachweis zusammen vollständig erfolgreich.
