# CHATGPT-Protokoll – PoE2 Equipment Build Planner

## Ressourcenbilanz je Fertigkeit und Waffenset – Schritt 32 (2026-07-28)

- Die Ergebnisansicht zeigt die belegte Ressourcenbilanz jetzt getrennt je
  Fertigkeitssetup und Waffenset.
- Sichtbar sind Kosten pro Nutzung beziehungsweise Sekunde, Aktionsfrequenz,
  Mana-Bedarf pro Sekunde, bestätigter Mindestpool, Regeneration,
  Support-Kostenfaktor sowie der Kostenfaktor aus vergebenem Passivbaum und
  Aszendenz.
- Geistkapazität, Reservierung und verbleibender Geist werden getrennt für
  Waffenset 1 und Waffenset 2 ausgewiesen.
- Levelbasierter Quest-Geist bleibt sichtbar als Planungsschätzung markiert.
- Fehlende Kostenketten, Frequenzen, Pools oder Reservierungen bleiben
  `Unbekannt`; es werden keine Werte ergänzt oder geschätzt.
- Keine neue Datenquelle, Nutzereinstellung oder Runtime-Netzwerkabhängigkeit.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_RESOURCE_BALANCE_STEP_32.md`.
- Audit:
  `docs/audits/build-assistant-resource-balance-step-32.json`.
- Nächster Schritt: direkter Ressourcen-Vorher-/Nachher-Vergleich der
  geprüften Buildvarianten.

## Passive-, Aszendenz- und Waffenset-Ressourcen – Schritt 26 (2026-07-28)

- Ausgangscommit: `7e2f587bd9575de653a36a72fffe68f8dab4bd66`.
- Tatsächlich vergebene gemeinsame, set-spezifische und Aszendenzknoten
  speisen die Ressourcenbilanz automatisch.
- Set 1 verwendet gemeinsam + Set 1 + Aszendenz; Set 2 verwendet gemeinsam +
  Set 2 + Aszendenz; `Beide` verwendet gemeinsam + Aszendenz.
- Exakt verarbeitet werden unbedingtes maximales Mana, Manaregeneration,
  Manakosten und Geist. 95 enge Quellmuster sind im gepinnten Baum vorhanden,
  davon 14 auf Aszendenzknoten.
- Bedingungen, freie Ähnlichkeit, Mana-Kosteneffizienz ohne geschlossene
  Formel und unvollständige Geistreservierung bleiben blockiert.
- `You have no Mana` blockiert bestätigte Manafertigkeiten; aus einem bloßen
  konservativen Mindestdefizit wird kein endgültiges negatives Urteil
  erfunden.
- Keine neue Nutzereinstellung, Datenquelle oder Runtime-Netzwerkabhängigkeit.
- Ressourcenmodell `5.0.0`, Schadensrechner `3.5.0`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_PASSIVE_RESOURCE_EFFECTS_STEP_26.md`.
- Audit:
  `docs/audits/build-assistant-passive-resource-effects-step-26.json`.
- Nächster Schritt: Mana-Kosteneffizienz, Geistgrundkapazität und konkrete
  Reservierungsbeträge schließen.

## Automatisches Ladungszustandsmodell – Schritt 14 (2026-07-27)

- Power-, Frenzy- und Endurance-Charge-Zustände werden getrennt und
  automatisch geführt.
- Charge Regulation: Verbrauch aller drei Ladungsarten alle zehn Sekunden
  belegt; Erzeugung nicht belegt.
- Charged Staff: Blitzschaden pro Power Charge belegt; Anzahl, Verbrauch und
  Buffdauer nicht vollständig belegt.
- Disengage: drei Frenzy Charges nach Verbrauch eines Parry-Debuffs belegt;
  die vorgelagerte Debuff-Kette bleibt unresolved.
- Bedingte oder fehlende Ladungen erzeugen keinen positiven Bonus.
- Keine neue Nutzereinstellung und keine erfundene Ladungszahl.
- Modellversion: `1.0.0`.
- Bericht:
  `docs/audits/build-assistant-charge-state-step-14.json`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_CHARGE_STATE_STEP_14.md`.

## Vollständige Offensiv-Wirkungsketten – Schritt 13 (2026-07-27)

- Zwölf weitere Buff-, Trigger- und Stapelkandidaten wurden im gepinnten
  Schadensdatensatz vollständig inventarisiert.
- Ein vorhandener Einzelwert reicht nicht für einen Schadensbonus. Betrag,
  Ziel, Zustand, Verbrauch beziehungsweise Stapelzahl und Wirkfenster müssen
  gemeinsam belegt sein.
- Arctic Armour, Arctic Howl, Charge Regulation, Charged Staff, Elemental
  Conflux, Emergency Reload, Infernal Cry, Lunar Blessing, Mana Tempest,
  Mantra of Destruction, Sigil of Power und Trinity bleiben fail-closed
  blockiert.
- Bei Auswahl nennt die Ergebnisansicht den konkreten fehlenden Teil der
  Wirkungskette.
- War Banner bleibt die einzige vollständig belegte allgemeine
  zeitabhängige Offensivwirkung.
- Keine neue Nutzereinstellung, kein erfundener Bonus und keine Übertragung
  von Minion- oder Defensivwerten auf die Spielerhauptfertigkeit.
- Modellversion: `1.1.0`.
- Bericht:
  `docs/audits/build-assistant-temporal-offensive-effects-step-13.json`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_EFFECT_CHAIN_COVERAGE_STEP_13.md`.

## Zeitabhängige Offensivwirkungen – Schritt 12 (2026-07-27)

- Betrag, Ziel, Aktivierungsregel und Wirkzeit müssen gemeinsam strukturiert
  belegt sein; andernfalls bleibt die Wirkung blockiert.
- Der dauerhafte Vergleichswert bleibt unverändert. Zeitlich begrenzte
  Wirkungen erscheinen als getrennter Wert „Im belegten Bufffenster“.
- War Banner liefert einer Angriffshauptfertigkeit im belegten
  9,8-Sekunden-Fenster 25 % mehr Angriffsschaden und 25 % erhöhte
  Angriffsgeschwindigkeit; Aktivierungszeit: 0,5 Sekunden.
- War Banner wirkt nicht auf Zauber.
- Sigil of Power bleibt numerisch blockiert, weil Bonus pro Stufe vorhanden,
  erreichte Stufenzahl und Aufbauzeit aber nicht vollständig belegt sind.
- Defensive Wirkungen und Gegnerwirkungen werden nicht doppelt als
  Spieler-Offensivbuff gezählt.
- Modellversion: `1.0.0`; Schadenteilrechner: `2.3.0`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_TEMPORAL_OFFENSIVE_EFFECTS_STEP_12.md`.

## Automatisches Zeit- und Aufrechterhaltungsmodell – Schritt 10 (2026-07-27)

- Die berechnete Aktionsfrequenz des Hauptskills wird automatisch mit
  strukturiertem Rüstungsbruch pro Treffer verbunden.
- Trefferzahl und Zeit bis zum vollständigen Rüstungsbruch werden gegen das
  belegte 12-Sekunden-Fenster geprüft.
- Vollständig gebrochene Rüstung wird nur als aufrechterhaltbarer Vollzustand
  verwendet, wenn der Hauptskill ihn innerhalb der Wirkzeit erreicht und durch
  fortgesetzte Treffer halten kann.
- Die Ergebnisansicht unterscheidet `permanent`, `maintainable`, `windowed`,
  `ramping` und `unresolved`.
- Fluchwirkzeit und Wirkzeitpunkt werden angezeigt. Ohne Rotationsbeleg wird
  keine prozentuale Wiederholungsfrequenz oder Uptime behauptet.
- Unbelegte Expositionsbeträge, Buff-Uptime und Triggerfrequenzen erzeugen
  weiterhin keinen Bonus.
- Zeitmodellversion: `1.0.0`; Schadenteilrechner: `2.2.0`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_TEMPORAL_EFFECTS_STEP_10.md`.

## Automatisches Debuff-Zustandsmodell – Schritt 9 (2026-07-27)

- Mapping und Allround verwenden automatisch einen seltenen
  Vergleichsgegner; Boss verwendet einen einzigartigen Gegner.
- Flüche besitzen ihre strukturierte Wirkzeit von 7,4 Sekunden.
- Die aktuelle Seltenheitsreduktion der Fluchwirkung wird automatisch
  angewandt: 15 % weniger auf magischen, 30 % weniger auf seltenen und
  50 % weniger auf einzigartigen Gegnern.
- Rüstungsbruch besitzt 12 Sekunden Wirkzeit, wird gegen normale Gegner
  verdreifacht und gegen magische Gegner verdoppelt.
- Bei bekannter Zielrüstung werden benötigte Treffer bis vollständig
  gebrochener Rüstung berechnet.
- Vollständig gebrochene Rüstung liefert ausschließlich im belegten
  Vollzustand 20 % mehr physischen Trefferschaden.
- Ohne Zielrüstung, Expositionsbetrag oder aktiv belegten bedingten Zustand
  wird kein Wert erfunden.
- Hauptdokument: `docs/BUILD_ASSISTANT_DEBUFF_STATE_STEP_9.md`.

## Automatische Gegnerwirkungen – Schritt 8 (2026-07-27)

- Gewählte Fertigkeiten und tatsächlich belegte normale beziehungsweise
  Aszendenzknoten speisen ihre eindeutig numerischen Gegnerwirkungen
  automatisch in das Vergleichsprofil.
- Elemental Weakness (`-59 %` Elementarwiderstände) und Despair (`-49 %`
  Chaoswiderstand) stammen aus strukturierten Werten der gepinnten
  PoB2-Schadensreferenz.
- Das normale Fluchlimit wird fail-closed behandelt: Es wird höchstens ein
  für die verursachten Schadensarten relevanter Fluch angesetzt.
- Strukturierter Rüstungsbruch pro Treffer wird nicht zwischen mehreren
  Fertigkeiten addiert. Aufbau, Wirkzeit und vollständig gebrochene Rüstung
  bleiben außerhalb der aktuellen Teilberechnung.
- Nur unbedingte, exakt lesbare Durchdringung aus vergebenen Baumknoten wird
  addiert. Bedingte Zeilen erzeugen keinen Bonus.
- Frost Bomb wird nicht als numerische Exposition behandelt, weil der Pin
  keinen sicheren Expositionsbetrag enthält.
- Die Ergebnisansicht nennt jede automatisch angewandte Gegnerwirkung samt
  Wert und Bedingungsstatus.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_AUTOMATIC_ENEMY_EFFECTS_STEP_8.md`.

## Gegnerabwehr und Vergleichsprofile – Schritt 6 (2026-07-27)

- Die numerische Trefferschadenkette besitzt jetzt ein getrenntes
  `EnemyMitigationProfile`.
- Verarbeitet werden explizite Widerstände, Widerstandsreduktion,
  Trefferdurchdringung, Rüstung und Rüstungsbruch.
- Elementare und Chaosschadenskomponenten bleiben getrennt. Rüstung wirkt
  standardmäßig ausschließlich auf physische Treffer.
- PoE2-Durchdringung wird nach Widerstandsänderungen angewandt und senkt den
  Widerstand standardmäßig nicht unter null.
- Ohne Vergleichsprofil wird keinerlei Gegnerabwehr erfunden; Mapping und
  Boss bleiben fachliche Zielprofile und keine versteckten Zahlenpresets.
- Die Ergebnisansicht unterscheidet ausdrücklich zwischen dem Wert vor
  Gegnerabwehr und dem Wert eines expliziten Vergleichsprofils.
- Dokumentation:
  `docs/BUILD_ASSISTANT_ENEMY_MITIGATION_STEP_6.md`.
- Nächster Schritt: persistente Vergleichsgegner-Eingabe und strukturierte
  automatische Zuführung belegter Fluch-, Expositions-, Durchdringungs- und
  Rüstungsbruchwerte.

## Quantitative Wirkungskette – Schritt 4 (2026-07-27)

- Das Wirkungsmodell aus Schritt 3 besitzt jetzt eine getrennte,
  deterministische Zahlenkette.
- Berechnet werden strukturierter Grundschaden, bestätigte einstufige
  Umwandlungen, passende additive Schadenserhöhungen und belegte
  Angriffs-/Zaubergeschwindigkeit.
- Numerisch eindeutige Originalzeilen tatsächlich belegter Passive- und
  Aszendenzknoten werden einbezogen. Semantische Analyzergewichte werden
  ausdrücklich nicht als Prozentwerte missbraucht.
- Waffenset-spezifische Knoten wirken nur auf das aktive Skillset.
- Umgewandelter Schaden berücksichtigt belegte Skalierungen der Ausgangs- und
  Zielschadensart. Über 100 Prozent liegende Summen werden begrenzt und
  gemeldet.
- Lokale Waffenaffixe werden bei eingegebenen finalen Waffenwerten nicht
  doppelt angewandt.
- Kritische Grundchance und bestätigte Erhöhungen werden angezeigt, aber noch
  nicht ohne vollständige Grundlage in eine scheinpräzise Gesamt-DPS
  eingerechnet.
- Numerische Supporteffekte, Gegnerabwehr, DoT/Ailments, Mehrfachtreffer,
  Trigger, Minions und bedingte Effekte bleiben offen.
- Dokumentation:
  `docs/BUILD_ASSISTANT_QUANTITATIVE_EFFECTS_STEP_4.md`.
- Nächster Schritt: strukturierte Supporteffekte und explizite Gegnerprofile.

## Tatsächliche Waffen-Grundwerte (2026-07-27)

- Waffen speichern ihre endgültigen angezeigten Grundwerte jetzt getrennt
  von normalen Affixen: physischer, Feuer-, Kälte-, Blitz- und Chaosschaden,
  kritische Trefferchance, Angriffe pro Sekunde und Reichweite.
- Der Item-Editor bietet diese Werte in allen Waffenplätzen manuell an.
  Bereichswerte werden als Minimum und Maximum eingegeben und vor dem
  Speichern validiert.
- Foto- und Screenshot-OCR übernimmt eindeutig beschriftete deutsche und
  englische Waffenwerte. Nur farbcodierte, im OCR-Text aber nicht benannte
  Elementarbereiche bleiben als ungeklärte Bereiche erhalten; ihre
  Schadensart wird nicht geraten.
- Eingegebene beziehungsweise erkannte endgültige Waffenschadenswerte und
  Angriffe pro Sekunde haben Vorrang vor der gepinnten Waffenbasis in der
  begrenzten Trefferschadenberechnung. Dadurch funktionieren auch deutsche
  oder nicht direkt auflösbare Basistypanzeigen, sofern vollständige
  tatsächliche Werte vorliegen.
- Kritische Trefferchance und Reichweite werden bereits vollständig
  transportiert. Ihre weitergehende numerische Wirkung gehört zum folgenden
  einheitlichen Wirkungsmodell; eine vollständige PoB-DPS wird noch nicht
  behauptet.
- Verifikation: 63 fokussierte OCR-, Waffenwert-, Equipment-, Schadens- und
  UI-Tests, Typecheck, Lint und Pages-Produktionsbuild erfolgreich.
- Nächster Schritt: einheitliches Wirkungsmodell für Ausrüstung, Skills,
  Supports, Passive Tree, Aszendenz und Waffensets.

## Harte Supportpaket- und Set-2-Validierung (2026-07-27)

- Automatische Supportvorschläge werden nicht mehr nur einzeln bewertet,
  sondern zusätzlich als vollständiges Paket auf gegenseitige
  Ausschlusskategorien geprüft.
- Die sechs technisch gepinnten Beherrschungs-Supports teilen die
  spielseitige Ausschlusskategorie `mastery`. Pro Fertigkeit kann deshalb
  höchstens eine Beherrschung verwendet werden.
- Verschiedene Stufen derselben Supportfamilie bleiben ebenfalls gegenseitig
  ausgeschlossen. Gespeicherte Altstände werden deterministisch bereinigt.
- Der Build-Variantenoptimierer verwendet jetzt dieselben harten Prüfungen für
  Schadensart, Mechanik, Waffenart, Ausschlüsse und freigegebene
  Recommended-Support-Referenzen wie die nachgelagerte Empfehlung.
- Die manuelle Supportauswahl blendet bereits durch Familie oder Kategorie
  ausgeschlossene Kandidaten aus.
- `Orb of Storms` bleibt ausschließlich für einen belegten Blitzzauber eine
  direkte Set-2-Vorbereitung. Für `Flameblast` beziehungsweise andere reine
  Feuerzauber wird diese Beziehung nicht erzeugt.
- Regression: 56 fokussierte Prüfungen für Support-Analyzer, gespeicherte
  Setups, RePoE-Katalog, Variantenoptimierer und Skill-Synergien erfolgreich.

## Zusammenhängende Skill- und Waffensetplanung (2026-07-27)

- Die produktive Oberfläche startet nun mit neun statt sechs Fertigkeitsplätzen.
- Automatische Buildvorschläge füllen freie Plätze nicht mehr mit lediglich
  ähnlich bewerteten Schadensfertigkeiten. Ohne belegte Beziehung bleibt ein
  Platz leer.
- Eine vorhandene manuelle Hauptfertigkeit bleibt maßgeblich. Die App ergänzt
  freie Plätze nach der Analyse ausschließlich mit regelbasiert verbundenen
  Vorbereitungs-, Debuff-, Buff-, Bewegungs- oder Defensivfertigkeiten.
- Exakt belegtes erstes Kombinationsmodell: `Orb of Storms` wird für Zauber,
  insbesondere Blitzzauber wie `Spark`, als anhaltende Vorbereitung auf
  Waffenset 2 geplant; der Hauptschaden bleibt auf Waffenset 1.
- Skills, Supports und Passive-Spezialisierungen bleiben getrennt berechnet.
  Ein Hauptskill erbt keine Eigenschaften des Vorbereitungsskills; die
  gemeinsame Wirkung entsteht über die belegte Ablaufbeziehung.
- Automatisch ergänzte Karten zeigen eine deutsche Zusammenhangsbegründung.
- Unverbundene Zweit-Schadensskills erhalten keinen Füllplatz und keinen
  positiven Synergiebonus.

## Supportkategorien pro Fertigkeit (2026-07-27)

- Aktuelle PoE2-Regel: Mehrere Exemplare beziehungsweise Stufen derselben
  Supportkategorie dürfen auf verschiedene Fertigkeiten verteilt werden, aber
  nicht gleichzeitig dieselbe Fertigkeit unterstützen.
- Die 451 getrennten Supportstufen bleiben als eigenständige Records erhalten.
  Zusätzlich verbindet `supportFamilyId` alle Stufen derselben technischen
  Supportkategorie ohne Namensheuristik über die gepinnte Record-ID.
- Automatische Empfehlungen und alle zielprofilspezifischen Supportranglisten
  liefern pro Fertigkeit höchstens eine Stufe jeder Supportfamilie.
- Die manuelle Auswahl blendet eine bereits belegte Supportfamilie aus und
  prüft sie zusätzlich beim Übernehmen.
- Gespeicherte Altstände mit zwei Stufen derselben Supportfamilie werden beim
  Laden deterministisch bereinigt; die zuerst gespeicherte Stufe bleibt bestehen.
- Keine globale Sperre: Dieselbe Supportfamilie darf weiterhin bei einer
  anderen Fertigkeit verwendet werden.

## Waffenset-Skilltreiber und Hauptschadensanzeige (2026-07-27)

- Korrektur nach Auftraggeberprüfung: Automatisch erzeugte
  Schadensfertigkeiten werden bei fehlender Set-Evidenz nicht mehr pauschal
  alle auf `Beide` gesetzt.
- Der automatisch gewählte Hauptskill beginnt auf Waffenset 1; die erste
  zusätzliche Schadensfertigkeit wird Waffenset 2 zugeordnet. Weitere
  Schadensfertigkeiten wechseln deterministisch zwischen beiden Sets.
- Utility-, Bewegungs- und Defensivfertigkeiten dürfen weiterhin `Beide`
  verwenden. Manuelle Setzuordnungen und bereits ausdrücklich set-spezifische
  Empfehlungen werden nicht überschrieben.
- Die Passive-Planung erhält für Set 1 und Set 2 nur noch die jeweiligen
  set-spezifischen beziehungsweise gemeinsamen Fertigkeiten. Ein Skill auf
  `Beide` wirkt weiterhin korrekt in beiden Profilen.
- Die Ergebniszusammenfassung leitet `Hauptschaden` vorrangig aus der
  tatsächlich gewählten Hauptfertigkeit ab. Passive- oder
  Aszendenznebenwerte dürfen die sichtbare Hauptschadensart nicht mehr
  überschreiben.
- Regression: `Flammenexplosion` wird als Feuerschaden angezeigt; ein
  Feuer-Hauptskill auf Set 1 und `Funken` auf Set 2 erzeugen getrennte
  Feuer-/Blitz-Skillprofile.

## Foto- und Screenshotmodus je Ausrüstungsslot (2026-07-24)

- Jeder Ausrüstungsslot bietet `Foto aufnehmen` und `Screenshot wählen`.
- Bilder werden ausschließlich lokal im Browser durch Tesseract.js 6.0.1
  verarbeitet; kein Upload, keine externe OCR-API und keine Speicherung im
  BuildProfile.
- Worker, Tesseract-Core 6.1.2 sowie deutsches und englisches Sprachmodell
  1.0.0 werden
  statisch unter `public/ocr/` ausgeliefert und sind Pages-/offlinefähig.
- OCR-Zeilen werden fail-safe gegen den bestehenden slot-, itemklassen-,
  Generation-Type- und Item-Level-gefilterten Affixbestand geprüft.
- Sichere tatsächliche Werte wählen die passende technische Affixstufe;
  unsichere Treffer bleiben prüfpflichtig oder deaktiviert.
- Der Nutzer bestätigt Kandidaten vor der Übernahme. Anschließend bleiben alle
  Daten im vollständigen manuellen Item-Editor korrigierbar.
- Normale Affixe, Implicits und Unique-Eigenschaften bleiben getrennt.
  Mehrdeutige Unique-Varianten werden nicht geraten.
- Browsernachweis: seltener Helm, Item-Level 70 und `+100 zu
  Treffgenauigkeit` wurden korrekt in Prefix 1 übernommen; ein unsicherer
  Hybridkandidat blieb blockiert.
- Mobile Prüfung bei 390 × 844: Dialogbreite 363,8 px bei 390 px Viewport,
  kein horizontaler Seitenüberlauf.
- Dokumentation: `docs/ITEM_PHOTO_AND_SCREENSHOT_OCR.md`.
- Nach Nutzerprüfung mit einem deutschen seltenen Ingame-Helm wurde die
  Zuordnung erweitert: deutsche Flexionen, `bis`/`zu`, die
  Beständigkeit-/Widerstand-Terminologie, Titelzeilen ohne `Rarity:`-Header
  und Seltenheitsableitung aus sicher erkannten Affixen werden jetzt
  unterstützt.
- Foto-OCR verwendet zusätzlich einen fokussierten Tooltip-Ausschnitt und
  drei kontrastierte Leseläufe. Menü-, Inventar- und Controllertexte sowie
  kurze unverständliche OCR-Fragmente werden vor der Produktübernahme
  verworfen. Prüfkandidaten werden pro erkannter Quellzeile auf den jeweils
  besten plausiblen Treffer begrenzt.
- Regression `DOOM CREST`/`AHNENTIARA`, Gegenstandsstufe 82: Basis,
  Seltenheit, `+120` Leben mit korrektem Tier und mindestens fünf sichtbare
  Affixe werden deterministisch erkannt.

## Numerische Schadensberechnung V1 (2026-07-24)

- Auftraggeberentscheidung: Schaden der tatsächlich eingegebenen Ausrüstung numerisch darstellen und Builds vergleichbar machen.
- Referenz: lokale statische PoB2-Skill- und Waffenbasisdateien am Pin `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`; kein Runtime-Netzwerk und keine Lua-Laufzeit.
- Neuer enger Scope: `poe2-pob2-damage-calculation-reference`, Projektentscheidung mit offengelegter Rechteunsicherheit; keine PoB2-/GGG-Genehmigung wird behauptet.
- Produktreferenz: `generated/pob2/damage-reference.json`, 337 Skillrecords, 354 Waffenbasen, Hash `193e1be36e90f6a130fa14e6c737302a41a63aabdcdae5e32e6fb4f3adfc3e22`.
- V1 berechnet Schaden pro Treffer, Aktionen pro Sekunde und begrenzten Trefferschaden pro Sekunde für eindeutig auflösbare Trefferangriffe und -zauber.
- Supports, Passive-/Aszendenzwerte, Krit, Gegnerabwehr, Ailments/DoT, Minions, Mehrfachtreffer und bedingte Effekte fehlen noch. Nicht auflösbare Fälle bleiben `nicht verfügbar`.
- Nächster Ausbau: numerische Supporteffekte, ausgewählte Baum-/Aszendenzstats, Gegnerprofile und Vergleich gespeicherter Ausgangs-/Zielstände.

## Vollständigerer Skill-/Supportkatalog (2026-07-24)

- Ausgangsbestand: 12 kuratierte Skills und 13 kuratierte Supports.
- Gepinnte Quelle: RePoE-PoE2 `4.5.4.4.4`,
  `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`,
  `data/skill_gems.json`, SHA-256
  `2c5a481f1147a87c844b1734a8fd2c660e4e13922145470ac72bca75095a69e3`.
- Produktfilter: `released`, herstellbar (`crafting_level > 0`), aktive,
  Spirit- oder Support-Gem, kein `Coming Soon`.
- Ergebnis: 219 aktive + 16 Spirit = 235 Skills sowie 451 getrennte
  Supportstufen.
- Nach Deduplizierung mit dem kuratierten Bestand zeigt die Produktoberfläche
  241 Fertigkeiten und 463 Unterstützungen.
- Die erwarteten 240/200 werden nicht erzwungen: Der Pin belegt fünf weniger
  auswählbare Skills; Supportstufen werden als getrennte Records geführt.
- Importierte Supports werden nur bei expliziter
  `recommended_supports`-Referenz positiv gerankt. Andernfalls bleiben sie
  auswählbar, aber `insufficient-semantic-evidence`.
- Keine Icons, Medien, Beschreibungen, Effekttabellen, Stat-IDs,
  Runtimequelle oder Rohspiegel.
- Neuer enger Scope: `poe2-repoe-skill-support-catalog`,
  `conditionally-approved` durch ausdrückliche Projektentscheidung mit
  offengelegter externer Rechteunsicherheit.

## Live-Suche für Fertigkeiten und sichtbare Supportplätze (2026-07-24)

- Fokus oder Antippen der Fertigkeitssuche öffnet unmittelbar eine sichtbare,
  scrollbare Trefferliste.
- Die Liste filtert während der Eingabe nach deutschem Namen und englischem
  Fallback.
- Jede leere Fertigkeitskarte zeigt fünf Supportplätze. Nach der Skillwahl
  besitzt jeder Platz eine eigene live-filternde Supportauswahl.
- Historischer Stand dieses UI-Zwischenschritts: 12 Fertigkeiten und 13
  Unterstützungen. Dieser Stand wurde am 24. Juli 2026 durch den gesondert
  gepinnten und freigegebenen RePoE-Auswahlkatalog (241/463 in der
  Produktoberfläche) abgelöst.

## Deutsche Normal-Affix-Anzeigeschicht (2026-07-24)

- Alle 2.255 produktiven normalen Affixe besitzen nun einen deutschen Anzeigetext.
- 2.169 Anzeigen werden über den gepinnten lokalen deutschen CSD-Bestand und technische Stat-ID-/Werteketten aufgelöst.
- 86 Hybrid- und Sonderzeilen verwenden eine separat gekennzeichnete deterministische App-Anzeigeübersetzung.
- `translation-missing`: 0.
- Englische technische Produktdaten, Stat-/Mod-IDs, Affixwerte, Analyzer, Datenpins und Unique-Daten bleiben unverändert.
- Generator: `scripts/poe2-affix-german-display/generate.mjs`.
- Anzeigeschicht: `generated/localization/de/poe2-affixes.json`.
- Coverage: `docs/audits/poe2-german-affix-display-coverage.json`.
- Nächster Schwerpunkt aus der Auftraggeberliste: automatische Befüllung leerer Fertigkeitskarten nach der Analyse beziehungsweise vollständigerer Skill-/Supportbestand.

## Hauptaufgabe V1.2 – funktionale Vollständigkeit

- Ausgangscommit: `1242dd78f0bb4eedacaeb03505390704aefa78d1`.
- Auftraggeberentscheidung: Version 1 wird zuerst funktional abgeschlossen; Design, mobile Benutzerführung, deutsche Restdarstellung und sprachlicher Feinschliff folgen getrennt.
- Das vollständige Funktionsinventar steht in `docs/BUILD_ASSISTANT_V1_2_FUNCTIONAL_COMPLETENESS.md`.
- Die bestehende Architektur bleibt unverändert maßgeblich: Eingabe → BuildProfile → Analyzer → Aggregation → deutsche Ergebnisansicht.
- Geschlossene Kernlücken: erkannte Waffenarten und tatsächlich belegte Waffensets erreichen Skill-, Support-, Unique- und Rotationslogik; ein leeres Set 2 ist keine Wechselgrundlage.
- Rotationen verwenden nur den gewählten Hauptskill und tatsächlich konfigurierte Skill-Setups. Fehlende Rollen werden nicht erfunden.
- Der vorhandene Compact-Passive-Plan ist mit Reihenfolge, Punktkosten, Pfadknoten und Baumfokus in den zusammenhängenden Build-Vorschlag eingebunden.
- Mapping und Boss zeigen nun jeweils die bereits vorhandenen Support-, Passive-, Juwel- und Unique-Ranglisten.
- Nächste Verbesserungen berücksichtigen zusätzlich belegten Widerstands- und allgemeinen Verteidigungsbedarf.
- Offline-Status: statischer lokaler Datenbestand, keine Runtime-API, keine Rohquelle und kein Hotlink als Funktionsvoraussetzung; keine neue PWA-Stufe.
- Datenpins und Produktdateien bleiben unverändert. Keine neue Datenquelle, Übersetzungsphase, Designphase oder allgemeine Architekturänderung.
- Geparkt bleiben normale englische Affixtexte, sichtbare technische Begriffe, `Accuracy|Accuracy|`, mobiler Affixdialog, Zeilenumbrüche, visuelle Hierarchie, Tier-/Item-Level-Gewichtung, Abstände, Schriftgrößen, Touchflächen und Unique-Sprachfeinschliff.
- Funktionaler V1-Abschlussstatus: alle bestätigten Pflichtlücken sind geschlossen; fehlende fachliche Grundlagen bleiben offen als `Unbekannt` oder eingeschränkte Funktion.
- Prüfstatus: 51 fokussierte V1.2-/Rotationsprüfungen, 95 Grenz-/Approval-Prüfungen und die vollständige Suite mit 1.012/1.012 Tests erfolgreich; drei zeitkritische Passive-Performanceprüfungen zusätzlich seriell erfolgreich.
- Lint, Typecheck, Produktions-Build, Pages-Build, 132 JSON-Dateien, `git diff --check` und Git-Sicherheitsprüfung erfolgreich.
- Technische Browserprüfung: Desktop-End-to-End-Ergebnis mit Mapping-/Boss-Ranglisten; 390 × 844 ohne horizontalen Seitenüberlauf, Dialog innerhalb des Viewports, Berechnung erreichbar und Ergebnis sichtbar. Keine neuen Browserfehler oder -warnungen.
- Der lokal geladene Build berechnet vollständig aus gebündelten Daten; kein Laufzeit-Netzwerkzugriff wurde beobachtet. Eine neue Service-Worker-/PWA-Stufe ist weiterhin nicht Bestandteil von V1.2.
- Abschlusscommit der funktionalen Implementierung: `982eb50c62731757b36673d10ec5e43417c32811`.
- GitHub Pages: Workflow „Deploy GitHub Pages“, Lauf 54, erfolgreich; HTTP 200 und V1.2-Asset `index-C3Oush7P.js` ausgeliefert.
- Nächster Auftrag: getrennte Design-, deutsche Darstellungs- und Benutzerfreundlichkeitsphase.

## Hauptaufgabe V1.1 – semantische Analyzer-Breite

- Ausgangscommit: `143e605b3af83e9ed446e27c5c20ba7a1a03ffb0`.
- Die V1-End-to-End-Architektur bleibt unverändert; Orchestrator, BuildProfile, Aggregation und Scoremodelle bleiben maßgeblich.
- Produktive Kandidaten: Skills 6→12, Supports 5→13, Juwelen/Cluster 7→13.
- Affix-Coverage: 2.255 technische Affixe, 1.507 semantisch klassifiziert, 406 mehrzeilig/teilweise abgeleitet, 748 ungelöst.
- Unique-Semantik: 435 Items/579 Varianten; 147 `structured-exact`, 14 `structured-derived`, 274 `text-pattern-exact`. 288 Items liefern produktiv nutzbare Tags oder Restriktionen.
- Evidenzklassen sind `structured-exact`, `structured-derived`, `text-pattern-exact`, `text-pattern-ambiguous` und `unresolved`.
- Nur gemeinsame Variantenzeilen dürfen itemweite Semantik erzeugen. Legacy-only-Eigenschaften werden nicht übertragen.
- Keine technische GGG-ID, keine deutsche Anzeigeschicht als technische Quelle, kein Fuzzy Matching, keine neue Datenquelle und kein Scraping.
- PoB2-Produktpin, RePoE-/GGG-Pins, englische Produktdatei und deutsche Anzeigeschicht bleiben unverändert.
- Hauptskill-Suche und verständliche Unique-Evidenzanzeige ergänzen die vorhandene deutsche UI.
- Coverage und Vorher-/Nachher-Grenzen stehen in `docs/BUILD_ASSISTANT_V1_1_SEMANTIC_EXPANSION.md`.

## Abschlussstatus 5M.2.10 – deutsche PoB2-Unique-Lokalisierungsstrategie

- Ausgangscommit: `8bc97c1e73c2be81134fbb2ea1e9bd2e50360d75`.
- Der englische PoB2-Produktbestand blieb bytegleich: 435 Items, 579 Varianten, 2.345 Modzeilen, 273 Implicits; SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`.
- Geprüfte lokale Quellen: 589 CSD-Dateien, 5.476 englische/deutsche BaseItemTypes, 3.246 englische/deutsche Words-Records, ItemClasses und die Unique-DAT-Audits aus 5M.2.6.
- Namen: 434 eindeutige sichtbare Words-Kandidaten, ein mehrdeutiger Kandidat, 0 sichere Produktjoins.
- Basistypen: 425 eindeutige Textkandidaten, zehn mehrdeutige Kandidaten, 0 sichere Produktjoins.
- Modzeilen: 759 eindeutige und 355 mehrdeutige Templatekandidaten, 1.231 ohne lokalen Kandidaten; 0 technisch sichere deutsche Zeilen.
- Implicits: 57 eindeutige und 46 mehrdeutige Kandidaten, 170 ohne Kandidaten; 0 technisch sichere deutsche Implicits.
- Varianten: 579 variantenspezifisch ungelöst; Current/Legacy dürfen nur als UI-Systemtexte behandelt werden.
- Alle Kandidaten bleiben Audit-only. Keine Namens-, Text-, Basis- oder Zahlenheuristik wurde als Produktwahrheit verwendet.
- Getrenntes Zielmodell: `generated/localization/de/pob2-uniques.json`, in dieser Aufgabe nicht erzeugt; Join nur über stabile `pob2:`-, Varianten- und Zeilen-IDs nach eigener technischer Identitätsfreigabe.
- Gesamtstatus: `audit-only-no-safe-product-link`.
- Keine deutschen Unique-Produkttexte, keine automatische oder KI-Übersetzung, keine erfundenen GGG-IDs, keine externen Anfragen.
- Empfohlener nächster Schritt: 5M.2.10A, Offline-Audit einer stabilen Unique-Identitätsbrücke. Ein deutscher Import kann davor nicht beginnen.
- 5M.2 und 5N sind weiterhin nicht begonnen.

