# Regelbasierte Zielknotenbewertung des offiziellen PoE2-Passivbaums

## Verantwortung und Eingabevertrag

`src/engine/passive-targeting/` klassifiziert die unveränderten englischen Namen und Statzeilen des offiziellen Baums 0.5.2 und bewertet jeden echten Knoten gegen ein übergebenes synthetisches `BuildProfile`. Die Eingabe führt Klasse, optionale Aszendenz, Level, Mapping-/Boss-/Balanced-Ziel, Knoten, Ausschlüsse, optionale Typ-/Ergebnis-/Confidence-Grenzen, `AnalyzerContext`, Profilklarheit und Quellversion.

Das Modul sucht keine Pfade, berechnet keine Pfadkosten, belegt keine Punkte und ruft weder Passive Analyzer noch Orchestrator auf. Es wählt nur einzelne mögliche Ziele und ist nicht mit React oder der sichtbaren Baumansicht verbunden.

## Regeln und Textnormalisierung

Alle Begriffe, Gewichte, Schwellen und Kategorien liegen in `rules.ts` und `config.ts`. Jede Regel besitzt ID, Description-Key, Knotentypen, Matchmodus, Muster, optionale Ausschlüsse, Klassifikationstags, Profilfelder, Scorekategorie, Gewicht, Confidence-Gewicht, Priorität, Reason-Code und Aktivstatus. Unterstützt werden exakter, Token-, Phrasen- und Regex-Vertrag; das aktuelle Regelset verwendet kontrollierte Token und Phrasen.

Die Normalisierung arbeitet mit NFKC, vereinheitlicht englische Groß-/Kleinschreibung, typografische Anführungszeichen und Gedankenstriche, reduziert Leerraum und löst GGG-Markup wie `[EnergyShield|Energy Shield]` ausschließlich auf den sichtbaren englischen Text auf. Name und jede Statzeile bleiben getrennte Eingaben. Prozent- und andere eindeutige Zahlen werden strukturiert extrahiert. `sourceText` bleibt unverändert im Ergebnis. Es gibt keine Übersetzung, KI oder freie Sprachinterpretation.

## Unterstützte Kategorien

- Schaden: Physical, Fire, Cold, Lightning, Chaos und Elemental.
- Mechaniken: Attack, Spell, Projectile, Melee, Area, Critical, Damage over Time, Minion, Ailment, Movement, Channeling, Totem, Trap, Mark und Curse.
- Defensive: Life, Armour, Evasion, Energy Shield, Block, Resistance, Maximum Resistance, Recovery, Regeneration, Leech, Stun- und Ailment-Defence.
- Ressourcen/Attribute: Mana, Spirit, Resource Cost, Strength, Dexterity, Intelligence und Attributes.
- Utility: Attack/Cast/Movement Speed, Cooldown, Duration, Skill Effect, Accuracy, Range und Area of Effect.

Eine Statklassifikation enthält Original- und Normaltext, Regeln, Tags, Zahlen, Profilfelder, positive/negative Effekte, Restriktionen, Confidence und `unresolved`. Nicht erkannte Zeilen bleiben sichtbar und gehen in Coverage, Warnungen und Confidence ein.

## Profilabgleich und Scoremodell

Regeltags erzeugen nur bei einem vorhandenen zugeordneten Profilwert einen fachlichen Bonus. Lightning, Spell, Critical, Minion und Attribute erhalten deshalb ohne passende Affinität keinen pauschalen Nutzen; stattdessen werden schwache oder konfliktbehaftete Tags und Profilfelder dokumentiert. Defence-, Resistance-, Resource- und Attributbedarfe werden getrennt berücksichtigt. Mapping bevorzugt Area, Projectile, Movement und Geschwindigkeit; Boss bevorzugt bei vorhandenem Profil Critical/DoT, Curse/Mark, Defensive, Recovery und Ressourcenstabilität. Es werden weder DPS noch Kampfzeit simuliert.

Jeder positive oder negative Beitrag erzeugt einen `ScoreReason`. Getrennte Scores decken Damage, Defence, Mapping, Boss, Speed, Utility, Resource, Attribute, Class/Ascendancy/Profile Synergy und Data Quality ab. Der Gesamtwert berücksichtigt Profiltreffer, Kategorienvielfalt, Typbonus, Widersprüche und Datenqualität. Pfadkosten sind ausdrücklich ausgeschlossen.

## Confidence, Typgrenzen und Sonderfälle

Confidence wird unabhängig vom Score aus erkannter Statquote, Profilklarheit, Konflikten, Knotentyp und Keystone-Komplexität bestimmt. Ein hoher Score garantiert keine hohe Confidence.

