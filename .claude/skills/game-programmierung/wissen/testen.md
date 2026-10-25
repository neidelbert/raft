# Testen

Jeder Auftrag bringt einen Test mit: `tests/<spiel>/<spiel>-test.js`. `bash tests/alle-tests.sh` findet ihn automatisch. Reine Regeln zusätzlich ohne Browser (`tests/<spiel>/<spiel>-regeln.js`, vom Haupttest aufgerufen oder eigenständig).

## Vorlage
```js
// Test für <Spiel>: node tests/<spiel>/<spiel>-test.js
const t = require('../../werkzeuge/test-hilfe.js');
const ORDNER = process.env.ORDNER || 'spiele/<spiel>';   // Gegenprobe: ORDNER=<kaputte Kopie>
(async () => {
  const lauf = await t.starte({ ordner: ORDNER, port: 9000, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  try {
    t.pruefe(await seite.evaluate(() => window.spiel.zustand) === 'titel', 'startet im Titel');
    // … Prüfungen aus „Fertig, wenn“
    await seite.screenshot({ path: process.env.FOTO || '/tmp/<spiel>.png' });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
```
- `werkzeuge/test-hilfe.js` startet Server und Chromium in iPhone-Ansicht (390 × 664 Punkte, Pixel-Ratio 3), leitet Three.js vom CDN auf eine lokale Kopie um (das CDN ist in der Cloud gesperrt), sammelt Konsolenfehler (`lauf.fehler`) und bietet `ziehe`, `tippe` und `bildrate`. `initSkript` läuft vor dem Spiel (z. B. localStorage sperren, AudioContext zählen).
- **Port je Spiel:** ein Zehnerblock ab 9000, eingetragen in `TEAM.md` unter „Ports“. Die Bausteine nutzen 8880–8889.
- `?seed=42` macht den Zufall gleich, damit der Test immer gleich abläuft. Feste Beispieldaten, nie echte, sich ändernde Daten.

## Was jeder Test prüft
1. Start ohne Konsolenfehler, `window.spiel.bereit`; ohne `?test=1` gibt es kein `spiel.test`.
2. Jede Zeile aus „Fertig, wenn“, über Werte aus `window.spiel` (nicht über Pixel).
3. Touch: `t.ziehe(seite, x1, y1, x2, y2, { halteMs })` bewegt, nach dem Loslassen herrscht Stillstand. Auch Abbruch (`touchCancel`), zweiter Finger, Tippen außerhalb des Felds.
4. Zustandswechsel (Titel → Spiel → Ende), neue Runde setzt alles zurück, Speichern (neu laden, Rekord ist noch da), kaputter Speicherstand und privater Modus.
5. Tab-Wechsel nachgestellt: `document.hidden` und `visibilityState` per `Object.defineProperty` überschreiben, `visibilitychange` auslösen; dann steht die Spielzeit, und nach der Rückkehr gibt es keinen Sprung (Weg in den ersten Bildern messen).
6. Bildschirmfoto: Horst sieht es sich mit dem Read-Werkzeug an. Stimmt das Bild?

