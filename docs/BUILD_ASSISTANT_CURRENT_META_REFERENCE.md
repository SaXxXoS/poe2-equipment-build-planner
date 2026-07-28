# Aktuelle Meta-Referenz des Build-Assistenten

## Ziel

Der Build-Assistent verwendet ab diesem Stand einen versionierten
poe.ninja-Snapshot als zusätzliche Vergleichsreferenz. Er ersetzt keine
Spielregel, keine technische Gemmenkompatibilität und keine Berechnung.

## Snapshot

- Quelle: `poe.ninja`
- Liga: `Runes of Aldur`
- Patchfamilie: `0.5.x`
- Stichtag: `2026-07-28`
- Gesamtpopulation: `124306` Charaktere
- erfasste produktive Aszendenzen: `23`
- konkrete DPS-sortierte Profilreferenzen: `460` (`20` je Aszendenz)

Die Referenz wurde je Aszendenz getrennt erhoben. Berücksichtigt werden die
drei häufigsten Einträge der poe.ninja-Gruppe `MAIN SKILLS` und die zwei
häufigsten technisch auflösbaren Waffenkategorien. Die zugrunde liegenden
Aszendenzpopulationen reichen von 295 bis 31862 Charakteren.

Zusätzlich enthält
`docs/audits/poe2-current-meta-reference-profiles.json` je Aszendenz die
ersten 20 DPS-sortierten Charakterprofile. Diese 460 Links sind korrelierte
Ausgangspunkte für die nachfolgende Paketprüfung, aber noch keine direkten
Ranking-Eingaben.

## Verwendungsregel

Die Meta-Referenz ist ausschließlich ein begrenzter Tie-Breaker, nachdem ein
Kandidat bereits alle folgenden Prüfungen bestanden hat:

1. produktiv vorhandene Fertigkeit,
2. zulässige Hauptskillrolle,
3. Klasse und Aszendenz,
4. harte Waffenkompatibilität,
5. harte Supportkompatibilität,
6. vorhandene Ausrüstung mit Equipment-first-Vorrang,
7. Ressourcenblocker.

Ein häufiger Skill erhält höchstens einen begrenzten Zusatzwert. Eine häufige
Waffenkategorie liefert nur einen kleineren Zusatzwert. Unbekannte
Waffenkonfigurationen von poe.ninja erzeugen keinen Bonus.

## Wichtige Einschränkung

`MAIN SKILLS` ist eine poe.ninja-Statistik und keine bestätigte
Hauptschadensklassifizierung. Darin können Heralds, Flüche, Meta-Skills und
Setup-Skills auftauchen. Die App wendet die Statistik deshalb niemals direkt
auf beliebige Skills an. Nur lokal bereits als Hauptskill zugelassene
Kandidaten können davon profitieren.

Die aggregierte Häufigkeit eines Skills und einer Waffe beweist außerdem
nicht, dass beide im selben Charakter zusammen verwendet wurden. Deshalb ist
die Referenz kein harter Kombinationsbeleg und darf keine Kompatibilitätsregel
erzeugen.

## Referenzschwerpunkte

| Aszendenz | Population | häufigste beobachtete Einträge | häufigste Waffenkategorien |
| --- | ---: | --- | --- |
| Infernalist | 4362 | Comet, Spark, Living Bomb | Wand, Staff |
| Blood Mage | 4002 | Spark, Comet, Sigil of Power | Wand, Staff |
| Lich | 901 | Despair, Contagion, Essence Drain | Wand, Sceptre |
| Abyssal Lich | 1690 | Entangle, Thunderstorm, Thrashing Vines | Staff, Spear |
| Deadeye | 11972 | Herald of Ice, Ice Shot, Tornado Shot | Bow, Spear |
| Pathfinder | 3045 | Ice Shot, Tornado Shot, Herald of Ice | Bow, Talisman |
| Titan | 4521 | Infernal Cry, Mace Strike, Earthshatter | Quarterstaff, Mace |
| Warbringer | 403 | Ancestral Spirits, Cluster Grenade, Voltaic Grenade | Crossbow, Mace |
| Smith of Kitava | 919 | Infernal Cry, Shield Wall, Fortifying Cry | Mace, Shield |
| Stormweaver | 5467 | Spark, Frost Bomb, Comet | Sceptre, Staff |
| Chronomancer | 1720 | Comet, Frost Bomb, Frost Wall | Staff, Wand |
| Disciple of Varashta | 5288 | Kelari, Kelari's Brutality, Kelari's Deception | Sceptre, Staff |
| Amazon | 1017 | Herald of Thunder, Herald of Ice, Whirling Slash | Spear, Bow |
| Spirit Walker | 13078 | Wild Protector, Vivid Stampede, Twister | Spear, Sceptre |
| Ritualist | 1789 | Barrage, Herald of Ice, Spark | Bow, Sceptre |
| Tactician | 2268 | Galvanic Shards, Stormblast Bolts, Crossbow Shot | Crossbow, Mace |
| Witchhunter | 2134 | Explosive Grenade, Cluster Grenade, Explosive Shot | Crossbow, Spear |
| Gemling Legionnaire | 18055 | Herald of Thunder, Herald of Ice, Whirling Slash | Spear, Crossbow |
| Martial Artist | 31862 | Hollow Focus, Rend, Hollow Form | Quarterstaff, Spear |
| Invoker | 295 | Charged Staff, Herald of Thunder, Herald of Ice | Quarterstaff, Wand |
| Acolyte of Chayula | 1459 | Archon of Chayula, Despair, Molten Shower | Mace, Quarterstaff |
| Oracle | 5500 | Entangle, Spark, Comet | Wand, Sceptre |
| Shaman | 2531 | Spark, Comet, Walking Calamity | Talisman, Staff |

## Ergebnis

Leere Builds wählen nicht mehr allein anhand grober Klassen-Tags zwischen
ansonsten ähnlichen Kandidaten. Die aktuelle Aszendenz-Meta liefert eine
zusätzliche, nachvollziehbare Präferenz. Vorhandene Ausrüstung und harte
Spielregeln bleiben vorrangig.

## Noch offen

Der korrelierte Ausgangsdatensatz enthält bereits 20 Profile je Aszendenz.
Als nächstes müssen diese Profile als vollständige Pakete geprüft werden:
Hauptskill, Setup-Skills, Supports, beide Waffensets, Keystones,
Aszendenzknoten, Ausrüstung und Ressourcen. Erst diese inhaltliche Prüfung
darf konkrete Meta-Pakete validieren. Reine Aggregatwerte und bloße
DPS-Sortierung dürfen das ausdrücklich nicht.
