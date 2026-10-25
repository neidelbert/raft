// Pilzsammler – ein kleines Spiel von einem früheren Entwickler.
// Test-Schnittstelle: window.spiel = { bereit, spieler: {x, y}, eingabe: {x, y}, pilze: [{x, y}], punkte, rekord }
// Mit ?test=1: window.spiel.test.setzePilze([[x, y], …]) legt Pilze an feste Stellen, setzeSpieler(x, y).
// Einstellwerte: js/config/spiel.js. Rekord lesen/schreiben: js/speicher.js.

import { SPIELER, PILZE, JOYSTICK, ZEIT } from './config/spiel.js';
import { ladeRekord, speichereRekord } from './speicher.js';

const leinwand = document.getElementById('leinwand');
const ctx = leinwand.getContext('2d');
const feld = document.getElementById('joystick');
const knopf = document.getElementById('knopf');
const anzeige = document.getElementById('anzeige');

const pr = Math.min(window.devicePixelRatio || 1, 2);
function groesse() {
  leinwand.width = innerWidth * pr; leinwand.height = innerHeight * pr;
  ctx.setTransform(pr, 0, 0, pr, 0, 0);
}
groesse();
addEventListener('resize', groesse);

const spieler = { x: innerWidth / 2, y: innerHeight / 2 };
const eingabe = { x: 0, y: 0 };
let pilze = [];
let punkte = 0;
let rekord = ladeRekord();

// Neuer Pilz an einer zufälligen Stelle, aber nicht unter der Figur: Dort wäre er im nächsten Bild schon wieder
// eingesammelt und der Spieler sähe nur, dass ein Pilz verschwindet.
function neuerPilz() {
  const breite = innerWidth - 2 * PILZE.randX;
  const hoehe = Math.max(0, innerHeight - PILZE.randOben - PILZE.randUnten);
  let x = 0, y = 0;
  for (let versuch = 0; versuch < PILZE.neuVersuche; versuch++) {
    x = PILZE.randX + Math.random() * breite;
    y = PILZE.randOben + Math.random() * hoehe;
    const dx = x - spieler.x, dy = y - spieler.y;
    if (dx * dx + dy * dy > PILZE.neuAbstand * PILZE.neuAbstand) break;
  }
  pilze.push({ x, y });
}
for (let i = 0; i < PILZE.anzahl; i++) neuerPilz();

// Joystick. Es zählt nur der Finger, der ihn zuerst berührt hat. Pointer-Capture sorgt dafür, dass das Loslassen
// auch ankommt, wenn der Finger (oder die Maus) das Feld verlassen hat. pointercancel kommt auf dem iPhone, wenn
// das System die Berührung übernimmt (Wisch vom Rand, Anruf, Kontrollzentrum): Dann kommt nie ein pointerup.
let fingerId = null;
feld.addEventListener('pointerdown', (e) => {
  if (fingerId !== null) return;
  fingerId = e.pointerId;
  feld.setPointerCapture(e.pointerId);
  bewege(e);
});
feld.addEventListener('pointermove', (e) => { if (e.pointerId === fingerId) bewege(e); });
for (const art of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  feld.addEventListener(art, (e) => { if (e.pointerId === fingerId) loslassen(); });
}
function loslassen() {
  fingerId = null; eingabe.x = 0; eingabe.y = 0; knopf.style.transform = '';
}
function bewege(e) {
  const r = feld.getBoundingClientRect();
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const l = Math.sqrt(dx * dx + dy * dy);
  if (l > JOYSTICK.weg) { dx = dx / l * JOYSTICK.weg; dy = dy / l * JOYSTICK.weg; }
  knopf.style.transform = `translate(${dx}px, ${dy}px)`;
  eingabe.x = dx / JOYSTICK.weg; eingabe.y = dy / JOYSTICK.weg;
}

// Entfernt alle Pilze in Reichweite der Figur und gibt zurück, wie viele es waren. Jeder Pilz gibt einen Punkt,
// auch wenn zwei dicht beieinander liegen. Rückwärts, damit splice keinen Pilz überspringt.
function sammlePilze() {
  let gesammelt = 0;
  const grenze = PILZE.sammelAbstand * PILZE.sammelAbstand;
  for (let i = pilze.length - 1; i >= 0; i--) {
    const dx = pilze[i].x - spieler.x, dy = pilze[i].y - spieler.y;
    if (dx * dx + dy * dy <= grenze) { pilze.splice(i, 1); gesammelt++; }
  }
  return gesammelt;
}

function schritt(dt) {
  spieler.x += eingabe.x * SPIELER.tempo * dt;
  spieler.y += eingabe.y * SPIELER.tempo * dt;
  spieler.x = Math.max(SPIELER.randAbstand, Math.min(innerWidth - SPIELER.randAbstand, spieler.x));
  spieler.y = Math.max(SPIELER.randAbstand, Math.min(innerHeight - SPIELER.randAbstand, spieler.y));

  const gesammelt = sammlePilze();
  if (gesammelt > 0) {
    punkte += gesammelt;
    while (pilze.length < PILZE.anzahl) neuerPilz();
    if (punkte > rekord) { rekord = punkte; speichereRekord(rekord); }
  }
  anzeige.textContent = `Pilze: ${punkte} · Rekord: ${rekord}`;
  window.spiel.pilze = pilze; window.spiel.punkte = punkte; window.spiel.rekord = rekord;
}

function zeichne() {
  ctx.fillStyle = '#3f7a35'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  for (const p of pilze) {
    ctx.fillStyle = '#f2e6d0'; ctx.fillRect(p.x - PILZE.stielBreite / 2, p.y, PILZE.stielBreite, PILZE.stielHoehe);
    ctx.fillStyle = '#d63b2f'; ctx.beginPath(); ctx.arc(p.x, p.y, PILZE.hutRadius, Math.PI, 0); ctx.fill();
  }
  ctx.fillStyle = '#4fb3ff'; ctx.beginPath(); ctx.arc(spieler.x, spieler.y, SPIELER.radius, 0, Math.PI * 2); ctx.fill();
}

// Hauptschleife mit Delta-Zeit (Zeit seit dem letzten Bild): Die Figur läuft pro Sekunde gleich weit,
// egal ob das Gerät 30, 60 oder 120 Bilder pro Sekunde zeichnet.
let letzte = performance.now();
function bild(jetzt) {
  const dt = Math.min(Math.max(0, jetzt - letzte) / 1000, ZEIT.maxSchritt);
  letzte = Math.max(letzte, jetzt);
  schritt(dt); zeichne();
  requestAnimationFrame(bild);
}

window.spiel = { bereit: true, spieler, eingabe, pilze, punkte, rekord };
if (new URLSearchParams(location.search).get('test') === '1') {
  window.spiel.test = {
    setzePilze(liste) { pilze = liste.map(([x, y]) => ({ x, y })); },
    setzeSpieler(x, y) { spieler.x = x; spieler.y = y; },
  };
}
requestAnimationFrame(bild);
