# PoE2 German local extraction preflight (5M.2.1)

## Ergebnis

Die ausschließlich lokale Vorprüfung vom 22. Juli 2026 ist **teilweise technisch erfolgreich, für Produktlokalisierung aber nicht ausreichend**. Der gepinnte RePoE-Parser liest 117 deutsche Itemklassen-Datensätze ID-basiert. Zwei deutsche Läufe sind für diesen erfolgreichen Teil byteidentisch; ein englischer Kontrolllauf enthält dieselben 117 IDs. Die Module für Mods und Basistypen brechen gegen die aktuelle Clientstruktur vor einer verwertbaren Ausgabe ab. StatDescriptions wurden bewusst nicht ausgeführt, weil das gepinnte Modul zwingend die Trade-API abfragt und der Auftrag Netzwerk-/Trade-Daten verbietet.

Es wurden keine deutschen Produkttexte importiert, keine Rohtexte versioniert, keine Produktdateien verändert und keine Freigabe erteilt. `translation-missing` bleibt aktiv. 5M.2 und 5N wurden nicht begonnen.

## Installation und lokaler Pin

- Installationsart: GGG-Standalone-Client
- anonymisierter Pfad: `<POE2_INSTALLATION>/`
- registrierte Windows-Version: `4.5.4.53018`
- Installationskanal: `poe2_production`
- Sprache: Deutsch; technisch gestützt durch den deutschen Installer-/Registrierungseintrag und durch 117 erfolgreich aus `de_DE.utf8` gelesene Itemklassen. Eine separate Konfigurationsdatei wurde nicht gefunden.
- `Content.ggpk`: 152.881.075.152 Bytes, SHA-256 `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`, geändert 2026-07-22 11:14:44 UTC
- `PathOfExile.exe`: 77.650.776 Bytes, SHA-256 `46e49b8458b5d84f17202b591906eeb191012737ac7dfd64a3a08a7970707d27`
- `Client.exe`: 495.960 Bytes, SHA-256 `d6084cc33b4e8aa3dd0c28904ed5d11287e5a6e2f1e0ac643ca05f3f0b917db2`
- `signature.bin`: 32 Bytes, SHA-256 `388426ec73a1ecfa302c49cfaa3fd66a0f91194e31f68edce1a318c42d066375`

Die registrierte Version ist der beste verfügbare Clientnachweis; der Containerhash ist der exakte lokale Datenpin. Eine darüber hinausgehende interne Datenbuildnummer ist **Unbekannt**.

## Parser und isolierter Arbeitsbereich

- RePoE: `repoe-fork/repoe`, Commit `14e3edc89ed705bd4e4eda5c8135756431c76e81`
- Python: 3.12.13
- lokale PyPoE-Abhängigkeit: Commit `c30ad895282fc703a804d77e26e8e5c939f57b93`
- Bereich: `.local-audits/poe2-german-extraction/`, vollständig über `.gitignore` geschützt
- keine Ausgabe nach `generated/`, `public/` oder Pages

Anonymisiertes Befehlsmuster:

```text
python -m RePoE.run_parser --poe2 --file <POE2_INSTALLATION> --outdir <LOCAL_AUDIT_OUTPUT> --language German item_classes
```

Der dokumentierte CLI-Parameter `--file` musste technisch auf das Installationsverzeichnis zeigen, da PyPoE dort `Content.ggpk` erwartet.

## Läufe und lokale Artefakte

Der erste deutsche Itemklassenlauf dauerte 20,534 s, der zweite 18,928 s; beide endeten mit Code 0 und identischem SHA-256 `18081adb6ed228ad256281713f6fff33818d68a89bd9cbe2acad43d4aa78f67b`. Der englische Kontrolllauf dauerte 19,295 s, Code 0, SHA-256 `f1905c443d45863ad66bc07066b63551c7ed315f77e6b635fee2fa52ee05d821`. Die sechs lokalen Itemklassen-Ausgabedateien umfassen 78.163 Bytes.

Lokale, nicht versionierte Kategorien: Parsercheckouts und venv, deutsche Läufe 1/2, englischer Kontrolllauf, Hashmanifeste, Laufprotokolle und normalisierte Auditnotizen. Sie dürfen Volltexte enthalten und bleiben deshalb außerhalb des Git-Index.

## Abdeckung und Fehlergrenze

Von 33 produktreferenzierten Itemklassen-IDs wurden 32 mit nichtleerem deutschem Namen gefunden; `Charm` fehlt im aktuellen ItemClasses-Auszug. Insgesamt enthält jeder Sprachlauf 117 IDs; Deutsch und Englisch haben vollständige ID-Parität. 25 deutsche Datensätze haben einen leeren Namen, betreffen aber keine der 32 gefundenen Produkt-IDs.

Mods (2.255), Statzeilen (2.705), Stat-IDs (431), Kombinationen (444), Mehrzeiler/Hybride (429), Basistypen (39) sowie die 485 technischen Templatelücken sind vollständig als **nicht beurteilbar** klassifiziert. Ursache ist nicht fehlender sichtbarer Text, sondern ein reproduzierbarer `struct.error: unpack requires a buffer of 8 bytes` in der aktuellen PyPoE-Tabellenspezifikation. Zwei Cast-Warnungen zu `BuffVisualOrbTypes.dat64` gehen dem Fehler voraus. Es wurden keine Zahlen oder Zuordnungen aus Texten zurückgeraten.

