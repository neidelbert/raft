// Baustein „zufall“: wiederholbarer Zufall mit Startwert (Seed).
// Wofür: alles Zufällige im Spiel (Gegner-Orte, Streuung, Partikel). Gleicher Seed → gleiche Folge, damit Tests mit
//   ?seed=42 immer gleich ablaufen. Effekte (Wackeln, Partikel) bekommen einen eigenen Zufall (seed + 1), damit sie
//   die Folge des Spiels nicht verschieben. Reine Rechnung, mit node testbar. Nicht für Sicherheit oder Glücksspiel.
// Schnittstelle:
//   erstelleZufall(seed = Date.now()) → zufall(): Zahl von 0 bis unter 1 (lineare Kongruenz, 32 Bit).
//   seedAusAdresse(suche = location.search) → Zahl oder undefined (liest ?seed=…; ohne gültige Zahl undefined).
//   zwischen(zufall, min, max) → Zahl von min bis unter max.
// Beispiel:
//   import { erstelleZufall, seedAusAdresse, zwischen } from './kern/zufall.js';
//   const seed = seedAusAdresse();
//   const zufall = erstelleZufall(seed);                                  // ohne ?seed: jedes Mal anders
//   const effektZufall = erstelleZufall(seed === undefined ? undefined : seed + 1);
//   const tempo = zwischen(zufall, GEGNER.tempoMin, GEGNER.tempoMax);

export function erstelleZufall(seed = Date.now()) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export function seedAusAdresse(suche = globalThis.location?.search ?? '') {
  const wert = Number.parseInt(new URLSearchParams(suche).get('seed'), 10);
  return Number.isFinite(wert) ? wert : undefined;
}

export function zwischen(zufall, min, max) { return min + zufall() * (max - min); }
