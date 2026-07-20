# Darstellungsadapter des offiziellen PoE2-Passivbaums

Stand: 20. Juli 2026. Maßgeblich sind `src/tree-view/adapter.ts`, `types.ts`, `data.ts` und die Baumkomponente.

## Verantwortung und Eingabe

Der Adapter bildet ausschließlich den validierten lokalen Datenbestand aus `generated/poe2-tree/tree.json` auf ein stabiles `PassiveTreeViewModel` ab. Die Datei wird von Vite als lokales, gehashtes Build-Asset ausgeliefert und nicht von GitHub oder GGG zur Laufzeit geladen. React interpretiert weder Import- noch GGG-Rohfelder.

Der Adapter berechnet keine Scores, Punktkosten, Pfade, Aktivierungen oder Empfehlungen. Passive Analyzer, Engine-Orchestrator und Buildzustand sind nicht beteiligt.

## ViewModel

`PassiveTreeViewModel` enthält Quellrelease/-commit/-sprache, Bounds, Zählungen, sortierte Knoten, Verbindungen und Gruppen, Start-/Sockellisten, technische Orientierungsoptionen, Warnungen und Validierungsstatus. Knoten enthalten offizielle Koordinaten, Typ, Gruppe/Orbit, englischen Quellnamen und Stats, Sprachstatus, Nachbarn, Start-/Aszendenz-/Sockelmerkmale, technische IDs und Quellreferenz.

Die Typpriorität lautet: Klassenstart, Aszendenzstart, Juwelsockel, Keystone, Notable, Aszendenzknoten, normal, unknown. Nicht für die Ansicht freigegebene oder neue Typen werden nicht erraten, sondern als `unknown` mit Warncode dargestellt. Release 0.5.2 ergibt 5.150 Knoten, 6.067 Verbindungen, 1.621 Gruppen, 6 Klassenstarts, 36 Aszendenzstarts und 19 Juwelsockel. Cluster-Sockel werden nicht erzeugt.

## Koordinaten, Bounds und Sortierung

Alle Positionen stammen unverändert aus dem normalisierten Export. Die Bounds werden aus allen Knotenminima/-maxima plus einem zentralen Rand von 420 Baumkoordinateneinheiten berechnet. Nicht endliche Koordinaten blockieren den Adapter. Es gibt kein Force-Layout und keine künstliche Neuplatzierung.

Knoten werden numerisch nach technischer ID, Verbindungen nach `fromNodeId`/`toNodeId` und Gruppen nach `groupId` sortiert. Referenzen und eindeutige IDs werden erneut geprüft. Gleicher Input erzeugt dasselbe ViewModel.

## Darstellung und Interaktion

Die vorhandene SVG-Grenze bleibt erhalten. Verbindungen liegen in einem memoisierten Layer hinter einem getrennten Knotenlayer. Der anfängliche `viewBox` umfasst den Gesamtbaum. Zoom verändert den Ausschnitt zwischen 1× und 12×; Pointer-Pan verschiebt dessen Zentrum in Baumkoordinaten. Klick, Tap, Enter oder Leertaste wählen genau einen Knoten zur Inspektion aus. Es werden keine passiven Punkte vergeben oder gespeichert.

Der Detailbereich zeigt offiziellen englischen Namen, Stats, ID, Typ und Sprachstatus. Darstellungsfilter dimmen ausschließlich nicht passende Knoten. Suche arbeitet lokal und case-insensitiv über Namen, IDs und Stats, begrenzt auf 20 Treffer. Klassen-/Aszendenzauswahl zentriert nur auf den jeweiligen offiziellen Startknoten und verändert den Charakterstate nicht.

## Sprache, Assets und Fehler

Fallback: verifiziertes lokalisiertes Feld, englischer Quelltext, technische ID. Der aktuelle Stand besitzt ausschließlich Englisch; es wurden keine deutschen Fachtexte erzeugt. ViewModel und Build enthalten keine GGG-Bilder, Icons, Sprites oder Asset-URLs.

Laden, Fehler und validierter Zustand sind getrennt sichtbar. Bei Datei-, JSON-, Schema-, Koordinaten- oder Referenzfehlern erscheint eine deutsche Meldung; es gibt keinen stillen Rückfall auf den synthetischen Baum.

## Performance

Der Produktionsbuild liefert das lokale JSON als 7.580,63-kB-Datei aus (596,81 kB gzip). Das SVG enthält 5.150 Knoten, 6.067 Linien und zwei Layergruppen, also 11.219 Elemente unterhalb des SVG. Knoten-/Verbindungslayer sowie Suchergebnisse sind memoisiert beziehungsweise vorberechnet; Texte werden nur im Detailbereich dargestellt.

Automatische Adaptertests auf dem Entwicklungsrechner beobachteten für vollständige Einzeladaptionen in der Testsuite etwa 336 bis 545 ms. Navigations-, Lade-, Adapter- und erste Renderzeit sowie Desktop-/Mobilverhalten werden nach dem Pages-Deployment mit Browser-Performance-Marken verifiziert und im Projektprotokoll mit den tatsächlich gemessenen Werten festgehalten.

## Fachliche Grenzen

Keine Engine-Anbindung, Pfadsuche, Dijkstra/A*, Optimierung, automatische Belegung, Punktbudgets, Juwelbelegung, Clusterlogik oder Buildempfehlung. Die Ansicht ist ein technischer Browser für den offiziellen Baumstand 0.5.2.
