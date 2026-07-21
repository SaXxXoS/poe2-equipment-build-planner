# Touch-, Aszendenz- und Assetdarstellung des PoE2-Baums

## Nachbesserung 5D.3

Der Nutzer hat den 5D.2-Pinch auf einem physischen iPhone bestätigt. Der neue Assetstand ist noch nicht erneut physisch geprüft. Das Inset ist entfernt: genau eine gewählte Aszendenz wird über `resolveAscendancyDisplayTransform` zentral hinter einem offiziellen Exporthintergrund dargestellt. Keine Auswahl zeigt weder Layout noch Ersatzporträt; manuelles Pan/Zoom wird nicht überschrieben.

Stand: 21. Juli 2026. Aufgabe 5I ist nicht begonnen.

## Pointer- und Pinch-Modell

Der Baumcontainer setzt ausschließlich innerhalb seiner Fläche `touch-action: none` und `overscroll-behavior: contain`. Außerhalb bleibt normales vertikales Seitenscrollen bestehen. Eine Pointer-Map hält aktive Pointer-IDs und Bildschirmpositionen. Ein Pointer verschiebt die Kamera anhand des letzten Punkts. Die ersten zwei aktiven Pointer bestimmen Distanz und Mittelpunkt; weitere Pointer werden gespeichert, aber nicht in die Geometrie einbezogen. `pointerup` und `pointercancel` entfernen den Kontakt. Bleibt nach einem Pinch genau ein Pointer, wird dessen aktuelle Position als neuer Pan-Anker gesetzt, wodurch kein Sprung entsteht.

Pinch-Faktor ist `aktuelle Distanz / vorherige Distanz`. Der Mittelpunkt wird vor jeder Änderung in Weltkoordinaten umgerechnet. Nach dem Zoom wird das Kamerazentrum so verschoben, dass dieselbe Weltposition unter dem Finger-Mittelpunkt bleibt. Wheel-Zoom verwendet entsprechend den tatsächlichen Mauspunkt. Zentrale Werte in `TREE_ZOOM`: Minimum 1, Maximum 12, Buttonfaktor 1,4, Wheelfaktor 1,15 und Pinch-Sensitivität 1.

## Charakter- und Aszendenzkontext

Die erlaubte Abhängigkeit lautet `CharacterConfiguration → Tree Display Context → PassiveTree`. Eine explizite, kontrollierte Tabelle ordnet die sechs vorhandenen Platzhalter-Charakter-IDs den offiziellen Klassenindizes und die zwölf vorhandenen Aszendenz-IDs den offiziellen Export-IDs zu. Namen werden nicht verglichen oder erraten. Der Klassenstart wird hervorgehoben; eine automatische Zentrierung wurde bewusst nicht aktiviert, sodass vorhandenes Pan/Zoom nie durch einen React-Render überschrieben wird.

Der Hauptbaum bleibt in seinen offiziellen Koordinaten erhalten. Nur die ausgewählte Aszendenz wird in einem Inset mit ihren unveränderten offiziellen Weltkoordinaten, eigenen Bounds, Knoten und internen Verbindungen gezeigt. Fremde Aszendenzen sind weder im Inset noch in der Aszendenznavigation enthalten. Layoutübergänge werden weiterhin nicht als lange Linien gezeichnet. Das Inset ist rein darstellend und besitzt keine Punkte-, Engine- oder Buildwirkung.

Beobachtete offizielle Primärfälle der vorhandenen Charakterauswahl: Titan/`Warrior1` 17 Knoten und 16 interne Kanten; Pathfinder/`Ranger3` 24/23; Stormweaver/`Sorceress1` 21/20; Invoker/`Monk2` 20/20; Witchhunter/`Mercenary2` 17/16; Infernalist/`Witch1` 23/22.

## Assetprüfung und Entscheidung

Quelle ist ausschließlich `grindinggear/poe2-skilltree-export`, Release `0.5.2`, Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6`. Die öffentliche Repositoryansicht bestätigt auf oberster Ebene `assets/`, `data.json` und `README.md`. Die bereits gepinnte `data.json` referenziert Klassen-/Aszendenzbilder mit Offsets und Knotenicons unter Pfaden wie `Art/2DArt/...`. Der Ordner selbst wurde wegen der bestehenden Mediensperre nicht heruntergeladen oder lokal gespeichert; deshalb werden Dateiliste, Pixelmaße, Spriteausschnitte und vollständige Zuordnungen nicht behauptet.

Das Repository und Release zeigen keine eigene Medienlizenz oder ausdrückliche öffentliche Weiterverteilungserlaubnis. Die offiziellen Entwicklerdokumente melden aktuell, dass keine PoE2-spezifischen Datenexports bereitgestellt werden. Das reicht nicht für eine neue begrenzte Medienfreigabe. `icons-images` bleibt `blocked`; `source-approval.json` wird nicht gelockert. Es gibt keine Downloads, Hotlinks, Bildkopien, Drittanbieterdateien oder Assetrequests im Pages-Artefakt.

## Visuelle Detailstufen und Performance

Fernansicht rendert einen skalierenden SVG-Rahmen je Knoten und dünne Verbindungen. Ab 2,5-fachem Zoom kommt ein innerer typabhängiger SVG-Ring hinzu; ab 6-fachem Zoom gilt die Nahstufe für Auswahl und Inspektion. Die Geometrie ändert sich dabei nicht. Notables, Keystones, Klassenstarts, Aszendenzen und Juwelsockel besitzen unterschiedliche doppelte Rahmen, Größen und kontrollierte Schatten. Es handelt sich bewusst nicht um offizielle Bildkunst.

Lokale Einzelmessung bei emulierten 390 × 844: Adapter 134,5 ms, erste Render-Markierung 847,6 ms, Wheel-Reaktion 46 ms und Ein-Pointer-Pan einschließlich Browserautomation 331 ms. Fernansicht mit Titan-Inset enthielt 9.926 SVG-Linien/-Kreise; die Detailstufen erhöhen bei Zoom bewusst die Kreiszahl. Wechsel der Charakterauswahl aktualisierte das Inset innerhalb der beobachteten Browseraktion ohne Neuladen. Der Browser stellte keine zuverlässige Speicher- oder Frame-Drop-Messung bereit.

Ein physisches iPhone stand nicht zur Verfügung. Pinch wurde daher durch die reinen Mittelpunkt-/Distanz-/Zoomfunktionen und Pointer-Event-Implementierung automatisiert abgesichert, aber ausdrücklich nicht physisch bestätigt.

## Abgrenzung

Keine Engine, kein Orchestrator, keine reale Pipeline, keine Pfadsuche, keine Empfehlung, keine Punktevergabe und keine Aufgabe 5I. Mobalytics wurde weder als Daten- noch als Code- oder Assetquelle verwendet.

## Regression 5D.4

5D.4 ändert keine Pointer-, Kamera-, Pinch-, Pan- oder Aszendenztransformationslogik. Der Nutzer hat Pinch, Pan, Baumdarstellung, zentrale Aszendenz sowie Klassen-/Aszendenzwechsel auf einem physischen iPhone vor dieser Motivkorrektur bestätigt. Die erneute physische Prüfung des neuen Motivstands bleibt offen und wird nicht als bestanden behauptet.
