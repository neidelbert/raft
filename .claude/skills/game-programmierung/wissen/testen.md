# Testen

Jeder Auftrag bringt einen Test mit: `<spiel>/tests/<name>-test.js`, daneben die Test-Hilfe `test-hilfe.js` (beides legt `neues-spiel.js` an). Hat das Projekt einen Gesamttest, muss er den Test finden. Reine Regeln prüft derselbe Test ohne Browser (Funktion `regeln()` im Gerüst-Test) oder eine eigene Datei `<name>-regeln.js`.

## Vorlage
```js
// Test für <Spiel>: node <spiel>/tests/<name>-test.js (aus jedem Ordner)
const path = require('path');
const t = require('./test-hilfe.js');
const ORDNER = process.env.ORDNER ? path.resolve(process.env.ORDNER) : path.resolve(__dirname, '..');   // Gegenprobe: ORDNER=<kaputte Kopie>
(async () => {
  const lauf = await t.starte({ ordner: ORDNER, port: 9000, pfad: 'index.html?seed=42&test=1' });
  const { seite } = lauf;
  try {
    t.pruefe(await seite.evaluate(() => window.spiel.zustand) === 'titel', 'startet im Titel');
    // … Prüfungen aus „Fertig, wenn“
    await seite.screenshot({ path: process.env.FOTO || path.join(__dirname, 'fotos', '<name>.png') });   // im Spielordner, nicht im Temp
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
```
- `test-hilfe.js` (Werkzeug des Skills, Kopie im Spiel) startet Server und Chromium in iPhone-Ansicht (390 × 664 Punkte, Pixel-Ratio 3), leitet Three.js vom CDN auf eine lokale Kopie um (das CDN ist in der Cloud gesperrt), sammelt Konsolenfehler (`lauf.fehler`) und bietet `ziehe`, `tippe` und `bildrate`. `initSkript` läuft vor dem Spiel (z. B. localStorage sperren, AudioContext zählen).
- **Port je Spiel:** ein Zehnerblock ab 9000. `neues-spiel.js` wählt ohne `--port` den ersten Block, den kein Spiel im selben Ordner nutzt, und meldet ihn. Hat das Projekt eine Port-Liste, dort eintragen; sonst reicht die Meldung. Im Test mit `PORT=…` änderbar. Die Bausteine nutzen 8880–8889.
- **Bildschirmfoto:** Standard `<spiel>/tests/fotos/<name>.png` (mit `.gitignore`, kommt nicht ins Repo), anderer Ort mit `FOTO=…`. Nach jedem Lauf mit dem Read-Werkzeug öffnen.
- **`lies(seite, f, arg)`:** Ein Wert für die Seite geht nur als zweites Argument von `seite.evaluate` hinein (Node-Variablen gibt es dort nicht). Die Hilfsfunktion im Gerüst reicht `arg` weiter. Fehlt das, kommt `undefined` an, daraus wird NaN, und die Meldung ist kryptisch (z. B. `Input.dispatchTouchEvent: Invalid parameters`).
- `?seed=42` macht den Zufall gleich, damit der Test immer gleich abläuft. Feste Beispieldaten, nie echte, sich ändernde Daten.

## Was jeder Test prüft
1. Start ohne Konsolenfehler, `window.spiel.bereit`; ohne `?test=1` gibt es kein `spiel.test`.
2. Jede Zeile aus „Fertig, wenn“, über Werte aus `window.spiel` (nicht über Pixel).
3. Touch: `t.ziehe(seite, x1, y1, x2, y2, { halteMs })` bewegt, nach dem Loslassen herrscht Stillstand. Auch Abbruch (`touchCancel`), zweiter Finger, Tippen außerhalb des Felds.
4. Zustandswechsel (Titel → Spiel → Ende), neue Runde setzt alles zurück, Speichern (neu laden, Rekord ist noch da), kaputter Speicherstand und privater Modus.
5. Tab-Wechsel nachgestellt: `document.hidden` und `visibilityState` per `Object.defineProperty` überschreiben, `visibilitychange` auslösen; dann steht die Spielzeit, und nach der Rückkehr gibt es keinen Sprung (Weg in den ersten Bildern messen).
6. Bildschirmfoto: Horst sieht es sich mit dem Read-Werkzeug an. Stimmt das Bild?

