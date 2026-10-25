# Grafik und Sound

## Bilder vom Zeichner (`bausteine/bilder.js`)
- Der Zeichner liefert `spiele/<name>/grafik/<gruppe>/<name>.png` und eine Liste `grafik/grafik.json`: `[{ "name": "figuren/held", "datei": "grafik/figuren/held.png", "breite": 213, "hoehe": 256 }]`.
- Die Bilder sind doppelt so groß wie angezeigt, damit sie auf dem iPhone scharf sind. Horst zeichnet mit der Größe aus `config/` (Höhe fest, Breite aus dem Seitenverhältnis des Bildes).
- Laden: `const bilder = await ladeBilder();` vor dem Start. Wartet, bis jedes Bild geladen oder als fehlend erkannt ist, hängt nie.
- **Ersatz, wenn ein Bild fehlt:** `holeBild(bilder, name) || ersatzBild(breite, hoehe, maler)`: einfache Form in der Farbe aus `config/` (Kreis mit Umriss für Figuren, Stern oder Quadrat für Gegenstände), einmal beim Start gezeichnet. Das Spiel bleibt spielbar. Dazu eine Nachricht im Bericht an den Zeichner.
- Fehlt eine Datei, die in `grafik.json` steht, meldet der **Browser selbst** „Failed to load resource“ als Fehlerzeile; das lässt sich im Code nicht verhindern. Der Code meldet nur Warnungen. Regel für den Zeichner: Bild löschen heißt auch Eintrag in `grafik.json` streichen (dann gar kein Fehler).
- Eingefärbte Kopien (rotes Aufblitzen): `faerbeEin(bild, farbe)` einmal beim Start, nie pro Bild.
- Horst ändert nie Dateien in `grafik/`. Braucht er ein neues Bild, schreibt er dem Zeichner Name, Gruppe, Blickwinkel, Größe und wofür es gebraucht wird.
- Animation per Code: wippen, hüpfen, quetschen, drehen, aufblitzen, umkippen beim Sterben. Werte kommen aus `config/animation.js`.

## Ton per Code (`bausteine/ton.js`, WebAudio, keine Dateien nötig)
```js
const ton = erstelleTon(TON, KLAENGE);   // config/ton.js
ton.an = speicher.stand.ton;            // Ton an/aus steht im Spielstand
ton.verbinde();                         // weckt den Ton bei der ersten Berührung
ton.spiele('treffer');
```
- Klang = `{ frequenz, dauer, art, laut, gleiten }`. Treffer: kurz, tief, `gleiten` nach unten (180 Hz, −110). Einsammeln: hoch, `gleiten` nach oben (880 Hz, +660). Explosion: Rauschen (Puffer mit Zufallswerten) und Tiefpass (noch kein Baustein).
- `ton.bereit` ist ein eigener Merker („nach Berührung angelegt“). Im Test-Chromium läuft ein AudioContext auch ohne Berührung, `audio.state` sagt dort nichts.
- Lautstärke zentral in `config/`, Ton an/aus im Spielstand und als Knopf (`bausteine/knopf.js`).
- Gleicher Ton höchstens etwa 20-mal pro Sekunde (`mindestAbstand` 0,05 s), sonst wird es Lärm und kostet Leistung. Klänge nur bei Ereignissen, nie in jedem Bild.
