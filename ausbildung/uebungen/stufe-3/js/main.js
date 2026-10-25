// Übung 3: Figur mit Joystick und Sprung-Knopf (aus Übung 2), dazu bis zu 240 Gegner, die vom Rand zum Spieler laufen.
// Datenfluss: Finger → joystick.eingabe / Sprung-Knopf → welt.spieler (bewegen, springen, Schutzzeit)
//   → welt.schwarm (erscheinen, laufen, auseinanderschieben) → Treffer (leben, unverwundbar) → zeichne.
// window.spiel nur zum Lesen für Tests.
import { SPIEL, FARBEN, BILDER } from './config/spiel.js';
import { SPIELER } from './config/spieler.js';
import { JOYSTICK } from './config/steuerung.js';
import { GEGNER } from './config/gegner.js';
import { erstelleBildschirm } from './kern/bildschirm.js';
import { ladeBilder } from './kern/bilder.js';
import { erstelleZufall } from './kern/zufall.js';
import { erstelleJoystick, zeichneJoystick } from './steuerung/joystick.js';
import { erstelleKnopf } from './steuerung/knopf.js';
import { erstelleSpieler, bewegeSpieler, haltImBild, starteSprung, aktualisiereSprung, zeichneSpieler } from './welt/spieler.js';
import { erstelleSchwarm, passeSchwarmAn, erzeugeGegner, leereSchwarm, aktualisiereSchwarm, sortiereNachY, zeichneGegner } from './welt/gegner.js';
import { aktualisiereSchutz, pruefeTreffer } from './welt/treffer.js';

const adresse = new URLSearchParams(location.search);
const seed = Number.parseInt(adresse.get('seed'), 10);
const zufall = erstelleZufall(Number.isFinite(seed) ? seed : undefined);

// Safari zoomt trotz user-scalable=no mit zwei Fingern: Gesten abfangen.
for (const art of ['gesturestart', 'gesturechange']) document.addEventListener(art, (e) => e.preventDefault());

const bildschirm = erstelleBildschirm(document.getElementById('leinwand'), SPIEL.pixelRatioMax);
const joystick = erstelleJoystick(document.getElementById('feld-joystick'), JOYSTICK);
const bilder = await ladeBilder();
const figurBild = bilder[BILDER.figur] || null;
const figurBreite = figurBild ? (SPIELER.hoehe * figurBild.naturalWidth) / figurBild.naturalHeight : SPIELER.breiteErsatz;
const gegnerBild = bilder[BILDER.gegner] || null;
const gegnerBreite = gegnerBild ? (GEGNER.hoehe * gegnerBild.naturalWidth) / gegnerBild.naturalHeight : GEGNER.breiteErsatz;

const welt = {
  spieler: erstelleSpieler({ x: bildschirm.breite / 2, y: bildschirm.hoehe / 2, breite: figurBreite, hoehe: SPIELER.hoehe, leben: SPIELER.leben }),
  schwarm: erstelleSchwarm(GEGNER),
};
passeSchwarmAn(welt.schwarm, bildschirm.breite, bildschirm.hoehe);
erstelleKnopf(document.getElementById('knopf-sprung'), () => starteSprung(welt.spieler));
window.addEventListener('resize', () => {
  haltImBild(welt.spieler, bildschirm.breite, bildschirm.hoehe, SPIELER.sprungHoehe);
  passeSchwarmAn(welt.schwarm, bildschirm.breite, bildschirm.hoehe);
});
const messung = { schrittMs: 0 };   // gleitend gemittelte Zeit für aktualisiere() ohne Zeichnen
let gemessen = false;               // erster Messwert ersetzt die 0 direkt

