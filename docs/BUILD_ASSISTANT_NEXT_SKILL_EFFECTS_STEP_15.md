# Vorbereitete Folgeangriffe – Schritt 15

## Ziel

Schritt 15 verbindet eine vorbereitende Fertigkeit ausschließlich mit dem
konkret unmittelbar folgenden Hauptangriff. Ein einmaliger Bonus wird getrennt
von dauerhaftem Schaden pro Sekunde ausgewiesen.

Es gibt keine neue Nutzereinstellung.

## Geschlossene Wirkungskette

Eine Wirkung darf nur produktiv werden, wenn alle folgenden Belege gemeinsam
vorliegen:

1. die vorbereitende Fertigkeit ist im Build ausgewählt,
2. die Bossrotation ordnet sie direkt vor dem Hauptangriff an,
3. die Hauptfertigkeit erfüllt die strukturierte Waffen- und Skillanforderung,
4. ein gepinnter numerischer Effektwert ist vorhanden,
5. der Effekt besitzt ein eindeutig begrenztes Ziel.

Ein Waffensetwechsel wird nicht als Angriff behandelt. Entscheidend ist die
Reihenfolge der tatsächlich verwendeten Fertigkeiten.

## Emergency Reload

Der gepinnte Datensatz enthält `31 % mehr Schaden` für Emergency Reload. Die
App wendet diesen Wert nur an, wenn unmittelbar danach eine als Angriff und
Armbrustfertigkeit strukturierte Hauptfertigkeit folgt.

Das Ergebnis erscheint als `Vorbereiteter nächster Treffer`. Der normale
Trefferschaden pro Sekunde bleibt unverändert, weil Wiederholungsfrequenz und
dauerhafte Uptime nicht aus einem einmaligen Reload abgeleitet werden dürfen.

## Infernal Cry

Der gepinnte Datensatz enthält `49 % des Schadens als Feuerschaden` für einen
exerted Angriff. Die Rotation kann den vorgesehenen Folgeangriff nun
identifizieren. Nicht vollständig aufgelöst sind jedoch:

- tatsächliche Warcry-Power,
- Zahl verfügbarer Exertions,
- der konkrete Verbrauch einer Exertion.

Deshalb wird der Kandidat sichtbar erklärt, aber nicht numerisch angewandt.

## Mantra of Destruction

Der strukturierte Chaoswert beträgt `69 %`. Comboaufbau, Aktivierungszustand
und Einmalverbrauch sind nicht gemeinsam belegt. Der Effekt bleibt daher
fail-closed und verändert weder Folgeangriff noch Dauer-DPS.

## Implementierung

- Modell: `src/engine/damage-estimation/next-skill-effects.ts`
- Modellversion: `1.0.0`
- Schadensintegration: `src/engine/damage-estimation/estimate.ts`
- Ergebnisdarstellung: `src/components/BuildAssistantResultSection.tsx`
- Audit: `docs/audits/build-assistant-next-skill-effects-step-15.json`

Die produktiven Definitionen von Emergency Reload, Infernal Cry und Mantra of
Destruction sind als vorbereitende Rotationsschritte gekennzeichnet. Dadurch
ordnet der bestehende Rotationsgenerator sie direkt vor dem Hauptangriff ein,
ohne eine zweite Rotationsengine einzuführen.

## Sicherheitsgrenzen

- Keine Wirkung allein aufgrund des Skillnamens.
- Keine Wirkung auf Zauber oder nicht passende Waffen.
- Keine angenommene Exertion.
- Keine angenommene Combo.
- Kein einmaliger Bonus im dauerhaften DPS.
- Keine freie Wiederholungsfrequenz.
- Keine neue Nutzereinstellung.

## Schlussfolgerung

Die App unterscheidet nun technisch zwischen dauerhaftem Schaden, einem
zeitlich begrenzten Bufffenster und einem einmalig vorbereiteten Folgeangriff.
Emergency Reload kann bei einer geschlossenen Armbrustkette produktiv wirken.
Infernal Cry und Mantra of Destruction bleiben korrekt blockiert, bis ihre
jeweilige Zustands- und Verbrauchskette belegt ist.

## Als Nächstes

Schritt 16 modelliert Schaden über Zeit und Ailments getrennt vom
Trefferschaden. Basiswert, Dauer, Auslösebedingung und Stapelverhalten müssen
gemeinsam belegt sein, bevor ein dauerhafter Schadenswert entsteht.
