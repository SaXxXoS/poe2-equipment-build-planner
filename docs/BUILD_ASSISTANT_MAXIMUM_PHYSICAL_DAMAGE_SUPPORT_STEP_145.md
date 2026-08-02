# Schritt 145 – Muskelkraft und maximaler physischer Schaden

## Ziel

Der Support `Heft` (deutsche Anzeige: `Muskelkraft`) besitzt keinen gewöhnlichen Mehr-Schaden-Effekt. Der gepinnte PoB2-Stat erhöht ausschließlich den maximalen physischen Schaden. Schritt 145 bildet diese asymmetrische Schadensspanne erstmals explizit ab.

## Quelle und Pin

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Produktreferenz: `generated/pob2/damage-reference.json`
- Quellrecord: `SupportHeftPlayer`
- Quellstat: `support_heft_maximum_physical_damage_+%_final = 30`
- Quelldatei: `src/Data/Skills/sup_str.lua`

Die deutsche Anzeige `Muskelkraft` stammt aus der bereits freigegebenen lokalen Gemmenanzeigeschicht. Sie ist nicht die technische Rechengrundlage.

## Rechenregel

Für einen kompatiblen Angriff mit physischer Ausgangsspanne `Minimum–Maximum` gilt:

- Minimum bleibt unverändert.
- Maximum wird mit `1,30` multipliziert.
- Feuer-, Kälte-, Blitz- und Chaosschaden bleiben unverändert.

Die Wirkung erfolgt vor Schadensumwandlungen und „Schaden als zusätzlichen Schaden erhalten“. Dadurch erben umgewandelte Anteile den veränderten physischen Ausgangswert, ohne den Effekt nachträglich auf fremde Schadensarten anzuwenden.

## Fail-closed-Grenzen

- Zauber werden blockiert.
- Ohne belegte physische Ausgangskomponente entsteht kein Bonus.
- Mehrere Stufen derselben Supportfamilie werden vollständig blockiert.
- Der Wert wird nicht aus Name, sichtbarem Text oder deutscher Übersetzung geschätzt.
- Der Support ist kein symmetrischer 30-%-Mehr-Schaden-Multiplikator.

## Sichtbare Ausgabe

Die Ergebnisansicht nennt den angewandten Prozentwert und erklärt ausdrücklich, dass nur der maximale physische Schaden steigt. Bei inkompatibler Fertigkeit oder fehlender physischer Komponente wird der blockierte Grund angezeigt.

## Stand

Der Schadensrechner verwendet Version `3.59.0`; das Modell für maximalen physischen Supportschaden verwendet `1.0.0`. Dieses Modell schließt eine konkrete lokale Rechenlücke, belegt aber weiterhin keine vollständige Gleichwertigkeit mit Path of Building 2.
