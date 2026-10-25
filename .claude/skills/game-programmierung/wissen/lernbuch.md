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
- 25.10.2026 · Horst · Stufe 2 (Touch): Mehrfinger-Test per CDP (`Input.dispatchTouchEvent`): Bei `touchEnd`/`touchCancel` stehen in `touchPoints` die Finger, die **abheben**, nicht die, die liegen bleiben. Außerdem gehört der Touch-Zustand zur CDP-Sitzung: `t.ziehe(…, { loslassen: false })` gibt seine Sitzung zurück, nur mit der lässt sich der Finger wieder lösen.
  **Regel:** Erst mit einem kleinen Versuch (Ereignisse mit `pointerId` mitschreiben) klären, was das Test-Werkzeug wirklich tut. Gehaltene Finger mit der zurückgegebenen Sitzung loslassen.
- 25.10.2026 · Horst · Stufe 2: Ein Knopf, der bei `pointerdown` auslöst, reagiert nicht auf `element.click()` oder die Tastatur.
  **Regel:** Zusätzlich `click` mit `e.detail === 0` auswerten (kein Finger, keine Maus), so gibt es keinen Doppelauslöser.
- 25.10.2026 · Horst · Stufe 3 (Viele Gegner): „Keine neuen Objekte“ reichte nicht. `Math.hypot` legt in V8 bei jedem Aufruf Speicher an; Kommazahlen in Objekt-Feldern (`gegner.x`) werden eingepackt, sobald irgendwo ein Objekt mit gleichen Feldnamen etwas anderes als eine Zahl speichert (im Test reichte es, Playwright zu laden); Kommazahlen an `drawImage` packt Chrome pro Aufruf ein. Zusammen bis 7 KB pro Schritt bei 240 Gegnern.
  **Regel:** In heißen Schleifen `Math.sqrt(x*x + y*y)` statt `Math.hypot`. Viele gleiche Dinge als feste `Float64Array`s (x, y, tempo …) statt Objekte. Zeichen-Koordinaten für viele Objekte auf ganze Punkte runden. Prüfen mit dem Heap-Profiler (`HeapProfiler.startSampling` mit `includeObjectsCollectedByMinorGC`), nicht mit dem Zählen von Speicherbereinigungen (das hängt davon ab, was sonst im Prozess läuft).
- 25.10.2026 · Horst · Stufe 3: Sanftes Auseinanderschieben allein verhindert kein Überlappen im Gedränge: Hintere Reihen drücken weiter, die Schübe heben sich in der Mitte auf.
  **Regel:** Im Gedränge das Nachlaufen bremsen (Summe der Überlappungen, nicht der Gesamtschub) und den kleinsten Abstand nach 20 s Simulation testen.
- 25.10.2026 · Horst · Stufe 4 (Zustände und Speichern): Das Spiel speicherte bei `visibilitychange`/`pagehide` immer, auch ohne Änderung. Beim Neuladen überschrieb es dadurch, was inzwischen in localStorage stand (kaputte Testdaten, in echt der Rekord eines zweiten Tabs).
  **Regel:** Nur schreiben, wenn sich der Stand geändert hat (Merker `ungespeichert`, bleibt bei Fehlschlag gesetzt). Der Test schreibt kaputte Daten per `evaluate` und lädt dann neu, so fällt so etwas auf.
- 25.10.2026 · Horst · Stufe 4: Der Speicher-Rest „der Figur“ aus Stufe 3 kam nicht von `drawImage`. Funktionen, die nur einmal pro Bild laufen, bleiben in Chrome lange im Interpreter, und dort legt jede Kommazahl-Rechnung 16 Byte an (gemessen: 18 KB pro Bild am Anfang, 320 Byte nach 12 s, die Gegner-Schleifen von Anfang an 0).
  **Regel:** Speicher erst nach einigen Sekunden Aufwärmen messen. Gegen 0 prüfen nur die Teile, die mit der Zahl der Objekte wachsen. Der Rest ist kein Leck (Safari packt Zahlen nie ein).
- 25.10.2026 · Horst · Stufe 4: Anzeige, die in `aktualisiere` gesetzt wird, zeigt nach einem Zustandswechsel ein Bild lang alte Werte.
  **Regel:** In `betreten()` jede Anzeige des neuen Zustands sofort setzen. „Tippen zum Starten“ fängt `pointerdown` am `window` in der Fangphase ab (`capture: true`, `stopPropagation`), die Tafel selbst hat `pointer-events: none`. Dann löst derselbe Finger weder Joystick noch Knopf aus, und jeder Klick-Weg (Touch, Maus, Playwright) funktioniert.
- 25.10.2026 · Horst · Stufe 5 (Fehlersuche Pilzsammler): Vier gemeldete Fehler, sechs Ursachen: Bewegung pro Bild; nur `pointerup` (kein `pointercancel`, kein Capture); `filter` nimmt alle Pilze in Reichweite, zählt aber 1; neue Pilze unter der Figur; `localStorage`/`JSON.parse` ohne `try/catch` ganz oben im Modul (nichts startet); `setItem` wirft in `schritt`, und weil `requestAnimationFrame` am Ende von `bild` steht, steht danach die ganze Schleife.
  **Regel:** Bei jeder Meldung erst einen Test schreiben, der gegen den alten Code rot ist (Test mit `ORDNER=…` umschaltbar), dann beheben. Eine Meldung kann mehrere Ursachen haben: nach dem ersten Fund weitersuchen. Ein Fehler in der Schleife darf sie nicht stoppen, also alles, was werfen kann (Speicher), abfangen.
- 25.10.2026 · Horst · Stufe 5: Der Test meldete die Vorlage plötzlich als fehlerfrei. Ein abgebrochener Testlauf (`| head` → EPIPE) hatte seinen Python-Server auf demselben Port nicht beendet, und der alte Server lieferte weiter den neuen Ordner aus. Außerdem war meine Tempo-Messung ungenau: Der Test-Browser hängt manchmal bis 170 ms (das Spiel zählt davon richtig nur 0,1 s), und die Messung startete außerhalb von `requestAnimationFrame`.
  **Regel:** Testausgaben nie mit `head` abschneiden, sondern in eine Datei umleiten. Wirkt ein Ergebnis zu gut, `pgrep -fa http.server` prüfen. Tempo in Bildern messen (rAF-Zeitstempel, jedes Bild wie das Spiel gedeckelt, Start im rAF).
- 25.10.2026 · Ausbilder · Ein Testlauf brach ab, sein Server lief auf dem Port weiter. Der nächste Test bekam dadurch einen fremden Ordner ausgeliefert und meldete falsch „bestanden“.
  **Regel:** `werkzeuge/test-hilfe.js` räumt jetzt auch bei Fehlern auf und bricht ab, wenn der Port schon belegt ist. Eine Gegenprobe gegen den alten Code muss rot sein, sonst taugt der Test nichts.
- 25.10.2026 · Ausbilder · Eine nachgestellte „langsame Bildrate“ war je nach Last des Testrechners mal 25, mal 7 Bilder pro Sekunde. Unter 10 Bildern pro Sekunde bremst die Deckelung (0,1 s) auch ein richtiges Spiel.
  **Regel:** Bei Tempo-Tests die tatsächlichen Bildabstände mitschreiben und die Deckelung herausrechnen.