## Aufgabe 5M.2.8B – Auftraggeberentscheidung (2026-07-23)

## Abschlussstatus 5M.2.9

- Ausgangscommit `544d43279ae9369adaffc264b97873610fd4384b`; 5M.2.8B abgeschlossen.
- Buildzeitlicher Offline-Importer unter `scripts/pob2-unique-import/`; kein Lua und kein Runtime-Netzwerk.
- 20 gepinnte Dateien aus PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.
- Produkt `generated/pob2/uniques.json`; SHA-256 `db3837b51c18fcae5e01572ef437a0f67186183f715402ac9cddb372c19a2452`; Fachhash `a5a7e7bac84bb5d921002a83efa6a16e96fec794bead9664dbf7de0bd7f04329`.
- 435 Uniques, 579 Varianten, 2.345 Modzeilen, 273 Implicit-Zeilen und 1.689 Rollbereiche.
- 104 Skillhinweise auditseitig erkannt, null Skills/Supports produktiv importiert.
- Vollständige Provenienz; Source Kind `pob2-planner-data`; GGG Identity `unknown`.
- Produktregistry stellt dem bestehenden Unique Analyzer 435 Kandidaten bereit; der passive Compact-Worker bleibt unverändert und transportiert keine unnötige Unique-Gesamtregistry. Fixtures bleiben test-only getrennt.
- Englisch ist Quelle; 435-mal Deutsch `translation-missing`; keine deutschen Unique-Texte.
- Zwei Importläufe byteidentisch. Normale Affixe, Craftingdaten, Medien, Flavour Text, Hotlinks, Runtime-Netzwerk und erfundene GGG-IDs bleiben ausgeschlossen.
- Keine externe Genehmigung wird behauptet; bekannte Unsicherheit bleibt dokumentiert.
- Verifikation: 984/984 Gesamttests, 45/45 finale Approval-/Importtests, Lint, Typecheck, Produktions- und Pages-Build, JSON und Git-Sicherheit erfolgreich.
- GitHub Pages: neuer Asset-Fingerprint `index-Bw9HqsFF.js` deployt; Desktop und 390 × 844 ohne Seiten-Horizontalüberlauf und ohne neue Konsolenfehler/-warnungen geprüft.
- 5M.2 und 5N weiterhin nicht begonnen.

- 5M.2.8A endete historisch mit `distribution-pending-both`.
- Der Auftraggeber hat ausdrücklich entschieden, keine externen
  Einzelanfragen an PoB2, Path of Building Community oder GGG zu verfolgen.
  Beide Entwürfe bleiben `not-pursued`, wurden nicht versendet und erhielten
  keine Antwort.
- Keine externe Genehmigung und keine vollständig geklärte Rechtslage werden
  behauptet. Die Datenlizenz bleibt teilweise `Unbekannt`.
- Neuer aktiver Status:
  `distribution-project-approved-with-disclosed-uncertainty`.
- Projektentscheidungswert: `approved-with-disclosed-uncertainty`.
- Externe Permission:
  `not-requested-not-obtained-not-required-by-project-policy`.
- Unsicherheit:
  `unresolved-external-rights-disclosed-and-accepted-by-project-owner`.
- Nur `poe2-pob2-unique-planner-data` wurde geändert; andere pending oder
  blocked Scopes bleiben unverändert. Kein generischer Risiko-Bypass.
- Der Guard verlangt weiterhin exakten Commit, eine der 20 Dateien, exakten
  SHA-256, Feldallowlist, Provenienz, Attribution, Lizenzhinweis,
  Quellenkennzeichnung, deterministische Normalisierung und den exakten
  Produktpfad. Rohmirror, Medien, Flavour Text, Netzwerk, Hotlinks, Scraping,
  reguläre Affixe und GGG-ID-Behauptungen bleiben gesperrt.
- Importvertrag Version 2 erlaubt 5M.2.9 grundsätzlich. Deutsche
  Unique-Texte bleiben `not-approved`; Englisch beziehungsweise
  `translation-missing` bleibt erforderlich.
- Keine PoB2-Produktdaten oder Produktdateien wurden in 5M.2.8B erzeugt.
  UI, Engine, Worker, Analyzer, BuildProfile und reguläre Affixdaten blieben
  unverändert.
- Nächste Aufgabe: 5M.2.9 unter dem exakten Importvertrag.
- 5M.2 und 5N wurden weiterhin nicht begonnen.

## Aufgabe 5M.2.8A – PoB2-Unique-Distribution (2026-07-23)

- 5M.2.8 ist abgeschlossen; 20 statische Unique-Dateien sind exakt gepinnt
  und gehasht, aber es wurden weiterhin keine Produktdaten importiert.
- Alle 20 Dateien tragen den Header `Item data (c) Grinding Gear Games`.
  Ihre Git-Historie zeigt Export-, Patch- und Communitypflege; eine
  recordgenaue Herkunft ist teilweise `Unbekannt`.
- PoB2-Code ist am Pin MIT-lizenziert. Eine ausdrückliche MIT-Lizenzierung
  der GGG-gekennzeichneten statischen Daten ist nicht belegt
  (`license-scope-unknown`).
- Die offiziellen GGG-Bedingungen und Developer-Dokumente wurden geprüft.
  Für Speicherung und öffentliche Distribution des geplanten reduzierten
  Nicht-API-Datensatzes fehlt eine schriftliche GGG-Bestätigung.
- Es wurde keine vorhandene eindeutige PoB2-Maintainerfreigabe gefunden.
  Zwei reviewbare Entwürfe für PoB2 und GGG wurden erstellt und nicht
  versendet.
- Historischer 5M.2.8A-Endstatus: `distribution-pending-both`. Option D war
  damals maßgeblich; der damalige Guard blockierte Produktimport,
  `generated/`, `public/` und 5M.2.9. 5M.2.8B hat diesen technischen Status
  durch die ausdrücklich dokumentierte Auftraggeberentscheidung abgelöst.
- Attribution ist für README, Datenquellendokumentation,
  `THIRD_PARTY_NOTICES.md` und eine spätere sichtbare App-Info geplant. Der
  endgültige Wortlaut bleibt pending.
- Reguläre GGG-/RePoE-Affixe, Produktivpins, Approval-Trennung,
  `translation-missing`, UI, Analyzer, Engine, Worker und BuildProfile
  bleiben unverändert. Deutsche Unique-Texte sind nicht freigegeben.
- Nächster Schritt: Entwürfe menschlich prüfen und manuell an PoB2 und GGG
  senden; beide schriftlichen Antworten anschließend in einer separaten
  Approval-Entscheidung auswerten.
- 5M.2, 5M.2.9 und 5N wurden nicht begonnen. Fotoerkennung bleibt später.

## Aufgabe 5M.2.7 – Unique-Quellenentscheidung (2026-07-23)

- 5M.2.6 belegt lokal keine vollständige Item-Unique-ID→Base→Mod/Stat-Kette. 5M.2.7 priorisiert deshalb diese Quellenentscheidung vor regulärer Lokalisierung, OCR, Socketables, 5M.2 und 5N.
- Offizielle GGG-Dokumentation/Exports, RePoE, PoB2, poe2-mcp, PoBR, Communityprojekte sowie Wikis/Webseiten wurden klassifiziert. Trade/PoE2DB wurden nicht als Datenquellen aufgerufen; kein Scraping, Hotlink oder Runtime-Abruf.
- Vertieft und exakt gepinnt: RePoE-PoE2 `1a6066ec60d24af274cb7a87d00b6ab1c0975ebd`, PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`, poe2-mcp `163c30a9fd45f815d330cc54e6ab51a797693d31`.
- RePoE hat weiterhin 449 name-/stashbasierte Unique-Zeilen ohne Base-/Mod-/Statbezug. PoB2 besitzt sichtbare Items/Varianten ohne technische Spiel-IDs; poe2-mcp allgemeine Mods ohne Unique-Itemschicht.
- Keine Einzelquelle und keine ID-sichere Kombination liefert die vollständige Kette. Deutsche CSD-Verbindbarkeit und Renderbarkeit bleiben deshalb nicht bestimmbar.
- Code-Lizenzen und GGG-Datenstatus sind getrennt; Distribution bleibt `pending`/`legal-status-unknown`. Solange die technische Quelle fehlt, wird keine Approval-Aufgabe empfohlen.
- Keine Unique- oder deutschen Produktdaten, keine Volltexte, keine Produktdateien, keine UI-/Engine-/Worker-/Analyzeränderung. Produktivpin, Approval und `translation-missing` bleiben unverändert; 5M.2 und 5N sind nicht begonnen.
- Nächster Schritt: offizieller oder reproduzierbarer ID-basierter Unique-Definitionsbestand und erst danach separate Pin-/Approval-/Distributionsaufgabe. Details: `docs/POE2_UNIQUE_SOURCE_CANDIDATE_DECISION.md`.

## Aufgabe 5M.2.4 – Offline-Referenztabellenextraktion (2026-07-23)

- 5M.2.3 ist abgeschlossen; 5M.2.4 erweitert dieselbe Auditpipeline ohne Produktimport. Content-Pin `a917a56f...8a18e28`, PoB2 `c5300ccd`, ooz `0.2.4`, Schema `268ae3a3`, Referenzmanifest `a4bbcd99` und Auditformat 2 sind erzwungen.
- Zwei Offline-Extraktionen lieferten je 22/22 Dateien und 11.884.854 Bytes; zwei Audits waren byteidentisch (`0ce6cb7b...848b7`). Kein HTTP/HTTPS/DNS/API, keine Trade-API, kein PoE2DB, keine Webseite.
- ItemClasses: 117 Zeilen, je ein unbekanntes Byte in englischer und deutscher Tabelle; 33 Produktklassen und `Charm` bleiben ungelöst. Das Byte wurde nicht geraten oder ignoriert.
- 2.255 Produktmods bleiben `partially-resolved`: IDs, Statfolgen, Werte, Tags und Spawnweight-Arrays stimmen; `ModDomains`/`ModGenerationTypes` existieren nicht als lokale DAT-Dateien, `ModFamily` ist keine belegte Konfliktgruppe.
- Deutsche Coverage bleibt: 12 Stat-IDs ohne deutsche CSD-Struktur, 38 Templatelücken und 2.189 OCR-Mehrdeutigkeiten ungelöst. `translation-missing` bleibt produktiv.
- Unique-bezogene Tabellen (449 Stash-, 48 Chest-, eine Mutated-Zeile) bilden keine Unique-ID-Kette. Keine Unique-Freigabe.
- Soul-Core-Audit: 295 Identitätszeilen, 507 Statzeilen, 30 Kategorien, strukturierte StatsValues; Identitätsbyte und Bonded-/Zielkette bleiben offen. Runen/Idols/Abyssal Eyes/Congealed Mist bleiben unbekannt. Keine Socketable-Freigabe.
- Produktivpin und `source-approval.json` bleiben unverändert; keine deutschen Volltexte, Rohdaten oder Produktdateien committed; keine UI-, BuildProfile-, Worker-, Analyzer-, Engine-, Passive-, Baum- oder Planänderung.
- 5M.2 und 5N sind nicht begonnen. PS-Nutzer benötigen später ausgelieferte, separat freizugebende Sprachdaten. Fotoerkennung, Lernmodus, Buildvergleich, Designoptimierung und mobile Textklippung bleiben offen.
- Nächster Schritt: audit-only Schemaentscheidung für die unbekannten ItemClasses-/SoulCores-Bytes und nicht materialisierten Enumtabellen. Details: `docs/POE2_OFFLINE_REFERENCE_TABLE_EXTRACTION.md`.

## Aufgabe 5M.2.0 – deutsche Gegenstandslokalisierung, Quellenentscheidung (2026-07-22)

- Reine Auditentscheidung: keine deutschen Produktivtexte, keine freie/KI-Übersetzung, keine PoE2DB-Automation und keine UI-, BuildProfile-, Worker-, Analyzer-, Engine- oder Baumänderung. `translation-missing` bleibt produktiv.
- Bestand: 2.255 eindeutige Mods, 2.705 Statzeilen, 431 Stat-IDs, 444 geordnete Stat-ID-Kombinationen, 429 Mehrzeiler/Hybride, 39 zusätzliche Basistypen und 33 referenzierte Itemklassen.
- RePoE `4.5.4.4.4`/`b3f38149` besitzt 589 StatDescription-Dateien und deckt 419/431 Produkt-Stat-IDs technisch ab, enthält aber 0 befüllte deutsche Einträge. Parser `14e3edc8` unterstützt `de_DE.utf8`; Remote-HEAD war identisch. Kein lokaler Client war an drei Standardpfaden verfügbar.
- Alle deutschen Stat-, Mod-, Base-, Klassen-, Socketable- und kuratierten Mapping-Scopes bleiben `pending`; photo-derived Mapping bleibt `blocked`. Repository-Weitergabe ist **Unbekannt** und verlangt eine eigene Entscheidung.
- 5M.2 und 5N sowie Fotoerkennung und lokaler Lernmodus sind nicht begonnen. Mobile Textklippung aus 5M.1B bleibt offen. Details: `docs/POE2_GERMAN_ITEM_LOCALIZATION_SOURCE_DECISION.md`.

## Status 5M.1B.0C – Socketable-/Spezialmod-Quellenentscheidung (2026-07-22)

- RePoE `augments.json` belegt 295 technische Socketable-Identitäten: 221 Rune, 34 SoulCore, 35 Idol, 4 AbyssalEye und 1 CongealedMist. Nur minimale technische Identitätsfelder sind unter exakten Pins `conditionally-approved`; es wurde nichts importiert.
- Moddaten bleiben `pending`, weil `augments.py` zwar `StatsValues`/`BondedStatsValues` liest, sie aber nicht strukturiert exportiert. Desecrated und Anointments sind deferred/pending, Mutated bleibt wegen Unique-Kopplung blocked, Enchantments und weitere Corruption-Mods bleiben pending.
- Die vorhandenen 103 Corruption-Implicits und 110 Corruption-Upgrades sowie alle neun 5M.1-Dateien bleiben unverändert; kein Doppelimport. Keine zusätzlichen Itemklassen, Uniques, deutschen Texte, UI-, Engine-, Worker- oder Analyzeränderungen.
- 5M.1B, 5M.2 und 5N sind nicht begonnen. Vor Socketable-Modimport ist ein neu gepinnter verlustfreier Parserexport der normalen und bonded Werte erforderlich. Details: `docs/POE2_SOCKETABLE_AND_SPECIAL_MOD_SOURCE_DECISION.md`.

## Aufgabe 5M.1B.0B – Unique-Quellenentscheidung

- Commit-genau geprüft: RePoE-PoE2 `b3f38149`/Parser `14e3edc8`, PoB2 `dev@f5b94342`, archiviertes PoB2-v2 `7e047f0e`, poe2-mcp `163c30a9` und PoBR `ff1d07da`.
- Keine Quelle liefert eine vollständige ID-basierte Item–Base–Mod–Stat–Varianten-Beziehung. RePoE hat 449 Stashzeilen/441 Namen ohne Base-/Modlink; PoB hat 435 statische Textblöcke, 579 Variantenzeilen und 2.704 sichtbare Modzeilen ohne technische Unique-/Mod-/Stat-ID; poe2-mcp hat technische Mods, aber keine Unique-Item-Tabelle; PoBR ist derivative PoB-Kontrollquelle.
- Unique-Identität bleibt `pending`; Unique-Mods, Varianten und item-granted Effect-Referenzen bleiben `blocked`. Keine Quelldatei und kein Feld wurde für einen Import freigegeben. Unique-Jewels, -Charms und -Flasks sind nicht durch 5M.1B.0A freigegeben.
- Der Analyzer bleibt `0.7.0-synthetic` mit 16 synthetischen Fixtures. Reale Varianten, lokale Waffenwerte, granted Skills/Supports, Charm-/Flasktrigger, Jewel-Radius und gekoppelte Effekte bleiben unsupported.
- Keine Unique-Daten oder Produktdateien, keine UI-/Engine-/Analyzer-/Worker-/BuildProfile-Änderung, keine deutschen Texte. Runen, Soul Cores, Desecrated/Mutated Mods und Medien bleiben gesperrt. 5M.1B, 5M.1B.0C, 5M.2 und 5N wurden nicht begonnen; physische iPhone-Abnahme offen.
- Maßgeblich: `docs/POE2_UNIQUE_ITEM_SOURCE_DECISION.md` und `docs/audits/poe2-unique-source-comparison.json`.

## Aufgabe 5M.0 – kontrollierte Affixquellenfreigabe

- RePoE-PoE2 ist ausschließlich im Scope `poe2-technical-affix-data-for-build-planner` `conditionally-approved`: Version `4.5.4.4.4`, Exportcommit `b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, geprüfter Parsercommit `14e3edc89ed705bd4e4eda5c8135756431c76e81`.
- Zulässig sind nur normalisierte technische Affix-/Mod-/Stat-IDs, Prefix/Suffix, Tiers, Werte, Item-Level, Itemklassen, Tags, Spawnregeln, Gruppen/Konflikte und Lokalität. Pflicht: Pinning, SHA-256-Manifest, Attribution, deterministischer Offlineimport, kein Rohdatenspiegel, Entfernbarkeit und erneute manuelle Freigabe bei jedem Wechsel.
- Dies ist eine bewusste Projektrisikoentscheidung, keine allgemeine GGG-Datenlizenz. RePoEs MIT-Lizenz gilt für Software; generierte Daten werden dort ausdrücklich GGG zugeordnet. Commercial Use bleibt ungeklärt.
- Path of Building PoE2 wurde als technisch breite, aber laufzeitspezifische und ebenfalls aus Spieldaten abgeleitete Alternative geprüft; es ist keine 5M-Importquelle. Das archivierte `PathOfBuilding-PoE2-v2` ist veraltet.
- PoE2DB und `display-names` bleiben `blocked`. PoE2DB ist ausschließlich manuelle deutsche Sprach-/Darstellungsreferenz. Nicht eindeutig über technische IDs zugeordnete Texte bleiben `translation-missing`; kein Code, HTML, CSS, Asset, Dump, API- oder Laufzeitabruf.
- Der technische Teil von 5M darf nach neuem Auftrag unter diesen Bedingungen beginnen. 5M.0 hat keine Daten importiert, UI/Engine nicht verändert, keine Übersetzungen erzeugt und Aufgabe 5N nicht begonnen.
- Maßgebliche Detailentscheidung: `docs/POE2_AFFIX_SOURCE_DECISION.md`.

## Aufgabe 5L – reale Pfade im Baum

- `buildPassivePlanVisualization` ist die einzige Grenze vom Compact-Ergebnis zur Baumdarstellung. Sie validiert Source/Hash, Node-/Connection-IDs, Zusammenhang, Layout-/Effekt- und Aszendenzgrenzen; es gibt keine UI-Pfadsuche, Zielsortierung oder Budgetberechnung.
- Der vorhandene Baum rendert zusätzliche nicht interaktive Pfad-/Knotenoverlays mit derselben geraden beziehungsweise Orbitgeometrie. Offizielle Motive, Rahmen, Positionen, zentrale Aszendenz, Pinch/Pan, Suche, Filter und Inspektion bleiben erhalten.
- Plan ein/aus und „Plan im Baum anzeigen“ sind bewusste Nutzeraktionen. Completed/partielle Fachresultate erscheinen; stale bleibt gestrichelt, gedimmt und textlich veraltet; laufend, abgebrochen, fehlgeschlagen oder ungültig wird nicht als aktueller Plan gezeigt.
- Targeting, Scores, Tie-Breaker, Pathfinder, Planner, Pipeline, Haupt-Orchestrator, Budgetregeln und Workerprotokoll sind fachlich unverändert. Keine Affix-, Skill- oder Supportdatenänderung. Physische iPhone-Abnahme offen; Aufgabe 5M nicht begonnen.
- Weiter offene Daten-/Produktaufgaben: vollständige reale Affixdaten; deutsche sichtbare Affixnamen/-beschreibungen; vollständige Skilldaten mit deutschen sichtbaren Namen/Beschreibungen; vollständige Supportdaten mit deutschen sichtbaren Namen/Beschreibungen; PoE2DB ausschließlich als deutsche Referenz prüfen, nicht automatisch als technische Wahrheit; Buildvergleich vorher/nachher; Fotoerkennung für Ausrüstung; Designoptimierung für bessere Bedienbarkeit.
- Lokaler Produktionsbrowser: `partial` mit 8 Knoten, 7 Kanten und 2 Zielen erzeugte exakt 8/7/2 Zusatzoverlays bei 17.974 SVG-Nachfahren; Planfokus nur per Button, Zoom danach stabil, stale 8 gedimmte Ringe/7 gestrichelte Kanten, Suche/Filter erhalten den Plan, null Console-Warnungen/-Fehler. Die 390×844-Viewportvorgabe wurde technisch nicht übernommen; mobile Automation und physisches iPhone bleiben offen.

## Nachbesserung 5K.1 – Browserlaufzeit

- Die 8,9–9,7 Sekunden stammen nach Messung nicht aus React, doppelten Requests, Graph- oder Context-Neuaufbau, sondern aus der unveränderten 5K-Planning-Anfrage mit Pool 50 und bis zu 20 Zielen. Reproduziert: 11.511,25 ms Worker, davon 11.211,82 ms Planning und 193,05 ms Targeting; Graph-/Context-Aufbauten null.
- Genau ein workerlokaler Eintrag beantwortet nur ein exakt identisches validiertes Analyze-Payload mit dem unveränderten letzten Compact-Ergebnis. Eingabeänderung, Reinitialisierung, Dispose oder harter Abbruch verhindern beziehungsweise löschen den Treffer. Kein globaler Cache, Storage oder externer Zugriff.
- UI-Request 16.882 B ohne Baum/Graph/Context; Compact 804.888 B. Sechs identische Läufe behielten `fnv1a32-5d6ef45a`; fünf Dispatcher-Treffer lagen bei 0,04–0,09 ms. Pro Klick genau eine Workeranfrage; Cache-Miss genau ein, Cache-Treffer null Orchestratoraufrufe.
- Targeting, Scores, Pathfinder, Planner, Budget, Required-Ziele, Pipelineplan, Ergebnisansicht, Baum und Gesten bleiben unverändert. Geänderte Eingaben bleiben wegen der vollständigen 50/20-Planung langsam. Physische iPhone-Abnahme offen; Aufgabe 5L nicht begonnen.
- Lokaler Pages-Produktionsbrowser: geänderte Anfrage 9.439 ms gesamt/9.032,80 ms Worker; fünf identische Wiederholungen konservativ 619–661 ms bis UI-fertig, Median 630 ms einschließlich 250-ms-Wartezeit und Teststeuerung, Worker 0,00–0,20 ms. Harter Abbruch nach Eingabeänderung zeigte Neuinitialisierung nach 514 ms; keine Browserwarnungen/-fehler. Die 390×844-Übersteuerung blieb wirkungslos, daher mobile Automation und physisches iPhone ausdrücklich offen.

## Aufgabe 5K – kontrollierte UI-Integration

- `src/features/real-passive-analysis/` bildet genau eine React-nahe Grenze: reiner Adapter, sitzungsweiter Controller und textliche Compact-Ansicht. React verwendet ausschließlich den öffentlichen 5J-Client.
- Initialisierung und Analyse sind getrennte Nutzeraktionen. Keine automatische Analyse, kein Budget aus Level/Quests/Aszendenz und keine erfundenen Required-Ziele oder Filter.
- Start kommt ausschließlich aus dem offiziellen Klassenregister. Fachliche Eingabesignaturen markieren alte Ergebnisse `stale`; visuelle Bauminteraktion zählt nicht als Änderung.
- Harte Cancellation verwirft das Resultat und verlangt Neuinitialisierung. Echte Stufen erscheinen zentral deutsch ohne Prozentwerte; Compact bleibt Standard.
- Keine Pfad-/Knotenmarkierung oder Kamerabewegung; Renderer, Engine, Targeting, Pathfinder, Planner und Pipeline bleiben unverändert. Physische iPhone-Abnahme offen. Fotoerkennung, Buildvergleich, Designoptimierung und Aufgabe 5L bleiben offen.
- Dokumentation: `docs/POE2_REAL_PASSIVE_UI_INTEGRATION.md`.

## Aufgabe 5J – Browser-Laufzeitarchitektur

- `src/runtime/real-passive-worker/` kapselt genau einen versionierten Module-Worker-Client und Dispatcher außerhalb der Engine. Der Dispatcher ruft ausschließlich `analyzeBuild` über die 5I-Grenze auf.
- Gewählt ist Architektur C: lokaler gepinnter Baum wird im Worker gebündelt; Graph und Prepared Context werden dort einmal aufgebaut und bis Dispose wiederverwendet. Keine Übertragung dieser Maps/Sets, kein globaler Cache, Storage oder externer Fetch.
- Protokoll 1.0.0, eindeutige Request-IDs, strukturierte Fortschritts-/Fehler-/Cancelnachrichten, eine aktive Analyse, keine Queue. Compact wird erzwungen; Full verlässt den Worker nicht.
- Aktiver Abbruch terminiert den synchron rechnenden Worker ehrlich hart. Resultat wird verworfen, Graph/Context gehen verloren, Neuinitialisierung ist erforderlich; kein kooperativer In-Run-Abbruch wird behauptet.
- Vite baut `realPassiveWorker-<hash>.js` lokal unter dem Pages-Basispfad. Die API wird von React noch nicht gestartet; keine Pfadvisualisierung, Budgetableitung oder Knotenaktivierung. Physisches iPhone nicht geprüft. Aufgabe 5K nicht begonnen.
- Desktop-Browser-Smoke: Module-Worker bereit nach 1.893,60 ms, fünf echte Initialisierungsstufen, 5.150/6.067 Graphbestand, maximale beobachtete 10-ms-Timerdrift 1,30 ms, keine Konsolenfehler. Dies ist keine mobile Ruckelfreiheitsgarantie.
- Dokumentation: `docs/POE2_REAL_PASSIVE_BROWSER_RUNTIME.md`.

## Nachbesserung 5I.1 – Laufzeit und Ergebnisgröße

- Ausschließlich die technische 5I-Grenze wurde optimiert. Targeting-Regeln, Scores, Tie-Breaker, Coverage, Budget, Required-Ziele, Start/Version, Pathfinder, Planner, synthetischer Analyzer, UI und Baumrenderer sind fachlich unverändert.
- `compact` ist Standard von `EngineRequest.realPassivePlanning`; `full` bleibt explizit verfügbar und der direkte `runRealPassivePipeline`-Vertrag bleibt vollständig.
- Genau `projectRealPassivePipelineResult` projiziert auf Plan, IDs, Pfade, Teilbaum, Budget, Required-Diagnosen, Issues, Stufensummaries und unveränderten fachlichen Hash. Keine 5.150er-Rangliste oder Graphkopie in Compact.
- `preparePassiveTargetingContext` hält ausschließlich baumabhängige Klassifikationen. Format, Source-Version und Baumidentität werden geprüft; Profile, Scores und Pläne sind ausgeschlossen. Explizite Wiederverwendung statt globalem Cache.
- 0.5.2-Mehrlaufmessung, Node 24.14.0/Windows x64: Pipeline-Median 2.064,76 ms ohne Context und 414,43 ms mit Context; Targeting-Median 1.797,04 ms gegenüber 134,08 ms; Compact 717.622 B gegenüber Full 34.896.120 B (−97,94 %). Context-Aufbau 1.866,44 ms; drei Profile mit Graph/Context 1.379,08 ms. Heapwerte sind GC-bedingt keine Garantie.
- Keine UI-Anbindung oder Pfadvisualisierung; mobile Eignung nicht behauptet. Aufgabe 5J wurde nicht begonnen. Bericht: `docs/POE2_REAL_PASSIVE_PERFORMANCE_OPTIMIZATION.md`.

## Aufgabe 5I – reale Passive-Pipeline im Haupt-Orchestrator

- `EngineRequest.realPassivePlanning` aktiviert die reale Pipeline ausschließlich explizit; alte Aufrufe erzeugen weder Graph noch Pipelinefeld oder zusätzliche Modulstufe.
- Genau `runRealPassivePlanningIntegration` sitzt nach Equipment/BuildProfile. Sie ergänzt nur Profil und Context und ruft den öffentlichen 5H-Vertrag auf; Targeting, Pathfinder, Planner, Hash und Required-Diagnosen werden nicht dupliziert.
- Budget, Baum, Quellversion, technischer Charakterkontext, Planungs- und Zielmodus sind bei Aktivierung erforderlich. Budget wird nie aus Level, Quests oder Aszendenzpunkten abgeleitet. Startauflösung bleibt explizite Node-ID oder eindeutiges `classStartIndex`.
- Synthetische `passiveAnalysis` und `realPassivePlanning.pipelineResult` bleiben getrennt. Kontrollierte Fehler/Teilresultate erhalten Codes, Stufen und Node-IDs; unabhängige Analyzer laufen weiter. Unerwartete Throws bleiben fatal.
- Graphwiederverwendung ist explizit und versionsgeprüft. Kein globaler Cache und kein Targeting-Cache; mehrere Profile teilen nur den unveränderlichen Graphen.
- Offizielle Einzelmessung: 47,50 ms ohne Pipeline; 3.272,16 ms mit neuem und 2.697,38 ms mit vorbereitetem Graph; Targeting 1.976,99 ms, Planning 202,32 ms, drei Profile 7.901,55 ms, Ergebnis 34.896.050 Bytes, beobachtete Harness-Heap-Differenz 234,07 MiB.
- Keine React-/UI-Anbindung, Baumhervorhebung oder Pfaddarstellung. Aufgabe 5J wurde nicht begonnen.

## Nachbesserung 5D.3 – Exportassets, zentrale Aszendenz und Klassenregister

Der gepinnte Export 0.5.2/`1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6` liefert 36 lokal importierte Atlasdateien mit Hashinventar. `official-poe2-passive-tree-export-assets` ist eng `conditionally-approved`, ohne allgemeine Medien- oder Rechtsfreigabe. Mittel-/Nahansicht verwenden offizielle Motive und Rahmen; Aszendenzen erscheinen als unveränderte Einheit zentral mit Exportbild. Das Register erkennt zwölf Klassen; Witch, Ranger, Warrior, Sorceress, Huntress, Mercenary, Monk und Druid sind unterstützt. Marauder, Duelist, Shadow und Templar bleiben teilunterstützt; Ranger2 und Druid3 mangels Name/Bild nicht verfügbar. Neue Releases aktivieren Klassen nie ungeprüft. Der Nutzer bestätigte den bisherigen Pinch auf physischem iPhone; 5D.3 ist dort noch nicht erneut geprüft. Aufgabe 5I bleibt gestoppt. Engine und Haupt-Orchestrator bleiben unverändert.

## Übergabe nach Aufgabe 5F

Aufgabe 5F ergänzt `src/engine/passive-targeting/` als eigenständige, deterministische, React- und netzwerkfreie Bewertung echter passiver Einzelknoten. Zentrale Regeln klassifizieren unveränderte englische Namen und einzelne Statzeilen nach Schadensarten, Attack/Spell- und weiteren Mechaniken, Defensive, Ressourcen, Attributen und Utility. Die kontrollierte Normalisierung löst GGG-Markup auf sichtbaren englischen Text auf, extrahiert eindeutige Zahlen und erhält jeden Originaltext. Unbekannte Zeilen bleiben `unresolved`.

Der Evaluator liest ausschließlich ein übergebenes synthetisches `BuildProfile`, Charakter-/Aszendenzkontext, Zielprofil und echte Knoten. ScoreReasons dokumentieren Profiltreffer und Konflikte; Score und Confidence sind getrennt. Startknoten sind keine Ziele, fremde Aszendenzen werden blockiert, Juwelsockel nur als `socket-target` geführt und Keystones verlangen Trade-off-/Unsicherheitsreview. Ranglisten wählen keine kombinierte Zielmenge.

Gemessene Coverage auf Release 0.5.2: 5.150 Knoten, 5.962 Statzeilen, 4.850 klassifiziert, 1.112 unresolved, 81,35 %. Beim Lightning-Projectile-Profil waren 1.355 Knoten blockiert. Windows-x64/Node-24.14.0-Einzelmessung: Laden/JSON 56,72 ms, Klassifikation 1.651,62 ms, ein Profil 1.701,13 ms, zehn Profile 16.048,51 ms; Heap-Momentaufnahmen 36,14 MiB nach Klassifikation und 256,50 MiB nach zehn vollständigen Resultaten. Keine Produktgrenzwerte oder stabile Speichergarantie werden behauptet.

Pfadsuchmodul, Passive Analyzer, Orchestrator und UI bleiben per Hash-Vertrag unverändert. Es gibt keine Pfadsuche, Pfadkosten, Zielmengenauswahl, Baumoptimierung, Punkteverteilung, DPS oder deutschen Knotentext. Neue Abhängigkeiten: keine. Vollständige Dokumentation: `docs/POE2_PASSIVE_TARGETING.md`. Abschlussprüfung: 517 reguläre Tests in 21 Dateien, darunter 51 neue Targeting-/Grenz-/Performancetests; Fixture-Import 23/0, Lint, Typecheck, Produktions- und Pages-Build erfolgreich. Unter paralleler Gesamtsuitenlast wurden die höheren Targeting-Einzelwerte 66,53 ms / 3.918,15 ms / 2.248,45 ms / 16.064,89 ms und eine Heap-Gesamtdifferenz von 242,87 MiB beobachtet und dokumentiert.

## Übergabe nach Aufgabe 5E

Aufgabe 5E ergänzt `src/engine/passive-pathfinding/` als eigenständige, React- und netzwerkfreie Grundlage für den offiziellen Passivbaum 0.5.2. Der kontrollierte Graph enthält 5.150 Knoten und 6.067 kanonische ungerichtete Verbindungen, deterministische Nachbarlisten, Typen, Klassen-/Aszendenzzuordnung, Sockel-/Aktivstatus und zentral konfigurierte Traversierungskosten. Fehlerhafte Referenzen, doppelte oder echte selbstgerichtete Kanten und ungültige Kosten blockieren den Graphaufbau; die bekannte offizielle Selbstnachbarschaft wird kontrolliert ignoriert.

