// Probe für bildschirm.js: Testbild mit 1-Punkt-Linien am Rand und einem Kreis in der Mitte.
import { erstelleBildschirm } from '../../bildschirm.js';

const probe = { bereit: false, groessen: 0, bildschirm: null };
function zeichne(b) {
  const { ctx, breite, hoehe } = b;
  ctx.fillStyle = '#203040'; ctx.fillRect(0, 0, breite, hoehe);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(0.5, 0.5, breite - 1, hoehe - 1);
  ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(breite / 2, hoehe / 2, 40, 0, Math.PI * 2); ctx.fill();
}
probe.bildschirm = erstelleBildschirm(document.getElementById('leinwand'), {
  pixelRatioMax: 2,
  beiGroesse(b) { probe.groessen++; zeichne(b); },
});
window.probe = probe;
probe.bereit = true;
