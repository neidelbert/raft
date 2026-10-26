// Spielwelt in 2D (nur Daten). Einheiten: CSS-Punkte. Alle Werte sind Startwerte zum Ausprobieren.
export const SPIELER = {
  tempo: 220,           // Punkte pro Sekunde bei vollem Daumen-Ausschlag
  wegProPunkt: 60,      // Punkte Weg für einen Spielpunkt (Platzhalter-Regel)
  rand: 6,              // Punkte Luft zwischen Figur und Rand bzw. Leiste (dazu kommt die Größe der Figur selbst)
  startY: 0.75,         // Startort: Anteil der Bildschirmhöhe von oben
  rahmen: 'figur',      // Name des Rahmens im Atlas (assets/quellen/atlas.json, Bild grafik/figuren/figur.png)
  skala: 0.5,           // Pixel → Punkte: Bilder des Zeichners sind doppelt aufgelöst (256 px → 128 Punkte, etwa 1/5 der
                        //   Bildschirmhöhe). Kleiner geht (0.35), größer wird unscharf. Frage an Lukas: Wie groß soll die Figur sein?
  schattenBreite: 22,   // halbe Breite des Bodenschattens in Punkten
  schattenHoehe: 7,     // halbe Höhe des Bodenschattens in Punkten
};

// Wann berührt die Figur etwas (Einsammeln, Treffer)? Kreis um die Körpermitte, nicht um den Fuß: Sonst liegt eine
// Münze sichtbar hinter dem Körper und zählt nicht. regeln/spieler.js → beruehrt(spieler, x, y, BERUEHRUNG).
export const BERUEHRUNG = {
  hoehe: 30,            // Punkte über dem Fußpunkt: Mitte des Berührungs-Kreises (für eine Figur von etwa 120 Punkten)
  radius: 40,           // Punkte: so nah muss die Mitte des Dings an diese Mitte. Frage an Lukas: großzügig oder knapp?
};

export const FARBEN = {
  hintergrund: '#2f6b46',               // Boden, bis ein Spiel eigene Bilder bekommt
  raster: 'rgba(255, 255, 255, 0.06)',  // Hilfslinien, damit Bewegung sichtbar ist
  schatten: 'rgba(0, 0, 0, 0.25)',      // Bodenschatten unter der Figur
};

export const RASTER = {
  abstand: 64,          // Punkte zwischen zwei Hilfslinien
};

// Ersatz-Zeichnung, wenn der Atlas fehlt (gleicher Name und Fußpunkt wie das Bild, damit der Code nichts merkt).
export const ERSATZ = {
  breite: 48,           // Punkte (wie das Bild bei skala 0.5)
  hoehe: 64,            // Punkte
  aufloesung: 2,        // Pixel pro Punkt (wie die Bilder des Zeichners)
  koerper: '#f2a541',   // Füllfarbe
  umriss: '#2b1d2e',    // Umriss (Haus-Stil des Zeichners)
};
