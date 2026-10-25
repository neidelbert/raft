// Ersatz-Rahmen per Code, wenn der Atlas fehlt: dieselben Namen und Animationen wie im Atlas des Zeichners, damit
// der übrige Code nichts davon merkt. Wird nur aufgerufen, wenn wirklich etwas fehlt (bausteine/assets.js).
// Gibt { rahmen: { name: { bild, x, y, b, h, ankerX, ankerY } }, animationen: { name: { rahmen, bps, schleife } } }.
import { ERSATZ } from '../config/ersatz.js';
import { ersatzBild } from '../kern/bilder.js';

const VOLL = Math.PI * 2;

// Ein Bild als Rahmen: Anker in Pixeln (Punkte × Auflösung).
function alsRahmen(bild, ankerX, ankerY) {
  const a = ERSATZ.aufloesung;
  return { bild, x: 0, y: 0, b: bild.width, h: bild.height, ankerX: ankerX * a, ankerY: ankerY * a };
}

function maleHeld(ctx, b, h, schritt) {
  const f = ERSATZ.held, kopf = f.kopf, huefte = h * 0.62;
  ctx.lineCap = 'round';
  ctx.strokeStyle = f.beine;
  ctx.lineWidth = 9;
  for (const seite of [1, -1]) {   // zwei Beine, gegengleich
    const winkel = schritt * seite * ERSATZ.schrittWinkel, laenge = h - huefte - 6;
    ctx.beginPath();
    ctx.moveTo(b / 2, huefte);
    ctx.lineTo(b / 2 + Math.sin(winkel) * laenge, huefte + Math.cos(winkel) * laenge);
    ctx.stroke();
  }
  ctx.fillStyle = f.koerper; ctx.strokeStyle = f.umriss; ctx.lineWidth = 3;
  ctx.fillRect(b / 2 - 14, kopf * 2 + 2, 28, huefte - kopf * 2); ctx.strokeRect(b / 2 - 14, kopf * 2 + 2, 28, huefte - kopf * 2);   // kein roundRect: fehlt in iOS 15
  ctx.fillStyle = f.haut;
  ctx.beginPath(); ctx.arc(b / 2, kopf + 2, kopf, 0, VOLL); ctx.fill(); ctx.stroke();
  ctx.fillStyle = f.haare;
  ctx.beginPath(); ctx.arc(b / 2, kopf + 2, kopf, Math.PI, VOLL); ctx.fill();
  ctx.fillStyle = f.umriss;   // Auge rechts: Der Held schaut nach rechts wie im Bild des Zeichners
  ctx.beginPath(); ctx.arc(b / 2 + 7, kopf + 5, 2.2, 0, VOLL); ctx.fill();
}

function maleExplosion(ctx, g, i) {
  const e = ERSATZ.explosion, anteil = (i + 1) / e.rahmen;
  ctx.globalAlpha = 1 - anteil * 0.8;
  ctx.fillStyle = e.farbe; ctx.strokeStyle = e.rand; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(g / 2, g / 2, (g / 2 - 4) * (0.3 + 0.7 * anteil), 0, VOLL); ctx.fill(); ctx.stroke();
}

function maleMuenze(ctx, g, i) {
  const m = ERSATZ.muenze, breite = Math.max(0.12, Math.abs(Math.cos((i / m.rahmen) * Math.PI)));   // 0° … 150° Drehung
  ctx.fillStyle = m.farbe; ctx.strokeStyle = m.rand; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.ellipse(g / 2, g / 2, (g / 2 - 4) * breite, g / 2 - 4, 0, 0, VOLL); ctx.fill(); ctx.stroke();
}

function maleTon(ctx, g, an) {
  const k = ERSATZ.knopf;
  ctx.fillStyle = k.farbe;
  ctx.beginPath(); ctx.arc(g / 2, g / 2, g / 2 - 2, 0, VOLL); ctx.fill();
  ctx.fillStyle = k.zeichen; ctx.strokeStyle = k.zeichen; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(g * 0.22, g * 0.4); ctx.lineTo(g * 0.34, g * 0.4); ctx.lineTo(g * 0.5, g * 0.25);
  ctx.lineTo(g * 0.5, g * 0.75); ctx.lineTo(g * 0.34, g * 0.6); ctx.lineTo(g * 0.22, g * 0.6); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  if (an) ctx.arc(g * 0.52, g / 2, g * 0.2, -0.9, 0.9);
  else { ctx.moveTo(g * 0.6, g * 0.38); ctx.lineTo(g * 0.8, g * 0.62); ctx.moveTo(g * 0.8, g * 0.38); ctx.lineTo(g * 0.6, g * 0.62); }
  ctx.stroke();
}

export function baueErsatz() {
  const a = ERSATZ.aufloesung, held = ERSATZ.held, rahmen = {}, animationen = {};
  const heldRahmen = (schritt) => alsRahmen(ersatzBild(held.breite, held.hoehe, (ctx, b, h) => maleHeld(ctx, b, h, schritt), a), held.breite / 2, held.hoehe);
  rahmen['held-steht'] = heldRahmen(0);
  const folge = (name, anzahl, baue) => {
    const namen = [];
    for (let i = 0; i < anzahl; i++) { namen.push(`${name}-${i + 1}`); rahmen[namen[i]] = baue(i); }
    animationen[name] = { rahmen: namen, ...ERSATZ.animationen[name] };
  };
  folge('held-lauf', ERSATZ.laufRahmen, (i) => heldRahmen(Math.sin((i / ERSATZ.laufRahmen) * VOLL)));
  const e = ERSATZ.explosion.groesse, m = ERSATZ.muenze.groesse, k = ERSATZ.knopf.groesse;
  folge('explosion', ERSATZ.explosion.rahmen, (i) => alsRahmen(ersatzBild(e, e, (ctx) => maleExplosion(ctx, e, i), a), e / 2, e / 2));
  folge('muenze', ERSATZ.muenze.rahmen, (i) => alsRahmen(ersatzBild(m, m, (ctx) => maleMuenze(ctx, m, i), a), m / 2, m / 2));
  rahmen['ton-an'] = alsRahmen(ersatzBild(k, k, (ctx) => maleTon(ctx, k, true), a), k / 2, k / 2);
  rahmen['ton-aus'] = alsRahmen(ersatzBild(k, k, (ctx) => maleTon(ctx, k, false), a), k / 2, k / 2);
  return { rahmen, animationen };
}
