# Build-Assistent – ausgehende Zustandsdauer und Magnitude, Schritt 125

## Ziel

Schritt 125 schließt eine quantitative Lücke im vorhandenen Modell für Entzünden, Gift und Blutung. Der Rechner berücksichtigt nun nicht nur die gepinnten Grunddauern, sondern auch belegte skill- und supportabhängige Dauer- und Magnitudenwerte.

## Gepinnte Quelle

- Repository: `PathOfBuildingCommunity/PathOfBuilding-PoE2`
- Commit: `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`
- Formeln: `src/Modules/CalcOffence.lua`, insbesondere `calcDamagingAilmentOutputs`
- Konstanten: `src/Modules/Data.lua`
- Produktreferenz: `generated/pob2/damage-reference.json`

## Geschlossene Lücke

Vor diesem Schritt wurden folgende vorhandene PoB2-Werte nicht vollständig in der Zustandsrechnung verwendet:

- erhöhte Entzündungsdauer,
- finale skillabhängige Entzündungsdauer,
- finale Dauer aller schädigenden Zustände,
- skillabhängige Entzündungsmagnitude,
- supportabhängige Entzündungsmagnitude.

Das betraf unter anderem `Molten Blast`, `Rolling Magma`, `Eternal Flame`, `Swift Affliction` und `Searing Flame`.

## Berechnung

Die Dauer wird in der von PoB2 belegten Form verbunden:

`Dauer = Grunddauer × (1 + Summe erhöhte/verringerte Dauer) × Produkt finale Dauermultiplikatoren`

Die Magnitude bleibt davon getrennt:

`Zustands-DPS = gewichteter ungeminderter Quellschaden × PoB2-Grundanteil × Produkt Magnitudenmultiplikatoren × aktive Stapel`

Eine längere Dauer erhöht nicht künstlich den Schaden pro Sekunde. Sie verändert die Lebensdauer einer Anwendung, das belegte Stapelpotenzial und den Gesamtschaden pro Anwendung.

## Produktive Felder

- `ignite_duration_+%`
- `active_skill_ignite_duration_+%_final`
- `support_swift_affliction_skill_effect_and_damaging_ailment_duration_+%_final`
- `support_multi_poison_poison_duration_+%_final`
- `active_skill_ignite_effect_+%_final`
- `support_stronger_ignites_ignite_effect_+%_final`

Jede tatsächlich verwendete Regel wird in `sourceReferences` des Ergebnisses ausgewiesen.

## Fail-closed-Grenzen

- Bedingte Magnitude wie „gegen eingefrorene Gegner“ bleibt ohne bestätigten Gegnerzustand inaktiv.
- Effekte pro verbrauchter Ressource oder pro aktuellem Stapel werden nicht pauschal aktiviert.
- Gegnerische DoT-Schadensaufnahme, spezielle Bodeneffekte und nicht vollständig modellierte Konvertierungen bleiben ausgeschlossen.
- Es wird keine Uptime behauptet, wenn Trefferchance, Wirkfrequenz, Anwendungschance oder Stapelgrenze fehlen.

## Versionen

- Zustandsmodell: `2.6.0`
- Schadensrechner: `3.39.0`

## Prüfung

- Fokussierte Referenztests: 3 Dateien, 66 Tests, erfolgreich
- Typecheck: erfolgreich
- Lint: erfolgreich
- Produktionsbuild: erfolgreich
- Pages-Build: erfolgreich
- Monolithische Gesamtsuite: durch bekannte Vitest-Worker-RPC-Zeitüberschreitung beendet; kein fachlicher Fehler in den geänderten fokussierten Tests

## Nächster Schritt

Als nächstes werden die bislang fehlenden gegnerseitigen DoT-Schadensaufnahme- und Faster/Slower-Ablaufraten nur dort erschlossen, wo die gepinnte Referenz eine vollständige und bedingungsfreie Identitätskette liefert.
