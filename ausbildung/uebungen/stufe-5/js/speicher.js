// Rekord lesen und schreiben, ohne dass das Spiel abstürzen kann.
// Schnittstelle: ladeRekord() → ganze Zahl ≥ 0 (0 bei fehlendem, kaputtem oder gesperrtem Speicher),
//                speichereRekord(zahl) → true, wenn gespeichert.
// Warum try/catch: Im privaten Modus (ältere Safari-Versionen, gesperrte Website-Daten) wirft schon der Zugriff
// auf localStorage oder setItem einen Fehler. Ohne Abfangen bricht das ganze Modul beim Start ab.
import { SPEICHER } from './config/spiel.js';

let schonGewarnt = false; // im privaten Modus nur einmal warnen, nicht bei jedem Pilz

export function ladeRekord() {
  try {
    const wert = JSON.parse(window.localStorage.getItem(SPEICHER.schluessel));
    return Number.isInteger(wert) && wert > 0 ? wert : 0;
  } catch (fehler) {
    console.warn('Rekord nicht lesbar, starte mit 0:', fehler.message);
    return 0;
  }
}

export function speichereRekord(zahl) {
  try {
    window.localStorage.setItem(SPEICHER.schluessel, JSON.stringify(zahl));
    return true;
  } catch (fehler) {
    if (!schonGewarnt) console.warn('Rekord nicht gespeichert (privater Modus?):', fehler.message);
    schonGewarnt = true;
    return false;
  }
}
