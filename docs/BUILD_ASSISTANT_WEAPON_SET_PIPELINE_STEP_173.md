# Schritt 173 – kohärente Waffenset-Pipeline

## Ziel

Die bereits vorhandene Build-Paketoptimierung, die reale Passive-Tree-Pipeline und die sichtbaren Ausrüstungsvorschläge verwenden dieselbe Waffenset-Identität. Ein Setup-Skill, seine Waffe und seine set-spezifischen Passivknoten dürfen nicht mehr in verschiedene Sets geraten.

## Behobene Hauptursache

Der Eingabe-Guard der realen Passive-Tree-Pipeline akzeptierte bislang nur `normal` und `ascendancy`. Die Orchestrierung rief dieselbe Pipeline für Set 1 und Set 2 jedoch mit `weapon-set` auf. Beide Läufe wurden deshalb als ungültig abgewiesen; die gemeinsame gelbe Planung konnte diesen Fehler in der Oberfläche verdecken.

`weapon-set` ist nun ein ausdrücklich zulässiger Planungsscope. Fehler eines der beiden Setläufe werden in Status und Issues des Gesamtergebnisses übernommen und können nicht mehr still verschwinden.

## Waffenset-Regel

- Gemeinsame normale Knoten bleiben gelb und sind in beiden Sets aktiv.
- Bis zu 24 normale Punkte dürfen je Set unterschiedlich belegt sein; sie sind kein zusätzlicher gleichzeitiger 48-Punkte-Topf.
- Set-1-Ziele werden aus dem Skillprofil von Set 1, Set-2-Ziele aus dem Skillprofil von Set 2 bewertet.
- Bereits gemeinsam belegte Knoten sind erlaubte Pfadanker, aber keine neuen set-spezifischen Ziele.
- Juwelfassungen, Keystones und Aszendenzknoten werden nicht als Waffensetziele verbraucht.
- Die Aszendenzplanung bleibt ein separater Topf mit höchstens acht Punkten.

## Paketbindung

Der Optimierer speichert das Zielset des Setup-Skills ausdrücklich. Hauptskill, Hauptwaffe, Setup-Skill, Setup-Waffe, automatische Skillkarten und sichtbare Paketbegründung verwenden diese Angabe gemeinsam. Die bisherige stillschweigende Annahme „Setup ist immer Set 2“ entfällt.

Wenn Nutzerausrüstung vorhanden ist, bleibt sie vorrangig. Fehlende, belegte Paketwaffen werden trotzdem als Referenz ergänzt, damit ein teilweise ausgefüllter Charakter nicht ohne notwendige zweite Set-Waffe bewertet wird.

## Waffen- und Unique-Sicherheit

Waffen-Uniques werden anhand ihrer strukturierten Itemkategorie auf eine konkrete Waffenart begrenzt: Bogen, Armbrust, Streitkolben, Speer, Stab, Zepter oder Zauberstab. Die früheren groben Gruppen `ranged-weapon` und `melee-weapon` reichen für eine produktive Unique-Waffenempfehlung nicht mehr aus.

Der sichtbare Unique-Dialog bleibt variantengenau. Er zeigt die deutschen Anzeigezeilen mit englischem Fallback und unterdrückt interne `source-line:`-Referenzen. Nicht vorhandene Attributanforderungen werden als unbekannt behandelt und nicht erfunden.

## Laufzeit und Determinismus

Die Pfadsuche berechnet mehrere Zielpfade in einem Dijkstra-Lauf und materialisiert vollständige Pfade erst bei Bedarf. Set 1 und Set 2 teilen einen ausschließlich für diese beiden Läufe verwendeten Pfadcache. Dadurch bleibt die Ausgabe deterministisch und die vollständige gepinnte Baumdatei auf Mobilgeräten praktisch berechenbar.

Nach Abschluss der realen Passive-Planung wird das zuvor ausgewählte Build-Paket noch einmal mit genau diesem Plan bewertet. Der sichtbare Passive-Teilwert stammt damit nicht mehr aus einer vorläufigen leeren Heuristik. Waffen, Skills, Supports, tatsächliche Set-Pfade und Aszendenz bleiben Bestandteil derselben abschließenden Paketentscheidung.

## Prüfstand

- gepinnter Baum: 5.150 Knoten
- vollständige normale Planung: 121 von 121 Punkten
- Waffensetplanung: 24 von 24 Setpunkten je Set
- Stormweaver-Aszendenzplanung: 8 von 8 Punkten
- Spirit-Walker-Aszendenzplanung: 8 von 8 Punkten
- unterschiedliche Skilltreiber erzeugen unterschiedliche set-spezifische Ziele
- Klassen-/Aszendenzpakete, automatische Supports, Zielprofile, Schadensmodell und sichtbare Ergebnisausgabe sind über End-to-End-Tests verbunden
- abschließende Browserprüfung: zusammenhängendes Stormweaver-/Funken-Paket ohne Fehler oder Timeout, Passive-Teilwert 100, Set 1 und Set 2 jeweils 24/24 sowie Aszendenz 8/8
- mobile Browserprüfung bei 390 × 844: neun Skillkarten, kein horizontaler Seitenüberlauf und keine neuen Konsolenfehler
- fokussierter Abschlusslauf: 55 Tests erfolgreich; Typecheck, Lint, Produktions- und Pages-Build erfolgreich

## Grenzen

Die Änderung repariert eine konkrete Integrationsblockade und bindet vorhandene belegte Modelle zusammen. Sie beweist weder globale mathematische Optimalität noch vollständige Gleichwertigkeit mit Path of Building. Unvollständig gepinnte Mechaniken und fehlende technische Itemanforderungen bleiben `Unbekannt` und erzeugen keinen erfundenen Bonus.

Produktpins, Offline-Betrieb und die Trennung von PoB2-Planerdaten, technischen Daten und deutscher Anzeigeschicht bleiben unverändert.
