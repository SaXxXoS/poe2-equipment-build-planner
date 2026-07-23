# PoB2-Unique-Planerdaten: Distributionsentscheidung 5M.2.8A

> **Historischer Stand, durch 5M.2.8B technisch abgelöst:** Der Auftraggeber
> hat entschieden, keine externen Einzelbestätigungen einzuholen. Die
> Entwürfe wurden nicht versendet. Der neue aktive Status ist
> `distribution-project-approved-with-disclosed-uncertainty`; 5M.2.9 darf
> unter allen bestehenden Guards beginnen. Die hier dokumentierte
> Rechteunsicherheit und das Fehlen externer Genehmigungen bleiben
> unverändert wahr. Maßgeblich ist
> `POE2_POB2_UNIQUE_PROJECT_OWNER_DISTRIBUTION_DECISION.md`.

## 1. Ziel und Ergebnis

5M.2.8A klärt ausschließlich Lizenz, Herkunft und öffentliche Distribution
des in 5M.2.8 definierten PoB2-Unique-Scope. Es ist keine Rechtsberatung.

**Entscheidung:** `distribution-pending-both`.

Die MIT-Lizenz des PoB2-Programmcodes ist bestätigt. Eine ausdrückliche
Lizenzierung der mit `Item data (c) Grinding Gear Games` gekennzeichneten
statischen Unique-Daten ist dagegen nicht belegt. Zugleich verlangen die
offiziellen GGG-Nutzungsbedingungen für die hier geplante Speicherung,
Bearbeitung und öffentliche Distribution nach konservativer Auslegung eine
vorherige schriftliche Zustimmung. Deshalb bleibt 5M.2.9 blockiert, bis eine
PoB2-Maintainerbestätigung **und** eine GGG-Bestätigung dokumentiert sind.

## 2. Ausgangslage und Grenzen

Der Auftraggeber hat PoB2 als eigenständige Planerdatenquelle ausgewählt. Der
Scope `poe2-pob2-unique-planner-data` bleibt von GGG-/RePoE-Technikdaten,
normalen Affixen, CSD-Lokalisierung, Crafting, Skills, Supports und
Socketables getrennt. Es wurden keine PoB2-Unique-Daten importiert, keine
Produktdateien erzeugt und keine Anfrage versendet.

## 3. Pin und Untersuchungsumfang

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Umfang: 20 einzeln gehashte Dateien unter `src/Data/Uniques/`
- vorgesehene Ausgabe: minimaler normalisierter Planerdatensatz, kein Mirror
- Laufzeitnetzwerk, Hotlinks, Medien und Flavour Text: verboten

Die Pfade, SHA-256-Werte und Einzelklassifikationen stehen in
`docs/audits/poe2-pob2-unique-file-origin-audit.json`.

## 4. Die 20 Quelldateien

Geprüft wurden `amulet.lua`, `belt.lua`, `body.lua`, `boots.lua`, `bow.lua`,
`crossbow.lua`, `flask.lua`, `focus.lua`, `gloves.lua`, `helmet.lua`,
`jewel.lua`, `mace.lua`, `quiver.lua`, `ring.lua`, `sceptre.lua`,
`shield.lua`, `spear.lua`, `staff.lua`, `talisman.lua` und `wand.lua`.

Alle Dateien sind deklarative Lua-Planerdaten und beginnen mit dem
GGG-Copyrightvermerk. Sie enthalten sichtbare Namen und Modzeilen sowie,
dateiabhängig, Rollbereiche, Varianten und Implicits. Sie sind kein reiner
Programmcode.

## 5. Git-Historie und Herkunft

Die Historie wurde am exakten Pin über die primäre GitHub-Commit-Historie je
Pfad geprüft:

- 15 Dateien wurden beim Struktur-Refactor am 7. März 2021 an ihre heutigen
  Pfade eingeführt;
- `crossbow.lua`, `focus.lua` und `spear.lua` wurden mit dem Export-Commit
  `5743e1d9...` eingeführt;
- `sceptre.lua` wurde mit `c3732c92...` ergänzt;
- `talisman.lua` wurde mit dem als Export bezeichneten Commit `0a6b8337...`
  ergänzt.

