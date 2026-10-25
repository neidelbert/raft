// Darstellung in 2D (Canvas): Bildschirm, Spielfeld, Zeichnen der Welt, Ersatz-Zeichnung für fehlende Bilder.
// Schnittstelle (gleich wie in der 3D-Fassung, main.js kennt nur diese):
//   erstelleDarstellung(dokument, welt) → darstellung = {
//     art: '2d', pixelRatio, zeichenaufrufe (nur 3D, hier 0), modell (nur 3D, hier ''),
//     ladeOptionen: Zusatz für ladeAssets (hier: ersatz), nimmAssets(assets), setzeStart(welt),
//     aktualisiere(dt, welt) (Effekte, jedes nicht pausierte Bild), zeichne(welt) (jedes Bild) }
//   Setzt welt.feld beim Start und bei jeder Größenänderung (Figur bleibt im Bild).
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
  return { rahmen: { [SPIELER.rahmen]: { bild, x: 0, y: 0, b: bild.width, h: bild.height, ankerX: (ERSATZ.breite / 2) * a, ankerY: (ERSATZ.hoehe - 2) * a } } };
}

export function erstelleDarstellung(dokument, welt) {
  let rahmen = null;
  const bildschirm = erstelleBildschirm(dokument.getElementById('leinwand'), {
    pixelRatioMax: SPIEL.pixelRatioMax,
    beiGroesse(b) {
      const f = welt.feld;
      f.minX = SPIELER.rand; f.minY = SPIELER.rand * 2; f.maxX = b.breite - SPIELER.rand; f.maxY = b.hoehe - SPIELER.rand;
      halteImFeld(welt.spieler, f);
    },
  });

  function zeichneRaster(ctx) {
    ctx.strokeStyle = FARBEN.raster;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = RASTER.abstand; x < bildschirm.breite; x += RASTER.abstand) { ctx.moveTo(x, 0); ctx.lineTo(x, bildschirm.hoehe); }
    for (let y = RASTER.abstand; y < bildschirm.hoehe; y += RASTER.abstand) { ctx.moveTo(0, y); ctx.lineTo(bildschirm.breite, y); }
    ctx.stroke();
  }

  return {
    art: '2d',
    get pixelRatio() { return bildschirm.pixelRatio; },
    zeichenaufrufe: 0,
    modell: '',
    ladeOptionen: { ersatz: baueErsatz },
    nimmAssets(assets) { rahmen = assets.rahmen[SPIELER.rahmen] || null; },
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
}
