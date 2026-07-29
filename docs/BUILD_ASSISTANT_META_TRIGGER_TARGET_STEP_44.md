# Build-Assistent – Schritt 44: Meta-Trigger-Zielkette

## Ergebnis

Meta-Fertigkeiten mit eingebetteten aktiven Fertigkeiten besitzen nun eine
deterministische Verbindung von der Triggerquelle zum Ziel. Die Verbindung
verwendet ausschließlich stabile Fertigkeits-IDs aus dem `BuildProfile`.

## Produktive Regeln

- Eine bekannte eingebettete Fertigkeit wird als `targetSkillId` ausgewiesen.
- Die Quellenreferenz nennt den konkreten Setup- und Zielbezug.
- Unbekannte IDs erzeugen keine behauptete Zielidentität.
- Eine bekannte Quelle-Bedingung-Ziel-Kette erhält den Status
  `blocked-missing-interval`.
- Ohne vollständige Ereignis-, Energie- und Frequenzkette wird kein
  zusätzlicher Trigger-DPS berechnet.

## Abgrenzung

Dieser Schritt verbindet Identitäten; er erfindet keine Auslösefrequenz.
Energieerzeugungsboni sind keine Triggerfrequenz. Voll produktiver
Trigger-Schaden folgt erst, wenn Ereignisrate, Energiebedarf,
Energieerzeugung, Auslösegrenze und Zielschaden gemeinsam belegt sind.

## Determinismus und Tests

Bekannte und unbekannte eingebettete IDs, der fail-closed Status sowie die
Quellenreferenzen sind durch fokussierte Tests abgedeckt. Das Trigger-Modell
hat Version `1.1.0`.
