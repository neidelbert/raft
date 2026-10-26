// Regeln einer Runde (Platzhalter des Gerüsts): Die Zeit läuft ab, Punkte gibt es für den gelaufenen Weg.
// Ohne Browser (mit node testbar). Die echte Spielregel kommt hierher (oder in weitere Dateien in regeln/).
// runde = { zeit (s übrig; Infinity = ohne Zeitgrenze), punkte (ganze Zahl) }

export function erstelleRunde() { return { zeit: 0, punkte: 0 }; }

// dauer: s oder null (ohne Zeitgrenze, RUNDE.dauer in config/spiel.js).
export function starteRunde(runde, dauer) {
  runde.zeit = dauer == null ? Infinity : dauer;
  runde.punkte = 0;
}

// Gibt true zurück, sobald die Zeit abgelaufen ist (dann wechselt main.js nach „ende“). Ohne Zeitgrenze nie:
// Dann beendet die eigene Spielregel die Runde (true zurückgeben, wenn das Ziel erreicht ist).
export function aktualisiereRunde(runde, dt, weg, wegProPunkt) {
  runde.zeit = Math.max(0, runde.zeit - dt);
  runde.punkte = Math.floor(weg / wegProPunkt);
  return runde.zeit <= 0;
}
