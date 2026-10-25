# Lernbuch

Vor jeder Aufgabe lesen. Nach jeder Aufgabe eintragen: Datum · Wer · Was passierte · **Regel für die Zukunft**

## Aus früheren Projekten (Letzte Nacht, Raft 3D)
- Joystick: Beim Loslassen wurde nur `x` zurückgesetzt, die Figur lief weiter.
  **Regel:** Loslassen und `pointercancel` setzen alle Eingabewerte zurück. Jeder Steuerungstest prüft den Stillstand danach.
- Ein Test hing von echten Daten ab und brach, als sich die Daten änderten.
  **Regel:** Tests nutzen feste Beispieldaten und `?seed=42`.
- Das CDN ist in der Cloud-Umgebung gesperrt.
  **Regel:** Tests über `werkzeuge/test-hilfe.js` starten. Sie leitet Three.js lokal um. Im Spiel bleibt die CDN-Adresse.
- Wellen mit Normalen-Neuberechnung pro Bild kosten unnötig Rechenzeit.
  **Regel:** `flatShading: true`, dann ist keine Neuberechnung nötig.
- Letzte Nacht: Zahlen in der Logik machten das Ausbalancieren mühsam.
  **Regel:** Jede Zahl gehört nach `config/` und hat einen Kommentar.
- Letzte Nacht: Bis zu 240 Gegner auf dem iPhone gehen nur mit Pool und ohne neue Objekte pro Bild.
  **Regel:** Pool und Gitter von Anfang an einplanen (`canvas-2d.md`).

## Aus der Ausbildung
(Horst trägt hier nach jeder Übung ein, was er gelernt hat.)
- 25.10.2026 · Horst · Stufe 1 (Ball): Nach der Rückkehr in den Tab kam noch ein Bild mit altem `requestAnimationFrame`-Zeitstempel (älter als das `performance.now()` beim Zurücksetzen). `letzte = jetzt` setzte die Zeit zurück, das nächste Bild holte die ganze Pause nach (Sprung bis zur Deckelung).
  **Regel:** In der Hauptschleife `dt = max(0, jetzt - letzte)` und `letzte = Math.max(letzte, jetzt)`. Der Tab-Test misst den Weg in den ersten Bildern nach der Rückkehr.
- 25.10.2026 · Horst · Stufe 1: Zwei Fehlschläge lagen im eigenen Test, nicht im Spiel (feste 844 Punkte Höhe, obwohl der Test-Browser 664 hat; `vx = vy = tempo` ist schräg √2-mal zu schnell).
  **Regel:** Testwerte aus `window.spiel` und config ableiten, nie Gerätemaße fest eintragen. Bei rotem Test erst fragen: Ist der Test richtig?
- 25.10.2026 · Horst · Stufe 1: Ein langsames Gerät lässt sich im Test nachstellen, indem eine eigene `requestAnimationFrame`-Schleife jedes Bild 40 ms beschäftigt (≈ 20 Bilder/s). Zusätzlich prüfen, dass die Bremse wirkt (weniger Bilder).
  **Regel:** „Egal wie schnell das Gerät zeichnet“ immer mit normaler und gebremster Bildrate testen.
