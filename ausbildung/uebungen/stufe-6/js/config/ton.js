// Einstellwerte für den Ton per WebAudio (nur Daten, jede Zahl kommentiert). Keine Ton-Dateien nötig.
export const TON = {
  lautstaerke: 0.5,        // Gesamtlautstärke 0 bis 1; Wert für Lukas zum Testen
  mindestAbstand: 0.05,    // Sekunden: derselbe Ton höchstens 20-mal pro Sekunde (sonst Lärm)
};

// Einzelne Töne: frequenz (Hz), dauer (s), art (Wellenform), laut (0–1), gleiten (Hz bis zum Ende, + hoch, − runter).
export const KLAENGE = {
  treffer: { frequenz: 180, dauer: 0.18, art: 'square', laut: 0.25, gleiten: -110 },   // tief und fallend
  stern: { frequenz: 880, dauer: 0.14, art: 'triangle', laut: 0.3, gleiten: 660 },     // hoch und steigend
};