## Gute Tests (Regeln aus der Ausbildung)
- **Testwerte ableiten, nicht eintragen:** Bildschirmgröße, Tempo und Grenzen aus `window.spiel` und `config/` lesen. Der Test-Browser ist 664 Punkte hoch, nicht 844.
- **Ist ein Test rot, erst den Test prüfen** (Rechenfehler im Test, falsche Annahme über das Werkzeug), dann den Code.
- **Gegenprobe:** Den Test gegen eine Kopie mit absichtlichem Fehler laufen lassen (`ORDNER=…`), am besten mehrere Fehler (Richtung, Pixel-Ratio, Loslassen, Speicher). Bleibt er grün, taugt er nichts. Bei Fehlermeldungen von Lukas: erst ein Test, der gegen den alten Code rot ist, dann beheben.
- **Jeden Sicherungsweg einzeln prüfen:** Gibt es zwei Wege zum selben Ziel (z. B. `pointercancel` und `lostpointercapture` lösen den Joystick), verdeckt einer das Fehlen des anderen. Einzeln per `dispatchEvent(new PointerEvent(art, { pointerId }))` nachstellen.
- **Rot statt Absturz:** Schleifen im Test begrenzen; ist eine Grundprüfung rot, früh `ergebnis()` aufrufen, statt in kaputtem Code endlos weiterzurechnen.
- **Tempo:** im Browser nur die Richtung mit kleiner Grenze prüfen; das genaue Tempo ohne Browser in der Regel-Funktion. Muss es doch im Browser sein: in `requestAnimationFrame` starten, die Bildabstände mitschreiben und die Deckelung (0,1 s) herausrechnen. Der Test-Browser hängt manchmal bis 170 ms.
- **Langsames Gerät nachstellen:** eigene `requestAnimationFrame`-Schleife, die jedes Bild 40 ms beschäftigt; prüfen, dass die Bremse wirkt (weniger Bilder). Unter 10 Bildern/s bremst die Deckelung auch ein richtiges Spiel.
- **Mehrere Finger per CDP** (`Input.dispatchTouchEvent`): bei `touchStart`/`touchMove` alle liegenden Finger angeben, bei `touchEnd`/`touchCancel` nur die abhebenden. Gehaltene Finger (`t.ziehe(…, { loslassen: false })`) mit der zurückgegebenen Sitzung loslassen. Unklar, was das Werkzeug tut? Erst ein kleiner Versuch, der Ereignisse mit `pointerId` mitschreibt.
- **Fehlende Bilder** auf zwei Wegen: Datei weg (nur die Browser-Zeile „Failed to load resource“ erlaubt, kein `pageerror`) und Eintrag aus `grafik.json` gestrichen (gar kein Fehler).
- **Ton:** `ton.bereit` prüfen; gespielte Klänge zählt ein `initSkript`, das `AudioContext` und `createOscillator` umhüllt.
- **Speicher (keine neuen Objekte):** mit dem Heap-Profiler messen (`HeapProfiler.startSampling` mit `includeObjectsCollectedByMinorGC`), nach Aufwärmen, nur die eigenen Dateien. Nicht Speicherbereinigungen zählen (hängt vom Rest des Prozesses ab). Eine Gegenprobe mit absichtlich neuen Objekten zeigt, dass die Messung wirkt. Beispiel: `bausteine/tests/hilfe.js` (`angelegterSpeicher`).
- **3D:** Zeichenaufrufe in jedem Bild mitschreiben (eigene `requestAnimationFrame`-Schleife, `renderer.info.render.calls`), das Höchste prüfen. Pixel-Ratio-Grenze direkt prüfbar, weil der iPhone 13 im Test 3 hat.
- **Testausgaben nie mit `| head` abschneiden**, sondern in eine Datei umleiten: Ein abgebrochener Lauf lässt seinen Server laufen. Wirkt ein Ergebnis zu gut, `pgrep -fa http.server` prüfen. `test-hilfe.js` bricht ab, wenn der Port belegt ist.

## Reine Rechenregeln ohne Browser
Was keine Grafik braucht (Schaden, Punkte, Kollision, Zufall, Bewegung), steht in eigenen Modulen ohne DOM und wird mit `node` geprüft: `import(pathToFileURL(datei))` aus einem CommonJS-Test. Das geht schnell und findet Logikfehler genau. Vorbild: die Tests in `bausteine/tests/` (Uhr, Speicher und AudioContext nachgebaut).

## Grenzen
Der Test läuft in Chromium mit Software-Grafik. Nicht prüfbar sind die echte Bildrate auf dem iPhone, Safari-Eigenheiten (Gesten, `touchend` als Ton-Erlaubnis, Stummschalter), Ton und das Gefühl. Das kommt in den Bericht unter „Was der Tester am echten iPhone prüfen soll“.