Das `stat_translations`-Modul ruft in diesem Parsercommit die Trade-API zwingend ab. Wegen des expliziten Verbots wurde es nicht gestartet. Daher sind StatDescription-, Bedingungs-, Varianten-, Platzhalter-, Vorzeichen-, Plural-, Wertebereichs-, Mod-ID-, Implicit-, Corruption-, Jewel-, Charm- und Flask-Coverage **Unbekannt**. Gleiches gilt für mehrzeilige Reihenfolge und OCR-Kandidaten.

## OCR- und Foto-Modus

Der erfolgreiche Itemklassenteil zeigt, dass localeabhängige IDs grundsätzlich erhalten bleiben. Für OCR reichen Itemklassen allein nicht. Ohne compliant erzeugte Stattemplates, Bedingungen, Varianten und Mehrzeiler ist der Bestand derzeit **nicht geeignet**. Fotoerkennung und Übersetzungs-Lernmodus wurden nicht implementiert.

## Reproduzierbarkeit

Der erfolgreiche Itemklassenscope ist byteidentisch deterministisch. Ein vollständiger deutscher Extrakt ist nicht erzeugt worden; dafür wird ausdrücklich kein Determinismus behauptet. Fehlerursache und Abgrenzung stehen im [Paritätsbericht](audits/poe2-german-local-extraction-parity.json).

## Rechte und Distribution

RePoE/PyPoE-Code steht unter MIT; daraus folgt keine Lizenz für extrahierte GGG-Spieltexte. Eine legal vorhandene lokale Installation und eine lokale technische Analyse sind von öffentlicher Weitergabe zu trennen. Eine allgemeine Datenlizenz oder Veröffentlichungsfreigabe ist **Unbekannt**. Rohdump im Repository wird abgelehnt. Normalisierte ID-Templates, Sprachpaket oder kuratierte Mappings benötigen jeweils eine gesonderte Approval-Entscheidung. Das aktuelle Modell ist technische Validierung ohne Distribution; Details stehen im [Optionenbericht](audits/poe2-german-local-extraction-distribution-options.json).

PlayStation-Spieler besitzen keine lokal auslesbaren PC-Dateien. Für sie wäre später ein ausgelieferter Web-Datensatz oder ein separates Sprachpaket erforderlich; diese Aufgabe erteilt dafür keine Freigabe.

## Schlussfolgerung und nächster Schritt

Die Installation und deutsche Locale sind lokal belastbar nachgewiesen, aber ein verlustfreier deutscher Mod-/Stat-/Basistypbestand ist mit dem gepinnten Parser und der aktuellen Clientstruktur **nicht belegt**. Empfohlen ist als eigene Auditaufgabe die Prüfung eines neueren Parser-/PyPoE-Kandidaten gegen denselben Containerpin, ohne den bestehenden Pin oder Approval zu ändern und weiterhin ohne Trade-API. Erst nach vollständiger ID-, Struktur-, Determinismus- und Rechteprüfung darf eine separate Distributionsentscheidung vorbereitet werden. Mobile Textklippung, Buildvergleich und Designoptimierung bleiben offen.

## Follow-up 5M.2.2

Der Kandidatenaudit ist abgeschlossen. Drei exakt gepinnte Stacks wurden geprüft; keiner lieferte einen nachgewiesen verlustfreien, unbeaufsichtigten deutschen/englischen Strukturexport. PoB2/ooz ermöglichte zwar zweimal manifestidentische Offline-Rohextraktionen von fünf Balance-Dateien und 589 CSD-Dateien, die strukturierte Produktabdeckung bleibt jedoch `notAssessable`. Bestehende Produktpins und alle ausstehenden Lokalisierungsfreigaben sind unverändert. Siehe [POE2_GERMAN_PARSER_CANDIDATE_AUDIT.md](POE2_GERMAN_PARSER_CANDIDATE_AUDIT.md).

## Follow-up 5M.2.3

Der neue Offline-Auditparser belegt 2.255 direkte Mod-ID-/Stat-/Wertübereinstimmungen und deutsche CSD-Strukturen für 419/431 Produkt-Stat-IDs. 447/485 bisher fehlende Templates besitzen eine deutsche und englische CSD-Struktur. Wegen fehlender Referenztabellen und des nicht positionssicher auflösbaren ItemClasses-Zusatzbytes bleibt dies nichtproduktiv. Keine Volltexte, Produktdaten oder Approval-Änderungen. Siehe [POE2_OFFLINE_ITEM_AUDIT_PARSER.md](POE2_OFFLINE_ITEM_AUDIT_PARSER.md).
# Fortsetzung 5M.2.4

Die lokale deutsche Vorprüfung umfasst nun deutsche BaseItemTypes, ItemClasses/-Kategorien und Soul-Core-Kategorien aus einem zweiten gepinnten Offline-Audit. Keine Volltexte wurden versioniert. Die zusätzlichen Tabellen schließen die 12 fehlenden deutschen Stat-IDs oder 38 Templatelücken nicht; öffentliche Distribution bleibt ungeklärt und separat freigabepflichtig.
