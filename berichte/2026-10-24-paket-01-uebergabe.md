# Übergabe Paket 01 (Mini-Prototyp) – Programmierer an Leiter
Datum: 24.10.2026 · Status: **bereit zur Freigabe** (nicht „fertig“, Debugger-Test steht aus)

## 1. Was wurde gebaut?
- Wasserfläche (160 m, 48 × 48 Segmente, zwei Sinuswellen), wandert mit dem Floß mit und wirkt endlos.
- Würfel als Floß (1,6 m), wippt auf den Wellen, schaukelt leicht und dreht sich weich zur Fahrtrichtung.
- Joystick links unten, aus dem Prototyp übernommen (Loslassen und `pointercancel` setzen x und y auf 0).
- Kamera in Vogelperspektive, folgt weich und bildratenunabhängig.
- Hauptschleife mit Delta-Zeit (gedeckelt auf `LEISTUNG.deltaMax`), Pause bei Tab-Wechsel, Pixel-Ratio über `LEISTUNG.pixelRatioMax`, 2 Lichter, keine Schatten.
- `window.spiel`: `bereit`, `renderer`, `szene`, `kamera`, `floss`, `eingabe`, dazu `zeit` (nur lesen).
- Startwerte wie im Paket, jeweils mit „Wert für Lukas zum Testen“ kommentiert.

Abweichungen vom Prototyp (Grund):
- Wasser: kein `computeVertexNormals` mehr pro Bild. `flatShading` rechnet die Flächen im Shader, das spart Rechenzeit auf dem iPhone.
- Die festen Zahlen der Wellen- und Schaukel-Formeln (0,8 / 1,3 / 1,7) stehen jetzt in der Konfiguration (`zweiteWelleLaenge`, `zweiteWelleTempo`, `schaukelTaktX/Z`).
- `floss` gibt `gruppe` (Muster 1) und `position` zurück. Das Floß bekommt die Eingabe beim Erstellen, damit alle Teile `aktualisiere(dt, zeit)` gleich aufrufen.

## 2. Welche Dateien wurden geändert?
Geändert: `spiel/index.html` (Joystick-Elemente), `spiel/stil.css` (Joystick, `100dvh`), `spiel/js/main.js`.
Neu: `spiel/js/kern/bildschirm.js`, `spiel/js/kern/kamera.js`, `spiel/js/steuerung/joystick.js`, `spiel/js/welt/wasser.js`, `spiel/js/floss/floss.js`, `spiel/js/config/welt.js`, `spiel/js/config/floss.js`, `spiel/js/config/kamera.js`, `spiel/js/config/steuerung.js`, `tests/spiel/mini-prototyp-test.js` (Port 8800, wird von `tests/alle-tests.sh` automatisch erfasst, Laufzeit etwa 65 s).
`tests/agenten/prototyp/` ist unverändert.

Test am 24.10.2026: `node tests/spiel/mini-prototyp-test.js` mit 31 von 31 Prüfungen bestanden (Strecke 4,77 m in 1,12 s bei Soll 4,5 m, 2 Zeichenaufrufe, 4.620 Dreiecke, Pixel-Ratio 2, keine Fehler nach 60 s). `bash tests/alle-tests.sh` meldet „Alle Tests bestanden.“

## 3. Was soll der Debugger besonders prüfen?
- Am echten iPhone in Safari: Ruckelt etwas, scrollt oder zoomt die Seite beim Ziehen? Geprüft wurde nur in Chromium mit iPhone-13-Emulation, mit lokalem Three.js, weil das CDN gesperrt ist.
- Wellen sind von oben nur schwach zu sehen (Fläche fast einfarbig). Wie stark sie wirken sollen, entscheidet Lukas beim Spielgefühl.
- Ob Flat-Shading ohne Normalen auf iPhone-Safari genauso aussieht wie in Chromium.
- Joystick-Abstand zum Home-Balken (`safe-area-inset-bottom`) im Querformat und im Vollbild vom Home-Bildschirm.
- Ob die Bildrate am Gerät bei 60 liegt (der Test kann das nicht messen).

## Fertig-Checkliste
- [x] Spiel startet ohne Fehler in der Konsole (auch nach 60 s)
- [x] Neue Funktion tut genau, was im Paket steht
- [x] Bisherige Funktionen laufen weiter (alle Tests grün)
- [x] Touch-Bedienung geprüft (iPhone-13-Emulation, echte Touch-Ereignisse und `touchCancel`)
- [x] Pixel-Ratio höchstens 2, Delta-Zeit statt Bildzählung
- [x] Keine unnötigen Dateien oder toter Code
- [x] Konfigurationswerte zentral abgelegt (Test prüft, dass die Logik-Dateien keine Einstellzahlen enthalten)
