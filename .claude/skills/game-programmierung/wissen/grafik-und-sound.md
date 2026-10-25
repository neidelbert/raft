# Grafik und Sound

## Bilder vom Zeichner
- Der Zeichner liefert `spiele/<name>/grafik/<gruppe>/<name>.png` und eine Liste `grafik/grafik.json`: `[{ "name": "figuren/held", "datei": "grafik/figuren/held.png", "breite": 213, "hoehe": 256 }]`.
- Die Bilder sind doppelt so groß wie angezeigt, damit sie auf dem iPhone scharf sind. Horst zeichnet also mit halber Pixelgröße bzw. mit der Größe aus `config/`.
- Laden: `fetch('grafik/grafik.json')` → `ladeBilder(liste)` (`canvas-2d.md`). Start erst, wenn alle Bilder geladen oder als fehlend gemeldet sind.
- **Ersatz, wenn ein Bild fehlt:** einfache Form in der Farbe aus `config/` (Kreis mit Umriss für Figuren, Quadrat für Gegenstände). Das Spiel bleibt spielbar. Dazu eine Nachricht im Bericht an den Zeichner.
- Horst ändert nie Dateien in `grafik/`. Braucht er ein neues Bild, schreibt er dem Zeichner Name, Gruppe, Blickwinkel, Größe und wofür es gebraucht wird.
- Animation per Code: wippen, hüpfen, quetschen, drehen, aufblitzen, umkippen beim Sterben. Werte kommen aus `config/animation.js`.

## Sound per Code (WebAudio, keine Dateien nötig)
```js
let audio = null;
export function weckeTon() { audio ??= new AudioContext(); if (audio.state === 'suspended') audio.resume(); }  // beim ersten pointerdown
export function piep({ frequenz = 440, dauer = 0.1, art = 'square', laut = 0.15, gleiten = 0 } = {}) {
  if (!audio) return;
  const t = audio.currentTime, osz = audio.createOscillator(), verst = audio.createGain();
  osz.type = art; osz.frequency.setValueAtTime(frequenz, t);
  if (gleiten) osz.frequency.exponentialRampToValueAtTime(Math.max(30, frequenz + gleiten), t + dauer);
  verst.gain.setValueAtTime(laut, t); verst.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
  osz.connect(verst).connect(audio.destination); osz.start(t); osz.stop(t + dauer);
}
```
- Treffer: kurz, tief, `gleiten` nach unten. Einsammeln: hoch, `gleiten` nach oben. Explosion: Rauschen (Puffer mit Zufallswerten) und Tiefpass.
- Lautstärke zentral in `config/`, Ton an/aus im Spielstand.
- Gleicher Ton höchstens etwa 20-mal pro Sekunde, sonst wird es Lärm und kostet Leistung.
