# Build-Assistent – vollständige elementare Exposition, Schritt 134

## Ziel

Schritt 134 vervollständigt die elementaren Expositionsunterstützungen. Feuer- und Kälte-Exposition verwenden denselben Fertigkeits-, Waffenset-, Gegnerstatus- und Uptimepfad wie die bereits belegte Blitz-Exposition.

## Gepinnte Quellen

Maßgeblich ist `PathOfBuildingCommunity/PathOfBuilding-PoE2` bei Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`.

- `Fire Exposure`, Quellrecord `SupportFireExposurePlayer`: `inflict_exposure_for_x_ms_on_ignite = 8000`.
- `Cold Exposure`, Quellrecord `SupportColdExposurePlayer`: `inflict_exposure_for_x_ms_on_cold_crit = 8000`.
- `Lightning Exposure`, Quellrecord `SupportLightningExposurePlayer`: `inflict_exposure_for_x_ms_on_shock = 8000`.
- `Potent Exposure`, Quellrecord `SupportPotentExposurePlayer`: `exposure_effect_+% = 20`.
- PoB2 verwendet 20 % als generischen Expositionsgrundwert und den stärksten Wert je Element.

## Feuer-Exposition

Die App berechnet die tatsächliche Entzündungs-Anwendungsrate derselben Fertigkeitskarte aus:

- durchschnittlichem Feuertreffer,
- kritischem Feuertreffer,
- gepinnter Gegner-Zustandsschwelle,
- PoB2-Entzündungs-Chancemultiplikator,
- strukturierten Skill- und Supportmodifikatoren,
- Trefferchance,
- Kritchance und
- Aktionen pro Sekunde.

Nur wenn die erwartete Anwendungsrate das Acht-Sekunden-Fenster zuverlässig erneuert, wirken 20 % Feuer-Exposition beziehungsweise 24 % mit `Potent Exposure`.

## Kälte-Exposition

Die App berechnet kritische Kältetreffer derselben Fertigkeitskarte aus:

- vorhandener Kältetrefferkomponente,
- Trefferchance,
- Kritchance und
- Aktionen pro Sekunde.

Nur wenn mindestens eine erwartete Anwendung innerhalb von acht Sekunden belegt ist, wirkt die Exposition.

## Gemeinsamer elementarer Trefferkontext

Der zuvor schockspezifisch benannte Kontext transportiert jetzt zusätzlich Feuer- und Kältetrefferwerte. Primäre und weitere aktive Fertigkeiten werden weiterhin separat und waffensetgenau berechnet. Es wurde keine zweite Zustands- oder Schadensengine eingeführt.

## Fail-closed

Keinen Bonus erzeugen:

- Support an einer anderen Fertigkeitskarte,
- Feuer ohne belegten Feuertreffer,
- zu geringe Entzündungsrate,
- Kälte ohne belegten Kältetreffer,
- zu geringe kritische Kältetrefferrate,
- fehlende Gegner-Zustandsschwelle,
- Textähnlichkeit oder bloßer Anzeigename ohne ausgewählte Support-ID.

## Versionen

- Schadensrechner `3.48.0`
- Expositionsmodell `1.1.0`
- Schockmodell `1.4.0`
- zeitliches Gegnerstatusmodell `2.0.0`

## Prüfung

Fokussiert wurden 2 Dateien mit 79 Tests geprüft. Enthalten sind aktive und blockierte Feuer- sowie Kälteketten und ein vollständiger Integrationstest vom Feuertreffer bis zum höheren Schaden nach Gegnerwiderstand. Die serielle Gesamtsuite bestand mit 140 Dateien und 1.738 Tests. Typecheck, Lint, Produktions-Build, Pages-Build, 206 JSON-Dateien und `git diff --check` waren erfolgreich.

## Nächster Schritt

Als nächster Gegnerzustandsbaustein wird geprüft, welche weiteren Widerstands- oder Schadensaufnahmeeffekte aus den gepinnten Skills, Supports, Passiven und Aszendenzen bis zur Laufzeitanwendung vollständig geschlossen werden können.
