# Aktuelle Meta-Referenz des Build-Assistenten

## Ziel

Der Build-Assistent verwendet ab diesem Stand einen versionierten
poe.ninja-Snapshot als zusätzliche Vergleichsreferenz. Er ersetzt keine
Spielregel, keine technische Gemmenkompatibilität und keine Berechnung.

## Snapshot

- Quelle: `poe.ninja`
- Liga: `Runes of Aldur`
- Patchfamilie: `0.5.x`
- Stichtag der aggregierten Übersichtsanteile: `2026-07-28`
- aktiver korrelierter Paketindex: `1959-20260808-19780` vom `2026-08-08`;
  der darin gespeicherte Profilreferenz-Stichtag bleibt getrennt `2026-07-28`
- aktueller, noch nicht promovierter Profilkandidat: `0424-20260809-55677` vom `2026-08-09`
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

## Korrelierte Paketprüfung

Die öffentliche Profilansicht verwendet für den kontrollierten Abruf den
exakten Snapshot `1924-20260728-10654` (`runes-of-aldur`,
`PassiveTree-0.5`). Der lokale Generator
`scripts/poe2-meta-build-packages/generate.mjs` reduziert jedes erreichbare
Profil auf:

- Aszendenz,
- höchste modellierte Schadensfertigkeit,
- Supports derselben Gemmengruppe,
- weitere aktive Fertigkeiten derselben Gemmengruppe,
- strukturiert erkennbare Waffenkategorien,
- zusammengefasste normale, Aszendenz- und Waffenset-Punktzahlen.

Nicht gespeichert werden Kontonamen, Charakternamen, vollständige Items,
vollständige Passivbäume oder Path-of-Building-Exporte.

Der erste kontrollierte Lauf konnte `53` von `460` Profilen vollständig
validieren. `407` Profile bleiben wegen der öffentlichen API-Schutzgrenze
beziehungsweise unvollständiger Korrelation blockiert. Damit ist die
Paketabdeckung derzeit **partiell** und nicht für jede Aszendenz verfügbar.
Nicht validierte Profile werden ausdrücklich nicht geschätzt oder durch
andere Profile ersetzt.

Aus den `53` validierten Profilen entstanden zunächst `15` mehrfach
beobachtete Rohpakete. Die profilweite Waffenliste beweist jedoch nicht,
welche Waffe die höchste Schadensfertigkeit tatsächlich verwendet. Nach der
zusätzlichen lokalen Gem-Waffenprüfung bleiben deshalb `6` produktive Pakete;
`9` unbewiesene oder inkompatible Paare sind Audit-only blockiert. Ein Paket
wird nur ab zwei Profilen und mit exakt passender gepinnter
Gem-Waffenanforderung als produktive sekundäre Evidenz verwendet. Maßgeblich
sind:

- `docs/audits/poe2-current-meta-build-profile-validation.json`
- `docs/audits/poe2-meta-skill-weapon-package-coverage.json`
- `generated/meta/poe2-build-packages.json`

Der Generator ist inkrementell und gedrosselt. Folgeläufe desselben
Snapshots verwenden bereits validierte reduzierte Beobachtungen wieder und
prüfen nur noch offene Profile.

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
Waffenkategorie liefert nur einen kleineren Zusatzwert. Ein zusätzlicher,
ebenfalls begrenzter Paketwert entsteht nur, wenn Fertigkeit und Waffe in
mindestens zwei Profilen derselben Aszendenz vorkommen **und** der gepinnte
lokale Gemdatensatz genau diese Waffenart fordert. Unbeschränkte Skills,
unbekannte Waffenkonfigurationen, profilweite Zweitwaffen und Einzelprofile
erzeugen keinen Paketbonus.

## Wichtige Einschränkung

`MAIN SKILLS` ist eine poe.ninja-Statistik und keine bestätigte
Hauptschadensklassifizierung. Darin können Heralds, Flüche, Meta-Skills und
Setup-Skills auftauchen. Die App wendet die Statistik deshalb niemals direkt
auf beliebige Skills an. Nur lokal bereits als Hauptskill zugelassene
Kandidaten können davon profitieren.

Die aggregierte Häufigkeit eines Skills und einer Waffe beweist außerdem
nicht, dass beide im selben Charakter zusammen verwendet wurden. Deshalb
bleibt der Aggregatanteil schwach. Der Paketanteil besitzt eine
Profilkorrelation, aber keine strukturierte Waffensetzuordnung. Er bleibt
sekundäre Evidenz und darf keine harte Kompatibilitätsregel erzeugen.

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

Die offene Rate-Limit-Stichprobe muss in gedrosselten Folgeläufen auf die
restlichen Aszendenzen erweitert werden. Zusätzlich sind die folgenden
Punkte noch nicht als Produktregeln freigegeben:

