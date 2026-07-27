# Build-Assistent – Schritt 4: quantitative Wirkungskette

## Ziel

Schritt 4 verbindet die in Schritt 3 getrennten Wirkungsbereiche mit einer
deterministischen Zahlenkette. Ausschließlich technisch vorhandene Zahlen
werden verrechnet. Analyzer-Scores, semantische Gewichte und unbekannte
Mechaniken werden nicht als Prozentwerte ausgegeben.

## Berechnungsreihenfolge

1. strukturierter Skill- oder Waffen-Grundschaden,
2. bestätigte einstufige Schadensumwandlung,
3. passende additive Schadenserhöhungen,
4. belegte Angriffs- beziehungsweise Zaubergeschwindigkeit,
5. Trefferschaden und Trefferschaden pro Sekunde innerhalb der ausgewiesenen
   Modellgrenzen.

Jeder Schritt wird in der Ergebnisansicht separat angezeigt.

## Quellen

- tatsächliche, manuell oder durch OCR bestätigte Waffenendwerte,
- technische Stat-IDs der eingegebenen Ausrüstung,
- englische Original-Statzeilen der tatsächlich belegten Passive-Knoten,
- englische Original-Statzeilen der tatsächlich belegten Aszendenzknoten,
- gepinnte Skill- und Waffenbasis des bestehenden Damage-Reference-Produkts.

Es wurde keine neue Datenquelle eingeführt.

## Passive und Aszendenz

Nur vollständig eindeutige, unbedingte Zahlenzeilen werden numerisch
übernommen, darunter:

- erhöhter allgemeiner oder schadensartspezifischer Schaden,
- erhöhter Angriffs- oder Zauberschaden,
- Projektil-, Nahkampf- und Flächenschaden bei passender Skillmechanik,
- Angriffs- und Zaubergeschwindigkeit,
- kritische Trefferchance und kritischer Schadensbonus,
- ausdrücklich formulierte Schadensumwandlungen.

Bedingungen, Sondermechaniken und nicht eindeutig interpretierbare Zeilen
bleiben semantische Hinweise und verändern den Zahlenwert nicht.

## Schadensumwandlung

Eine bestätigte einstufige Umwandlung erhält die Schadenssumme. Umgewandelter
Schaden kann von belegten Erhöhungen seiner ursprünglichen und seiner neuen
Schadensart profitieren. Mehrere Umwandlungen derselben Ausgangsart werden bei
100 Prozent begrenzt und als Warnung ausgewiesen.

Verkettete Umwandlungen, Gain-as-extra und komplexe Prioritätsregeln sind noch
nicht Teil dieses Schritts.

## Kritische Treffer

Die tatsächliche Grundchance einer eingegebenen Waffe und belegte
Erhöhungswerte werden getrennt angezeigt. Kritische Treffer werden noch nicht
in den erwarteten Gesamtschaden eingerechnet, solange die vollständige
Skillbasis und alle Sonderregeln des kritischen Schadens nicht strukturiert
vorliegen. Dadurch entsteht keine scheinpräzise DPS-Zahl.

## Supports

Kompatibilität und Ausschlüsse der Supports bleiben wirksam. Numerische
Supportmultiplikatoren werden erst angewandt, wenn strukturierte Effektwerte
für den jeweiligen Support vorliegen. Namen oder Empfehlungs-Scores werden
nicht als Schadensmultiplikator interpretiert.

## Produktintegrität

- Defensive Werte erzeugen keinen offensiven Bonus.
- Waffen erhalten weiterhin keine Rüstung, keinen Ausweichwert und keinen
  Energieschild.
- Lokale Waffenaffixe werden bei bereits eingegebenen Waffenendwerten nicht
  doppelt verrechnet.
- Waffenset-spezifische Passive-Knoten werden nur für das aktive Skillset
  verwendet.
- Aszendenzwerte stammen nur aus tatsächlich belegten Aszendenzknoten.

## Verbleibende Grenzen

Noch nicht vollständig numerisch enthalten:

- numerische Supporteffekte,
- kritischer Erwartungsschaden,
- Gegnerwiderstände und Rüstung,
- bedingte Buffs, Flüche, Exposition und Debuffs,
- Schaden über Zeit und Ailments,
- Projektile, Mehrfachtreffer und Trigger,
- Minions,
- Ressourcen- und Geist-Uptime,
- verkettete Umwandlungen und Gain-as-extra,
- vollständige Gemmenlevel- und Qualitätskurven.

## Nächster Schritt

Schritt 5 sollte strukturierte numerische Supporteffekte und ein explizites
Gegnerprofil ergänzen. Danach können Supportpakete und Buildvarianten auf
einen belastbareren gemeinsamen Vergleichswert optimiert werden.
