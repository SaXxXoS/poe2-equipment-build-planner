# Quellenverzeichnis zur Datenfreigabe

## Ergänzung Aufgabe 5C

- Offizielles Repository: <https://github.com/grindinggear/poe2-skilltree-export>
- Release 0.5.2 „Path of Exile 2: Runes of Aldur“: <https://github.com/grindinggear/poe2-skilltree-export/releases/tag/0.5.2>
- Geprüfter Commit: <https://github.com/grindinggear/poe2-skilltree-export/commit/1e9eb2d8c1946398c3aaaacfbaead5c75c0d1fa6>
- Offizielle GGG-Datendokumentation: <https://www.pathofexile.com/developer/docs/data>

Am 20. Juli 2026 wurden Tag und Commit über die GitHub-API verifiziert und nur die commit-gepinnte `data.json` abgerufen. SHA-256: `f83c94ce7b09f2bfc5b3b1d63523c2ab3d2582d0e964f6aeec34b8b0390abcfe`. Das Schema enthält englische Texte und Grafikreferenzen, aber keine Locale-Auswahl oder eindeutig markierten Cluster-Sockel. Grafikreferenzen werden nicht exportiert.

Prüfdatum: 20. Juli 2026. Kurzzusammenfassungen, keine Vollkopien. Abruf diente ausschließlich der Dokumentationsprüfung; es wurden keine Spieldatensätze, Medien oder API-Nutzdaten geladen. Dies ist keine Rechtsberatung.

| Quelle | Betreiber | Dokument/URL | Geprüfte Frage | Ergebnis und Grenze |
|---|---|---|---|---|
| Path of Exile Developer Docs | Grinding Gear Games (GGG) | [Overview](https://www.pathofexile.com/developer/docs) | unterstützte Ressourcen, Automatisierung, User-Agent, Notice, Stabilität, Rate Limits | Nur Referenz-/Export-Ressourcen werden unterstützt; API-Nutzung verlangt identifizierbaren User-Agent, dynamische Rate-Limit-Auswertung und bei öffentlichen Apps einen Nichtzugehörigkeitshinweis. Neue Anwendungen werden laut Seite aktuell nicht bearbeitet. Keine pauschale statische Datennutzung. |
| API Reference | GGG | [Reference](https://www.pathofexile.com/developer/docs/reference) | PoE2-Abdeckung, Formate, Authentifizierung | Dokumentierte HTTPS-/JSON-Endpunkte, häufig OAuth; PoE2-Unterstützung ist begrenzt und deckt die benötigten statischen Kategorien nicht vollständig ab. |
| Authorization | GGG | [OAuth 2.1](https://www.pathofexile.com/developer/docs/authorization) | Authentifizierung und Clientarten | Fast alle APIs benötigen Autorisierung; öffentliche und vertrauliche Clients haben unterschiedliche Möglichkeiten und Laufzeiten. Keine Importfreigabe für statische Spieldaten. |
| Data Exports | GGG | [PoE2 Data Exports](https://www.pathofexile.com/developer/docs/data) | offizielle statische PoE2-Daten | GGG erklärt den Passivbaum ausdrücklich zur einzigen Ausnahme außerhalb unterstützter APIs. Das belegt Bereitstellung, aber nicht eindeutig öffentliche Weiterverteilung. |
| Terms of Use | GGG | [Terms](https://www.pathofexile.com/legal/terms-of-use-and-privacy-policy) | Rechte, Speicherung, Automatisierung, Extraktion, kommerzielle Nutzung | GGG beansprucht Rechte an Texten, Namen, Bildern und Spielelementen; Lizenz ist grundsätzlich persönlich/nichtkommerziell. Ohne vorherige schriftliche Zustimmung sind u. a. Speicherung/Verbreitung außerhalb der Lizenz, automatisierte Software, Extraktionswerkzeuge und Reverse Engineering beschränkt. Konkrete dokumentierte APIs/Exporte sind zusätzlich nach ihren Richtlinien zu beurteilen. |
| PoE2 Passive Skill Tree Export | GGG | [Repository](https://github.com/grindinggear/poe2-skilltree-export) | Format, Versionen, Lizenz, Medien | Öffentliches `data.json`, Assets und Releases; keine separate LICENSE-Datei oder ausdrückliche Repository-Weiterverteilungserlaubnis sichtbar. Daten und Medien bleiben für dieses öffentliche Repository blockiert. |
| RePoE | repoe-fork, Community | [Repository](https://github.com/repoe-fork/repoe) | Abdeckung, Format, Stabilität, Eigentum | JSON für Stats, Mods, Gems, Basistypen, Tags, Klassen, Cluster und eingeschränkte Uniques; Formate können jederzeit wechseln. README nennt GGG als Rechteinhaber sämtlicher Datendateien. Werkzeuglizenz ist keine Datenlizenz. |
| RePoE hosted exports | repoe-fork, Community | [Exportindex](https://repoe-fork.github.io/) | PoE2-Verfügbarkeit und Zugriff | Öffentliche PoE2-JSON-Exporte und Schemas sind technisch gut maschinenlesbar; sie werden aus Spieldateien erzeugt. Abrufbarkeit ersetzt keine GGG-Nutzungs-/Weiterverteilungsfreigabe. |
| PoE2DB | Community/PoE2DB | [Startseite](https://poe2db.tw/), [Disclaimer](https://poe2db.tw/pt/General_disclaimer) | Lokalisierung, Lizenz, Rechte, Scraping/API | Breite lokalisierte HTML-Daten. Wiki-Inhalte stehen „unless otherwise noted“ unter CC BY-NC-SA 3.0; dieselbe Seite erkennt GGG-Rechte an Spielegrafiken, Texten und Spielelementen an. Umfang für extrahierte Tabellen, automatisierten Abruf, Roh-/Ableitungsdaten und Medien ist nicht eindeutig. |
| GitHub-Lizenzhinweis | GitHub | [Licensing a repository](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository) | Bedeutung fehlender Repository-Lizenz | Ein öffentliches Repository erlaubt Betrachten/Forken, ist ohne Lizenz aber nicht automatisch frei nutz-, änder- oder verteilbar. Dient nur als Interpretationshilfe für den fehlenden Lizenztext des GGG-Exports. |

## Erforderliche externe Klärung

Vor einem echten Import wird eine schriftliche, quellen- und kategorienbezogene Bestätigung benötigt, die mindestens automatisierten Abruf, lokale Speicherung, normalisierte/abgeleitete Speicherung, Veröffentlichung im öffentlichen Repository/Pages-Artefakt, Attribution, kommerzielle Einordnung und Mediennutzung beantwortet. Für GGG ist der in den Terms genannte Supportkanal der naheliegende Klärungsweg; dieses Projekt hat keine Anfrage versendet.
