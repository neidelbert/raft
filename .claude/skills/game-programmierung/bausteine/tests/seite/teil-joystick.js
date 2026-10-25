// Probe für joystick.js: Joystick im linken Feld, Ring und Daumen werden jedes Bild gezeichnet.
import { erstelleBildschirm } from '../../bildschirm.js';
import { erstelleJoystick, zeichneJoystick } from '../../joystick.js';

const EINSTELLUNG = { radius: 50, totzone: 0.12, knopfRadius: 22 };
const bildschirm = erstelleBildschirm(document.getElementById('leinwand'));
const joystick = erstelleJoystick(document.getElementById('feld-joystick'), EINSTELLUNG);
function bild() {
  const { ctx, breite, hoehe } = bildschirm;
  ctx.fillStyle = '#203040'; ctx.fillRect(0, 0, breite, hoehe);
  zeichneJoystick(ctx, joystick, EINSTELLUNG);
  requestAnimationFrame(bild);
}
requestAnimationFrame(bild);
window.probe = { bereit: true, joystick, radius: EINSTELLUNG.radius, totzone: EINSTELLUNG.totzone };
