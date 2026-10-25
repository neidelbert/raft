// Allgemeine Einstellungen der Übungsseite (nur Daten).
export const SPIEL = {
  deltaMax: 0.1,        // längster Zeitschritt in s (Ruckler lassen nichts springen)
  pixelRatioMax: 2,     // schärfer als 2 kostet auf dem iPhone viel und sieht kaum besser aus
};

export const LADEN = {
  manifest: 'assets/assets.json',   // Liste aller Assets (werkzeuge/manifest.js)
  zeitgrenze: 4000,     // ms je Asset (auch fürs Manifest): Manifest + Asset höchstens 8 s, dann Ersatz
  atlas: 'spiel',       // Name des Atlas (assets/quellen/atlas.json), für die Test-Schnittstelle
};

export const BODEN = {
  kachel: 256,          // Kantenlänge einer Wiesen-Kachel in Punkten (Bild 512 px, doppelt aufgelöst)
  bild: 'wiese',        // Name des Boden-Bildes im Manifest
  ersatzFarbe: '#6bbf4a', // Wiese, falls nicht einmal das Manifest lädt (sonst kommt die Ersatzfarbe aus dem Manifest)
};

export const FARBEN = {
  schatten: 'rgba(0, 40, 0, 0.28)',   // Bodenschatten unter Held und Münzen
};