- poe.ninja-DPS als exakter oder garantierter Schaden,
- einzelne Passive- und Aszendenzknoten,
- bloße Skill-Koexistenz als kausale Rotation,
- vollständige Ausrüstungskopien,
- Profile mit nur einer Beobachtung.

Der nächste Lauf darf die Coverage erweitern, aber weiterhin keine
Kompatibilität, Rotation oder DPS-Wahrheit aus Popularität ableiten.

## Fortsetzung – Schritt 174 (8. August 2026)

Die produktive Meta-Referenz verwendet nun den Quellenindex
`1959-20260808-19780`. Er wurde erst nach vollständiger Klassifikation der 460
gepinnten Profilreferenzen promoviert: 53 Profile sind valide korrelierte
Beobachtungen, 407 bleiben blockiert. Vor der zusätzlichen lokalen
Skill-/Waffenprüfung entstanden 15 Rohpakete. Der aktuelle gehärtete
Produktstand enthält davon 6 exakt kompatible Pakete; der vorherige Pin
`1924-20260728-10654` besaß vor dieser Härtung 10 Rohpakete.

Der Generator ist nun tatsächlich resumierbar: kleine Batches werden
deterministisch über alle Aszendenzen verteilt, frühere Erfolge bleiben
erhalten, Abrufe besitzen eine feste Zeitgrenze und noch nicht versuchte
Profile werden vor wiederholten Fehlern priorisiert. Ein neuer Snapshot ersetzt
den aktiven Produktpin erst bei mindestens gleicher validierter Profil- und
Paketabdeckung. Nach einer erfolgreichen Promotion entfernt der Generator
einen veralteten Kandidatenaudit und verwendet bei Folgeläufen den aktiven
Stand als einzige Fortschrittsquelle.

Die neue vollständige lokale Optimierermatrix belegt 23 von 23 ausgewählte und
vom gemeinsamen Paketvalidator akzeptierte Startpakete. Bei allen 23 erreicht
die geplante Waffenart nach der technischen Normalisierung denselben Analyzer.
19 Auswahlen schneiden einen der drei beobachteten Referenzskills, 22 eine der
zwei beobachteten Waffenarten. Diese Schnittmengen bleiben sekundäre
Plausibilitätsbelege und sind ausdrücklich keine DPS- oder Optimalitätsgarantie.

Details stehen in `docs/BUILD_ASSISTANT_META_MATRIX_STEP_174.md` und
`docs/audits/build-assistant-current-meta-matrix.json`.

## Fortsetzung – Skill-/Waffen-Härtung (9. August 2026)

Der aktuelle poe.ninja-Profilkandidat `0424-20260809-55677` enthält wieder 20
DPS-sortierte Referenzen je produktiver Aszendenz. Wegen der öffentlichen
Abrufbegrenzung sind erst 11 Profile reduziert validiert; 449 bleiben
blockiert. Mit der gehärteten Zuordnung entsteht daraus noch kein produktives
Paket. Der schwächere Kandidat ersetzt den aktiven Stand deshalb nicht.

Die Prüfung hat zugleich einen Fehler im früheren Paketmodell belegt: Alle
Waffen eines Charakters wurden mit dessen höchster Schadensfertigkeit
kombiniert. Dadurch entstanden beispielsweise die widersprüchlichen Pakete
`Ice Shot + Bogen` und `Ice Shot + Zauberstab` aus denselben Profilen. Das
Modell akzeptiert nun nur noch Skill-/Waffen-Paare, deren exakte Waffenart im
gepinnten lokalen Gemdatensatz bestätigt ist. Die aktive Produktdatei wurde
dadurch deterministisch von 15 auf 6 Pakete reduziert. Sämtliche 9 entfernten
Paare und ihre Gründe stehen in
`docs/audits/poe2-meta-skill-weapon-package-coverage.json`.

Die lokale Optimierermatrix bleibt nach der Bereinigung bei 23/23 kohärenten
Paketen. Das belegt interne Konsistenz, nicht weltweite Meta-Optimalität. Eine
echte Skill-zu-Waffenset-Korrelation darf erst produktiv werden, wenn die
Quelle dafür eine strukturierte Zuordnung liefert; die bloße profilweite
Waffenliste genügt ausdrücklich nicht.

## Verifikation der Härtung

- 36 fokussierte Runtime-/Integrations- und 20 neue Import-/Gate-Tests
  bestanden.
- Der Gesamtlauf bestätigte 1.929 Tests; zwei ausschließlich am festen
  Fünf-Sekunden-Limit abgebrochene Vollbaumdateien bestanden anschließend
  seriell mit 197/197 Tests.
- Typecheck, Lint, Produktions- und Pages-Build, 252 JSON-Dateien sowie
  `git diff --check` bestanden.
- Desktop und 390×844 laden die lokale Produktionsausgabe ohne horizontalen
  Überlauf oder neue Browserkonsolenmeldungen. Die neun Skillkarten sind bei
  390×844 einspaltig.
