# PoE2 Unique Identity and Affix Audit (5M.2.6)

## 1–5. Ziel, Priorität, Ausgangslage, Grenzen und Pins

Der Auftraggeber priorisiert die Klärung echter Unique-Affixe vor regulärer deutscher Produktlokalisierung, OCR, Fotoerkennung, Soul Cores, 5M.2 und 5N. Dieser Auftrag ist ausschließlich ein lokaler Offline-Audit. Maßgeblich bleiben Content-SHA `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`, PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`, ooz 0.2.4/Archiv `e6d7e728a8b02d2203a80f41bdf8f13c524afda2d393773930b8dfc0afd94af4`, Schema `268ae3a318fb23604aa33f01ec2107a2b7fd0e8628294633faab93d0445d3d30`, Auditformat 1 und Node 24.14.0. Produktivpin und Approval bleiben unverändert.

## 6–10. Inventar, Auswahl, Extraktion und Schemas

Das vollständige lokale Content-Inventar wurde mit 19 vorgegebenen Suchmustern geprüft. Ausgewählt wurden nur 25 lokale Dateien, die Identität, Words-/Stashfragmente, VisualIdentity, Basis-/Variantenhinweise, Modreferenzen, Skills oder Lokalisierung prüfen können. Vollständige Grafik-, UI-, fremdsprachige und lediglich namensähnliche Treffer wurden ausgeschlossen.

Zwei Offline-Extraktionen erzeugten je 25 Dateien, 25.477.050 Bytes und Manifest-SHA `c4fdc6fea68206f69381a752e9b3973f5ff4008b7fa047ad532dab20b972752c`. Kein HTTP, HTTPS, DNS, API, Trade, PoE2DB oder Webseitenzugriff trat auf. Bekannte und unbekannte Felder, Arrays und Fremdschlüssel stehen im [Dateiinventar](audits/poe2-unique-local-file-inventory.json).

## 11–15. Identität, Stabilität, Basistyp und Itemklasse

`UniqueStashLayout` enthält 449 Zeilen, aber nur Words-, VisualIdentity-, Stashtyp- und Layoutreferenzen. Sichtbare Words, VisualIdentity und Stashposition sind ausdrücklich keine Item-Identität. `UniqueMaps` besitzt im aktuellen Pin 0 Zeilen. Ergebnis: 449 Kandidatenfragmente, 0 bestätigte oder stark gestützte Unique-Item-Identitäten und 449 `unknown`/stash-only Fragmente.

Keine ausgewählte Quelle liefert die erforderliche stabile Kette Unique-ID → BaseItemTypes. Daher existieren 0 eindeutige Basistyp- und 0 Itemklassenzuordnungen. Das unbekannte ItemClasses-Restfeld blockiert diese Kette nicht: sie scheitert bereits davor an der fehlenden Unique→Base-Fremdschlüsselbeziehung.

## 16–22. Modquellen, direkte Stats und Werte

`UniqueChests` (48 Zeilen) und `Incursion2MutatedUniqueModsClient` (1 Zeile) enthalten technische Modreferenzen, aber keine Unique-Item-Identität. Sie ergeben 311 Referenzen auf 265 verschiedene Mods, 278 Statzeilen und 278 strukturierte Werte. Alle Referenzen lösen technisch auf; sie werden dennoch nicht als Unique-Item-Affixe gezählt. `UniqueChests` beschreibt Truhen, die Incursion-Tabelle ein mutationsbezogenes Modset ohne Item-Unique-Fremdschlüssel.

Direkte Unique-Item-Statdefinitionen: 0. Ohne stabile Itemidentität wurden weder feste noch variable Itemwerte, Rollbereiche oder Min-/Max-Werte behauptet. Keine Zahl wurde aus sichtbarem Text zurückgerechnet.

## 23–29. Versionen, Varianten, Implicits und Spezialeffekte

Es wurden 14 `UniqueMagesLegacy`-Definitionen und eine Mutated-Modset-Zeile gefunden. Sie besitzen keine Parent-/Version-/Item-Unique-Kette und werden nicht als Itemversionen hochgestuft. Ergebnis: 0 technische Unique-Item-Versionen, 0 Varianten, 0 Rollvarianten und 449 unresolved Kandidaten. Vaal-, Corruption-, Legacy-, Mutated- oder Bossvarianten wurden nicht aus Namen abgeleitet.

Basis-Implicits, ersetzte oder zusätzliche Unique-Implicits und Runtime-Spezialeffekte sind ohne Identität/Basis-/Modkette nicht beurteilbar. Sichtbare oder clientseitige Effekte werden nicht als Affixe behandelt.

## 30–35. Granted Skills, Supports und CSD

`ModGrantedSkills` enthält 65 technische Mod→SkillGem-Referenzen. Keine davon ist über eine Unique-Item-Identität verknüpft; Unique-linked Skills: 0. Eine belastbare Supportquelle mit Unique-Zuordnung fehlt, Status `unknown`. Keine Skill- oder Supportdaten wurden importiert.

Für die nicht-itembezogenen Referenzmods existieren 261 deutsche und 261 englische CSD-Statzeilen von 278 technischen Statzeilen. CSD-Texte dürfen Identität, Basistyp, Mod-ID, Werte oder Varianten nicht erzeugen. Daher sind 0 Unique-Item-Affixe deutsch renderbar, 0 englisch-only und 0 teilweise renderbar. Mehrzeiler, Hybride, Bedingungen und Platzhalter wären erst nach unabhängiger Item-Mod-Verknüpfung fachlich relevant.

## 36–41. Zählregeln, Coverage, Importfähigkeit und Analyzer

Eine Identität erfordert einen stabilen sprachunabhängigen Itemschlüssel; Words, VisualID oder Stashzeile genügen nicht. Eine Version benötigt einen Parent-/Versionsschlüssel. Eine Variante benötigt einen expliziten Varianten-/Modsetschlüssel; ein Rollbereich ist keine Variante. Ein Affix benötigt Unique-ID → Mod-ID oder direkte Stat-ID plus strukturierte Werte.

End-to-End-Coverage: 0 fully-resolved, 0 localization-partial, 0 partially-resolved und 449 unresolved Stashfragmente. Unique-Affix-Coverage: 0 Itemreferenzen und 0 renderbare Affixe. Der bestehende Unique Analyzer nutzt synthetische Fixtures; er wurde nicht verändert. Ein späterer Import benötigt mindestens `uniqueId`, `baseTypeId`, `itemClassId`, `versionId`, technische Affixe und strukturierte Werte. Diese Kernfelder fehlen in der lokalen Kette.

## 42–47. Beweise, Determinismus, Sicherheit, Lizenzen und Datenstatus

Beweisstufen sind `confirmed`, `strongly-supported`, `plausible`, `contradicted`, `unknown`. Sichtbarer Text und RePoE-Vergleich allein bestätigen nichts. Zwei vollständige Auditläufe waren byteidentisch: `fd9a0418e4c20c8dc1e3138712839ddefb1dd361ec99ebe74ab5731668759283`.

Alle Rohdaten und Volltexte bleiben in `.local-audits/`. Keine Daten gingen nach `generated/`, `public/`, `src/data/` oder Runtime-Registries. PoB2-/ooz-Code-Lizenzen, lokale Extraktion, GGG-Spieldaten, Texte und mögliche Distribution bleiben rechtlich und technisch getrennt. Dieser Audit erteilt keine Freigabe.

## 48–52. Lücken, Schlussfolgerung und nächster Schritt

Verbleibende exakte Blocker:

- keine stabile lokale Unique-Item-ID-Tabelle,
- keine Unique-ID→BaseItemTypes-Referenz,
- keine Unique-ID→Mod-ID- oder direkte Statdefinition,
- keine technische Version-/Variantenbeziehung,
- keine Unique-linked Skill-/Supportkette,
- CSD kann diese fehlenden technischen Beziehungen nicht ersetzen.

**Sind die Unique-Affixe technisch vollständig geklärt? Nein.** Die vorhandenen lokalen DAT-Quellen enthalten Stash-, Words-, Visual-, Chest-, Mutation-, Legacy- und Skillfragmente, aber keine vollständige Unique-Item-Affixkette. Ein produktiver Import oder Approval ist nicht vertretbar.

Nächster Schritt ist eine separate, weiterhin lokale Quellenentscheidung: prüfen, ob die serverseitige Unique-Definition überhaupt im Clientcontainer materialisiert ist oder ob eine andere ausdrücklich zulässige, ID-basierte offizielle Quelle erforderlich ist. Bis dahin bleiben Unique-Import, reguläre Lokalisierungsfortsetzung, 5M.2, 5N, OCR und Fotoerkennung zurückgestellt.
