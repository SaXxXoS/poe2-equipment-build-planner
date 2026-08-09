# Meta-orientierter Abschlussstand des Build-Assistenten

## Ziel

Der Build-Assistent soll aus Klasse und Aszendenz sowie optional vorhandener
Ausrüstung ein zusammenhängendes, technisch zulässiges und gegen aktuelle
Saisonreferenzen geprüftes Build-Paket erzeugen. Vorhandene Ausrüstung bleibt
vorrangig. Ohne Ausrüstung darf nur aus gepinnten lokalen Spielregeln und
reduzierten, korrelierten Saisonbelegen gewählt werden.

## Aktueller Quellenstand

- Saison: `Runes of Aldur`
- poe.ninja-Snapshot: `1044-20260809-12563`
- Snapshotdatum: `2026-08-09`
- angeforderte Referenzprofile: `460` (`20` je produktiver Aszendenz)
- erfolgreich reduziert validiert: `237`
- blockiert beziehungsweise nicht vollständig abrufbar: `223`
- geprüfte Rohpakete: `150`
- produktive korrelierte Pakete: `38`
- Audit-only blockierte Pakete: `112`

Die Produktdatei speichert keine Konten, Charakternamen, vollständigen Items,
vollständigen Bäume oder Path-of-Building-Exporte. Zur Laufzeit findet kein
Netzwerkzugriff statt.

## Auswahlregeln

1. Harte Gemmen-, Waffen-, Rollen- und Supportregeln werden zuerst geprüft.
2. Vom Nutzer eingetragene Ausrüstung und die gewählte Hauptfertigkeit haben
   Vorrang und werden nicht heimlich ersetzt.
3. Ohne Ausrüstung gewinnt innerhalb der technisch kohärenten aktuellen
   Saisonpakete zuerst die höhere Zahl gemeinsam beobachteter Profile. Erst
   danach entscheiden Paketwert und die teilweise numerische Schadensschätzung.
   Damit kann eine unvollständige DPS-Modellierung kein deutlich stärker
   belegtes aktuelles Paket verdrängen.
4. Hauptskill, verwendbare Waffenart, Supports und zusammen beobachtete
   Fertigkeitsgruppen bleiben ein gemeinsames Paket.
5. Eine Setup- oder Set-2-Fertigkeit wird nur dann set-spezifisch markiert,
   wenn die technische Wirkungskette dies belegt. Ohne Beleg bleibt sie in
   beiden Sets aktiv; es wird keine künstliche Set-2-Nutzung erfunden.
6. Ressourcenunsicherheit allein verwirft ein korreliertes Paket nicht. Ein
   Support wird aber blockiert, wenn er ein bestätigtes neues
   Ressourcen-Nullbudget verursacht.
7. Technische Inkompatibilität bleibt immer stärker als Saisonpopularität.

## Verifizierte Optimierermatrix

Die feste Matrix umfasst alle `23` produktiven Klassen-/Aszendenzprofile:

- `23/23` wählen ein Paket;
- `23/23` bestehen den gemeinsamen Kohärenzvalidator;
- `23/23` besitzen einen zum Analyzer passenden Waffenkontext;
- `23/23` besitzen fünf belegte Hauptskill-Supportplätze;
- `23/23` besitzen eine Setup-Fertigkeit;
- `23/23` besitzen eine geplante zusammenhängende Fertigkeitsgruppe;
- `23/23` besitzen eine Fertigkeit für Waffenset 1;
- `21/23` besitzen eine technisch belegte Set-2-Fertigkeit;
- `21/23` verwenden ein mehrfach korreliertes aktuelles Saisonpaket;
- `10/23` schneiden zusätzlich den älteren getrennten
  Referenzskill-Überblick;
- `19/23` schneiden zusätzlich den älteren getrennten
  Referenzwaffen-Überblick;
- die ausgewählten Pakete verwenden `12` unterschiedliche Hauptskills und
  `7` unterschiedliche Waffenarten.

Der neuere korrelierte Paketsnapshot ist fachlich stärker als der ältere
Überblick aus voneinander getrennten Skill- und Waffenverteilungen, weil er
die Bestandteile desselben Profils zusammenhält. Für `Titan` und `Tactician`
reicht der aktuelle reduzierte Snapshot nicht für
ein promoviertes Mehrprofilpaket. Sie verwenden deshalb einen lokal
kompatibilitätsgeprüften deterministischen Fallback. `Abyssal Lich` und
`Spirit Walker` besitzen in ihren jeweils am häufigsten gemeinsam beobachteten
Paketen keine technisch belegte unterschiedliche Set-2-Skalierung; die App
erzeugt dafür keinen falschen zweiten Waffenweg.

## Passive-, Waffen- und Aszendenzplanung