Einzelziele verwenden deterministisches Dijkstra für `shortest-path` oder `lowest-cost-path`. Tie-Breaker sind zusätzliche Kosten, neu belegte Knoten, Pfadlänge und die lexikografische technische ID-Folge. Bereits belegte Knoten werden kostenfrei wiederverwendet, technische Starts kosten standardmäßig null, Zielknoten zählen, Budgets und Aszendenzgrenzen werden strukturiert geprüft. `connect-targets` verbindet nur explizit vorgegebene Ziele schrittweise mit dem vorhandenen Teilbaum, dedupliziert gemeinsame Knoten/Kanten und kennzeichnet die Aussage korrekt als `shortest-per-step`, nicht als globale Optimalität.

Passive Analyzer, Orchestrator, UI und sichtbarer Baum blieben fachlich unverändert. Es gibt keine Zielauswahl, Buildoptimierung, automatische Punkteverteilung, Clusterpfade oder DPS-Berechnung. Neue Abhängigkeiten: keine. Dokumentation: `docs/POE2_PASSIVE_PATHFINDING.md`. Performancebeobachtung unter Windows x64/Node 24.14.0: Graphaufbau 329,84–336,35 ms, entferntes Einzelziel 316,35–318,77 ms, zehn Einzelziele 2.973,83–3.040,55 ms, Vierzielverbindung 2.230,54–2.293,60 ms; Heap-Momentaufnahme etwa 6,54–6,55 MiB für den Graphen und 28,34–62,77 MiB Gesamtdifferenz nach den Suchen. Unter paralleler Gesamtsuitenlast lagen Einzelwerte höher und sind ebenfalls in der Fachdokumentation festgehalten. Abschlussprüfung: 466 reguläre Tests in 18 Dateien, Fixture-Import 23/0, Lint, Typecheck, Produktions- und Pages-Build erfolgreich. Dies sind Beobachtungen ohne Produktgrenzwert oder stabile Speichergarantie.

## Übergabe nach Aufgabe 5D

Aufgabe 5D ist technisch umgesetzt. `src/tree-view/adapter.ts` bildet den validierten offiziellen Baumstand 0.5.2 einmalig auf ein reines `PassiveTreeViewModel` ab; React erhält keine Import- oder GGG-Rohobjekte. Das ViewModel enthält 5.150 Knoten, 6.067 Verbindungen, 1.621 Gruppen, 6 Klassenstarts, 36 Aszendenzstarts und 19 Juwelsockel. Es werden keine Cluster-Sockel erzeugt. Offizielle Koordinaten bleiben relativ unverändert; Bounds erhalten nur einen einheitlichen Rand.

Der bisherige synthetische Sieben-Knoten-Baum ist aus der sichtbaren Baumkomponente entfernt. Die technische SVG-Ansicht besitzt Gesamtansicht, 1×–12× Zoom, Pointer-/Touch-Pan, Vollbild, einzelne Inspektionsauswahl per Klick/Tap/Tastatur, englische Details, lokale Suche, rein visuelle Filter und Orientierung an Klassen-/Aszendenzstarts. Lade- und Fehlerzustände fallen niemals auf erfundene Daten zurück. Der Baum wird als gehashtes lokales Vite-Asset geladen; es gibt keinen Zugriff auf GGG/GitHub zur Laufzeit.

Engine, Passive Analyzer, Buildstate und restliche Fachmodule blieben unverändert. Es gibt keine Pfadsuche, Optimierung, Punktvergabe, automatische Belegung, Juwelbelegung oder Analyzer-Anbindung. Keine deutschen Knotentexte wurden erfunden und keine GGG-Assets übernommen. Neue Abhängigkeiten: keine.

Abschlussprüfung: Fixture-Import 23/0; 432 reguläre Tests in 15 Dateien erfolgreich, darunter 20 Adapter- und 16 Baumkomponententests; Lint, Typecheck, Produktions- und Pages-Build erfolgreich. Build-Asset: 7.580,63 kB, gzip 596,81 kB; SVG-DOM 11.219 Elemente. Öffentliche Pages-Einzelmessungen: kalt 5.157 ms bis zur sichtbaren Ansicht (Daten/JSON 313,8 ms, Adapter 129,7 ms, erste Render-Markierung 653,2 ms), warm 726 ms (58,2 / 131,9 / 347,6 ms); der Browser bot keine verlässliche Arbeitsspeichermessung. Desktop 1280 × 800 und Mobil 390 × 844 wurden ohne Dokumentüberlauf, ohne Konsolenfehler und mit Suche, Filter, Klassen-/Aszendenznavigation, Auswahl, Tastaturbedienung, Zoom und Pan geprüft. Ein beim Mobiltest sichtbarer zu breiter Suchtrefferstreifen wurde vor Abschluss behoben. Bekannte Risiken: großes JSON und SVG-DOM können auf schwachen Mobilgeräten merkliche Lade-/Interaktionskosten erzeugen. Bekannte reproduzierbare Bugs: keine. Nächste empfohlene Aufgabe: gezielte Darstellungsperformance und Barrierefreiheit weiter härten; fachliche Pfadsuche oder Engine-Anbindung weiterhin nur in einem getrennten Auftrag.

## Übergabe nach Aufgabe 5C

Aufgabe 5C ist abgeschlossen. Die damalige 5B-Bewertung wurde korrigiert: `ggg-poe2-skilltree-export` ist ausschließlich für die fest gepinnte offizielle `data.json` und passive Knoten, Verbindungen, Gruppen, Klassen-/Aszendenzstarts sowie explizite Juwelsockel `conditionally-approved`. Andere echte Kategorien, PoE2DB, RePoE, Medien und andere GGG-Dateien blieben zu diesem Zeitpunkt blockiert; die spätere 5M.0-Ausnahme betrifft ausschließlich den gepinnten technischen Affixscope.

Verwendete Quelle: <https://github.com/grindinggear/poe2-skilltree-export>, Release `0.5.2` „Runes of Aldur“, Commit `1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6`, Quellhash `f83c94ce7b09f2bfc5b3b1d63523c2ab3d2582d0e964f6aeec34b8b0390abcfe`. Importiert: 5.150 Knoten, 6.067 Verbindungen, 1.621 Gruppen, 6 Klassenstarts, 36 Aszendenzstarts, 19 Juwelsockel, 0 Cluster-Sockel. Übersprungen: Root-Pseudoknoten und zwölf mehrdeutige `jewelSlots`-Referenzen. Bericht: drei Warnungen (eine offizielle Selbstkante, zwölf mehrdeutige Slotreferenzen, 22 offiziell isolierte Knoten), null Fehler, null unbekannte Felder.

Der Export enthält englische Namen/Stats, keine Locale-Felder und keine dokumentierte deutsche Variante. Englische Quelltexte bleiben unverändert; deutsche Texte wurden nicht erfunden. Die Lokalisierungsgrenze und der Fallback verifiziertes Deutsch → offizielles Englisch → technische ID sind vorbereitet. Keine Assets wurden kopiert oder hotgelinkt.

Der Import ist offline, hashgeprüft und reproduzierbar. Er verlangt einen expliziten bekannten Release; `main`, `latest` und fehlende Versionen werden blockiert. `check:poe2-tree-update` validiert und vergleicht ohne produktive Dateien zu ersetzen. Saisonwechsel benötigen Pinning, Hash, Schemaaudit, Diff, vollständige Tests und dokumentierte manuelle Freigabe gemäß `docs/POE2_TREE_UPDATE_PROCESS.md`.

Engine, Passive Analyzer und UI sind fachlich unverändert; es gibt keine Baumoptimierung oder Pfadsuche. Risiken: Das offizielle Schema kann sich ändern; isolierte Knoten und mehrdeutige `jewelSlots` benötigen bei neuen Releases erneute Prüfung; eine verifizierte deutsche Quelle fehlt. Bekannte Bugs: keine reproduzierbaren Bugs aus 5C; die genannten Warnungen sind bewusst behandelte Quelldatenbesonderheiten. Nächste empfohlene Aufgabe: ein eigener Integrationsaudit/Adapter für die reine Baumdarstellung, weiterhin ohne Optimierung und erst nach ausdrücklichem Auftrag.

Abschlussprüfung 5C: reproduzierbarer lokaler Abhängigkeitsbestand ohne neue Bibliothek; Fixture-Import 23/0; reguläre Suite 13 Dateien und 396 Tests erfolgreich, einschließlich 22 neuer Baumimporttests und 16 Approval-Tests; Lint, Typecheck, Produktions-Build und separater Pages-Build erfolgreich. Prüfmodus ließ den generierten Baumhash unverändert; fehlende, unbekannte und `latest`-Versionen endeten jeweils mit Exitcode 1. Stichproben normaler/Notable-/Start-/Sockelknoten und Verbindungen waren konsistent; generierte Daten enthalten keine Assetpfade oder Laufzeit-URLs. Die öffentliche Pages-Version war auf Desktop und 390 × 844 erreichbar, zeigte weiterhin sieben Testbaumknoten, hatte keinen horizontalen Überlauf und keine Browserkonsolenwarnungen/-fehler. Nicht auf physischem Touchgerät geprüft; kein importierter echter Baum wird in der UI dargestellt.

Stand: 20. Juli 2026. Bei Widersprüchen ist der Quellcode die maßgebliche Wahrheit.

## 1. Projektbeschreibung

Mobile-first Web-App zur Planung eines Path-of-Exile-2-Builds ausgehend von vorhandener Ausrüstung. Der aktuelle Stand ist ein klickbarer React-Prototyp mit lokalen Platzhalterdaten auf einer einzigen langen Seite.

## 2. Projektziel

Langfristig analysiert eine erklärbare Engine Klasse, Aszendenz, Level, Ausrüstungsaffixe, beide Waffen-Sets, eine optionale Hauptfertigkeit und das Ziel Ausgeglichen, Mapping oder Boss. Daraus leitet sie den bestmöglichen restlichen Build ab. Die Ausrüstung ist die Grundlage; nicht der passive Skilltree bestimmt die Ausrüstung.

## 3. Vollständiger langfristiger Projektplan

### Grundprinzip und Eingaben

Die Engine analysiert Klasse, Aszendenz, Charakterlevel, Ausrüstungsaffixe, Waffen-Set 1 und 2, optional eine Hauptfertigkeit sowie das Ziel Ausgeglichen, Mapping oder Boss.

### Geplante Engine-Ausgaben

- Beste Hauptfertigkeit, weitere Fertigkeitsgems, kompatible Unterstützungsgems und deren optimale Kombination
- Optimale Belegung und Nutzung beider Waffen-Sets
- Optimaler passiver Skilltree mit effizienten Pfaden und waffen-set-spezifischen Knoten
- Normale Juwele, Cluster-Juwele, Unique-Cluster-Juwele und passende Unique-Gegenstände inklusive Aszendenz-Synergien
- Verbesserbare, schlecht genutzte oder nutzlose Affixe; fehlende Attribute, Widerstände und defensive Schwächen
- Mapping- und Boss-Rotation einschließlich Fertigkeits- und Waffenwechselreihenfolge
- Später gegebenenfalls genaue offensive/defensive Werte und eine detaillierte DPS-Simulation

### Erklärungsprinzip

Jede Empfehlung soll Gründe, Vor- und Nachteile erklären: Auswahl von Haupt- und Zusatzfertigkeiten, Supports, passiven Knoten und Pfaden, Juwelen, Clustern, Uniques und Affix-Verbesserungen. Rotationen sollen Reihenfolge, Waffenwechsel, vorbereitende Effekte, deren Fortbestand und Unterschiede zwischen Mapping und Bossen nachvollziehbar machen.

### Geplanter Bedienablauf

1. Klasse, Aszendenz, Level und Ziel wählen.
2. Ausrüstung über Affixe eingeben und beide Waffen-Sets konfigurieren.
3. Optional eine Hauptfertigkeit wählen.
4. Build berechnen.
5. Hauptfertigkeit, weitere Fertigkeiten, Supports, Juwele/Cluster und passiven Baum anzeigen.
6. Mapping- und Boss-Rotation, Build-Erklärung, Affix-Verbesserungen und Uniques anzeigen.

### Geplante Oberfläche

Eine einzige lange Planer-Seite ohne klassische Homepage: Charakter, Ausrüstung, Fertigkeiten/Supports, normale Juwele, Cluster, Unique-Cluster, passiver Skilltree, Berechnung, Ergebnis, Mapping-Rotation, Boss-Rotation, Erklärung, Affix-Verbesserungen und Unique-Empfehlungen.

### Ausrüstungseingabe

Slots speichern mehrere Affixe mit jeweils einem Wert. Ein anklickbarer Dialog bietet Suche, scrollbare Liste, Auswahl, Hinzufügen und Entfernen. Vollständige Gegenstände können später optional ergänzt werden.

### Passiver Skilltree

Langfristig importiert und füllt die Engine den echten Baum. Er soll ausgewählte Pfade, normale/Notable-/Keystone-Knoten, Juwel- und Cluster-Sockel sowie waffen-set-spezifische Pfade darstellen und per Maus und Touch verschiebbar, zoombar, anklickbar und vergrößerbar sein.

### Geplante Datenquellen

PoE2DB ist als mögliche Hauptquelle deutschsprachiger Daten vorgesehen: Klassen, Aszendenzen, Ausrüstung, Affixe, Skills, Supports, passive Knoten, Juwele, Cluster und Uniques. Vor Nutzung sind Schnittstelle, Nutzungsbedingungen, Importerlaubnis, Normalisierung, lokale Speicherung, Versionierung und Updatepflege zu prüfen. Laufzeitberechnungen sollen keine Live-Abhängigkeit von PoE2DB haben.

### Entwicklungsphasen

1. **Klickbarer Prototyp:** Vite, React, TypeScript, mobile-first, lokale Platzhalterdaten, kompletter Ablauf; keine Engine oder DPS-Berechnung. (Abgeschlossen)
2. **Normalisiertes Datenmodell:** Klassen, Aszendenzen, Slots, Affixe, Skills, Supports, Waffen-Sets, Juwelen/Cluster/Uniques, passive Knoten, Rotationen, Empfehlungen und Erklärungen. (Abgeschlossen)
3. **Spieldatenimport:** Quelle und Importformat prüfen, Importskripte erstellen, normalisieren, validieren und versionieren; keine externe Laufzeitabhängigkeit. (Offizieller Passivbaum begrenzt abgeschlossen; andere echte Daten bleiben bis zur Quellenfreigabe blockiert)
4. **Regelbasierte Ausrüstungsanalyse:** Waffen-/Schadensarten und Tags erkennen, Angriff/Zauber sowie Tempo, Krit, Attribute, Anforderungen und Defensive bewerten, Konflikte und schlecht genutzte Affixe erkennen.
5. **Skill- und Support-Empfehlungen:** Haupt- und Zusatzfertigkeiten sowie Supportkombinationen bewerten; Mapping/Boss und Waffen-Sets berücksichtigen.
6. **Passiver Skilltree:** echten Baum importieren, Knoten/Verbindungen darstellen, Knoten und Pfade inklusive Kosten, Cluster-Effizienz und Waffen-Set-Punkte bewerten; Varianten vergleichen.
7. **Juwele und Cluster:** normale, Cluster- und Unique-Cluster-Juwele samt Sockel-, Pfadkosten und Synergien bewerten.
8. **Unique- und Affix-Empfehlungen:** Aszendenz-Synergien und Build-Enabler erkennen, Rare/Unique vergleichen, fehlende Attribute/Widerstände und bessere Affixe mit Vor-/Nachteilen erläutern.
9. **Rotationen und Erklärungen:** Mapping/Boss, Buffs/Debuffs, Skillreihenfolge, Waffenwechsel, anhaltende Effekte sowie Vorbereitung/Hauptschaden modellieren.
10. **Genauere Berechnungen:** Schaden und Defensive präzisieren, Varianten und Einzeländerungen vergleichen. Eine detaillierte DPS-Simulation beginnt erst bei stabilem Datenmodell, korrekt modellierten Skills, Supports, Affixen, passiven Knoten und Waffen-Sets sowie ausreichenden Referenztests.

### Dauerhaft nicht geplant (ohne neue Anweisung)

Anmeldung, Benutzerkonten, klassische Homepage, Community-Funktionen, öffentliche Build-Datenbank, Cloud-Speicherung, Build-Sharing-Plattform, Trade-API, Preisberechnung, Crafting-Simulator, Forum, soziale Funktionen und unnötige Mehrseiten-Navigation.

## 4. Aktueller Entwicklungsstand

### Aufgabe 5H – isolierte reale Passive-Pipeline abgeschlossen (21. Juli 2026)

- Neues Modul `src/engine/real-passive-pipeline/` verbindet `BuildProfile → passive-targeting → passive-pathfinding → passive-planning`, ohne den bestehenden Haupt-Orchestrator oder die UI anzubinden.
- `pointBudget` ist zwingend und wird nie aus Level, Quest- oder Aszendenzpunkten erfunden.
- Ein expliziter Klassenstart wird gegen `classStartIndex` geprüft; andernfalls muss genau eine offizielle Klassenzuordnung existieren. Namen und Geometrie werden nicht ausgewertet.
- Quellversion und Baumdaten werden vor Ausführung geprüft. Ein vorbereiteter Graph wird wiederverwendet; andernfalls wird der bestehende Graphbuilder genau einmal aufgerufen.
- Acht Stufen protokollieren Status, Codes und Summaries. Targeting- und Planning-Resultate bleiben vollständig erhalten.
- Required-Ziele werden von Baum über Targeting bis Planung einzeln mit ursprünglichen Codes diagnostiziert.
- Die Ausgabeprüfung sichert Referenzen, Eindeutigkeit, Zusammenhang, Budget, Versionsgleichheit und vollständigen Ausschluss von Aszendenzknoten aus normalen Punkten.
- Der kanonische `fnv1a32`-Resultathash enthält keine Laufzeiten, Zeitstempel, Speicher- oder Plattformwerte.
- `optimalityClaim: heuristic` wird unverändert übernommen; globale Optimalität wird nicht behauptet.
- Targeting-Regeln, Pathfinder, Planner, synthetischer Passive Analyzer, Haupt-Orchestrator und UI sind per SHA-256-Grenztest unverändert.
- Isolierte offizielle Messung: vollständiger Lauf mit neuem Graph 2.482,74 ms, mit wiederverwendetem Graph 1.845,79 ms, Targeting 1.558,52 ms, Planning 191,07 ms, zwei Läufe 3.623,40 ms, drei Profile 5.528,99 ms, Heap-Differenz der Gesamtmessung 174,34 MiB.
- Targeting klassifiziert aktuell je Profil erneut. 5H führt bewusst keinen profilübergreifenden Klassifikationscache ein.
- Vollständiger Vertrag: `docs/POE2_REAL_PASSIVE_PIPELINE.md`.

### Aufgabe 5G – begrenzte Passive-Planung abgeschlossen (21. Juli 2026)

- `src/engine/passive-planning/` enthält Typen, Konfiguration, Kandidatenaufbau, Validator, Planner, Fixtures, Exporte sowie Unit-, Boundary- und Performanceprüfungen.
- Der Planer liest nur vorbereitete `PassiveTargetAnalysis`-Ergebnisse und ruft nur `findPassivePath` auf. Targeting, Pathfinder, Passive Analyzer, Orchestrator und UI sind per SHA-256-Vertrag unverändert abgesichert.
- Der Pool wird vor Suchen deterministisch gefiltert und auf 50 begrenzt. Starts, alle Aszendenzknoten, unbekannte Typen, reguläre Juwelsockel, blockierte, ausgeschlossene, zu schwache oder nicht freigegebene Reoptimierungsziele sind ausgeschlossen.
- Required-Ziele werden zuerst validiert und verbunden; Unerreichbarkeit oder Budgetüberschreitung blockiert ausdrücklich.
- Zentrale Werte kombinieren nur vorhandenen Targeting-Score, Profilsynergie, Mapping-/Bosswerte und Confidence. Vorhandene Konflikt-, Unresolved-, Reoptimierungs- und Redundanzfelder erzeugen kontrollierte Abzüge.
- `value-first`, `efficiency-first` und `balanced` verwenden zentrale Gewichte und bewerten nach jeder Auswahl am erweiterten Teilbaum neu.
- Belegte Pfade werden wiederverwendet. Ein exakter Request-Cache verhindert identische Pathfinder-Aufrufe; Ergebniszähler weisen echte Suchen und Treffer aus.
- Aszendenzen bleiben mangels getrenntem Aszendenzbudget außerhalb des Normalplans.
- Die Strategie ist heuristisch und behauptet keine globale Build-, Steiner-Tree- oder kombinatorische Optimalität.
- Sicherheitsgrenzen: 50 Kandidaten, 12 Ziele, 123 normale Punkte, 4.000 Pfadsuchen, 12 optionale Iterationen.
- Messung mit 5.150 Knoten und vorbereitetem Targeting: 10/25/50 Kandidaten in 208,48/415,05/811,32 ms; warmer 25er-Cache 77,58 ms, 0 echte Suchen, 25 Treffer; Heap-Differenz 85,43 MiB.
- Vollständiger Vertrag: `docs/POE2_PASSIVE_PLANNING.md`.

Phase 1 und Phase 2 sind implementiert. Phase 3 besitzt eine geprüfte Offline-Importgrundlage und seit Aufgabe 5C den getrennten offiziellen Passivbaum-Datenbestand; andere echte Daten sind nicht freigegeben. Aufgaben 4A bis 4I und damit Aufgabe 4 insgesamt sind abgeschlossen. Sie lieferten die vollständige synthetische Engine-Kette: Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer, Rotation Generator und templatebasierten Explanation Generator. Dieser erzeugt deutsche Erklärungen und maschinenlesbare Traces ausschließlich aus vorhandenen strukturierten Ergebnissen. Die Engine optimiert nicht neu und berechnet weder Zeiten noch DPS. Aufgabe 5A ergänzt die GitHub-Pages-Konfiguration sowie Engine-UI- und Datenfreigabeaudits. Aufgabe 5B ergänzte das Import-Gate; Aufgabe 5C korrigierte dessen Passivbaumfreigabe eng begrenzt. UI und Engine bleiben getrennt.

## 5. Fertige Funktionen

- Bedienbare Charakter-, Aszendenz-, Level-, Ziel- und Hauptfertigkeitsauswahl
- Zwölf Ausrüstungsslots; Affixdialog mit Suche, Wert, mehreren Affixen und Entfernen
- Sechs Skills mit Rolle, Waffen-Set und fünf sichtbaren Supportplätzen
- Auswahl-/Suchdialoge für normale, Cluster- und Unique-Cluster-Juwele, jeweils entfernbar
- SVG-Testbaum mit markiertem Pfad, Knotentypen, Button-/Rad-Zoom, Pointer-/Touch-Pan und Vollbildmodus
- Deutlich markierte feste Testberechnung mit allen geforderten Ergebnisbereichen und Rotationen
- Dunkles responsives mobile-first Design
- Normalisierte Definitionen und Konfigurationen mit stabilen technischen IDs
- Gemeinsame Quellen-, Versions-, Status- und Tag-Metadaten
- Strukturierte Modifier-, Equipment-, Skill-, Juwel-, Passivbaum-, BuildInput- und BuildResult-Typen
- Reine lokale Datenvalidierung und automatische Vitest-Modelltests
- Quellenbericht unter `docs/DATA_SOURCES.md` mit Primärlinks, Unsicherheiten und ausgeschlossenen Verfahren
- Versioniertes Importmanifest und kanonisches Rohdatenformat für elf Kategorien
- Reine Offline-Pipeline mit deterministischen IDs/Hashes, strukturiertem Bericht und Domänenabbildung
- Künstliche gültige und fehlerhafte Fixtures sowie `npm run import:fixture`
- React-freie Engine-Struktur unter `src/engine/` mit Equipment-first-Datenfluss und zentralem `analyzeBuild`
- Strukturierte Scores, Gründe, harte Verstöße, kontrollierte weiche Kategorien und normiertes `BuildProfile`
- Schnittstellen und künstliche Testlogik für Equipment, Skills, Supports, Passive, Juwele, Uniques, Rotationen und Erklärungen
- Regelbasierter synthetischer Rotation Generator mit Mapping-/Bossplan, zentralen Regeln, expliziten Waffenwechseln, anhaltenden Effekten, strukturierten Bedingungen, Complexity und Confidence
- Regelbasierter deutscher Explanation Generator mit zentralen Templates, vollständigen Traces, Priorisierung, Anzeigenamen-Fallbacks, unbekannten ReasonCodes und verpflichtendem Platzhalterhinweis
- Drei eindeutig synthetische Engine-Fixtures und 20 deterministische Engine-Architekturtests
- Vollständige Architekturdokumentation unter `docs/ENGINE_ARCHITECTURE.md`
- Zentral konfigurierte Equipment-Regeln und Normalisierung für fünf Schadensarten, Mechaniken, Geschwindigkeit, Defensive und künstliche Attribute
- Getrennte Profile für beide Waffen-Sets, kombiniertes Profil, stabile Dominanzen, Set-Differenzen und Spezialisierungen
- Strukturierte Equipment-Konflikte sowie Klassifikation ungenutzter, schwach genutzter und konfliktbehafteter Modifier
- Fünf synthetische Equipment-Fixtures und 36 dedizierte Equipment-Analyzer-Tests
- Zentral konfigurierte Skill-Regeln, harte Kompatibilitätsprüfung und weiche Bewertung für Schadensarten, Mechaniken, Geschwindigkeit, Klasse, Aszendenz und Ziele
- Skillrollen, getrennte Waffen-Set-Scores, Profilnutzung, Confidence sowie gültige/blockierte, Main-, Utility-, Movement-, Mapping- und Bossranglisten
- Zehn künstliche Skill-Kandidaten und 38 dedizierte Skill-Analyzer-Tests
- Zentral konfigurierte Support-Regeln für Tags, Schadensarten, Mechaniken, Rollen, Waffen, Ziele, Profile und Trade-offs
- Einzelne Support-Empfehlungen mit Set-Scores, Confidence sowie gültigen/blockierten und fünf kategorisierten Ranglisten
- Zehn künstliche Support-Kandidaten und 33 dedizierte Support-Analyzer-Tests
- Dreizehn synthetische Passive-Kandidaten für Einzelknoten, Keystones, Ascendancy und kleine Cluster
- Vereinfachte Graphprüfung, Pfadkosten, scorePerPoint, Path-Efficiency, Set-Scores, Redundanz, Konflikte, Confidence und acht Ranglisten
- 36 dedizierte Passive-Analyzer-Tests
- Vierzehn synthetische Juwelkandidaten und 47 dedizierte Jewel-Analyzer-Tests
- Getrennte Normal-/Cluster-/Unique-Cluster-Bewertung mit Sockeln, Kosten, Effizienz, Enablern, Trade-offs und dreizehn Ranglisten

## 6. Teilweise fertige Funktionen

- Baum und Empfehlungen demonstrieren nur spätere Interaktionen; sie nutzen keine echten Spieldaten.
- Skills zeigen feste Support-Testdaten; freie Skill-/Supportbearbeitung ist noch nicht vorgesehen.
- `BuildInput` ist vollständig typisiert, wird von der Platzhalterberechnung aber noch nicht verarbeitet.
- Der offizielle PoE2-Passivbaumexport ist technisch geeignet, aber Lizenz-/Asset- und Weiterverteilungsfragen sind vor echtem Import noch zu klären.

## 7. Noch offene Aufgaben

- Freigabe, Attribution und zulässigen Importumfang für echte Quellen klären
- Einen echten, eng begrenzten Importadapter erst nach Quellenfreigabe implementieren
- Nach der Pages-Veröffentlichung die öffentliche Version gemeinsam mobil prüfen und gezielt überarbeiten
- Referenztests und automatisierte UI-Tests ausbauen
- Barrierefreiheit mit spezialisiertem Audit prüfen
- Echte PoE2-Daten erst nach Quellen-/Lizenzprüfung importieren

## 8. Bekannte Bugs

Zum dokumentierten Stand sind nach automatischen Tests sowie Desktop- und Mobilprüfung keine reproduzierbaren Bugs bekannt. Einschränkungen der Platzhalter- und Fixture-Logik sind keine fertigen Produktfunktionen.

## 9. Letzte Änderungen

- Erstes Vite-/React-/TypeScript-Projekt erstellt
- Vollständigen klickbaren Phase-1-Ablauf und responsive Gestaltung implementiert
- README und offizielles Projektgedächtnis angelegt
- Einzelne Modelldatei durch `src/domain/` mit normalisierten Definitionen und Konfigurationen ersetzt
- Sämtliche Platzhalterdaten auf stabile IDs, gemeinsame Metadaten und kontrollierte Tags migriert
- Datenvalidierung und sieben Vitest-Tests ergänzt; UI auf ID-basierte Auflösung umgestellt
- PoE2DB, offizielle GGG-API, GGG-Nutzungsbedingungen und offiziellen PoE2-Passivbaumexport anhand von Primärseiten geprüft
- Datenherkunftsmetadaten, Importmanifest, kanonisches Rohdatenformat und reine Importpipeline ergänzt
- Künstliche Fixtures, strukturierte Fehler-/Importberichte, deterministische Hashes/IDs und zwölf Pipeline-Tests ergänzt
- Remote-Synchronisation nach einer widersprüchlichen GitHub-Webcache-Anzeige erneut geprüft: `git fetch origin` bestätigte Aufgabe-3-Commit `01dc66e61f77271a4fb884b37ae7144951ada3ac` auf `origin/main`; GitHub-API und unveränderliche Raw-SHA-URLs bestätigten die öffentlichen Pflichtdateien. Es war kein History-Eingriff und kein Force-Push erforderlich.
- Aufgabe 4A umgesetzt: eigenständige Engine-Ordnerstruktur, zentrale Typen, getrennte harte/weiche Regeln, normiertes BuildProfile, alle geforderten Analyzer-Schnittstellen, strukturierte Rotation/Erklärung und Orchestrator in verbindlicher Reihenfolge ergänzt
- Drei künstliche Engine-Fixtures, 20 Engine-Tests und `docs/ENGINE_ARCHITECTURE.md` ergänzt; README auf den Platzhalterstatus aktualisiert
- Aufgabe 4B umgesetzt: zentrales Regel-/Konfigurationsmodell, nachvollziehbare Normalisierung, vollständiger synthetischer Equipment-Bericht, Waffen-Set-Analyse, Konflikte und Modifier-Nutzung ergänzt
- Equipment-Fixtures auf fünf Szenarien erweitert und 36 dedizierte Equipment-Tests ergänzt; Architektur und README abgeglichen
- Aufgabe 4C umgesetzt: Skill-Domäne gezielt optional erweitert, zentrale Regeln/Konfiguration, harte Ausschlüsse, weiche Kategorien, Zielgewichtung, Rollen, Set-Eignung, Confidence und Ranglisten ergänzt
- Zehn künstliche Skill-Kandidaten und 38 Skill-Analyzer-Tests ergänzt; Support Analyzer fachlich unverändert gelassen
- Aufgabe 4D umgesetzt: Support-Domäne gezielt optional erweitert, zentrale Regeln/Konfiguration, harte Kompatibilität, weiche Kategorien, Zielgewichtung, Trade-offs, Set-Eignung, Confidence und Ranglisten ergänzt
- Zehn künstliche Support-Kandidaten und 33 Support-Analyzer-Tests ergänzt; Skill und Passive Analyzer fachlich unverändert gelassen
- Aufgabe 4E umgesetzt: Passive-Domäne, zentrale Regeln/Konfiguration, Einzelknoten-/Clusterbewertung, Graphvalidierung, Pfadkosten, Trade-offs, Set-Eignung, Redundanz, Konflikte, Confidence und Ranglisten ergänzt
- Dreizehn synthetische Passive-Kandidaten und 36 Passive-Analyzer-Tests ergänzt; Jewel-, Unique- und Rotationsmodule unverändert gelassen

## 10. Zuletzt getestete Bereiche

Am 20. Juli 2026 nach Abschluss von Aufgabe 3 erfolgreich geprüft:

- `npm install`: Bestand aktuell, 191 Pakete geprüft, 0 gemeldete Schwachstellen; keine neue Abhängigkeit
- `npm run import:fixture`: 23 künstliche Datensätze, 0 verworfen, Status `fixture`, keine Fehler
- `npm run test`: zwei Testdateien, 19 Tests erfolgreich; die bestehenden sieben Domänentests bleiben enthalten
- `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich
- Entwicklungsserver startet fehlerfrei und liefert die Planer-Seite direkt aus
- Charakter: Klassenwechsel auf Zauberin aktualisiert die sichtbaren Aszendenzoptionen
- Affixdialog: Suche nach „Widerstand“, Feuerwiderstand hinzugefügt und wieder entfernt
- Normale Juwelauswahl weiterhin bedienbar
- Sechs Skills und 30 Supportplätze sichtbar
- Testberechnung zeigt weiterhin alle 14 geforderten Ergebnisgruppen
- Skilltree: sieben Testknoten sichtbar, Button-Zoom von 100 auf 120 Prozent
- Desktopdarstellung bei 1280 × 800 und Mobilansicht bei 390 × 844; zwölf Equipment- und sechs Skill-Slots vorhanden, kein horizontaler Überlauf
- Browserkonsole ohne Warnungen oder Fehler
- Repository-Dateiliste auf versehentliche HTML-Dumps, fremde Assets und echte Datenbestände geprüft; keine gefunden
- Nachbesserungsprüfung erneut vollständig ausgeführt: `npm install`, `npm run import:fixture`, `npm run test`, `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich; UI auf Desktop und 390-Pixel-Mobilbreite erneut geprüft, Browserkonsole ohne Warnungen oder Fehler

Touch-Pan wurde durch die gemeinsame Pointer-Event-Implementierung und mobile Layoutprüfung abgedeckt, jedoch nicht auf einem physischen Touchgerät ausgeführt.

Am 20. Juli 2026 nach Aufgabe 4A zusätzlich erfolgreich geprüft:

- lokaler Abhängigkeitsbestand wiederhergestellt; keine neue Abhängigkeit in `package.json` oder `package-lock.json`
- `npm run import:fixture`-äquivalenter lokaler Skriptlauf: 23 künstliche Datensätze, 0 verworfen, keine Fehler
- `npm run test`: drei Testdateien und 39 Tests erfolgreich, einschließlich 20 neuer Engine-Tests
- `npm run lint`, `npm run typecheck` und `npm run build` erfolgreich; 37 Module gebaut
- App startet unverändert direkt mit dem Planer; Charakterwechsel, Affixdialog, normale Juwelauswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren
- Desktop bei 1280 Pixeln und Mobil bei 390 × 844 geprüft; 14 Ergebnisgruppen, sechs Skills und sieben Testbaumknoten sichtbar, kein horizontaler Überlauf
- Browserkonsole ohne Warnungen oder Fehler
- `src/engine/` enthält keine React-Imports, Netzwerkzugriffe, echten PoE2-Daten oder DPS-Formeln
- Nicht auf physischem Touchgerät geprüft; Touch-Pan bleibt durch Pointer-Events und mobile Layoutprüfung abgedeckt

