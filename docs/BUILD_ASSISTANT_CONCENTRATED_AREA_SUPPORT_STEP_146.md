# Schritt 146 – Konzentrierte Wirkung und Flächenschaden

## Ziel

`Concentrated Area` (deutsche Anzeige: `Konzentrierte Wirkung`) besitzt zwei zusammengehörige finale Effekte. Schritt 146 bildet den Schadensbonus und die verringerte Wirkungsfläche als eine geschlossene, getrennt sichtbare Supportkette ab.

## Quelle und Pin

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Produktreferenz: `generated/pob2/damage-reference.json`
- Quellrecord: `SupportConcentratedAreaPlayer`
- Quelldatei: `src/Data/Skills/sup_int.lua`
- `support_area_concentrate_area_damage_+%_final = 30`
- `support_concentrated_effect_skill_area_of_effect_+%_final = -50`

Die deutsche Anzeige ist nicht die technische Rechengrundlage.

## Rechenregel

Nur eine Fertigkeit mit strukturiertem PoB2-Typ `Area` darf den Support nutzen. Dann gilt:

- Trefferkomponenten der Fertigkeit werden mit `1,30` multipliziert.
- Nativer, eigenständiger Flächenschaden über Zeit wird ebenfalls mit `1,30` multipliziert.
- Die finale Wirkungsfläche wird separat mit `0,50` ausgewiesen.
- Der Flächenfaktor ist kein zusätzlicher Schadensmultiplikator.
- Der Bonus wird vor späteren zeitlichen Zustandsfenstern konsistent auf die Schadenskomponenten angewandt.

## Fail-closed-Grenzen

- Fertigkeiten ohne strukturierten `Area`-Typ erhalten keinen Effekt.
- Mehrere Stufen derselben Supportfamilie blockieren die gesamte Familienwirkung.
- Unvollständig strukturierte Supports werden nicht aus Name oder Beschreibung geschätzt.
- Zielabdeckung, Gegnerzahl und Überlappung werden nicht aus der Wirkungsfläche als DPS erfunden.

## Sichtbare Ausgabe

Die Ergebnisansicht zeigt den finalen Flächenschadenswert und den getrennten Wirkungsflächenfaktor. Bei Inkompatibilität oder Duplikaten zeigt sie den blockierten Grund.

## Stand

Der Schadensrechner verwendet Version `3.60.0`, das Flächensupportmodell `1.0.0` und das native DoT-Modell `3.2.0`. Dieser Schritt schließt eine konkrete Rechenlücke, belegt aber weiterhin keine vollständige Gleichwertigkeit mit Path of Building 2.
