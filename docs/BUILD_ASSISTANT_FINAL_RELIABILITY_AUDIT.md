# Build-Assistent – abschließende Zuverlässigkeitsprüfung

Stand: 31. August 2026  
Ausgangscommit: `84f860a`

## Ziel und Grenze

Diese Prüfung schließt die zuletzt konkret belegten Produktlücken im
persistierten Buildzustand und in der Nachvollziehbarkeit von
Unique-Empfehlungen. Sie ersetzt weder die vorhandene Build-Engine noch die
gepinnten Datenquellen. Der Build-Assistent bleibt ein lokaler,
deterministischer und evidenzgebundener Planer. Eine globale Garantie für den
besten Live-Meta-Build oder vollständige Parität mit Path of Building wird
nicht behauptet.

## Geprüfter Produktfluss

Der aktuelle Code verbindet weiterhin:

1. Charakter, Level, Story- und Aszendenzpunkte,
2. normale und einzigartige Ausrüstung einschließlich Waffensets,
3. neun Fertigkeitskarten samt Supports und belegten Embedded-Skills,
4. Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer,
5. kohärente Skill-/Waffen-/Waffenset-Pakete,
6. normale, waffensetspezifische und Aszendenzpfade,
7. Ergebnisaggregation und deutsche Anzeige.

Reale Ausrüstung besitzt Vorrang. Ohne eingegebene Ausrüstung darf die App nur
aus den lokal gepinnten und fachlich modellierten Kandidaten optimieren.
Unaufgelöste Regeln erzeugen keinen erfundenen positiven Bonus.

## Behobene Lücken

### Persistierter Buildzustand

Der Browserzustand verwendet jetzt Speicherschema Version 2. Beim Laden werden
sowohl Version 1 als auch Version 2 fail-safe normalisiert:

- alte Einzel- und Mehrfachaffix-Items werden über die bestehende
  Equipment-Migration übernommen,
- nur aktuelle produktive Ausrüstungsslots und deterministische zusätzliche
  Juwelenslots werden akzeptiert,
- fehlende heutige Slots werden leer ergänzt,
- Rollen, Waffensets und Herkunft von Fertigkeiten werden normalisiert,
- doppelte oder fehlende Skill-Slot-IDs werden deterministisch korrigiert,
- ältere Zustände mit sechs Karten werden auf die heutigen neun Karten
  ergänzt,
- unbekannte Schemaversionen oder beschädigtes JSON werden nicht als gültiger
  Build ausgegeben.

Damit bleiben echte Nutzereingaben nach einem Neuladen erhalten, während ein
neuer Browserzustand weiterhin leer startet. „Alles zurücksetzen“ löscht nur
den Buildspeicher dieser App.

### Belegbare Unique-Empfehlungen

Die getrennte PoB2-Registry transportiert jetzt zusätzlich die vorhandene
Semantik-Evidenz und ihre exakten Quellenzeilenreferenzen bis in die
Equipment-Empfehlung. Produktiv vorgeschlagen werden weiterhin nur
strukturierte oder exakt abgeleitete Evidenzklassen; `ambiguous` und
`unresolved` bleiben vom positiven Ranking ausgeschlossen.

Der Detaildialog zeigt neben allen Eigenschaften der gewählten Variante jetzt
einen eigenen Bereich „Eigenschaften, die den Vorschlag belegen“. Dort werden
die referenzierten deutschen Anzeigezeilen beziehungsweise der vorhandene
englische Fallback gezeigt. Interne `source-line:`-Kennungen sind nicht mehr
der einzige sichtbare Beleg.

## Unveränderte Sicherheitsgrenzen

- Die gepinnten Analyzer- und Approval-Dateien wurden byteidentisch gelassen.
- PoB2-IDs werden nicht als technische GGG-IDs ausgegeben.
- Normale Affixe und Unique-Eigenschaften bleiben getrennte Datenpfade.
- Es gibt kein Runtime-Netzwerk, keine Trade-API und kein Scraping.
- Produktpins und generierte englische PoB2-Unique-Daten wurden nicht
  verändert.
- Unsichere Unique-Semantik darf keinen positiven Empfehlungsscore erzeugen.

## Verifikation

Die Abschlussprüfung bestand fachlich mit 2.009 von 2.009 Tests. Die große
Passivbaum-Matrix wurde wegen eines Vitest-RPC-Zeitfensters zusätzlich in
deterministischen seriellen Gruppen ausgeführt; alle 64 Fälle bestanden dort
mit sauberem Prozessstatus. Der isolierte Performancefall bestand ebenfalls.

Erfolgreich waren außerdem:

- fokussierte Speicher-, Registry-, Unique-Evidenz- und Approval-Tests,
- Typecheck,
- Lint,
- Produktions-Build,
- Pages-Build,
- Validierung aller 253 JSON-Dateien mit `JSON.parse`,
- `git diff --check`,
- Prüfung auf unveränderte gepinnte Engine-Dateien.

Der gebaute Pages-Stand wurde unter seinem echten Unterpfad geprüft. Auf
Desktop (1280 × 720) und Mobil (390 × 844) gab es keine horizontale
Überbreite. Alle neun Fertigkeitskarten standen mobil in genau einer Spalte.
Speichern, Neuladen und Zurücksetzen funktionierten im Browser. Die Konsole
blieb ohne neue Fehler und Warnungen.

## Bekannte Grenzen

- Nicht vollständig lokal modellierte Treffer-, Minion-, Trigger-, Uptime-
  oder Sondermechaniken bleiben unbekannt und werden nicht geschätzt.
- Die Fotoerkennung hängt weiterhin von Ausschnitt, Schärfe, Kontrast und
  sichtbarer Itemstruktur ab; erkannte Werte müssen vor der Übernahme geprüft
  werden.
- „Meta“ bezeichnet nur die reproduzierbar gepinnten Referenzprofile und
  Korrelationen, nicht eine jederzeit aktuelle globale Rangliste.
- Ein Vorschlag ist nur so vollständig wie die lokal belegten Skill-, Support-,
  Baum-, Aszendenz-, Waffen- und Itemdaten.

## Schlussfolgerung

Die konkret reproduzierbaren Fehler dieser Abschlussrunde sind behoben: Alte
Builds werden zuverlässig in den aktuellen Produktzustand migriert, neue
Builds starten leer, und Unique-Empfehlungen zeigen die Eigenschaften, auf
denen ihre belegte Wirkung beruht. Der bestehende End-to-End-Planer bleibt
deterministisch, offline und fail-closed. Eine darüber hinausgehende Aussage,
dass jeder denkbare Live-Build global optimal sei, wäre durch den vorhandenen
Datenstand nicht belegbar und wird deshalb ausdrücklich nicht gemacht.
