# Schritt 34 – Skill- und globale Schadensumwandlung

Die Berechnung liest intrinsische Skillumwandlungen jetzt direkt aus den
strukturierten, level- und qualitätsabhängigen Skillstats. Damit wird etwa die
physische Basis eines elementaren Angriffs nicht mehr fälschlich vollständig
als physischer Schaden weitergerechnet.

Die Reihenfolge folgt dem gepinnten PoB2-Ansatz:

1. intrinsische Skillumwandlung besitzt Vorrang;
2. mehrere Skillumwandlungen über 100 % werden proportional begrenzt;
3. globale Umwandlung greift nur auf den nach Skillumwandlung verbleibenden
   Anteil;
4. mehrstufige Vorwärtsketten folgen
   `Physisch → Blitz → Kälte → Feuer → Chaos`;
5. rückwärts gerichtete und unbelegte Ketten bleiben blockiert.

Tests decken Skillpriorität, Restanteil, Mehrstufigkeit, Herkunftsskalierung
und den produktiven Lightning-Arrow-Fall ab.
