# Build-Assistent: Optimierungs- und Meta-Paritätsstatus

## Ergebnis

Der Build-Assistent vergleicht berechenbare Skill-Waffen-Pakete jetzt innerhalb
derselben Modellgrenze relativ nach Schaden. Die bisherige Sättigung aller
DPS-Werte ab 250 wurde entfernt. Ein Paket mit 50.000 berechenbaren DPS ist
damit nicht mehr automatisch gleichwertig zu einem Paket mit 500 DPS.

Unbekannte Zahlen erhalten weiterhin keinen erfundenen Schadensbonus.
Technische Kompatibilität, Ressourcen, Supports und die Kohärenz des gesamten
Pakets werden vor der Auswahl geprüft.

## Vorhandene quantitative Basis

- 235 produktive aktive Fertigkeiten
- 451 produktive Unterstützungen
- 337 PoB2-Schadensreferenzdatensätze
- 234 technisch verbundene Katalogfertigkeiten
- 171 verbundene Attack-/Spell-Datensätze
- 171 Fertigkeiten mit strukturierten Kosten
- 450 Supports mit strukturiertem Kostenmultiplikator
- 51 Fertigkeiten mit exakt belegter Geistreservierung
- 354 Waffenbasen

## Optimierungsablauf

1. Harte Skill-, Waffen- und Supportinkompatibilitäten werden blockiert.
2. Vorhandene Ausrüstung hat Vorrang.
3. Ohne Ausrüstung werden technisch mögliche Waffenarten geprüft.
4. Supports, Setup-Fertigkeit, Ressourcen und Wirkungsgraph werden geprüft.
5. Berechenbare Schadenswerte werden logarithmisch auf 30 bis 100 relativ
   innerhalb desselben Laufs normalisiert.
6. Eine gemischte Shortlist berücksichtigt strukturelle Paketqualität,
   berechneten Schaden und korrelierte Meta-Evidenz.
7. Blockierte Pakete können nicht gewinnen; nicht numerisch belegbare Pakete
   erhalten keinen Schadensbonus.

## Meta-Referenz

Der lokale Snapshot enthält 53 anonymisierte Profile und 10 korrelierte
Build-Pakete. Er belegt Hauptskill, Waffenart und häufige Support- bzw.
Skillbeziehungen. Er enthält absichtlich keine vollständigen Rohprofile,
keine exakten Ausrüstungen und keine vollständigen Passive-Knotenlisten.

Deshalb sind aktuell **0 Referenzbuilds vollständig reproduzierbar**. Eine
Behauptung, die App sei Meta-Builds gleichwertig oder überlegen, wäre damit
nicht technisch nachgewiesen.

## Was für einen echten Gleichstands- oder Überlegenheitsnachweis fehlt

- vollständige numerische Level- und Qualitätskurven aller Fertigkeiten
- vollständige numerische Supportwirkungen
- exakte Triggerziele, Frequenzen und Abklingzeiten
- vollständige Minion-Grundwerte und Verhaltensmodelle
- Projektilüberlappung und Mehrfachtrefferregeln
- vollständige Ailment-/DoT-Stapelregeln
- belastbare Buff-/Debuff-Uptime
- versionierte Vergleichsgegner
- vollständig reproduzierbare Referenzbuilds mit Ausrüstung, Gemmen,
  Passive-Knoten, Aszendenz und Konfiguration

## Schlussfolgerung

Die Auswahl ist fachlich strenger und schadensorientierter als zuvor.
Eine vollständige PoB2-Simulation oder nachgewiesene Meta-Parität ist noch
nicht erreicht. Der nächste belastbare Auftrag ist deshalb eine versionierte,
reproduzierbare Referenzsuite und anschließend die schrittweise Schließung der
noch fehlenden numerischen Wirkungsketten.
