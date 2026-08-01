# Schritt 107 – Sichtbare Charakterverteidigung

## Ergebnis

Das in Schritt 106 eingeführte bestätigte Charakter-Verteidigungsmodell ist nun Bestandteil der bestehenden Ergebnisansicht. Es gibt keine zweite Berechnung in der UI: dargestellt wird ausschließlich `damageEstimate.characterDefenceModel` aus der Engine.

Sichtbar sind je aktivem Waffenset:

- Rüstung,
- Ausweichwert,
- Energieschild,
- eingegebener Ausrüstungsgrundwert,
- sicher angewandte flache Passivwerte,
- sicher angewandte erhöhte oder verringerte Werte,
- sicher angewandte Mehr-/Weniger-Multiplikatoren.

Die Ansicht nennt außerdem ausgeschlossene Verteidigungswerte auf Waffen und blockierte bedingte Passivzeilen. Damit werden unzulässige oder nicht belegte Werte nicht stillschweigend als wirksam dargestellt.

## Grenzen

Das Ergebnis ist weiterhin ein bestätigtes Teilmodell. Nicht belegte Charakter-Grundwerte, globale Rundungsregeln und unbekannte Bedingungs-Uptime bleiben offen. Eine vollständige Gleichwertigkeit mit Path of Building 2 ist dadurch noch nicht erreicht.

## Prüfung

- 50 fokussierte Komponenten- und Engine-Tests erfolgreich
- Typecheck erfolgreich
- Lint erfolgreich
- Produktionsbuild erfolgreich

