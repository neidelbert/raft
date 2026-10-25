// Übung 1: Ein Ball fliegt schräg über den Bildschirm und prallt an den Rändern ab.
// Datenfluss: config → welt (ball, bildschirm) → bewegeBall(dt) → zeichne. window.spiel nur zum Lesen für Tests.
import { SPIEL, FARBEN } from './config/spiel.js';
import { erstelleBildschirm } from './kern/bildschirm.js';
import { erstelleZufall } from './kern/zufall.js';
import { erstelleBall, bewegeBall, haltImBild, zeichneBall } from './welt/ball.js';

const adresse = new URLSearchParams(location.search);
const seedText = adresse.get('seed');
const zufall = erstelleZufall(seedText === null ? Date.now() : Number(seedText));

const bildschirm = erstelleBildschirm(document.getElementById('leinwand'), SPIEL.pixelRatioMax);
const welt = {
  ball: erstelleBall({
    breite: bildschirm.breite, hoehe: bildschirm.hoehe, radius: SPIEL.ballRadius, tempo: SPIEL.ballTempo,
    winkelMin: SPIEL.startWinkelMin, winkelMax: SPIEL.startWinkelMax, zufall,
  }),
};

window.addEventListener('resize', () => haltImBild(welt.ball, bildschirm.breite, bildschirm.hoehe));

// Test-Schnittstelle (der Spielcode liest sie nie).
const spiel = { bereit: false, pixelRatio: 1, ball: welt.ball, breite: 0, hoehe: 0 };
if (adresse.get('test') === '1') {
  spiel.test = {
    // Ball an eine Stelle mit bestimmter Geschwindigkeit setzen, um Randfälle zu prüfen.
    setzeBall(x, y, vx, vy) { Object.assign(welt.ball, { x, y, vx, vy }); },
  };
}
window.spiel = spiel;

function zeichne() {
  const { ctx, breite, hoehe } = bildschirm;
  ctx.fillStyle = FARBEN.hintergrund;
  ctx.fillRect(0, 0, breite, hoehe);
  zeichneBall(ctx, welt.ball, FARBEN.ball);
}

let letzte = 0;
let pausiert = document.hidden;

function bild(jetzt) {
  const dt = Math.min(Math.max(jetzt - letzte, 0) / 1000, SPIEL.deltaMax);   // Sekunden, gedeckelt
  // Nie zurückgehen: Nach einem Tab-Wechsel kommt oft noch ein Bild mit altem Zeitstempel (vor dem Zurücksetzen).
  // Würde letzte darauf gesetzt, rechnete das nächste Bild wieder die ganze Pause nach.
  letzte = Math.max(letzte, jetzt);
  if (!pausiert) bewegeBall(welt.ball, dt, bildschirm.breite, bildschirm.hoehe);
  zeichne();
  spiel.pixelRatio = bildschirm.pixelRatio;
  spiel.breite = bildschirm.breite;
  spiel.hoehe = bildschirm.hoehe;
  requestAnimationFrame(bild);
}

document.addEventListener('visibilitychange', () => {
  pausiert = document.hidden;
  letzte = performance.now();   // keinen Zeitsprung nach der Rückkehr
});

requestAnimationFrame((t) => {
  letzte = t;
  bild(t);
  spiel.bereit = true;
});