Spätere Änderungen umfassen Exporte, Patchupdates und Communitykorrekturen.
`src/Export/Scripts/uModsToText.lua` belegt Exportlogik, aber nicht die
vollständige Provenienz jedes Records. Die belastbare Herkunftsklassifikation
ist daher je Datei Mischbestand beziehungsweise teilweise `Unbekannt`.

## 6. PoB2-Lizenz und Code-/Datentrennung

`LICENSE.md` am Pin enthält die MIT-Lizenz für Path of Building Community und
weitere Drittanbieterhinweise. README und Repositoryoberfläche bezeichnen das
Projekt als MIT-lizenziert. Für kopierten PoB2-Code gelten deshalb mindestens
Copyright- und Lizenznotice.

Die 20 Unique-Dateien tragen jedoch einen separaten GGG-Copyrightvermerk.
Weder LICENSE, README, CONTRIBUTING noch Dateiköpfe enthalten eine
ausdrückliche Erklärung, dass die MIT-Lizenz Rechte an diesen GGG-Inhalten
gewährt. Ergebnis:

- PoB2-Programmcode: `allowed` unter MIT-Bedingungen;
- kopierte PoB2-Parserlogik: `conditionally-allowed` unter MIT-Bedingungen;
- lokale Auditverarbeitung: `allowed`;
- statische Unique-Daten: `license-scope-unknown`;
- abgeleitete öffentliche Distribution: nicht durch MIT allein belegt.

## 7. Offizielle GGG-Bedingungen

