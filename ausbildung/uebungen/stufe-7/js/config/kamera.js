// Einstellwerte der Kamera (nur Daten, jede Zahl kommentiert).
export const KAMERA = {
  sichtwinkel: 50,         // Grad, senkrechter Bildwinkel (Hochformat)
  nah: 0.5,                // Meter: näher wird nicht gezeichnet
  fern: 80,                // Meter: weiter wird nicht gezeichnet (Nebel endet vorher)
  versatzY: 8,             // Meter über dem Boot; Wert für Lukas zum Testen
  versatzZ: 9,             // Meter hinter dem Boot (+z, zum Spieler hin): schräg von oben
  folgeTempo: 4,           // pro Sekunde: wie schnell die Kamera nachzieht (höher = straffer); Wert für Lukas zum Testen
  blickHoehe: 0.3,         // Meter über der Bootsmitte: dorthin schaut die Kamera
};
