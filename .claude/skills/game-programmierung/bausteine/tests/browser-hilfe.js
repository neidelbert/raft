// Hilfen für die Baustein-Tests im Browser (Touch, Canvas, Ton) über werkzeuge/test-hilfe.js (Kopie im Skill).
//   const b = require('./browser-hilfe.js');
//   const lauf = await b.starteProbe('joystick', 8882);   // öffnet tests/seite/index.html?teil=joystick
// Prüfen mit h.pruefe aus hilfe.js (ein Zähler für Regeln und Browser). Ports 8880–8889 (Baustein-Tests). Bildschirmfotos landen in FOTO_ORDNER (Standard: Temp-Ordner).
const os = require('os');
const path = require('path');
const t = require('../../werkzeuge/test-hilfe.js');
const { ORDNER } = require('./hilfe.js');

function starteProbe(teil, port, { zusatz = '', geraet, initSkript, routen } = {}) {
  return t.starte({
    ordner: ORDNER, port, geraet, initSkript, routen,
    pfad: `tests/seite/index.html?teil=${teil}${zusatz}`,
    warteAuf: 'window.probe && window.probe.bereit',
  });
}

// Mehrere Finger per CDP. finger = [{ id, x, y }]. touchStart/touchMove: alle Finger auf dem Glas.
// touchEnd/touchCancel: nur die Finger, die abheben (so arbeitet Chromium, Lernbuch Stufe 2).
function touch(cdp, typ, finger) {
  return cdp.send('Input.dispatchTouchEvent', { type: typ, touchPoints: finger.map((f) => ({ ...f, radiusX: 5, radiusY: 5, force: 1 })) });
}

// Wartet n Bilder (requestAnimationFrame) in der Seite.
function bilder(seite, n = 2) {
  return seite.evaluate((anzahl) => new Promise((fertig) => {
    let rest = anzahl;
    (function weiter() { rest-- > 0 ? requestAnimationFrame(weiter) : fertig(); })();
  }), n);
}

const foto = (name) => path.join(process.env.FOTO_ORDNER || os.tmpdir(), `baustein-${name}.png`);

// Nur die Zeilen, die der Browser selbst bei fehlenden Dateien meldet, sind erlaubt (Lernbuch Stufe 6).
const nurLadefehler = (fehler) => fehler.every((f) => /Failed to load resource/.test(f));

module.exports = { t, starteProbe, touch, bilder, foto, nurLadefehler };
