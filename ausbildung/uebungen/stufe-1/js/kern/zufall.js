// Zufall mit Startwert (Seed): gleicher Seed, gleiche Zahlen. Gibt eine Funktion zurück, die 0 bis <1 liefert.
export function erstelleZufall(seed = Date.now()) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
