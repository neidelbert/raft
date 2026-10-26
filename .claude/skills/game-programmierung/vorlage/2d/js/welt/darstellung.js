// Darstellung in 2D (Canvas): Bildschirm, Spielfeld, Zeichnen der Welt, Ersatz-Zeichnung für fehlende Bilder.
// Schnittstelle (gleich wie in der 3D-Fassung, main.js kennt nur diese):
//   erstelleDarstellung(dokument, welt) → darstellung = {
//     art: '2d', pixelRatio, zeichenaufrufe (nur 3D, hier 0), modell (nur 3D, hier ''), figur ('atlas' | 'ersatz' | ''),
//     ladeOptionen: Zusatz für ladeAssets (hier: ersatz), nimmAssets(assets), setzeStart(welt),
//     aktualisiere(dt, welt) (Effekte, jedes nicht pausierte Bild), zeichne(welt) (jedes Bild) }
//   Setzt welt.feld beim Start, bei jeder Größenänderung und wenn die Bilder da sind: Die ganze Figur bleibt im Bild
//   und mit dem Kopf unter der Leiste (Feldgrenzen aus Fußpunkt und Größe des Rahmens, nicht aus einer festen Zahl:
//   Eine Figur des Zeichners ist 128 Punkte hoch, die Ersatz-Figur nur 64).
import { erstelleBildschirm } from '../kern/bildschirm.js';
import { zeichneRahmen } from '../kern/animation.js';
import { ersatzBild } from '../kern/bilder.js';
import { SPIEL } from '../config/spiel.js';
import { SPIELER, FARBEN, RASTER, ERSATZ } from '../config/welt.js';
import { setzeSpieler, halteImFeld } from '../regeln/spieler.js';

// Ersatz für den Rahmen „figur“, nur aufgerufen, wenn der Atlas fehlt (bausteine/assets.js).
function baueErsatz() {
  const bild = ersatzBild(ERSATZ.breite, ERSATZ.hoehe, (ctx, b, h) => {
    ctx.fillStyle = ERSATZ.koerper;
    ctx.strokeStyle = ERSATZ.umriss;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(b / 2, h * 0.55, b / 2 - 3, h * 0.43, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }, ERSATZ.aufloesung);
  const a = ERSATZ.aufloesung;
  return { rahmen: { [SPIELER.rahmen]: { bild, x: 0, y: 0, b: bild.width, h: bild.height, ankerX: (ERSATZ.breite / 2) * a, ankerY: (ERSATZ.hoehe - 2) * a, ersatz: true } } };
}

// Ausdehnung des Rahmens um den Fußpunkt in Punkten: links, rechts, oben (Kopf), unten. Ohne Rahmen: Ersatz-Maße.
function ausdehnung(rahmen, skala) {
  if (!rahmen) return { links: ERSATZ.breite / 2, rechts: ERSATZ.breite / 2, oben: ERSATZ.hoehe, unten: 0 };
  return { links: rahmen.ankerX * skala, rechts: (rahmen.b - rahmen.ankerX) * skala, oben: rahmen.ankerY * skala, unten: (rahmen.h - rahmen.ankerY) * skala };
}

export function erstelleDarstellung(dokument, welt) {
  let rahmen = null;
  const leiste = dokument.getElementById('leiste');   // belegt den oberen Rand (auch versteckt gemessen, siehe stil.css)
  function setzeFeld(breite, hoehe) {
    const a = ausdehnung(rahmen, SPIELER.skala), f = welt.feld, luft = SPIELER.rand;
    const oben = Math.max(0, leiste ? leiste.getBoundingClientRect().bottom : 0);
    f.minX = a.links + luft; f.maxX = breite - a.rechts - luft;
    f.minY = oben + a.oben + luft; f.maxY = hoehe - a.unten - luft;
    if (f.maxX < f.minX) f.minX = f.maxX = breite / 2;   // Bildschirm kleiner als die Figur: Mitte statt Zittern
    if (f.maxY < f.minY) f.minY = f.maxY = (oben + hoehe) / 2;
    halteImFeld(welt.spieler, f);
  }
  const bildschirm = erstelleBildschirm(dokument.getElementById('leinwand'), {
    pixelRatioMax: SPIEL.pixelRatioMax,
    beiGroesse(b) { setzeFeld(b.breite, b.hoehe); },
  });

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
    ladeOptionen: { ersatz: baueErsatz },
    nimmAssets(assets) {
      rahmen = assets.rahmen[SPIELER.rahmen] || null;
      if (!rahmen) {   // Atlas da, aber ohne diesen Rahmen (z. B. Bild umbenannt): Ersatz-Figur statt unsichtbarer Figur
        console.warn(`Rahmen „${SPIELER.rahmen}“ fehlt im Atlas: Ersatz-Figur (SPIELER.rahmen in config/welt.js prüfen)`);
        rahmen = baueErsatz().rahmen[SPIELER.rahmen];
      }
      darstellung.figur = rahmen.ersatz ? 'ersatz' : 'atlas';
      setzeFeld(bildschirm.breite, bildschirm.hoehe);
    },
    setzeStart(w) { setzeSpieler(w.spieler, bildschirm.breite / 2, bildschirm.hoehe * SPIELER.startY); halteImFeld(w.spieler, w.feld); },
    aktualisiere() { /* Platz für Effekte (Wackeln, Partikel): laufen in jedem Zustand */ },
    zeichne(w) {
      const ctx = bildschirm.ctx;
      ctx.fillStyle = FARBEN.hintergrund;
      ctx.fillRect(0, 0, bildschirm.breite, bildschirm.hoehe);
      zeichneRaster(ctx);
      if (!rahmen) return;   // noch beim Laden
      const x = Math.round(w.spieler.x), y = Math.round(w.spieler.y);
      ctx.fillStyle = FARBEN.schatten;
      ctx.beginPath();
      ctx.ellipse(x, y, SPIELER.schattenBreite, SPIELER.schattenHoehe, 0, 0, Math.PI * 2);
      ctx.fill();
      zeichneRahmen(ctx, rahmen, x, y, SPIELER.skala, 1);
    },
  };
  return darstellung;
}
