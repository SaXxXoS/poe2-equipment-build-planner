# Build-Assistent – Munitionsersparnis (Schritt 153)

## Ziel

Schritt 153 erweitert das strukturierte Armbrustmunitionsmodell um
`Munitionsersparnis I–III`. Die App bildet die Chance, beim Angriff keine
Munition zu verbrauchen, als erwartete Schusszahl einer Ladung ab.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Quelldatei: `src/Data/Skills/sup_dex.lua`
- Grundladung: `base_number_of_crossbow_bolts`
- Nichtverbrauch: `crossbow_attack_%_chance_to_not_consume_ammo`
- Nachladen Stufe III: `support_ammo_conservation_crossbow_reload_speed_+%_final`

## Berechnung

Bei `N` geladenen Bolzen und einer Nichtverbrauchschance `p` gilt für die
erwartete Zahl abgegebener Schüsse bis zum Verbrauch der Ladung:

`erwartete Schüsse = N / (1 - p)`

Damit ergeben sich ohne Doppellauf:

- Stufe I, 20 %: `N / 0,8`
- Stufe II, 25 %: `N / 0,75`
- Stufe III, 30 %: `N / 0,7`, zusätzlich 20 % weniger finale
  Nachladegeschwindigkeit

`Doppellauf` und `Munitionsersparnis` dürfen gemeinsam wirken. Mehrere Stufen
derselben Familie werden fail-closed blockiert.

## Bewusste Grenze

Der Pin enthält für diese geschlossene Kette keine absolute Nachladezeit.
Deshalb weist die App Ladungsgröße, Nichtverbrauchschance, erwartete Schüsse
und den relativen Nachladefaktor getrennt aus. Der nachhaltige
Schadensmultiplikator bleibt `1`; ein Dauer-DPS-Bonus wird nicht erfunden.

## Ergebnis

- Schadensrechner: `3.67.0`
- Armbrustmunitionsmodell: `2.0.0`
- Produktpins unverändert
- keine Runtime-Netzwerkabhängigkeit
- deterministische, referenzgetestete Ausgabe

