// Ersatz-Zeichnungen, falls der Atlas fehlt oder nicht rechtzeitig lädt (gleiche Namen wie im Atlas).
// Maße in Punkten; gezeichnet wird doppelt aufgelöst wie die Bilder des Zeichners.
export const ERSATZ = {
  aufloesung: 2,                 // Pixel pro Punkt (wie der Atlas)
  held: { breite: 60, hoehe: 120, kopf: 16, koerper: '#2f7fd6', haut: '#f2c19b', haare: '#e07a2a', beine: '#3a3355', umriss: '#2a1e2e' },
  laufRahmen: 6,                 // so viele Rahmen wie die Lauf-Animation des Zeichners
  schrittWinkel: 0.5,            // Bogenmaß: größter Beinwinkel beim Laufen
  explosion: { groesse: 64, rahmen: 6, farbe: '#ffb02e', rand: '#e0402a' },
  muenze: { groesse: 64, rahmen: 6, farbe: '#f5c534', rand: '#8a5a12' },
  knopf: { groesse: 64, farbe: '#2f7fd6', zeichen: '#ffffff' },
  animationen: {                 // Tempo wie in der Meldung des Zeichners
    'held-lauf': { bps: 10, schleife: true },
    explosion: { bps: 15, schleife: false },
    muenze: { bps: 10, schleife: true },
  },
};
