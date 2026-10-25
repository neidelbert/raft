// window.spiel: nur zum Lesen für Tests (der Spielcode liest es nie). Mit ?test=1 zusätzlich spiel.test.
// Felder (Auftrag Stufe 9): bereit, zustand ('laden'|'start'|'laeuft'), fortschritt (0 … 1),
//   assets { geladen, ersetzt, fehlend }, held { x, animation, rahmen (Index), rahmenName, blick },
//   explosionen (Anzahl aktiv), sounds { abgespielt, dekodiert }, atlas { breite, hoehe }.
import { rahmenName } from './kern/animation.js';
import { LADEN } from './config/spiel.js';

const LEER = { geladen: [], ersetzt: [], fehlend: [] };

export function erstelleTestSchnittstelle({ automat, lade, welt, zaehler, mitTest, beiExplosion }) {
  const { held, explosionen } = welt;
  const spiel = {
    bereit: false,
    get zustand() { return automat.name; },
    get fortschritt() { return lade.fortschritt; },
    get assets() { return welt.assets ? welt.assets.status : LEER; },
    held: {
      get x() { return held.x; },
      get animation() { return held.animation; },
      get rahmen() { return held.abspieler.index; },
      get rahmenName() { return rahmenName(held.abspieler); },
      get blick() { return held.blick; },
    },
    get explosionen() { return explosionen.aktiv; },
    sounds: {
      get abgespielt() { return zaehler.abgespielt; },
      get dekodiert() { return welt.assets ? welt.assets.dekodiert : 0; },
    },
    atlas: {
      get breite() { return welt.assets?.atlanten[LADEN.atlas]?.breite ?? 0; },
      get hoehe() { return welt.assets?.atlanten[LADEN.atlas]?.hoehe ?? 0; },
    },
  };
  if (mitTest) spiel.test = { explosion: (x, y) => beiExplosion(x, y) };
  return spiel;
}
