# Vollständigerer PoE2-Skill-/Supportkatalog

## Ziel

Die Produktoberfläche enthielt lediglich zwölf kuratierte Skills und dreizehn
Supports. Die Auswahl verwendet nun zusätzlich den lokal vorhandenen und
gepinnten RePoE-PoE2-Export. Die bestehende Build-Assistant-Architektur bleibt
erhalten.

## Quelle und Pin

- Quelle: `repoe-poe2`
- Exportversion: `4.5.4.4.4`
- Exportcommit: `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`
- Quelldatei: `data/skill_gems.json`
- SHA-256: `2c5a481f1147a87c844b1734a8fd2c660e4e13922145470ac72bca75095a69e3`
- Produktdatei: `generated/poe2-gems/catalog.json`

Die vollständige Rohdatei bleibt im gitignorierten Auditbereich. Es gibt
keinen Laufzeitabruf.

## Filter und Coverage

Aufgenommen werden nur veröffentlichte Records mit positivem ganzzahligem
`crafting_level`, Gem-Typ `active`, `spirit` oder `support` und einem
sichtbaren Namen ungleich `Coming Soon`.

- 219 aktive Skill Gems
- 16 Spirit Gems
- 235 auswählbare Skills insgesamt
- 451 auswählbare Supportstufen

Nach namensbasierter Deduplizierung mit den kuratierten Kandidaten umfasst
die sichtbare Produktoberfläche 241 Fertigkeiten und 463 Unterstützungen.

Die erwarteten 240/200 werden nicht künstlich erzwungen. Der Pin belegt fünf
weniger auswählbare Skills. Seit der Supportüberarbeitung besitzen zahlreiche
Supports getrennte Stufen; deshalb enthält der Export mehr Records als
Supportfamilien.

## Semantik und Analyzer

Nur exakt bekannte Quelltags werden auf das bestehende Mechanikmodell
abgebildet. Unbekannte Tags bleiben ungelöst. Namen erzeugen keine Mechanik.

Importierte Supports sind `selectionOnly` und `experimental`. Ein positives
Ranking benötigt eine ausdrückliche `recommended_supports`-Referenz des
gewählten gepinnten Skillrecords. Ohne diese Evidenz bleibt der Support
auswählbar, wird aber durch `insufficient-semantic-evidence` blockiert.

Kuratierte deutsche Einträge bleiben vorrangig. Andernfalls erscheint der
englische Quellname als Fallback.

Nicht importiert werden Icons, Medien, Tutorialvideos, Beschreibungen,
numerische Effekttabellen, technische Stat-IDs oder Rohdaten.

Die Projektentscheidung ist keine externe Lizenzfreigabe und keine
Rechtsberatung. Die bekannte Rechteunsicherheit bleibt dokumentiert.

## Aktualisierung

```bash
npm run generate:poe2-gem-catalog
```

Jeder Wechsel von Version, Commit oder Hash benötigt eine erneute Prüfung.
