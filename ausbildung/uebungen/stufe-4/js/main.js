// Übung 4: Aus Übung 3 wird ein Spiel. Titel („Tippen zum Starten“) → Spiel → Ende („Rekord: …“, Tippen für neue Runde).
// Datenfluss: Finger → joystick.eingabe / Sprung-Knopf → welt.spieler → welt.schwarm → Treffer (leben)
//   → runde (zeit, punkte) → bei 0 Leben Zustand „ende“ → stand.rekord → localStorage „uebung-4“.
// Zustände: automat (ablauf/zustaende.js); nur „spiel“ rechnet. Tab versteckt → Pause (nichts rechnet) und speichern.
// window.spiel nur zum Lesen für Tests (js/test-schnittstelle.js).
import { SPIEL, SPEICHER, TEXTE, FARBEN, BILDER } from './config/spiel.js';
import { SPIELER } from './config/spieler.js';
import { JOYSTICK } from './config/steuerung.js';
import { GEGNER } from './config/gegner.js';
import { erstelleBildschirm } from './kern/bildschirm.js';
import { ladeBilder } from './kern/bilder.js';
import { erstelleZufall } from './kern/zufall.js';
import { ladeStand, speichereStand } from './kern/speicher.js';
import { erstelleJoystick, zeichneJoystick } from './steuerung/joystick.js';
import { erstelleKnopf } from './steuerung/knopf.js';
import { erstelleSpieler, setzeSpielerZurueck, bewegeSpieler, haltImBild, starteSprung, aktualisiereSprung, zeichneSpieler } from './welt/spieler.js';
import { erstelleSchwarm, passeSchwarmAn, leereSchwarm, aktualisiereSchwarm, sortiereNachY, zeichneGegner } from './welt/gegner.js';
import { aktualisiereSchutz, pruefeTreffer } from './welt/treffer.js';
import { erstelleAutomat } from './ablauf/zustaende.js';
import { erstelleRunde, setzeRundeZurueck, zaehleZeit, besterWert, istVorbei } from './ablauf/runde.js';
import { erstelleAnzeige } from './oberflaeche/anzeige.js';
import { erstelleTestSchnittstelle } from './test-schnittstelle.js';

const adresse = new URLSearchParams(location.search);
const seed = Number.parseInt(adresse.get('seed'), 10);
const zufall = erstelleZufall(Number.isFinite(seed) ? seed : undefined);

// Safari zoomt trotz user-scalable=no mit zwei Fingern: Gesten abfangen.
for (const art of ['gesturestart', 'gesturechange']) document.addEventListener(art, (e) => e.preventDefault());

// Schon der Zugriff auf localStorage kann werfen (gesperrte Website-Daten); dann gibt es nur Standardwerte.
const speicherOrt = (() => { try { return window.localStorage; } catch { return null; } })();
const stand = ladeStand(speicherOrt, SPEICHER.schluessel, SPEICHER.standard);
// Nur schreiben, wenn sich etwas geändert hat. Sonst würde z. B. ein zweiter, älterer Tab beim Schließen einen
// neueren Rekord überschreiben. Klappt das Schreiben nicht (Speicher voll), bleibt die Änderung offen und
// wird beim nächsten Verstecken oder Schließen noch einmal versucht.
let ungespeichert = false;
function speichere() {
  if (ungespeichert && speichereStand(speicherOrt, SPEICHER.schluessel, stand)) ungespeichert = false;
}

const bildschirm = erstelleBildschirm(document.getElementById('leinwand'), SPIEL.pixelRatioMax);
const joystick = erstelleJoystick(document.getElementById('feld-joystick'), JOYSTICK);
const anzeige = erstelleAnzeige(TEXTE);
const bilder = await ladeBilder();
const figurBild = bilder[BILDER.figur] || null;
const figurBreite = figurBild ? (SPIELER.hoehe * figurBild.naturalWidth) / figurBild.naturalHeight : SPIELER.breiteErsatz;
const gegnerBild = bilder[BILDER.gegner] || null;
const gegnerBreite = gegnerBild ? (GEGNER.hoehe * gegnerBild.naturalWidth) / gegnerBild.naturalHeight : GEGNER.breiteErsatz;

const welt = {
  spieler: erstelleSpieler({ x: bildschirm.breite / 2, y: bildschirm.hoehe / 2, breite: figurBreite, hoehe: SPIELER.hoehe, leben: SPIELER.leben }),
  schwarm: erstelleSchwarm(GEGNER),
  runde: erstelleRunde(),
};
passeSchwarmAn(welt.schwarm, bildschirm.breite, bildschirm.hoehe);
erstelleKnopf(document.getElementById('knopf-sprung'), () => starteSprung(welt.spieler));
window.addEventListener('resize', () => {
  haltImBild(welt.spieler, bildschirm.breite, bildschirm.hoehe, SPIELER.sprungHoehe);
  passeSchwarmAn(welt.schwarm, bildschirm.breite, bildschirm.hoehe);
});
const messung = { schrittMs: 0 };   // gleitend gemittelte Zeit für aktualisiere() ohne Zeichnen
let gemessen = false;               // erster Messwert ersetzt die 0 direkt

// Neue Runde: Leben, Punkte und Gegner zurück, Figur in die Mitte, Joystick los.
function neueRunde() {
  setzeSpielerZurueck(welt.spieler, bildschirm.breite / 2, bildschirm.hoehe / 2, SPIELER.leben);
  leereSchwarm(welt.schwarm);
  setzeRundeZurueck(welt.runde);
  joystick.loese();
}

