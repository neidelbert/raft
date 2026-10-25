// Allgemeine Einstellungen (nur Daten). Jede Zahl hat einen Kommentar.
// „Startwert“ heißt: sinnvoller Anfang, zum Ausprobieren am iPhone gedacht.
export const SPIEL = {
  deltaMax: 0.1,        // längster Zeitschritt in s: Ein Ruckler lässt nichts durch Wände springen
  pixelRatioMax: 2,     // schärfer als 2 kostet auf dem iPhone viel Rechenzeit und sieht kaum besser aus
};

export const LADEN = {
  manifest: 'assets/assets.json',   // Liste aller Assets (werkzeuge/manifest.js schreibt sie)
  zeitgrenze: 4000,     // ms je Asset und fürs Manifest: Manifest + Asset höchstens 8 s, dann Ersatz
};

export const SPEICHER = {
  schluessel: '__NAME__',   // Schlüssel in localStorage: nie ändern, sonst ist der alte Rekord weg
  standard: { version: 1, rekord: 0, ton: true },   // neue Felder hier mit Standardwert eintragen
};

export const RUNDE = {
  dauer: 20,            // s pro Runde (Startwert, Platzhalter-Regel des Gerüsts)
};
