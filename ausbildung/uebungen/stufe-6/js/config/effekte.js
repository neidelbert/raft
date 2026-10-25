// Einstellwerte für Rückmeldungen: Wackeln, rotes Aufblitzen, Partikel (nur Daten, jede Zahl kommentiert).
// Wie stark ein Effekt wirkt, entscheidet Lukas. Stärke 0 schaltet einen Effekt ab.
export const WACKELN = {
  trefferStaerke: 0.7,     // so viel kommt pro Treffer dazu (0 = aus, höchstens 1); Wert für Lukas zum Testen
  abklingen: 2.5,          // pro Sekunde weniger: von 1 auf 0 in 0,4 s (Auftrag: unter 1 s)
  versatzMax: 9,           // Punkte: größter Versatz des Bildes bei voller Stärke; Wert für Lukas zum Testen
};

export const BLITZ = {
  dauer: 0.2,              // Sekunden: so lange leuchtet die Figur nach einem Treffer rot; Wert für Lukas zum Testen
  deckkraft: 0.75,         // Deckkraft der roten Farbe ganz am Anfang (0 = aus, 1 = ganz rot)
  farbe: '#ff2a2a',        // Farbe des Aufblitzens
};

export const PARTIKEL = {
  max: 150,                // höchstens so viele Partikel gleichzeitig (fester Vorrat, iPhone-Grenze laut Handbuch ≈ 200)
  proStern: 18,            // so viele Partikel pro eingesammeltem Stern; Wert für Lukas zum Testen
  tempoMin: 60,            // Punkte pro Sekunde: langsamster Start
  tempoMax: 190,           // Punkte pro Sekunde: schnellster Start
  dauerMin: 0.35,          // Sekunden: kürzeste Lebenszeit
  dauerMax: 0.6,           // Sekunden: längste Lebenszeit (Auftrag: nach 1 s sind alle weg)
  reibung: 4,              // pro Sekunde: so schnell werden Partikel langsamer (größer = früher still)
  groesse: 6,              // Punkte: Kantenlänge am Anfang, schrumpft gegen 0
  farbe: '#ffd84a',        // Sternengelb
};
