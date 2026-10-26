// Darstellung in 2D (Canvas): Bildschirm, Spielfeld, Zeichnen der Welt, Ersatz-Zeichnung für fehlende Bilder.
// Schnittstelle (gleich wie in der 3D-Fassung, main.js kennt nur diese):
//   erstelleDarstellung(dokument, welt) → darstellung = {
//     art: '2d', pixelRatio, zeichenaufrufe (nur 3D, hier 0), modell (nur 3D, hier ''), figur ('atlas' | 'ersatz' | ''),
//     animation ('stand' | 'lauf' | ''), feldOben (Punkte: unterer Rand der Bedienelemente oben),
//     ladeOptionen: Zusatz für ladeAssets (hier: ersatz), nimmAssets(assets), setzeStart(welt),
//     aktualisiere(dt, welt) (Animation, Effekte; jedes nicht pausierte Bild), zeichne(welt) (jedes Bild) }
//   Setzt welt.feld beim Start, bei jeder Größenänderung (auch der Bedienelemente oben) und wenn die Bilder da sind:
//   Die ganze Figur bleibt im Bild und mit dem Kopf unter ALLEN Bedienelementen oben (Leiste, Ton-Knopf: alles mit
//   data-oben im HTML, gemessen). Feldgrenzen aus Fußpunkt und Größe aller Rahmen der Figur (Stand und Lauf, größter
//   Ausschlag), nicht aus einer festen Zahl: Eine Figur des Zeichners ist 128 Punkte hoch, die Ersatz-Figur nur 64.
//   Animation: Die Regel entscheidet (spieler.laeuft, spieler.blick), hier wird nur Stand oder Lauf abgespielt.
import { erstelleBildschirm } from '../kern/bildschirm.js';
import { erstelleAbspieler, spieleAb, aktualisiereAnimation, rahmenName, zeichneRahmen } from '../kern/animation.js';
import { holeAnimation } from '../kern/assets.js';
import { ersatzBild } from '../kern/bilder.js';
import { SPIEL } from '../config/spiel.js';
import { SPIELER, FARBEN, RASTER, ERSATZ } from '../config/welt.js';
import { setzeSpieler, halteImFeld } from '../regeln/spieler.js';

// Form für einen Rahmen-Namen: längster passender Anfang aus ERSATZ.formen („schleim“ passt auf „schleim-2“).
function formFuer(name) {
  let beste = null, laenge = -1;
  for (const [anfang, form] of Object.entries(ERSATZ.formen)) {
    if ((name === anfang || name.startsWith(`${anfang}-`)) && anfang.length > laenge) { beste = form; laenge = anfang.length; }
  }
  return beste || ERSATZ.standard;
}

