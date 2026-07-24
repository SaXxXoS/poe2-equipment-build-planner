# Foto- und Screenshot-Erkennung für Ausrüstungsgegenstände

## Ziel

Jeder Ausrüstungsslot besitzt im Gegenstandsdialog zwei zusätzliche
Eingabewege:

- **Foto aufnehmen** öffnet auf unterstützten Mobilgeräten die Kamera.
- **Screenshot wählen** öffnet die lokale Bildauswahl.

Beide Wege lesen einen einzelnen PoE2-Gegenstand aus einem Bild und bereiten
erkannte Grunddaten, Affixe und tatsächliche Werte für genau den geöffneten
Slot vor. Der vollständige manuelle Item-Editor bleibt erhalten.

## Datenschutz und Laufzeit

Die Texterkennung läuft vollständig im Browser mit den lokal ausgelieferten
Tesseract.js-Dateien. Das Bild wird nicht hochgeladen, nicht an eine externe
API gesendet und nicht im `BuildProfile` gespeichert. Nach Schließen oder
Ersetzen der Vorschau wird die temporäre Browser-URL wieder freigegeben.

Ausgeliefert werden:

- `tesseract.js` 6.0.1
- `tesseract.js-core` 6.1.2
- das englische Tesseract-Sprachmodell `eng` 1.0.0

Die statischen OCR-Dateien liegen unter `public/ocr/` und funktionieren damit
auch in der GitHub-Pages-Auslieferung ohne externen OCR-Dienst.

## Erkennungs- und Prüfablauf

1. Der Nutzer öffnet einen Ausrüstungsslot.
2. Er nimmt ein Foto auf oder wählt einen Screenshot.
3. Die lokale OCR liest den sichtbaren Gegenstandstext.
4. Seltenheit, Item-Level, sichtbarer Basistyp und Itemklasse werden
   extrahiert, soweit sie im Bild eindeutig vorkommen.
5. Modzeilen werden ausschließlich gegen den vorhandenen, für Slot,
   Itemklasse, Generation Type und Item-Level gefilterten Affixbestand
   geprüft.
6. Erkannte Zahlen werden mit den strukturierten Wertebereichen abgeglichen
   und wählen bei eindeutiger Deckung die passende Affixstufe.
7. Der Nutzer prüft alle Kandidaten und übernimmt nur die ausgewählten Zeilen.
8. Die übernommenen Daten erscheinen im vorhandenen Item-Editor und können
   vor dem Speichern manuell korrigiert werden.

Die OCR ist damit eine Eingabehilfe, keine neue technische Datenquelle.
Technische Mod- und Stat-IDs stammen weiterhin nur aus dem vorhandenen
Affixregister. Das Bild kann keine neue technische ID erzeugen.

## Fail-safe-Verhalten

- Sichere Kandidaten werden vorausgewählt.
- Nicht sicher erkannte Werte bleiben `review-required` und werden nicht
  stillschweigend eingesetzt.
- Unbekannte Zeilen erzeugen keinen Affix.
- Affixgrenzen der Seltenheit werden weiterhin eingehalten.
- Prefix, Suffix und Implicit bleiben getrennt.
- Normale Affixe und Unique-Eigenschaften werden nicht vermischt.
- Bei Unique-Namen darf ein vorhandener PoB2-Datensatz vorgeschlagen werden;
  eine mehrdeutige Variante wird nicht geraten.
- Passt kein Kandidat sicher, bleibt der manuelle Editor verfügbar.

## Technische Struktur

- `src/features/item-ocr/recognize.ts`: lokaler Tesseract-Lauf
- `src/features/item-ocr/matching.ts`: deterministische Extraktion,
  Werteprüfung und Registry-Abgleich
- `src/components/ItemOcrPanel.tsx`: Foto-, Screenshot- und Review-Oberfläche
- `src/components/AffixDialog.tsx`: slotbezogene Übernahme in den bestehenden
  Item-Editor

Die fachliche Übernahme verwendet weiterhin das bestehende
Mehrfach-Affix-Modell. Alle übernommenen Affixe und Werte gelangen deshalb
über denselben Normalisierungsweg in `BuildProfile` und Equipment Analyzer
wie manuell eingegebene Daten.

## Nachgewiesener Browserfall

Ein lokaler Test-Screenshot eines seltenen Helms wurde als:

- Seltenheit `rare`
- Item-Level `70`
- Itemklasse `Helmets`
- Prefix `(85–123) zu Treffgenauigkeit`
- tatsächlicher Wert `100`

erkannt und korrekt in `Prefix 1` des geöffneten Helm-Slots übernommen. Ein
nur ähnlich passender Hybridkandidat blieb deaktiviert. Bei 390 × 844 gab es
keinen horizontalen Seitenüberlauf.

## Grenzen

- OCR-Qualität hängt von Schärfe, Kontrast, Skalierung und vollständiger
  Sichtbarkeit des Gegenstandstexts ab.
- Stark überlagerte, abgeschnittene oder dekorativ verfremdete Texte können
  unvollständig bleiben.
- Komplexe Hybridmods und mehrzeilige Spezialtexte können eine manuelle
  Prüfung benötigen.
- Die automatische Bestimmung eines Basistyps ist nur so belastbar wie der
  sichtbare Bildtext; der Nutzer kann ihn im Editor korrigieren.
- Eine mehrdeutige Unique-Variante muss manuell gewählt werden.

## Schlussfolgerung

Foto und Screenshot sind nun slotbezogene, lokale Eingabewege. Sie erkennen
Affixkandidaten und tatsächliche Werte, lassen den Nutzer die Ergebnisse
prüfen und führen bestätigte Daten in den bestehenden Item-Editor und
Analyzertransport über.
