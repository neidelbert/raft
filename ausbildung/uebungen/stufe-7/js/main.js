// Übung 7: Low-Poly-Boot auf Wellen, gesteuert vom schwebenden Joystick (aus Übung 2), Kamera schräg von oben
// folgt weich. 30 Bojen (eine Geometrie, InstancedMesh) hüpfen, wenn das Boot sie berührt.
// Datenfluss: Finger → joystick.eingabe → fahrt (x, z, richtung) → bojen (Berührung, Hüpfen)
//   → Modelle (Boot, Bojen, Wasser auf denselben Wellen) → Kamera folgt → renderer.render.
// Tab versteckt → Pause (nichts rechnet), Finger gelöst. window.spiel nur zum Lesen für Tests.
import { SPIEL, FARBEN, LICHT, NEBEL } from './config/spiel.js';
import { KAMERA } from './config/kamera.js';
import { BOOT } from './config/boot.js';
import { WASSER, WELLEN } from './config/wasser.js';
import { BOJEN } from './config/bojen.js';
import { BOOT_MODELL, BOJE_MODELL } from './config/modelle.js';
import { JOYSTICK } from './config/steuerung.js';
import { erstelleBuehne } from './kern/renderer.js';
import { erstelleZufall } from './kern/zufall.js';
import { erstelleJoystick } from './steuerung/joystick.js';
import { erstelleJoystickAnzeige } from './steuerung/joystick-anzeige.js';
import { bereiteWellenVor, welleHoehe } from './welt/wellen.js';
import { erstelleWasser } from './welt/wasser.js';
import { erstelleFahrt, fahre } from './welt/fahrt.js';
import { erstelleBoot } from './welt/boot.js';
import { erstelleBojen, pruefeBeruehrung, aktualisiereHuepfen } from './welt/bojen-regeln.js';
import { erstelleBojenModell, zeigeBojen } from './welt/bojen.js';
import { folgeKamera } from './welt/kamera-folge.js';

const adresse = new URLSearchParams(location.search);
const seed = Number.parseInt(adresse.get('seed'), 10);
const zufall = erstelleZufall(Number.isFinite(seed) ? seed : undefined);

// Safari zoomt trotz user-scalable=no mit zwei Fingern: Gesten abfangen.
for (const art of ['gesturestart', 'gesturechange']) document.addEventListener(art, (e) => e.preventDefault());

const { renderer, szene, kamera } = erstelleBuehne(
  { spiel: SPIEL, farben: FARBEN, licht: LICHT, nebel: NEBEL, kamera: KAMERA }, document.getElementById('hinweis-grafik'));
const joystick = erstelleJoystick(document.getElementById('feld-joystick'), JOYSTICK);
const zeigeJoystick = erstelleJoystickAnzeige(document.getElementById('joystick-ring'), document.getElementById('joystick-daumen'), JOYSTICK);

const wellen = bereiteWellenVor(WELLEN);
const wasser = erstelleWasser(WASSER, wellen, FARBEN.wasser);
const fahrt = erstelleFahrt();
const boot = erstelleBoot(BOOT, BOOT_MODELL, FARBEN.schatten);
const bojen = erstelleBojen(BOJEN, zufall);
const bojenModell = erstelleBojenModell(BOJEN, BOJE_MODELL, bojen.anzahl);
szene.add(wasser.mesh, boot.gruppe, bojenModell);

const welt = { zeit: 0 };   // Wellenzeit in Sekunden (läuft nur, wenn nicht pausiert)

function aktualisiere(dt) {
  welt.zeit += dt;
  fahre(fahrt, joystick.eingabe.x, joystick.eingabe.y, BOOT.tempo, BOOT.drehTempo, dt);
  pruefeBeruehrung(bojen, fahrt.x, fahrt.z, BOOT.radius, BOJEN.radius);
  aktualisiereHuepfen(bojen, dt, BOJEN.huepfDauer);
  folgeKamera(kamera.position, fahrt.x, KAMERA.versatzY, fahrt.z + KAMERA.versatzZ, KAMERA.folgeTempo, dt);
}

function zeigeWelt() {
  const { zeit } = welt;
  wasser.aktualisiere(fahrt.x, fahrt.z, zeit);
  boot.setzeLage(fahrt.x, welleHoehe(wellen, fahrt.x, fahrt.z, zeit), fahrt.z, fahrt.richtung,
    BOOT.schaukeln * Math.sin(zeit * BOOT.schaukelTempo));
  zeigeBojen(bojenModell, bojen, wellen, zeit, BOJEN, BOJE_MODELL);
  kamera.lookAt(fahrt.x, KAMERA.blickHoehe, fahrt.z);
  zeigeJoystick(joystick);
}

// Start: Kamera steht gleich am Ziel (kein Anflug beim Laden).
kamera.position.set(fahrt.x, KAMERA.versatzY, fahrt.z + KAMERA.versatzZ);

// Test-Schnittstelle (der Spielcode liest sie nie).
const spiel = { bereit: false, boot: fahrt, kamera: kamera.position, renderer, szene };
if (adresse.get('test') === '1') {
  spiel.test = {
    bojen,
    eingabe: joystick.eingabe,
    // Boot an eine Stelle setzen (z. B. auf eine Boje), Kamera zieht weich nach.
    setzeBoot(x, z) { fahrt.x = x; fahrt.z = z; },
  };
}
window.spiel = spiel;

let letzte = 0;
let pausiert = document.hidden;

function bild(jetzt) {
  const dt = Math.min(Math.max(jetzt - letzte, 0) / 1000, SPIEL.deltaMax);   // Sekunden, gedeckelt
  // Nie zurückgehen: Nach einem Tab-Wechsel kommt oft noch ein Bild mit altem Zeitstempel (Lernbuch Stufe 1).
  letzte = Math.max(letzte, jetzt);
  if (!pausiert) aktualisiere(dt);
  zeigeWelt();
  renderer.render(szene, kamera);
  if (!spiel.bereit) spiel.bereit = true;
}

document.addEventListener('visibilitychange', () => {
  pausiert = document.hidden;
  letzte = performance.now();   // keinen Zeitsprung nach der Rückkehr
  if (document.hidden) joystick.loese();   // ein Finger, der beim Wechsel lag, kommt nie mehr hoch
});

letzte = performance.now();
renderer.setAnimationLoop(bild);