Am 20. Juli 2026 nach Aufgabe 4B zusätzlich erfolgreich geprüft:

- 75 reguläre Tests in vier Dateien erfolgreich, davon 36 dedizierte Equipment-Analyzer-Tests; bestehende 39 Tests bleiben erfolgreich
- Import-Fixture, Lint, Typecheck und Produktions-Build erfolgreich
- Charakterauswahl, Affixdialog, normale Juwelauswahl, Test-Skilltree und Platzhalterberechnung auf Desktop und 390 × 844 weiterhin funktionsfähig
- Kein horizontaler Überlauf und keine neuen Browserkonsolenfehler
- Equipment-Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten oder DPS-/Schadensformeln
- Nicht auf physischem Touchgerät geprüft; keine automatisierten Browser-Regressionstests vorhanden

Am 20. Juli 2026 nach Aufgabe 4C zusätzlich erfolgreich geprüft:

- 113 reguläre Tests in fünf Dateien erfolgreich, davon 38 dedizierte Skill-Analyzer-Tests; bestehende 75 Tests bleiben erfolgreich
- Import-Fixture, Lint, Typecheck und Produktions-Build erfolgreich
- Charakterauswahl, Affixdialog, normale Juwelauswahl, Test-Skilltree und Platzhalterberechnung auf Desktop und 390 × 844 weiterhin funktionsfähig
- Kein horizontaler Überlauf und keine neuen Browserkonsolenfehler
- Skill Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten oder DPS-/Schadensformeln
- Support Analyzer gegenüber Aufgabe 4A fachlich und dateiseitig unverändert
- Nicht auf physischem Touchgerät geprüft; keine automatisierten Browser-Regressionstests vorhanden

Am 20. Juli 2026 nach Aufgabe 4D zusätzlich erfolgreich geprüft:

- 146 reguläre Tests in sechs Dateien erfolgreich, davon 33 dedizierte Support-Analyzer-Tests; bestehende 113 Tests bleiben erfolgreich
- Installation mit unverändertem Lockfile, Import-Fixture (23 importiert, 0 verworfen), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Support Engine ohne React-Import, Netzwerkzugriff, echte PoE2-Daten, kombinatorische Supportauswahl oder DPS-/Schadensformeln
- Skill und Passive Analyzer fachlich und dateiseitig unverändert
- Charakterwechsel auf Zauberin, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop bei 1280 × 800 und Mobil bei 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf physischem Touchgerät geprüft; Touch-Verhalten bleibt durch Pointer-Events und mobile Layoutprüfung abgedeckt

Am 20. Juli 2026 nach Aufgabe 4E zusätzlich erfolgreich geprüft:

- 182 reguläre Tests in sieben Dateien erfolgreich, davon 36 dedizierte Passive-Analyzer-Tests; bestehende 146 Tests bleiben erfolgreich
- Installation unverändert; Fixture-Import (23 importiert, 0 verworfen), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Passive Engine ohne React, Netzwerk, echte PoE2-Daten, globale Baum-/Pfadsuche oder DPS-Formeln
- Skill-, Support-, Jewel-, Unique- und Rotationsmodule fachlich unverändert
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop bei 1280 × 800 und Mobil bei 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf physischem Touchgerät geprüft; Pointer-Events und mobile Layoutprüfung decken das Touch-Verhalten indirekt ab

Am 20. Juli 2026 nach Aufgabe 4F zusätzlich erfolgreich geprüft:

- 229 reguläre Tests in acht Dateien erfolgreich, davon 47 dedizierte Jewel-Analyzer-Tests; bestehende 182 Tests bleiben erfolgreich
- Fixture-Import (23/0), Lint, Typecheck und Build mit 37 Modulen erfolgreich
- Keine kombinierte Sockelbelegung, echten Daten, DPS oder Änderungen an normalen Unique-, Rotation- und Explanation-Modulen
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren; Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf, Konsole fehlerfrei

Am 20. Juli 2026 nach Aufgabe 4G zusätzlich erfolgreich geprüft:

- 279 reguläre Tests in neun Dateien erfolgreich, davon 50 dedizierte Unique-Analyzer-Tests; bestehende 229 Tests bleiben erfolgreich
- Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Keine kombinierte Unique-Optimierung, Neuoptimierung, echten Daten, Preise, Trade-API oder DPS
- Charakterwechsel, Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom und Platzhalterberechnung funktionieren; Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf, Konsole fehlerfrei

Am 20. Juli 2026 nach Aufgabe 4H zusätzlich erfolgreich geprüft:

- 318 reguläre Tests in zehn Dateien erfolgreich, davon 39 dedizierte Rotation-Generator-Tests; bestehende 279 Tests bleiben erfolgreich
- Zwölf synthetische Rotations-Fixtures für Mapping, Boss, Waffenwechsel, Effekte, fehlende Rollen, Complexity, `both` und Build-Enabler
- Installation unverändert; Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer sowie Explanation Generator fachlich unverändert
- Keine freie Textgenerierung, echten Daten, Netzwerkzugriffe, DPS-, Cooldown- oder Zeitsimulation und keine UI-Anbindung
- Charakterwechsel auf Zauberin, Helm-Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf einem physischen Touchgerät geprüft; mobile Breite und Pointer-basierte bestehende Bedienung wurden indirekt abgedeckt

Am 20. Juli 2026 nach Aufgabe 4I zusätzlich erfolgreich geprüft:

- 358 reguläre Tests in elf Dateien erfolgreich, davon 40 dedizierte Explanation-Generator-Tests; bestehende 318 Tests bleiben erfolgreich
- Elf synthetische Explanation-Szenarien für klare und widersprüchliche Profile, Rotation, Waffenwechsel, Enabler, Blockierungen, unbekannte Codes und Namens-Fallbacks
- Zentrale deutsche Templates und Confidence-Texte; jede Erklärung besitzt genau einen maschinenlesbaren Trace
- Unbekannte ReasonCodes und fehlende Anzeigenamen werden sichtbar gemeldet; synthetischer Begrenzungshinweis ist immer vorhanden
- Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer sowie Rotation Generator fachlich unverändert
- Keine freie Textgenerierung, KI-/LLM-Anbindung, echten Daten, Netzwerkzugriffe, DPS-, Cooldown- oder Zeitsimulation und keine UI-Anbindung
- Installation unverändert; Fixture-Import (23/0), Lint, Typecheck und Produktions-Build mit 37 Modulen erfolgreich
- Charakterwechsel auf Zauberin, Helm-Affixdialog, Rubinjuwel-Auswahl, Skilltree-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren
- Desktop 1280 × 800 und Mobil 390 × 844 ohne horizontalen Überlauf; Browserkonsole ohne Warnungen oder Fehler
- Nicht auf einem physischen Touchgerät geprüft; mobile Breite und bestehende Pointer-Bedienung wurden indirekt abgedeckt

## 11. Wichtige Architekturentscheidungen

### Aufgabe 5B – verbindliche Quellenprüfung und Import-Gate

- Geprüft wurden GGG Developer Docs/API/Terms, der offizielle PoE2-Passivbaumexport, RePoE-PoE2, PoE2DB, nicht dokumentierte Endpunkte/Spieldateien und manuelle Erfassung. Belege und Interpretationsgrenzen stehen in `docs/DATA_SOURCE_REFERENCES.md`.
- `data-sources/source-approval.json` ist die maschinenlesbare Wahrheit für Quellenstatus, zehn kontrollierte Bedingungen, Kategoriezuordnungen, globale Sperren und Review-Trigger. Sie enthält ausschließlich Metadaten, keine Spieldaten.
- Historischer 5B-Stand: Nur `local-synthetic-fixtures` war `approved`; GGG-Baumexport, RePoE und PoE2DB waren damals `blocked`. Spätere eng begrenzte Entscheidungen für Baumexport und 5M.0-Affixscope stehen am Anfang dieses Protokolls und in der maschinenlesbaren Approval-Datei.
- Keine der 24 geprüften echten Datenkategorien ist freigegeben. Bilder/Icons sind separat blockiert. Technische Erreichbarkeit, öffentliche Git-Repositories oder die Lizenz eines Extraktionswerkzeugs gelten nicht als Datenlizenz.
- `src/import/approval.ts` enthält Approval-Typen, JSON-Parser, strukturelle Validierung und `evaluateImportApproval`. Der Guard ist rein, deterministisch und netzwerkfrei. Fehlende/ungültige Dateien, unbekannte Quellen/Kategorien, nicht freigegebene Status, falsche Zuordnung und unerfüllte Bedingungen blockieren; synthetische Fixtures bleiben unabhängig erlaubt.
- Aufgabe 5C darf noch keinen echten Import implementieren. Zuerst ist eine schriftliche, kategorienbezogene Erlaubnis erforderlich. Bevorzugtes enges Klärungsziel ist der offizielle Passivbaumexport ohne Assets, einschließlich Release-Abruf, lokaler Speicherung, normalisierter Ableitungen, öffentlicher Repository-/Pages-Weiterverteilung, Attribution und kommerzieller Einordnung.
- Keine echten Daten wurden geladen oder eingecheckt, kein Scraper/Crawler implementiert, keine Quelle praktisch abgerufen, keine neue Abhängigkeit ergänzt und Engine/UI fachlich nicht verändert.
- Automatische 5B-Prüfung: 372 reguläre Tests in zwölf Dateien, darunter 14 Approval-/Guard-Tests; Fixture-Import 23 Datensätze/0 verworfen; Lint, Typecheck und Pages-Produktionsbuild erfolgreich. Approval-Datei mit sieben Quellen und 24 Kategorien erfolgreich validiert; Artefakt ohne lokale Windows-Pfade oder bekannte Secret-Muster, Guard ohne Netzwerkcode.

### Aufgabe 5A – Deployment- und Auditstand

- GitHub Pages wird aus `main` über `.github/workflows/deploy-pages.yml` mit ausschließlich offiziellen GitHub-Actions gebaut und veröffentlicht. Der Workflow nutzt minimale Berechtigungen (`contents: read`, `pages: write`, `id-token: write`), das Environment `github-pages` und eine Concurrency-Gruppe mit Abbruch veralteter Läufe.
- Maßgeblicher Paketmanager ist npm wegen `package-lock.json`; CI verwendet Node 22 und `npm ci`. Es wurde kein weiteres Lockfile und keine Abhängigkeit ergänzt.
- Vite verwendet im Produktions-Build zentral `/poe2-equipment-build-planner/`, lokal weiterhin `/`. Das Build-Skript benennt `vite.config.ts` explizit, damit eine veraltete ignorierte JavaScript-Ausgabe die Pages-Konfiguration nicht übersteuern kann.
- Die öffentliche URL `https://saxxxos.github.io/poe2-equipment-build-planner/` ist erreichbar. Die zuvor fehlende Pages-Aktivierung wurde extern vorgenommen; am 20. Juli 2026 wurden Seite, JavaScript/CSS, Reload und Kerninteraktionen auf der echten Pages-Domain bestätigt.
- `docs/ENGINE_UI_INTEGRATION_AUDIT.md` dokumentiert den tatsächlichen React-State, den `analyzeBuild`-Vertrag, Datenherkunft, Validierungs- und Fehlergrenzen, die geplante Adapterkette, Ergebniszuordnung sowie bewertete Integrationsrisiken. Empfohlen ist nach dem UI-Redesign nur ein kleiner vertikaler Adapter-Schnitt; Engine-Typen bleiben außerhalb der React-Komponenten.
- `docs/DATA_SOURCE_RELEASE_AUDIT.md` dokumentiert Pipeline, vollständige Datenbedarfsmatrix, mögliche Quellen, offene Lizenz-/Zugriffs-/Attributionsfragen und die verbindliche Freigabecheckliste. Der Gesamtstatus echter PoE2-Daten ist `blocked`; PoE2DB wurde nicht aufgerufen, es wurden keine externen Daten heruntergeladen oder importiert.
- Die sichtbare Berechnung bleibt ein Platzhalter und ruft `analyzeBuild` nicht auf. Es wurden weder Analyzer, Preise, DPS, Cooldowns, Zeitmodelle noch fachliche Regeln verändert.
- 5A-Prüfung: Fixture-Import mit 23 synthetischen Datensätzen und 0 Verwerfungen; 358 reguläre Tests in elf Dateien, Lint, Typecheck und Produktions-Build erfolgreich. Der gebaute HTML-Einstieg referenziert JavaScript und CSS unter `/poe2-equipment-build-planner/assets/`; keine lokalen Windows-Pfade, bekannten Schlüssel-/Tokenmuster oder eingecheckten Build-Artefakte gefunden. GitHub bestätigte `npm ci` und Build. Öffentliches Deployment und Pages-Browser-Smoke-Tests bleiben bis zur einmaligen Aktivierung ungetestet und dürfen nicht als erfolgreich gelten.
- Der Produktionsbuild wurde zusätzlich in einer lokalen statischen Project-Pages-Verzeichnisstruktur geprüft. Bei 390 × 844 (effektive Dokumentbreite 375 Pixel) und 1280 × 800 (effektive Dokumentbreite 1265 Pixel) entsprach `scrollWidth` jeweils `clientWidth`; es gab keine Browserkonsolenfehler. Klasse/abhängige Aszendenz, Level, Ziel, Affixdialog und -suche, Hinzufügen/Entfernen eines Affixes, Waffen-Set-Auswahl, Rubinjuwel-Auswahl, Testbaum-Zoom auf 120 Prozent und Platzhalterberechnung funktionierten. JavaScript und CSS wurden über den Pages-Unterpfad geladen; ein Reload der statischen Projekt-URL funktionierte.
- Öffentlicher Smoke-Test am 20. Juli 2026: Charakterwechsel auf Zauberin aktualisiert die Aszendenz, Affixdialog/-suche, Rubinjuwel-Auswahl, Testbaum-Zoom auf 120 Prozent und Platzhalterberechnung funktionieren. JavaScript/CSS laden unter dem Repository-Unterpfad; Mobil (390 × 844, effektive Breite 375) und Desktop (1280 × 800, effektive Breite 1265) ohne horizontalen Überlauf oder Konsolenfehler. Nicht auf einem physischen Touchgerät getestet.
- Bekannte Risiken: umfangreiche Engine-Ergebnisse benötigen später ViewModels; UI- und Engine-IDs sowie nicht im App-State gehaltene Juweldaten müssen vor einer Integration normalisiert werden; echte Daten bleiben bis zur dokumentierten Freigabe gesperrt.

- Eine React-Einzelseite ohne Router, Backend, Datenbank oder Authentifizierung
- Lokaler React-State; normalisierte Platzhalterdaten zentral in `src/data.ts`
- Flache Domänenstruktur in `src/domain/` mit Barrel-Export; Definitionen sind von konkreten Konfigurationen getrennt
- Anzeigenamen sind keine Primärschlüssel; Beziehungen speichern stabile String-IDs
- Gemeinsame `GameDataMetadata` modellieren Quelle, Version, Status und kontrollierte Mechanik-Tags
- Keine Laufzeit-Validierungsbibliothek; reine TypeScript-Funktionen liefern verständliche Fehlerlisten
- Vitest ist die einzige für Aufgabe 2 neu hinzugefügte Testabhängigkeit
- Importformat ist eine Entkopplungsgrenze: externe Strukturen dürfen weder UI noch Engine direkt erreichen
- Importpipeline ist rein, netzwerkfrei und dateisystemfrei; der CLI-Testlauf nutzt die vorhandene Vitest-Toolchain, daher keine neue Abhängigkeit
- FNV-1a-32 dient als reproduzierbare Integritätskennung, nicht als kryptografischer Sicherheitsnachweis
- Importfehler sind strukturierte `ImportIssue`-Objekte und werden niemals stillschweigend ignoriert
- Echte PoE2DB-Daten bleiben blockiert, bis Abruf, Speicherung, Attribution und Weiterverteilung ausdrücklich geklärt sind
- Der offizielle GGG-Passivbaumexport ist der bevorzugte technische Kandidat für einen späteren eng begrenzten Import; Rechte und Assets bleiben vorab zu klären
- Reines CSS ohne UI-Bibliothek; SVG für den Demonstrationsbaum
- Keine externen APIs oder geschützten Spielgrafiken
- Engine und UI sind strikt getrennt; `src/engine/` importiert ausschließlich Domänentypen und besitzt keine React-Abhängigkeit
- Verbindlicher Engine-Datenfluss: Equipment, BuildProfile, Skills, Supports, Passive, Juwele, Uniques, Rotationen, Erklärungen, BuildAnalysis
- Harte Regeln sind blockierende `ConstraintViolation`; weiche Regeln verwenden ausschließlich zentral definierte Bewertungskategorien
- `BuildProfile` nutzt normierte Affinitäten im dokumentierten Bereich 0 bis 100 und enthält keine realen Spiel- oder DPS-Werte
- Empfehlungen werden deterministisch nach Score und bei Gleichstand nach technischer ID sortiert
- Orchestrator und Analyzer verwenden in Aufgabe 4A ausschließlich übergebene synthetische Kandidaten und keine Datei-, Zeit-, Zufalls- oder Netzwerkabhängigkeit
- Equipment-Regeln und sämtliche fachlichen Schwellen sind zentral in `rules.ts` und `config.ts`; die Normalisierung liegt in einer reinen Funktion
- Direkte Equipment-Hinweise werden stärker gewichtet als indirekte; jede Contribution bleibt über strukturierte Reason-Details nachvollziehbar
- Waffen-Sets werden separat und kombiniert analysiert, ohne Rotationslogik aus Aufgabe 4H vorwegzunehmen
- Equipment-Konflikte sind weiche Warnungen; nur technisch unbekannte Modifier-Referenzen blockieren als harte Verstöße
- Dominanz-Gleichstände werden deterministisch nach technischer ID beziehungsweise bei Waffen-Sets als `balanced` aufgelöst
- Skill-Regeln und Schwellen liegen zentral in `src/engine/skills/rules.ts` und `config.ts`; Skill-Metadaten wurden nur optional erweitert
- Blockierte Skills bleiben erklärbar sichtbar, werden jedoch stets hinter gültigen Kandidaten sortiert
- `profileClarity` beeinflusst Confidence getrennt vom Score; Zielprofile beeinflussen Mapping-/Bossranglisten über synthetische Gewichte
- Skill-Set-Scores erzeugen nur Eignungshinweise und nehmen keine Rotationslogik vorweg
- Support-Regeln, Schwellen, Trade-off-Gewichte und Normalisierung liegen zentral in `src/engine/supports/rules.ts` und `config.ts`
- Jeder Support wird unabhängig gegen den bereits ausgewählten Skill bewertet; es gibt bewusst keine kombinatorische Suche
- Blockierte Supports bleiben erklärbar sichtbar, sind aber nicht auswählbar und stehen hinter gültigen Kandidaten
- Set-Eignung und Confidence sind vom Gesamtscore getrennte Ausgaben; technische IDs entscheiden jeden Ranglisten-Gleichstand
- Passive-Regeln und Schwellen liegen zentral in `src/engine/passives/rules.ts` und `config.ts`
- Die Graphprüfung validiert ausschließlich den übergebenen Kandidatenpfad; es gibt keine alternative, kürzeste oder globale Pfadsuche
- `scorePerPoint` und `pathEfficiencyScore` sind getrennte synthetische Effizienzsignale; Pfadknoten bleiben explizite Kosten und können eigenen Nutzen beitragen
- Jewel- und Cluster-Sockel sind nur Anschlusswerte und lösen keine Juwelbewertung aus
- Rotationsregeln und sämtliche Schwellen liegen zentral in `src/engine/rotations/rules.ts` und `config.ts`; der Generator liest vorgelagerte Ergebnisse ausschließlich
- Waffenwechsel sind explizite Schritte und entstehen nur zwischen unterschiedlichen konkreten Sets; `both` löst keinen Wechsel aus
- Maintenance, Wiederholung, Complexity und Confidence sind strukturierte, voneinander getrennte Ausgaben ohne echte Zeitwerte oder Qualitätsbehauptung
- Erklärungstemplates, Prioritäten und Confidence-Formulierungen liegen zentral unter `src/engine/explanations/`; Analyzer liefern weiterhin ausschließlich strukturierte Daten
- Jede Erklärung besitzt einen deterministischen Trace; unbekannte Codes verschwinden nie stillschweigend und fehlende Anzeigenamen verwenden nur technische IDs
- Der verpflichtende Begrenzungshinweis basiert auf einem kontrollierten Template und nennt synthetische Regeln, fehlende echte Daten, fehlende DPS und fehlende fachliche Verifikation

## 12. Nächste empfohlene Aufgabe

Aufgabe 5B gibt noch keine Aufgabe 5C mit echtem Import frei. Zuerst eine schriftliche, kategorienbezogene Freigabe für den offiziellen PoE2-Passivbaumexport ohne Assets einholen. Sie muss automatisierten Release-Abruf, lokale Speicherung, normalisierte Ableitungen, öffentliche Repository-/Pages-Weiterverteilung, Attribution und kommerzielle Einordnung beantworten. Nur bei positiver dokumentierter Antwort darf ein neuer Auftrag 5C auf Passive Nodes, Passive Connections und Jewel Sockets eines fest gepinnten Releases begrenzt werden. Unabhängig davon bleibt die gemeinsame mobile UI-/Designüberarbeitung eine zulässige, getrennte Folgeaufgabe.

## 13. Übergabe für einen neuen Chat

Zuerst Quellcode und dieses Protokoll vergleichen; der Code gewinnt. Danach `data-sources/source-approval.json`, `docs/DATA_SOURCE_APPROVAL.md`, Belege, Import-Fixture, Tests, Lint, Typecheck und Build prüfen. Alle Analyzer, Rotation und Explanation besitzen getrennte Regel-/Template-Module und zentrale Konfigurationen. Der Approval-Guard ist eine vorgeschaltete, reine Sperre; er ist noch mit keinem echten Importer verbunden, weil es keinen echten Importer gibt. Keine echte Kategorie ist freigegeben. Vor Aufgabe 5C muss eine schriftliche Freigabe dokumentiert und die maschinenlesbare Entscheidung geprüft geändert werden. Engine und UI bleiben getrennt; Fixtures und Regeln sind künstlich und keine echten Spieldaten, Zeit-/DPS-Simulation, kombinierte Optimierung, Preise oder fachlich verifizierte Empfehlung.

## Aufgabe 5M.1A – Itemmod-Vollständigkeitsaudit (22. Juli 2026)

- 5M.1 bleibt technisch abgeschlossen, ist aber kein vollständiger PoE2-Itemmod-Bestand. Der Pin enthält 16.678 rohe Mods und 3.450 klassenübergreifende `mods_by_base`-Referenzen; die feste 29-Klassen-Auswahl plus deren Basistyp-Implicits ergibt unverändert 1.828 Records.
- Alle Records sind kategorisiert: 816 Prefixe, 568 Suffixe, 231 Basis-Implicits, 103 Corruption-Implicits und 110 Corruption-Upgrades; kein Special bleibt unresolved.
- Nachgewiesene Filterlücken sind unter anderem Jewels (446 eindeutige Referenzen), Charms (51), Life Flasks (57), Mana Flasks (52) und Relics (137). Wegen Überschneidungen nicht addieren.
- Unique-Items/Unique-Modzeilen, Runen, Soul-Core-Effekte und weitere Spezialkategorien bleiben fachlich beziehungsweise approval-seitig offen. Keine unbekannte Gesamtzahl schätzen.
- 51 Topic-Repositories wurden inventarisiert; die vertieften Quellen wurden commit-genau nur als Auditkontrollen geprüft.
- Maßgeblich sind `docs/POE2_ITEM_MOD_COMPLETENESS_AUDIT.md` und die drei JSON-Berichte. Die neun generierten 5M.1-Dateien und `data-sources/source-approval.json` bleiben bytegleich.
- Keine Approval-Erweiterung, deutschen Texte oder UI-/Engine-/Workeränderung. 5M.1B, 5M.2 und 5N wurden nicht begonnen. Physische iPhone-Abnahme bleibt offen.
- Nächster Schritt: 5M.1B.0 für getrennte technische Scope-/Quellenentscheidungen; Lokalisierung erst nach stabiler technischer Ziel-ID-Menge.

## Aufgabe 5M.1B.0A – zusätzliche Itemklassen (22. Juli 2026)

- RePoE-Pin bleibt `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81`.
- `poe2-technical-jewel-mod-data-for-build-planner`: conditionally-approved nur für 142 normale Prefix- und 178 normale Suffix-IDs; Unique-/corrupted-Sides, Radius-/Passive- und Clustermechaniken blockiert.
- `poe2-technical-charm-mod-data-for-build-planner`: conditionally-approved für 27 Prefixe, 24 Suffixe, 13 basistypreferenzierte Implicits und minimale technische Basiswerte; keine Trigger-/Ladungssimulation.
- `poe2-technical-flask-mod-data-for-build-planner`: conditionally-approved für Life Flasks (33/24) und Mana Flasks (28/24) plus minimale Basiswerte; Kategorien getrennt, keine Flask-Simulation/Quality/Enchantments.
- `poe2-technical-relic-mod-data-for-build-planner`: pending/deferred; 137 IDs liegen ausschließlich in `sanctum_relic`, keine normale Equipmentarchitektur.
- Der Guard prüft bei neuen Scopes Pins, Itemkategorie, Datei, Felder, Negativkategorien, SHA-256-Manifest, Determinismus, Rohspiegel, Runtime-Abruf und Hotlinks. Der bestehende 5M.1-Scope bleibt unverändert.
- Kein Import, keine neuen produktiven Itemklassen, keine UI-, BuildProfile-, Worker-, Analyzer-, Engine- oder Orchestratoränderung. Keine deutschen Texte.
- Uniques bleiben getrennt gesperrt. Runen, Soul Cores, Desecrated, Mutated und andere Spezialmods benötigen getrennte Folgeentscheidungen. 5M.1B, 5M.1B.0B, 5M.1B.0C, 5M.2 und 5N nicht begonnen; iPhone-Abnahme offen.
- Später getrennt: Fotoerkennung, ID-basierter Übersetzungs-Lernmodus, Buildvergleich vorher/nachher und Designoptimierung.
- Nächster Schritt: 5M.1B als technischer, getrennter Import nur der freigegebenen Jewel-/Charm-/Life-/Mana-Flask-Daten; Relics ausschließen.

## 14. Arbeitsregeln des Projekts

## Aufgabe 5M.1 – technischer Affiximport (22. Juli 2026)

- RePoE-PoE2 `4.5.4.4.4`/`b3f38149a9e5ffbba1eae3a9f2ddcdd66481884c`, Parser `14e3edc89ed705bd4e4eda5c8135756431c76e81`, ist ausschließlich im bedingten Scope `poe2-technical-affix-data-for-build-planner` importiert.
- Der minimierte Bestand enthält 1.828 Mods, 445 Familien, 1.828 Tiers, 2.265 Statzeilen, 416 Mehrzeiler/Hybride, 29 Itemklassen und 201 Konfliktgruppen; kein Rohdatenspiegel und keine PoE2DB-Daten.
- UI-Auswahl verwendet technische Itemklasse, Prefix/Suffix, Item Level, Wertebereiche und Konfliktgruppen. Alle sichtbaren technischen Fallbacks sind `translation-missing` und als „Deutsche Übersetzung noch nicht verfügbar“ gekennzeichnet.
- Offene Aufgabe 5M.2: ID-basierte deutsche Affixlokalisierung und vollständige deutsche Affixsuche. Ebenfalls offen bleiben vollständige reale Skill-/Supportdaten, deutsche Skill-/Supporttexte, echte vollständige Buildabnahme, Buildvergleich, Fotoerkennung und Designoptimierung.
- Aufgabe 5M insgesamt ist noch nicht abgeschlossen. 5N wurde nicht begonnen. Physische iPhone-Abnahme des 5M.1-Stands ist offen.

- Ausschließlich im verbundenen Repository arbeiten; `main` ist der Standardbranch.
- Quellcode ist die maßgebliche Wahrheit; keine erfundenen Funktionen oder Tests dokumentieren.
- Kein Routing, Backend, Datenbank, Login, externe API, PoE2DB-Import, echte DPS-/Optimierungs-Engine oder echter Skilltree ohne ausdrückliche Folgeanweisung.
- Bestehende Funktionen nicht unnötig umschreiben, keine unnötigen Abhängigkeiten/Refactorings und keine Dateien ohne Notwendigkeit löschen.
- Mobile und Desktop prüfen; neue Funktionalität angemessen testen.
- README und dieses Projektgedächtnis nach relevanten Änderungen aktualisieren.
## Nachbesserung 5D – offizielle Baumgeometrie (21. Juli 2026)

- Ursache: 40 layoutübergreifende Aszendenzreferenzen wurden als lange Linien gezeichnet; nicht skalierende 14-/16-Pixel-Striche verdichteten die Gesamtansicht optisch zur Kugel.
- Der Import war korrekt. Offizielle `node.x/y` sind bereits absolute Weltkoordinaten; Gruppe und Orbit werden nicht erneut addiert. `resolvePassiveNodeWorldPosition` ist die einzige Auflösung.
- Hauptbaum-Bounds verwenden sichtbare Nicht-Aszendenzknoten plus einmalig 420 Padding; `worldBounds` hält alle Layoutpositionen vor.
- 6.027 von 6.067 Referenzen werden innerhalb desselben Layouts gezeichnet; 40 `layout-transition`-Referenzen bleiben fachlich erhalten. Eine SVG-ViewBox transformiert Knoten und Linien gemeinsam.
- Diagnose: 5.150 Knoten, 1.621 Gruppen, 19 Juwelsockel, sechs getrennte Klassenstarts und null 0/0-Fallbacks, fehlende Gruppen, nicht endliche Positionen oder Ausreißer.
- Pathfinder, Targeting, Planner, reale Pipeline, Passive Analyzer und `analyzeBuild` sind unverändert. Keine anderen Datenquellen oder Assets.
- Aufgabe 5I ist gestoppt und nicht begonnen. Erst nach Abnahme darf sie neu beauftragt werden.
## Nachbesserung 5D.2 – Touch und ausgewählte Aszendenz

- Pointer-Map mit Ein-Pointer-Pan, Zwei-Pointer-Pinch, Mittelpunktanker, sauberem Up/Cancel und sprungfreiem Pinch-zu-Pan-Wechsel.
- Zentrale Zoomgrenzen und Faktoren in `src/tree-view/gestures.ts`; Wheel verwendet den Mauspunkt.
- Explizite UI-ID-Zuordnung verbindet vorhandenen Charakter-State ohne Engine mit offiziellen Klassenindizes und Aszendenz-IDs.
- Hauptbaum bleibt geometrisch unverändert; genau die gewählte Aszendenz erscheint mit offizieller relativer Geometrie als Inset. Keine langen Layoutübergänge.
- Der offizielle 0.5.2-Commit enthält einen Assetordner und `data.json` enthält Bild-/Iconpfade. Mangels ausdrücklicher Medienlizenz beziehungsweise belastbarer Repository-/Pages-Weiterverteilungsfreigabe bleibt `icons-images` blockiert. Keine Assets heruntergeladen, kopiert oder hotgelinkt.
- SVG-Rahmen und zoomabhängige Detailstufen verbessern die Hierarchie ohne fremde Bilddaten.
- Aufgabe 5I ist weiterhin gestoppt und nicht begonnen; Engine und Orchestrator bleiben unverändert.

## Nachbesserung 5D.4 – Knotenmotive

- Behoben: Der Assetimport verwendete die innere Skillkennung `node.id` statt der technischen Baum-ID aus dem äußeren `data.json.nodes`-Schlüssel. Dadurch fehlte etwa für Skill Speed `26798` die Auflösung.
- Behoben: `.tree-viewport svg` skalierte verschachtelte Sprite-SVGs auf Viewportgröße. Die Regel gilt nur noch für das direkte Baum-SVG; Spriteausschnitte verwenden lokalen ViewBox, negativen Atlasoffset und ClipPath.
- Skill Speed `26798`: `attackspeed.png`, inaktiv `skills-disabled.webp`, aktiv `skills.webp`, jeweils `884/136/34/34`.
- 20 Referenzknoten sind maschinenlesbar und als deterministische SVG-Vergleichstafel dokumentiert. 51 nicht als normale Motive auflösbare Pfade gehören ausschließlich zu 365 Mastery-Knoten und bleiben gemeldete Fallbacks; Mastery-Hintergrundmuster werden nicht als normale Icons zweckentfremdet.
- Nutzerbestätigt vor 5D.4: physisches iPhone mit Pinch, Pan, Baum, zentraler Aszendenz und Wechseln. Physische Abnahme des neuen Motivstands bleibt offen.
- Keine Änderung an Gesten, Aszendenzplatzierung, Klassenregister, Engine, Orchestrator, Pathfinder, Targeting oder Planner. Aufgabe 5I bleibt nicht begonnen.

## Nachbesserung 5D.4.1 – Verbindungssichtbarkeit

- Ursache: Der Renderer zeichnete alle 6.027 gleichlayoutigen Exportkanten dauerhaft. Dabei ging das offizielle `hideConnection`-Signal von zwölf Smith-of-Kitava-Spezialknoten verloren.
- Der Baumimport leitet daraus ausschließlich `hideInDefaultState` an den zwölf Kanten zu Smith’s Masterwork (`9988`) ab. Keine Kante wird gelöscht; 6.067 logische Kanten und 6.027 gleichlayoutige Kanten bleiben erhalten.
- Zentrale Entscheidung in `src/tree-view/connections.ts`: `normalVisible`, `hiddenUntilActive`, `decorative`, `glowOnly`, `unknown`. Aktueller Exportbestand: 6.015 normal sichtbare Kanten, zwölf im Ruhezustand verborgene Effektkanten, null eindeutig dekorative/glow-only Kanten und 40 weiterhin getrennte Layoutübergänge.
- Aktivierung verlangt explizit beide aktiven Endpunkte. Die aktuelle reine Baumansicht besitzt keine Punktebelegung; Auswahl wird nicht als Aktivierung interpretiert. Dadurch bleiben die zwölf Effektverbindungen im Ruhezustand unsichtbar.
- `orbit/orbitX/orbitY` bleiben Geometrieangaben. Mastery- und Jewel-Verbindungen werden ohne Exportflag nicht pauschal ausgeblendet.
- Knotenmotive, Spriteatlanten, Assetimport, Geometrie, Gesten, Klassenregister, Aszendenzplatzierung, Engine, Orchestrator, Pathfinder, Planner und Targeting bleiben unverändert. Aufgabe 5I bleibt nicht begonnen.
# Nachbesserung 5D.4.2 – forensische Baumdarstellung

