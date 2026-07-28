# Gegenstandsqualität und lokale/globale Werte – Schritt 22

## Ziel

Schritt 22 verhindert, dass Qualität oder lokale Affixe doppelt in einen
Gegenstandswert einfließen. Er trennt Tooltip-Endwerte, gepinnte Basiswerte,
lokale Modifikatoren und globale Build-Skalierungen.

## Datenbestand

Der gepinnte technische Affixbestand `4.5.4.4.4` enthält 1.828 normale
technische Affixdatensätze. Davon sind 448 als lokal und 1.380 als nicht
lokal klassifiziert. Das Equipmentmodell transportiert Qualität,
Tooltip-Verteidigungen und vollständige Waffenwerte getrennt.

Eine geschlossene, versionierte Qualitätsformel einschließlich Basistyp,
Qualitätsart und aller aktuellen Sonderregeln ist im lokalen Produktbestand
nicht vorhanden. Deshalb wird Qualität nicht frei geschätzt.

## Wertkette

Das Modell `item-value-scope-model` verwendet drei Wertgrundlagen:

1. `observed-final-values`: Vom Nutzer oder der Bilderkennung übernommene
   Tooltipwerte. Diese Werte enthalten die sichtbare Wirkung von Qualität und
   lokalen Affixen bereits.
2. `pinned-base-values`: Eine exakt zugeordnete Waffenbasis. Lokale Affixe
   dürfen darauf genau einmal wirken.
3. `no-numeric-item-values`: Kein belastbarer numerischer Gegenstandswert.

Globale Affixe werden weiterhin in der gemeinsamen quantitativen
Build-Skalierung angewandt. Affixe mit `isLocal = true` sind dort
ausgeschlossen.

## Qualität

Liegt ein Tooltip-Endwert vor, wird Qualität als bereits enthalten
dokumentiert und nicht erneut multipliziert. Liegt nur eine Basis plus eine
Qualitätsangabe vor, blockiert die numerische Waffenberechnung, solange keine
exakte gepinnte Qualitätsformel vorhanden ist. Damit entsteht weder eine
Unterschätzung durch stilles Ignorieren noch eine Doppelberechnung.

## Defensive Werte

Rüstung, Ausweichwert und Energieschild aus dem Tooltip bleiben defensive
Endwerte. Sie werden nicht aus sichtbaren Affixen erneut rekonstruiert und
erzeugen keinen Waffenschaden. Waffen können weiterhin keine solchen
Rüstungswerte liefern.

## Sichtbarkeit

Die Ergebnisansicht zeigt die Anzahl verwendeter Tooltip-Endwerte, die von
globaler Skalierung ausgeschlossenen lokalen Affixe und unvollständige
blockierte Wertketten.

## Determinismus und Grenzen

Die Klassifikation hängt ausschließlich von gespeicherten Gegenstandsfeldern
und den technischen `isLocal`-Markierungen ab. Es gibt keine Textheuristik,
keine neue Datenquelle und keine Nutzereinstellung.

Nicht berechnet werden Qualitätswirkungen ohne exakte Referenz,
unaufgelöste lokale Eigenschaften und aus sichtbaren Endwerten rückgerechnete
Basiswerte.

## Nächster Schritt

Schritt 23: Gemmen- und Fertigkeitskosten sowie Ressourcenpools durch einen
geschlossenen Charakterwerttransport erweitern, sobald exakte gepinnte
Quellen für Mana-, Leben- und Geistwerte vorliegen.
