# Saison- und Patchaktualisierung des PoE2-Passivbaums

Eine Aktualisierung ist bei einem neuen offiziellen GGG-Release oder einem relevanten Baum-Patch erforderlich. Sie erfolgt niemals automatisch produktiv und niemals ungepinnt von `main` oder `latest`.

## Kontrollierter Ablauf

1. Offizielle Releases unter <https://github.com/grindinggear/poe2-skilltree-export/releases> manuell prüfen.
2. Release-Tag über die offizielle GitHub-API auf einen vollständigen Commit auflösen und Saison-/Releasebezeichnung dokumentieren.
3. Ausschließlich `data.json` über eine auf den Voll-Commit gepinnte Raw-URL in einen neuen Ordner `data-sources/poe2-tree/raw/<tag>/` laden; keine Assets oder anderen Dateien abrufen.
4. SHA-256 berechnen und zusammen mit Quelle, Tag, Commit, Abrufzeit, Spielversion/Saison, Datei, Importer- und Schemaversion in `source-manifest.json` ergänzen.
5. Repository-Aufbau, Freigabeumfang und Schemaaudit erneut prüfen. Neue unbekannte Felder müssen dokumentiert und bewusst ignoriert oder durch eine Codeänderung validiert werden.
6. `npm run check:poe2-tree-update -- --release <tag>` ausführen. Der Prüfmodus schreibt keine produktiven Daten.
7. Diff prüfen: Knoten-/Kantenzahlen, hinzugefügte, entfernte und geänderte Knoten, Namen, Stats, Positionen, Gruppen, Startknoten und Sockel.
8. Approval-Guard, Importtests, Fixture-Import, gesamte Testsuite, Lint, Typecheck, Produktions- und Pages-Build ausführen.
9. Importbericht und Warnungen manuell prüfen. Besonders Startknoten, Sockel, isolierte Knoten, Selbst-/Doppelkanten, Assets und Sprache kontrollieren.
10. Die manuelle Freigabe durch einen datierten Eintrag in `AI_PROJECT/CHATGPT_PROTOCOL.md` und den Quelldokumenten festhalten.
11. Erst danach `npm run import:poe2-tree -- --release <tag>` ausführen, generierte Dateien prüfen, committen und veröffentlichen.

## Rollback und Nachvollziehbarkeit

Alte Rohordner und Manifesteinträge bleiben erhalten. Ein Rollback erfolgt durch erneuten Import des vorherigen freigegebenen Tags und einen normalen Git-Commit; History-Rewrites sind nicht erforderlich. Quellhash, Commit und deterministische Diffs ermöglichen die Rekonstruktion jedes Standes. Eine geänderte Repository-Struktur, neue Dateiart, Mediennutzung, unklare Sockelsemantik oder neue Datenkategorie stoppt den Ablauf bis zur erneuten dokumentierten Freigabe.
