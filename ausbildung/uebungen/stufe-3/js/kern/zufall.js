// Wiederholbarer Zufall. erstelleZufall(seed) gibt eine Funktion zurück, die Zahlen von 0 bis unter 1 liefert.
// Gleicher Seed → gleiche Folge (Tests mit ?seed=42). Ohne Seed: Startwert aus der Uhr.
export function erstelleZufall(seed = Date.now()) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}
