// Hilfen für die Tests der Übung 9 (test.js, test-ersatz.js).
const os = require('os');
const path = require('path');

// Vor dem Spiel eingesetzt: zählt gespiegelte Zeichnungen (scale mit negativem x) und gestartete Sound-Puffer,
// unabhängig vom Spielcode.
const ZAEHLER = `
  window.__zaehler = { gespiegelt: 0, puffer: 0 };
  const echtesScale = CanvasRenderingContext2D.prototype.scale;
  CanvasRenderingContext2D.prototype.scale = function (x, y) { if (x < 0) window.__zaehler.gespiegelt++; return echtesScale.call(this, x, y); };
  const echterStart = AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start = function (...a) { window.__zaehler.puffer++; return echterStart.apply(this, a); };`;

// Schreibt ms lang in jedem Bild mit: Zeit, Held, Explosionen, Zahl der gespiegelten Zeichnungen.
function zeichneAuf(seite, ms) {
  return seite.evaluate((dauer) => new Promise((fertig) => {
    const spur = [];
    requestAnimationFrame(function bild(jetzt) {
      const s = window.spiel;
      spur.push({ t: jetzt, x: s.held.x, animation: s.held.animation, rahmen: s.held.rahmen, blick: s.held.blick,
        explosionen: s.explosionen, gespiegelt: window.__zaehler ? window.__zaehler.gespiegelt : 0 });
      jetzt - spur[0].t < dauer ? requestAnimationFrame(bild) : fertig(spur);
    });
  }), ms);
}

// Spielzeit einer Spur in s: Bildabstände wie im Spiel auf 0,1 s gedeckelt (Lernbuch: Deckelung herausrechnen).
function spielzeit(spur) {
  let summe = 0;
  for (let i = 1; i < spur.length; i++) summe += Math.min(spur[i].t - spur[i - 1].t, 100) / 1000;
  return summe;
}

// Rahmenschritte pro Sekunde Spielzeit und Zahl verschiedener Rahmen. Ein langsames Bild kann zwei Rahmen
// überspringen: darum Schritte zählen ((neu − alt) mod Rahmenzahl), nicht nur Wechsel.
function rahmenTempo(spur, anzahl = 6) {
  let wechsel = 0;
  for (let i = 1; i < spur.length; i++) wechsel += (spur[i].rahmen - spur[i - 1].rahmen + anzahl) % anzahl;
  return { bps: wechsel / spielzeit(spur), verschiedene: new Set(spur.map((p) => p.rahmen)).size };
}

function bilder(seite, n = 2) {
  return seite.evaluate((anzahl) => new Promise((fertig) => {
    let rest = anzahl;
    (function weiter() { rest-- > 0 ? requestAnimationFrame(weiter) : fertig(); })();
  }), n);
}

// Tab-Wechsel nachstellen (document.hidden und visibilityState überschreiben, Ereignis auslösen).
function versteckeTab(seite, versteckt) {
  return seite.evaluate((ja) => {
    Object.defineProperty(document, 'hidden', { value: ja, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: ja ? 'hidden' : 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, versteckt);
}

const foto = (name) => path.join(process.env.FOTO_ORDNER || os.tmpdir(), `uebung-9-${name}.png`);

// Nur die Zeilen, die der Browser selbst bei fehlenden Dateien meldet, sind erlaubt (Lernbuch Stufe 6).
const nurLadefehler = (fehler) => fehler.every((f) => /Failed to load resource/.test(f));

module.exports = { ZAEHLER, zeichneAuf, spielzeit, rahmenTempo, bilder, versteckeTab, foto, nurLadefehler };