## Muster: Figur zum Ziel laufen lassen
```js
const ziel = { x: muenze.x, y: muenze.y + BERUEHRUNG.hoehe };   // dort, wo die Figur steht, wenn sie berührt
const r = await t.laufeZu(seite, ziel, { position: () => ({ x: window.spiel.spieler.x, y: window.spiel.spieler.y }), tempo: SPIELER.tempo, naehe: BERUEHRUNG.radius / 2 });
t.pruefe(r.angekommen, `Figur am Ziel (${r.anlaeufe} Anläufe, Abstand ${r.abstand.toFixed(1)})`);
t.pruefe(await lies(seite, () => window.spiel.muenzen) >= vorher + 1, 'mindestens eine Münze mehr');   // nicht „genau 1“
```
- `t.laufeZu` (Test-Hilfe) setzt den Finger auf, schlägt in Zielrichtung aus, wartet in der Seite Bild für Bild, bis die Figur da ist, lässt los, misst nach und wiederholt (höchstens `anlaeufe`). Kein Halten nach Zeit: Bei langsamer Test-Grafik (3D etwa 9 Bilder/s) stimmt keine Haltezeit.
- **„Mindestens“ statt „genau“:** Auf dem Weg berührt die Figur oft mehr als das Ziel. Im Browser `>=` prüfen; genaue Zahlen prüft der Regel-Test ohne Browser.
- **Feste Orte statt Zufall:** Einsammeln, Treffer und Grenzfälle (knapp außerhalb, genau am Rand, zwei auf einmal) im Regel-Test mit fest gesetzten Orten prüfen. Zufällig verteilte Dinge stören sich gegenseitig (ein Nachbar liegt in Reichweite). Die Verteilung selbst prüft ein eigener Fall mit `?seed=…` (Abstand zum Start, im Feld, keine Überlappung).
- Für Browser-Fälle Dinge per Test-Hilfe (`window.spiel.test`, nur mit `?test=1`) an feste Orte legen, statt die Figur zu zufälligen Orten zu schicken.

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
- **Assets laden (Option `routen`):** verzögern (`await warte(ms); route.continue()`), fehlen lassen (`route.fulfill({ status: 404 })`), hängen lassen (`kontext.route(muster, () => {})`). Je einmal für Atlas, Sound, Modell und das Manifest selbst; die Seite muss in jedem Fall mit Ersatz laufen, nach höchstens der Zeitgrenze. Werte des Fortschritts in jedem Bild mitschreiben: nie kleiner, am Ende 1. Der Gerüst-Test macht alle Fälle vor (Sound: fehlt und hängt → Code-Klang statt Datei; 2D: Rahmen fehlt im Atlas → Ersatz-Figur).
- **Rahmen-Animation:** Tempo als Rahmenschritte pro Sekunde Spielzeit messen (`(neu − alt) mod Rahmenzahl`, Bildabstände auf 0,1 s gedeckelt). Spiegeln prüft ein `initSkript`, das `CanvasRenderingContext2D.prototype.scale` umhüllt und Aufrufe mit negativem x zählt (unabhängig vom Spielcode).
- **Ton:** `ton.bereit` prüfen; Sound-Dateien zählt ein `initSkript`, das `AudioBufferSourceNode.prototype.start` umhüllt (`ZAEHLE_PUFFER` im Gerüst-Test); gespielte Klänge zählt ein `initSkript`, das `AudioContext` und `createOscillator` umhüllt. Achtung: Beim ersten Tippen wird die Datei erst dekodiert, der Klang dieses Tippens ist der Code-Klang. Die Datei erst beim nächsten Klang prüfen.
- **Speicher (keine neuen Objekte):** mit dem Heap-Profiler messen (`HeapProfiler.startSampling` mit `includeObjectsCollectedByMinorGC`), nach Aufwärmen, nur die eigenen Dateien. Nicht Speicherbereinigungen zählen (hängt vom Rest des Prozesses ab). Eine Gegenprobe mit absichtlich neuen Objekten zeigt, dass die Messung wirkt. Beispiel: `bausteine/tests/hilfe.js` (`angelegterSpeicher`).
- **3D:** Zeichenaufrufe in jedem Bild mitschreiben (eigene `requestAnimationFrame`-Schleife, `renderer.info.render.calls`), das Höchste prüfen. Pixel-Ratio-Grenze direkt prüfbar, weil der iPhone 13 im Test 3 hat.
- **Nichts still überspringen:** Fehlt eine Datei, die ein Test braucht, ist das eine rote Prüfung, kein `if (fs.existsSync(…))`. Ein übersprungener Test fällt niemandem auf (Lernbuch Stufe 10).
- **Pfade:** Tests übergeben der Test-Hilfe absolute Pfade (`path.resolve(__dirname, '..')`), dann laufen sie aus jedem Ordner und als Kopie.
- **Vorbild:** der Test jedes Gerüsts aus `neues-spiel.js` (Regeln ohne Browser, Ladebildschirm, Touch, Abbruch, Tab-Wechsel, Speicher, fehlende und hängende Assets, 3D-Zeichenaufrufe).
- **Testausgaben nie mit `| head` abschneiden**, sondern in eine Datei umleiten: Ein abgebrochener Lauf lässt seinen Server laufen. Wirkt ein Ergebnis zu gut, `pgrep -fa http.server` prüfen. `test-hilfe.js` bricht ab, wenn der Port belegt ist.

## Reine Rechenregeln ohne Browser
Was keine Grafik braucht (Schaden, Punkte, Kollision, Zufall, Bewegung), steht in eigenen Modulen ohne DOM und wird mit `node` geprüft: `import(pathToFileURL(datei))` aus einem CommonJS-Test. Das geht schnell und findet Logikfehler genau. Vorbild: die Tests in `bausteine/tests/` (Uhr, Speicher und AudioContext nachgebaut).

## Grenzen
Der Test läuft in Chromium mit Software-Grafik. Nicht prüfbar sind die echte Bildrate auf dem iPhone, Safari-Eigenheiten (Gesten, `touchend` als Ton-Erlaubnis, Stummschalter), Ton und das Gefühl. Das kommt in den Bericht unter „Was der Tester am echten iPhone prüfen soll“.
