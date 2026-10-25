// Regeln einer Runde (ohne DOM, mit node testbar).
// Eine Runde ist { zeit, punkte }: zeit = überlebte Sekunden (nur im Zustand „spiel“, ohne Pause),
// punkte = ganze Zahl daraus.

export function erstelleRunde() { return { zeit: 0, punkte: 0 }; }

export function setzeRundeZurueck(runde) { runde.zeit = 0; runde.punkte = 0; }

// Zeit weiterzählen; Punkte = abgerundete überlebte Sekunden × punkteProSekunde.
export function zaehleZeit(runde, dt, punkteProSekunde) {
  runde.zeit += dt;
  runde.punkte = Math.floor(runde.zeit * punkteProSekunde);
}

// Neuer Rekord nur, wenn die Punkte höher sind. Gibt den (evtl. neuen) Rekord zurück.
export function besterWert(rekord, punkte) { return punkte > rekord ? punkte : rekord; }

// Leben abziehen, nie unter 0 (auch für die Test-Hilfe schaden(n)).
export function nimmLeben(spieler, n) { spieler.leben = Math.max(0, spieler.leben - n); }

export function istVorbei(spieler) { return spieler.leben <= 0; }
