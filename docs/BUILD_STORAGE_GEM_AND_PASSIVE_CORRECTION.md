# Buildspeicher, Gemmenbestand und Passive-Korrektur

## Ziel

Dieser Stand schließt die gemeldeten Integrationslücken bei Neuladen,
sichtbaren Gemmen, Waffenkompatibilität und Passivplanung. Die vorhandene
Analyzerarchitektur bleibt erhalten.

## Lokaler Buildspeicher

Charakter, Ausrüstung einschließlich aller tatsächlichen Affixwerte sowie
Fertigkeitskarten und Supports werden versioniert im lokalen Browser-Speicher
gesichert. Änderungen werden automatisch gespeichert; zusätzlich stehen
`Jetzt speichern` und `Alles zurücksetzen` zur Verfügung. Es gibt keine
Cloud-, Account- oder Netzwerkabhängigkeit.

## Skill- und Supportbestand

Die Produktoberfläche verwendet ausschließlich den gepinnten RePoE-/lokalen
Clientbestand:

- Datenversion `4.5.4.4.4`
- lokale deutsche Clientversion `4.5.4.53018`
- 235 produktive aktive beziehungsweise Spirit-Skill-Einträge
- 451 produktive Support-Tier-Einträge

Frühere synthetische Kandidaten werden nicht mehr mit dem Produktbestand
vermischt. Deutsche Gemmennamen stammen über stabile technische IDs aus der
lokalen Spielinstallation. Beispielsweise wird `Spark` als `Funken`
angezeigt. Der Pin bildet nicht automatisch jeden zukünftigen Live-Patch ab.

Manuell wählbare Supports werden auf die technisch am Skill referenzierten
Supportempfehlungen begrenzt. Harte Waffenanforderungen unterscheiden jetzt
konkrete Waffenarten; ein Bogenskill gilt nicht mehr wegen einer groben
Sammelkategorie als mit einem Zauberstab kompatibel.

## Deutsche Ausrüstungsbezeichnungen

Sichtbare technische Itemklassen werden im Editor deutsch benannt. Interne
IDs bleiben unverändert.

Die getrennte deutsche PoB2-Unique-Anzeigeschicht bleibt eine
App-Lokalisierung. Sie ist nicht als vollständig offizieller deutscher
GGG-Unique-Text belegt. Englische PoB2-Produktdaten und technische
Identitäten wurden nicht verändert.

## Automatische Fertigkeitsbefüllung

Eine Analyse ohne manuell ausgewählte Fertigkeit ist zulässig. Erst nach dem
Start der Buildanalyse wird der beste belegte Skillkandidat in die erste
leere Fertigkeitskarte übernommen und mit bis zu fünf tatsächlich gerankten
Supports befüllt. Vor der Analyse bleiben die Karten leer.

## Passive Tree

Die Farbcodierung der Planüberlagerung ist:

- gemeinsamer normaler Pfad: Gelb
- Waffenset 1: Rot
- Waffenset 2: Grün

Waffensetpläne werden standardmäßig mit bis zu 24 unterschiedlich belegbaren
Punkten erzeugt; sie bleiben Teil des normalen Punktebudgets. Der Hauptskill
wird vor der realen Passivplanung in das semantische Buildprofil eingespeist.
Der Modus `Höchster Nutzen` priorisiert dadurch belegte Schadens- und
Mechanikknoten. Unbekannte Knotenwirkungen und exakte DPS werden nicht
erfunden.

## Grenzen

- Eine spielerisch globale Optimalität wird nicht behauptet.
- Unique-App-Übersetzungen sind nicht vollständig als offizielle
  GGG-Lokalisierung verifiziert.
- Die Gemmenliste entspricht dem genannten Pin.
- Supports ohne belastbare technische Skillreferenz werden nicht frei
  hinzugeschätzt.
