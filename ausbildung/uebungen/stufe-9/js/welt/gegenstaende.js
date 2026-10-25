// Münzen (drehen sich in Schleife) und Explosionen (laufen einmal ab, dann frei). Fester Vorrat: keine neuen
// Objekte während des Spiels. Ohne DOM (mit node testbar).
// muenzen = [{ anteilX, abspieler }]; explosionen = { liste: [{ aktiv, x, y, abspieler }], aktiv (Anzahl) }
import { erstelleAbspieler, spieleAb, aktualisiereAnimation } from '../kern/animation.js';

export function erstelleMuenzen(cfg) {
  return cfg.orteX.map((anteilX) => ({ anteilX, abspieler: erstelleAbspieler() }));
}

// Erst nach dem Laden bekannt: die Animation. Jede Münze beginnt etwas später (versatz), so drehen sie nicht im Takt.
export function starteMuenzen(muenzen, animation, versatz) {
  muenzen.forEach((m, i) => {
    spieleAb(m.abspieler, animation, true);
    if (animation) aktualisiereAnimation(m.abspieler, i * versatz);
  });
}

export function aktualisiereMuenzen(muenzen, dt) {
  for (let i = 0; i < muenzen.length; i++) aktualisiereAnimation(muenzen[i].abspieler, dt);
}

export function erstelleExplosionen(max) {
  const liste = [];
  for (let i = 0; i < max; i++) liste.push({ aktiv: false, x: 0, y: 0, abspieler: erstelleAbspieler() });
  return { liste, aktiv: 0 };
}

// Gibt false zurück, wenn kein Platz frei ist oder es keine Animation gibt.
export function starteExplosion(explosionen, x, y, animation) {
  if (!animation) return false;
  const frei = explosionen.liste.find((e) => !e.aktiv);
  if (!frei) return false;
  frei.aktiv = true;
  frei.x = x;
  frei.y = y;
  spieleAb(frei.abspieler, animation, true);
  explosionen.aktiv++;
  return true;
}

// Einmal ablaufen lassen: „fertig“ → Platz wieder frei.
export function aktualisiereExplosionen(explosionen, dt) {
  const liste = explosionen.liste;
  for (let i = 0; i < liste.length; i++) {
    const e = liste[i];
    if (e.aktiv && aktualisiereAnimation(e.abspieler, dt)) { e.aktiv = false; explosionen.aktiv--; }
  }
}