- Der öffentliche Vorzustand und Mobalytics wurden in mehreren Baumregionen direkt visuell verglichen. Mobalytics war ausschließlich sichtbare Referenz; kein Code, CSS, HTML, Netzwerkdatensatz, Asset oder proprietäre Konfiguration wurde übernommen.
- Offizielle Ursache: 1.733 Kanten besitzen `orbitX/orbitY`; der alte Renderer verwarf diese Felder und zeichnete Sehnen. Der Import bewahrt sie, `resolveTreeConnectionGeometry` zeichnet deterministische kurze Kreisbögen. Knoten- und Gruppenkoordinaten bleiben unverändert.
- 365 offizielle Mastery-Zentren und ihre 644 Effektkanten sind im Ruhezustand verborgen. Damit entfallen erfundene graue Fallbackkreise und dauerhafte Mastery-Speichen; `activeEffectImage` wird nicht als gewöhnliches Knotenmotiv missbraucht.
- Verbindungssichtbarkeit, Geometrie und Stil sind zentral. Normale Grundlinien sind dünner und warmgrau; normale Passiven nutzen den bereits importierten offiziellen `PSSkillFrame`.
- Klassenregister, zentrale Aszendenzplatzierung, Pinch/Pan, Engine, Orchestrator, Pathfinder, Targeting und Planner bleiben unverändert. Aufgabe 5I wurde nicht begonnen. Die physische iPhone-Abnahme des neuen Stands bleibt offen.
## Aufgabe 5M.1B – Jewels, Charms und Flasks (2026-07-22)

- Gepinnt importiert: 320 normale Jewel-Mods, 64 Charm-Mods inklusive 13 Base-Implicits, 57 Life-Flask- und 52 Mana-Flask-Mods; Laufzeit dedupliziert gemeinsame IDs auf 427, Überschneidung mit 5M.1: null.
- UI, BuildProfile und Worker transportieren Base/Klasse/Mod/Tier/Stat/Wert/Source. Jewel-Stats bleiben unsupported, Charms/Flasks transport-only; keine Textheuristik, Simulation oder automatische Analyse.
- Relics deferred; Uniques und Socketables ausgeschlossen beziehungsweise blocked/pending; keine deutschen Texte; 5M.2/5N nicht begonnen; physisches iPhone offen. Details: `docs/POE2_ADDITIONAL_ITEM_CLASS_TECHNICAL_IMPORT.md`.
## Aufgabe 5M.2.1 – lokaler deutscher Extraktions-Preflight (2026-07-22)

- Ausgang: 5M.2.0 abgeschlossen; 5M.2.1 als rein lokaler, nichtproduktiver Audit gestartet.
- Lokaler Spielpin: GGG-Standalone `4.5.4.53018`, `Content.ggpk` SHA-256 `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`.
- Parserpin: RePoE `14e3edc89ed705bd4e4eda5c8135756431c76e81`; lokale PyPoE-Abhängigkeit `c30ad895282fc703a804d77e26e8e5c939f57b93`.
- Ergebnis: ItemClasses erfolgreich; 117 deutsche/117 englische IDs, vollständige ID-Parität, zwei deutsche Ausgaben byteidentisch. 32/33 produktreferenzierte IDs haben deutsche Namen; `Charm` fehlt.
- Mods, Statzeilen, Stat-IDs, Kombinationen, Mehrzeiler/Hybride, Basistypen und Templatelücken sind `not-assessable`: aktuelles Clientschema und PyPoE-Spezifikation führen zu `struct.error` vor Ausgabe.
- StatDescriptions wurden nicht gestartet, da das gepinnte Modul zwingend die Trade-API abfragt; Netzwerk-/Trade-Daten waren verboten.
- Mehrdeutigkeiten, Bedingungen, Varianten, Platzhalter und OCR-Tauglichkeit bleiben für Stattexte Unbekannt. Foto-Modus ist derzeit nicht geeignet.
- Distributionsstatus: keine Produktfreigabe. Alle deutschen Scopes bleiben `pending`; `translation-missing` bleibt produktiv aktiv. Keine deutschen Volltexte oder Spieldateien im Repository.
- 5M.2 und 5N wurden nicht begonnen. Fotoerkennung und Übersetzungs-Lernmodus bleiben spätere Aufgaben.
- Für PlayStation ist später ein ausgelieferter Web-Datensatz oder ein separates Sprachpaket nötig; dafür ist eine separate Approval-Entscheidung erforderlich.
- Buildvergleich, Designoptimierung und mobile Textklippung bleiben offen.
- Nächster empfohlener Schritt: gesonderter Kandidatenaudit eines aktualisierten Parser-/PyPoE-Stacks gegen denselben Containerpin, ohne Trade-API und ohne Änderung des bestehenden Pins.

## Aufgabe 5M.2.2 – deutscher Parser-Kandidatenaudit (2026-07-22)

- 5M.2.1 scheiterte für Mods und Basistypen an der inkompatiblen PyPoE-Tabellenspezifikation; StatDescriptions wurden wegen des vor lokaler CSD-Verarbeitung zwingenden Trade-API-Aufrufs nicht gestartet.
- Drei genaue Kandidaten wurden vertieft geprüft: RePoE `14e3edc89ed705bd4e4eda5c8135756431c76e81` + PyPoE `c30ad895282fc703a804d77e26e8e5c939f57b93`; PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` + ooz 0.2.4; poe2-mcp `163c30a9fd45f815d330cc54e6ab51a797693d31`.
- RePoE/PyPoE hat keinen neueren Remote-Head und bleibt für Mods/Basistypen inkompatibel sowie für StatDescriptions ohne Offline-Modus ungeeignet. Der bestehende Produktivpin wurde nicht verändert.
- PoB2/ooz extrahierte offline und zweimal manifestidentisch fünf Balance-DATC64-Dateien sowie 589 CSD-Dateien. Der GUI-orientierte DatView-Pfad belegt jedoch keinen unbeaufsichtigten verlustfreien deutschen/englischen Strukturexport; Produktcoverage bleibt `notAssessable`.
- poe2-mcp besitzt am geprüften Pin den dokumentierten Gesamt-Entrypoint nicht und keinen vollständigen aktuellen Schema-/Locale-Vertrag; der Start endete mit Exitcode 2.
- Keine Trade-API, kein PoE2DB, kein Webseiten-Scraping und keine externe Laufzeitdatenquelle wurden verwendet. Kandidaten, Rohdaten, Volltexte, Tools und Logs bleiben ausschließlich unter `.local-audits/`.
- `StatsValues` ist im PoB2-Schema sichtbar, aber end-to-end nicht verifiziert; `BondedStatsValues` und die Socketable-Eignung bleiben unbekannt beziehungsweise ungeeignet für Freigabe.
- Keine 2.255-Mod-, 2.705-Statzeilen-, 431-Stat-ID-, 444-Kombinations-, 429-Mehrzeiler-/Hybrid-, 39-Basistyp- oder 485-Lücken-Coverage konnte belastbar erzeugt werden. Fehlgeschlagene Kandidaten werden nicht als Null-Coverage dargestellt.
- `Charm` bleibt als technische ItemClass-ID ungeklärt. Keine Zuordnung wurde aus sichtbarem Text abgeleitet.
- Klare Empfehlung: Kein Kandidat ist ausreichend; eine begrenzte eigene Parseranpassung benötigt einen separaten Auftrag. Danach sind ein eigener Pin-, Approval- und Distributionsentscheid erforderlich.
- Alle deutschen Produktlokalisierungsscopes bleiben `pending`, `translation-missing` bleibt aktiv, keine deutschen Produkt- oder Volltexte wurden committed.
- 5M.2 und 5N wurden nicht begonnen. Fotoerkennung, Übersetzungs-Lernmodus, PlayStation-Sprachpaket, Buildvergleich, Designoptimierung und mobile Textklippung bleiben spätere getrennte Aufgaben.
- Nächster empfohlener Schritt: begrenzter Parseranpassungsauftrag nur für einen gepinnten unbeaufsichtigten Offline-Auditexport, noch ohne Produktimport oder Approval.

## Aufgabe 5M.2.3 – gepinnter Offline-Item-Auditparser (2026-07-23)

- 5M.2.2 ist abgeschlossen. 5M.2.3 implementiert ausschließlich `scripts/poe2-offline-item-audit/index.mjs`; keine Produktpipeline wurde ersetzt.
- Pins: Container `a917a56f…a18e28`, PoB2 `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`, Schema `268ae3a3…d3d30`, ooz 0.2.4/Artefakt `e6d7e728…94af4`, Parserformat 1, Node 24.14.0.
- Architektur: Pin-/Pfadguard → deterministische Lua-Schemaextraktion → DATC64-Dekodierung → technische Referenzen → UTF-16LE-CSD-Struktur → Produktvergleich → lokale Voll- und bereinigte Berichte.
- Tabellen: Mods 16.678/677 Bytes, Stats 27.178/106, BaseItemTypes 5.476/360 und Tags 1.327/44 passen exakt. ItemClasses 117/150 besitzt gegenüber 149 Schemabytes ein unbekanntes Byte und bleibt vollständig ungelöst.
- Produktcoverage: 2.255/2.255 Mod-IDs, Statfolgen und Werteintervalle stimmen; 2.705 Statzeilen, 431 Stat-IDs und 444 Kombinationen sind vorhanden. 429 Mehrzeiler/Hybride und 39 Basistyp-IDs stimmen technisch, bleiben wegen fehlender Zieltabellen teilweise aufgelöst. 33 Itemklassen bleiben ungelöst.
- Deutsche CSD: 589 Dateien, 19.916 Einträge, 324.035 Varianten, 16.284 deutsche Stat-IDs. 419/431 Produkt-Stat-IDs und 447/485 bisherige Templatelücken besitzen deutsche CSD-Strukturen. 33 Deutsch-/Englisch-Strukturkonflikte bleiben sichtbar.
- Unique-Ergebnis: Identitäten, Basistypketten, Varianten, Mods, Rollbereiche und Skill-/Supportreferenzen Unbekannt, weil die notwendigen Tabellen fehlen. Keine Unique-Freigabe.
- Socketable-Ergebnis: Identitäten Unbekannt; `StatsValues` nicht Ende-zu-Ende aufgelöst; `BondedStatsValues` `schema-unknown`. Frühere Zahlen wurden nicht ungeprüft übernommen. Keine Socketable-Freigabe.
- Charm-ID bleibt ungelöst; keine Namens- oder Textähnlichkeitszuordnung.
- OCR-Audit lokal: 25.648 normalisierte deutsche Strukturen, 2.189 mehrdeutig. Reguläre Items teilweise geeignet; Uniques/Socketables Unbekannt. Keine OCR/Fotofunktion implementiert.
- Zwei vollständige Läufe sind byteidentisch: Normalisierung `c001bcc8…f15f`, bereinigter Bericht `065c3b26…d5016`.
- Offlinegarantie: kein HTTP/HTTPS/DNS, keine Trade-API, kein PoE2DB, keine Webseite, kein Hotlink. Volltexte und Rohdaten bleiben unter `.local-audits/`.
- Produktivpin, `source-approval.json`, Produktdaten, UI, BuildProfile, Worker, Analyzer, Engine, Baum und `translation-missing` sind unverändert.
- 5M.2 und 5N wurden nicht begonnen. PS-Sprachbestand, Fotoerkennung, Lernmodus, mobile Textklippung, Buildvergleich und Designoptimierung bleiben spätere Aufgaben.
- Nächster Schritt: separater gepinnter Input-Erweiterungsaudit für fehlende Enum-/Referenz-, Unique- und Augments/Socketable-Tabellen sowie die ItemClasses-Schemadrift; noch kein Produktimport.

## Aufgabe 5M.2.5 – Abschlussstatus

- Audit-only mit unveränderten Pins. ItemClasses: 117 EN/117 DE, 150 statt 149 Schema-Bytes; 49 mögliche Offsets (65–113), exakter Offset/Semantik `unknown`, 33 Produktklassen partial.
- `Charms` stammt aus RePoE/Projekt-Normalisierung (`project-normalized-id`), nicht aus Namensableitung.
- 295 SoulCores bleiben partial; 552 StatsValues- und 510 BondedStats-Wertepaare sowie 30 Category→ItemClass[]-Kategorien sind strukturell belegt, das Zusatzbyte bleibt unbekannt.
- Domain und Generation Type sind durch Schema, Enumgenerator und Consumercode für 2.255/2.255 Mods bestätigt. ModFamily/ModType sind Referenzen, Konfliktsemantik bleibt `unknown`; 0 resolved/2.255 partial.
- Lokalisierung unverändert: 419/431 Stat-IDs, 12 fehlend, 38 Templatelücken, 2.189 OCR-Mehrdeutigkeiten. Zwei Läufe byteidentisch (`b9cb4850…5d701c7`), vollständig offline.
- Produktivpin, Approval, Produktdaten, `translation-missing`, UI, Worker, Analyzer, Engine und Baum unverändert. Keine Rohdaten/Volltexte committed; 5M.2/5N nicht begonnen.
- Nächster Schritt: gepinntes Schemaquellen-Audit für die Restbytes und Konfliktgruppensemantik; Fotoerkennung, PS-Sprachbestand und mobile Textklippung bleiben offen.

## Aufgabe 5M.2.6 – Abschlussstatus und Priorität

- Auftraggeberpriorität: Unique-Affixe sind vor regulärer deutscher Lokalisierung, OCR/Foto, Soul Cores, 5M.2 und 5N zu klären.
- 25 lokale Unique-Kandidatendateien wurden zweimal offline extrahiert (25.477.050 Bytes; Manifest `c4fdc6fe…972752c`) und zweimal auditiert (`fd9a0418…8759283`, byteidentical).
- Gefunden: 449 UniqueStashLayout-Fragmente, 17.163 VisualIdentity-Zeilen, 48 UniqueChests, 1 Mutated-Modset, 14 Legacy-Mage-Definitionen, 65 ModGrantedSkills. Keine davon bildet eine vollständige Item-Unique-Identität.
- Technische Unique-Item-Identitäten 0; Basis-/Itemklassenreferenzen 0; Versionen/Varianten 0; Item-Modreferenzen und direkte Unique-Statdefinitionen 0.
- 311 nicht-itembezogene Modreferenzen auf 265 Mods, 278 Statzeilen/Werte und je 261 deutsche/englische CSD-Zeilen wurden getrennt belegt und nicht als Item-Affixe gezählt.
- Granted Skills mit Unique-Item-Zuordnung 0; Granted Supports `unknown`. Unique-Implicits/Spezialeffekte mangels Identitätskette nicht beurteilbar.
- Importfähigkeit: Nein. Unique-Affixe technisch vollständig geklärt: **Nein**. Blocker sind fehlende Item-Unique-ID-, Unique→Base-, Unique→Mod/Stat- und Version-/Variantenketten.
- Keine Rohdaten/Volltexte oder Unique-Daten importiert; Produktivpin, Approval, Analyzer, UI, Engine und `translation-missing` unverändert. 5M.2/5N nicht begonnen.
- Nächster Schritt: separate lokale Quellenentscheidung, ob serverseitige Unique-Definitionen überhaupt im Clientcontainer materialisiert sind oder eine zulässige offizielle ID-Quelle benötigt wird.

## Aufgabe 5M.2.8 – PoB2-Unique-Planerdaten-Approval

- 5M.2.7 abgeschlossen: keine geprüfte Quelle liefert die vollständige GGG-Unique-ID-/Base-/Mod-/Stat-/Werte-/CSD-Kette.
- Auftraggeberentscheidung: `PathOfBuildingCommunity/PathOfBuilding-PoE2@c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` darf als eigenständige `pob2-planner-data`-Quelle für Uniques vorbereitet werden.
- Neuer Scope `poe2-pob2-unique-planner-data`: `conditionally-approved`, aber Distribution `pending`, Produktimport blockiert und 5M.2.9 erforderlich.
- Erlaubt geplant: PoB2-Quellidentität, Name, Basisanzeige, Slot/Kategorie, Level, Varianten, sichtbare Planerzeilen, belegte PoB2-Rollbereiche, Implicits, Legacy- und Provenienzstatus.
- Verboten: technische GGG-IDs, reguläre Affixe, Crafting-/Spawnweight-/CSD-Daten, deutsche Texte, Medien, Hotlinks, Runtime-Netzwerk, Scraping, Socketables und Skill-/Support-Vollimporte. Unique-linked Skill-/Supporthinweise bleiben pending.
- Modell: Namespace `pob2:<source-record-id>`, Fixtures `fixture:<id>`; `gggIdentityStatus: unknown`; keine implizite Feldherkunft. Varianten und Modzeilen bleiben quellenspezifisch.
- 20 statische Unique-Quelldateien sind mit SHA-256 festgelegt; `Special/Generated.lua`, Loader, leere Kategorien und Voll-Datenbank sind ausgeschlossen.
- MIT-Codelizenz bestätigt; Herkunft/Weiterverteilung der mitgelieferten GGG-/Community-Itemdaten nicht eindeutig durch MIT gedeckt und deshalb `distribution-pending`. Attribution ist Pflicht; keine Rechtsfreigabe behauptet.
- Dedizierter Approval-, Feld-, Produkttrennungs-, Provenienz- und Distributionsguard implementiert. Er erlaubt nur Audit und blockiert `generated/`, `public/` sowie Produktimport.
- Keine PoB2-Unique-Daten, deutschen Unique-Texte oder Produktdateien importiert; Unique Analyzer, UI, Engine, Worker, BuildProfile, RePoE-/PyPoE-Pin und bestehende Approval-Scopes unverändert.
- 5M.2 und 5N weiterhin nicht begonnen. Fotoerkennung und mobile Textklippung bleiben offen; PlayStation-Nutzer benötigen später ausgelieferte Daten.
- Nächster Schritt: Distributionsstatus der statischen PoB2-Unique-Planerdaten klären; erst danach Aufgabe 5M.2.9 unter dem festgelegten Importvertrag.
## Aufgabe 5M.2.11 – deutsche PoB2-Unique-Anzeigeschicht

- 5M.2.10 ist abgeschlossen. 5M.2.11 setzt die ausdrückliche Entscheidung für eine eigenständige deutsche App-Lokalisierung um; sie ist keine offizielle oder technische GGG-Lokalisierung.
- Englisch bleibt technische Unique-Struktur: 435 Items, 579 Varianten, 2.345 Modzeilen, 273 Implicits; Produkt-SHA `db3837b5…a2452`, Fachhash `a5a7e7ba…04329`, PoB2-Pin `c5300ccd…7d0`.
- Neue reine Anzeigedatei: `generated/localization/de/pob2-uniques.json`; Verbindung ausschließlich über `pob2:`-ID, Varianten-ID und Zeilen-ID. Keine Duplikation von Rollbereichen, Provenienz, Analyzer- oder Registrydaten.
- Coverage: 435 Namen, 435 Basistypen, 579 Variantenlabels, 2.345 Modzeilen, 273 Implicits und fünf Systemtexte. Status: 1.992 `reviewed-app-translation`, 2.080 `review-required`, 0 `verified-local-source`, 0 `translation-missing`.
- Der Resolver verwendet Deutsch, danach englischen PoB2-Fallback, danach `translation-missing`. Es gibt keine Runtime-Übersetzung, API, PoE2DB-Automatisierung, Textheuristik als technische Wahrheit oder erfundene GGG-ID.
- Die UI besitzt eine minimale deutsche Unique-Suche und Detailanzeige. Registry, Unique Analyzer, Engine, Worker, BuildProfile, Crafting, normale Affixe und RePoE-Daten bleiben unverändert.
- Nächster Schritt: manueller Sprachreview der `review-required`-Felder. 5M.2 und 5N bleiben nicht begonnen.

## Hauptaufgabe V1 – End-to-End-Integration des Build-Assistenten

- Ausgangscommit: `4f242d9e0cb15624ebe1d0f455d81ee08c9159f9`.
- Die Datenbasisphase ist beendet. 5M.2.11 ist abgeschlossen; 2.080 `review-required`-Texte bleiben späterer Feinschliff und wurden nicht erneut geprüft.
- Der sichtbare statische `buildResult`-Pfad wurde aus `App.tsx` entfernt. Seine Fixture bleibt nur für bestehende Tests.
- Neuer Fluss: Charakter, Ausrüstung, Hauptangriff und Zielprofil → BuildInput → vorhandener `analyzeBuild`-Orchestrator → Equipment-, Skill-, Support-, Passive-, Jewel- und Unique-Analyzer → Rotation und Erklärung → deutscher V1-Bericht.
- Der gewählte Hauptangriff steuert Support und Rotation. Inkompatibilität wird sichtbar und nicht durch stille Skillwahl verdeckt.
- Normale Affixe, leere Slots, PoB2-Uniques und Varianten werden verlustfrei transportiert.
- Die bestehende reale Passive-Analyse bleibt im Worker und verwendet denselben Charakter-, Equipment- und Skillzustand. Keine zweite Engine oder neue Workerarchitektur.
- Der Unique Analyzer verarbeitet 435 produktive `pob2:`-Kandidaten; `fixture:` ist ausgeschlossen. Deutsche Anzeige und englischer Fallback stammen aus der getrennten Lokalisierungsschicht.
- Belegte Grenze: Die PoB2-Kandidaten besitzen keine technischen Mechanik-Tags oder GGG-Stat-Links. Ohne echtes Matchsignal wird keine scheinpräzise Unique-Empfehlung ausgegeben.
- Sichtbar: Zusammenfassung, Equipment, Hauptangriff, gerankte und blockierte Supports, passive Schwerpunkte, Juwelen, belegbare Uniques, Mapping, Boss, Rotation oder Rotationslücke, Konflikte, Trade-offs, Confidence und nächste Schritte.
- Neue UI-Texte sind Deutsch. Unbekannte Inhalte bleiben unbekannt oder nicht verfügbar. Leere optionale Slots sind zulässig.
- Fokussierte Tests prüfen sechs Analyzertransporte, Zielprofilwirkung, Unique-/Fixture-Trennung, Varianten, leere Slots, Determinismus und deutsche Ergebnisbereiche.
- Keine neue Datenquelle, kein Audit, keine Pin-, Crafting- oder Produktdatenänderung, keine Preisberechnung, DPS-Simulation, externe API oder Scraping.
- Maßgeblich: `docs/BUILD_ASSISTANT_V1_END_TO_END.md`.
- Nächster Hauptauftrag: bereits zulässige Kandidatenmetadaten gezielt vertiefen, besonders semantische PoB2-Unique-Signale; keine neue Datenquellenphase.
# Abschluss HAUPTAUFGABE V1.3 – Equipment-first (2026-07-23)

- Ausgangscommit: `d609834125e3a11222a814314cb8eb218a576efe`.
- V1.2 war abgeschlossen; V1.3 korrigiert die sichtbare Produktvision auf „vorhandenen Charakter und reale Ausrüstung nachbauen, daraus Build ableiten“.
- Architektur bleibt unverändert: zentrale React-Eingabe, BuildProfile, vorhandener Orchestrator und bestehende Analyzer.
- Charakterflow: Klassenliste, danach passende Aszendenzen, Level, zusätzliche Story-Passivpunkte und automatisch abgeleitete Gesamtpunkte.
- Equipment-first: räumliche Paperdoll-Gruppierung, getrennte Waffensets sowie eigene Utility-/Juwelbereiche.
- Itemmodell kompatibel erweitert um `rarity`, generische `sockets` und eine
  rein sichtbare `baseDisplayName`-Angabe ohne behauptete technische
  Basistypidentität; `modifierValues` bleibt kanonisch.
- Rare zeigt drei Prefix- und drei Suffixplätze; Implicits bleiben getrennt. Magic nutzt 1/1, Normal 0/0.
- Werteingabe verwendet bestätigte Statzeilen und Grenzen; Tier ist keine Pflichtauswahl.
- Sichtbarer Affixtext bereinigt Parser-Auswahlmarker; deutsche Suchaliasse nutzen vorhandene technische Semantik.
- Sechs dynamische Fertigkeitskarten verwenden den produktiven Skill-/Supportbestand. Supports bleiben kartenbezogen und können durch den vorhandenen Analyzer vorgeschlagen werden.
- Ohne manuelle Hauptfertigkeit wird der beste gültige Hauptskill des bestehenden Rankings verwendet; Nutzerwahl wird nicht heimlich ersetzt.
- Automatische Aszendenz- und Equipmentskills bleiben aus, solange keine technisch belegte Zuordnung vorliegt.
- Ergebnis ergänzt Affixskalierung und eine deterministische Eignungskategorie statt einer nicht belastbaren Prozentzahl.
- Bestehende Waffensets, Passive-Pfade, Mapping, Boss und evidenzgebundene Rotation bleiben erhalten.
- Produktpins, PoB2-Produktdaten, RePoE-Daten, Crafting Engine und Datenquellen wurden nicht geändert.
- Lokale Referenzbilder waren im Workspace nicht verfügbar; die schriftliche Layoutvorgabe wurde mit neutralen Platzhaltern umgesetzt.
- Bekannte Grenzen: Sockelmaxima/-inhalte pro Basis, automatische gewährte Skills und viele deutsche normale Affixtexte sind **Unbekannt** beziehungsweise nicht vollständig belegt.
- Hauptdokument: `docs/BUILD_ASSISTANT_V1_3_EQUIPMENT_FIRST_UX.md`.
- Prüfung: 19/19 fokussierte V1.3-/End-to-End-Tests; vollständiger
  Parallel-Lauf 1.016/1.019 mit drei Zeitüberschreitungen ohne
  Assertion-Fehler; serieller Wiederholungslauf der betroffenen Dateien 50/50.
  Lint, Typecheck, Produktions- und Pages-Build erfolgreich.
- Browser: Desktop und 390 × 844 technisch bedienbar, kein horizontaler
  Überlauf, Rare-Editor mit 3/3 Slots und Startsockel, Live-Suche „Leben“ mit
  46 technisch möglichen Prefixen, keine neuen Konsolenfehler/-warnungen.
- Nächster empfohlener Auftrag: V1.3.1-Praxistest und enger UX-/Sprachfeinschliff mit lokal bereitgestellten Referenzbildern.

# Abschluss Aufgabe V1.3.1 – sichtbare UX-Korrektur (2026-07-23)

- Ausgangscommit: `020ec87f9bc81f9938a5108ef6369153f43fef49`.
- Auftraggeberfeedback: Die V1.3-Oberfläche zeigte eine lange Klassenliste,
  eine große Charakterkarte, nicht löschbare sichtbare Nullwerte, getrennte
  Equipmentblöcke, zweispaltig gequetschte mobile Skillkarten und ungefragt
  vorgefüllte Demo-Skills samt Supports.
- Charakter: genau eine kompakte Klassen- und eine abhängige
  Aszendenzauswahl. Sichtbar sind nur die acht durch
  `selectableInCurrentUi` produktiv bestätigten Klassen Hexe,
  Waldläuferin, Krieger, Zauberin, Jägerin, Söldner, Mönch und Druide.
  Marauder, Duelist, Shadow und Templar bleiben ausgeblendet.
- Level, Passivpunkte durch Level, Story-Passivpunkte und Gesamtpunkte stehen
  in einem kompakten Bereich. Lokale Texteingabeentwürfe beseitigen die
  `Number('') === 0`-Rücksetzung; Level und Storypunkte lassen sich vollständig
  löschen und bleiben bis zur Validierung sichtbar leer.
- Der Produktinitialzustand verwendet eigene leere Fabriken: keine Klasse,
  Aszendenz, Ausrüstung, Fertigkeit, Supports oder Ergebnisse; genau sechs
  leere Startkarten. Demo-Setups bleiben ausschließlich Test-/Datenfixtures.
- Equipment: eine zusammenhängende räumliche Hauptausrüstung mit kompaktem
  Waffenset-1/2-Umschalter; nur die Waffenplätze wechseln. Juwelen, Charms und
  Fläschchen bleiben getrennte kompakte Bereiche. Der Item-Editor und die
  Mehrfach-Affix-Funktion sind unverändert.
- Die Mobalytics-Ansicht wurde nur als Bedien- und Layoutreferenz betrachtet.
  Kein fremder Code, CSS, Bild, Logo oder Asset wurde übernommen. Die
  Auftraggeber-Referenzbilder waren im aktuellen Workspace nicht verfügbar;
  ihre schriftlichen Vorgaben blieben maßgeblich.
- Fertigkeiten: mobil genau eine Kartenspalte; leere Karten zeigen nur Suche
  und Auswahl. Rollen, Waffenset und Supports erscheinen erst nach Skillwahl.
  Blitzpfeil, Kugelblitz, Sturmrufer, Flammenwand, Zeitverzerrung und
  Sprungschlag werden nicht mehr vorausgefüllt.
- BuildProfile, Analyzer, Scores, Ergebnisaggregation, Passive-Pfade,
  Mapping, Boss, Rotation, Datenquellen und Pins bleiben unverändert.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_V1_3_1_UX_CORRECTION.md`.
- Prüfung: 20/20 fokussierte UX-/V1.3-Regressionstests; vollständiger
  Parallel-Lauf 1.017/1.020 mit drei ausschließlichen Zeitüberschreitungen;
  serieller Wiederholungslauf der betroffenen Dateien 50/50. Lint, Typecheck,
  Produktions- und Pages-Build sowie 132/132 JSON-Dateien erfolgreich.
- Browser: Desktop und 390 × 844 ohne horizontalen Überlauf; mobil sechs
  Karten mit 321 Pixel Breite und ohne gemeinsame Kartenzeile. Level und
  Storypunkte bleiben nach echter Tastaturlöschung leer, Waffenset 2 wechselt
  nur die Waffenplätze, der Editor öffnet weiterhin, und die Browserkonsole
  enthält keine Fehler oder Warnungen.
- Pages- und finaler Git-Status werden nach Deployment im Abschlussbericht
  festgehalten.
- Nächster Schritt nach erfolgreicher Verifikation: Auftraggeber-Praxistest
  des korrigierten leeren Equipment-first-Flows; danach nur konkret
  beobachtete UX- und Sprachkorrekturen.

## V1.3.1 – Paperdoll-Nachkorrektur nach Foto 2

- Die vom Auftraggeber bereitgestellte Datei `Foto 2.jpg` wurde als konkrete
  Layoutreferenz geprüft.
- Die Ausrüstung verwendet nun eine eigene kompakte Paperdoll: hohe
  Waffenplätze außen, Helm und Brust zentral, kleine Schmuckplätze körpernah,
  Handschuhe/Gürtel/Schuhe darunter sowie Fläschchen und Charms in einer
  unteren Schnellplatzreihe. Juwelen stehen abgetrennt darunter.
- Der Umschalter heißt kompakt `Set 1 | Set 2`; nur die Waffenplätze wechseln.
- Es wurden keine Bilder, CSS-Regeln, Logos oder sonstigen fremden Assets aus
  der Referenz übernommen. Leere Plätze verwenden eigene neutrale
  CSS-/Textsymbole.
- Item-Editor, Mehrfach-Affixe, Werteingabe, Analyzer und Build-Ergebnis sind
  unverändert.
- Mobile Prüfung 390 × 844: 321 Pixel breite Paperdoll, kein horizontaler
  Überlauf, Item-Editor erreichbar und Browserkonsole ohne Fehler/Warnungen.
- Fokussierte Equipment-/Editor-Regression: 8/8; Lint, Typecheck und
  Pages-Build erfolgreich.

## Paperdoll – Größe, dritter Charm und variable Juwelenzahl

- Die Desktop-Paperdoll wurde von 690 auf 820 Pixel Maximalbreite vergrößert;
  mobil bleibt sie responsiv innerhalb der verfügbaren Seitenbreite.
- Ein dritter produktiver Charm-Platz wurde in Equipmentdefinition,
  Affixfilter und Initialzustand ergänzt.
- Die Juwelenanzeige besitzt eine sichtbare Anzahl sowie Plus/Minus. Neue
  Plätze erhalten deterministische IDs `slot-jewel-<n>` und werden als normale
  Equipment-Einträge durch den vorhandenen Editor und BuildProfile-Transport
  geführt.
- Minus entfernt ausschließlich den letzten vollständig leeren Juwelenplatz.
  Ein belegter Platz wird nicht stillschweigend gelöscht.
- Mobile Browserprüfung: drei Charms, Änderung von zwei auf vier und zurück
  auf drei Juwelenplätze, kein horizontaler Überlauf. Desktopbreite: 820
  Pixel. Browserkonsole ohne Fehler/Warnungen.

## Paperdoll – zweite Größen- und Ringkorrektur

- Auf ausdrückliches Auftraggeberfeedback wurde die maximale Desktopbreite
  von 820 auf 960 Pixel erhöht. Mobil nutzt der Equipmentbereich reduzierte
  Seitenabstände; bei 390 Pixel Viewport wuchs die Paperdoll von 321 auf 340
  Pixel.
- Ring 1 und Ring 2 liegen nun in exakt derselben Gridzeile. Das Amulett steht
  darunter, ohne den Brust- oder Schmuckplatz zu überlagern.
- Browsermessung 390 × 844: identische Ring-Oberkante, kein horizontaler
  Überlauf. Desktopmessung: 960 Pixel. Browserkonsole ohne Fehler/Warnungen.

## Paperdoll – Vollbreite und Schmuckpositionen

- Die Paperdoll verwendet nun 100 Prozent der nutzbaren Breite des
  Ausrüstungsbereichs statt einer festen Maximalbreite. Die seitlichen
  Innenabstände des Equipment-Abschnitts wurden auf ein kompaktes Maß
  reduziert.
- Amulett: nach oben neben den Helm versetzt.
- Ring 1 und Ring 2: gemeinsam nach unten neben die Brust versetzt und exakt
  auf derselben Rasterhöhe ausgerichtet.
- Browserprüfung bei 590 × 1280: Paperdoll 539 Pixel bei 555 Pixel
  Abschnittsbreite, entsprechend rund 97 Prozent der gesamten Sectionbreite
  einschließlich deren Rahmen. Bei 390 × 844 weiterhin 340 Pixel und kein
  horizontaler Überlauf. Browserkonsole ohne Fehler/Warnungen.

## Paperdoll – Höhenkorrektur und tatsächlicher Schmucktausch

- Klarstellung des Auftraggebers: Die Breite war bereits ausreichend; nur die
  vertikale Größe sollte wachsen.
- Die vier Equipment-Rasterzeilen wurden deutlich erhöht. Bei 590 × 1280
  misst die Paperdoll nun 539 × 974 Pixel; bei 390 × 844 misst sie 340 × 824
  Pixel.
- Schmucktausch entsprechend der gemeinten Ausgangslage: Das Amulett
  übernimmt den früheren oberen Schmuckplatz. Ring 1 und Ring 2 stehen
  gemeinsam in der darunterliegenden Schmuckreihe und besitzen eine exakt
  identische Oberkante.
- Breite und sonstige Funktionen blieben unverändert. Kein horizontaler
  Überlauf und keine Browserfehler/-warnungen.

## Mobile Skalierung – eigentliche Ursache der zu kleinen Höhe

- Die Auftraggeber-Screenshots zeigten trotz mobiler Gerätebreite weiterhin
  Desktopmerkmale, insbesondere zweispaltige Fertigkeitskarten.
- Ursache: `index.html` besaß überhaupt keinen `viewport`-Metaeintrag. Safari
  verwendete deshalb eine breite virtuelle Desktopfläche und skalierte die
  gesamte Anwendung einschließlich des Equipmentbereichs nachträglich klein.
- Korrektur: vollständiges HTML-Grundgerüst mit `lang="de"`, UTF-8,
  `width=device-width, initial-scale=1, viewport-fit=cover`, Theme-Farbe und
  Seitentitel.
