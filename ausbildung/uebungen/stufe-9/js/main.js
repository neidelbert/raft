// Übung 9 (Assets): Ladebildschirm → „Tippen zum Starten“ → Held läuft per Joystick über die Wiese, Münzen drehen
// sich, Tippen rechts löst eine Explosion mit Sound aus. Kein Spiel, nur die Asset-Kette zum Ausprobieren.
// Datenfluss: assets.json → ladeAssets (Fortschritt → Balken; Ersatz bei Fehlern) → Zustand „start“ → Tippen weckt
//   den Ton, Sounds dekodieren → „laeuft“: Finger links → joystick.eingabe → held (x, blick, Animation);
//   Finger rechts → Explosion (Animation einmal) + Sound; Münzen drehen → zeichneWelt.
// Tab versteckt → Pause, Joystick gelöst. window.spiel nur zum Lesen für Tests (js/test-schnittstelle.js).
import { SPIEL, LADEN } from './config/spiel.js';
import { HELD, ANIMATIONEN } from './config/held.js';
import { MUENZEN, EXPLOSION } from './config/gegenstaende.js';
import { JOYSTICK, TON } from './config/steuerung.js';
import { erstelleSchleife } from './kern/schleife.js';
import { erstelleBildschirm } from './kern/bildschirm.js';
import { ladeAssets, dekodiereSounds } from './kern/assets.js';
import { erstelleTon } from './kern/ton.js';
import { erstelleAutomat } from './kern/zustaende.js';
import { erstelleJoystick } from './steuerung/joystick.js';
import { erstelleKnopf } from './steuerung/knopf.js';
import { baueErsatz } from './welt/ersatz.js';
import { erstelleHeld, stelleHeldAufBoden, bewegeHeld, aktualisiereHeldAnimation } from './welt/held.js';
import { erstelleMuenzen, starteMuenzen, aktualisiereMuenzen, erstelleExplosionen, starteExplosion, aktualisiereExplosionen } from './welt/gegenstaende.js';
import { zeichneWelt } from './welt/zeichnen.js';
import { erstelleAnzeige } from './oberflaeche/anzeige.js';
import { erstelleTestSchnittstelle } from './test-schnittstelle.js';

// Safari zoomt trotz user-scalable=no mit zwei Fingern: Gesten abfangen.
for (const art of ['gesturestart', 'gesturechange']) document.addEventListener(art, (e) => e.preventDefault());

const anzeige = erstelleAnzeige(document);
const joystick = erstelleJoystick(document.getElementById('feld-joystick'), JOYSTICK);
const ton = erstelleTon(TON, {});
ton.verbinde(window);
const welt = { assets: null, zeit: 0, held: erstelleHeld(), muenzen: erstelleMuenzen(MUENZEN), explosionen: erstelleExplosionen(EXPLOSION.max), joystick };
const lade = { fortschritt: 0 };
const zaehler = { abgespielt: 0 };
const bildschirm = erstelleBildschirm(document.getElementById('leinwand'), {
  pixelRatioMax: SPIEL.pixelRatioMax,
  beiGroesse: (b) => stelleHeldAufBoden(welt.held, b.breite, b.hoehe, HELD),
});
stelleHeldAufBoden(welt.held, bildschirm.breite, bildschirm.hoehe, HELD, true);

const automat = erstelleAutomat({
  laden: {},
  start: { betreten() { anzeige.zeigeStart(); } },
  laeuft: {
    betreten() { anzeige.zeigeSpiel(); joystick.loese(); },
    aktualisiere(dt) {
      bewegeHeld(welt.held, joystick.eingabe.x, dt, bildschirm.breite, HELD);
      aktualisiereHeldAnimation(welt.held, welt.assets, dt, HELD, ANIMATIONEN);
    },
  },
});

// Gemeinsam für Tippen und Test-Hilfe: Explosion an (x, y) mit Sound.
function beiExplosion(x, y) {
  if (!starteExplosion(welt.explosionen, x, y, welt.assets?.animationen[ANIMATIONEN.explosion])) return false;
  if (ton.spiele(EXPLOSION.sound)) zaehler.abgespielt++;
  return true;
}

// „Tippen zum Starten“: dieses Tippen weckt den Ton (iPhone), danach werden die Sounds dekodiert.
function starte(e) {
  if (automat.name !== 'start' || e.target.closest?.('#knopf-ton')) return;
  e.preventDefault();
  e.stopPropagation();   // derselbe Finger löst weder Joystick noch Explosion aus
  ton.wecke();
  dekodiereSounds(welt.assets, ton.audio).then(() => {
    for (const [name, s] of Object.entries(welt.assets.sounds)) ton.setzePuffer(name, s.puffer, s.laut);
  });
  automat.wechsle('laeuft');
}
window.addEventListener('pointerdown', starte, { capture: true });
window.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') starte(e); }, { capture: true });

document.getElementById('feld-explosion').addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (automat.name === 'laeuft') beiExplosion(e.clientX, e.clientY);
});

function zeigeTonSymbol() { anzeige.zeigeTon(welt.assets?.rahmen[ton.an ? 'ton-an' : 'ton-aus']); }
erstelleKnopf(document.getElementById('knopf-ton'), () => { ton.an = !ton.an; zeigeTonSymbol(); });

const schleife = erstelleSchleife({
  aktualisiere(dt) {
    automat.aktualisiere(dt);
    if (!welt.assets) return;
    welt.zeit += dt;
    aktualisiereMuenzen(welt.muenzen, dt);   // Münzen und Explosionen in jedem Zustand (Lernbuch Stufe 6)
    aktualisiereExplosionen(welt.explosionen, dt);
  },
  zeichne() { if (welt.assets) zeichneWelt(bildschirm.ctx, bildschirm, welt); },
  deltaMax: SPIEL.deltaMax,
  beiVersteckt() { joystick.loese(); },
});

automat.wechsle('laden');
window.spiel = erstelleTestSchnittstelle({ automat, lade, welt, zaehler, beiExplosion, mitTest: new URLSearchParams(location.search).get('test') === '1' });
schleife.starte();
requestAnimationFrame(() => { window.spiel.bereit = true; });   // läuft schon, während geladen wird

welt.assets = await ladeAssets(LADEN.manifest, {
  zeitgrenze: LADEN.zeitgrenze,
  beiFortschritt(anteil) { lade.fortschritt = anteil; anzeige.fortschritt(anteil); },
  ersatz: baueErsatz,
});
starteMuenzen(welt.muenzen, welt.assets.animationen[ANIMATIONEN.muenze], MUENZEN.versatz);
aktualisiereHeldAnimation(welt.held, welt.assets, 0, HELD, ANIMATIONEN);   // steht schon hinter der Start-Tafel
zeigeTonSymbol();
automat.wechsle('start');
