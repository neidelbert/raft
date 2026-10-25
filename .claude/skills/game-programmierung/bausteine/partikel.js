// Baustein „partikel“: kleine Funken aus einem festen Vorrat (Einsammeln, Treffer, Explosion).
// Wofür: Rückmeldung, die man sieht. Nie mehr als max gleichzeitig, keine neuen Objekte, auch nicht beim Ausstreuen.
//   Partikel fliegen in alle Richtungen, werden langsamer, Größe und Deckkraft gehen gegen 0, nach ihrer Dauer sind
//   sie weg. Logik ohne Browser (mit node testbar); nur zeichnePartikel braucht einen Canvas.
//   Braucht pool.js im selben Ordner.
// Schnittstelle:
//   erstellePartikel(max) → partikel (ein Pool mit den Feldern x, y, vx, vy, alter, dauer; max ≈ 200 auf dem iPhone).
//   streuePartikel(partikel, x, y, anzahl, einstellung, zufall) → wie viele entstanden (weniger, wenn der Vorrat voll ist).
//     einstellung = { tempoMin, tempoMax (Punkte/s), dauerMin, dauerMax (s), reibung (pro s), groesse (Punkte), farbe }.
//   aktualisierePartikel(partikel, dt, reibung): bewegen, abbremsen, abgelaufene zurück in den Vorrat.
//     In JEDEM nicht pausierten Bild aufrufen, nicht nur im Zustand „spiel“ (sonst frieren sie beim Ende ein).
//   zeichnePartikel(ctx, partikel, einstellung): kleine Quadrate, auf ganze Punkte gerundet (spart in Chrome Speicher).
//   partikel.leere(): alle weg (neue Runde).
// Beispiel:
//   import { erstellePartikel, streuePartikel, aktualisierePartikel, zeichnePartikel } from './welt/partikel.js';
//   const partikel = erstellePartikel(PARTIKEL.max);
//   streuePartikel(partikel, stern.x, stern.y, PARTIKEL.proStern, PARTIKEL, effektZufall);   // beim Einsammeln
//   aktualisierePartikel(partikel, dt, PARTIKEL.reibung);                                     // jedes Bild
//   zeichnePartikel(ctx, partikel, PARTIKEL);
import { erstellePool } from './pool.js';

const VOLLKREIS = Math.PI * 2;

export function erstellePartikel(max) { return erstellePool(max, ['x', 'y', 'vx', 'vy', 'alter', 'dauer']); }

export function streuePartikel(p, x, y, anzahl, e, zufall) {
  let neu = 0;
  for (; neu < anzahl; neu++) {
    const i = p.hole();
    if (i === -1) break;
    const winkel = zufall() * VOLLKREIS, tempo = e.tempoMin + zufall() * (e.tempoMax - e.tempoMin);
    p.x[i] = x; p.y[i] = y;
    p.vx[i] = Math.cos(winkel) * tempo; p.vy[i] = Math.sin(winkel) * tempo;
    p.alter[i] = 0;
    p.dauer[i] = e.dauerMin + zufall() * (e.dauerMax - e.dauerMin);
  }
  return neu;
}

export function aktualisierePartikel(p, dt, reibung) {
  const bremse = Math.max(0, 1 - reibung * dt);   // nie negativ, auch nicht bei einem Ruckler (dt = 0,1 s)
  let i = 0;
  while (i < p.anzahl) {
    p.alter[i] += dt;
    if (p.alter[i] >= p.dauer[i]) { p.gib(i); continue; }   // i nicht erhöhen: hier liegt jetzt der letzte
    p.x[i] += p.vx[i] * dt; p.y[i] += p.vy[i] * dt;
    p.vx[i] *= bremse; p.vy[i] *= bremse;
    i++;
  }
}

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
