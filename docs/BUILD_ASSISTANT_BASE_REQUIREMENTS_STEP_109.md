# Schritt 109 – Tragbare konkrete Ausrüstungsbasen

## Ergebnis

Konkrete automatisch vorgeschlagene Waffenbasen werden jetzt gegen den realen Charakterzustand des vorgesehenen Waffensets geprüft. Maßgeblich sind Charakterlevel sowie Stärke, Geschicklichkeit und Intelligenz aus dem in Schritt 108 eingeführten Attributmodell.

## Verhalten

- Levelanforderungen werden exakt geprüft.
- Attributanforderungen werden je Waffenset geprüft.
- Fehlt der belegte Attributstand, wird eine konkrete Basis fail-closed nicht ausgewählt.
- Eine nicht tragbare Basis darf weder als konkreter Gegenstandsvorschlag noch als interne Referenzwaffe für die Schadensschätzung dienen.
- Gibt es keine belegbar tragbare Basis, bleibt nur die allgemeine Waffenart sichtbar; konkrete Werte werden nicht erfunden.
- Der Vorschlagsdialog nennt Anforderungen und bestätigt nur bei tatsächlich erfolgreicher Prüfung deren Erfüllung.

## Grenzen

Das Modell prüft derzeit Level, Stärke, Geschicklichkeit und Intelligenz. Andere mögliche Nutzungsbedingungen, dynamische Attributänderungen und nicht exakt strukturierte Anforderungen bleiben unbekannt. Gleichwertigkeit mit Path of Building 2 ist damit nicht belegt.

## Verifikation

- 18 fokussierte Tests erfolgreich
- 1.636 Tests in der seriellen Gesamtsuite erfolgreich
- Typecheck, Lint und Produktions-Build erfolgreich
- JSON-Validierung und `git diff --check` erfolgreich
