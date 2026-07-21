# Browser-Laufzeitarchitektur der realen Passive-Analyse (5J)

## Entscheidung und Varianten

5J schafft ausschließlich eine UI-neutrale Browser-Laufzeitgrenze. Untersucht wurden: A alles im Hauptthread (einfach, aber bis etwa 1,9 s Context-Blockierung); B Graph/Context im Hauptthread und Analyse im Worker (Blockierung und große Clone-Kosten bleiben); C lokaler Baum im Worker, dort einmal Graph/Context bauen und halten; D Worker lädt JSON selbst (zusätzlicher Fetch-/404-Pfad). Gewählt ist C: Vite bündelt den gepinnten lokalen Baum in einen Module-Worker. Dadurch verlassen Baum, Graph und Context den Worker nicht, und es gibt keinen Runtimezugriff auf GitHub/GGG.

Der sichtbare Baum hält für seine bestehende Darstellung weiterhin eigene Daten. Diese bewusste Doppelhaltung zwischen UI-Baum und Analyseworker vermeidet eine große `postMessage`-Kopie und vermischt Renderer- und Engine-Lebenszyklen nicht.

## Grenze und öffentliche API

`src/runtime/real-passive-worker/` enthält genau einen Dispatcher und `createRealPassiveWorkerClient`. Die API lautet `initialize`, `analyze`, `cancel`, `getState`, `subscribe`, `dispose`. React startet sie noch nicht. Engine, Orchestrator, Targeting, Pathfinder und Planner enthalten keine Worker-API.

Vite erzeugt `assets/realPassiveWorker-<hash>.js` als lokalen Module-Worker unter `/poe2-equipment-build-planner/`. Kein CDN, Blob, Service Worker, Storage oder externer Worker wird verwendet.

## Protokoll und Zustände

Protokollversion: `1.0.0`. Jede Nachricht besitzt `protocolVersion`, `requestId`, `messageType`, `payload`.

Client → Worker: `initialize`, `analyze`, `cancel`, `dispose`, `status`. Worker → Client: `initialization-progress`, `ready`, `analysis-progress`, `result`, `cancelled`, `error`, `disposed`, `status`. Unbekannte Typen und Versionen werden strukturiert abgelehnt; es gibt keine dynamische Funktionsausführung.

Workerzustände: `idle → initializing → ready → analyzing → ready`; außerdem `cancelling`, `failed`, `disposed`. Clientzustände ergänzen `uninitialized`, `completed`, `cancelled`. Es gibt genau eine aktive Analyse und keine Queue. Eine zweite Anfrage wird abgelehnt. Request-IDs ordnen Ergebnisse zu; Nachrichten einer terminierten Worker-Generation werden verworfen.

## Initialisierung und Lebenszyklus

Initialisierung prüft Source-Version, erwartete Baumidentität, Pipelineversion und Contextformat, baut Graph und Prepared Context einmal und speichert sie im Worker. Gleiche Identität/Version liefert `ready` mit `reused:true`; andere Identität wird nicht vermischt. Fehler räumen vorbereitete Objekte auf. `dispose` entfernt Baumlaufzeitreferenzen, Graph, Context und Requeststatus und beendet den Workerclient.

Der Worker wird erst durch einen künftigen Aufrufer erstellt, nicht beim Appstart. Profil-/Klassenwechsel nutzt denselben Worker. Reload/Tabschluss beendet den Browserkontext. Ein Saisonwechsel verlangt neue gepinnte Daten und explizite Initialisierung; automatische Updates existieren nicht.

## Analyse, Compact und Determinismus

Der Dispatcher ruft ausschließlich `analyzeBuild` auf und ergänzt dessen bestehende 5I-Grenze um den gehaltenen Baum, Graph und Context. Budget bleibt explizit. Workeranalysen erzwingen `compact`; Full wird nicht übertragen. Direkter und Workerpfad verwenden denselben Orchestrator, Plan, Status und fachlichen Pipelinehash. Laufzeit-/Workerinformationen liegen außerhalb des Hashs.