- Der zuvor vergrößerte Equipmentbereich bleibt 340 × 824 Pixel bei einem
  echten 390 × 844 CSS-Viewport. Die Skillansicht verwendet dort eine
  321-Pixel-Einzelspalte. Kein horizontaler Überlauf und keine
  Browserfehler/-warnungen.

## Paperdoll – kompaktere vertikale Abstimmung

- Nach erneutem Auftraggeberfeedback blieb die passende mobile Breite von
  340 Pixel unverändert; nur die zuvor zu stark gestreckte Höhe wurde
  reduziert.
- Die Rasterzeilen, Waffenplätze, Schnellslots, Juwelenplätze und vertikalen
  Innenabstände wurden proportional kompakter ausgelegt.
- Browsermessung bei 390 × 844: 340 × 715 Pixel statt zuvor 340 × 824
  Pixel. Amulett sowie die auf gleicher Höhe liegenden Ringe behalten ihre
  festgelegten Positionen.
- Kein horizontaler Überlauf; Browserkonsole ohne Fehler oder Warnungen.

## Folgekorrekturen – Arbeitspaket 1: Unique-Eigenschaften und Varianten

- Die sieben vom Auftraggeber bestätigten Folgekorrekturen werden
  nacheinander bearbeitet. Begonnen wurde mit der vollständigen sichtbaren
  Unique-Eigenschaftsdarstellung und der variantengenauen Analyzerwirkung.
- Der bestehende englische PoB2-Produktbestand und die getrennte deutsche
  Anzeigeschicht bleiben unverändert. Der Editor verbindet beide weiterhin
  ausschließlich über stabile Unique-, Varianten- und Zeilen-IDs.
- Der Unique-Editor zeigt nun benötigtes Level, Implicits und sämtliche für
  die gewählte Variante geltenden Unique-Eigenschaften. Bei mehreren
  Varianten ist eine konkrete Auswahl erforderlich; ohne Auswahl werden nur
  gemeinsame Eigenschaften angezeigt und Speichern bleibt gesperrt.
- Die Analyzer-Registry enthält für alle 579 Varianten getrennte
  Evidenzdaten. Ist ein Unique mit Varianten-ID ausgerüstet, verwendet der
  Unique Analyzer dessen Tags, Einschränkungen, Trade-offs, Enablerstatus und
  Waffenanforderungen statt der vorsichtigen itemweiten Schnittmenge.
- Es werden weiterhin keine technischen GGG-Mod-/Stat-IDs behauptet und
  normale Affixe bleiben vollständig getrennt.
- Mobile Browserprüfung 390 × 844: sechs aufgelöste Zeilen für die aktuelle
  Variante des Ambosses, Dialogbreite rund 364 Pixel, kein horizontaler
  Überlauf, Speichern erst nach Variantenwahl, keine Konsolenfehler oder
  -warnungen.
- Nächster Arbeitspunkt: vollständigerer produktiver Skill- und
  Supportbestand.

## Deutsche Originalnamen für Skills und Supports (2026-07-24)

- Auf ausdrücklichen Auftraggeberwunsch wurden keine frei übersetzten Namen
  verwendet, sondern ausschließlich die deutschen Bezeichnungen der lokal
  installierten deutschen PoE2-Clientversion `4.5.4.53018`.
- Die lokale Extraktion ist an `Content.ggpk` SHA-256
  `a917a56f89ae631f1a93e0dd9a3ea169f08e826e07927c0083a01c6e68a18e28`
  und PoB2-Schema-Commit
  `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0` gebunden.
- Alle 686 reduzierten Katalogeinträge wurden deterministisch über ihre
  technische `BaseItemTypes`-ID sowie die positionsgleiche
  `SkillGems`-/`GemEffects`-Kette aufgelöst: 235 Skills und 451
  Supportstufen, kein englischer Fallback am aktuellen Pin.
- Produktdatei:
  `generated/localization/de/poe2-gems.json`; sie enthält nur deutsche
  Anzeigenamen und ID-Provenienz. Der englische RePoE-Katalog, Skillsemantik,
  Supportregeln, Analyzer und Scores bleiben unverändert.
- Keine automatische Übersetzung, kein Textmatching, keine Icons, Medien,
  Beschreibungen, Stat-IDs oder Laufzeitquelle wurden hinzugefügt.
- Die Anzeigeschicht bleibt innerhalb der eng begrenzten Projektentscheidung
  für `poe2-repoe-skill-support-catalog`; sie behauptet keine externe
  Lizenzfreigabe oder vollständige rechtliche Klärung. Die übrigen deutschen
  Lokalisierungsscopes bleiben unverändert.
# Waffen-Set-Passivplanung

- Waffen-Set-Punkte werden als Aufteilung normaler Passivpunkte behandelt,
  nicht als zusätzliche Punkte.
- Die reale Passive-Pipeline plant einen gemeinsamen Stamm sowie getrennte
  Ergänzungen für Waffenset 1 und Waffenset 2.
- Beide Set-Pläne verwenden denselben gemeinsamen Stamm und bleiben jeweils
  innerhalb des normalen Gesamtbudgets.
- Bei null aufgeteilten Punkten bleibt die bisherige Einzelplanung erhalten.
- Die UI kann zwischen gemeinsamem Plan, Set 1 und Set 2 umschalten; der
  offizielle Baum zeigt den jeweils gewählten Plan.
- Aszendenzpunkte bleiben getrennt und werden nicht automatisch eingerechnet.
- Datenpins, Baumquelle und bestehende Pfadsuche bleiben unverändert.

# Vollständige Nutzung des normalen Passivpunktebudgets

- Der frühe Planungsstopp nach wenigen hochwertigen Zielen wurde behoben.
- Die bestehende strategische Auswahl bleibt die erste Planungsphase.
- Eine zweite, deterministische Abschlussphase nutzt Restpunkte nur für
  erreichbare Kandidaten mit positiver Evidenz und ohne bekannte Konflikte.
- Kandidaten- und Iterationsrahmen decken das produktive maximale
  Normalbudget ab; die Pfadsuche traversiert bereits belegte Teilbäume
  weiterhin kostenfrei.
- Ein Test mit dem offiziellen Produktbaum weist für ein repräsentatives
  Profil 121 von 121 verwendete normale Punkte nach.
- Wenn nicht genügend sichere Kandidaten existieren, bleibt das Restbudget
  sichtbar. Unbekannte oder negative Knoten werden nicht erfunden.
- Waffen-Set-Aufteilungen bleiben Teil des normalen Budgets.
- Aszendenzpunkte bleiben ein separater Punkttyp und sind weiterhin nicht
  Bestandteil dieser Planung.
- Baumdaten und sämtliche Datenpins bleiben unverändert.

# Separate Aszendenzpunkte und Aszendenzplanung

- Im Charakterbereich kann der Nutzer nun separat angeben, wie viele
  Aszendenzpunkte verfügbar sind. Erlaubt sind ausschließlich 0 bis 8.
- Aszendenzpunkte werden weder zum normalen Passivpunktebudget addiert noch
  als Waffen-Set-Punkte behandelt.
- Die reale Passive-Pipeline verwendet dafür den versionierten Scope
  `ascendancy` und löst den offiziellen Start der gewählten Aszendenz auf.
- Der getrennte Plan darf ausschließlich Start- und Passivknoten der
  ausgewählten Aszendenz enthalten. Normale Baumknoten und andere
  Aszendenzen sind fail-closed ausgeschlossen.
- Die Oberfläche bietet nach der Analyse einen eigenen Aszendenz-Reiter und
  zeigt Budget, verwendete und verbleibende Aszendenzpunkte separat.
- Fehlende positive Evidenz wird nicht durch künstliches Auffüllen ersetzt:
  Restpunkte bleiben sichtbar, statt konfliktbehaftete Knoten zu erfinden.
- Passive Planner `5G-1.2.0`, reale Passive-Pipeline `5H-1.1.0`.
- Baumquelle, Produktdaten, Datenpins, Analyzerarchitektur und
  Waffen-Set-Regel bleiben unverändert.

# Rückkopplung der Passive-Skalierungen

- Die bisherige Integrationslücke ist geschlossen: belegte normale Passiv-
  und Aszendenzknoten beeinflussen jetzt die nachfolgenden Analyzer.
- Die feste Reihenfolge lautet Equipmentprofil, Aszendenzplan,
  Aszendenzwirkung, gemeinsamer Passivplan, gemeinsame Wirkung,
  Waffen-Set-Pläne und nachgelagerte Analyzer.
- Gemeinsame Passiv- und Aszendenzwirkungen werden in beide getrennten
  Waffen-Set-Profile übernommen; die Set-Pfade bleiben weiterhin getrennt.
- Verwendet werden ausschließlich vorhandene semantische Profilfelder,
  Knotenklassifikationen und Passive-Zielregeln.
- Unbekannte oder nicht sicher klassifizierbare Knotenzeilen erzeugen keine
  Skalierung.
- Die Passive-Ansicht weist die Zahl der berücksichtigten Aszendenz- und
  gemeinsamen Baumknoten aus.
- Das Ergebnis ist eine deterministische semantische Rückkopplung und keine
  exakte DPS- oder Charakterwertsimulation.

# Dynamische Gegenstandseigenschaften

- Auf ausdrückliche Auftraggeberentscheidung besitzt der Item-Editor keine
  sichtbare feste Anzahl von Affix-, Implicit- oder Sockelplätzen mehr.
- Technisch bekannte Prefixe, Suffixe und Implicits werden dynamisch über
  Plus/Minus verwaltet; sämtliche eingegebenen `statValues` gelangen weiterhin
  unverändert in BuildProfile, Equipment Analyzer und Schadensreferenz.
- Foto- und Screenshotzeilen werden ohne Anzahlbegrenzung als bearbeitbare
  Eigenschaften übernommen.
- Freie Eigenschaften speichern Art, Originaltext, tatsächliche Zahlenwerte,
  Quelle und Nutzerbestätigung. Unterstützte Arten umfassen Sockeleffekt,
  Unique-Eigenschaft, Verzauberung und gewährte Fertigkeit.
- Frühere konkrete Sockeleffekte werden rückwärtskompatibel in die dynamische
  Eigenschaftsliste migriert; die separate sichtbare Sockelplatzbedienung ist
  entfallen.
- Unbekannte Freitextzeilen bleiben vollständig erhalten, erzeugen aber ohne
  sichere technische Zuordnung keinen erfundenen Analyzer-Score.
- Keine Datenquelle, kein Produktpin und keine Analyzerarchitektur wurde
  ersetzt.

# Foto-OCR-Nachkorrektur

- Monitorfotos verwenden einen eigenen OCR-Pfad mit stärkerer Vergrößerung,
  leichter Moiré-Glättung, zwei Kontrastvarianten und automatischer
  Schräglagenkorrektur. Der Screenshot-Pfad bleibt getrennt.
- Beide Fotodurchläufe werden deterministisch zeilenweise zusammengeführt.
  Typische OCR-Ersatzformen deutscher Umlaute werden nur für die technische
  Zuordnung gleichbehandelt.
- Ohne sichtbares Item-Level wird ein Gegenstand mit mindestens drei
  Eigenschaftszeilen nicht mehr fälschlich als magisch klassifiziert.
- `QUALITAT`, `KORPERRUSTUNG`, `VERDERBT` und nachfolgende Bedienhinweise
  werden robust behandelt.
- Reale Browserprüfung mit dem Auftraggeberfoto: Seltenheit, Basis, Qualität
  27 %, Ausweichwert 2085, Energieschild 622 und sämtliche zehn sichtbaren
  Eigenschaftszeilen wurden gelesen.

# OCR-Editor-Korrektur nach Auftraggeberfeedback

- Technisch zugeordnete Affixe werden im Editor in derselben Reihenfolge wie
  im erkannten Foto beziehungsweise Screenshot dargestellt.
- Unbekannte OCR-Fragmente werden nicht mehr als nummerierte freie
  Eigenschaften in den Gegenstand übernommen.
- Nur technisch zugeordnete Affixe und ihre tatsächlichen Werte erreichen
  BuildProfile und Equipment Analyzer.
- Item-Level bleibt ein internes optionales Filtermerkmal und beeinflusst
  weder Build-Ranking noch Schadenswert.
- Waffen-Editoren zeigen keine Felder für Rüstung, Ausweichwert oder
  Energieschild; diese Endwerte sind auf passende Rüstungs- und defensive
  Offhandklassen begrenzt.
- Frühere unbekannte OCR-Freieigenschaften werden bei der
  Rückwärtskompatibilitätsmigration entfernt. Manuell bestätigte
  Sondereigenschaften bleiben erhalten, erzeugen ohne technische Zuordnung
  aber keinen Analyzer-Score.
# Buildspeicher, aktueller Gemmenbestand und Passive-Farben

- Charakter, Ausrüstung, tatsächliche Affixwerte, Fertigkeitskarten und
  Supports werden mit Schema 1 ausschließlich im lokalen Browser gespeichert.
- Der Produktbestand enthält ausschließlich den gepinnten RePoE-/Clientstand
  `4.5.4.4.4`: 235 aktive/Spirit-Skills und 451 Support-Tier-Einträge.
- Deutsche Gemmennamen stammen per technischer ID aus der lokalen
  Clientversion `4.5.4.53018`; `Spark` heißt dort `Funken`.
- Sichtbare Itemklassen sind deutsch. Die PoB2-Unique-Anzeigeschicht bleibt
  eine App-Übersetzung, nicht pauschal bestätigter offizieller GGG-Text.
- Konkrete Waffenarten ersetzen die frühere grobe Sammelkategorie.
- Ohne gewählte Fertigkeit befüllt erst die gestartete Analyse die erste
  leere Karte und passende Supportplätze.
- Gemeinsame Passivpfade sind gelb, Waffenset 1 rot und Waffenset 2 grün.
  Set-Pläne starten mit bis zu 24 unterschiedlich belegbaren Punkten.
- Der Hauptskill erreicht die reale Passivplanung; `Höchster Nutzen`
  priorisiert belegte Schadens- und Mechanikknoten.
- Details: `docs/BUILD_STORAGE_GEM_AND_PASSIVE_CORRECTION.md`.

# Sichtbarkeit des Aszendenzplans

- Der offizielle Baumexport kennzeichnet bestimmte Aszendenzverbindungen mit
  `hideInDefaultState`.
- Diese Verbindungen wurden zuvor ausgefiltert, bevor der sichtbare
  Plan-Overlay sie zeichnen konnte, obwohl der Planner sie korrekt belegt
  hatte.
- Belegte Planknoten aktivieren diese offiziellen Verbindungen jetzt; Knoten,
  Weg und Zielreihenfolge werden gemeinsam angezeigt.
- Der getrennte Aszendenzplan ist violett. Gemeinsam, Waffenset 1 und
  Waffenset 2 bleiben gelb, rot und grün.

# Equipment-first-DPS-Orchestrierung

- Vorhandene Ausrüstung bleibt die erste Grundlage. Waffenarten, Affixe,
  tatsächliche Werte, Uniques und Waffensets bestimmen das Ausgangsprofil.
- Ohne gewählte Hauptfertigkeit setzt die bestehende Skillanalyse eine
  belegte Hauptfertigkeit ein und ergänzt die fünf bestbewerteten
  kompatiblen Supports.
- Der zentrale Build-Button führt anschließend auch die reale
  Passive-Planung aus. Normale Punkte, Waffensetpläne und bis zu acht
  gewählte Aszendenzpunkte werden über die vorhandene Profilrückkopplung
  erneut in Skill-, Support-, Juwel- und Unique-Bewertungen eingespeist.
- Der Worker behält seinen kompakten Analysevertrag. Das errechnete
  Passive-Ergebnis wird danach mit den vollständigen produktiven
  Skill-, Support- und Unique-Katalogen im bestehenden Orchestrator
  ausgewertet.
- Ohne Ausrüstung entsteht aus Klasse, Aszendenz, Zielprofil und belegten
  Fertigkeitsmerkmalen ein deterministischer schadensorientierter
  Startbuild. Unbekannte Waffen- oder Mechanikabhängigkeiten werden nicht
  erfunden.
- Die Ergebnisansicht nennt belegte Skalierungen für Schadensart,
  Angriff/Zauber, Geschwindigkeit, Projektil/Fläche und Kritisch. Kritische
  Skalierung wird ohne belegtes Skillmerkmal nicht positiv vorausgesetzt.
- Der numerische Schadenswert bleibt ein begrenzter Trefferschadenvergleich.
  Passive-, Support- und komplexe Mechanikwerte werden erst dann als exakte
  DPS eingerechnet, wenn strukturierte quantitative Daten dafür vorliegen.
# Gemeinsame Passivbaumdarstellung und korrigierte Waffenset-Semantik

- Waffenset-Passivpunkte werden ausdrücklich als Teil des normalen Passivpunktebudgets behandelt, nicht als zusätzliche Punkte: Bis zu 24 normale Punkte können für Set 1 und Set 2 unterschiedlich belegt sein.
- Bei 24 umschaltbaren Punkten besitzt Set 1 bis zu 24 set-spezifische Belegungen und Set 2 bis zu 24 alternative Belegungen; aktiv ist jeweils nur die zum aktiven Set gehörende Variante. Es entstehen keine 48 gleichzeitig aktiven Zusatzpunkte.
- Der Baum zeigt nach einer Analyse alle Ebenen gleichzeitig, ohne Darstellungsumschalter:
  - Gelb: in beiden Waffensets gemeinsam belegter normaler Pfad
  - Rot: ausschließlich für Waffenset 1 abweichende Belegung
  - Grün: ausschließlich für Waffenset 2 abweichende Belegung
  - Violett: separat geplante Aszendenzpunkte
- Die Set-Overlays ziehen den gemeinsamen Pfad ab. Dadurch wird der gemeinsame Stamm nicht mehr irreführend vollständig rot oder grün dargestellt.
- Der Aszendenzplan wird gleichzeitig im eingebetteten Baum der gewählten Aszendenz angezeigt und verwendet weiterhin ausschließlich den separaten Auftraggeberwert von höchstens acht Aszendenzpunkten.

# Korrektur überlappender Waffenset- und Aszendenzpfade

- Waffenset-Punkte ersetzen einen entsprechenden Anteil normaler
  Passivpunkte durch zwei umschaltbare Belegungen. Die App erzeugt daher
  weiterhin je Set höchstens den eingestellten Anteil; die beiden
  Alternativen sind nicht gleichzeitig aktiv.
- Belegen Set 1 und Set 2 denselben Knoten oder dieselbe Verbindung, wird
  diese Überlappung jetzt gelb als „in beiden Waffensets aktiv“ gezeichnet.
  Zuvor lag die grüne Ebene über der roten Ebene und ließ Set 1 fälschlich
  verschwinden.
- Rot und Grün werden ausschließlich für voneinander abweichende
  Set-Belegungen verwendet. Ohne set-spezifische Ausrüstung erzeugt die App
  zwei deterministische, getrennte schadensorientierte Alternativpfade; ein
  bereits für Set 1 gewähltes Ziel wird bei der Zielauswahl für Set 2
  ausgeschlossen. Das ist eine Aufbauempfehlung, keine Behauptung einer
  bereits vorhandenen Ausrüstungsskalierung.
- Die Planverbindungen aller vier Ebenen besitzen jetzt eine explizite,
  deutlich stärkere Strichbreite. Dadurch ist auch der violette
  Aszendenzpfad im verkleinerten eingebetteten Aszendenzbaum sichtbar.
- Ein Regressionstest führt die offizielle Stormweaver-Aszendenz
  (`Sorceress1`) gegen den gepinnten Baum aus und prüft, dass ein echter,
  ausschließlich zur gewählten Aszendenz gehörender Pfad entsteht.
- Nachprüfung im produktiven mobilen Ablauf: Die passende
  Aszendenzsynergie fließt nun sowohl in den fachlichen Gesamtwert als auch
  in die ausschließlich für Aszendenzen geltende Kandidatenbewertung ein.
  Ein schwaches oder noch leeres Profil bleibt damit nicht mehr
  fälschlicherweise am Aszendenzstart stehen.
- Sind beide Waffensetpläne mangels set-spezifischer Unterschiede identisch,
  erklärt die Baumansicht ausdrücklich, warum nur der gemeinsame gelbe Pfad
  und keine rote oder grüne Abweichung sichtbar ist.
# Vollständiger schadensorientierter Analyseablauf

- Der Knopf in der realen Passive-Analyse startet nun den gesamten
  Build-Ablauf. Er umgeht nicht mehr die Skill-, Support- und
  Ergebnisaggregation.
- Ist noch keine Fertigkeit gewählt, wird ein deterministischer
  Hauptskill nach dem sicher modellierbaren Schaden ausgewählt. Ohne
  Ausrüstung darf dabei ein Skill mit noch fehlender Waffenanforderung als
  Aufbauempfehlung dienen; die fehlende Waffe bleibt als Konflikt sichtbar.
- Die fünf Supports werden erst nach der Wahl dieses Hauptskills erneut
  analysiert und ausschließlich aus dessen kompatibler Rangliste übernommen.
- Der neue Standardmodus `damage-first` bevorzugt belegte
  Schadenswirkungen im Passivbaum. Die Planung bleibt heuristisch und
  behauptet kein mathematisch globales DPS-Optimum.
- Für die gewählte Aszendenz werden alle eingegebenen Punkte bis maximal
  acht vergeben, sofern im offiziellen Aszendenzbaum genügend erreichbare
  Knoten vorhanden sind. Stormweaver ist mit 8/8 Punkten gegen den
  gepinnten offiziellen Baum getestet.
- Der gemeinsam genutzte Passive-Worker bleibt im React-Strict-Mode aktiv.
  Dadurch kann die vollständige Analyse nach einem einzigen Knopfdruck
  Skillkarten, Supports, normale Pfade, Waffensetpfade und Aszendenzpfad
  zusammen erzeugen.

# Vollständige Vorschlagsbefüllung ohne Ausrüstung

- Die Analyse erzeugt nun auch ohne Ausrüstung beide Waffensetpläne. Bei 24
  eingestellten Set-Punkten weist die Ergebnisansicht ausdrücklich
  `Waffenset 1: 24/24` und `Waffenset 2: 24/24` aus.
- Für Geistwandlerin (`Huntress2`) und Sturmweberin (`Sorceress1`) ist gegen
  den gepinnten offiziellen Baum geprüft, dass alle acht angeforderten
  Aszendenzpunkte belegt und ausschließlich im jeweiligen Aszendenzbaum
  gezeichnet werden.
- Ist beim Start keine Fertigkeit gewählt, werden nach der Analyse alle sechs
  Startkarten deterministisch befüllt. Die erste Karte bleibt der
  schadensorientierte Hauptskill; weitere Karten verwenden kompatible
  Schadensarten oder belegte Buff-, Debuff-, Bewegungs- und
  Defensivfunktionen.
- Für jede automatisch befüllte Fertigkeitskarte wird die Supportanalyse
  erneut mit genau dieser Fertigkeit als Treiber ausgeführt. Pro Karte werden
  bis zu fünf kompatible Unterstützungen übernommen.
# Aktueller Zusatz: kombinierte Build-Variantenoptimierung

- Die automatische Buildwahl prüft Klasse/Aszendenz, alle produktiv
  rankbaren Hauptskills, belegte Waffenarten, Supports, Set-2-Synergien und
  Tree-Affinitäten als gemeinsame Varianten.
- Vorhandene Ausrüstung bleibt vorrangig. Ohne Ausrüstung werden keine
  unbelegten Waffenbindungen erfunden.
- Nur die gewählte vollständige Variante wird anschließend durch die
  bestehende reale Passive-Pfadplanung gerechnet; es existiert keine zweite
  Build- oder Tree-Engine.
- Die Ergebnisansicht nennt Hauptskill, Waffenempfehlung, Set-2-Ergänzung,
  geprüfte Kombinationen, Gründe und belegte Alternativen.
- Mehrere Stufen derselben Supportfamilie werden innerhalb einer Variante
  dedupliziert.
- Die Bewertung bleibt eine relative Projektoptimierung und keine Behauptung
  einer vollständigen Path-of-Building-DPS-Simulation.

# Schritt 3: einheitliches Wirkungsmodell

- Ausrüstung, Fertigkeiten, Unterstützungen, normale Passive,
  Waffenset-Spezialisierungen und Aszendenz laufen nun in einer gemeinsamen
  deterministischen Wirkungskette zusammen.
- Jede Wirkung besitzt Quelle, Quell-ID, Waffenset, Wirkungsbereich,
  Mechanik-Tags, Evidenzklasse, produktiven Status und Erklärung.
- Tatsächlicher Waffen-Grundschaden, Angriffe pro Sekunde und kritische
  Basis-Trefferchance sind offensiv. Rüstung, Ausweichen und Energieschild
  sind strikt defensiv und erzeugen keinen offensiven Bonus.
- Waffenklassen mit angezeigten Rüstungs-, Ausweich- oder
  Energieschild-Endwerten werden blockiert und nicht eingerechnet.
- Supports werden nur als produktive Wirkung übernommen, wenn ihre
  strukturierten Voraussetzungen zum konkreten Skill-Setup passen.
- Gemeinsame Passive, Waffenset 1, Waffenset 2 und Aszendenz bleiben getrennt
  nachvollziehbar.
- Ohne bestätigte strukturierte Umwandlung werden Schadensarten nicht
  miteinander verrechnet. Unbekannte Zusammenhänge erzeugen keinen Bonus.
- „Beste Schadensskalierungen“ verwendet die gemeinsame Wirkungskette und
  nennt belegte Quellen.
- Ausführliche Dokumentation:
  `docs/BUILD_ASSISTANT_EFFECT_MODEL_STEP_3.md`.
# Abschluss Schritt 5 – Kritische Treffer und quantitative Support-Schnittstelle

- Ausgangscommit: `daf239a84e22945f622e94422a77b36d5e0207d6`
- Kritische Treffer werden als deterministischer Erwartungswert berechnet.
- Zauber verwenden ihre strukturierte Basis-Kritchance; Angriffe verwenden
  den eingegebenen endgültigen Waffenwert.
- Der PoE2-Basis-Kritschadensbonus beträgt `+100 %`.
- Belegte Kritchance und Kritschadensboni aus Ausrüstung, Passivbaum und
  Aszendenz werden berücksichtigt.
- Supportdefinitionen besitzen eine fail-closed quantitative
  Effektschnittstelle.
- Mehrere bestätigte `more-damage`-Effekte werden multiplikativ angewandt.
- Supports ohne strukturierten numerischen Effekt verändern den Schadenswert
  nicht und werden sichtbar als unbelegt ausgewiesen.
- Aus Supportnamen, Tags oder Übersetzungen werden keine Werte erfunden.
- Gegnerwiderstände, Rüstung, DoT, Ailments, Mehrfachtreffer, Trigger und
  Buff-Uptime bleiben Folgeaufgaben.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_CRITICAL_AND_SUPPORT_EFFECTS_STEP_5.md`

# Schritt 7 – automatische Gegnervergleichsprofile

- Es gibt keine zusätzliche Nutzereinstellung für Gegnerwiderstände oder
  Rüstung.
- Der Build-Ablauf wählt anhand des vorhandenen Zielprofils automatisch
  `Allround`, `Mapping` oder `Boss (anhaltender Kampf)`.
- Die Profile sind deterministisch und als
  `automatic-season-reference` / `poe2-0.4-reference-v2` versioniert.
- Der belegte Standardwiderstand ist null. Nicht allgemein belegte
  Monster- beziehungsweise Bossrüstung wird nicht erfunden.
- Die nicht numerisch belegte, zeitlich abklingende Boss-Anti-Burst-Reduktion
  bleibt als sichtbare Grenze dokumentiert.
- Rohschaden vor Gegnerabwehr und Vergleichswert nach dem automatisch
  gewählten Profil bleiben getrennt sichtbar.
- Nächster Schritt: belegte Fluch-, Expositions-, Durchdringungs- und
  Rüstungsbruchwerte automatisch aus der Wirkungskette übernehmen.
## Automatische Rotations- und Triggerfenster – Schritt 11 (2026-07-27)

- Die bestehende Mapping- und Bossrotation nutzt jetzt automatisch die am
  gepinnten PoB2-Datensatz belegten Aktivierungszeiten, Wirkzeiten,
  Abklingzeiten und Triggerintervalle.
- Jeder Fertigkeitsschritt besitzt einen strukturierten Zeitstatus:
  `permanent`, `maintainable`, `windowed`, `cooldown-limited`,
  `trigger-limited` oder `unresolved`.
- Ein geplantes Aktualisierungsintervall entsteht nur bei Fertigkeiten, die
  bereits durch die bestehende Rotation als aufrechterhaltbar oder
  aktualisierungspflichtig klassifiziert sind.
- Bekannte Wirkzeit allein wird nicht als vollständige Uptime ausgegeben.
  Bekannte Abklingzeit allein wird nicht als automatische Nutzung direkt
  nach Ablauf behandelt.
- Die Ergebnisansicht zeigt die belegten Zeitwerte und ihre Grenze auf
  Deutsch bei Mapping- und Bossrotation.
- Das Modell ist deterministisch, besitzt Version `1.0.0` und benötigt keine
  neue Nutzereinstellung.
- Dokumentation:
  `docs/BUILD_ASSISTANT_ROTATION_TIMING_STEP_11.md`.
- Nächster Schritt: nur vollständig belegte numerische Buff-, Debuff- und
  Triggerwirkungen in die zeitabhängige Schadensrechnung aufnehmen.

## Vorbereitete Folgeangriffe – Schritt 15 (2026-07-28)

- Ausgangscommit: `ed715c3a13acafb175ad61ce2e1f99e4c8a97602`.
- Das neue Modell `next-skill-effects` verbindet einen vorbereitenden Skill
  nur mit der unmittelbar folgenden tatsächlich verwendeten Fertigkeit.
- Emergency Reload wirkt mit dem strukturierten Wert von `31 % mehr Schaden`
  ausschließlich auf einen direkt folgenden Armbrustangriff.
- Der vorbereitete Treffer wird separat vom dauerhaften Trefferschaden pro
  Sekunde angezeigt. Es wird keine Uptime oder Wiederholungsfrequenz erfunden.
- Bei Infernal Cry ist der Folgeangriff identifizierbar; Warcry-Power,
  verfügbare Exertions und Verbrauch sind jedoch nicht vollständig belegt.
  Der bekannte Wert von `49 % als Feuer` bleibt deshalb fail-closed.
- Mantra of Destruction bleibt trotz bekanntem `69 % als Chaos` blockiert,
  weil Comboaufbau, Aktivierung und Einmalverbrauch nicht geschlossen sind.
- Die bestehenden Rotationen kennzeichnen diese drei Fertigkeiten als
  vorbereitende Schritte. Es wurde keine zweite Rotationsengine eingeführt.
- Keine neue Nutzereinstellung und keine Änderung der Datenpins.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_NEXT_SKILL_EFFECTS_STEP_15.md`.
- Audit:
  `docs/audits/build-assistant-next-skill-effects-step-15.json`.
- Nächster Schritt: getrenntes Schaden-über-Zeit- und Ailmentmodell mit
  belegter Basis, Dauer, Auslösebedingung und Stapelregel.

## Schaden über Zeit und Ailments – Schritt 16 (2026-07-28)

- Ausgangscommit: `762a02fb7c5464e72d7e365ec7a5c3f911c9e0ae`.
- Schaden über Zeit besitzt einen eigenen Ergebniskanal und wird nicht zum
  Trefferschaden pro Sekunde addiert.
- Der gepinnte Bestand enthält fünf Fertigkeiten mit eindeutig typisiertem
  DoT-Grundwert pro Minute. Nur Flame Wall besitzt zusätzlich eine gemeinsam
  strukturierte Wirkungsdauer.
- Flame Wall wird als einzelne belegte Anwendung mit `59,58` Feuerschaden
  pro Sekunde, `6,4 s` Wirkfenster und `381,33` Gesamtschaden ausgewiesen.
- Contagion, Incinerate, Profane Ritual und Tornado bleiben wegen fehlender
  geschlossener Dauerketten fail-closed.
- Entzünden, Gift und Blutung erzeugen weiterhin keinen Zahlenbonus, weil
  Basis, Auslösung, Dauer und Stapelverhalten nicht gemeinsam belegt sind.
- Keine neue Nutzereinstellung, keine neue Datenquelle und keine Änderung
  der Produktpins.
- Modellversion: `damage-over-time 1.0.0`.
- Rechnerversion: `2.5.0`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_DAMAGE_OVER_TIME_STEP_16.md`.
- Audit:
  `docs/audits/build-assistant-damage-over-time-step-16.json`.
- Nächster Schritt: Mehrfachtreffer und Projektile nur mit belegter
  Trefferzahl, Überlappungsbedingung und Zielannahme modellieren.

## Projektile und Mehrfachtreffer – Schritt 17 (2026-07-28)

- Ausgangscommit: `bd3e2abe539985b6f79210c2c5a10bb1c8f84300`.
- Neues fail-closed Projektilmodell:
  `src/engine/damage-estimation/projectile-hit-model.ts`.
- Modellversion `1.0.0`, Schadensrechner `2.6.0`.
- Der gepinnte numerische Bestand umfasst 337 Fertigkeiten, davon 85 mit
  strukturierten Projektilmerkmalen.
- Strukturiert erfasst: drei Fertigkeiten mit Projektilanzahl, vier mit
  Chain-Anzahl, zwei mit Pierce-Anzahl und eine maximale Trefferobergrenze.
- Projektile, Chain und Pierce erhöhen ausschließlich die ausgewiesene
  Mapping-Abdeckung. Der Boss-Einzelzielmultiplikator bleibt ohne belegte
  Überlappungsregel bei `1`.
- Tornado Shots Trefferobergrenze wird nicht als garantierte Trefferzahl
  verwendet.
- Fork, Rückkehr und Wiederholung bleiben ohne vollständige technische
  Ziel-/Wiederkontaktkette ausgeschlossen.
- Keine neue Quelle, kein Runtime-Netzwerk und keine Änderung bestehender
  Datenpins oder Produktdaten.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_PROJECTILE_HITS_STEP_17.md`.
- Audit:
  `docs/audits/build-assistant-projectile-hits-step-17.json`.
- Nächster Schritt: Trigger und Wiederholungen nur mit belegtem Auslöser,
  Intervall und Zielbezug modellieren.

## Trigger und Wiederholungen – Schritt 18 (2026-07-28)

- Ausgangscommit: `0d2d7db16ab128ec69848920932e8a5262d0e416`.
- Das neue Modell `trigger-repeat-model` trennt `Triggerable` von tatsächlich
  `Triggered` beziehungsweise `InbuiltTrigger`.
- Inventar am gepinnten Referenzstand: 19 eingebaute Triggerdatensätze,
  16 Triggerquellen und drei generische strukturierte Wiederholungsintervalle.
- Eine Auslösung wird nur produktiv, wenn Quelle, Bedingung, Ziel und Intervall
  gemeinsam belegt sind. Der aktuelle BuildProfile-Transport enthält keine
  vollständige solche Kette; produktive Triggerketten bleiben daher null.
