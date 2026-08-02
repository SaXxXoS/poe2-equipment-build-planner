# Build-Assistent – Abprall-Unterstützung (Schritt 156)

## Ziel

Schritt 156 ergänzt das Projektilmodell um die lokal gepinnte Wirkung von `Ricochet I` und `Ricochet II`. Die Chance auf eine zusätzliche Geländeverkettung wird getrennt von Zielverkettungen, tatsächlichen Kontakten und Schaden geführt.

## Gepinnte Grundlage

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Quelldatei: `src/Data/Skills/sup_dex.lua`
- Stat: `projectile_chance_to_chain_1_extra_time_from_terrain_%`
- `Ricochet I`: 40 Prozent
- `Ricochet II`: 50 Prozent
- benötigt: `Projectile`; ausgeschlossen: `CannotChain` und `CannotTerrainChain`

## Fachliches Modell

- Die Supportwirkung gilt nur für kompatible Projektilfertigkeiten.
- Bei erfolgreicher Prüfung kann das Projektil genau einmal zusätzlich vom Gelände verketten.
- Die strukturierte Chance wird mit 40 beziehungsweise 50 Prozent gespeichert und im Projektilmodell als eigene Mechanik ausgewiesen.
- Die gepinnte Referenz belegt nicht, wie häufig ein Projektil tatsächlich Gelände berührt oder danach ein Ziel trifft. Deshalb bleiben Mapping-Kontaktzahl, erster Treffer, Boss-Treffermultiplikator und DPS unverändert.
- Mehrere Stufen derselben Gemmenfamilie werden fail-closed blockiert.
- Zielverkettung, Gabelung und Geschossrückkehr werden nicht mit Geländeverkettung vermischt.

## Ergebnis

- Schadensrechner: `3.70.0`
- Abprallmodell: `1.0.0`
- Projektiltreffermodell: `1.5.0`
- Produktpins unverändert; keine Runtime-Netzwerkabhängigkeit

## Grenzen

Geschossrückkehr bleibt nicht produktiv modelliert: Im reduzierten lokal gepinnten Referenzbestand fehlt weiterhin eine geschlossene numerische Kette für Rückkehrweg, Wiederkontakt und zusätzlichen Treffer. Eine vollständige Path-of-Building-Gleichwertigkeit ist deshalb noch nicht belegt.
