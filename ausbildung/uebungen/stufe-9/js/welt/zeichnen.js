// Zeichnet die Welt: Wiese (gekachelt), Schatten, Münzen, Held, Explosionen, Joystick. Nur zeichnen, keine Regeln.
// Keine neuen Objekte pro Bild: Rahmen werden über ihren Namen im Atlas nachgeschlagen.
import { BODEN, FARBEN } from '../config/spiel.js';
import { HELD } from '../config/held.js';
import { MUENZEN, EXPLOSION } from '../config/gegenstaende.js';
import { JOYSTICK } from '../config/steuerung.js';
import { zeichneRahmen, rahmenName } from '../kern/animation.js';
import { zeichneJoystick } from '../steuerung/joystick.js';

const VOLL = Math.PI * 2;

// Boden: Kacheln von oben links; das Ersatzbild (8 × 8 in Ersatzfarbe) wird genauso gestreckt und ergibt eine Fläche.
// Ohne Manifest gibt es gar kein Bild: dann eine Fläche in der Ersatzfarbe.
function zeichneBoden(ctx, bild, breite, hoehe) {
  if (!bild) { ctx.fillStyle = BODEN.ersatzFarbe; ctx.fillRect(0, 0, breite, hoehe); return; }
  const k = BODEN.kachel;
  for (let y = 0; y < hoehe; y += k) for (let x = 0; x < breite; x += k) ctx.drawImage(bild, x, y, k, k);
}

function zeichneSchatten(ctx, x, y, halbeBreite, halbeHoehe) {
  ctx.fillStyle = FARBEN.schatten;
  ctx.beginPath();
  ctx.ellipse(x, y, halbeBreite, halbeHoehe, 0, 0, VOLL);
  ctx.fill();
}

export function zeichneWelt(ctx, bildschirm, welt) {
  const { breite, hoehe } = bildschirm, { assets, held, muenzen, explosionen, joystick } = welt;
  zeichneBoden(ctx, assets.bilder[BODEN.bild], breite, hoehe);

  const muenzeY = hoehe * MUENZEN.hoeheAnteil;
  for (let i = 0; i < muenzen.length; i++) {
    const m = muenzen[i], x = breite * m.anteilX;
    const y = muenzeY + Math.sin(welt.zeit * MUENZEN.schwebTempo + i) * MUENZEN.schweben;
    zeichneSchatten(ctx, x, muenzeY + MUENZEN.schattenAbstand, MUENZEN.schattenBreite, MUENZEN.schattenHoehe);
    zeichneRahmen(ctx, assets.rahmen[rahmenName(m.abspieler)], x, y, MUENZEN.skala, 1);
  }

  zeichneSchatten(ctx, held.x, held.y, HELD.schattenBreite, HELD.schattenHoehe);
  zeichneRahmen(ctx, assets.rahmen[rahmenName(held.abspieler)], held.x, held.y, HELD.skala, held.blick);

  for (let i = 0; i < explosionen.liste.length; i++) {
    const e = explosionen.liste[i];
    if (e.aktiv) zeichneRahmen(ctx, assets.rahmen[rahmenName(e.abspieler)], e.x, e.y, EXPLOSION.skala, 1);
  }
  zeichneJoystick(ctx, joystick, JOYSTICK);
}