- Eingebaute Triggerfertigkeiten erhalten nicht länger eine erfundene normale
  Wirkfrequenz aus Castzeit oder Angriffsgeschwindigkeit.
- `Cast on Critical` und andere eindeutig identifizierte Meta-Fertigkeiten
  dürfen ihre Bedingung anzeigen; ohne Ziel und Intervall verändern sie den
  Schadenswert nicht.
- Energieerzeugungsboni werden nicht als Auslösefrequenz interpretiert.
- Modellversion `1.0.0`, Schadensrechner `2.7.0`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_TRIGGER_REPEAT_STEP_18.md`.
- Audit:
  `docs/audits/build-assistant-trigger-repeat-step-18.json`.
- Nächster Schritt: Minions und Begleiter mit belegten Anzahlen,
  Angriffsraten und Wirkungsquellen.

## Minions und Begleiter – Schritt 19 (2026-07-28)

- Ausgangscommit: `0dc6b86f5933fdd29fe5497a4f9704cd60dc141b`.
- Das neue Modell `minion-companion-model` trennt Minion- und
  Begleiterwirkungen vollständig vom Trefferschaden des Spielers.
- Inventar am gepinnten Referenzstand: 27 minion- oder begleiterbezogene
  Fertigkeitsdatensätze, davon 5 Companion-Datensätze, 2 mit strukturierter
  Maximalanzahl, 2 mit strukturierter Dauer, 1 mit Minion-Schaden-/Tempobonus
  und 19 mit Reservierungsmerkmal.
- Keine Quelle enthält die vollständige Kette aus Kreaturenbasis, eigener
  Angriffsrate, aktiver Anzahl, Uptime, angewandten Wirkungen und Geistbilanz.
  Produktive Minion-DPS bleibt deshalb null.
- Bekannte Einzelwerte wie 20 Skelettkonstrukte, 6 Wölfe, 11,8 Sekunden
  Begleiterdauer sowie Pain Offerings 58 % Schaden und 29 % Tempo werden
  sichtbar, aber nicht als vollständiger Schadensmultiplikator verwendet.
- Minion-Hauptfertigkeiten werden nicht mehr mit Spielerwaffenschaden oder
  Spieler-Wirktempo berechnet.
- Maximalanzahl wird nicht als aktive Anzahl und Reservierung nicht als
  vorhandene Geistkapazität interpretiert.
- Modellversion `1.0.0`, Schadensrechner `2.8.0`.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_MINIONS_COMPANIONS_STEP_19.md`.
- Audit:
  `docs/audits/build-assistant-minions-companions-step-19.json`.
- Nächster Schritt: Ressourcen- und Geistmodell mit belegten Kosten,
  Reservierungen, Kapazitäten und Aufrechterhaltbarkeit.

## Ressourcen und Geist – Schritt 20 (2026-07-28)

- Ausgangscommit: `7fa4429d54c8cbeeff5d5c9c8cb05cc867f86b29`.
- Neues fail-closed Modell `resource-spirit-model`, Version `1.0.0`;
  Schadensrechner `2.9.0`.
- Inventar: 337 Fertigkeitsdatensätze, 82 mit `HasReservation`, 9 mit
  `MultipleReservation` und 6 einzelne strukturierte Mana-Spezialfelder.
- Allgemeine exakte Fertigkeitskosten, Mana-/Lebenspool, Geistkapazität und
  Regeneration sind im aktuellen Buildtransport nicht geschlossen vorhanden.
- Reservierungsmarker werden sichtbar ausgewiesen, aber weder als Betrag noch
  als verfügbare Geistkapazität interpretiert.
- Semantische Support-Ressourcenwerte bleiben Rankinghinweise und werden nicht
  als technische Mana- oder Lebenskosten ausgegeben.
- Ohne Kosten, Ressourcenpool und Wiederherstellung verändert das Modell
  weder Wirkfrequenz noch Schaden oder Uptime.
- Keine neue Nutzereinstellung, keine neue Datenquelle und keine Änderung
  bestehender Produktpins.
- Hauptdokument: `docs/BUILD_ASSISTANT_RESOURCES_SPIRIT_STEP_20.md`.
- Audit: `docs/audits/build-assistant-resources-spirit-step-20.json`.
- Nächster Schritt: Gemmenstufen und Qualität mit belegten Wirkungen.

## Gemmenstufen und Qualität – Schritt 21 (2026-07-28)

- Ausgangscommit: `4bbea26cd9e44ae4461606aedd1bbb226c0c8dbe`.
- Neues fail-closed Modell `gem-level-quality-model`, Version `1.0.0`;
  Schadensrechner `3.0.0`.
- Alle 337 numerischen Fertigkeitsreferenzen liegen ausschließlich auf
  Gemmenstufe 20 vor; numerische Qualitätsfelder fehlen.
- `SkillSetup.level` wird jetzt tatsächlich geprüft. Exakt angeforderte
  Stufe 20 ist produktiv; ohne Eingabestufe wird die einzige Referenzstufe 20
  transparent verwendet.
- Jede andere angeforderte Stufe blockiert den numerischen Schadenswert.
  Stufe 20 wird nicht länger stillschweigend für eine andere Stufe verwendet.
- Fertigkeitsqualität, Supportstufen und Supportqualität bleiben ohne
  geschlossene technische Referenz ohne Zahlenwirkung.
- Keine Interpolation, keine Schätzung aus Gemmennamen und keine zusätzliche
  Nutzereinstellung.
- Hauptdokument: `docs/BUILD_ASSISTANT_GEM_LEVEL_QUALITY_STEP_21.md`.
- Audit: `docs/audits/build-assistant-gem-level-quality-step-21.json`.
- Nächster Schritt: Gegenstandsqualität und lokale/globale Werte strikt
  trennen.

## Gegenstandsqualität und lokale/globale Werte – Schritt 22 (2026-07-28)

- Ausgangscommit: `de33237bdf87bb9ea9e37f2d77f702d38f470142`.
- Neues fail-closed Modell `item-value-scope-model`, Version `1.0.0`;
  Schadensrechner `3.1.0`.
- Der technische Affixbestand `4.5.4.4.4` enthält 1.828 Datensätze:
  448 lokal und 1.380 nicht lokal; kein Scope bleibt unklassifiziert.
- Eingegebene oder per Bilderkennung bestätigte Tooltip-Waffen- und
  Verteidigungswerte gelten als Endwerte. Qualität und lokale Affixe werden
  darauf nicht erneut gerechnet.
- Bei einer gepinnten Waffenbasis dürfen lokale Affixe genau einmal wirken.
  Globale Build-Skalierungen schließen `isLocal = true` weiterhin aus.
- Eine Qualitätsangabe auf einer reinen Basis blockiert den numerischen
  Waffenschaden, solange keine exakte gepinnte Qualitätsformel vorhanden ist.
  Qualität wird weder ignoriert noch frei interpoliert.
- Rüstung, Ausweichwert und Energieschild bleiben defensive Endwerte und
  erzeugen keinen Waffenschaden. Waffen bleiben von Rüstungswerten getrennt.
- Keine neue Datenquelle, keine neue Nutzereinstellung und keine Änderung der
  Produktpins.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_ITEM_VALUE_SCOPE_STEP_22.md`.
- Audit:
  `docs/audits/build-assistant-item-value-scope-step-22.json`.
- Nächster Schritt: geschlossener Charakterwerttransport für Ressourcenpools
  und Fertigkeitskosten, sobald exakte gepinnte Quellen vorliegen.
## Schritt 23 – geschlossene Ressourcen- und Fertigkeitskostenkette

- Ausgangscommit: `05eb5d41c694e7c71a8e780644a1ca2be1769fd2`.
- Das vorhandene `resource-spirit-model` wurde auf Version `2.0.0`
  erweitert; Rechnerversion `3.2.0`.
- 337 gepinnte PoB2-Fertigkeitsdatensätze wurden inventarisiert: 82 mit
  `HasReservation`, 9 mit `MultipleReservation` und 6 mit einzelnen
  strukturierten Ressourcen-Zahlenfeldern.
- 165 technische Affix-Statzeilen entsprechen der engen Allowlist für
  maximales Leben, maximales Mana, Geist oder Manaregeneration.
- Belegte Ausrüstungsbeiträge werden mit Gegenstands-, Modifikator- und
  Stat-Identität transportiert, aber ohne Charaktergrundwert nicht als
  vollständiger Pool ausgegeben.
- Jede belegte Fertigkeit besitzt eine getrennte deterministische
  Kostenkettenprüfung. Grundkosten, Support-Kostenmultiplikatoren,
  vollständiger Pool und Wiederherstellung bleiben beim aktuellen Pin
  fail-closed.
- Semantische `resourceCost`-Werte der Supports bleiben Rankinghinweise und
  werden nicht als reale Mana-, Lebens- oder Geistkosten bezeichnet.
- Es wurde keine zusätzliche Benutzereinstellung, keine neue Datenquelle und
  keine geschätzte Ressourcen- oder DPS-Wirkung eingeführt.
- Dokumentation:
  `docs/BUILD_ASSISTANT_RESOURCE_COST_CHAIN_STEP_23.md`.
- Audit:
  `docs/audits/build-assistant-resource-cost-chain-step-23.json`.
- Nächster Schritt: gepinnte lokale Quellen auf eine vollständige,
  stufengenaue Kette für Fertigkeitsgrundkosten und
  Support-Kostenmultiplikatoren prüfen.

## Schritt 24 – Fertigkeitsgrundkosten und Supportmultiplikatoren

- Ausgangscommit: `bc1842b2134eff599491c66d8a5fa5ea61ea83a2`.
- Das `resource-spirit-model` wurde auf Version `3.0.0`, der
  Schadensrechner auf Version `3.3.0` erweitert.
- Die unverändert gepinnte PoB2-Schadensreferenz enthält nun strukturierte
  Stufe-20-Kosten aus `act_str.lua`, `act_dex.lua` und `act_int.lua`.
- Die Divisoren stammen aus `src/Data/Costs.lua` am selben PoB2-Pin,
  SHA-256
  `4d59ec2732a0dc2bdcd524b5fbd831f70a74e7f3a528d1c7539ee849d6d5d16a`.
- Coverage: 337 Fertigkeitsrecords, 235 mit Kostentabelle, 178 mit
  Nichtnullkosten und 57 mit strukturierten Nullkosten.
- Der bestehende RePoE-Gemkatalog verbindet Support-Gem-ID,
  `grants_skills` und technische Support-Skill-ID mit genau dem Feld
  `static.cost_multiplier` aus `data/skills.json`.
- 450 von 451 Supportrecords besitzen einen eindeutigen Multiplikator. Der
  einzelne fehlende Wert bleibt fail-closed.
- Pro belegter Fertigkeitskarte werden Grundbetrag,
  Supportmultiplikatoren, kombinierter Multiplikator sowie
  supportangepasste Kosten pro Einsatz beziehungsweise Sekunde ausgegeben.
- Vollständiger Ressourcenpool, Wiederherstellung, Reservierungsbetrag und
  weitere Kostenänderungen durch Passive, Aszendenz, Ausrüstung oder
  Zustände bleiben unbekannt. Dauerhafte Nutzbarkeit und eine
  DPS-Begrenzung werden deshalb noch nicht behauptet.
- Keine neue Nutzereinstellung, keine neue externe Quelle, kein
  Runtime-Netzwerk und keine Änderung der Produktpins.
- Dokumentation:
  `docs/BUILD_ASSISTANT_SKILL_SUPPORT_COSTS_STEP_24.md`.
- Audit:
  `docs/audits/build-assistant-skill-support-costs-step-24.json`.
- Prüfstatus vor Commit: 1.242 Tests in 97 Testdateien, Lint, Typecheck,
  Produktions-Build, Pages-Build und JSON-Validierung erfolgreich.
- Desktop und Mobilansicht 390 × 844 technisch geprüft; kein horizontaler
  Überlauf und keine neuen Browserfehler oder -warnungen.
- Nächster Schritt: vollständigen Charakter-Ressourcenpool und belegte
  Wiederherstellung anbinden, um Kosten gegen reale Verfügbarkeit zu prüfen.

## Schritt 25 – automatische Ressourcen-Nachhaltigkeit

- Ausgangscommit: `67ba6ce4b99b5ef4dff7bd97be6ee763f1e0f8a6`.
- Das `resource-spirit-model` wurde auf Version `4.0.0`, der Schadensrechner
  auf Version `3.4.0` erweitert.
- `src/Data/Misc.lua` am unveränderten PoB2-Pin liefert Leben
  `12 × (Level + 16)`, Mana `4 × (Level + 30)` und natürliche
  Manaregeneration `240 %/Minute`.
- Die Prüfung läuft automatisch im Hintergrund. Es wurde keine neue
  Nutzereinstellung hinzugefügt.
- Der bestätigte Mindestpool ergänzt eindeutige flache Lebens-/Manawerte und
  erhöhte Manaregeneration aus der vorhandenen Ausrüstung.
- Supportangepasste Kosten werden für Zauber mit der strukturierten Wirkzeit
  in Mana pro Sekunde umgerechnet.
- „Dauerhaft gedeckt“ wird nur ausgegeben, wenn schon der konservative
  Mindestwert genügt. Aus einem nicht genügenden Mindestwert wird kein
  negatives Spielbarkeitsurteil erfunden.
- Passive-, Aszendenz-, Geist-, Leech-, Recoup-, Fläschchen- und bedingte
  Wiederherstellungswirkungen bleiben sichtbar begrenzt.
- Dokumentation:
  `docs/BUILD_ASSISTANT_RESOURCE_SUSTAIN_STEP_25.md`.
- Audit:
  `docs/audits/build-assistant-resource-sustain-step-25.json`.
- Prüfstatus vor Commit: 1.244 Tests in 97 Testdateien, Lint, Typecheck,
  Produktions-Build, Pages-Build und JSON-Validierung erfolgreich.
- Nächster Schritt: technisch bestätigte Passive- und Aszendenzwirkungen auf
  Ressourcen in denselben Pooltransport integrieren.

## Schritt 26 – Passive-, Aszendenz- und Waffenset-Ressourcen

- Ausgangscommit: `ec7deea266313571815ab92364c4f16c1df9bd6a`.
- Das Ressourcenmodell wurde auf Version `5.0.0` erweitert.
- Tatsächlich vergebene, unbedingte und exakt lesbare Ressourcenwirkungen
  aus gemeinsamem Pfad, aktivem Waffensetpfad und Aszendenz werden
  automatisch in Pool und Kostenkette einbezogen.
- Dokumentation:
  `docs/BUILD_ASSISTANT_PASSIVE_RESOURCE_EFFECTS_STEP_26.md`.
- Audit:
  `docs/audits/build-assistant-passive-resource-effects-step-26.json`.

## Schritt 27 – Geistreservierungen und bestätigte Mindestkapazität

- Ausgangscommit: `6a6668f8cab22370696ea67d1ecbb5dbb9188015`.
- Der produktive RePoE-Gemkatalog verwendet Schema 3 und verbindet
  `skill_gems.grants_skills` deterministisch mit
  `skills.static.reservations.spirit`.
- Von 235 produktiven Fertigkeiten besitzen 51 einen eindeutigen exakten
  Geistreservierungsbetrag.
- Das Ressourcenmodell wurde auf Version `6.0.0` erweitert.
- Reservierungen und bestätigte Mindestkapazität werden getrennt für
  Waffenset 1 und Waffenset 2 berechnet; Fertigkeiten mit `Beide` belasten
  beide Sets.
- Quest-Geist wird nicht erfunden. Ein Überschreiten der bestätigten
  Mindestkapazität erzeugt eine sichtbare Warnung, aber keine automatische
  Ablehnung der Kombination.
- Keine neue Benutzereinstellung, keine neue Quelle, kein Runtime-Netzwerk
  und keine Änderung der Produktpins.
- Dokumentation:
  `docs/BUILD_ASSISTANT_SPIRIT_RESERVATION_STEP_27.md`.
- Audit:
  `docs/audits/build-assistant-spirit-reservation-step-27.json`.
- Prüfstatus vor Commit: 1.249 Tests in 97 Testdateien fachlich erfolgreich;
  vier im parallelen Gesamtlauf zeitbedingt abgebrochene Tests wurden
  anschließend seriell erfolgreich bestätigt. Lint, Typecheck,
  Produktions-Build, Pages-Build, JSON-Validierung, `git diff --check` und
  Git-Sicherheitsprüfung sind erfolgreich.
- Nächster Schritt: lokal belegbare Quest-Geistkapazität und bestätigte
  Reservierungseffizienz erschließen.

## Schritt 28 – Quest-Geist und Reservierungseffizienz

- Ausgangscommit: `01c5c3683204cb57ddec73d79389a7bc3ee10969`.
- Das Ressourcenmodell wurde auf Version `7.0.0`, die gepinnte
  Schadensreferenz auf Schema 4 erweitert.
- `src/Data/QuestRewards.lua` belegt am unveränderten PoB2-Pin die
  Geistbelohnungen `+30` auf Gebietsstufe 11, `+30` auf Gebietsstufe 36
  und `+40` auf Gebietsstufe 61.
- Das Charakterlevel wird automatisch als Erreichbarkeitsgrenze verwendet.
  Die daraus gebildete Summe ist ausdrücklich nur eine obere
  Planungsschätzung und kein Beweis abgeschlossener Quests.
- `src/Modules/CalcDefence.lua` belegt die verwendete
  Reservierungseffizienzformel einschließlich Rundung.
- Allgemeine, unbedingte Reservierungseffizienz aus tatsächlich vergebenen
  Passiv- und Aszendenzknoten wird waffensetspezifisch angewandt.
- Sichere Mindestkapazität, Quest-Schätzung, Planungskapazität,
  Grundreservierung, effektive Reservierung und Restgeist werden getrennt
  ausgegeben.
- Bedingte und fertigkeitsspezifische Effizienz bleibt fail-closed.
- Keine neue Nutzereinstellung, kein Runtime-Netzwerk und keine Änderung
  der Produktpins.
- Dokumentation:
  `docs/BUILD_ASSISTANT_SPIRIT_EFFICIENCY_STEP_28.md`.
- Audit:
  `docs/audits/build-assistant-spirit-efficiency-step-28.json`.
- Generierte Referenzdatei SHA-256:
  `a05dd0b71c4d50fd41b9df9c4b732aa2cc4e6938fe82536432ab3fe130034ebe`.
- Prüfstatus vor Commit: 1.250 Tests in 97 Testdateien fachlich erfolgreich;
  zwei im parallelen Gesamtlauf zeitbedingt abgebrochene Tests wurden
  anschließend seriell erfolgreich bestätigt. Lint, Typecheck,
  Produktions-Build, Pages-Build, JSON-Validierung, `git diff --check` und
  Git-Sicherheitsprüfung sind erfolgreich.
- Nächster Schritt: automatische Skill- und Supportauswahl anhand der
  belegten Kosten-, Nachhaltigkeits- und Geistbilanz ressourcenbewusst
  optimieren.

## Schritt 29 – Ressourcenbewusste automatische Auswahl

- Ausgangscommit: `d4791ec6cdda32c0e1919c772584590638bbd877`.
- Automatische Hauptskills, Supportbefüllung, die manuelle Aktion
  „Beste vorschlagen“ und die gemeinsame Buildvariantenoptimierung verwenden
  die belegte Ressourcen- und Geistbilanz bereits während des Rankings.
- Bestätigtes Null-Mana mit Manakosten und eine Geistreservierung oberhalb
  selbst der levelbasierten Quest-Obergrenze blockieren die betreffende
  automatische Kombination.
- Nur kurzfristig bezahlbare Kosten, fehlende Aktionsfrequenz und lediglich
  geschätzte Quest-Geistdeckung werden als deterministische Risiken
  berücksichtigt.
- Unbekannte Kostenketten erzeugen weder einen positiven Bonus noch einen
  erfundenen Ausschluss.
- Manuelle Supportentscheidungen bleiben erhalten; Supportfamilien und harte
  Kompatibilitätsregeln bleiben vorrangig.
- Keine neue Nutzereinstellung, keine Datenpinänderung und kein
  Runtime-Netzwerk.
- Dokumentation:
  `docs/BUILD_ASSISTANT_RESOURCE_AWARE_SELECTION_STEP_29.md`.
- Audit:
  `docs/audits/build-assistant-resource-aware-selection-step-29.json`.
- Prüfstatus vor Commit: 1.255 Tests in 97 Testdateien fachlich erfolgreich;
  ein im parallelen Gesamtlauf zeitbedingt abgebrochener Lokalisierungsaudit
  wurde anschließend seriell erfolgreich bestätigt. 29 fokussierte Tests und
  Typecheck, Lint, Produktions-Build, Pages-Build, JSON-Validierung,
  `git diff --check` und Git-Sicherheitsprüfung sind erfolgreich.
- Nächster Schritt: Ressourcenbilanz nach der realen Passiv- und
  Aszendenzplanung erneut prüfen und bei bestätigter Unterdeckung eine
  belegte alternative Supportkombination anbieten.

## Schritt 30 – Ressourcen-Nachprüfung nach der realen Planung

- Ausgangscommit: `2f61c8ae0fb214bc8b66cd60ba8cf72edc4435a9`.
- Der abschließende Build-Lauf erhält neben dem kompakten Planungsergebnis
  nun auch wieder den gepinnten offiziellen Passivbaum. Dadurch können die
  tatsächlich vergebenen normalen, Waffenset- und Aszendenzknoten in der
  Ressourcenrechnung ausgewertet werden.
- Automatisch erzeugte Supportkombinationen werden nach dem realen
  Passivlauf erneut geprüft und nur bei belegter Verbesserung auf eine
  tragfähigere kompatible Kombination umgestellt.
- Manuelle Supportentscheidungen bleiben unverändert. Eine bestätigte
  Unterdeckung wird sichtbar gewarnt.
- Keine neue Nutzereinstellung, keine Datenpinänderung und kein
  Runtime-Netzwerk.
- Dokumentation:
  `docs/BUILD_ASSISTANT_POST_PASSIVE_RESOURCE_REBALANCE_STEP_30.md`.
- Audit:
  `docs/audits/build-assistant-post-passive-resource-rebalance-step-30.json`.
- Prüfstatus vor Commit: 25 fokussierte Tests und 1.257 Tests in 98
  Testdateien erfolgreich. Typecheck, Lint, Produktions-Build, Pages-Build,
  Validierung von 156 JSON-Dateien, `git diff --check` und
  Git-Sicherheitsprüfung sind erfolgreich.
- Nächster Schritt: bei bestätigter Unterdeckung kontrolliert prüfen, ob ein
  belegter Ressourcenknoten als alternatives Passivziel besser ist.
# Schritt 31 – Ressourcenorientierte alternative Passivplanung

- Ausgangscommit: `64ba2a345c086969a9328fe572f2c383cf036412`.
- Bei einer nach dem normalen realen Passivlauf belegten
  Ressourcenunterdeckung wird jetzt zuerst ein zweiter, explizit
  ressourcenorientierter Planungslauf geprüft.
- Der alternative Plan wird ausschließlich bei weniger harten Konflikten
  oder bei gleicher Konfliktzahl und geringerem belegtem Risiko übernommen.
- Ein nicht besserer Plan wird verworfen; der ursprüngliche Plan wird
  deterministisch wiederhergestellt.
- Die temporäre Ressourcenpriorität beeinflusst nur die Zielauswahl und wird
  nicht als künstlicher Wert in das abschließende BuildProfile übernommen.
- Automatische Supportanpassungen aus Schritt 30 erfolgen erst nach dieser
  Planprüfung. Manuelle Supports bleiben unverändert.
- Dokumentation:
  `docs/BUILD_ASSISTANT_RESOURCE_PASSIVE_REPLANNING_STEP_31.md`.
- Audit:
  `docs/audits/build-assistant-resource-passive-replanning-step-31.json`.
- Datenpins, Produktdaten und Runtime-Netzwerk bleiben unverändert.

# Korrektur der Eingabe- und Ergebnisfehler vom 28.07.2026

- Waffen-Grundwerte sind im mobilen Item-Editor als echte, direkt
  editierbare Felder angeordnet: physischer, Feuer-, Kälte-, Blitz- und
  Chaosschaden jeweils mit Minimum und Maximum sowie kritische
  Trefferchance, Angriffe pro Sekunde und Reichweite.
- Ein Ausrüstungsvorschlag öffnet nun zuerst eine Detailansicht. Bei
  produktiven PoB2-Uniques zeigt sie Basistyp, benötigtes Level, Varianten
  und die lokalisierten Eigenschaften; eine reine Waffenart-Empfehlung wird
  ausdrücklich als solche gekennzeichnet.
- `Beste vorschlagen` bleibt bei fehlender vollständiger
  Ressourcenabsicherung nicht mehr lautlos leer. Die ausdrückliche
  Nutzeraktion darf die kompatibelsten belegten Supports mit sichtbarer
  Risikobewertung einsetzen; der automatische Buildlauf bleibt weiterhin
  fail-closed.
- Ein Timeout der rechenintensiven Passive-Planung verwirft nicht mehr die
  bereits fertiggestellte Skill-, Support-, Ausrüstungs- und
  Build-Auswertung. Die Passive-Warnung bleibt sichtbar und der Worker
  erhält für den Vollauf eine längere, begrenzte Laufzeit.
- Allgemeine Warnungen aus der Abdeckung des gesamten Passivbaum-
  Quelldatensatzes werden nicht mehr als tausende konkrete Buildfehler
  gezählt; die sichtbare Problemliste enthält nur blockierende Violations.
- Datenpins, Produktdaten, Analyzerregeln und Runtime-Netzwerk bleiben
  unverändert.
- Unmittelbare Auftraggeberkorrektur: Das nicht verlangte sichtbare Feld
  `Reichweite` wurde wieder aus dem Waffen-Editor entfernt.
- Automatisch befüllte Fertigkeitskarten verwenden nun ebenfalls den
  kontrollierten Support-Fallback der ausdrücklichen Aktion
  `Beste vorschlagen`; harte fachliche Inkompatibilitäten bleiben gesperrt.
- Korrektur nach Spielprüfung des Auftraggebers: `Zerschlagen` kann mit
  Bögen verwendet werden. Waffen-Uniques werden deshalb nicht durch einen
  pauschalen Vergleich mit der bevorzugten Optimierer-Waffenart verworfen.
  Maßgeblich bleiben belegte Fertigkeitsanforderungen und das
  `valid`-Ergebnis des Unique Analyzers.
- Meta-Fertigkeiten werden nicht mehr wie normale Fertigkeiten mit fünf
  reinen Supportplätzen modelliert. Die gepinnten `meta`-Tags aktivieren
  getrennte eingebettete Fertigkeitsslots. `Elemental Invocation` und
  `Cast on ...` akzeptieren belegbar Zauber; für elementare Auslöser werden
  nur elementare Zauber angeboten. Mindestens eine passende Fertigkeit wird
  bei der automatischen Build- oder Supportaktion eingesetzt. Eingebettete
  Fertigkeiten und Supports teilen sich fünf Plätze und die eingebetteten
  Fertigkeiten gelangen als eigene Eingaben in die Analyzer.
- Nach sichtbarer Auftraggeberprüfung wurde die Grenze präzisiert:
  Ausschließlich gepinnte Gemmen mit gleichzeitigem `meta`- und `trigger`-
  Tag erhalten eingebettete Fertigkeitsslots. Der UI-Pfad besitzt zusätzlich
  eine exakte Triggernamen-Auflösung, damit gespeicherte oder zusammengeführte
  Definitionen den Triggerbereich nicht verlieren. Vorhandene fünf Supports
  werden beim automatischen Einsetzen eines Skills auf vier Restplätze
  gekürzt.
- Unique-Details ohne getrennte PoB2-Varianten zeigen ihre itemweiten
  Eigenschaften direkt. Rohe interne `engine.unique.reason.*`-Schlüssel
  wurden durch verständliche deutsche Begründungen ersetzt.
## Zentrale Build-Korrektheitsprüfung (2026-07-28)

- Anlass: Nutzerprüfung zeigte fachlich unzusammenhängende Trigger-, Support-
  und Waffensetempfehlungen.
- Automatische Trigger-Nutzlasten sind nun auf belegte Schadensskills
  beschränkt. Flüche, Debuffs, Buffs, Marks, persistente Hilfsskills und weitere
  Meta-Skills werden nicht als automatische Schadensnutzlast eingesetzt.
- Die Hauptschadensart priorisiert die Nutzlast; bereits eigenständig belegte
  Skills werden nicht zusätzlich automatisch eingebettet.
- Vorhandene skillbezogene Support-Positivlisten sind jetzt eine harte Grenze
  für automatische Empfehlungen.
- Meta-Container-Supports werden nicht ungeprüft auf den eingebetteten Skill
  übertragen.
- Waffenset-Pfade besitzen einen eigenen Planungsbereich. Neue
  Juwelenfassungen und Keystones sind dort ausgeschlossen.
- Unterschiedliche Setpfade werden nicht länger künstlich erzwungen. Ohne
  belegte abweichende Wirkung darf das Ergebnis identisch oder teilweise
  unbelegt bleiben.
- Fachliche Dokumentation:
  `docs/BUILD_ASSISTANT_CORRECTNESS_GATE.md`.

## Saisonale Meta-Referenz pro Aszendenz (2026-07-28)

- Ausgangscommit: `9cd0901968d76f34bda5b0b9c8bb391b380f1adf`.
- Aktueller poe.ninja-Snapshot: `Runes of Aldur`, Patchfamilie `0.5.x`,
  124306 Charaktere.
- Alle 23 produktiv belegten Aszendenzen besitzen eine getrennte Referenz aus
  den drei häufigsten Main-Skill-Einträgen und zwei häufigsten technisch
  auflösbaren Waffenkategorien.
- Zusätzlich wurden 460 konkrete, DPS-sortierte Profilreferenzen erfasst:
  20 je Aszendenz. Sie bleiben bis zur vollständigen Paketprüfung Auditbelege.
- Die Referenz wirkt ausschließlich als begrenzter Tie-Breaker nach allen
  harten Skill-, Waffen-, Support-, Equipment-first- und Ressourcenprüfungen.
- poe.ninja-`MAIN SKILLS` werden nicht blind als Hauptschaden interpretiert;
  Heralds, Flüche, Meta- und Setup-Skills können darin enthalten sein.
- Aggregierte Skill- und Waffenhäufigkeiten werden nicht als korrelierter
  Buildbeleg ausgegeben.
- Hauptdokument: `docs/BUILD_ASSISTANT_CURRENT_META_REFERENCE.md`.
- Nächster Schritt: 10 bis 20 konkrete, korrelierte Charakterprofile je
  Aszendenz als versionierte Referenzpakete prüfen.

## Korrelierte Meta-Build-Pakete (2026-07-28)

- Ausgangscommit: `21e3118b58d0fc1ae4dcf216f4af40729f9714ae`.
- Die von poe.ninja selbst verwendete öffentliche Profilantwort wurde auf
  den exakten Snapshot `1924-20260728-10654`, Snapshot
  `runes-of-aldur`, Passivbaum `PassiveTree-0.5` gepinnt.
- Der lokale Generator
  `scripts/poe2-meta-build-packages/generate.mjs` reduziert Profile auf
  Aszendenz, höchste modellierte Schadensfertigkeit, gemeinsam gesockelte
  Supports und aktive Fertigkeiten, Waffenkategorien sowie Passivpunktzahlen.
- Kontonamen, Charakternamen, vollständige Items, vollständige Passivbäume
  und Path-of-Building-Exporte werden nicht im Produkt gespeichert.
- Der erste kontrollierte Lauf validierte `53/460` Profile. `407` bleiben
  wegen HTTP-429-Schutzgrenzen oder unvollständiger Korrelation blockiert;
  nicht belegbare Angaben sind `Unbekannt`.
- Aus der belegten Teilstichprobe entstanden `10` produktive Pakete mit
  mindestens zwei korrelierten Profilen. Einzelbeobachtungen bleiben
  Audit-only.
- Die produktive Wirkung ist ein begrenzter sekundärer Bonus nach allen
  harten Skill-, Waffen-, Support-, Equipment-first- und Ressourcenregeln.
  Die frühere unkorrelierte Übersicht wurde in ihrer Gewichtung reduziert.
- poe.ninja-/PoB-DPS wird nicht als App-DPS, Garantie oder globale
  Optimalität übernommen.
- Audit:
  `docs/audits/poe2-current-meta-build-profile-validation.json`.
- Reduziertes Produkt:
  `generated/meta/poe2-build-packages.json`.
- Produktdatei SHA-256:
  `2e59d2208d3defa8e1f04c7b9a8cc1e3b4480fab7234c3380f4622e760051444`.
- Coverage ist derzeit partiell (Infernalist, Blood Mage und Lich in der
  ersten erreichbaren Stichprobe). Der Generator kann denselben Snapshot
  gedrosselt und inkrementell fortsetzen.
- Abschlussprüfung: fokussierte Meta- und Variantenoptimierungstests `11/11`,
  reguläre Suite `1275/1279`; die vier ausschließlich zeitkritisch
  fehlgeschlagenen Vollbaum-/Lokalisierungstests anschließend seriell
  `50/50` erfolgreich. Lint, Typecheck, Produktions-Build, Pages-Build,
  JSON-Validierung (`161` Dateien) und `git diff --check` erfolgreich.

## Gemeinsame Build-Paket-Optimierung (2026-07-29)

- Ausgangscommit: `7d4719940fd7122479fa41f4dc152ed2a27b6934`.
- Der bestehende Variantenoptimierer prüft die höchstbewerteten acht
  Skill-Waffen-Varianten jetzt erneut als vollständige Build-Pakete.
- Equipment, Skill, Supports, Passive, Juwelen und Uniques sowie Ressourcen
  und Rotation liefern getrennte sichtbare Teilwerte.
- Ein technisch blockierter Hauptskill oder Support blockiert das gesamte
  Paket. Ein hoher isolierter Score kann diese Sperre nicht überstimmen.
- Equipment-first, harte Waffenregeln, Ressourcenregeln und die vorhandenen
  sechs Analyzer bleiben maßgeblich.
- Die Ergebnisansicht zeigt Paketstatus, gemeinsamen Paketwert und alle acht
  Teilwerte. Fehlende Belege bleiben sichtbar und erzeugen keinen Bonus.
- Dokumentation:
  `docs/BUILD_ASSISTANT_COHERENT_PACKAGE_OPTIMIZER.md`.
- Audit:
  `docs/audits/build-assistant-coherent-package-optimizer.json`.
- Keine neue Datenquelle, kein Runtime-Netzwerk und keine zweite Build-Engine.
## PoE2-Regelverständnisschicht – zentraler erster Regelschnitt

- Die automatische Skillplanung verwendet jetzt
  `src/features/skills/poe2-interaction-rules.ts` als zentrale fail-closed
  Wirkungsprüfung.
- Gleiche Tags oder hohe isolierte Scores gelten nicht mehr als Beleg einer
  Synergie.
- Produktiv zulässig sind nur `structured-exact`, `structured-derived` und
  `explicit-rule`; `heuristic-only` und `blocked` füllen keine Slots und
  erzeugen keinen positiven Synergiebonus.
- Elementarschwäche berücksichtigt belegten Feuer-, Kälte- und Blitzschaden.
- Generische Set-2-Vorbereitung benötigt eine strukturierte Wirkung, die nach
  dem Waffenwechsel fortbesteht.
- Dokumentation:
  `docs/POE2_RULE_UNDERSTANDING_LAYER.md`
- Coverage:
  `docs/audits/poe2-rule-understanding-coverage.json`
- Vollständiges Verständnis aller Mechaniken der aktuellen Saison:
  **Unbekannt**. Die Regelschicht wird mechanikweise erweitert; fehlende
  Evidenz bleibt ohne Empfehlung.
## PoE2-Regelverständnisschicht – zentraler Wirkungsgraph

- Der Fertigkeitskatalog bewahrt die vollständigen lokalen Quelltags und den
  Gemmentyp; Runtime-Netzwerk ist nicht erforderlich.
- Waffe, Fertigkeit, Support, Set-2-Vorbereitung, Meta-Payload und Aszendenz
  werden in einem gemeinsamen fail-closed Wirkungsgraph geprüft.
- Die 36 lokalen Aszendenzen werden direkt aus ihren Passivbaumknoten
  ausgewertet. 22 besitzen produktiv klassifizierbare Tags; 14 bleiben
  `Unbekannt`.
- Importierte Supports sind nur produktiv zulässig, wenn die strukturierte
  Fertigkeit-Support-Kette und alle harten Tag-, Schadens-, Rollen- und
  Waffenregeln passen.
- Der gepinnte Meta-Snapshot darf gemeinsam beobachtete Skills nur nach den
  harten Regeln und nur mit mindestens zwei Profilen stützen.
- Gleiche Tags, Namen oder Textähnlichkeit reichen weiterhin nicht.
- Coverage:
  `docs/audits/poe2-rule-understanding-coverage-v2.json`.

## Schadensorientierte Paketoptimierung und Meta-Paritätsstatus

- Die frühere DPS-Sättigung bei 250 Punkten wurde entfernt.
- Berechenbare Varianten werden innerhalb derselben Modellgrenze
  logarithmisch und deterministisch relativ verglichen.
- Nicht numerisch belegbare Varianten erhalten keinen erfundenen
  Schadensbonus.
- Die vollständig geprüfte Kandidatenliste wird aus struktureller
  Paketqualität, berechnetem Schaden und korrelierter Meta-Evidenz gebildet.
- Harte Skill-, Waffen-, Support- und Ressourcenblocker gelten vor dem
  Ranking.
- Quantitative Basis: 235 Skills, 451 Supports, 234 mit lokaler
  Schadensreferenz verbundene Skills, 171 Attack-/Spell-Wirkungsketten,
  450 strukturierte Support-Kostenmultiplikatoren und 354 Waffenbasen.
- Der Meta-Snapshot enthält 53 Profile und 10 korrelierte Pakete, aber keine
  vollständig reproduzierbare Ausrüstung und keine exakten
  Passive-Knotenlisten.
- Nachgewiesene Gleichwertigkeit oder Überlegenheit gegenüber Meta-Builds:
  **Unbekannt / nicht belegt**.
- Dokumentation:
  `docs/BUILD_ASSISTANT_META_PARITY_READINESS.md`.
- Audit:
  `docs/audits/build-assistant-meta-parity-readiness.json`.
- Vollständiges PoE2-Verständnis und globale Meta-Optimalität: **Unbekannt**.

## Selbstständiger Abschlusslauf des Build-Assistenten (2026-07-29)

- Auftraggeberauftrag: Die App mit allen bisher besprochenen Bausteinen
  selbstständig fertig verbinden.
- Ausgangscommit:
  `15f6fad38c3257ca71bf2c875a156539aed48214`.
- Die bestehende Architektur bleibt unverändert:
  Eingabe → BuildProfile → vorhandene Analyzer → gemeinsame
  Paketoptimierung → deutsche Ergebnisdarstellung.
- Eine neue gepinnte Buildzeitdatei trennt `322` Waffenbasen, `1.273`
  Rüstungsbasen und `415` sonstige Itembasen. Waffen erhalten keine
  Rüstungs-, Ausweich- oder Energieschildfelder.
- `generated/pob2/damage-reference.json` verwendet Schema `6` mit `337`
  Skillreferenzen, `540` Support-Quelldatensätzen und `1.833` Itembasen.
- Supportlisten mit alternativen erlaubten Skilltypen werden korrekt als
  ODER-Regel ausgewertet; harte Ausschlüsse bleiben verbindlich.
- Equipment-first bleibt vorrangig. Ohne Ausrüstung darf ein geplantes
  Waffen-/Skillpaket erzeugt werden; fehlende Attribute bleiben dabei
  sichtbare Ausrüstungsanforderungen.
- Browserbeleg ohne Ausrüstung:
  Sturmweberin → Funken in Set 1, Gewittersphäre und
  Elementarempfindlichkeit in Set 2 sowie belegte Supports.
- `Alles zurücksetzen` synchronisiert die sichtbaren Charakterzahlen wieder
  in einen tatsächlich leeren Zustand.
- Die passive Stat-Coverage beträgt gemessen `85,32 %`
  (`5.087 / 5.962` Statzeilen). Allgemeiner Schaden, Skilltempo und
  Auraeffekt werden ohne erfundene Schadensart berücksichtigt.
- Desktop und Mobil `390 × 844` geprüft: keine horizontale Überbreite,
  einspaltige Skillkarten, Set-Zuordnung und Detaildialoge bedienbar, keine
  neuen Konsolenfehler oder -warnungen.
- Produktpins bleiben unverändert. Kein Runtime-Netzwerk, kein Scraping,
  keine Trade-API, keine zweite Engine und keine erfundenen GGG-IDs.
- Globale Optimalität, vollständige PoB-DPS und Meta-Überlegenheit:
  **Unbekannt / nicht belegt**.
- Hauptdokument:
  `docs/BUILD_ASSISTANT_AUTONOMOUS_COMPLETION_2026_07_29.md`.
- Verifikation: serieller Gesamtlauf `1.314/1.314`, anschließender fokussierter
  UI-/Itembasis-/Optimierungslauf `31/31`, Lint und Typecheck erfolgreich,
  Produktions- und Pages-Build erfolgreich, `166` JSON-Dateien validiert,
  `git diff --check` erfolgreich und keine lokalen Audit-Rohdaten versioniert.

## Vollständiger Regel- und Funktionsaudit (2026-07-29)

- Die Behauptung eines vollständigen PoE2-Verständnisses bleibt
  ausdrücklich **nicht belegt**.
- Meta-Häufigkeit ist jetzt nur noch ein begrenzter Sekundärbeleg und kann
  harte Skill-, Waffen-, Ressourcen- oder Interaktionsregeln nicht
  überstimmen.
- Mehrere Elementvarianten erzeugen nicht länger mehrere gleichartige
  Klassenboni.
- Passive und Uniques tragen nur noch zu einem geprüften Build-Paket bei,
  wenn ihr Fachbezug zur Hauptfertigkeit belegt ist.
- Allgemeine Tags wie `attack` oder `spell` reichen nicht länger als
  positiver Unique-Beleg.
- Lokaler Bestand: `235` aktive Skills, `451` Supports, `36`
  Aszendenzen; `22` Aszendenzen besitzen produktiv abgeleitete Semantik.
- Der Passive-Tree-Pin bleibt bei `0.5.2`; ein Saisonupdate erfordert den
  bestehenden versionierten Quellen- und Approval-Prozess.
- Gesamtstatus:
  `critical-core-corrected-app-not-game-complete`.
- Dokumentation:
  `docs/POE2_COMPLETE_APP_RULE_AND_FUNCTION_AUDIT_2026_07_29.md`.
- Audit:
  `docs/audits/poe2-complete-app-rule-gap-matrix.json`.
# PoB2-Rechenparität und zentrale Modifier-Reihenfolge (2026-07-29)

- Der lokal vorhandene PoB2-Referenzstand wurde gegen die produktive
  TypeScript-Engine inventarisiert.
- Referenzpin:
  `PathOfBuildingCommunity/PathOfBuilding-PoE2` bei
  `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.
