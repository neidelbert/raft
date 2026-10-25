// Maße der Low-Poly-Modelle in Metern (nur Daten). Das Boot zeigt mit dem Bug nach −z.
export const BOOT_MODELL = {
  // Umriss des Rumpfs von oben: Punkte [x, z]; Bug vorn spitz.
  umriss: [[-0.55, 1.0], [0.55, 1.0], [0.68, -0.2], [0, -1.35], [-0.68, -0.2]],
  rumpfHoehe: 0.45,        // Höhe des Rumpfs
  rumpfUnten: -0.2,        // Unterkante des Rumpfs (unter der Wasserlinie)
  deckDicke: 0.06,         // Dicke der Deckplatte
  deckEinzug: 0.86,        // Anteil: Deck ist etwas kleiner als der Rumpf, der Rand bleibt rot
  kabine: { breite: 0.7, hoehe: 0.45, tiefe: 0.6, z: 0.35 },   // weiße Kabine hinten
  mast: { radius: 0.045, hoehe: 1.5, z: -0.25, ecken: 5 },      // Mast vor der Kabine
  segel: { breite: 0.05, hoehe: 1.05, tiefe: 0.75 },            // Segel hinter dem Mast (z wächst nach hinten)
  schattenEcken: 16,       // Ecken der dunklen Kreisfläche unter dem Boot
  schattenAbstand: 0.08,   // Meter über der Wasserlinie, damit die Fläche nicht im Wasser verschwindet
};

export const BOJE_MODELL = {
  koerper: { radiusOben: 0.28, radiusUnten: 0.4, hoehe: 0.5, ecken: 8 },  // roter Schwimmkörper
  streifen: { radius: 0.33, hoehe: 0.14, y: 0.12 },                        // weißer Ring um den Körper (y = Abstand der Mitte von oben; etwas dicker als der Körper dort)
  spitze: { radius: 0.14, hoehe: 0.4, ecken: 6 },                          // gelbe Kegelspitze oben
  tiefgang: 0.12,          // Meter: so tief liegt die Boje im Wasser
};
