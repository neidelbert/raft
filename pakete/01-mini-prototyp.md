# Paket 01: Mini-Prototyp im Spiel-Gerüst
Ziel: Im Gerüst `spiel/` entsteht eine Wasserfläche mit einem Würfel als Floß, das man mit dem Joystick links steuert und dem die Kamera in Vogelperspektive folgt.

Gehört dazu:
- Wasserfläche, einfach und leicht bewegt (Wellen), wenig Polygone
- Würfel als Floß, wippt leicht auf den Wellen, dreht sich zur Fahrtrichtung
- Virtueller Joystick links unten (Touch zuerst, Maus als Zusatz), **übernommen** aus `tests/agenten/prototyp/js/steuerung.js` samt Reparatur aus dem Lernbuch (Loslassen und `pointercancel` setzen x und y zurück), nicht neu erfunden
- Kamera in Vogelperspektive, folgt dem Floß weich
- Hauptschleife mit Delta-Zeit, begrenzt auf `LEISTUNG.deltaMax`; Pixel-Ratio über `LEISTUNG.pixelRatioMax`
- Höchstens 2 Lichter, keine Schatten (laut `spiel/js/config/leistung.js`)
- Test-Schnittstelle `window.spiel` erweitert: `bereit`, `renderer`, `szene`, `kamera` bleiben, dazu `floss` und `eingabe`
- Zieldateien (Ordner entstehen mit ihrer ersten Datei):
  - `spiel/index.html` – Joystick-Elemente ergänzen (Import-Map `three@0.170.0` bleibt)
  - `spiel/stil.css` – Joystick-Aussehen (mit Abstand zu `safe-area-inset`)
  - `spiel/js/main.js` – Start und Hauptschleife, verbindet die Module
  - `spiel/js/kern/bildschirm.js` – Renderer, Szene, Licht, Größenänderung
  - `spiel/js/kern/kamera.js` – Kameraführung Vogelperspektive
  - `spiel/js/steuerung/joystick.js` – Joystick aus dem Prototyp
  - `spiel/js/welt/wasser.js` – Wasserfläche und Wellen
  - `spiel/js/floss/floss.js` – Würfel-Floß (wird in Paket 02 durch das Raster ersetzt)
  - `spiel/js/config/welt.js`, `spiel/js/config/floss.js`, `spiel/js/config/kamera.js`, `spiel/js/config/steuerung.js` – alle Zahlen und Farben, kommentiert
  - `tests/spiel/mini-prototyp-test.js` – eigener Test (Muster: `tests/spiel/start-test.js` und `tests/agenten/joystick-pruefung.js`, Three.js per `THREE_LOKAL`)
- Startwerte aus dem Prototyp übernehmen, jeweils mit Kommentar „Wert für Lukas zum Testen“:
  - Floß-Tempo 4 m/s bei vollem Joystick
  - Floß-Drehtempo 6
  - Wellenhöhe 0,25, Wellenlänge 9, Wellentempo 1,2
  - Kamerahöhe 18, Kameraabstand 10, Nachziehen 5, Sichtfeld 50
  - Joystick-Radius 50 px, Totzone 0,12

Gehört nicht dazu:
- Spielfigur, Raster-Floß, Bauen (Pakete 02 ff.)
- Aktionsknöpfe rechts, Haken, Treibgut
- Hai, Überlebenswerte, Tag und Nacht, Himmel, Wetter
- Sound, Speichern
- Änderungen an `tests/agenten/prototyp/` (bleibt als Vorlage und Rollentest unverändert)

Abhängig von: nichts (nur Gerüst `spiel/`, liegt vor)

Technik-Frage: keine. Gedeckt durch freigegebene Ordnerstruktur und Performance-Budget (f-002, Skill `.claude/skills/raft3d-programmierung/SKILL.md`), Three.js `0.170.0` per Import-Map wie im Gerüst und im Skill, kein neuer Ordner außerhalb der Struktur, keine neue Bibliothek.

Fertig, wenn:
- [ ] Spiel startet im emulierten iPhone 13 ohne Konsolenfehler, auch nach 60 Sekunden Laufzeit
- [ ] Wasserfläche und Würfel sind sichtbar (Bildschirmfoto im Test), Würfel steht beim Start in der Bildmitte (±10 % der Bildbreite)
- [ ] Joystick-Feld liegt in der linken Bildhälfte, untere Bildhälfte
- [ ] Joystick 1 Sekunde voll nach oben ziehen: Floß fährt vom Bildschirm weg (z wird kleiner), Strecke 4 m ±25 % (zeigt Delta-Zeit und Tempo-Wert)
- [ ] Joystick nach rechts ziehen: Floß fährt nach rechts (x wird größer)
- [ ] Nach Loslassen und nach `pointercancel`: `eingabe.x` und `eingabe.y` sind 0, Floß bewegt sich 1 Sekunde lang nicht mehr als 0,05 m
- [ ] Kamera folgt: nach der Fahrt ist der waagerechte Abstand Kamera–Floß innerhalb von 2 Sekunden wieder wie beim Start (±0,5 m), Kamera bleibt oberhalb des Floßes (Vogelperspektive)
- [ ] Floß-Höhe ändert sich im Stillstand über 2 Sekunden (wippt auf den Wellen)
- [ ] Pixel-Ratio höchstens 2; höchstens 100 Zeichenaufrufe und 100.000 Dreiecke pro Bild (`renderer.info`); höchstens 2 Lichter
- [ ] Alle Zahlen stehen in `spiel/js/config/`, keine Zahlenwerte für Tempo, Wellen, Kamera oder Joystick in den Logik-Dateien
- [ ] `node tests/spiel/mini-prototyp-test.js` prüft alle Punkte oben und meldet „Alle Prüfungen bestanden.“
- [ ] `node tests/spiel/start-test.js` läuft weiter grün
- [ ] `bash tests/alle-tests.sh` meldet „Alle Tests bestanden.“

Testaufgabe: Auf dem iPhone in Safari `neidelbert.github.io/raft/spiel/` öffnen. Joystick links unten nach oben ziehen: Floß fährt vom Bildschirm weg, Kamera folgt. Nach rechts ziehen: Floß fährt nach rechts. Loslassen: Floß bleibt stehen und wippt auf den Wellen. Beim Ziehen scrollt oder zoomt die Seite nicht.

Freigegeben: 24.10.2026, Leiter (Phase 4 von Lukas freigegeben, f-001)
