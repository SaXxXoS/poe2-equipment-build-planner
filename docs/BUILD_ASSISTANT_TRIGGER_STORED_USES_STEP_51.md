# Schritt 51 – Gespeicherte Nutzungen und Cooldown-Rundung

PoB2 rundet einen Fertigkeits-Cooldown normalerweise auf den nächsten
Server-Tick. Besitzt die Fertigkeit jedoch mehr als eine gespeicherte Nutzung,
wird dieser Cooldown nicht auf Server-Ticks gerundet.

Die App übernimmt diese Regel jetzt aus den bereits gepinnten strukturierten
Feldern `cooldown` und `storedUses`:

- eine gespeicherte Nutzung: Aufrundung auf `0,033` Sekunden,
- mehrere gespeicherte Nutzungen: exakter Cooldown ohne Tick-Rundung,
- die langfristige maximale Triggerfrequenz bleibt `1 / Cooldown`,
- gespeicherte Nutzungen werden sichtbar ausgewiesen.

Der Referenztest verwendet `Frost Wall` mit drei gespeicherten Nutzungen und
belegt, dass `5,0` Sekunden nicht fälschlich zu `5,016` Sekunden werden.

Noch nicht modelliert ist eine kurzfristige Burst-Simulation, die mehrere
anfangs volle Nutzungen zeitlich verbraucht und anschließend wieder auflädt.
Sie darf den langfristigen Dauer-DPS nicht einfach mit der Nutzungsanzahl
multiplizieren.
