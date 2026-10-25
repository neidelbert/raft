// Baustein „pool“: fester Vorrat für viele gleiche Dinge (Gegner, Schüsse, Partikel), ohne neue Objekte.
// Wofür: alles, was zu Dutzenden oder Hunderten entsteht und verschwindet. Jedes Feld ist ein festes Float64Array
//   der Länge max (Lernbuch Stufe 3: Kommazahlen in Objekt-Feldern packt V8 je nach Lage ein, das kostete bis 7 KB
//   pro Schritt; in Float64Arrays nie). Aktive Einträge liegen dicht vorn (0 … anzahl−1): Die Schleife läuft nur
//   über aktive. Grenze erreicht heißt: nichts Neues, kein Absturz. Reine Logik, mit node testbar.
// Schnittstelle:
//   erstellePool(max, felder) → pool
//     felder: Namen der Zahlen-Felder, z. B. ['x', 'y', 'vx', 'vy']. Jedes wird pool[name] (Float64Array).
//   pool.anzahl, pool.max: aktive Einträge und Grenze (nur lesen).
//   pool.hole() → Index des neuen Eintrags oder −1, wenn voll. Die Felder enthalten alte Werte: alle setzen!
//   pool.gib(i): Eintrag i zurück in den Vorrat. Der letzte aktive rückt auf Platz i (Felder werden kopiert).
//     Darum beim Entfernen in einer Schleife i nicht erhöhen (siehe Beispiel).
//   pool.leere(): alle zurück (neue Runde).
// Daten, die keine Zahlen sind (Bild, Art als Text): Art als Zahl speichern (0, 1, 2 …) und in config nachschlagen.
// Beispiel:
//   import { erstellePool } from './kern/pool.js';
//   const schuesse = erstellePool(SCHUSS.max, ['x', 'y', 'vx', 'vy', 'alter']);
//   const i = schuesse.hole();
//   if (i !== -1) { schuesse.x[i] = x; schuesse.y[i] = y; schuesse.vx[i] = vx; schuesse.vy[i] = vy; schuesse.alter[i] = 0; }
//   let j = 0;
//   while (j < schuesse.anzahl) {
//     schuesse.alter[j] += dt;
//     if (schuesse.alter[j] > SCHUSS.dauer) { schuesse.gib(j); continue; }   // hier liegt jetzt der letzte
//     schuesse.x[j] += schuesse.vx[j] * dt; schuesse.y[j] += schuesse.vy[j] * dt;
//     j++;
//   }

const RESERVIERT = new Set(['anzahl', 'max', 'felder', 'hole', 'gib', 'leere']);

export function erstellePool(max, felder) {
  const spalten = [];
  const pool = { anzahl: 0, max, felder: [...felder], hole, gib, leere };
  for (const name of felder) {
    if (RESERVIERT.has(name)) throw new Error(`Pool-Feld „${name}“ ist reserviert`);
    pool[name] = new Float64Array(max);
    spalten.push(pool[name]);
  }

  function hole() { return pool.anzahl < max ? pool.anzahl++ : -1; }

  function gib(i) {
    if (i < 0 || i >= pool.anzahl) return;
    const letzter = --pool.anzahl;
    if (i === letzter) return;
    for (let s = 0; s < spalten.length; s++) spalten[s][i] = spalten[s][letzter];
  }

  function leere() { pool.anzahl = 0; }

  return pool;
}
