# Schritt 140 – Zustandsaufbau durch Einfrier- und Voltaisches Mal

## Ziel

Die beiden lokal vollständig belegbaren Markierungswirkungen werden waffenset-, stufen- und qualitätsgenau in das Gegnerprofil aufgenommen. Bedingte Folgebuffs bleiben ohne bestätigten Aktivierungszustand gesperrt.

## Produktive Wirkung

- `Freezing Mark` verwendet `freezing_mark_hit_damage_freeze_multiplier_+%_final` als mehr Einfrieraufbau gegen das markierte Ziel.
- `Voltaic Mark` verwendet `thaumaturgist_mark_hit_damage_electrocute_multiplier_+%` als erhöhten Elektrisieren-Aufbau gegen das markierte Ziel.
- Beide Grundwerte betragen im gepinnten Datensatz 35 Prozent.
- Normale Qualität erhöht den jeweiligen Wert strukturiert um einen Prozentpunkt je Qualität. Einfrier-Mal mit 20 Qualität ergibt 55 Prozent; Voltaisches Mal mit 10 Qualität ergibt 45 Prozent.
- Nur Fertigkeitskarten des aktiven Waffensets wirken.
- Gleichartige Markierungen addieren sich nicht; deterministisch gilt nur der stärkste belegte Aufbauwert.

## Fail-closed-Grenzen

- Der 30-Prozent-Schaden-als-Kälte-Buff von Einfrier-Mal setzt ein tatsächliches Einfrieren und das anschließende zehnsekündige Bufffenster voraus. Ohne diese geschlossene Zustands- und Rotationskette entsteht kein Schadensbonus.
- Entsprechend bleibt der Schaden-als-Blitz-Buff des Voltaischen Mals ohne bestätigtes Elektrisieren gesperrt.
- Der Zustandsaufbau wird nicht als unmittelbarer Treffer- oder DPS-Multiplikator missbraucht.
- `Predator's Mark` bleibt ohne reproduzierbare Anzahl naher Gegner gesperrt. `Bloodhound's Mark` bleibt ohne vollständige Blutverlust-, schweren Betäubungs- und Explosionskette gesperrt.

## Versionen

- Schadensrechner: `3.54.0`
- Zustandsaufbau-Markmodell: `1.0.0`
- Gepinnte PoB2-Schadensreferenz und Produktpins bleiben unverändert.

## Ergebnis

Der Buildplaner kann nun zwei weitere Markierungsfertigkeiten exakt als Kontrollzustandsverstärker ausweisen, ohne daraus unbelegten Schaden zu erfinden. Dies schließt einen weiteren Teil der PoB2-Gegnerzustandskette, ist aber noch kein vollständiges Einfrier-/Elektrisieren-Schwellenmodell.

## Prüfung

- Fokussiert: 2 Dateien und 98 Tests erfolgreich.
- Gesamtlauf: 139 Dateien und 1.756 Tests erfolgreich; zwei zeitkritische Passivbaumdateien überschritten nur unter gemeinsamer Last das 5-Sekunden-Limit.
- Isolierter serieller Wiederholungslauf: 2 Dateien und 197 Tests erfolgreich.