## Fortschritt

Initialisierung meldet höchstens fünf Stufen: `loading-tree`, `validating-tree`, `building-graph`, `preparing-targeting-context`, `ready`. Analyse meldet `validating-request`, `running-orchestrator`, `validating-result`, `completed`. Es gibt keine Prozentwerte und kein Ereignis pro Knoten. Targeting/Planning werden nicht fälschlich als getrennt beobachtbar gemeldet, weil der bestehende synchrone Orchestrator dafür keine Hooks besitzt.

## Abbruch, Fehler und Wiederherstellung

Vor Ausführungsbeginn kann der Dispatcher kooperativ abbrechen. Während der synchronen Engineberechnung kann der Worker keine neue Cancel-Nachricht verarbeiten. Der Client terminiert deshalb den aktiven Worker hart, verwirft jedes Resultat und meldet `cancelled`, `reusable:false`; Graph/Context gehen verloren und Neuinitialisierung ist erforderlich. Es wird kein unvollständiges Fachresultat ausgegeben.

Fehler besitzen Code, Severity, Source, Stage, optionale Request-/Node-ID, Message, Details, Recoverability und Workerstate. `error`, `messageerror` und Timeout lösen alle offenen Promises. Es gibt keinen automatischen Neustart; der Aufrufer darf einmal kontrolliert neu initialisieren. Protokoll-/Disposed-Fehler sind nicht wiederverwendbar, kontrollierte Requestfehler grundsätzlich wiederholbar.

## Structured Clone und Größen

Buildrequest, Modifier, Baumquellobjekt und Compact-Ergebnis bestehen aus clonefähigen Daten. `PassiveGraph` enthält Maps/Sets, der Prepared Context eine Map; beide sind grundsätzlich structured-clone-fähig, bleiben aber bewusst im Worker. Es gibt keine Funktionen oder bekannten Zyklen. Die Initialisierungsnachricht enthält nur Versionen/Hashes; die Analyse überträgt Profil-/Kandidateninput, nicht Baum/Graph/Context. Compact liegt in der 5I.1-Messung bei etwa 718 KB. Der gebaute Worker ist etwa 4,74 MB beziehungsweise 592 KB gzip.

## Performance und Hauptthreadwirkung

Die fachliche Workerzeit entspricht weiterhin ungefähr Context-Aufbau 1,87 s einmalig und Pipeline-Median 414 ms bei Wiederverwendung. Diese Arbeit läuft im Worker statt auf dem Hauptthread. Ein realer lokaler Pages-Browser-Smoke-Test initialisierte den gebauten Module-Worker in 1.893,60 ms, meldete alle fünf Initialisierungsstufen, 5.150 Knoten und 6.067 Verbindungen. Währenddessen liefen 189 Hauptthread-Timer-Ticks; die größte beobachtete 10-ms-Timerdrift betrug 1,30 ms. Das belegt die Auslagerung in dieser Desktopmessung, nicht allgemeine Ruckelfreiheit. Browser-Analysezeiten entsprechen weiterhin den Enginewerten und wurden mangels produktiver UI-Anfrage nicht separat im Browser behauptet. Die physische iPhone-Eignung wurde nicht geprüft.

## Mobile Risiken und Grenzen

iOS Safari unterstützt Module Worker und structured clone in aktuellen Versionen, wurde hier aber nicht physisch geprüft. Speicherknappheit, Hintergrundwechsel, Tab-/Seitenschließen oder Betriebssystemdruck können den Worker beenden; dann gehen Graph und Context verloren. Doppelte Baumhaltung von Renderer und Worker bleibt ein Mobilrisiko. Keine Ruckelfreiheit, konstante Laufzeit oder Speichersicherheit wird behauptet.

Noch keine UI-Anbindung, Ladeanzeige, Pfadvisualisierung, Knotenaktivierung oder Budgetableitung. Aufgabe 5K wurde nicht begonnen. Nächster zulässiger Schritt ist ein separater UI-Adapterauftrag mit physischer Mobilprüfung.