Geprüft wurden die aktuellen offiziellen
[GGG Terms of Use](https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy)
und die [Developer Documentation](https://www.pathofexile.com/developer/docs)
am 23. Juli 2026.

Die Terms zählen unter anderem Texte, In-Game-Namen, virtuelle Gegenstände
und deren Eigenschaften zu den geschützten Rechten. Die eingeräumte Nutzung
ist persönlich und nichtkommerziell; Vervielfältigung, Speicherung,
Distribution, Veröffentlichung und abgeleitete Werke außerhalb dieser
Lizenz werden ohne vorherige schriftliche Zustimmung eingeschränkt. Die
Developer-Dokumentation verlangt für öffentliche Anwendungen außerdem den
sichtbaren Nichtzugehörigkeitshinweis. API-Regeln stellen keine
Distributionslizenz für diesen Nicht-API-Datensatz dar.

Die App ist nach Repositorybefund kostenlos, öffentlich, quelloffen, ohne
Runtimeabruf und ohne Medien. Das reduziert Umfang und Risiko, ersetzt aber
keine fehlende Erlaubnis.

## 8. Vollmirror, Reduktion und Buildzeit

- unveränderte Spiegelung der 20 Dateien: `forbidden`;
- vollständige PoB2-Unique-Datenbank: `forbidden`;
- reduzierter normalisierter Datensatz: `pending`;
- nur lokale Buildzeitverarbeitung ohne Veröffentlichung: `allowed` für
  Audit; ein öffentliches Pages-Artefakt bleibt `pending`;
- ungepinnte CI-Quelle oder Runtime-Netzwerk: `forbidden`.

Die Transformation von C nach D ändert die Datenmenge, nicht automatisch die
Rechtslage.

## 9. Distributionsoptionen

### A – abgeleitete JSON-Datei im Repository

Reproduzierbar und offline, aber öffentliche Speicherung plus
Pages-Distribution. Status: `pending`.

### B – nur im Pages-Build

Keine Rohdateien im Repository, aber weiterhin öffentliche Distribution.
Zusätzlich wäre eine rechtmäßige, gepinnte CI-Eingabe nötig. Status:
`pending`.

### C – lokaler Nutzerimport

Vermeidet zentrale Datendistribution, ist jedoch für iPhone- und
PlayStation-Nutzer unpraktisch und erfordert weitere Sicherheits- und
Herkunftsregeln. Status: `conditionally-allowed` als spätere Ausweichprüfung.

### D – keine Distribution

Nur Auditcode, Vertrag und Dokumentation; Unique-Funktion bleibt deaktiviert.
Status: `allowed` und derzeit empfohlen.

## 10. Maintainer-Aussagen und Klärung

README, LICENSE, CONTRIBUTING sowie offizielle Issues, Discussions und
Pull-Request-Suchen ergaben keine ausdrücklich auf die Drittverteilung der
statischen Unique-Daten bezogene Maintainerfreigabe. Das ist kein Verbot,
aber auch keine Erlaubnis.

Reviewbare, nicht versendete Entwürfe liegen in:

- `docs/drafts/POB2_UNIQUE_DATA_USAGE_REQUEST.md`
- `docs/drafts/GGG_DERIVED_UNIQUE_DATA_DISTRIBUTION_REQUEST.md`

Beide Bestätigungen sind erforderlich. Keine externe Nachricht wurde
automatisch gesendet.

## 11. Attribution und Third-Party-Notices

Vor einer Distribution sind README, Datenquellendokumentation,
`THIRD_PARTY_NOTICES.md` und eine sichtbare Datenquellen-/Infoangabe zu
aktualisieren. Vorgesehen sind:

- Path of Building Community und Repository;
- exakter Commit;
- anwendbarer MIT-Hinweis und gegebenenfalls vollständiger Lizenztext;
- Bezeichnung als PoB2-Planerdaten, nicht als GGG-Technik-IDs;
- GGG-Nichtzugehörigkeitshinweis;
- alle zusätzlich schriftlich verlangten Hinweise.

Der aktuelle Notice-Text ist bewusst als pending gekennzeichnet.

## 12. Feldbezogene Distributionsmatrix

| Bereich | Status | Begründung |
|---|---|---|
| PoB2-Code | allowed | MIT mit Notice |
| Parserlogik | conditionally-allowed | MIT-Pflichten bei Übernahme |
| lokale Auditverarbeitung | allowed | keine Veröffentlichung |
| Buildzeitverarbeitung | conditionally-allowed | öffentliches Ergebnis erst nach Bestätigungen |
| Namen, Modzeilen, Werte, Varianten | pending | GGG-gekennzeichnete Inhalte/Eigenschaften |
| abgeleitete Repository-/Pages-Daten | pending | beide Bestätigungen fehlen |
| Skills/Supports | forbidden | außerhalb des Scopes |
| Bilder/Medien/Flavour Text | forbidden | nicht erforderlich und nicht freigegeben |
| deutsche Texte | forbidden | Lokalisierungsscope nicht freigegeben |

## 13. Approval- und Guardentscheidung

`data-sources/source-approval.json` führt nun:

- `distributionStatus: distribution-pending-both`;
- die offiziellen Belege;
- zwei erforderliche schriftliche Bestätigungen;
- Attribution und License-Notice-Anforderungen;
- keine erlaubten Distributionsartefakte;
- fail-closed `nextRequiredAction`.

Der Guard blockiert Produktimport bei pending oder blocked. Ein späteres
`conditionally-approved` muss Maintainer- und GGG-Bestätigung, Attribution
und Lizenznotice validieren. Selbst `distribution-approved` hebt Pin-,
Datei-, Feld-, Provenienz- und Produkttrennungsguards nicht auf.

## 14. Risiken und offene Punkte

- MIT-Geltung für die statischen Datendateien: `Unbekannt`;
- Record-genaue Herkunft: teilweise `Unbekannt`;
- PoB2-Erlaubnis für den reduzierten Datensatz: pending;
- GGG-Erlaubnis für Speicherung und Pages-Distribution: pending;
- endgültige Attribution und Lizenztextanforderung: pending;
- deutsche Unique-Texte: nicht freigegeben.

## 15. Schlussfolgerung und nächster Schritt

5M.2.9 darf **nicht** beginnen. Es fehlen konkret:

1. schriftliche PoB2-Maintainerbestätigung zur Verarbeitung und Distribution
   des reduzierten Datensatzes einschließlich Attribution/Lizenznotice;
2. schriftliche GGG-Bestätigung zur Speicherung und öffentlichen
   GitHub-Pages-Auslieferung der beschriebenen abgeleiteten Unique-Daten.

Nächster Schritt ist die menschliche Prüfung und manuelle Versendung beider
Entwürfe. Antworten müssen anschließend in einer neuen, quellenbelegten
Approval-Entscheidung ausgewertet werden. 5M.2, 5M.2.9 und 5N wurden nicht
begonnen; Fotoerkennung bleibt eine spätere Aufgabe.
