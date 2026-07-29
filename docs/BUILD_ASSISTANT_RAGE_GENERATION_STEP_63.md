# Schritt 63 – Raserei-Erzeugung durch Unterstützungen

## Ergebnis

Das Ressourcenmodell verbindet ausgewählte Unterstützungen nun über ihren
englischen gepinnten Datensatz mit exakter Raserei-Erzeugung pro Treffer.

Beispiel: **Rage III** gewährt strukturiert exakt 5 Raserei pro Nahkampftreffer.
Die Anzeige trennt:

- Raserei-Verbrauch pro Sekunde
- Raserei-Erzeugung pro Treffer
- Raserei-Erzeugung pro Sekunde
- Netto-Bedarf pro Sekunde

## Fail-closed-Grenze

Ohne belegte Trefferfrequenz wird aus „5 pro Treffer“ kein erfundener
Sekundenwert. Insbesondere hängt die Frequenz eines Angriffs von der
tatsächlichen Waffe und weiteren Wirkungen ab. Der Status benennt deshalb die
fehlende Trefferfrequenz und den noch nicht vollständig verbundenen
Rasereivorrat.

## Prüfung

- Ressourcenmodell: Version 12.0.0
- fokussierte Tests: 31 erfolgreich
- Typecheck erfolgreich
- Datenpins und Offline-Grenzen unverändert
