// Performance-Budget (freigegeben von Lukas am 24.10.2026, Vorlage berichte/2026-10-24-technik-ordnerstruktur.md).
// Zielgerät: iPhone ab etwa iPhone 11, Safari. Nur Daten, keine Logik.
// Wird eine Grenze überschritten, meldet der Debugger es; der Techniker schlägt eine Lösung vor.

export const LEISTUNG = {
  // Bildschärfe: höchstens 2 Bildpunkte pro Bildschirmpunkt (iPhone hat 3, kostet sonst viel Leistung).
  pixelRatioMax: 2,

  // Bildrate: Ziel 60, nie unter 30 Bilder pro Sekunde.
  bildrateZiel: 60,
  bildrateMin: 30,

  // Längster Zeitschritt pro Bild in Sekunden (fängt große Sprünge nach Tab-Wechsel ab).
  deltaMax: 0.1,

  // Zeichenaufrufe pro Bild (so oft „malt“ das Handy pro Bild). Floßteile werden zusammengefasst.
  zeichenaufrufeMax: 100,

  // Sichtbare Dreiecke insgesamt (Low-Poly-Grenze).
  dreieckeMax: 100000,

  // Licht: höchstens 2 Lichter, keine echten Schatten (nur dunkler Fleck unter Figur und Hai).
  lichterMax: 2,
  schatten: false,

  // Texturen: Kantenlänge je Bild in Pixeln und Grafikspeicher zusammen in MB.
  texturKanteMax: 1024,
  grafikspeicherMaxMB: 20,

  // Gleichzeitig in der Welt (Teile werden wiederverwendet statt neu erzeugt).
  haieMax: 3,
  treibgutMax: 50,

  // Ladegröße ohne Three.js in MB und Startzeit über Mobilfunk in Sekunden.
  ladegroesseMaxMB: 2,
  startzeitMaxS: 3,

  // Sound: je Effekt in KB, Formate, die in Safari sicher laufen.
  soundMaxKB: 100,
  soundFormate: ['m4a', 'mp3'],

  // Arbeitsspeicher in MB (Safari schließt sonst die Seite).
  arbeitsspeicherMaxMB: 150,

  // Spielstand im Handy-Speicher: Name und Größe in MB. Neue Felder bekommen Standardwerte.
  speicherName: 'raft3d-v1',
  spielstandMaxMB: 1,
};
