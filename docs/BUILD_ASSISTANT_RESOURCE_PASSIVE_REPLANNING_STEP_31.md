# Schritt 31: Ressourcenorientierte alternative Passivplanung

## Ziel

Bei einer nach dem ersten realen Passivlauf belegten Ressourcenunterdeckung
prüft die App zuerst einen alternativen Passivplan. Automatisch empfohlene
Supports werden erst danach verändert.

## Ablauf

1. Der normale schadenorientierte Passiv-, Waffenset- und Aszendenzplan wird
   vollständig berechnet.
2. Die tatsächlichen Fertigkeitskosten, Supportmultiplikatoren, der
   Charakterlevel sowie die belegten Mana-, Geist- und
   Regenerationswirkungen des Plans werden ausgewertet.
3. Nur bei einer messbaren Unterdeckung startet ein zweiter Planungslauf mit
   expliziter Ressourcenpriorität.
4. Der alternative Plan wird nur übernommen, wenn er weniger bestätigte harte
   Konflikte oder bei gleicher Konfliktzahl ein geringeres belegtes Risiko
   besitzt.
5. Ist der Plan nicht besser, wird deterministisch der ursprüngliche Plan
   wiederhergestellt.
6. Erst danach darf Schritt 30 automatisch erzeugte Supportkombinationen
   anpassen.

## Fachliche Grenzen

Die Ressourcenpriorität erhöht ausschließlich für die Zielauswahl den
Profilbedarf an Mana, Geist, Regeneration und Kostenreduktion. Sie verändert
nicht künstlich das abschließende BuildProfile. Unbekannte Kosten,
Aktionsfrequenzen oder bedingte Ressourcenquellen werden weiterhin nicht
erfunden.

Manuell gewählte Supports bleiben geschützt. Bei einem bestätigten Konflikt
erhält der Nutzer weiterhin eine Warnung.

## Technische Eigenschaften

- kein neuer Passivplaner
- keine zweite Build-Engine
- unveränderter offizieller Passivbaum
- unveränderte Datenpins
- kein Runtime-Netzwerk
- deterministischer Vergleich des normalen und des ressourcenorientierten
  Plans

## Nächster Schritt

Schritt 32 sollte die Ressourcenbilanz als nachvollziehbare Zahlenübersicht
je Fertigkeit und Waffenset sichtbar machen: Kosten pro Nutzung,
Bedarf pro Sekunde, bestätigter Mana-/Geistbestand und verbleibende Lücke.
