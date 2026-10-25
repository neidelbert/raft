// Test-Schnittstelle window.spiel (nur zum Lesen für Tests; der Spielcode liest sie nie).
// { bereit, zustand ('titel'|'spiel'|'ende'), punkte, rekord, spieler: { x, y, leben, unverwundbar, … },
//   eingabe, gegnerAktiv, messung: { schrittMs }, pausiert }
// Mit ?test=1 zusätzlich spiel.test: schaden(n) (Auftrag) und Hilfen aus Übung 3 für den eigenen Test.
import { erzeugeGegner, leereSchwarm } from './welt/gegner.js';
import { nimmLeben, istVorbei } from './ablauf/runde.js';

export function erstelleTestSchnittstelle({ adresse, welt, joystick, messung, automat, stand, bildschirm, zufall, istPausiert, bildGeladen }) {
  const { schwarm, spieler, runde } = welt;
  const spiel = {
    bereit: false, spieler, eingabe: joystick.eingabe, messung,
    get zustand() { return automat.name; },
    get punkte() { return runde.punkte; },
    get rekord() { return stand.rekord; },
    get gegnerAktiv() { return schwarm.anzahl; },
    get pausiert() { return istPausiert(); },
  };
  if (adresse.get('test') !== '1') return spiel;
  spiel.test = {
    // n Leben abziehen (nie unter 0). Bei 0 Leben im Spiel sofort „ende“, wie bei einem echten Treffer.
    schaden(n) {
      nimmLeben(spieler, n);
      if (automat.name === 'spiel' && istVorbei(spieler)) automat.wechsle('ende');
      return spieler.leben;
    },
    // Sofort n Gegner am Rand erzeugen (nie über GEGNER.max). Gibt die neue Anzahl zurück.
    fuelleGegner(n) {
      for (let i = 0; i < n && erzeugeGegner(schwarm, spieler, bildschirm.breite, bildschirm.hoehe, zufall); i++);
      return schwarm.anzahl;
    },
    friere(an) { schwarm.gefroren = Boolean(an); },
    // Nur für den eigenen Test: überlebte Zeit lesen und setzen, Figur oder Gegner an eine Stelle setzen, Gegner auslesen, leeren.
    zeit() { return runde.zeit; },
    setzeZeit(sekunden) { runde.zeit = sekunden; },
    setzeLeben(n) { spieler.leben = n; },
    setzeSpieler(x, y) { spieler.x = x; spieler.y = y; },
    setzeGegner(i, x, y) { schwarm.x[i] = x; schwarm.y[i] = y; },
    gegnerPositionen() { return Array.from({ length: schwarm.anzahl }, (_, i) => ({ x: schwarm.x[i], y: schwarm.y[i] })); },
    leereGegner() { leereSchwarm(schwarm); },
    bildGeladen: bildGeladen.figur,
    gegnerBildGeladen: bildGeladen.gegner,
  };
  return spiel;
}