// Ein Ersatz-Rahmen in Pixeln (b × h, Fußpunkt ankerX/ankerY), wie ein Rahmen aus dem Atlas.
function ersatzRahmen(name, b, h, ankerX, ankerY) {
  const { form, farbe } = formFuer(name);
  const linie = ERSATZ.aufloesung * 1.5;   // Umrissstärke in Pixeln (1,5 Punkte)
  const bild = ersatzBild(b, h, (ctx, breite, hoehe) => {
    ctx.fillStyle = farbe;
    ctx.strokeStyle = ERSATZ.umriss;
    ctx.lineWidth = linie;
    ctx.beginPath();
    const rx = Math.max(1, breite / 2 - linie), ry = Math.max(1, hoehe / 2 - linie);
    if (form === 'koerper') ctx.ellipse(breite / 2, hoehe * 0.55, rx, Math.max(1, hoehe * 0.43), 0, 0, Math.PI * 2);
    else ctx.ellipse(breite / 2, hoehe / 2, Math.min(rx, ry), Math.min(rx, ry), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, 1);
  return { bild, x: 0, y: 0, b: bild.width, h: bild.height, ankerX, ankerY, ersatz: true };
}

// Ersatz für jeden Rahmen des fehlenden Atlas (bekannt: Maße und Fußpunkt aus dem Manifest, bausteine/assets.js) und
// immer für das Stand-Bild der Figur (auch wenn das Manifest fehlt: dann in den Maßen aus ERSATZ).
function baueErsatz(bekannt = { rahmen: {} }) {
  const rahmen = {};
  for (const [name, r] of Object.entries(bekannt.rahmen || {})) rahmen[name] = ersatzRahmen(name, r.b, r.h, r.ankerX, r.ankerY);
  if (!rahmen[SPIELER.rahmen]) {
    const a = ERSATZ.aufloesung;
    rahmen[SPIELER.rahmen] = ersatzRahmen(SPIELER.rahmen, ERSATZ.breite * a, ERSATZ.hoehe * a, (ERSATZ.breite / 2) * a, (ERSATZ.hoehe - 2) * a);
  }
  return { rahmen };
}

// Gehört der Rahmen zur Figur? („figur“, „figur-lauf-1“ …)
const gehoertZurFigur = (name) => name === SPIELER.rahmen || name.startsWith(`${SPIELER.rahmen}-`);

// Ausdehnung der Figur um den Fußpunkt in Punkten (links, rechts, oben = Kopf, unten): größter Ausschlag aller ihrer
// Rahmen, sonst stößt der Kopf beim Laufen (Arme, Hub) doch an. Ergebnis in ziel (kein neues Objekt).
function ausdehnung(alleRahmen, skala, ziel) {
  ziel.links = ziel.rechts = ziel.oben = ziel.unten = 0;
  for (const [name, r] of Object.entries(alleRahmen)) {
    if (!gehoertZurFigur(name)) continue;
    ziel.links = Math.max(ziel.links, r.ankerX * skala);
    ziel.rechts = Math.max(ziel.rechts, (r.b - r.ankerX) * skala);
    ziel.oben = Math.max(ziel.oben, r.ankerY * skala);
    ziel.unten = Math.max(ziel.unten, (r.h - r.ankerY) * skala);
  }
  return ziel;
}

export function erstelleDarstellung(dokument, welt) {
  let alleRahmen = null, standRahmen = null, standAnimation = null, laufAnimation = null;
  const abspieler = erstelleAbspieler();
  const masse = { links: 0, rechts: 0, oben: 0, unten: 0 };
  let feldOben = 0;
  // Bedienelemente oben (Leiste, Ton-Knopf, später z. B. Pause): alles mit data-oben. Die Leiste ist versteckt nur
  // unsichtbar (stil.css), damit sie messbar bleibt. Wächst eins (dritter Wert, zweite Zeile), wird neu gerechnet.
  const obenElemente = dokument.querySelectorAll('[data-oben]');
  function messeOben() {
    let unten = 0;
    for (const e of obenElemente) unten = Math.max(unten, e.getBoundingClientRect().bottom);
    return unten;
  }
  function setzeFeld(breite, hoehe) {
    const f = welt.feld, luft = SPIELER.rand;
    if (alleRahmen) ausdehnung(alleRahmen, SPIELER.skala, masse);
    else { masse.links = masse.rechts = ERSATZ.breite / 2; masse.oben = ERSATZ.hoehe; masse.unten = 0; }
    const oben = messeOben();
    feldOben = oben;
    f.minX = masse.links + luft; f.maxX = breite - masse.rechts - luft;
    f.minY = oben + masse.oben + luft; f.maxY = hoehe - masse.unten - luft;
    if (f.maxX < f.minX) f.minX = f.maxX = breite / 2;   // Bildschirm kleiner als die Figur: Mitte statt Zittern
    if (f.maxY < f.minY) f.minY = f.maxY = (oben + hoehe) / 2;
    halteImFeld(welt.spieler, f);
  }
  const bildschirm = erstelleBildschirm(dokument.getElementById('leinwand'), {
    pixelRatioMax: SPIEL.pixelRatioMax,
    beiGroesse(b) { setzeFeld(b.breite, b.hoehe); },
  });
  if (typeof ResizeObserver === 'function') {   // Safari ab 13.1; ohne: Feld nur bei Größenänderung des Fensters
    const beobachter = new ResizeObserver(() => setzeFeld(bildschirm.breite, bildschirm.hoehe));
    for (const e of obenElemente) beobachter.observe(e);
  }

  function zeichneRaster(ctx) {
    ctx.strokeStyle = FARBEN.raster;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = RASTER.abstand; x < bildschirm.breite; x += RASTER.abstand) { ctx.moveTo(x, 0); ctx.lineTo(x, bildschirm.hoehe); }
    for (let y = RASTER.abstand; y < bildschirm.hoehe; y += RASTER.abstand) { ctx.moveTo(0, y); ctx.lineTo(bildschirm.breite, y); }
    ctx.stroke();
  }

  const darstellung = {
    art: '2d',
    get pixelRatio() { return bildschirm.pixelRatio; },
    zeichenaufrufe: 0,
    modell: '',
    figur: '',
    animation: '',
    get feldOben() { return feldOben; },
    ladeOptionen: { ersatz: baueErsatz },
    nimmAssets(assets) {
      alleRahmen = assets.rahmen;
      if (!alleRahmen[SPIELER.rahmen]) {   // Atlas da, aber ohne diesen Rahmen (z. B. Bild umbenannt): Ersatz-Figur statt unsichtbarer Figur
        console.warn(`Rahmen „${SPIELER.rahmen}“ fehlt im Atlas: Ersatz-Figur (SPIELER.rahmen in config/welt.js prüfen)`);
        alleRahmen[SPIELER.rahmen] = baueErsatz().rahmen[SPIELER.rahmen];
      }
      standRahmen = alleRahmen[SPIELER.rahmen];
      standAnimation = holeAnimation(assets, SPIELER.rahmen);
      laufAnimation = holeAnimation(assets, SPIELER.lauf) || standAnimation;   // ohne Lauf-Bilder: Stand-Bild
      spieleAb(abspieler, standAnimation);
      darstellung.figur = standRahmen.ersatz ? 'ersatz' : 'atlas';
      setzeFeld(bildschirm.breite, bildschirm.hoehe);
    },
    setzeStart(w) { setzeSpieler(w.spieler, bildschirm.breite / 2, bildschirm.hoehe * SPIELER.startY); halteImFeld(w.spieler, w.feld); },
    aktualisiere(dt, w) {   // läuft in jedem nicht pausierten Bild, auch auf Titel und Ende (Effekte laufen aus)
      if (!standAnimation) return;   // noch beim Laden
      spieleAb(abspieler, w.spieler.laeuft ? laufAnimation : standAnimation);   // dieselbe Animation läuft weiter
      darstellung.animation = w.spieler.laeuft ? 'lauf' : 'stand';
      aktualisiereAnimation(abspieler, dt);   // dt = 0: Rahmen bleibt stehen
    },
    zeichne(w) {
      const ctx = bildschirm.ctx;
      ctx.fillStyle = FARBEN.hintergrund;
      ctx.fillRect(0, 0, bildschirm.breite, bildschirm.hoehe);
      zeichneRaster(ctx);
      if (!standRahmen) return;   // noch beim Laden
      const x = Math.round(w.spieler.x), y = Math.round(w.spieler.y);
      ctx.fillStyle = FARBEN.schatten;
      ctx.beginPath();
      ctx.ellipse(x, y, SPIELER.schattenBreite, SPIELER.schattenHoehe, 0, 0, Math.PI * 2);
      ctx.fill();
      zeichneRahmen(ctx, alleRahmen[rahmenName(abspieler)] || standRahmen, x, y, SPIELER.skala, w.spieler.blick);
    },
  };
  return darstellung;
}
