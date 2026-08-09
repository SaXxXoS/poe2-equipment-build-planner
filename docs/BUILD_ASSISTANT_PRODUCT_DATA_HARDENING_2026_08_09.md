# Produktdaten- und Planerhärtung – 9. August 2026

## Ziel

Dieser Abschlusslauf beseitigt weitere Ursachen für scheinbar vollständige,
fachlich aber nicht belegte Buildvorschläge. Die bestehende Architektur bleibt
unverändert:

Eingabe → BuildProfile → Analyzer → Paketoptimierung → reale Baumplanung →
deutsche Ergebnisanzeige.

## Behobene Produktlücken

### Passivbaum

- Die Produktoberfläche verwendet keine historischen Demo-Passivknoten mehr.
- Konkrete Ziele, Pfade, Kosten und nächste Schritte stammen ausschließlich aus
  der gepinnten offiziellen Baum-Pipeline.
- Der Vollbaumtest belegt 121/121 normale Punkte, bis zu 24/24 umschaltbare
  Punkte je Waffenset und 8/8 Aszendenzpunkte.
- Alle 22 im aktuellen Export tatsächlich planbaren Aszendenzen werden einzeln
  geprüft. Eine registrierte Aszendenz ohne Startknoten und ohne Teilbaum wird
  nicht mehr in der Produktauswahl angeboten und kann nicht analysiert werden.

### Skill- und Supporttransport

- Der Passive-Worker erhält denselben produktiven Skill-/Supportbestand wie die
  sichtbare Buildauswertung. Die frühere kleine historische Kandidatenliste ist
  aus diesem Transport entfernt.
- Der produktive Skillbestand umfasst 235 gepinnte Gemmen sowie 53 durch
  offizielle Aszendenzknoten ausdrücklich gewährte Fertigkeiten.
- Eine durch Aszendenz gewährte Fertigkeit erscheint erst, wenn ihr konkreter
  Knoten im berechneten Aszendenzplan belegt wurde. Bei einem
  Aszendenzwechsel wird nur diese automatische Belegung entfernt; manuelle
  Fertigkeiten bleiben erhalten.
- Setup-, Debuff- und Trigger-Fertigkeiten werden nur bei belegter Beziehung in
  das andere Waffenset gelegt. Ohne diesen Beleg bleiben sie in beiden Sets;
  eine künstliche Set-2-Fertigkeit wird nicht erzeugt.
- Automatische und manuell ausgelöste Supportvorschläge verwenden weiterhin
  denselben harten Kompatibilitätsfilter und dieselbe Familien-Deduplizierung.

### Uniques und Ausrüstung

- Eine Unique-Empfehlung benötigt eine positive, buildbezogene Wirkung. Die
  bloßen Grobtags `attack`, `spell`, `defensive` oder `resistance` erzeugen
  allein keinen Schadensvorschlag.
- Negative strukturierte Rollbereiche werden als mögliche Einschränkung
  erfasst.
- Ergebnis- und Ausrüstungsdialog zeigen die sichtbaren Eigenschaften der
  aktuellen Variante. Legacy-Varianten bleiben getrennt.
- Interne `source-line:`-Referenzen werden in sichtbare Zeilen aufgelöst und
  nicht mehr als technische Pfade in der UI ausgegeben.
- Gepinnte Waffenbasen zeigen nur belegte Grundwerte und Anforderungen. Unbelegte
  Affixe oder fertige Gegenstände werden nicht erfunden.

### Juwelen

- Die historischen 13 Demo-Juwel-/Clusterkandidaten sind aus dem Produktfluss
  entfernt.
- Produktive normale Juwelkandidaten werden aus den gepinnten technischen
  RePoE-Juwelmods erzeugt und nur bei exakt klassifizierbaren Stat-IDs
  zugelassen.
- Nicht aufgelöste Mods sowie nicht belegte Cluster- und besondere
  Juweldefinitionen erzeugen keine Empfehlung.

## Speicher und Offlinebetrieb

Charakter, Ausrüstung und Fertigkeitskarten werden weiterhin versioniert im
lokalen Browser gespeichert. Die Berechnung lädt keine Runtime-API und keine
Rohquelle. Ein neuer Browserzustand bleibt leer; ein vorhandener lokaler
Nutzerzustand wird wiederhergestellt.

## Prüfstatus

- fokussierte Integrations- und Regressionstests: 105/105 erfolgreich,
- offizieller Vollbaumtest: 64/64 erfolgreich,
- vollständiger serieller Gesamtlauf: 171 Dateien und 1.964/1.964 Tests
  erfolgreich,
- abschließender Wiederholungslauf der zuletzt berührten Baum-, Synergie- und
  Attributdarstellungstests: 74/74 erfolgreich,
- Typecheck: erfolgreich,
- Lint: erfolgreich,
- Produktions-Build und Pages-Build: erfolgreich,
- JSON-Validierung: 253/253 Dateien erfolgreich,
- `git diff --check` und Git-Sicherheitsprüfung: erfolgreich.

Der gebaute Pages-Stand wurde lokal auf Desktop sowie bei 390 × 844 geprüft.
Das feste Profil Zauberin/Sturmweberin ohne Ausrüstung erzeugte ohne
Berechnungsfehler drei belegte Fertigkeitskarten, fünf eindeutige Supports am
Hauptskill, eine belegte Set-2-Vorbereitung, 8/8 Aszendenzpunkte sowie
unterschiedliche Set-1-/Set-2-Pfade. Unique-Details zeigten ihre sichtbaren
Varianteneigenschaften und keine internen `source-line:`-Referenzen. Es trat
kein horizontaler Überlauf auf; die Browserkonsole blieb ohne Fehler und
Warnungen. Der GitHub-Pages-Lauf `31309593847` für Commit
`98d2bcff0cf1eb00176aff999cc427fc642f10bf` schloss Build und Deployment
erfolgreich ab. Die öffentliche Seite antwortete mit HTTP 200 und lieferte
den lokal geprüften JavaScript-Fingerprint `index-fakaOts0.js` ebenfalls mit
HTTP 200 aus.

Der Build meldet weiterhin große JavaScript-, Worker- und Baumdaten-Chunks.
Das ist kein fachlicher Fehler, bleibt aber ein belegtes Performance-Risiko
für den ersten Kaltstart auf schwächeren Mobilgeräten.

## Ehrliche Produktgrenze

Der Assistent erzeugt ein deterministisches, regel- und evidenzgebundenes
Buildpaket. Er behauptet keine mathematisch globale DPS-Optimalität und keine
vollständige Gleichwertigkeit mit Path of Building oder sämtlichen aktuellen
Meta-Builds. Eine Empfehlung ohne belegte Daten bleibt unbekannt oder leer,
statt durch eine Schätzung ersetzt zu werden.
