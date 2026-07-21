# Darstellungsadapter des offiziellen PoE2-Passivbaums

## Nachbesserung 5D.3

Die alte manuelle Sechserzuordnung und das Rand-Inset sind ersetzt. `class-registry.json` liefert den vollständigen 0.5.2-Bestand; `assets.tsx` löst zentral offizielle Spriteausschnitte und Zustandsrahmen auf. `resolveAscendancyDisplayTransform` transformiert das ausgewählte Aszendenzlayout als starre Einheit in den Hauptbaummittelpunkt. Relative Positionen, Kanten und Hauptbaumkoordinaten bleiben unverändert; layoutübergreifende Kanten bleiben ausgeblendet.

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

Automatische Adaptertests auf dem Entwicklungsrechner beobachteten für vollständige Einzeladaptionen in der Testsuite etwa 336 bis 590 ms. Auf der öffentlichen Pages-Version wurden im eingebauten Browser bei einer kalten Navigation 5.157 ms bis zur sichtbaren Baumansicht gemessen (lokales Datenladen und JSON-Parsing 313,8 ms, Adapter 129,7 ms, erste Render-Markierung 653,2 ms). Eine warme Navigation benötigte 726 ms (58,2 ms / 131,9 ms / 347,6 ms). Diese Einzelmessungen dokumentieren die Größenordnung und sind keine garantierten Grenzwerte. Der Browser stellte keine verlässliche Arbeitsspeichermessung bereit. Desktop (1280 × 800) und Mobil (390 × 844) wurden ohne Dokumentüberlauf geprüft.

## Fachliche Grenzen

Keine Engine-Anbindung, Pfadsuche, Dijkstra/A*, Optimierung, automatische Belegung, Punktbudgets, Juwelbelegung, Clusterlogik oder Buildempfehlung. Die Ansicht ist ein technischer Browser für den offiziellen Baumstand 0.5.2.
## Geometrienachbesserung 5D (21. Juli 2026)

Der offizielle Export enthält absolute Gruppenmittelpunkte (`groups.*.x/y`) und bereits fertige absolute Knotenweltpositionen (`nodes.*.x/y`). `orbit` und `orbitIndex` beschreiben die Gruppenlage; `node.position - group.position` ist der schon eingerechnete Orbitversatz. Eine globale Orbit-Radientabelle ist nicht enthalten. Deshalb werden weder Radius noch Winkel angenähert. Aszendenz- und Klassenstartknoten nutzen dasselbe Format.

`resolvePassiveNodeWorldPosition(node, group)` ist die einzige Auflösung. Sie validiert Referenz und endliche Werte und liefert die offizielle Position unverändert: `world = officialNodePosition`. Knoten, Linien, Bounds, Suche, Auswahl und Navigation verwenden ausschließlich diese Koordinaten. Genau eine SVG-ViewBox führt Zoom und Pan aus.

Nachgewiesene Ursachen: 40 Übergänge zwischen Hauptbaum und separat positionierten Aszendenzlayouts wurden als lange SVG-Linien gezeichnet. Außerdem hielt `vector-effect: non-scaling-stroke` 14-/16-Pixel-Striche beim Herauszoomen konstant breit, wodurch 5.150 Knoten optisch zur Kugel verschmolzen. Die Übergänge bleiben als `layout-transition` im ViewModel, gezeichnet werden 6.027 Kanten innerhalb desselben Layouts. Alle 6.067 logischen Referenzen bleiben erhalten.

Die Hauptbaum-Bounds entstehen aus sichtbaren Nicht-Aszendenzknoten plus einmalig 420 Padding (`26047,9 × 25843,4`, Seitenverhältnis `1,0079`). `worldBounds` umfasst alle Layouts. `generated/poe2-tree/geometry-diagnostics.json` bestätigt 5.150 Knoten, 1.621 Gruppen, 19 Juwelsockel, null 0/0-Fallbacks, fehlende Gruppen, nicht endliche Positionen oder Ausreißer und 26 echte Positionsduplikate.

Messung: Koordinaten 2,50 ms, Bounds 1,54 ms, Adapter 219,49 ms, Diagnose 9,24 ms und 11.179 SVG-Fachelemente. Lokal bei 1280 × 800: Adapter 150,4 ms, erste Render-Markierung 903,5 ms; Pan einschließlich Automation 494 ms. Frühere öffentliche Einzelwerte: Adapter 129,7/131,9 ms und erste Render-Markierung 653,2/347,6 ms (kalt/warm), nicht direkt vergleichbar.

