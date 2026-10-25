// Steuerung und Ton (nur Daten).
export const JOYSTICK = {
  radius: 50,           // Punkte bis zum vollen Ausschlag
  totzone: 0.12,        // Anteil des Radius ohne Wirkung (Zittern des Daumens)
  knopfRadius: 22,      // Daumen-Kreis der Anzeige in Punkten
};

export const TON = {
  lautstaerke: 0.6,     // Gesamtlautstärke 0 … 1
  mindestAbstand: 0.05, // s: derselbe Klang nicht öfter (viele Tipps auf einmal)
};

// Klänge per Code (bausteine/ton.js). Gibt es eine Sound-Datei mit demselben Namen im Manifest
// (assets/quellen/sounds.json → werkzeuge/sounds.js), spielt die Datei, sonst dieser Klang als Ersatz.
export const KLAENGE = {
  start: { frequenz: 440, dauer: 0.12, art: 'triangle', laut: 0.3, gleiten: 220 },   // Hz, s, Lautstärke, Hz bis zum Ende
  ende: { frequenz: 330, dauer: 0.35, art: 'square', laut: 0.2, gleiten: -180 },
};