- PoB2 bleibt technische Offline-Referenz. Keine Lua-Laufzeit, kein
  Runtime-Netzwerk, kein Rohdatenmirror und keine Vollparitätsbehauptung.
- Die erste zentrale Paritätslücke ist geschlossen: `Gain as Extra Damage`
  bleibt von Umwandlung getrennt, erhält die richtige Ausgangsbasis und wird
  nach Ursprungs- und Zielschadensart skaliert.
- Bedingte oder nicht exakt lesbare Effekte bleiben fail-closed.
- Maschinenlesbarer Fahrplan:
  `docs/audits/pob2-engine-parity-roadmap.json`.
- Hauptdokument: `docs/POB2_ENGINE_PARITY_ROADMAP.md`.
- Nächster Rechenblock: mehrstufige Umwandlungspriorität und vollständige
  Modifier-Anwendbarkeit; danach Gemmenlevel/Qualität und Ailments/DoT.

## PoB2-Rechenparität: Levelzeilen und Umwandlungsketten (2026-07-29)

- Mehrstufige Umwandlungen laufen deterministisch in der belegten
  Schadensreihenfolge Physisch, Blitz, Kälte, Feuer, Chaos.
- Die Modifier-Anwendbarkeit behält die belegte Herkunftslinie jeder
  umgewandelten Komponente.
- Der gepinnte Referenzdatensatz enthält nun alle exakt vorhandenen
  Skill-Levelzeilen: `13.402` Zeilen für `337` Skills.
- Levelabhängige Basiswerte, kritische Trefferchance und Kosten werden aus
  der exakt gewählten Zeile übernommen; konstante Skillwerte bleiben dabei
  erhalten.
- Nicht vorhandene Level bleiben blockiert. Es gibt keine Interpolation und
  keine erfundenen Werte.
- Der Referenzdatensatz verwendet Schema `7`; sein fachlicher Inhaltshash
  wird bei jeder deterministischen Generierung neu geprüft.
- Supportquellen des bestehenden PoB2-Pins liefern in diesem Stand jeweils
  nur die vorhandene Level-1-Zeile. Eine nicht belegte Support-Levelskalierung
  wird deshalb weiterhin nicht behauptet.
- Weiter offen: Qualität, Skill-vor-globaler Umwandlungspräzedenz,
  Ailments/DoT, projektil- und triggerspezifische Trefferketten, Minions sowie
  reproduzierbare Referenzbuild-Parität.

## PoB2-Rechenparität: Blutung und Gift (2026-07-29)

- Blutung und Gift sind als getrennte schädigende Zustände in die
  Schadensschätzung und die sichtbare Ergebnisansicht integriert.
- Grundlage sind ausschließlich die gepinnten PoB2-Werte für Grundschaden,
  Dauer, Chance, Effekt, Stapelgrenze und Anwendungshäufigkeit.
- Die gewichtete Schadensroll-Behandlung folgt dem inspizierten
  `CalcOffence.lua`-Referenzpfad.
- Zaubertreffer verwenden in diesem Teilmodell 100 % Trefferchance.
  Angriffs-Zustände verwenden die belegte Accuracy-Gegnerkette; bedingte
  Genauigkeits-Sonderfälle bleiben fail-closed.
- Entzünden bleibt bis zur belegten Gegner-Ailment-Schwellen- und
  Aufbaulogik gesperrt.
- Eine vollständige PoB2-Parität oder Meta-Überlegenheit wird weiterhin
  nicht behauptet.

## PoB2-Rechenparität: Angriffstrefferchance (2026-07-29)

- Die allgemeine PoB2-Trefferformel ist mit Rundung und 5–100-Prozent-Grenze
  integriert.
- Genauigkeit berücksichtigt Level, Klassen-Geschicklichkeit, exakt
  transportierte Attribute und Genauigkeit sowie lokale Werte nur aus dem
  aktiven Waffenset.
- Gegner-Ausweichen stammt aus der gepinnten 100-stufigen PoB2-Tabelle.
- Treffer-, Krit-Erwartungs- und Gegnerabwehrwerte werden zusätzlich
  trefferbereinigt ausgegeben; der bisherige theoretische Aktionswert bleibt
  zum transparenten Vergleich separat sichtbar.
- Die UI zeigt Genauigkeit, Gegnerlevel, Gegner-Ausweichen, Trefferchance und
  die verwendete Vergleichsdistanz.
- Gegnerblocken und bedingte Genauigkeits-Sonderfälle bleiben offen.
- Dokumentation:
  `docs/BUILD_ASSISTANT_ATTACK_ACCURACY_STEP_32.md`.
## PoB2-Gemmenstufe und normale Qualität – Schritt 33 (2026-07-29)

- Der produktive Skill-Editor transportiert Gemmenstufe und normale Qualität.
- Stufen werden ausschließlich aus exakt vorhandenen Zeilen des gepinnten
  PoB2-Bestands angewendet; es gibt keine Interpolation.
- Normale Qualität von 0 bis 23 wird aus `qualityStats` berechnet. Die
  Multiplikation und Abrundung gegen null entspricht dem gepinnten
  `CalcTools.lua`.
- Die resultierenden Stats fließen vor den nachgelagerten Schadensmodellen in
  die Skillstats ein.
- Alternative Qualität und Supportqualität bleiben blockiert und sichtbar als
  Lücke dokumentiert. Supportvarianten besitzen am Pin eine Stufenzeile.
- Referenzschema: 8.
- Nächster Rechenblock: mehrstufige Umwandlungspriorität und vollständige
  Modifier-Anwendbarkeit.
## Skill-vor-globaler Umwandlungspriorität – Schritt 34 (2026-07-29)

- Intrinsische Umwandlungen aktiver Fertigkeiten werden aus den strukturierten
  PoB2-Levelstats gelesen.
- Skillumwandlung wird zuerst angewendet; globale Umwandlung erhält nur den
  verbleibenden Anteil.
- Mehrstufige Vorwärtsketten und Ursprungsskalierung bleiben erhalten.
- Rückwärtsketten und nicht strukturierte Umwandlungen erzeugen keinen Bonus.
- Fokussierte Umwandlungs- und Schadensmodelltests sowie Typecheck sind grün.
- Nächster Rechenblock: vollständige Modifier-Anwendbarkeit und danach
  schädigende Zustände mit ihren gegnerabhängigen Sonderregeln.
# Fortsetzung: Schritt 35 – Entzünden mit PoB2-Gegnerschwelle

- Der PoB2-Pin bleibt
  `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.
- `generated/pob2/damage-reference.json` enthält nun die 100
  levelabhängigen `monsterAilmentThresholdTable`-Werte sowie die gepinnten
  Entzünden-Konstanten.
- Entzünden wird nur bei vollständiger Kette aus Feuerschaden, Gegnerlevel,
  Trefferchance und Wirkfrequenz produktiv berechnet.
- Nicht modellierte Ailment-Sonderfälle bleiben fail-closed.
- Die PoB2-Runtime wird weiterhin nicht eingebettet.
# Fortsetzung: Schritt 36 – Gegnerabwehr für Ailment-DPS

- Schädigende Zustände übernehmen den aufgelösten Vergleichsgegner.
- Entzünden und Gift berücksichtigen Widerstand und belegte
  Widerstandsreduktion.
- Trefferpenetration bleibt korrekt auf Treffer beschränkt.
- Die UI zeigt bei vorhandener Gegnerkette den bereinigten Zustandsschaden.

# Fortsetzung: Schritt 37 – Gegnerabwehr für nativen DoT

- Eigenständiger strukturierter Schaden über Zeit verwendet nun das
  aufgelöste Gegnerprofil.
- Widerstand und Widerstandssenkung wirken auf passende DoT-Schadensarten;
  Penetration bleibt auf Treffer beschränkt.
- Die UI zeigt bei vorhandener Gegnerkette den bereinigten
  Einzelanwendungswert.
- Überlappung, Refresh, vollständige Uptime und fertigkeitsspezifische
  Stapelregeln bleiben fail-closed.
# Fortsetzung: Schritt 38 – PoB2-Zustandskonstanten und Aggravation

- Blutung und Gift verwenden die exakt geprüften Konstanten des gepinnten
  PoB2-`Misc.lua` statt lokaler Zahlenliterale.
- Das Referenzschema ist Version 10.
- Der vollständig belegte unbedingte passive Aggravationsknoten wirkt nur,
  wenn er im aktiven Passive-/Waffensetplan tatsächlich belegt ist.
- Dauer, Magnitude und Aggravationsmultiplikator werden gemeinsam angewendet.
- Bedingte Aggravation und kritische Ailment-Sonderfälle bleiben fail-closed.

# Fortsetzung: Schritt 39 – kritische Entzünden-Gewichtung

- Die gepinnte PoB2-Funktion `CalcOffence.calcAilmentDamage` ist für
  Entzünden produktiv nachgebildet.
- Normale und kritische Treffer werden mit ihren getrennten
  Entzündenchancen und Schadensbasen gewichtet.
- `ailmentCritChance` wird als Wahrscheinlichkeit mindestens eines kritisch
  ausgelösten aktiven Entzündens ausgewiesen, nicht als erfundener
  Schadensmultiplikator.
- Kritische Gift-/Blutungs-Sonderfälle bleiben bis zu einer vollständigen
  belegten Bedingungskette ausgeschlossen.

# Fortsetzung: Schritt 40 – kritische Blutungs- und Giftgewichtung

- Blutung und Gift erhalten die gleiche gepinnte normale/kritische
  Quellschadensgewichtung wie PoB2.
- Die Zustands-Kritwahrscheinlichkeit bleibt eine getrennte Kennzahl und wird
  nicht als zusätzlicher Schadensmultiplikator missbraucht.
- Bedingte Krit-Zustandsstats bleiben weiter fail-closed.

# Fortsetzung: Schritt 41 – bedingte kritische Zustandschance

- Normale und kritische Gift-/Blutungschancen sind getrennt modelliert.
- Die exakte PoB2-Unique-Zeile `Critical Hits Poison the enemy` setzt
  ausschließlich die Giftchance kritischer Treffer auf 100 Prozent.
- Die Auflösung erfolgt über stabile `pob2:`-ID, ausgewählte Variante und
  exakte englische Quellzeile; OCR, Freitext und deutsche Anzeigetexte sind
  ausgeschlossen.
- Weitere bedingte Zustandsstats bleiben bis zu einer vollständigen
  gepinnten Stat- und Bedingungskette fail-closed.

# Fortsetzung: Schritt 42 – kritische Angriffs-Aggravation

- Die exakte PoB2-Unique-Zeile zur Aggravation bei kritischen
  Angriffstreffern ist produktiv integriert.
- Nur der kritische Angriffsanteil der Blutungsanwendungen wird verschärft.
- Zaubertreffer und normale Treffer bleiben ausgeschlossen; globale
  Aggravation wird nicht doppelt multipliziert.

# Fortsetzung: Schritt 43 – Lucky-Trefferschadenswürfe

- Unbedingte allgemeine und schadensartspezifische Lucky-Chancen aus exakt
  belegten Passivknoten fließen in den Treffer-Erwartungswert ein.
- Die Berechnung verwendet den Erwartungswert des besseren von zwei
  gleichverteilten Schadenswürfen und mischt ihn mit der belegten Chance.
- Die Zuordnung bleibt waffensetgetrennt; bedingte Gegnerzustände sowie
  defensive Unlucky-Texte bleiben fail-closed.
- Rechenmodell `3.7.0`, Lucky-Teilmodell `1.0.0`.
- Weiter offen: Doppel-/Dreifachschaden, bedingte Lucky-Zustände und
  fertigkeitsspezifische Wiederholungsformeln.

# Fortsetzung: Schritt 44 – Meta-Trigger-Zielkette

- Eingebettete aktive Fertigkeiten werden über stabile
  `SkillSetup.embeddedSkillIds` mit ihrer Meta-Triggerquelle verbunden.
- Unbekannte eingebettete IDs erzeugen keine behauptete Zielidentität.
- Quelle, belegte Bedingung und Ziel werden mit Quellenreferenzen
  ausgewiesen.
- Ohne vollständige Ereignis-, Energie- und Frequenzkette bleibt zusätzlicher
  Trigger-DPS fail-closed.
- Trigger-Teilmodell `1.1.0`.

# Fortsetzung: Schritt 45 – Meta-Trigger-Energiekette

- Das gepinnte Schadensreferenzschema `11` enthält interne
  Trigger-Supportdefinitionen mit Fertigkeitstypanforderungen und
  Energie-pro-Wirkzeit-Regeln.
- Eingebettete Ziele werden gegen erforderliche und ausgeschlossene
  Fertigkeitstypen geprüft.
- Energiebedarf, Energie pro Ereignis, Gemmenlevel-Modifikator und
  erforderliche Ereignisse bei Monsterstärke eins werden ausgewiesen.
- Ohne belegte Ereignisrate bleibt zusätzlicher Trigger-DPS fail-closed.
- Trigger-Teilmodell `1.2.0`.

# Fortsetzung: Schritt 46 – Meta-Trigger-Ereignisrate

- `Cast on Critical` verwendet Aktionsrate, Trefferchance und effektive
  Kritchance für die belegte kritische Ereignisrate.
- Energieaufbau, Auslösungen pro Sekunde und Sekunden pro Auslösung werden
  bei normierter Monsterstärke eins ausgewiesen.
- Andere Ereignisarten bleiben ohne belegte Rate blockiert.
- Eingebetteter Zielschaden wird noch nicht zum Gesamt-DPS addiert; dafür
  fehlt die rekursionssichere Sekundärskill-Berechnung.
- Trigger-Teilmodell `1.3.0`.

# Fortsetzung: Schritt 47 – Meta-Trigger-Zielschaden

- Kompatible eingebettete Zielskills werden rekursionssicher in einem
  isolierten Schadenslauf berechnet.
- Ausrüstung, Waffenset, Passive, Aszendenz, Meta-Supports, Krit und das
  optionale Gegnerprofil bleiben in derselben Wirkungskette.
- Der interne Trigger-Schadensfaktor wird genau einmal angewendet.
- Erwarteter Zieltreffer und normierter Trigger-DPS bei Monsterstärke eins
  werden ausgewiesen, aber ohne reale Monsterstärke noch nicht zum
  Gesamt-DPS addiert.

# Fortsetzung: Schritt 48 – Meta-Trigger mit Monsterstärke

- Die gepinnten PoB2-Standardwerte für Monsterstärke sind jetzt Bestandteil
  des automatischen Gegnerprofils: selten 10 für Mapping/Allround und
  einzigartig 20 für Boss.
- `Cast on Critical` verbindet kritischen Rohschaden, levelabhängige
  Zustands-Schwelle, Monsterstärke, Energiebonus und Energiebedarf zu einer
  tatsächlichen Auslöserate.
- Überschüssige Energie eines einzelnen kritischen Treffers erzeugt nicht
  mehrere Auslösungen desselben Ereignisses.
- Bei vollständig geschlossener Wirkungskette werden Hauptfertigkeit,
  ausgelöste Fertigkeit und gemeinsamer belegter Vergleichs-DPS getrennt
  ausgewiesen.
- Fehlende Zielidentität, Kompatibilität, Ereignisrate, Monsterstärke,
  Zustands-Schwelle oder Zielschaden bleiben fail-closed.
- Weiter offen sind exakte Cooldown-/Server-Tick-Grenzen, Rotation mehrerer
  Triggerziele, weitere Triggerbedingungen sowie Projektilüberlappung,
  Rückkehr- und Fork-Ketten.
- Trigger-Teilmodell `1.4.0`.

# Fortsetzung: Schritt 49 – Trigger-Cooldown und Server-Takt

- Der gepinnte Schadensreferenzgenerator übernimmt jetzt Basis-Cooldown und
  gespeicherte Nutzungen je Skill und Gemmenstufe.
- Produktive Triggerziele werden an ihrer belegten Basis-Abklingzeit
  begrenzt.
- Die Abklingzeit wird entsprechend dem gepinnten PoB2-Modul auf den nächsten
  Server-Tick von `0,033` Sekunden aufgerundet.
- Die Oberfläche weist Cooldown-Grenze, tickgerundete Dauer und tatsächliche
  Auslöserate getrennt aus.
- Weiter offen sind Cooldown-Recovery/Overrides, Sonderfälle gespeicherter
  Nutzungen und die Rotation mehrerer Triggerziele.
- Trigger-Teilmodell `1.5.0`.

# Fortsetzung: Schritt 50 – gemeinsame Meta-Auslösung und Ziel-Cooldowns

- Der gepinnte PoB2-Referenzexport enthält jetzt die exakten Stat-IDs der
  aktiven Fertigkeiten und internen Trigger-Supports.
- Für die belegten Meta-Fertigkeiten wird der gemeinsame Energiebedarf aus
  allen eingebetteten Wirkzeiten gebildet und bei voller Energie werden alle
  eingebetteten Fertigkeiten ausgelöst.
- Jede eingebettete Fertigkeit wird danach unabhängig durch ihren eigenen,
  auf `0,033` Sekunden gerundeten Cooldown begrenzt.
- Die Oberfläche zeigt den deutschen Zielnamen und die Zahl gemeinsam
  eingebetteter Fertigkeiten statt einer rohen internen Ziel-ID.
- Weiter offen: Cooldown-Recovery/Overrides, echte Rotations-Trigger und
  Sonderfälle gespeicherter Nutzungen.
- Technische Details:
  `docs/BUILD_ASSISTANT_META_MULTI_TARGET_COOLDOWN_STEP_50.md`.

# Fortsetzung: Schritt 51 – gespeicherte Nutzungen

- Die PoB2-Sonderregel für Fertigkeiten mit mehreren gespeicherten Nutzungen
  ist integriert: ihr Cooldown wird nicht auf den Server-Takt aufgerundet.
- Die App zeigt Nutzungszahl und Rundungsstatus getrennt an.
- `Frost Wall` belegt im Test den exakten Cooldown von `5,0` Sekunden statt
  einer falschen Rundung auf `5,016` Sekunden.
- Eine spätere Burst-Zeitachse darf gespeicherte Nutzungen berücksichtigen;
  der Dauer-DPS wird nicht mit ihrer Anzahl multipliziert.
- Trigger-Teilmodell `1.7.0`.
- Technische Details:
  `docs/BUILD_ASSISTANT_TRIGGER_STORED_USES_STEP_51.md`.

# Fortsetzung: Schritt 58 – Ressourcenkosten und Kosteneffizienz

- Die gepinnte PoB2-Reihenfolge für Kosten wurde um verringerte und weniger
  Manakosten sowie allgemeine und Mana-Kosteneffizienz erweitert.
- Kosteneffizienz wird als Divisor nach den additiven und multiplikativen
  Kostenmodifikatoren angewandt.
- Gemeinsame, waffensetspezifische und Aszendenzknoten bleiben getrennt.
- Nur unbedingte, exakt lesbare Knotenwirkungen werden produktiv verwendet;
  bedingte Wirkungen bleiben fail-closed.
- Das Ressourcenmodell trägt Schema `8.0.0`.
- Technische Details:
  `docs/BUILD_ASSISTANT_RESOURCE_COST_EFFICIENCY_STEP_58.md`.

# Fortsetzung: Schritt 59 – fertigkeitseigene Kostenwirkungen

- Das Ressourcenmodell wurde auf Version `9.0.0` angehoben.
- Der strukturierte Kostenaufschlag von `Toxic Domain` wird von der exakt
  gewählten Fertigkeitsstufe übernommen und additiv mit erhöhten und
  verringerten Manakosten verrechnet.
- `Mana Tempest`, `Archmage` und die anfängliche Rage-Kostenunterdrückung
  kanalisierter Fertigkeiten werden als strukturierte, aber noch
  laufzeitabhängige Kostenwirkungen erkannt.
- Diese dynamischen Fälle bleiben fail-closed und werden in der sichtbaren
  Ressourcenbilanz ausdrücklich als nicht angewandt ausgewiesen.
- Es wurden keine Datenpins, Produktdaten oder Runtime-Netzwerkgrenzen
  verändert.
- Technische Details:
  `docs/BUILD_ASSISTANT_INTRINSIC_SKILL_COSTS_STEP_59.md`.

# Fortsetzung: Schritt 60 – Archmage-Kosten und Mana-Skalierung

- Die bislang blockierte Archmage-Wechselwirkung wird jetzt aus den
  strukturierten Daten der exakt gewählten Gemmenstufe berechnet.
- Auf Stufe 20 werden `6,10 %` des bestätigten maximalen Manas als zusätzliche
  Grundkosten und `4 %` Schaden je 100 maximales Mana als zusätzlicher
  Blitzschaden angewandt.
- Bei 520 bestätigtem Mana entstehen damit 31 zusätzliche Mana-Grundkosten
  und 20,8 % des Schadens als zusätzlicher Blitzschaden.
- Archmage gilt nur für nicht-kanalisierte Zauber im selben aktiven
  Waffenset; eine getrennte Set-2-Quelle verändert keinen Set-1-Zauber.
- Fehlende Mana-, Stufen- oder Zielbelege bleiben fail-closed.
- Ressourcenmodell `10.0.0`, Schadensrechner `3.8.0`.
- Fokussierte Referenztests: 63 erfolgreich; Typecheck und Lint erfolgreich.
- Technische Details:
  `docs/BUILD_ASSISTANT_ARCHMAGE_STEP_60.md`.

# Fortsetzung: Schritt 61 – Mana-Tempest-Fenster

- `Mana Tempest` wird für einen mana-verbrauchenden Zauber im kompatiblen
  Waffenset als begrenztes aktives Schadensfenster berechnet.
- Grundverbrauch des Sturms, kontinuierlicher Manaaufwand der
  Hauptfertigkeit, der belegte zusätzliche Verbrauch von `30 %`,
  Manaregeneration und verfügbarer Manapool bestimmen die Fensterdauer.
- Auf Gemmenstufe 20 werden im aktiven Fenster `78 %` des Schadens als
  zusätzlicher Blitzschaden gewonnen.
- Dieser Gewinn läuft vor schadensartspezifischen Steigerungen und Supports
  durch die bestehende PoB-Modifikatorreihenfolge; der normale Dauerschaden
  bleibt unverändert.
- Getrennte Waffensets, Angriffe, Zauber ohne Manakosten, unbekannte
  Ressourcengrößen und nicht vollständig modellierte Kostenarten bleiben
  fail-closed.
- Temporalmodell `1.2.0`, Ressourcenmodell `10.0.0`,
  Schadensrechner `3.9.0`.
- Fokussierte Tests `54/54`, Typecheck, Lint und Produktions-Build
  erfolgreich.
- Technische Details:
  `docs/BUILD_ASSISTANT_MANA_TEMPEST_STEP_61.md`.
# Schritt 62 – kanalisierte Raserei-Kosten

- Das Ressourcenmodell 11.0.0 bildet das gepinnte anfängliche Aussetzen
  laufender Raserei-Kosten strukturiert ab.
- Flame Breath und Rampage besitzen geprüfte Kostenphasen einschließlich
  normaler Qualität.
- Der anschließende Raserei-Verbrauch pro Sekunde ist sichtbar; eine maximale
  Kanalisierungsdauer bleibt bis zur vollständigen Rasereivorrats- und
  Erzeugungskette unbekannt.
- Ungültige Qualität wird fail-closed blockiert.
- Datenpins, Produktdaten und Runtime-Offlineregeln bleiben unverändert.
# Schritt 63 – Raserei-Erzeugung pro Treffer

- Das Ressourcenmodell 12.0.0 verbindet gepinnte Rage-Supports mit ihrem
  exakten Rasereigewinn pro Treffer.
- Trefferbasierter Gewinn, Sekundengewinn und Nettoverbrauch werden getrennt.
- Ohne tatsächliche Trefferfrequenz wird kein Sekundenwert erfunden.
- Der nächste Ressourcenbaustein ist die belegte Verbindung von Waffen-
  Angriffsgeschwindigkeit, Trefferzahl und Rasereivorrat.

# Schritt 64 – waffenbasierte Aktionsfrequenz

- Das Ressourcenmodell 13.0.0 verbindet Angriffe mit der beobachteten
  endgültigen Angriffsgeschwindigkeit oder einer eindeutig gepinnten
  Waffenbasis.
- Lokale Angriffsgeschwindigkeit und der strukturierte
  Fertigkeitsmultiplikator werden in der belegten Reihenfolge angewandt.
- Set 1 und Set 2 werden getrennt ausgewertet; widersprüchliche Werte für
  `beide` bleiben ungelöst.
- Die Aktionsfrequenz steuert Kosten pro Verwendung. Sie wird nicht als
  garantierte Trefferfrequenz ausgegeben; Raserei pro Treffer bleibt bis zur
  vollständigen Trefferkette fail-closed.
- Fokussierte Tests: 33 erfolgreich; Typecheck erfolgreich.
- Technische Details:
  `docs/BUILD_ASSISTANT_ATTACK_ACTION_FREQUENCY_STEP_64.md`.

# Schritt 65 – erfolgreiche Treffer in der Ressourcenbilanz

- Das Ressourcenmodell 14.0.0 erhält für den Hauptangriff die abschließend
  berechnete Aktionsfrequenz und die exakte Trefferchance gegen das
  Vergleichsziel.
- Raserei pro Nahkampftreffer wird nur bei strukturiertem `Melee`-Typ und
  belegter erfolgreicher Trefferfrequenz in einen Sekundenwert umgerechnet.
- Globale Geschwindigkeit, Supports und Cooldownbegrenzungen sind damit in
  der Hauptangriffs-Ressourcenrate enthalten.
- Mehrfachtreffer, Projektile, Flächenüberlappungen und mehrere Ziele bleiben
  getrennte, noch nicht pauschal eingerechnete Mechaniken.
- Fokussierte Tests: 75 erfolgreich; Typecheck erfolgreich.
- Technische Details:
  `docs/BUILD_ASSISTANT_SUCCESSFUL_HIT_RESOURCE_STEP_65.md`.

# Schritt 66 – bestätigter Rasereivorrat und Nutzungsdauer

- Der gepinnte PoB2-Grundwert `BaseMaximumRage = 30` wird vom
  Referenzgenerator fail-closed geprüft und in die reduzierte
  Schadensreferenz übernommen.
- Exakt erkannte Ausrüstungswerte mit `maximum_rage` sowie unbedingt wirksame
  Passive- und Aszendenzknoten erhöhen den bestätigten Vorrat.
- Nettoverbrauch, kostenfreies Anfangsfenster und der Start mit vollem Vorrat
  ergeben eine sichtbare maximale Nutzungsdauer.
- Deckt die belegte Treffererzeugung den Verbrauch vollständig, wird die
  Fertigkeit als dauerhaft tragfähig ausgewiesen.
- Bedingte Vorratswirkungen, unbekannter aktueller Rasereistand,
  Mehrfachtreffer und mehrere Ziele bleiben fail-closed.
- Ressourcenmodell `15.0.0`; 74 fokussierte Tests und Typecheck erfolgreich.
- Technische Details:
  `docs/BUILD_ASSISTANT_RAGE_POOL_STEP_66.md`.