Klassen- und Aszendenzstarts sind keine Ziele. Aszendenzknoten benötigen exakt passenden Kontext. Leere oder vollständig uninterpretierbare Knoten werden blockiert. Der nicht kontrollierte Roh-Typ `mastery` bleibt als `unknown` sichtbar, wird aber nur bei interpretierbarem Text zugelassen und erhält reduzierte Confidence. Juwelsockel werden ausschließlich als `socket-target` geführt.

Keystones werden nicht pauschal blockiert. Positive/negative Tags, Restriktionen und Trade-offs stammen nur aus erkannten Statzeilen. Jeder Keystone verlangt Review, setzt `requiresReoptimization` und erhält reduzierte Confidence beziehungsweise eine Warnung; unklare Texte können kein automatisches Top-Ranking erzeugen.

## Redundanz, Ranglisten und Coverage

Identische klassifizierte Tag-Signaturen werden als Redundanz mit technischen Node-IDs ausgewiesen. Unpassende Schadensarten, Attack/Spell, Minion, Critical, Attribute und Widerstände erzeugen Konflikt- oder Schwachnutzungsangaben. Es findet keine Kombination oder globale Optimierung mehrerer Ziele statt.

Das Ergebnis enthält alle, gültige und blockierte Kandidaten sowie getrennte Damage-, Defensive-, Mapping-, Boss-, Speed-, Resource-, Attribute-, Class-, Ascendancy-, Notable-, Keystone-, Socket-, Niedrigdatenqualitäts- und Unresolved-Ranglisten. Gleichstände werden über Datenqualität und technische Node-ID stabil aufgelöst.

Der maschinenlesbare Coverage-Bericht für 0.5.2 misst: 5.150 verarbeitete Knoten, 5.962 Statzeilen, 4.850 klassifizierte und 1.112 ungelöste Statzeilen, entsprechend 81,35 %. Beim Lightning-Projectile-Testprofil wurden 1.355 Knoten blockiert; hierzu zählen insbesondere Start-/fremde Aszendenz-/leere oder vollständig uninterpretierbare Knoten. Diese Werte sind gemessen und keine behauptete Vollabdeckung.

Häufigste ungelöste Texte: `15% increased [Stun] Buildup` (24), `8% reduced [Slow|Slowing] Potency of [Debuff|Debuffs] on You` (14), `10% increased Damage with Two Handed Weapons` (13), `5% chance to [Daze] on [HitDamage|Hit]` (12), sowie je zehn Vorkommen von `10% increased [Stun] Buildup`, `10% increased Damage`, Low-Life-Hit-Damage und `4% increased [SkillSpeed|Skill Speed]`. Diese Texte werden nicht frei gedeutet.

## Performance

Messumgebung: Windows x64, Node.js 24.14.0, Vitest 3.2.7, vollständiger lokaler Release-0.5.2-Baum.

| Vorgang | Beobachtung |
| --- | ---: |
| Datei laden und JSON parsen | 56,72 ms |
| alle 5.150 Knoten klassifizieren | 1.651,62 ms |
| ein Buildprofil vollständig bewerten | 1.701,13 ms |
| zehn synthetische Profile bewerten | 16.048,51 ms |
| beobachtete Heap-Differenz nach Klassifikation | 36,14 MiB |
| beobachtete Heap-Gesamtdifferenz nach zehn Profilen | 256,50 MiB |

Heapwerte sind Momentaufnahmen ohne erzwungene Garbage Collection und keine stabile Verbrauchsgarantie. Unter paralleler Last der vollständigen Testsuite wurden 66,53 ms / 3.918,15 ms / 2.248,45 ms / 16.064,89 ms sowie 27,49 MiB Klassifikations- und 242,87 MiB Gesamtdifferenz beobachtet. Die Werte sind Entwicklungsrechner-Beobachtungen ohne Produktgrenzwert. Mehrfachprofile erzeugen derzeit bewusst vollständige, voneinander unabhängige Analyseobjekte und damit deutliche temporäre Allokationen.

## Integrationsgrenzen

Empfehlungs-Node-IDs sind technisch kompatibel zur Pfadsuche, aber das Targeting importiert oder startet sie nicht. Eine spätere Verbindung von Nutzen und Pfadkosten, vollständige Zielmengenauswahl, Punkteverteilung, Clusterlogik, Analyzer-/Orchestrator-Kopplung und UI-Anzeige benötigen getrennte Aufträge. Es wurden keine deutschen Knotentexte, Assets oder anderen Datenquellen ergänzt.
