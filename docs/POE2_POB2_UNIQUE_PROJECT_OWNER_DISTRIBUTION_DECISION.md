# PoB2-Unique-Planerdaten: Auftraggeberentscheidung 5M.2.8B

## 1. Ziel

5M.2.8B setzt die ausdrückliche interne Projektentscheidung um, den
reduzierten PoB2-Unique-Planerdatensatz ohne individuelle schriftliche
Freigaben von PoB2, Path of Building Community oder Grinding Gear Games für
5M.2.9 technisch zuzulassen.

Diese Entscheidung ist keine Rechtsberatung, keine externe Genehmigung und
keine Behauptung abschließend geklärter Rechte.

## 2. Ausgangslage und historischer Status

5M.2.8A setzte wegen zweier fehlender externer Bestätigungen
`distribution-pending-both` und blockierte 5M.2.9. Die zugrunde liegenden
Tatsachen bleiben erhalten:

- PoB2-Code ist am Pin MIT-lizenziert;
- die MIT-Abdeckung sämtlicher statischer GGG-gekennzeichneter Daten ist
  `Unbekannt`;
- die 20 Dateien enthalten GGG- und Community-geprägte Planerdaten;
- keine individuelle PoB2- oder GGG-Genehmigung liegt vor.

## 3. Entscheidung des Auftraggebers

Der Auftraggeber verfolgt keine externen Einzelanfragen. Die beiden Entwürfe
bleiben als Historie erhalten, wurden nicht versendet und tragen den Status
`not-pursued`. Externe Antworten sind nach der internen Projektpolicy kein
technischer Importparameter mehr.

Der neue aktive Status lautet:

`distribution-project-approved-with-disclosed-uncertainty`

Der erforderliche, versionierte Projektentscheidungswert lautet:

`approved-with-disclosed-uncertainty`

Der vorherige Status bleibt ausschließlich als historische 5M.2.8A-Aussage
dokumentiert.

## 4. Externe Permission und Unsicherheit

- external permission:
  `not-requested-not-obtained-not-required-by-project-policy`
- clarification requests: `drafts-retained-not-sent-not-pursued`
- uncertainty:
  `unresolved-external-rights-disclosed-and-accepted-by-project-owner`

„Nicht durch Projektpolicy erforderlich“ bedeutet ausschließlich, dass keine
Antwort als technischer Guardinput verlangt wird. Es bedeutet nicht, dass
externe Rechte irrelevant, nicht existent oder geklärt wären.

## 5. Gründe für die Projektentscheidung

Die Entscheidung stützt sich auf einen minimalen, reproduzierbaren und
entfernbaren Datenscope: 20 exakte Dateien, exakter Commit, per-file SHA-256,
Feldallowlist, kein Rohmirror, kein Runtimeabruf und vollständige
Quellenkennzeichnung. Diese Schutzmaßnahmen begrenzen die technische Nutzung;
sie ersetzen keine externe Lizenz.

## 6. Weiterhin erlaubter Scope

Nur `poe2-pob2-unique-planner-data`:

- PoB2-interne Planeridentität;
- Name, Basisanzeige, Slot/Kategorie und Level;
- Varianten, sichtbare Planermodzeilen und belegte Rollbereiche;
- Implicits und Legacy-Status als PoB2-Planerinformation;
- Provenienz und Resolutionstatus.

