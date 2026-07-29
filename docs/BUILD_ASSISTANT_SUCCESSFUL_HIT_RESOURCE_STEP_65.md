# Schritt 65 – Erfolgreiche Treffer in der Ressourcenbilanz

## Ergebnis

Die Schadens- und Ressourcenkette teilt sich für den gewählten Hauptangriff
jetzt dieselbe abschließend berechnete Aktionsfrequenz. Aus:

- Waffen-Aktionsfrequenz,
- globalen belegten Geschwindigkeitswirkungen,
- Supportmultiplikatoren,
- Cooldownbegrenzung,
- exakter PoB2-Trefferchance gegen das gewählte Vergleichsziel

entsteht die erwartete erfolgreiche Einzeltrefferfrequenz. Erst dieser Wert
wird mit einer strukturierten Wirkung wie `5 Raserei pro Nahkampftreffer`
verrechnet.

## Strikte Grenzen

- Ein Nahkampftreffer-Support wirkt nur auf eine Fertigkeit mit strukturiertem
  `Melee`-Typ.
- Mehrfachtreffer, zusätzliche Projektile, Flächenüberlappung, Fork, Rückkehr
  und mehrere Ziele erhöhen die Ressourcenentstehung noch nicht.
- Ohne exakte Trefferchance bleibt die Raserei-Erzeugung pro Sekunde
  unbekannt.
- Eine berechnete Erzeugung ersetzt noch keinen belegten maximalen
  Rasereivorrat.

## Prüfung

- Ressourcenmodell: Version 14.0.0
- 75 fokussierte Treffer-, Ressourcen- und Schadensreferenztests erfolgreich
- Typecheck erfolgreich
- Datenpins und Offline-Grenzen unverändert
