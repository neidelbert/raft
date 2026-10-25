// Allgemeine Einstellwerte für Übung 7 (nur Daten, jede Zahl kommentiert). Längen in Metern (Three.js-Einheiten).
export const SPIEL = {
  deltaMax: 0.1,           // Sekunden: längster Zeitschritt pro Bild, verhindert Sprünge nach Rucklern
  pixelRatioMax: 2,        // höchste Pixel-Ratio: schärfer bringt auf dem iPhone kaum etwas, kostet aber Leistung
  kantenglaettung: true,   // antialias; bei Ruckeln am iPhone zuerst ausschalten
};

export const FARBEN = {
  himmel: 0x8fd3f0,        // Hintergrund und Nebel (Horizont verschwimmt, Wasserrand unsichtbar)
  himmelLicht: 0xdff4ff,   // HemisphereLight von oben
  bodenLicht: 0x1d5b7a,    // HemisphereLight von unten (Wasser färbt die Schattenseiten)
  sonne: 0xffffff,         // DirectionalLight
  wasser: 0x2a8fc4,        // Wasserfläche
  schatten: 0x0b3550,      // dunkle Fläche unter dem Boot (statt echter Schatten)
};

export const LICHT = {
  himmelStaerke: 1.6,      // Helligkeit des Umgebungslichts; Wert für Lukas zum Testen
  sonnenStaerke: 1.8,      // Helligkeit der Sonne; Wert für Lukas zum Testen
  sonnenRichtung: [6, 7, 2],  // Sonne rechts oben, leicht vorn: Bojen hell, Wellenkanten sichtbar (nur die Richtung zählt)
};

export const NEBEL = {
  nah: 22,                 // Meter vor der Kamera: ab hier beginnt der Dunst
  fern: 48,                // Meter: ab hier nur noch Himmelsfarbe (Wasser ist 80 m breit, Rand bleibt verborgen)
};
