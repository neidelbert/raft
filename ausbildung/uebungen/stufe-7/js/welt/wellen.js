// Wellenhöhe an einer Stelle (reine Rechnung ohne Three.js, auch mit node testbar).
// Wasser, Boot und Bojen fragen alle hier nach, damit alles auf denselben Wellen schwimmt.
// bereiteWellenVor(liste) rechnet einmal vorab die Wellenzahlen aus (keine Rechnung pro Punkt und Bild doppelt).

export function bereiteWellenVor(liste) {
  return liste.map(({ hoehe, laenge, tempo, richtungX, richtungZ }) => {
    const laengeRichtung = Math.sqrt(richtungX * richtungX + richtungZ * richtungZ);
    const k = (2 * Math.PI) / laenge;   // Wellenzahl: eine volle Welle pro „laenge“ Meter
    return { hoehe, tempo, kx: (k * richtungX) / laengeRichtung, kz: (k * richtungZ) / laengeRichtung };
  });
}

// Höhe in Metern an (x, z) zur Wellenzeit zeit (Sekunden). Höchstens Summe aller „hoehe“.
export function welleHoehe(wellen, x, z, zeit) {
  let h = 0;
  for (let i = 0; i < wellen.length; i++) {
    const w = wellen[i];
    h += w.hoehe * Math.sin(w.kx * x + w.kz * z + w.tempo * zeit);
  }
  return h;
}

export function hoechsteWelle(wellen) {
  return wellen.reduce((summe, w) => summe + w.hoehe, 0);
}
