# Build-Assistent – Gabelungs-Unterstützung (Schritt 155)

## Ziel

Schritt 155 ergänzt das Projektilmodell um die lokal gepinnte Wirkung von `Fork`. Gabelung, Schaden der Folgeprojektile und tatsächliche Zielkontakte bleiben getrennte Größen.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Quelldatei: `src/Data/Skills/sup_dex.lua`
- Stat: `support_fork_forked_projectile_damage_+%_final`
- benötigt: `Projectile`; ausgeschlossen: `ProjectileNoCollision`

`Fork` belegt 30 Prozent weniger finalen Schaden der bereits gegabelten Folgeprojektile. Der Faktor beträgt deshalb `0.7`.

## Fachliches Modell

- Gabelung wird nur für kompatible Projektilfertigkeiten aktiviert.
- Der Faktor `0.7` gilt erst für Folgeprojektile nach der Gabelung.
- Der erste Treffer und der Einzelziel-Treffermultiplikator bleiben `1`.
- Die Referenz enthält keine geschlossene numerische Zahl für Folgeprojektile, getroffene Gegner oder Wiederkontakte. Deshalb wird weder die Mapping-Kontaktzahl erhöht noch ein Boss-DPS-Bonus erfunden.
- Mehrere Einträge derselben Gemmenfamilie werden fail-closed blockiert.
- `Freezefork` bleibt getrennt, bis eine belegte Bedingung „gefrorener Gegner“ geschlossen modelliert ist.

## Ergebnis

- Schadensrechner: `3.69.0`
- Gabelungsmodell: `1.0.0`
- Projektiltreffermodell: `1.4.0`
- Produktpins unverändert; keine Runtime-Netzwerkabhängigkeit

## Grenzen

Das Modell schätzt keine Gegnerdichte, Flugbahn oder Mehrfachtreffer. Eine vollständige Path-of-Building-Gleichwertigkeit ist dadurch noch nicht belegt.
