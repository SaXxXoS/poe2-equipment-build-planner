# Build-Assistent – Abklingzeiterholung (Schritt 56)

## Ergebnis

Das Cooldownmodell liest neben Supporteffekten nun auch belegte
Abklingzeiterholung aus:

- dem aktiven Waffenset,
- dem für dieses Set geplanten normalen Passivbaum,
- dem aktiven Aszendenzplan.

## Unterstützte Quellen

- Allgemeine Baumzeilen der Form
  `N% increased Cooldown Recovery Rate`
- Grenade-spezifische Baumzeilen der Form
  `N% increased Cooldown Recovery Rate for Grenade Skills`
- Das technische Ausrüstungsstat
  `grenade_skill_cooldown_speed_+%`

Markup der gepinnten Baumquelle wird ausschließlich syntaktisch entfernt.
Es findet keine freie Textähnlichkeit oder Übersetzung als technische
Zuordnung statt.

## Rechenregel

Support-, Ausrüstungs- und Passiveffekte werden addiert:

`effektiver Cooldown = Basis-Cooldown / (1 + Recovery / 100)`

Die nachhaltige Nutzungsrate wird daraus als Kehrwert berechnet. Gespeicherte
Nutzungen bleiben ein separater kurzfristiger Vorrat und multiplizieren die
nachhaltige Rate nicht.

## Anwendungsgrenzen

- Grenade-Recovery wirkt ausschließlich auf Skillreferenzen mit dem
  strukturierten Typ `Grenade`.
- Waffeneffekte aus dem inaktiven Set werden nicht gelesen.
- Minion-Command- und Warcry-spezifische Varianten bleiben bis zu einer
  eigenen strukturierten Skilltypprüfung fail-closed.
- Unbekannte sichtbare Texte erzeugen keinen Recheneffekt.

## Prüfung

Tests belegen allgemeine und Grenade-spezifische Recovery, aktive
Waffenset-Trennung, Nichtanwendung auf fremde Skilltypen und die korrekte
Änderung der nachhaltigen Cooldown-Rate.