const automat = erstelleAutomat({
  titel: {
    betreten() { anzeige.zeigeLeiste(false); anzeige.zeigeTitel(stand.rekord); },
  },
  spiel: {
    betreten() {
      neueRunde();
      anzeige.aktualisiereLeiste(welt.runde.punkte, welt.spieler.leben);   // sofort, nicht erst im nächsten Bild
      anzeige.versteckeTafel();
      anzeige.zeigeLeiste(true);
    },
    aktualisiere(dt) {
      schritt(dt);
      anzeige.aktualisiereLeiste(welt.runde.punkte, welt.spieler.leben);
      if (istVorbei(welt.spieler)) automat.wechsle('ende');
    },
  },
  ende: {
    betreten() {
      joystick.loese();   // der Finger, der beim Ende lag, steuert die nächste Runde nicht
      const rekord = besterWert(stand.rekord, welt.runde.punkte);
      if (rekord !== stand.rekord) { stand.rekord = rekord; ungespeichert = true; speichere(); }
      anzeige.zeigeLeiste(false);
      anzeige.zeigeEnde(welt.runde.punkte, stand.rekord);
    },
  },
});

// Tippen irgendwo startet im Titel und am Ende eine Runde. Am Fenster in der Fangphase abgefangen, damit derselbe
// Finger nicht zusätzlich den Joystick oder den Sprung-Knopf auslöst.
window.addEventListener('pointerdown', (e) => {
  if (automat.name === 'spiel') return;
  e.preventDefault();
  e.stopPropagation();
  automat.wechsle('spiel');
}, { capture: true });

function aktualisiere(dt) {
  const { eingabe } = joystick;
  zaehleZeit(welt.runde, dt, SPIEL.punkteProSekunde);
  bewegeSpieler(welt.spieler, eingabe.x, eingabe.y, SPIELER.laufTempo, dt, bildschirm.breite, bildschirm.hoehe, SPIELER.sprungHoehe);
  aktualisiereSprung(welt.spieler, dt, SPIELER.sprungDauer);
  aktualisiereSchutz(welt.spieler, dt);
  aktualisiereSchwarm(welt.schwarm, welt.spieler, dt, bildschirm.breite, bildschirm.hoehe, zufall);
  pruefeTreffer(welt.spieler, welt.schwarm, SPIELER.trefferRadius, SPIELER.schutzZeit);
}

// Spiel-Schritt mit Zeitmessung (gleitendes Mittel), damit man die Leistung bei vielen Gegnern sieht.
function schritt(dt) {
  const start = performance.now();
  aktualisiere(dt);
  const ms = performance.now() - start;
  messung.schrittMs = gemessen ? messung.schrittMs + (ms - messung.schrittMs) * SPIEL.messGlaettung : ms;
  gemessen = true;
}

function zeichne() {
  const { ctx, breite, hoehe } = bildschirm;
  ctx.fillStyle = FARBEN.hintergrund;
  ctx.fillRect(0, 0, breite, hoehe);
  // Nach Fußpunkt sortiert: Gegner hinter der Figur, dann die Figur, dann die Gegner davor.
  // Gegner sind nach Mitte sortiert; ihr Fuß liegt GEGNER.hoehe / 2 darunter, der Fuß der Figur SPIELER.hoehe / 2.
  const { schwarm, spieler } = welt;
  sortiereNachY(schwarm);
  const grenzeY = spieler.y + (SPIELER.hoehe - GEGNER.hoehe) / 2;
  const naechster = zeichneGegner(ctx, schwarm, 0, grenzeY, gegnerBild, gegnerBreite, FARBEN);
  zeichneSpieler(ctx, spieler, figurBild, SPIELER, FARBEN);
  zeichneGegner(ctx, schwarm, naechster, Infinity, gegnerBild, gegnerBreite, FARBEN);
  zeichneJoystick(ctx, joystick, JOYSTICK, FARBEN);
}

// Manche Test-Werkzeuge und ältere Browser setzen nur eines der beiden Felder.
const istVersteckt = () => document.hidden || document.visibilityState === 'hidden';
let letzte = 0;
let pausiert = istVersteckt();

function bild(jetzt) {
  const dt = Math.min(Math.max(jetzt - letzte, 0) / 1000, SPIEL.deltaMax);   // Sekunden, gedeckelt
  // Nie zurückgehen: Nach einem Tab-Wechsel kommt oft noch ein Bild mit altem Zeitstempel (Lernbuch Stufe 1).
  letzte = Math.max(letzte, jetzt);
  if (!pausiert) automat.aktualisiere(dt);
  zeichne();
  requestAnimationFrame(bild);
}

// Pause: Solange der Tab versteckt ist, rechnet nichts (keine Punkte, keine Gegner). Zurück geht es von selbst weiter.
document.addEventListener('visibilitychange', () => {
  pausiert = istVersteckt();
  letzte = performance.now();   // keinen Zeitsprung nach der Rückkehr
  if (pausiert) {
    joystick.loese();           // ein Finger, der beim Wechsel lag, kommt nie mehr hoch
    speichere();
  }
});
window.addEventListener('pagehide', speichere);   // beforeunload kommt auf dem iPhone oft nicht

automat.wechsle('titel');
const spiel = erstelleTestSchnittstelle({
  adresse, welt, joystick, messung, automat, stand, bildschirm, zufall,
  istPausiert: () => pausiert, bildGeladen: { figur: Boolean(figurBild), gegner: Boolean(gegnerBild) },
});
window.spiel = spiel;

requestAnimationFrame((t) => {
  letzte = t;
  bild(t);
  spiel.bereit = true;
});
