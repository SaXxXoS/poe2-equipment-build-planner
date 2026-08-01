# Build-Assistent – Blitz-Exposition, Schritt 133

## Ziel

Schritt 133 verbindet die erste vollständig lokal belegbare Expositionskette mit der Schadensberechnung. Die Wirkung entsteht nur aus einer ausgewählten Unterstützung an derselben Fertigkeit und nur bei einem zuverlässig aufrechterhaltbaren Schock.

## Gepinnte Evidenz

Maßgeblich ist `PathOfBuildingCommunity/PathOfBuilding-PoE2` bei Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

- `Lightning Exposure`, Quellrecord `SupportLightningExposurePlayer`, besitzt den strukturierten Wert `inflict_exposure_for_x_ms_on_shock = 8000`.
- Die gepinnte PoB2-Berechnung verwendet für Exposition den generischen Grundwert 20 %.
- `Potent Exposure`, Quellrecord `SupportPotentExposurePlayer`, besitzt `exposure_effect_+% = 20`.
- Daraus folgen deterministisch 20 % Blitz-Exposition beziehungsweise 24 % mit `Potent Exposure`.
- Mehrere Expositionen desselben Elements addieren sich nicht; pro Element zählt die stärkste.
- Fluch und Exposition sind getrennte Widerstandsmodifikatorgruppen und werden addiert.

## Umsetzung

- Die Supportauswahl bleibt an die konkrete Fertigkeitskarte gebunden.
- Nur ein für dieselbe Fertigkeit belegter und aufrechterhaltbarer Schock aktiviert `Lightning Exposure`.
- Wirkzeit, Anwendungsrate, Uptime, Effektgruppe und Quellenreferenz werden im angewendeten Gegnerstatus ausgegeben.
- Die Zielrarität reduziert weiterhin nur die Fluchwirkung. Exposition wird dadurch nicht fälschlich halbiert.
- Widerstandsreduktionen werden zuerst je Regelgruppe maximiert und anschließend gruppenübergreifend addiert.
- Beispiel gegen ein einzigartiges Ziel: 59 % Elementarschwäche werden zu 29,5 % wirksamer Fluchwirkung; zusätzlich wirken 20 % Blitz-Exposition, insgesamt also 49,5 %.

## Fail-closed

Keinen produktiven Bonus erzeugen:

- ausgewählte Blitz-Exposition ohne belegten Schock,
- ein Schock, dessen Anwendungsrate die Wirkzeit nicht zuverlässig erneuert,
- Exposition an einer anderen Fertigkeitskarte,
- bloße Textähnlichkeit,
- angenommene Exposition ohne ausgewählte Support-ID,
- Kälte- oder Feuer-Exposition ohne die jeweils vollständig belegte Zustandskette.

## Versionen

- Schadensrechner `3.47.0`
- Expositionsmodell `1.0.0`
- Schockmodell `1.4.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

Fokussiert wurden Grundexposition, `Potent Exposure`, fehlende stabile Schockanwendung sowie die korrekte Addition von Fluch und Exposition gegen ein einzigartiges Ziel geprüft: 1 Datei mit 27 Tests. Die serielle Gesamtsuite bestand aus 140 Dateien mit 1.733 Tests. Typecheck, Lint, Produktions-Build, Pages-Build und JSON-Validierung waren erfolgreich.

## Nächster Schritt

Die nächsten Kandidaten sind Feuer- und Kälte-Exposition. Sie werden erst produktiv verbunden, wenn Entzünden beziehungsweise die für Kälte-Exposition nötige kritische Kältetrefferkette mit derselben strikten Quellen- und Uptimebindung vorliegt.
