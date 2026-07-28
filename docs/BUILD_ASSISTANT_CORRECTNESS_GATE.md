# Build-Assistent: zentrale Korrektheitsregeln

## Anlass

Die bisherige Empfehlungskette konnte fachlich unzusammenhängende Kombinationen
erzeugen. Insbesondere wurden ein Fluch als automatisch eingebettete
Trigger-Nutzlast, nur tagähnliche Supports und Waffenset-Pfade über
Juwelenfassungen akzeptiert.

## Verbindliche Regeln

- Automatische Trigger-Nutzlasten müssen technisch zum Container passen und
  eine belegte Haupt- oder Sekundärschadensrolle besitzen.
- Buffs, Flüche, Debuffs, Marks, weitere Meta-Skills und persistente
  Hilfsfertigkeiten werden nicht automatisch als Schadensnutzlast eingesetzt.
- Die bevorzugte Schadensart des Hauptskills beeinflusst die deterministische
  Nutzlastwahl.
- Ein bereits als eigenständiger Skill belegter Kandidat wird nicht zusätzlich
  automatisch in einen Meta-Skill eingebettet.
- Automatische Supportempfehlungen verwenden bei vorhandener Positivliste nur
  die für den Skill belegten Support-IDs. Tagähnlichkeit allein reicht nicht.
- Supports des Meta-Containers werden nicht ungeprüft als Wirkung des
  eingebetteten Skills ausgewertet.
- Waffenset-Punkte dürfen keine neue Juwelenfassung und keinen Keystone
  belegen oder als neuen Pfadabschnitt benutzen.
- Set 1 und Set 2 dürfen identisch bleiben, wenn keine belegte unterschiedliche
  Spezialisierung existiert. Die App erzwingt keine künstlich verschiedenen
  Pfade.
- Nicht verwendete Punkte sind ehrlicher als illegale oder wirkungslose
  Füllknoten.

## Waffensetmodell

Die bis zu 24 Waffenset-Punkte sind kein zusätzlicher gleichzeitiger
48-Punkte-Bonus. Ein entsprechender Teil der normalen Punkte kann je aktivem
Waffenset unterschiedlich belegt sein. Gemeinsame normale Punkte bleiben in
beiden Sets aktiv. Eine Set-2-Fertigkeit oder -Waffe wird nur empfohlen, wenn
die vorhandenen Skill- und Waffenanforderungen zusammenpassen.

## Grenze

Diese Korrektur verbessert die technische Zulässigkeit und Nachvollziehbarkeit.
Sie behauptet keine globale Meta-Optimalität und ersetzt keine vollständige
Path-of-Building-Berechnung. Nicht ausreichend belegte Wechselwirkungen bleiben
unbekannt und erzeugen keinen positiven Score.
