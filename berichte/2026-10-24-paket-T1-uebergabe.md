# Übergabe Paket T1 (Testpaket) – Programmierer an Leiter
Datum: 24.10.2026 · Status: **bereit zur Freigabe** (nicht „fertig“, Debugger-Test steht aus)

## 1. Was wurde gebaut?
- Ozean-Ebene mit einfachem, leicht bewegtem Wasser (Low-Poly-Fläche, 48 × 48 Segmente, Wellen aus zwei Sinuswellen). Die Fläche wandert mit dem Floß mit, der Ozean wirkt endlos.
- Würfel als Floß (1,6 m), schaukelt auf den Wellen, dreht sich weich in Fahrtrichtung.
- Virtueller Joystick links unten (Pointer-Events: Touch zuerst, Maus geht automatisch mit). Totzone, Knopf folgt dem Finger, Loslassen stellt auf null.
- Kamera in Vogelperspektive (schräg von oben), folgt dem Floß weich und bildraten-unabhängig.
- Alle Einstellwerte in `js/konfiguration.js`. Pixel-Ratio auf 2 begrenzt, Bewegung mit Delta-Zeit (Delta auf 0,1 s gedeckelt).
- Kleine Test-Schnittstelle `window.spiel` (Floß, Kamera, Eingabe) nur zum Auslesen.

## 2. Welche Dateien wurden geändert?
Alle neu, nur unter `tests/agenten/`:
- `prototyp/index.html` – Seite, Import-Map (`three@0.170.0` von cdn.jsdelivr.net), Joystick-HTML/CSS
- `prototyp/js/konfiguration.js` – alle Einstellwerte
- `prototyp/js/szene.js` – Renderer, Szene, Licht, Kamera-Objekt, Größenanpassung
- `prototyp/js/wasser.js` – Wasserfläche und Wellenhöhe
- `prototyp/js/floss.js` – Würfel-Floß, Bewegung
- `prototyp/js/kamera.js` – Kameraführung
- `prototyp/js/steuerung.js` – Joystick
- `prototyp/js/main.js` – Zusammenbau und Hauptschleife
- `prototyp-test.js` – automatischer Test (Playwright, iPhone 13, echte Touch-Ereignisse)

Kein Git-Commit (Vorgabe für den Rollentest). `PROJEKT.md` nicht angefasst.

## 3. Was soll der Debugger besonders prüfen?
- Auf echtem iPhone-Safari: Joystick nach oben ziehen → Floß fährt vom Bildschirm weg; Loslassen → stoppt. Getestet nur in Chromium mit iPhone-Emulation (CDN dort gesperrt, three.js lokal umgeleitet).
- Kein Scrollen/Zoomen der Seite beim Ziehen (touch-action, user-scalable=no).
- Flüssigkeit: Das Wasser wird pro Bild auf der CPU berechnet (rund 2.400 Punkte plus Normalen). Falls es auf älteren iPhones ruckelt, `segmente` in der Konfiguration senken oder später auf Shader umstellen (wäre Techniker-Thema).
- Zweiter Finger auf dem Joystick wird ignoriert, bis der erste loslässt.
- Wellen sind von oben eher dezent sichtbar (Spielgefühl: Lukas entscheidet).

Test: `node tests/agenten/prototyp-test.js` (optional `THREE_LOKAL=<pfad>` und `FOTO=<datei.png>`). Ergebnis am 24.10.2026: alle 8 Prüfungen bestanden (Pixel-Ratio 2, Floß fährt nach oben, keine Seitendrift, Kamera folgt, Loslassen stoppt, rechts ziehen fährt rechts, Bild hat Inhalt, keine Konsolenfehler).

## Fertig-Checkliste
- [x] Spiel startet ohne Fehler in der Konsole
- [x] Neue Funktion tut genau, was im Paket steht
- [x] Bisherige Funktionen laufen weiter (kein bestehender Code vorhanden)
- [x] Touch-Bedienung geprüft (iPhone-13-Emulation, echte Touch-Ereignisse)
- [x] Pixel-Ratio höchstens 2, Delta-Zeit statt Bildzählung
- [x] Keine unnötigen Dateien oder toter Code
- [x] Konfigurationswerte zentral abgelegt