Der Input bleibt
`PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
mit den 20 bereits gehashten Dateien.

## 7. Weiterhin verbotener Scope

Unverändert verboten sind:

- normale Affixe, Crafting, Spawnweights und Konfliktgruppen;
- erfundene GGG-Unique-, Base-, Mod- oder Stat-IDs;
- deutsche CSD- oder Unique-Texte;
- Skills und Supports außerhalb eines später separat freigegebenen Hinweises;
- Socketables und Passivbaumdaten;
- Bilder, Icons, Medien, Hotlinks und Flavour Text;
- Runtime-Netzwerk, Scraping und vollständige PoB2-Spiegel.

PoB2 bleibt eine eigenständige Planerdatenquelle und ersetzt keine
GGG-/RePoE-Technikdaten.

## 8. Reduzierte Distribution

Der Vertrag erlaubt 5M.2.9 grundsätzlich nur:

- Ausgabe: `generated/pob2/uniques.json`;
- Format: normalisiertes JSON;
- Kategorie: ausschließlich `unique-planner-items`;
- per-record Provenienz und Quellenkennzeichnung;
- deterministische IDs und Sortierung;
- SHA-256-, Coverage- und Diffmanifest;
- keine unnötigen Rohfelder oder Quelldateispiegel.

Ein daraus erzeugtes Pages-Artefakt darf nur dieselben allowlist-beschränkten
Records enthalten. In 5M.2.8B wurde keine Produktdatei erzeugt.

## 9. Attribution und Third-Party-Notices

Verpflichtend bleiben:

- Path of Building Community;
- Repository und exakter Commit;
- MIT-Code-Lizenzhinweis;
- Hinweis auf GGG-/Communityherkunft;
- Hinweis auf ungelöste externe Rechte und fehlende Einzelgenehmigungen;
- keine Behauptung technischer GGG-ID-Parität;
- GGG-Nichtzugehörigkeitshinweis;
- keine behauptete PoB2-Zugehörigkeit oder Billigung.

Mindestens README, Datenquellendokumentation und
`THIRD_PARTY_NOTICES.md` müssen den Hinweis tragen. 5M.2.9 muss außerdem eine
Manifestreferenz und die Quellenkennzeichnung je Record erzeugen. Eine
spätere App-Info kann separat umgesetzt werden; 5M.2.8B verändert keine UI.

## 10. Source-Approval

Nur der Scope `poe2-pob2-unique-planner-data` wurde geändert:

- Distribution: Projektfreigabe mit offengelegter Unsicherheit;
- Repositoryspeicherung: nur reduziertes Vertragsartefakt;
- Import: 5M.2.9 darf beginnen;
- externe Bestätigungen: nicht angefragt, nicht erteilt, technisch nicht
  vorausgesetzt;
- erlaubte Artefakte und Ausgabepfad explizit;
- alle Verbote und Fail-closed-Regeln erhalten.

Andere pending oder blocked Scopes enthalten keinen
`projectOwnerDecision`-Wert und bleiben unverändert. Es gibt keinen
generischen Risikoakzeptanz-Bypass.

## 11. Distributionsguard

Der Guard verlangt beim Produktimport:

- exakten Scope, Repositorypin und Commit;
- eine der 20 Dateien und deren exakten SHA-256;
- `approved-with-disclosed-uncertainty`;
- Attribution, Lizenzhinweis und Quellenkennzeichnung;
- vollständige Provenienz;
- Allowlistfelder und `pob2:`-Namespace;
- deterministische Normalisierung und Hashmanifest;
- exakt `generated/pob2/uniques.json`.

Er blockiert weiterhin unbekannte Dateien/Felder, falsche Hashes, fehlende
Hinweise, `fixture:`-Kollisionen, Rohmirror, Medien, Flavour Text, Hotlinks,
Netzwerk, Scraping, normale Affixe und GGG-ID-Behauptungen.

## 12. Aktualisierter Importvertrag

Vertragsversion 2 entfernt `distribution-pending` als Fehler und verlangt
stattdessen die explizite Projektentscheidung. Er enthält alle 20 Dateihashes,
das reduzierte Ausgabeformat, maximal eine Datenkategorie, Provenienz,
Attribution, deterministische Sortierung, getrennte Namespaces und
Fail-closed-Verhalten.

Deutsche Unique-Texte bleiben `not-approved`. 5M.2.9 darf daher nur englische
PoB2-Planertexte oder `translation-missing` verwenden. Keine automatische
Übersetzung ist zulässig.

## 13. Risiken

- Rechteumfang der statischen PoB2-Daten: `Unbekannt`;
- keine PoB2-/Path-of-Building-Community-Einzelgenehmigung;
- keine GGG-Einzelgenehmigung;
- keine Behauptung rechtlicher Vollständigkeit;
- mögliche spätere Beanstandung oder Policyänderung;
- bei Quell-, Schema-, Datei- oder Feldänderung erneutes Audit erforderlich.

Diese Punkte bleiben öffentlich und maschinenlesbar dokumentiert.

## 14. Freigabe und nächster Schritt

**5M.2.9 darf jetzt technisch beginnen: Ja.**

Die Freigabe gilt ausschließlich unter Vertragsversion 2 und sämtlichen
bestehenden Guards. 5M.2.8B selbst hat keine PoB2-Daten importiert, keine
Produktdatei erzeugt und keine UI-, Engine-, Worker-, Analyzer- oder
BuildProfile-Datei verändert.

Nächster Schritt ist 5M.2.9: deterministischer Import des minimalen
englischen PoB2-Unique-Planerdatensatzes mit Manifest, Coverage, Attribution
und Produkttrennungsnachweis. 5M.2 und 5N wurden nicht begonnen.

