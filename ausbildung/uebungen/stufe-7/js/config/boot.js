// Einstellwerte des Boots (nur Daten, jede Zahl kommentiert).
export const BOOT = {
  tempo: 6,                // Meter pro Sekunde bei vollem Ausschlag; Wert für Lukas zum Testen
  drehTempo: 7,            // pro Sekunde: wie schnell sich der Bug zur Fahrtrichtung dreht
  radius: 0.9,             // Meter: Kreis um das Boot für die Berührung mit Bojen
  schaukeln: 0.06,         // Bogenmaß: so weit kippt das Boot mit den Wellen zur Seite
  schaukelTempo: 1.7,      // pro Sekunde: Takt des Schaukelns
  tiefgang: 0.05,          // Meter: so tief liegt der Rumpf im Wasser
  schattenRadius: 1.3,     // Meter: dunkle Fläche unter dem Boot
  schattenDeckkraft: 0.35, // 0…1
  farben: {
    rumpf: 0xe8553a,       // Rot-Orange
    deck: 0xf2d29b,        // helles Holz
    kabine: 0xffffff,      // Weiß
    mast: 0x7a4a26,        // dunkles Holz
    segel: 0xfff4dc,       // Cremeweiß
  },
};
