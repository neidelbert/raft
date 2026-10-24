# Lernbuch: Was das Team aus Fehlern gelernt hat

Vor jedem Paket lesen. Debugger und Leiter tragen nach jedem Paket ein, was schiefging und wie man es künftig vermeidet.
Format: Datum · Wer fand es · Was passierte · **Regel für die Zukunft**

- 24.10.2026 · Debugger (Rollentest) · Joystick: Beim Loslassen wurde nur `x` zurückgesetzt, das Floß fuhr weiter.
  **Regel:** Beim Loslassen und bei `pointercancel` alle Eingabewerte zurücksetzen. Jeder Steuerungstest prüft, dass nach dem Loslassen Stillstand herrscht.
- 24.10.2026 · Techniker · `tests/buero-test.js` brach, als Lukas das echte Postfach abgearbeitet hatte. Der Test hing von Live-Daten ab.
  **Regel:** Tests nutzen feste Beispieldaten (`tests/buero-beispiel.json`), nie die echten Daten.
- 24.10.2026 · Programmierer · Das CDN ist in der Cloud-Umgebung gesperrt.
  **Regel:** In Tests Three.js per `page.route` lokal einbinden (`THREE_LOKAL`). Im Spiel bleibt die CDN-Adresse.
- 24.10.2026 · Leiter · Unter-Agents können keine weiteren Agents starten.
  **Regel:** Die Hauptsitzung arbeitet als Leiter und ruft alle Agents selbst auf.
- 24.10.2026 · Leiter · Die Pakete 02–06 wurden geplant, bevor die Ordnerstruktur feststand.
  **Regel:** Der Planer liest vor dem Planen die Ordnerstruktur im Skill und nennt in jedem Paket die Zieldateien.
