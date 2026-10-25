// Baustein „gitter“: schnelle Nachbarsuche für die Kollision vieler Objekte, ohne neue Objekte pro Bild.
// Wofür: ab etwa 50 Objekten (Gegner untereinander, Schüsse gegen Gegner). Statt jeder gegen jeden (240 Gegner:
//   28.680 Paare) prüft jedes Objekt nur die 3 × 3 Zellen um sich. Jede Zelle ist eine verkettete Liste in zwei
//   Int32Arrays: Füllen kostet nur Zahlen schreiben. Arbeitet mit Positions-Arrays (z. B. aus pool.js).
//   Reine Logik, mit node testbar.
// Schnittstelle:
//   erstelleGitter(zelle, maxObjekte) → gitter
//     zelle: Kantenlänge in Punkten, mindestens der größte Suchabstand (z. B. 2 × Gegner-Radius).
//   gitter.passeAn(minX, minY, maxX, maxY): Fläche (beim Start und bei Größenänderung, legt dann Arrays an).
//     Punkte außerhalb landen in der Randzelle (kein Absturz, nur langsamer). Rand für Gegner draußen mit einplanen.
//   gitter.fuelle(xs, ys, anzahl): Objekte 0 … anzahl−1 einsortieren, jedes Bild einmal vor der Suche.
//   gitter.sucheNachbarn(x, y, radius, xs, ys, aus) → Zahl der Treffer: Indizes aller Objekte mit Abstand < radius
//     (radius ≤ zelle) stehen danach in aus[0 … Zahl−1] (aus: festes Int32Array, Länge = höchstens gewünschte
//     Treffer). Das Objekt selbst ist dabei, wenn (x, y) seine Position ist.
//   Für eigene Schleifen: gitter.zelleX(x), gitter.zelleY(y), gitter.erster(sx, sy) → Index oder −1,
//     gitter.naechster[i] → nächster Index derselben Zelle oder −1. gitter.spalten, gitter.zeilen.
//   beruehren(ax, ay, ar, bx, by, br) → true, wenn sich zwei Kreise berühren (ohne Wurzel).
// Beispiel:
//   import { erstelleGitter, beruehren } from './kern/gitter.js';
//   const gitter = erstelleGitter(GEGNER.zelle, GEGNER.max), treffer = new Int32Array(GEGNER.max);
//   gitter.passeAn(-rand, -rand, breite + rand, hoehe + rand);
//   // jedes Bild:
//   gitter.fuelle(gegner.x, gegner.y, gegner.anzahl);
//   const n = gitter.sucheNachbarn(schuss.x, schuss.y, GEGNER.radius, gegner.x, gegner.y, treffer);
//   for (let k = 0; k < n; k++) beiTreffer(treffer[k]);

export function erstelleGitter(zelle, maxObjekte) {
  const naechster = new Int32Array(maxObjekte);
  let kopf = new Int32Array(0);
  const gitter = { spalten: 0, zeilen: 0, minX: 0, minY: 0, zelle, naechster, passeAn, fuelle, zelleX, zelleY, erster, sucheNachbarn };

  function passeAn(minX, minY, maxX, maxY) {
    gitter.minX = minX;
    gitter.minY = minY;
    gitter.spalten = Math.max(1, Math.ceil((maxX - minX) / zelle));
    gitter.zeilen = Math.max(1, Math.ceil((maxY - minY) / zelle));
    const noetig = gitter.spalten * gitter.zeilen;
    if (kopf.length < noetig) kopf = new Int32Array(noetig);
    kopf.fill(-1);
  }

  function zelleX(x) { return klemme(Math.floor((x - gitter.minX) / zelle), gitter.spalten); }
  function zelleY(y) { return klemme(Math.floor((y - gitter.minY) / zelle), gitter.zeilen); }

  function fuelle(xs, ys, anzahl) {
    kopf.fill(-1, 0, gitter.spalten * gitter.zeilen);
    for (let i = 0; i < anzahl; i++) {
      const k = zelleY(ys[i]) * gitter.spalten + zelleX(xs[i]);
      naechster[i] = kopf[k];
      kopf[k] = i;
    }
  }

  function erster(sx, sy) { return kopf[sy * gitter.spalten + sx]; }

  function sucheNachbarn(x, y, radius, xs, ys, aus) {
    const sx = zelleX(x), sy = zelleY(y), r2 = radius * radius;
    let n = 0;
    for (let zy = Math.max(0, sy - 1); zy <= Math.min(gitter.zeilen - 1, sy + 1); zy++) {
      for (let zx = Math.max(0, sx - 1); zx <= Math.min(gitter.spalten - 1, sx + 1); zx++) {
        for (let j = kopf[zy * gitter.spalten + zx]; j !== -1; j = naechster[j]) {
          const dx = xs[j] - x, dy = ys[j] - y;
          if (dx * dx + dy * dy < r2 && n < aus.length) aus[n++] = j;
        }
      }
    }
    return n;
  }

  return gitter;
}

export function beruehren(ax, ay, ar, bx, by, br) {
  const dx = ax - bx, dy = ay - by, r = ar + br;
  return dx * dx + dy * dy < r * r;
}

function klemme(n, anzahl) { return n < 0 ? 0 : n >= anzahl ? anzahl - 1 : n; }
