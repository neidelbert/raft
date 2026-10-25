// Allgemeine Einstellwerte für Übung 4 (nur Daten, jede Zahl kommentiert).
export const SPIEL = {
  deltaMax: 0.1,           // Sekunden: längster Zeitschritt pro Bild, verhindert Sprünge nach Rucklern
  pixelRatioMax: 2,        // höchste Pixel-Ratio: schärfer bringt auf dem iPhone kaum etwas, kostet aber Leistung
  messGlaettung: 0.05,     // Anteil des neuen Messwerts im gleitenden Mittel von schrittMs (klein = ruhiger)
  punkteProSekunde: 1,     // Punkte pro überlebter Sekunde (aus dem Auftrag: Punkte = überlebte Sekunden)
};

// Speicherstand in localStorage. Neue Felder bekommen hier einen Standardwert, bei neuem Format version hochzählen.
export const SPEICHER = {
  schluessel: 'uebung-4',  // Name in localStorage (aus dem Auftrag)
  standard: {
    version: 1,            // Format des Speicherstands
    rekord: 0,             // beste Punktzahl bisher (ganze Zahl, nie negativ)
  },
};

// Spieltexte (Deutsch). {punkte}/{rekord} werden ersetzt.
export const TEXTE = {
  titel: 'Tippen zum Starten',
  rekord: 'Rekord: {rekord}',
  ende: 'Ende',
  punkteEnde: 'Punkte: {punkte}',
  neueRunde: 'Tippen für neue Runde',
  anzeigePunkte: 'Punkte {punkte}',
  anzeigeLeben: 'Leben {leben}',
};

export const FARBEN = {
  hintergrund: '#1d2a22',  // dunkles Grün als Boden; Wert für Lukas zum Testen
  schatten: 'rgba(0, 0, 0, 0.35)',       // Schatten unter der Figur
  ersatzFigur: '#ffb43c',  // Ersatzkreis, falls figur.png fehlt
  ersatzUmriss: '#3a2a10', // Umriss des Ersatzkreises
  joystickRing: 'rgba(255, 255, 255, 0.35)',  // äußerer Ring des Joysticks
  joystickKnopf: 'rgba(255, 255, 255, 0.6)',  // Daumen-Knopf des Joysticks
  ersatzGegner: '#7a3fb0', // Ersatzkreis, falls gegner.png fehlt
};

// Bild aus grafik/grafik.json
export const BILDER = {
  figur: 'figuren/figur',
  gegner: 'gegner/gegner',
};
