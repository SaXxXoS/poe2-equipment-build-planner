# Offizielle PoE2-Passivbaumassets

Stand: 21. Juli 2026. Maßgeblich sind Importer, Manifest und Quellcode.

## Quelle, Pinning und Approval

Einzige Quelle ist das offizielle GGG-Repository `grindinggear/poe2-skilltree-export`, Release `0.5.2`, Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6`. Die Kategorie `official-poe2-passive-tree-export-assets` ist ausschließlich für die Darstellung dieses Passivbaums `conditionally-approved`. Dies behauptet keine allgemeine Medienlizenz oder rechtliche Garantie. Andere GGG-Medien, Websitebilder, Clientdateien, Mobalytics, PoE2DB, RePoE, Screenshots und KI-Grafiken bleiben ausgeschlossen. Jeder Releasewechsel löst eine neue Prüfung aus.

## Inventar und Referenzen

Das vollständige maschinenlesbare Inventar steht in `generated/poe2-tree/asset-manifest.json`: relativer Pfad, Name, Typ, Bytes, SHA-256, Atlasabmessung, eindeutig belegte Funktion, referenzierende Exportfelder, Nutzung/Grund sowie Release und Commit. Es umfasst 36 Dateien, davon 18 WebP-Atlanten und 18 Atlas-JSONs, zusammen 6.980.476 Bytes. Die JSONs beschreiben 1.603 geprüfte Spriteausschnitte. Tatsächlich vorhanden sind `nodes.icon`, `nodes.activeEffectImage`, `classes.image`, `classes.image_offset_x/y`, `classes.ascendancies.image`, `offsetX/Y`, Gruppen, Kanten und Typmerkmale. Nicht vorhandene Felder wie `inactiveIcon`, `activeIcon`, `frame`, `sprite`, `classArt`, `ascendancyArt`, `imageZoom` oder `assetPath` werden nicht erfunden.

Atlanten: aktive/inaktive Skillmotive, Keystone-/Notable-/Aszendenz-/Start-/Juwelrahmen, Linien/Orbits, Gruppen- und Baumhintergrund, Juwelradius, Mastery-Effekte sowie acht Klassen-/Aszendenzhintergründe. 52 in `data.json` referenzierte Mastery-Symbolpfade besitzen keinen normalen/notable/keystone-Ausschnitt; sie werden im Importbericht gemeldet und erhalten den kontrollierten typgerechten Rahmen-Fallback.

## Import, Manifest und Pages

`scripts/poe2-tree-asset-import.mjs` verlangt explizit Quellverzeichnis, Release und Commit; `latest` oder ungepinntes `main` sind nicht möglich. Er validiert Atlasgrenzen, berechnet SHA-256, ersetzt die kontrollierte Ausgabe deterministisch und erzeugt `asset-manifest.json`, `asset-import-report.json`, `tree-render-data.json`, `class-registry.json` sowie genau eine lokale Kopie jeder Atlasdatei unter `generated/poe2-tree/assets/`. React verwendet Vites `import.meta.glob(...?url)`; damit erzeugt Vite basisfähige lokale URLs unter `/poe2-equipment-build-planner/`. Es bestehen keine Laufzeitabfragen, Hotlinks, absoluten GitHub-URLs oder Windows-Pfade.

## Darstellung und Performance

`src/tree-view/assets.tsx` ist die zentrale Zuordnung für Knotentypen und Zustände. Fernansicht nutzt maßhaltige vereinfachte SVG-Formen. Mittel- und Nahansicht schneiden offizielle Motive und Rahmen direkt aus gemeinsam gecachten Atlanten aus; 5.150 Einzeldateien, Base64-Duplikate und unabhängige Bilddownloads werden vermieden. Auswahl und Kontextmarkierung ergänzen nur einen sichtbaren Schatten und verändern weder Motiv noch Geometrie.

Die offizielle Webreferenz zeigt einen dunklen Baum, dünne ornamentale Linien, typabhängige Originalrahmen/-motive und ein großes zentrales Klassenbild. Der Projektstand verwendet dieselben Exportatlanten und zentrale Bildplatzierung, bildet jedoch nicht die vollständige Website-Chrome, Punktebelegung, animierte Effekte oder jede Orbitdekoration ab und ist daher nicht „1:1“.

Bekannte Risiken sind die Anzahl der SVG-Elemente, WebP-Decodierung und Filterkosten in iOS Safari. Der bereits physisch bestätigte Pinch-Stand stammt vom Nutzer aus 5D.2; der neue Assetstand wurde von Codex nicht auf einem physischen Gerät geprüft.

## Gemessene Abnahme

Lokaler Desktoplauf bei 1280 × 800: Datenladen 397,1 ms, Adapter 206,0 ms, Gesamt bis ViewModel 603,1 ms und erste Render-Markierung 1.342,9 ms. In der 384-%-Nahansicht mit Titan wurden 15.474 SVG-Nachfahren, 4.500 sichtbare Knotenobjekte und 1.059 gemeinsam adressierte Sprite-`image`-Elemente beobachtet; die Seite hatte 1.265 Pixel Client- und Scrollbreite, also keinen horizontalen Überlauf. Der Produktionsbuild enthält 18 lokale WebP-Dateien, keine Asset-/Daten-Hotlinks; Buildzeit 1,42 s. Assetgesamtgröße: 6.980.476 Bytes. Eine verlässliche Speichermessung war im Browser nicht verfügbar.

Desktop manuell geprüft: Gesamt- und Nahansicht, originale Motive/Rahmen, zentrales Titan-Bild/-Layout, Wechsel auf Huntress/Amazon (19 Knoten), Entfernen bei „Keine Aszendenz“, Suche/Filter-Controls und keine sichtbaren Asset-404. Der neue Stand wurde nicht auf einem physischen iPhone geprüft; diese offene Abnahme darf nicht als bestanden gelten.

## Nachbesserung 5D.4: exakte Knotenmotive

Die Fehlerkette hatte zwei konkrete Ursachen. `data.json.nodes` ist mit der technischen Baum-ID indiziert, enthält aber zusätzlich `node.id` als fachliche Skillkennung. Der Assetimport hatte `nodeIcons` fälschlich mit dieser inneren Kennung aufgebaut, während die Ansicht mit der technischen Baum-ID nachschlug. Zusätzlich skalierte die globale Regel `.tree-viewport svg` auch verschachtelte Sprite-SVGs. Der Browser zeigte dadurch statt eines Ausschnitts große Atlasflächen. Der Import verwendet nun den äußeren Objektschlüssel; nur das direkte Baum-SVG erhält die Viewportgröße. `Sprite` arbeitet mit lokalem `0 0 w h`-ViewBox, negativem Atlasoffset und explizitem ClipPath.

Skill Speed, technische ID `26798`, verweist offiziell auf `Art/2DArt/SkillIcons/passives/attackspeed.png`. Inaktiv wird `skills-disabled.webp`, aktiv `skills.webp`, jeweils Ausschnitt `x=884, y=136, w=34, h=34`, verwendet. Mittel- und Nahansicht behalten exakt diese Referenz. Das maschinenlesbare 20-Knoten-Protokoll liegt in `generated/poe2-tree/node-sprite-reference-audit.json`, die deterministische Vergleichstafel in `generated/poe2-tree/node-sprite-reference-sheet.svg`.

Die 51 weiterhin gemeldeten eindeutigen Iconpfade betreffen ausschließlich 365 als Mastery markierte Knoten. Der Export ordnet sie keinem normalen/notable/keystone-Iconatlas zu; ihre getrennten `activeEffectImage`-Muster werden nicht fälschlich als normales Knotenmotiv verwendet. Diese Fälle bleiben kontrollierte, gemeldete Fallbacks. Die vorherige physische Nutzerbestätigung für Pinch/Pan/Baum/Aszendenz gilt als Ausgangszustand; der neue Motivstand ist auf einem physischen iPhone noch offen.
