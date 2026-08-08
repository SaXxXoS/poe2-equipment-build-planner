# Charakterabhängige Gesamtpakete – Schritt 171

## Behobener Produktfehler

Der leere Build wählte zuvor für alle 23 produktiv auswählbaren Klassen-/Aszendenzkombinationen dasselbe Paket `Living Bomb + Wand`. Ein isolierter numerischer Skillwert überstimmte damit den belegten Charakter- und Aszendenzbezug.

## Neue Auswahlreihenfolge

Wenn reale Waffen vorhanden sind, bleiben sie die vorrangige Grundlage. Ohne Ausrüstung grenzt der Optimierer die Kandidaten zuerst auf die stärkste belegte Übereinstimmung mit Klasse und Aszendenzbaum ein. Erst innerhalb dieser fachlich passenden Gruppe vergleicht er Skill, Waffe, Supports, Setup-Skill, Ressourcen, modellierten Schaden und Gesamtpaketqualität.

Die Aszendenz ist dabei keine harte Waffenbeschränkung. Technisch kompatible Alternativen bleiben zulässig, werden aber nicht mehr unabhängig vom Charakterprofil pauschal bevorzugt.

## Sichtbares Ergebnis

Der Ergebnisbereich zeigt zusätzlich die geprüften Hauptskill-Unterstützungen, die Setup-Waffe und den belegten Zusammenhang zwischen Hauptskill und Setup-Skill der beiden Waffensets.

## Prüfung

Ein produktweiter Regressionstest durchläuft alle 23 auswählbaren Klassen-/Aszendenzkombinationen. Jede Kombination benötigt ein nicht blockiertes Startpaket mit mindestens einem kompatiblen Support. Außerdem müssen die Resultate zwischen Charakteren tatsächlich variieren.

Die Änderung nutzt ausschließlich vorhandene gepinnte Skill-, Support-, Baum-, Waffen- und Meta-Referenzdaten. Datenpins und Runtime-Offlinemodell bleiben unverändert. Eine vollständige Path-of-Building-Gleichwertigkeit ist damit weiterhin nicht bewiesen.
