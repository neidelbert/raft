// Partikel aus einem festen Vorrat (Pool): nie mehr als max, keine neuen Objekte, auch nicht beim Ausstreuen.
// Regeln ohne DOM (mit node testbar); nur zeichnePartikel braucht einen Canvas.
// Partikel sind { x, y, vx, vy, alter, dauer, anzahl, max }: Partikel i (0 … anzahl-1) steht bei x[i], y[i]
//   (Punkte), fliegt mit vx[i], vy[i] (Punkte/s), lebt seit alter[i] von dauer[i] Sekunden. Feste Float64Arrays
//   der Länge max; lebende liegen dicht vorn (ein totes wird durch das letzte ersetzt).

export function erstellePartikel(max) {
  return {
    x: new Float64Array(max), y: new Float64Array(max), vx: new Float64Array(max), vy: new Float64Array(max),
    alter: new Float64Array(max), dauer: new Float64Array(max), anzahl: 0, max,
  };
}

export function leerePartikel(p) { p.anzahl = 0; }

// Bis zu `anzahl` Partikel an (x, y) in alle Richtungen. Ist der Vorrat voll, entstehen weniger (nie über max).
// Gibt zurück, wie viele entstanden sind.
export function streuePartikel(p, x, y, anzahl, e, zufall) {
  let neu = 0;
  for (; neu < anzahl && p.anzahl < p.max; neu++) {
    const i = p.anzahl++;
    const winkel = zufall() * VOLLKREIS, tempo = e.tempoMin + zufall() * (e.tempoMax - e.tempoMin);
    p.x[i] = x; p.y[i] = y;
    p.vx[i] = Math.cos(winkel) * tempo; p.vy[i] = Math.sin(winkel) * tempo;
    p.alter[i] = 0;
    p.dauer[i] = e.dauerMin + zufall() * (e.dauerMax - e.dauerMin);
  }
  return neu;
}

// Bewegen, abbremsen, altern; abgelaufene Partikel zurück in den Vorrat.
export function aktualisierePartikel(p, dt, reibung) {
  const bremse = Math.max(0, 1 - reibung * dt);   // bei 0,1 s und reibung 4: 0,6 (nie negativ, auch bei Rucklern)
  let i = 0;
  while (i < p.anzahl) {
    p.alter[i] += dt;
    if (p.alter[i] >= p.dauer[i]) { entferne(p, i); continue; }   // i nicht erhöhen: hier liegt jetzt das letzte
    p.x[i] += p.vx[i] * dt; p.y[i] += p.vy[i] * dt;
    p.vx[i] *= bremse; p.vy[i] *= bremse;
    i++;
  }
}

function entferne(p, i) {
  const letzter = --p.anzahl;
  p.x[i] = p.x[letzter]; p.y[i] = p.y[letzter]; p.vx[i] = p.vx[letzter]; p.vy[i] = p.vy[letzter];
  p.alter[i] = p.alter[letzter]; p.dauer[i] = p.dauer[letzter];
}

// Kleine Quadrate, Größe und Deckkraft gehen gegen 0. Maße auf ganze Punkte (Lernbuch Stufe 3).
export function zeichnePartikel(ctx, p, e) {
  if (p.anzahl === 0) return;
  ctx.fillStyle = e.farbe;
  for (let i = 0; i < p.anzahl; i++) {
    const rest = 1 - p.alter[i] / p.dauer[i];
    const g = Math.max(1, Math.round(e.groesse * rest)), halb = g >> 1;
    ctx.globalAlpha = rest;
    ctx.fillRect(Math.round(p.x[i]) - halb, Math.round(p.y[i]) - halb, g, g);
  }
  ctx.globalAlpha = 1;
}

const VOLLKREIS = Math.PI * 2;