// Test-Schnittstelle (der Spielcode liest sie nie).
const spiel = {
  bereit: false, spieler: welt.spieler, eingabe: joystick.eingabe, messung,
  get gegnerAktiv() { return welt.schwarm.anzahl; },
};
if (adresse.get('test') === '1') {
  const { schwarm } = welt;
  spiel.test = {
    // Sofort n Gegner am Rand erzeugen (nie über GEGNER.max). Gibt die neue Anzahl zurück.
    fuelleGegner(n) {
      for (let i = 0; i < n && erzeugeGegner(schwarm, welt.spieler, bildschirm.breite, bildschirm.hoehe, zufall); i++);
      return schwarm.anzahl;
    },
    friere(an) { schwarm.gefroren = Boolean(an); },
    // Nur für den eigenen Test: Figur oder Gegner an eine Stelle setzen, Gegner auslesen, alles leeren.
    setzeSpieler(x, y) { welt.spieler.x = x; welt.spieler.y = y; },
    setzeGegner(i, x, y) { schwarm.x[i] = x; schwarm.y[i] = y; },
    gegnerPositionen() { return Array.from({ length: schwarm.anzahl }, (_, i) => ({ x: schwarm.x[i], y: schwarm.y[i] })); },
    leereGegner() { leereSchwarm(schwarm); },
    bildGeladen: Boolean(figurBild),
    gegnerBildGeladen: Boolean(gegnerBild),
  };
}
window.spiel = spiel;

function aktualisiere(dt) {
  const { eingabe } = joystick;
  bewegeSpieler(welt.spieler, eingabe.x, eingabe.y, SPIELER.laufTempo, dt, bildschirm.breite, bildschirm.hoehe, SPIELER.sprungHoehe);
  aktualisiereSprung(welt.spieler, dt, SPIELER.sprungDauer);
  aktualisiereSchutz(welt.spieler, dt);
  aktualisiereSchwarm(welt.schwarm, welt.spieler, dt, bildschirm.breite, bildschirm.hoehe, zufall);
  pruefeTreffer(welt.spieler, welt.schwarm, SPIELER.trefferRadius, SPIELER.schutzZeit);
}

// Spiel-Schritt mit Zeitmessung (gleitendes Mittel), damit man die Leistung bei vielen Gegnern sieht.
function schritt(dt) {
  const start = performance.now();
  aktualisiere(dt);
  const ms = performance.now() - start;
  messung.schrittMs = gemessen ? messung.schrittMs + (ms - messung.schrittMs) * SPIEL.messGlaettung : ms;
  gemessen = true;
}

function zeichne() {
  const { ctx, breite, hoehe } = bildschirm;
  ctx.fillStyle = FARBEN.hintergrund;
  ctx.fillRect(0, 0, breite, hoehe);
  // Nach Fußpunkt sortiert: Gegner hinter der Figur, dann die Figur, dann die Gegner davor.
  // Gegner sind nach Mitte sortiert; ihr Fuß liegt GEGNER.hoehe / 2 darunter, der Fuß der Figur SPIELER.hoehe / 2.
  const { schwarm, spieler } = welt;
  sortiereNachY(schwarm);
  const grenzeY = spieler.y + (SPIELER.hoehe - GEGNER.hoehe) / 2;
  const naechster = zeichneGegner(ctx, schwarm, 0, grenzeY, gegnerBild, gegnerBreite, FARBEN);
  zeichneSpieler(ctx, spieler, figurBild, SPIELER, FARBEN);
  zeichneGegner(ctx, schwarm, naechster, Infinity, gegnerBild, gegnerBreite, FARBEN);
  zeichneJoystick(ctx, joystick, JOYSTICK, FARBEN);
}

let letzte = 0;
let pausiert = document.hidden;

function bild(jetzt) {
  const dt = Math.min(Math.max(jetzt - letzte, 0) / 1000, SPIEL.deltaMax);   // Sekunden, gedeckelt
  // Nie zurückgehen: Nach einem Tab-Wechsel kommt oft noch ein Bild mit altem Zeitstempel (Lernbuch Stufe 1).
  letzte = Math.max(letzte, jetzt);
  if (!pausiert) schritt(dt);
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
