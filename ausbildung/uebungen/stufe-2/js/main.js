// Übung 2: Figur in der Mitte, schwebender Joystick links, Sprung-Knopf rechts unten.
// Datenfluss: Finger → joystick.eingabe / Sprung-Knopf → welt.spieler (bewegen, springen) → zeichne.
// window.spiel nur zum Lesen für Tests.
import { SPIEL, FARBEN, BILDER } from './config/spiel.js';
import { SPIELER } from './config/spieler.js';
import { JOYSTICK } from './config/steuerung.js';
import { erstelleBildschirm } from './kern/bildschirm.js';
import { ladeBilder } from './kern/bilder.js';
import { erstelleJoystick, zeichneJoystick } from './steuerung/joystick.js';
import { erstelleKnopf } from './steuerung/knopf.js';
import { erstelleSpieler, bewegeSpieler, haltImBild, starteSprung, aktualisiereSprung, zeichneSpieler } from './welt/spieler.js';

const adresse = new URLSearchParams(location.search);

// Safari zoomt trotz user-scalable=no mit zwei Fingern: Gesten abfangen.
for (const art of ['gesturestart', 'gesturechange']) document.addEventListener(art, (e) => e.preventDefault());

const bildschirm = erstelleBildschirm(document.getElementById('leinwand'), SPIEL.pixelRatioMax);
const joystick = erstelleJoystick(document.getElementById('feld-joystick'), JOYSTICK);
const bilder = await ladeBilder();
const figurBild = bilder[BILDER.figur] || null;
const figurBreite = figurBild ? (SPIELER.hoehe * figurBild.naturalWidth) / figurBild.naturalHeight : SPIELER.breiteErsatz;

const welt = {
  spieler: erstelleSpieler({ x: bildschirm.breite / 2, y: bildschirm.hoehe / 2, breite: figurBreite, hoehe: SPIELER.hoehe }),
};
erstelleKnopf(document.getElementById('knopf-sprung'), () => starteSprung(welt.spieler));
window.addEventListener('resize', () => haltImBild(welt.spieler, bildschirm.breite, bildschirm.hoehe, SPIELER.sprungHoehe));

// Test-Schnittstelle (der Spielcode liest sie nie).
const spiel = { bereit: false, spieler: welt.spieler, eingabe: joystick.eingabe };
if (adresse.get('test') === '1') {
  spiel.test = {
    // Figur an eine Stelle setzen, um Ränder schnell zu prüfen.
    setzeSpieler(x, y) { welt.spieler.x = x; welt.spieler.y = y; },
    bildGeladen: Boolean(figurBild),
  };
}
window.spiel = spiel;

function aktualisiere(dt) {
  const { eingabe } = joystick;
  bewegeSpieler(welt.spieler, eingabe.x, eingabe.y, SPIELER.laufTempo, dt, bildschirm.breite, bildschirm.hoehe, SPIELER.sprungHoehe);
  aktualisiereSprung(welt.spieler, dt, SPIELER.sprungDauer);
}

function zeichne() {
  const { ctx, breite, hoehe } = bildschirm;
  ctx.fillStyle = FARBEN.hintergrund;
  ctx.fillRect(0, 0, breite, hoehe);
  zeichneSpieler(ctx, welt.spieler, figurBild, SPIELER, FARBEN);
  zeichneJoystick(ctx, joystick, JOYSTICK, FARBEN);
}

let letzte = 0;
let pausiert = document.hidden;

function bild(jetzt) {
  const dt = Math.min(Math.max(jetzt - letzte, 0) / 1000, SPIEL.deltaMax);   // Sekunden, gedeckelt
  // Nie zurückgehen: Nach einem Tab-Wechsel kommt oft noch ein Bild mit altem Zeitstempel (Lernbuch Stufe 1).
  letzte = Math.max(letzte, jetzt);
  if (!pausiert) aktualisiere(dt);
  zeichne();
  requestAnimationFrame(bild);
}

document.addEventListener('visibilitychange', () => {
  pausiert = document.hidden;
  letzte = performance.now();   // keinen Zeitsprung nach der Rückkehr
  if (document.hidden) joystick.loese();   // ein Finger, der beim Wechsel lag, kommt nie mehr hoch
});

requestAnimationFrame((t) => {
  letzte = t;
  bild(t);
  spiel.bereit = true;
});
