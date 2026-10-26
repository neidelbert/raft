// Spielwelt in 3D (nur Daten). Einheiten: Meter. Alle Werte sind Startwerte zum Ausprobieren.
// Der Spieler läuft in der Ebene: x nach rechts, y der Regeln ist z in Three.js (Joystick „oben“ = −z, vom Bildschirm weg).
export const SPIELER = {
  tempo: 5,             // Meter pro Sekunde bei vollem Daumen-Ausschlag
  wegProPunkt: 1.5,     // Meter Weg für einen Spielpunkt (Platzhalter-Regel)
  modell: 'spieler',    // Name des Modells im Manifest (assets/quellen/modelle/spieler.js → werkzeuge/modell.js)
  ersatzGroesse: [0.8, 1.6, 0.8],   // Breite, Höhe, Tiefe der Ersatz-Box in Metern, wenn kein Modell da ist
  ersatzFarbe: 0xf2a541,            // Farbe der Ersatz-Box
  schattenRadius: 0.6,  // Meter: dunkle Kreisfläche statt echter Schatten (spart Rechenzeit)
  schattenDeckkraft: 0.3, // 0 … 1
};

// Wann berührt die Figur etwas (Einsammeln, Treffer)? Kreis in der Ebene um den Standort (3D: y der Regeln ist z,
// eine Höhe über dem Fuß gibt es hier nicht). regeln/spieler.js → beruehrt(spieler, x, y, BERUEHRUNG).
export const BERUEHRUNG = {
  hoehe: 0,             // Meter Versatz der Kreismitte in y der Regeln (in 3D 0: y ist dort die Tiefe, nicht oben)
  radius: 1,            // Meter: so nah muss die Mitte des Dings sein. Frage an Lukas: großzügig oder knapp?
};

export const FELD = {
  breite: 30,           // Meter (x)
  tiefe: 30,            // Meter (z)
  rand: 1,              // Meter Abstand der Figur zum Rand
};

export const BODEN = {
  bild: 'kachel',       // Name des Boden-Bildes im Manifest (grafik/boden/kachel.png, einzeln)
  kachelMeter: 3,       // Meter pro Wiederholung der Kachel
  farbe: 0x4f8f45,      // Bodenfarbe, falls nicht einmal das Manifest lädt (sonst die Ersatzfarbe aus dem Manifest)
};

export const KAMERA = {
  sicht: 55,            // Blickwinkel senkrecht in Grad
  hoehe: 11,            // Meter über der Figur
  abstand: 9,           // Meter hinter der Figur (+z)
  nachziehen: 5,        // Tempo des weichen Nachziehens (1/s): anteil = 1 − e^(−nachziehen · dt)
  nah: 0.1,             // Meter: nächste sichtbare Entfernung
  fern: 120,            // Meter: weiteste sichtbare Entfernung
};

export const LICHT = {
  himmel: 0xbfe3ff,     // Farbe des Himmelslichts (oben)
  bodenLicht: 0x3d5a2a, // Farbe des Lichts von unten
  staerke: 1.6,         // Stärke des Himmelslichts
  sonne: 1.8,           // Stärke der Sonne
  sonneRichtung: [6, 12, 4],   // Richtung der Sonne (x, y, z), Licht von oben links
};

export const DREI = {
  hintergrund: 0x9fd4f0, // Himmelsfarbe, auch für den Nebel
  nebelNah: 25,         // Meter: ab hier beginnt der Nebel
  nebelFern: 60,        // Meter: ab hier ist alles Nebel (verdeckt den Rand des Bodens)
  antialias: true,      // Kantenglättung; bei Ruckeln zuerst ausschalten
  zeichenaufrufeMax: 20, // Grenze für den Test (Zeichenaufrufe pro Bild); das Gerüst braucht 3–4
};
