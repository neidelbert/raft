// Probe für assets.js: lädt assets/assets.json (Atlas, Sound, Schrift), zeichnet den Rahmen „figur“, dekodiert den
// Sound. ?zeitgrenze=<ms> setzt die Zeitgrenze je Asset. Fehlt der Atlas, gibt es einen gezeichneten Ersatz-Rahmen.
import { erstelleBildschirm } from '../../bildschirm.js';
import { ladeAssets, dekodiereSounds, holeAnimation } from '../../assets.js';
import { zeichneRahmen } from '../../animation.js';

const zeitgrenze = Number(new URLSearchParams(location.search).get('zeitgrenze')) || 3000;
const { ctx, breite, hoehe, pixelRatio } = erstelleBildschirm(document.getElementById('leinwand'));
const verlauf = [];
function baueErsatz() {
  const bild = document.createElement('canvas');
  bild.width = 40; bild.height = 60;
  const c = bild.getContext('2d');
  c.fillStyle = '#ff00ff'; c.fillRect(0, 0, 40, 60);
  return { rahmen: { figur: { bild, x: 0, y: 0, b: 40, h: 60, ankerX: 20, ankerY: 60 } } };
}
const start = performance.now();
const assets = await ladeAssets('assets/assets.json', { zeitgrenze, beiFortschritt: (a) => verlauf.push(a), ersatz: baueErsatz });
const dauer = performance.now() - start;

ctx.fillStyle = '#203040'; ctx.fillRect(0, 0, breite, hoehe);
const figur = assets.rahmen.figur;
zeichneRahmen(ctx, figur, breite / 2, hoehe / 2, 0.5, 1);
ctx.font = '28px Probe, sans-serif';
ctx.fillStyle = '#fff';
ctx.fillText('„Größe“ 123', 20, 60);

const audio = new AudioContext();
const dekodiert = await dekodiereSounds(assets, audio);
const nochmal = await dekodiereSounds(assets, audio);
// Pixel 30 Punkte über dem Fußpunkt (dort ist die Figur) und eine leere Ecke, in Gerätepixeln.
const lies = (x, y) => Array.from(ctx.getImageData(Math.round(x * pixelRatio), Math.round(y * pixelRatio), 1, 1).data);
window.probe = {
  bereit: true,
  status: assets.status,
  version: assets.version,
  verlauf,
  dauer,
  dekodiert,
  nochmal,
  pufferDauer: assets.sounds.piep?.puffer?.duration ?? 0,
  schrift: assets.schriften.Probe === true && document.fonts.check('28px Probe'),
  rahmen: figur ? { b: figur.b, h: figur.h, ersatz: figur.bild instanceof HTMLCanvasElement } : null,
  animation: holeAnimation(assets, 'figur')?.rahmen.join() ?? '',
  figurPixel: lies(breite / 2, hoehe / 2 - 30),
  ecke: lies(breite - 2, hoehe - 2),
};