Desktop 1280 × 800 und emuliertes Mobil 390 × 844 verwendeten denselben ViewBox-Ausschnitt ohne horizontalen Überlauf. Gesamtansicht, Zoom, Pan, drei Klassen, zwei Aszendenzen, mehrere Suchen und alle geforderten Knotentypen wurden geprüft. Ein physisches iPhone stand nicht zur Verfügung. Aufgabe 5I ist nicht begonnen.
## Nachbesserung 5D.2

Pointer-Pinch und Wheel zoomen nun um den tatsächlichen Kontaktmittelpunkt; Ein-Pointer-Pan übernimmt nach Pinch ohne Sprung. Klasse und Aszendenz fließen ausschließlich als Darstellungscontext ein. Der Hauptbaum bleibt unverändert, während genau das ausgewählte offizielle Aszendenzlayout in einem Inset mit Originalkoordinaten und internen Verbindungen erscheint. Offizielle Medien bleiben mangels belastbarer Weiterverteilungsfreigabe blockiert; kontrollierte SVG-Detailstufen verbessern stattdessen die Lesbarkeit. Vollständiger Vertrag: [`POE2_TREE_TOUCH_AND_ASCENDANCY.md`](POE2_TREE_TOUCH_AND_ASCENDANCY.md).

## Motivauflösung 5D.4

`resolveNodeSpriteRenderData(node, state, zoomLevel, radius)` ist die einzige Renderauflösung für Motiv und Rahmen. `tree-render-data.json.nodeIcons` wird über die technische Baum-ID (den äußeren Schlüssel von `data.json.nodes`) adressiert, nicht über die innere Skillkennung `node.id`. Icon- und Frameatlas bleiben getrennte Ebenen; Frame-Sprites werden nach dem Motiv gezeichnet und besitzen transparente Innenbereiche. Fernansicht darf vereinfachen, Mittel- und Nahansicht verwenden dieselbe offizielle Motivreferenz. Verschachtelte Sprite-SVGs clippen einen lokalen ViewBox mit negativem Atlasoffset; nur das direkte Baum-SVG wird durch `.tree-viewport>svg` skaliert.

## Verbindungssichtbarkeit 5D.4.1

Der bisherige Renderer behandelte jede gleichlayoutige Exportkante als dauerhaft sichtbare SVG-Linie. Der offizielle Export setzt jedoch bei zwölf Spezialknoten der Smith-of-Kitava-Aszendenz `hideConnection: true`; alle zwölf sind direkt mit Smith’s Masterwork (`9988`) verbunden. Der Normalisierer übernimmt diese eindeutige Quellaussage ausschließlich als `connection.hideInDefaultState`, ohne Knotenpositionen, Nachbarschaften oder Kanten zu verändern.

`resolveTreeConnectionRenderDecision` ist die einzige Renderentscheidung. Im gepinnten Bestand werden 6.015 gleichlayoutige echte Kanten als `normalVisible`, zwölf Smith-Effektkanten als `hiddenUntilActive` und die bereits bekannten 40 layoutübergreifenden Kanten als `unknown`/nicht gezeichnet behandelt. Bei `hiddenUntilActive` müssen beide Endpunkte in einem expliziten Aktivzustand liegen. Die aktuelle reine Browseransicht besitzt keine Punktebelegung und übergibt deshalb bewusst keine aktiven Knoten; Auswahl oder Hervorhebung wird nicht als Aktivierung erfunden.

Die Rohkanten besitzen nur `from`, `to` sowie teilweise `orbit`, `orbitX` und `orbitY`. Letztere sind Geometrieangaben, keine Sichtbarkeitsflags. Es gibt im Release keine edge-seitige Zuordnung zu dekorativen oder reinen Glow-Ebenen; deshalb werden aktuell null Kanten als `decorative` oder `glowOnly` klassifiziert. Die 644 Mastery-berührenden und 44 Jewel-berührenden Rohkanten werden nicht pauschal ausgeblendet, weil keine von ihnen das eindeutige `hideConnection`-Kriterium erfüllt.
