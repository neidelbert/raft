// Regeln für den Held (ohne DOM, mit node testbar): laufen nach links/rechts, Blickrichtung, Lauf- oder Steh-Animation.
// held = { x, y (Fußpunkt in Punkten), blick (1 rechts, −1 links), laeuft, anteil (0 … 1 Ausschlag),
//          animation (Name), abspieler (bausteine/animation.js) }
import { erstelleAbspieler, spieleAb, aktualisiereAnimation } from '../kern/animation.js';
import { holeAnimation } from '../kern/assets.js';

export function erstelleHeld() {
  return { x: 0, y: 0, blick: 1, laeuft: false, anteil: 0, animation: '', abspieler: erstelleAbspieler() };
}

// Fußpunkt auf den Boden setzen (Start und nach Größenänderung); x bleibt im erlaubten Bereich.
export function stelleHeldAufBoden(held, breite, hoehe, cfg, mitte = false) {
  held.y = Math.round(hoehe * cfg.bodenAnteil);
  held.x = mitte ? breite / 2 : Math.min(Math.max(held.x, cfg.rand), Math.max(cfg.rand, breite - cfg.rand));
}

// eingabeX: −1 … 1 vom Joystick. Ohne Eingabe steht er sofort (wie beim Loslassen erwartet).
export function bewegeHeld(held, eingabeX, dt, breite, cfg) {
  held.anteil = Math.abs(eingabeX);
  held.laeuft = held.anteil > 0;
  if (eingabeX > 0) held.blick = 1;
  else if (eingabeX < 0) held.blick = -1;   // ohne Eingabe bleibt der letzte Blick
  held.x = Math.min(Math.max(held.x + eingabeX * cfg.tempo * dt, cfg.rand), Math.max(cfg.rand, breite - cfg.rand));
}

// Bilder pro Sekunde beim Laufen: Gehen (kleiner Ausschlag) bis Rennen (voller Ausschlag), Meldung des Zeichners.
export function laufBps(anteil, cfg) {
  return cfg.bpsGehen + (cfg.bpsRennen - cfg.bpsGehen) * Math.min(1, anteil);
}

export function aktualisiereHeldAnimation(held, assets, dt, cfg, namen) {
  const lauf = assets.animationen[namen.laufen];
  if (held.laeuft && lauf) {
    spieleAb(held.abspieler, lauf);
    held.animation = namen.laufen;
    aktualisiereAnimation(held.abspieler, dt, laufBps(held.anteil, cfg) / lauf.bps);
  } else {
    spieleAb(held.abspieler, holeAnimation(assets, namen.stehen));
    held.animation = namen.stehen;
    aktualisiereAnimation(held.abspieler, dt);
  }
}