- Normale Punkte stammen aus `Level - 1` plus Storypunkten und werden auf das
  vorhandene Projektmaximum begrenzt.
- Bis zu `24` normale Punkte dürfen als umschaltbare Belegungen für Set 1 und
  Set 2 geplant werden. Das sind keine zusätzlichen 48 gleichzeitig aktiven
  Punkte.
- Juwelensockel und Keystones werden nicht als set-spezifische
  Waffenbelegungen verwendet.
- Bis zu `8` Aszendenzpunkte werden aus einem getrennten Budget geplant.
- Gleiche Set-Wirkungen bleiben gemeinsam gelb. Rot oder Grün erscheint nur
  bei tatsächlich unterschiedlicher und belegter Set-Skalierung.

Die seriellen Vollbaumtests bestätigen vollständige normale Endgamebudgets,
legale 24-Punkte-Waffensetbelegungen und acht Aszendenzpunkte für alle aktuell
produktiven Aszendenzen.

## Sichtbares Ergebnis

Das Ergebnis zeigt Hauptskill, fünf eindeutige Supports, korrelierte
Fertigkeitsgruppe, Setup-Fertigkeit, Waffenempfehlungen, Passive-/Set-/
Aszendenzpfade sowie Ausrüstungs- und Unique-Wirkungen. Bei Unique-Vorschlägen
werden die tatsächlichen Implicit- und Modzeilen der jeweiligen Variante
gezeigt. Interne `source-line`-Referenzen und Engine-Schlüssel sind keine
primären sichtbaren Texte mehr.

Zusätzlich werden `376/435` Unique-Basen über einen eindeutigen exakten
deutschen oder englischen lokalen Basisnamen technisch aufgelöst. `234`
davon besitzen belegte Stärke-, Geschick- oder Intelligenzanforderungen. Diese
Anforderungen blockieren untragbare Empfehlungen und erscheinen zusammen mit
den Varianteneigenschaften in der Detailansicht. `47` mehrdeutige und `12`
nicht gefundene Basen bleiben fail-closed ohne erfundene technische Identität.

## Prüfstatus

- fokussierte Abschlussprüfung: `69/69` Guard-, Registry-, Empfehlungs- und
  Semantiktests bestanden; die Optimierermatrix wurde zusätzlich separat
  validiert;
- paralleler Gesamtlauf: `1.977/1.980` Tests bestanden unmittelbar. Der danach
  korrigierte unveränderliche Approval-Guard und die zwei nur unter
  paralleler Gesamtlast zeitüberschrittenen Vollbaumtests bestanden in der
  finalen Fassung fokussiert beziehungsweise seriell; die beiden
  Vollbaumdateien bestanden mit `197/197` Tests;
- Typecheck: bestanden;
- Lint: bestanden;
- Produktions- und Pages-Build: bestanden;
- JSON-Validierung: `252` versionierte JSON-Dateien bestanden;
- Browser: Desktop `1280 × 720` und Mobil `390 × 844` ohne horizontalen
  Seitenüberlauf; alle neun Fertigkeitskarten stehen mobil einspaltig;
- `git diff --check`: bestanden.

## Ehrliche Meta-Eignungsentscheidung

Die App kann einen **meta-orientierten, aktuellen und intern kohärenten
Build-Vorschlag** erzeugen. Für 21 von 23 Aszendenzen beruht die Startwahl auf
mehrfach korrelierten aktuellen Profilen; die restlichen zwei bleiben klar
gekennzeichnete technische Fallbacks.

Nicht belegt ist, dass jeder erzeugte Build weltweit der stärkste Meta-Build
ist oder Path of Building numerisch vollständig ersetzt. Der Snapshot enthält
keine vollständig reproduzierbaren Rohbuilds mit allen Items, Konfigurationen,
Baumknoten und Kampfsituationen. Diese Grenze darf nicht als Garantie
umformuliert werden.

## Schlussfolgerung

Ja: Der Assistent erzeugt jetzt einen aktuellen, regelkonformen und
zusammenhängenden meta-orientierten Build. Nein: Eine garantierte globale
Meta-Spitzenposition oder vollständige Path-of-Building-Parität ist mit den
zulässigen und reproduzierbaren Quellen weiterhin nicht nachgewiesen.

## Abschließende Laufzeitkonsistenz

Nach der Ressourcenprüfung und der Ergänzung belegter
Aszendenzfertigkeiten wird die Passive-, Waffenset- und Aszendenzplanung mit
der endgültigen Skill-/Supportbelegung erneut ausgeführt. Dadurch gehören der
sichtbare Baum, die 24 Waffensetbelegungen je aktivem Set und die bis zu acht
Aszendenzpunkte exakt zum ausgegebenen Gemmenpaket; ein Ergebnis der vorherigen
Gemmenbelegung wird nicht mehr als aktueller Plan angezeigt.
