# Vollständige Nutzung des normalen Passivpunktebudgets

## Ziel

Die bestehende Passive-Tree-Pipeline soll nach der strategischen Auswahl der
wichtigsten Ziele auch den verbleibenden normalen Punktetat nutzen. Die
Planung bleibt deterministisch und evidenzbasiert.

## Planung

Die Auswahl erfolgt in zwei Phasen:

1. Die bestehende strategische Phase priorisiert Pflichtziele, Nutzen,
   Effizienz, Pfadwiederverwendung, Zielprofil, Konflikte und Redundanz.
2. Die Budgetabschlussphase ergänzt weitere erreichbare Ziele, solange diese
   einen belegten positiven Basisnutzen besitzen und keine bekannten
   Konflikte tragen.

Reine Reiseknoten dürfen weiterhin Bestandteil eines Pfades zu einem belegten
Ziel sein. Unbekannte, negative oder konfliktbehaftete Ziele werden nicht
vergeben, nur um eine Zahl aufzufüllen.

## Technische Grenzen

- Der offizielle Baum und seine vorhandene Pfadsuche bleiben maßgeblich.
- Es wird keine globale Optimalität behauptet.
- Sind nicht genügend sichere und erreichbare Ziele vorhanden, bleibt ein
  Restbudget sichtbar, statt ungeeignete Knoten zu erfinden.
- Die Planung der normalen Punkte und der aufgeteilten Waffen-Set-Punkte ist
  enthalten.
- Aszendenzpunkte sind ein eigener Punkttyp und werden von dieser Änderung
  nicht vergeben.

## Nachweis

Ein deterministischer Integrationstest verwendet den produktiven offiziellen
Baum mit einem normalen Budget von 121 Punkten. Das repräsentative Profil
belegt 121 von 121 Punkten, lässt keinen Rest übrig und plant mehr als 100
Baumknoten. Die bestehenden Tests für Budgets, Konflikte, Required-Ziele,
Waffen-Set-Trennung und Pfadvisualisierung bleiben maßgeblich.

