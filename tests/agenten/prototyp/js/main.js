import * as THREE from 'three';
import { erstelleSzene } from './szene.js';
import { erstelleWasser } from './wasser.js';
import { erstelleFloss } from './floss.js';
import { erstelleKameraFuehrung } from './kamera.js';
import { erstelleJoystick } from './steuerung.js';

const { renderer, szene, kamera } = erstelleSzene();
const wasser = erstelleWasser(szene);
const floss = erstelleFloss(szene);
const kameraFuehrung = erstelleKameraFuehrung(kamera, floss.position);
const joystick = erstelleJoystick(document.getElementById('joystick'), document.getElementById('joystick-knopf'));

const uhr = new THREE.Clock();

// Kleine Schnittstelle für Tests (liest nur).
window.spiel = { floss, kamera, eingabe: joystick.eingabe };

renderer.setAnimationLoop(() => {
  const delta = Math.min(uhr.getDelta(), 0.1); // große Sprünge nach Tab-Wechsel abfangen
  const zeit = uhr.elapsedTime;
  floss.aktualisiere(delta, zeit, joystick.eingabe);
  wasser.aktualisiere(zeit, floss.position.x, floss.position.z);
  kameraFuehrung.aktualisiere(delta);
  renderer.render(szene, kamera);
});
