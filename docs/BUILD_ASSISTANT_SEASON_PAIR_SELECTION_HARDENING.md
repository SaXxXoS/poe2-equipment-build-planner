# Härtung der saisonalen Skill-/Waffenauswahl

## Ziel

Ohne eingetragene Ausrüstung soll die App kein kleines Nischenpaket nur wegen
seiner internen Korrelation vor einem wesentlich breiter beobachteten
Skill-/Waffenpaar derselben Aszendenz auswählen. Mit eingetragener Ausrüstung
bleibt Equipment-first unverändert vorrangig.

## Behobener Fehler

Der Variantenoptimierer sortierte Kandidaten ohne Ausrüstung zuerst nach der
Anzahl gemeinsam beobachteter Profile. Dadurch konnte ein kleines
korreliertes Paket die breitere, gepinnte Aszendenz-Saisonübersicht
überstimmen. Das war technisch kompatibel, aber als allgemeiner Startbuild
nicht hinreichend repräsentativ.

## Neue Auswahlgrenze

1. Reale Ausrüstung besitzt weiterhin Vorrang.
2. Ohne Ausrüstung wird zuerst geprüft, ob ein lokal modellierbarer Hauptskill
   zusammen mit einer lokal kompatiblen Waffe in der breiten, gepinnten
   Aszendenz-Saisonübersicht vorkommt.
3. Existiert mindestens ein solches Paar, bleiben nur diese Paare im
   produktiven Vergleich.
4. Erst wenn kein solches Paar lokal modellierbar ist, darf ein gemeinsam
   beobachtetes und validiertes Paket als Fallback dienen.
5. Fehlen auch dafür Belege, bleiben ausschließlich die bereits vorhandenen
   strukturierten Aszendenz- beziehungsweise Kompatibilitäts-Fallbacks.

Harte Skill-, Waffen-, Ressourcen-, Support- und Paketregeln werden durch die
Saisonbeobachtung weiterhin nicht überstimmt.

## Sichtbare Evidenz

Jeder ausgewählte Kandidat trägt jetzt genau eine Auswahlklasse:

- `equipment-first`
- `broad-ascendancy-overview`
- `correlated-package-fallback`
- `ascendancy-affinity-fallback`
- `structural-fallback`

Die Ergebnisansicht übersetzt diese Klasse in eine verständliche deutsche
Bezeichnung. Ein Fallback wird damit nicht länger wie eine breit belegte
Saisonwahl dargestellt.

## Vollmatrix

Die deterministische Matrix aller 23 produktiv auswählbaren Aszendenzen
ergibt:

- 23/23 ausgewählte und kohärente Pakete
- 23/23 passende geplante Waffenklassen
- 23/23 gefüllte Hauptsupportgruppen
- 19/23 direkte breite Skill-/Waffenpaare
- 4/23 offen gekennzeichnete korrelierte Paket-Fallbacks
- 0 Aszendenz-Affinitäts-Fallbacks
- 0 rein strukturelle Fallbacks
- 22 belegte Zwei-Waffenset-Pakete und 1 belegtes Ein-Waffenset-Paket
- 0 Phantom-Waffensets
- 0 doppelte Hauptsupportfamilien

Die vier Fallbacks betreffen Disciple of Varashta, Martial Artist, Invoker und
Acolyte of Chayula. Deren breit beobachtete Einträge enthalten am Pin
überwiegend Aszendenzfertigkeiten, Formen, Heralds oder andere Fertigkeiten,
die im lokalen Produktmodell nicht als vollständig berechenbarer Hauptskill
vorliegen. Die App erfindet dafür weder Hauptskillwerte noch DPS.

## Grenze

Die Änderung belegt eine konsistentere Auswahl innerhalb der vorhandenen,
gepinnten Projektdaten. Sie belegt weder globale DPS-Optimalität noch eine
vollständige Path-of-Building-Parität. Fehlende Hauptskillmodelle bleiben
sichtbare Coverage-Lücken und werden nicht durch Namensheuristiken ersetzt.

Der maschinenlesbare Nachweis liegt in
`docs/audits/build-assistant-current-meta-matrix.json`.

## Verifikation

- 28/28 fokussierte Optimierertests bestanden.
- Der vollständige serielle Lauf bestand fachlich mit 2.004/2.004 Assertions.
  Zwei unveränderte Vollbaumdateien überschritten im gemeinsamen Lauf das
  feste Fünf-Sekunden-Zeitlimit; der unveränderte Wiederholungslauf dieser
  beiden Dateien bestand mit 197/197 Assertions bei realistischem
  20-Sekunden-Limit.
- Typecheck, Lint, Produktions-Build und Pages-Build bestanden.
- Die reale Produktionsausgabe wurde auf Desktop und bei 390 × 844 geprüft.
  Zauberin/Sturmweberin erhielt nach der vollständigen Analyse Komet mit Stab,
  konkrete Supports und ein belegtes Set-2-Setup. Die sichtbare
  Auswahlgrundlage lautete „Breit beobachtetes Saisonprofil“.
- Es gab weder horizontalen Überlauf noch neue Fehler oder Warnungen in der
  Browserkonsole.
