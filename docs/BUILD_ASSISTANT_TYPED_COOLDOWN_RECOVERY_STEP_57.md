# Build-Assistent – typgebundene Cooldown-Recovery (Schritt 57)

## Ergebnis

Die gepinnten Passivbaumwerte für Warcries und Minion-Commands werden nun
genauso fail-closed ausgewertet wie Grenade-Recovery:

- `N% increased Warcry Cooldown Recovery Rate` wirkt nur auf Skills mit dem
  strukturierten Typ `Warcry`.
- `Minions have N% increased Cooldown Recovery Rate for Command Skills`
  wirkt nur auf Skills mit `Command` beziehungsweise dem in der gepinnten
  Referenz vorhandenen Typ `CommandsMinions`.

## Abgrenzung

Der sichtbare Name einer Fertigkeit wird nicht ausgewertet. Ein normaler
Spell mit Cooldown erhält weder Warcry- noch Command-Recovery. Allgemeine
Cooldown-Recovery bleibt davon unabhängig für jeden Skill mit einem
belegten Basis-Cooldown nutzbar.

## Prüfung

Ein gemeinsamer Testbaum enthält Warcry- und Command-Recovery gleichzeitig.
Die Tests weisen nach, dass jeder strukturierte Skilltyp ausschließlich
seinen eigenen Bonus erhält und ein fremder Spell keinen der beiden Werte
übernimmt.
