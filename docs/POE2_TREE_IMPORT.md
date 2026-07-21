# Offizieller PoE2-Passivbaumimport

## Ergänzung 5D.3

Der getrennte, eng freigegebene Assetimport ist in `POE2_TREE_ASSETS.md` dokumentiert. Die frühere Aussage „keine Assets“ gilt für den Strukturimport 5C; der Baum verwendet nun ausschließlich lokal importierte Atlanten aus demselben gepinnten Export.

Stand: 20. Juli 2026. Diese Dokumentation beschreibt ausschließlich den kontrollierten Import des offiziellen Passivbaums; der Quellcode und das eingecheckte Manifest sind maßgeblich.

## Quelle und Freigabe

Primärquelle ist ausschließlich das offizielle GGG-Repository <https://github.com/grindinggear/poe2-skilltree-export>. Die GGG-Datendokumentation befindet sich unter <https://www.pathofexile.com/developer/docs/data>. Aufgabe 5B wurde korrigiert: Die Quelle ist für die fest gepinnte `data.json` und die Kategorien `passive-nodes`, `passive-connections`, `passive-groups`, `class-start-nodes`, `ascendancy-start-nodes` und `jewel-sockets` bedingt freigegeben. Diese Entscheidung ist keine allgemeine Freigabe anderer GGG-Daten oder Dateien.

Verwendet wird Release `0.5.2` („Path of Exile 2: Runes of Aldur“), Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6`. `data.json` hat SHA-256 `f83c94ce7b09f2bfc5b3b1d63523c2ab3d2582d0e964f6aeec34b8b0390abcfe` und 5.141.380 Bytes. Die Bindung steht in `data-sources/poe2-tree/source-manifest.json`; ein Import von `main`, `latest` oder einer unbekannten Version bricht ab.

## Tatsächliches Rohschema

Root-Felder: `tree`, `classes`, `groups`, `nodes`, `edges`, `skillOverrides`, `jewelSlots`, `min_x`, `min_y`, `max_x`, `max_y`. `nodes` und `groups` sind ID-Objekte, `edges` ist eine Liste von `from`/`to`, `classes` enthält englische Klassen- und Aszendenznamen. Knoten enthalten je nach Typ Name, Stats, Gruppe, Orbit, Koordinaten, Ein-/Ausgänge, Startindex, Aszendenz-ID und boolesche Typmerkmale. Gruppen enthalten Position, Orbits und Node-IDs.

Grafikfelder wie `icon`, `activeEffectImage`, Klassen-/Aszendenz-`image` und Bildpositionen werden bewusst ignoriert. `skillOverrides`, Rezepte, Flavourtexte, interne Grafik-/Radiusreferenzen und nicht für die reine Struktur erforderliche Felder werden nicht in App-Daten übernommen. Alle bekannten, nicht übernommenen Felder sind im Importer explizit auditiert. Neue unbekannte Felder werden gemeldet, nicht interpretiert.

Der Export enthält 31 `jewelSlots`-Referenzen, aber nur 19 Zielknoten mit dem eindeutigen Merkmal `isJewelSocket`; nur diese 19 werden importiert. Zwölf mehrdeutige Referenzen werden gemeldet und ignoriert. Ein eindeutiges Cluster-Sockelfeld (`expansionJewel` oder gleichwertig) ist in Release 0.5.2 nicht vorhanden, daher werden keine Cluster-Sockel erfunden. Eine offiziell enthaltene Selbstkante wird gemeldet und ausgelassen. 22 offiziell isolierte Knoten werden erhalten und als Warnung dokumentiert.

## Normalisierung und Validierung

Die getrennte Pipeline in `scripts/poe2-tree-import.mjs` erzeugt:

- stabile Node-IDs, englische Quellnamen/-Stats, Typ, Position, Gruppe, Orbit, Nachbarn, Start-/Aszendenz- und Sockelmerkmale;
- ungerichtete, kanonisch sortierte Verbindungen;
- Gruppen mit Position, Orbits und sortierten Node-IDs;
- explizite Juwelsockel;
- Quellreferenzen und vollständige Versionsmetadaten.

Validiert werden Approval, Release/Commit/Hash, Roottypen, technische IDs, Node-/Gruppen-/Kantenreferenzen, Koordinaten, doppelte Kanten, Selbstkanten, Sockelmarkierungen und deterministische Sortierung. Bei Fehlern werden keine produktiven Dateien ersetzt. Die Rohdatei wird nie direkt von React oder der Engine importiert.

## Sprache

Namen und Stats in `data.json` sind Englisch. Es gibt keine Locale-Felder, keine weiteren Sprachen und im Repository keine dokumentierte getrennte deutsche Exportdatei. Texte werden unverändert mit `sourceLocale: "en"` gespeichert. Die vorbereitete Lokalisierungsgrenze enthält `sourceText`, `sourceLocale`, optionales `localizedText`, `localizedLocale`, `localizationSource` und `localizationStatus`. Ohne verifizierte Übersetzung ist der Status `pending`, bei fehlendem Quelltext `unavailable`. Späterer Fallback: verifiziertes Deutsch, offizielles Englisch, technische ID. In Aufgabe 5C findet keine Übersetzung statt.

## Befehle und Ausgaben

```bash
npm run import:poe2-tree -- --release 0.5.2
npm run check:poe2-tree-update -- --release 0.5.2
```

Der erste Befehl liest ausschließlich die lokale gepinnte Rohdatei und aktualisiert `generated/poe2-tree/tree.json`, `import-report.json` und `version-diff.json`. Der Prüfmodus validiert und zeigt Bericht/Diff auf stdout, ersetzt aber keine Dateien. Beide Befehle sind offline, verlangen eine explizite bekannte Version und prüfen das Approval-Gate.

Release 0.5.2 erzeugt 5.150 Knoten, 6.067 Verbindungen, 1.621 Gruppen, 6 Klassenstartknoten, 36 Aszendenzstartknoten, 19 Juwelsockel und 0 Cluster-Sockel. Es gibt 13 kontrolliert übersprungene Einträge, drei Warnungen, null Fehler und null unbekannte Felder.

## Grenzen

Es werden keine Assets kopiert oder hotgelinkt, keine Sprite-Verarbeitung und keine Laufzeit-URLs erzeugt. PoE2DB und RePoE werden nicht verwendet. Es gibt keine UI-/Engine-Anbindung, Pfadsuche, Baumoptimierung oder fachliche Änderung des Passive Analyzers.
