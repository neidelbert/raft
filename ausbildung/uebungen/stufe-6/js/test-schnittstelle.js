// Test-Schnittstelle window.spiel (nur zum Lesen für Tests; der Spielcode liest sie nie).
// { bereit, zustand ('titel'|'spiel'|'ende'), punkte, rekord, spieler: { x, y, leben, unverwundbar, … },
//   eingabe, gegnerAktiv, messung: { schrittMs }, pausiert,
//   effekte: { wackeln, partikelAktiv, partikelMax, blitz }, ton: { bereit, an }, sterne (eingesammelt, diese Runde) }
// Mit ?test=1 zusätzlich spiel.test: schaden(n), sammleStern() (Auftrag) und Hilfen für den eigenen Test.
import { erzeugeGegner, leereSchwarm } from './welt/gegner.js';
import { legeStern, entferneStern } from './welt/sterne.js';
import { nimmLeben, istVorbei } from './ablauf/runde.js';

export function erstelleTestSchnittstelle({ adresse, welt, joystick, messung, automat, stand, bildschirm, zufall, ton,
  beiTreffer, beimSammeln, istPausiert, bildGeladen }) {
  const { schwarm, spieler, runde, sterne, partikel, effekte } = welt;
  const spiel = {
    bereit: false, spieler, eingabe: joystick.eingabe, messung,
    get zustand() { return automat.name; },
    get punkte() { return runde.punkte; },
    get rekord() { return stand.rekord; },
    get gegnerAktiv() { return schwarm.anzahl; },
    get pausiert() { return istPausiert(); },
    get sterne() { return runde.sterne; },
    effekte: {
      get wackeln() { return effekte.wackeln; },
      get partikelAktiv() { return partikel.anzahl; },
      get partikelMax() { return partikel.max; },
      get blitz() { return effekte.blitz; },
    },
    ton: {
      get bereit() { return ton.bereit; },
      get an() { return ton.an; },
    },
  };
  if (adresse.get('test') !== '1') return spiel;
  spiel.test = {
    // n Leben abziehen (nie unter 0). Bei 0 Leben im Spiel sofort „ende“, wie bei einem echten Treffer.
    // Wie ein echter Treffer auch mit Wackeln, Aufblitzen und Ton, sofern ein Leben verloren ging.
    schaden(n) {
      const vorher = spieler.leben;
      nimmLeben(spieler, n);
      if (spieler.leben < vorher) beiTreffer();
      if (automat.name === 'spiel' && istVorbei(spieler)) automat.wechsle('ende');
      return spieler.leben;
    },
    // Sofort n Gegner am Rand erzeugen (nie über GEGNER.max). Gibt die neue Anzahl zurück.
    fuelleGegner(n) {
      for (let i = 0; i < n && erzeugeGegner(schwarm, spieler, bildschirm.breite, bildschirm.hoehe, zufall); i++);
      return schwarm.anzahl;
    },
    // Einen Stern einsammeln wie bei echter Berührung: liegt einer, der erste (an seiner Stelle), sonst einer an
    // der Figur. Zählt, Partikel, Ton. Gibt die Zahl der eingesammelten Sterne zurück.
    sammleStern() {
      let x = spieler.x, y = spieler.y;
      if (sterne.anzahl > 0) { x = sterne.x[0]; y = sterne.y[0]; entferneStern(sterne, 0); }
      beimSammeln(x, y);
      return runde.sterne;
    },
    // Nur für den eigenen Test: Sterne lesen, sofort einen legen.
    sternPositionen() { return Array.from({ length: sterne.anzahl }, (_, i) => ({ x: sterne.x[i], y: sterne.y[i] })); },
    legeStern() { return legeStern(sterne, spieler, bildschirm.breite, bildschirm.hoehe, zufall); },
    sternUhr() { return sterne.uhr; },
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
    sternBildGeladen: bildGeladen.stern,
  };
  return spiel;
}
