# Schritt 101 – messbare numerische Wirkungsgrenze

## Zweck

Nach der vollständigen semantischen Erfassung misst dieser Schritt getrennt,
wie viele offizielle Baumzeilen bereits mit BuildProfile-Feldern verbunden
sind und ob die aus dem Originaltext extrahierten Zahlen tatsächlich in eine
numerische Wirkungsrechnung eingehen.

## Ergebnis

- sichtbare Statzeilen: 5.962
- semantisch klassifiziert: 5.962 (100,00 %)
- mit BuildProfile oder einem direkten Bedarfsfeld verbunden: 5.091 (85,39 %)
- nur semantisch erkannt: 871
- Statzeilen mit extrahierten Zahlen: 5.716
- Statzeilen, deren Quellzahlen numerisch angewendet werden: 0

Der bestehende Zielbewerter benutzt geprüfte Mechaniktags, Profilaffinitäten
und konfigurierte Gewichte. Er benutzt bislang nicht den konkreten Zahlenwert
einer Baumzeile. Damit kann er passende Richtungen priorisieren, aber nicht
seriös berechnen, ob beispielsweise 20 % oder 40 % erhöhter Schaden den
besseren Gesamtplan ergibt.

## Priorisierte Restfamilien

Die größten nur semantisch erkannten Familien sind Debuffs (65),
Stun-Buildup (65), Totems (53), Slow (48), gewährte Fertigkeiten (45), Rage
(41), Flasks (28), Charms (27), Glory (25), Remnants (25) und Warcries (21).

## Konsequenz

Der nächste Rechenschritt muss kein weiteres freies Rankinggewicht ergänzen.
Er benötigt ein getrenntes, getestetes Wirkungsmodell, das:

1. Quellzahl, Einheit und Wirkungsrichtung strukturiert erhält,
2. additive, erhöhte, verringerte, mehr- und weniger-Multiplikatoren trennt,
3. Bedingungen und Geltungsbereich fail-closed führt,
4. erst danach in Skill-, Treffer-, DoT-, Ressourcen- oder Defensivformeln
   einfließt.

Path-of-Building-2-Parität ist deshalb weiterhin nicht belegt.
