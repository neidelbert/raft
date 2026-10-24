// Start und Hauptschleife: verbindet die Module.
import * as THREE from 'three';
import { LEISTUNG } from './config/leistung.js';
import { erstelleBildschirm } from './kern/bildschirm.js';
import { erstelleKameraFuehrung } from './kern/kamera.js';
import { erstelleJoystick } from './steuerung/joystick.js';
import { erstelleWasser } from './welt/wasser.js';
import { erstelleFloss } from './floss/floss.js';

const { renderer, szene, kamera } = erstelleBildschirm();
const { eingabe } = erstelleJoystick(document.getElementById('joystick'), document.getElementById('joystick-knopf'));
const floss = erstelleFloss(szene, eingabe);
const wasser = erstelleWasser(szene, floss.position);
const kameraFuehrung = erstelleKameraFuehrung(kamera, floss.position);

// Reihenfolge: Eingabe (über Ereignisse), Welt, Floß, Kamera.
const teile = [wasser, floss, kameraFuehrung];

const uhr = new THREE.Clock();
let zeit = 0;
let pausiert = false;

// Kleine Schnittstelle für Tests (liest nur). Spielcode liest window.spiel nie.
window.spiel = {
  bereit: true, renderer, szene, kamera, floss, eingabe,
  get zeit() { return zeit; },
};

renderer.setAnimationLoop(() => {
  const dt = Math.min(uhr.getDelta(), LEISTUNG.deltaMax);
  if (!pausiert) {
    zeit += dt;
    for (const teil of teile) teil.aktualisiere(dt, zeit);
  }
  renderer.render(szene, kamera);
});

document.addEventListener('visibilitychange', () => {
  pausiert = document.hidden;
  uhr.getDelta(); // Sprung nach Rückkehr verwerfen
});
