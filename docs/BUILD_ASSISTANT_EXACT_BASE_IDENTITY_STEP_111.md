# Schritt 111 – Exakte Basistypidentität aus sichtbaren Namen

## Ziel

OCR- und manuell sichtbare Basistypnamen werden nur dann mit einer gepinnten
technischen Basis verbunden, wenn der deutsche oder englische Name innerhalb
der Itemklasse exakt und eindeutig reproduzierbar ist.

## Umsetzung

- Groß-/Kleinschreibung, Akzente, Leerzeichen und reine Zeichensetzung dürfen
  variieren; Wortlaut und Zeichenfolge müssen ansonsten exakt bleiben.
- Fuzzy-Matching, Teilnamen und korrigierte OCR-Schreibfehler erzeugen keine
  technische Identität.
- Bei einem exakten Treffer speichert der Editor die technische Basis-ID.
- Bereits gespeicherte Einträge mit einem exakten sichtbaren Namen werden bei
  der Anforderungsprüfung ebenfalls aufgelöst.
- Fehlen beobachtete Endwerte, darf die App die gepinnten Waffen- oder
  Verteidigungsgrundwerte einsetzen. Beobachtete Tooltip-Endwerte besitzen
  weiterhin Vorrang und werden nicht doppelt berechnet.

## Grenzen

Unvollständige, mehrdeutige oder falsch erkannte Namen bleiben fail-closed
unaufgelöst. Es werden weder technische IDs noch Grundwerte geraten.

## Prüfung

- 18 fokussierte Basisregister-, Identitäts- und OCR-Tests sind erfolgreich.
- Typecheck und Lint sind erfolgreich.
- Produktpins und generierte Produktdaten bleiben unverändert.

