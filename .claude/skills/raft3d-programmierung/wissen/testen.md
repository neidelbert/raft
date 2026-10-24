# Testen: So prüfst du selbst, bevor du abgibst

Jedes Paket bringt einen automatischen Test mit. Er liegt unter `tests/spiel/` und hat einen kurzen, deutschen Namen (`floss-raster-test.js`).

## Vorlage
- `tests/spiel/start-test.js` (Start ohne Fehler) und `tests/agenten/prototyp-test.js` (Joystick mit echtem Touch). Kopieren und anpassen.
- Ablauf: lokaler Server (`python3 -m http.server <port>`), Playwright Chromium mit `devices['iPhone 13']`, SwiftShader-Argumente für WebGL ohne Grafikkarte.
- Three.js: In der Cloud-Umgebung ist das CDN gesperrt. Leite die URL per `page.route` auf die lokale Datei um (Variable `THREE_LOKAL`). Fehlt die Datei, hol sie mit `npm pack three@0.170.0` (npm geht) und entpacke `package/build/three.module.js`.
- Kein `playwright install`. `require('playwright')` funktioniert so.
- Freie Ports: Jeder Test hat einen eigenen Port (Büro 8799, Start 8766, Joystick 8767, Prototyp 8765). Neue Tests nehmen 8800 und folgende.

## Was jeder Test prüft
1. Keine Konsolenfehler (`console` vom Typ `error` und `pageerror`).
2. Jede Zeile aus „Fertig, wenn“ des Pakets, soweit automatisch prüfbar, über `window.spiel`.
3. Das Alte läuft weiter: alle Tests aus `tests/alle-tests.sh` laufen durch.
4. Ausgabe: je Prüfung `OK` oder `FEHLER`, am Ende „Alle Prüfungen bestanden.“, Rückgabewert 1 bei Fehlern.

## Touch richtig nachstellen
- `page.touchscreen.tap(x, y)` für Tippen. Zum Ziehen sende per CDP `Input.dispatchTouchEvent` (touchStart → touchMove in mehreren Schritten → touchEnd), siehe Prototyp-Test.
- Prüfe nach dem Loslassen **immer**, dass die Bewegung aufhört.

## Was der Test nicht kann
- Bildrate und Akku auf echtem iPhone, Safari-Eigenheiten, Sound. Schreib das im Übergabebericht unter „Was soll der Debugger besonders prüfen?“.
