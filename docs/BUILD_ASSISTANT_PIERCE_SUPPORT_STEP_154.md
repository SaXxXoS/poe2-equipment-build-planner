# Build-Assistent – Durchbohrungs-Unterstützungen (Schritt 154)

## Ziel

Schritt 154 ergänzt das Projektilmodell um die lokal gepinnten
Durchbohrungswirkungen von Unterstützungen. Chance, garantierte
Durchbohrungsanzahl und Schaden nach einer Durchbohrung bleiben getrennte
Größen.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Quelldatei: `src/Data/Skills/sup_dex.lua`
- Chance: `base_chance_to_pierce_%`
- Schaden nach Durchbohren:
  `support_pierce_projectile_damage_+%_final_if_pierced_enemy`

Strukturiert verarbeitet werden `Pierce I`, `Pierce II` und die belegte
Durchbohrungschance von `Projectile Acceleration II`.

## Fachliches Modell

- Die Chance wird addiert und bei 100 Prozent begrenzt.
- `Pierce I` besitzt nach einem erfolgreichen Durchbohren 20 Prozent weniger
  finalen Projektilschaden gegen das nachfolgende Ziel.
- Dieser Faktor verändert weder den ersten Treffer noch den Boss-Treffer.
- Eine Chance allein erzeugt ohne Zielanzahl und Gegnerdichte keine feste
  Zahl zusätzlicher Kontakte und keinen DPS-Multiplikator.
- Eine strukturierte garantierte Durchbohrungsanzahl bleibt im
  Projektilmodell weiterhin als eigene Mechanik erhalten.
- Die Fertigkeit muss `Projectile` besitzen; `ProjectileNoCollision` wird
  blockiert.
- Mehrere Stufen derselben Supportfamilie werden fail-closed blockiert.

## Grenzen

Die App berechnet aus Durchbohren keine erfundene Einzelziel-Mehrfachtreffer-
oder Mapping-DPS-Zahl. Gegnerposition, Zielanzahl, Dichte und tatsächliche
Flugbahn sind im Eingabeprofil nicht vollständig belegt. Projektiltempo aus
`Projectile Acceleration II` wird in diesem Schritt nicht als Treffer- oder
DPS-Multiplikator verwendet.

## Ergebnis

- Schadensrechner: `3.68.0`
- Durchbohrungsmodell: `1.0.0`
- Projektiltreffermodell: `1.3.0`
- Produktpins unverändert
- keine Runtime-Netzwerkabhängigkeit
- deterministische, referenzgetestete Ausgabe
