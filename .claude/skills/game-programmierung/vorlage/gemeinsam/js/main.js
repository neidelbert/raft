// __TITEL__ – Gerüst aus neues-spiel.js (Skill game-programmierung). 2D und 3D teilen diese Datei; was sich
// unterscheidet, steht in js/welt/darstellung.js (Canvas 2D oder Three.js) und js/config/welt.js.
// Datenfluss:
//   assets/assets.json → ladeAssets (Fortschritt → Ladebalken; fehlt etwas: Ersatz) → darstellung.nimmAssets → „titel“
//   → Tippen (weckt den Ton, dekodiert Sounds) → „spiel“: Finger links → joystick.eingabe → bewegeSpieler (welt.spieler)
//   → aktualisiereRunde (Punkte aus dem Weg, Zeit läuft ab) → „ende“: merkeRekord → speicher → Tippen → neue Runde.
//   Jedes Bild: darstellung.zeichne(welt), joystickAnzeige.zeichne(). Tab versteckt → Pause, Joystick gelöst, gespeichert.
// window.spiel nur zum Lesen für Tests (js/test-schnittstelle.js); der Spielcode liest es nie.
import { SPIEL, LADEN, SPEICHER, RUNDE } from './config/spiel.js';
import { SPIELER } from './config/welt.js';
import { JOYSTICK, TON, KLAENGE } from './config/steuerung.js';
import { erstelleSchleife } from './kern/schleife.js';
import { ladeAssets, dekodiereSounds } from './kern/assets.js';
import { erstelleTon } from './kern/ton.js';
import { erstelleAutomat } from './kern/zustaende.js';
import { erstelleJoystick } from './kern/joystick.js';
import { erstelleKnopf } from './kern/knopf.js';
import { holeSpeicherOrt, erstelleSpeicher } from './kern/speicher.js';
import { erstelleSpieler, bewegeSpieler } from './regeln/spieler.js';
import { erstelleRunde, starteRunde, aktualisiereRunde } from './regeln/runde.js';
import { erstelleDarstellung } from './welt/darstellung.js';
import { erstelleAnzeige } from './oberflaeche/anzeige.js';
import { erstelleJoystickAnzeige } from './oberflaeche/joystick-anzeige.js';
import { erstelleTestSchnittstelle } from './test-schnittstelle.js';

// Safari zoomt trotz user-scalable=no mit zwei Fingern: Gesten abfangen.
for (const art of ['gesturestart', 'gesturechange']) document.addEventListener(art, (e) => e.preventDefault());

const speicher = erstelleSpeicher(holeSpeicherOrt(), SPEICHER.schluessel, SPEICHER.standard);
const anzeige = erstelleAnzeige(document);
const joystick = erstelleJoystick(document.getElementById('feld-joystick'), JOYSTICK);
const joystickAnzeige = erstelleJoystickAnzeige(document, joystick, JOYSTICK);
const ton = erstelleTon(TON, KLAENGE);
ton.an = speicher.stand.ton;
ton.verbinde(window);
const welt = { assets: null, spieler: erstelleSpieler(), runde: erstelleRunde(), feld: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
const lade = { fortschritt: 0 };
const zaehler = { klaenge: 0 };
const darstellung = erstelleDarstellung(document, welt);   // setzt welt.feld

function spieleKlang(name) { if (ton.spiele(name)) zaehler.klaenge++; }

function merkeRekord() {
  if (welt.runde.punkte <= speicher.stand.rekord) return;
  speicher.stand.rekord = welt.runde.punkte;
  speicher.merke();
  speicher.speichere();
}

const automat = erstelleAutomat({
  laden: {},
  titel: { betreten() { anzeige.zeigeTitel(speicher.stand.rekord); } },
  spiel: {
    betreten() {
      joystick.loese();
      darstellung.setzeStart(welt);
      starteRunde(welt.runde, RUNDE.dauer);
      anzeige.zeigeSpiel(welt.runde);
      spieleKlang('start');
    },
    aktualisiere(dt) {
      bewegeSpieler(welt.spieler, joystick.eingabe, dt, SPIELER.tempo, welt.feld);
      const vorbei = aktualisiereRunde(welt.runde, dt, welt.spieler.weg, SPIELER.wegProPunkt);
      anzeige.aktualisiereLeiste(welt.runde);
      if (vorbei) automat.wechsle('ende');
    },
  },
  ende: {
    betreten() {
      joystick.loese();
      merkeRekord();
      anzeige.zeigeEnde(welt.runde.punkte, speicher.stand.rekord);
      spieleKlang('ende');
    },
  },
});

// Sounds aus dem Manifest erst nach der ersten Berührung dekodieren (vorher gibt es keinen AudioContext).
function weckeTon() {
  ton.wecke();
  if (!welt.assets) return;
  dekodiereSounds(welt.assets, ton.audio).then(() => {
    for (const [name, s] of Object.entries(welt.assets.sounds)) if (s.puffer) ton.setzePuffer(name, s.puffer, s.laut);
  });
}

// „Tippen zum Starten“ auf Titel und Ende: in der Fangphase, damit derselbe Finger nicht auch den Joystick bewegt.
function tippen(e) {
  if ((automat.name !== 'titel' && automat.name !== 'ende') || e.target.closest?.('#knopf-ton')) return;
  e.preventDefault();
  e.stopPropagation();
  weckeTon();
  automat.wechsle('spiel');
}
window.addEventListener('pointerdown', tippen, { capture: true });
window.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') tippen(e); }, { capture: true });

erstelleKnopf(document.getElementById('knopf-ton'), () => {
  ton.an = !ton.an;
  speicher.stand.ton = ton.an;
  speicher.merke();
  speicher.speichere();
  anzeige.zeigeTon(ton.an);
});
anzeige.zeigeTon(ton.an);

const schleife = erstelleSchleife({
  aktualisiere(dt) {
    automat.aktualisiere(dt);
    darstellung.aktualisiere(dt, welt);   // Kamera und Effekte in jedem Zustand (Lernbuch Stufe 6)
  },
  zeichne() {
    darstellung.zeichne(welt);
    joystickAnzeige.zeichne();
  },
  deltaMax: SPIEL.deltaMax,
  beiVersteckt() { joystick.loese(); speicher.speichere(); },   // ein Finger, der beim Wechsel lag, kommt nie hoch
});
window.addEventListener('pagehide', speicher.speichere);   // beforeunload kommt auf dem iPhone oft nicht

automat.wechsle('laden');
window.spiel = erstelleTestSchnittstelle({
  automat, lade, welt, ton, zaehler, schleife, joystick, darstellung, speicher,
  mitTest: new URLSearchParams(location.search).get('test') === '1',
});
schleife.starte();
requestAnimationFrame(() => { window.spiel.bereit = true; });   // läuft schon, während geladen wird

welt.assets = await ladeAssets(LADEN.manifest, {
  zeitgrenze: LADEN.zeitgrenze,
  beiFortschritt(anteil) { lade.fortschritt = anteil; anzeige.fortschritt(anteil); },
  ...darstellung.ladeOptionen,
});
darstellung.nimmAssets(welt.assets);
darstellung.setzeStart(welt);
automat.wechsle('titel');
