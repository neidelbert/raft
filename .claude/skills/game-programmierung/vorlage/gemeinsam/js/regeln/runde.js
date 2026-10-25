// Regeln einer Runde (Platzhalter des Gerüsts): Die Zeit läuft ab, Punkte gibt es für den gelaufenen Weg.
// Ohne Browser (mit node testbar). Die echte Spielregel kommt hierher (oder in weitere Dateien in regeln/).
// runde = { zeit (s übrig), punkte (ganze Zahl) }

export function erstelleRunde() { return { zeit: 0, punkte: 0 }; }

export function starteRunde(runde, dauer) {
  runde.zeit = dauer;
  runde.punkte = 0;
}

// Gibt true zurück, sobald die Zeit abgelaufen ist (dann wechselt main.js nach „ende“).
export function aktualisiereRunde(runde, dt, weg, wegProPunkt) {
  runde.zeit = Math.max(0, runde.zeit - dt);
  runde.punkte = Math.floor(weg / wegProPunkt);
  return runde.zeit <= 0;
}
