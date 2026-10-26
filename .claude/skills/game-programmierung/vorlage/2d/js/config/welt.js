// Spielwelt in 2D (nur Daten). Einheiten: CSS-Punkte. Alle Werte sind Startwerte zum Ausprobieren.
export const SPIELER = {
  tempo: 220,           // Punkte pro Sekunde bei vollem Daumen-Ausschlag
  wegProPunkt: 60,      // Punkte Weg für einen Spielpunkt (Platzhalter-Regel)
  rand: 6,              // Punkte Luft zwischen Figur und Rand bzw. Leiste (dazu kommt die Größe der Figur selbst)
  startY: 0.75,         // Startort: Anteil der Bildschirmhöhe von oben
  rahmen: 'figur',      // Stand-Bild: Name des Rahmens im Atlas (Bild grafik/figuren/figur.png). Alle Rahmen, die so heißen oder
                        //   so anfangen („figur-lauf-1“ …), bestimmen die Feldgrenzen (größter Ausschlag zählt).
  lauf: 'figur-lauf',   // Animation beim Laufen (Bilder figur-lauf-1 … in grafik/figuren/, Tempo in assets/quellen/atlas.json);
                        //   fehlt sie, bleibt das Stand-Bild
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

// Ersatz-Zeichnungen, wenn der Atlas fehlt: für JEDEN Rahmen des Atlas (Figur, Gegner, Effekte) eine einfache Form in
// derselben Größe und mit demselben Fußpunkt (beides kommt aus dem Manifest), damit der Code nichts merkt und nichts
// unsichtbar wird. Der Gerüst-Test prüft, dass jeder Rahmen und jede Animation einen Ersatz hat.
export const ERSATZ = {
  breite: 48,           // Punkte: Ersatz-Figur, wenn auch das Manifest fehlt (dann sind keine Maße bekannt)
  hoehe: 64,            // Punkte
  aufloesung: 2,        // Pixel pro Punkt (wie die Bilder des Zeichners)
  umriss: '#2b1d2e',    // Umriss (Haus-Stil des Zeichners)
  // Form und Farbe je Rahmen-Name oder Anfang davon („schleim“ gilt für „schleim“, „schleim-1“ …; der längste passende
  // Anfang gewinnt). Formen: 'koerper' (stehendes Oval, für Figuren und Gegner), 'kreis' (für Effekte, Gegenstände).
  formen: {
    figur: { form: 'koerper', farbe: '#f2a541' },
  },
  standard: { form: 'kreis', farbe: '#b8c0c8' },   // für alle anderen Rahmen, bis sie oben eine eigene Form bekommen
};
