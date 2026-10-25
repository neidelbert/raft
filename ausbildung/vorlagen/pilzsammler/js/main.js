// Pilzsammler – ein kleines Spiel von einem früheren Entwickler.
// Test-Schnittstelle: window.spiel = { bereit, spieler: {x, y}, eingabe: {x, y}, pilze: [{x, y}], punkte, rekord }
// Mit ?test=1: window.spiel.test.setzePilze([[x, y], …]) legt Pilze an feste Stellen, setzeSpieler(x, y).

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
const rekord = JSON.parse(localStorage.getItem('pilz-rekord')) || 0;

function neuerPilz() {
  pilze.push({ x: 30 + Math.random() * (innerWidth - 60), y: 80 + Math.random() * (innerHeight - 280) });
}
for (let i = 0; i < 8; i++) neuerPilz();

// Joystick
let aktiv = false;
feld.addEventListener('pointerdown', (e) => { aktiv = true; bewege(e); });
feld.addEventListener('pointermove', (e) => { if (aktiv) bewege(e); });
feld.addEventListener('pointerup', () => { aktiv = false; eingabe.x = 0; eingabe.y = 0; knopf.style.transform = ''; });
function bewege(e) {
  const r = feld.getBoundingClientRect();
  let dx = e.clientX - (r.left + 70), dy = e.clientY - (r.top + 70);
  const l = Math.hypot(dx, dy);
  if (l > 50) { dx = dx / l * 50; dy = dy / l * 50; }
  knopf.style.transform = `translate(${dx}px, ${dy}px)`;
  eingabe.x = dx / 50; eingabe.y = dy / 50;
}

function schritt() {
  spieler.x += eingabe.x * 4;
  spieler.y += eingabe.y * 4;
  spieler.x = Math.max(20, Math.min(innerWidth - 20, spieler.x));
  spieler.y = Math.max(20, Math.min(innerHeight - 20, spieler.y));

  const vorher = pilze.length;
  pilze = pilze.filter((p) => Math.hypot(p.x - spieler.x, p.y - spieler.y) > 34);
  if (pilze.length < vorher) {
    punkte++;
    while (pilze.length < 8) neuerPilz();
    if (punkte > rekord) localStorage.setItem('pilz-rekord', JSON.stringify(punkte));
  }
  anzeige.textContent = `Pilze: ${punkte} · Rekord: ${Math.max(rekord, punkte)}`;
  window.spiel.pilze = pilze; window.spiel.punkte = punkte;
}

function zeichne() {
  ctx.fillStyle = '#3f7a35'; ctx.fillRect(0, 0, innerWidth, innerHeight);
  for (const p of pilze) {
    ctx.fillStyle = '#f2e6d0'; ctx.fillRect(p.x - 4, p.y, 8, 10);
    ctx.fillStyle = '#d63b2f'; ctx.beginPath(); ctx.arc(p.x, p.y, 12, Math.PI, 0); ctx.fill();
  }
  ctx.fillStyle = '#4fb3ff'; ctx.beginPath(); ctx.arc(spieler.x, spieler.y, 18, 0, Math.PI * 2); ctx.fill();
}

function bild() { schritt(); zeichne(); requestAnimationFrame(bild); }

window.spiel = { bereit: true, spieler, eingabe, pilze, punkte, rekord };
if (new URLSearchParams(location.search).get('test') === '1') {
  window.spiel.test = {
    setzePilze(liste) { pilze = liste.map(([x, y]) => ({ x, y })); },
    setzeSpieler(x, y) { spieler.x = x; spieler.y = y; },
  };
}
requestAnimationFrame(bild);
