// Probe für knopf.js: zählt Drücke; daneben ein Joystick, damit sich zwei Finger prüfen lassen.
import { erstelleKnopf } from '../../knopf.js';
import { erstelleJoystick } from '../../joystick.js';

const probe = { bereit: false, druecke: 0, joystick: null };
erstelleKnopf(document.getElementById('knopf'), () => { probe.druecke++; });
probe.joystick = erstelleJoystick(document.getElementById('feld-joystick'), { radius: 50, totzone: 0.12 });
window.probe = probe;
probe.bereit = true;
