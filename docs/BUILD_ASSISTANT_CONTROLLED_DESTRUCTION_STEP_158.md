# Kontrollierte Zerstörung – Schritt 158

Der Schadensrechner verarbeitet `Controlled Destruction` (`Kontrollierte Zerstörung`) jetzt aus dem gepinnten PoB2-Record `SupportControlledDestructionPlayer` vollständig als Treffereffekt.

- Schädigende Zauber erhalten 25 % mehr Trefferschaden.
- Die unterstützte Fertigkeit kann keine kritischen Treffer verursachen; der Erwartungswert verwendet exakt null Prozent kritische Trefferchance.
- Nativer Schaden über Zeit erhält keinen Trefferschadensmultiplikator.
- Angriffe und doppelte Einträge derselben Supportfamilie werden fail-closed blockiert.

Die Wirkung wird vor der allgemeinen Supportaggregation auf Trefferschadenskomponenten angewandt. Der Support wird anschließend als vollständig aufgelöst markiert. Modellversion ist `1.0.0`, Schadensrechner-Version `3.72.0`.

Quelle ist ausschließlich der lokal vorhandene, gepinnte PoB2-Commit `c5300ccdc5ef0ec384d4db263f09dcadac4ab7d0`, Datei `src/Data/Skills/sup_int.lua`. Dieser Schritt schließt eine konkrete Rechenlücke, belegt aber noch keine vollständige Gleichwertigkeit mit Path of Building 2.

Die fokussierte Prüfung bestand mit 73 Tests. Im Gesamtlauf bestanden 1.837 Tests direkt; zwei unter paralleler Last zeitüberschrittene Passivbaumtests bestanden anschließend seriell mit weiteren 197 Prüfungen. Die gesonderte reale Passivbaum-Performanceprüfung bestand ebenfalls.
