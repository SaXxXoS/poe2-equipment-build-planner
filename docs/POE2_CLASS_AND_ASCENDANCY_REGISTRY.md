# Klassen- und Aszendenzregister

Stand: 21. Juli 2026. Das zentrale generierte Register liegt in `generated/poe2-tree/class-registry.json`; UI und Baumadapter duplizieren keine vollständige Klassenliste.

Der Export 0.5.2 enthält zwölf Klassen: Marauder, Witch, Ranger, Duelist, Shadow, Templar, Warrior, Sorceress, Huntress, Mercenary, Monk und Druid. Exportmetadaten und Startknoten werden über offizielle Indizes/IDs verknüpft, niemals über ähnlich klingende UI-Namen. Acht Klassen besitzen im Export einen eindeutigen Hintergrundatlas und sind im UI auswählbar: Witch, Ranger, Warrior, Sorceress, Huntress, Mercenary, Monk und Druid. Marauder, Duelist, Shadow und Templar sind im Register sichtbar, aber mangels zugehörigem Exportatlas `partially-supported` und deaktiviert.

Vollständig benannte und bebilderte Aszendenzen werden auswählbar übernommen: Infernalist, Blood Mage, Lich, Abyssal Lich; Deadeye, Pathfinder; Titan, Warbringer, Smith of Kitava; Stormweaver, Chronomancer, Disciple of Varashta; Amazon, Spirit Walker, Ritualist; Tactician, Witchhunter, Gemling Legionnaire; Martial Artist, Invoker, Acolyte of Chayula; Oracle und Shaman. Ranger2 und Druid3 besitzen im Export weder Namen noch Bild und bleiben kontrolliert `unavailable`. Klassen ohne Export-Aszendenzen erhalten keine erfundenen Einträge.

Je Eintrag speichert das Register technische/Export-ID, Klasse, englischen Anzeigenamen und Locale, Startknoten, Knoten-/Verbindungs-IDs, Bildreferenz und Atlasframe, Export-/UI-Verfügbarkeit, Quellversion und Status. Fremde Aszendenzen sind durch `classId` nicht auswählbar.

Bei einem neuen Release muss der Import Klassen, Starts, Aszendenzen und Bildreferenzen gegen das vorige Register vergleichen. Neue Einträge werden gemeldet, bleiben aber ohne erneute Assetprüfung und manuelle Freigabe deaktiviert. Eine feste Klassenanzahl existiert nicht; zwölf ist nur der Bestand von 0.5.2.
