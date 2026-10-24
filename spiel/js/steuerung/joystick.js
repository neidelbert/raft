// Virtueller Joystick (Touch zuerst, Maus über Pointer-Events als Zusatz).
// Übernommen aus tests/agenten/prototyp/js/steuerung.js.
import { STEUERUNG } from '../config/steuerung.js';

const JOYSTICK = STEUERUNG.joystick;

// eingabe.x: rechts positiv, eingabe.y: oben (vom Bildschirm weg) positiv, je −1 bis 1.
export function erstelleJoystick(feld, knopf) {
  const eingabe = { x: 0, y: 0 };
  let aktiverZeiger = null;
  let mitteX = 0;
  let mitteY = 0;

  function setzeKnopf(dx, dy) {
    knopf.style.transform = `translate(${dx}px, ${dy}px)`;
  }

  function bewege(ereignis) {
    let dx = ereignis.clientX - mitteX;
    let dy = ereignis.clientY - mitteY;
    const laenge = Math.hypot(dx, dy);
    if (laenge > JOYSTICK.radius) {
      dx = (dx / laenge) * JOYSTICK.radius;
      dy = (dy / laenge) * JOYSTICK.radius;
    }
    setzeKnopf(dx, dy);
    const staerke = Math.min(laenge, JOYSTICK.radius) / JOYSTICK.radius;
    if (staerke < JOYSTICK.totzone) {
      eingabe.x = 0;
      eingabe.y = 0;
    } else {
      eingabe.x = dx / JOYSTICK.radius;
      eingabe.y = -dy / JOYSTICK.radius; // Bildschirm-y zeigt nach unten
    }
  }

  // Loslassen und Abbruch setzen x UND y zurück (Lernbuch, Rollentest T1).
  function loslassen(ereignis) {
    if (ereignis.pointerId !== aktiverZeiger) return;
    aktiverZeiger = null;
    eingabe.x = 0;
    eingabe.y = 0;
    setzeKnopf(0, 0);
  }

  feld.addEventListener('pointerdown', (ereignis) => {
    if (aktiverZeiger !== null) return;
    ereignis.preventDefault();
    aktiverZeiger = ereignis.pointerId;
    feld.setPointerCapture(aktiverZeiger);
    const rahmen = feld.getBoundingClientRect();
    mitteX = rahmen.left + rahmen.width / 2;
    mitteY = rahmen.top + rahmen.height / 2;
    bewege(ereignis);
  });
  feld.addEventListener('pointermove', (ereignis) => {
    if (ereignis.pointerId === aktiverZeiger) bewege(ereignis);
  });
  feld.addEventListener('pointerup', loslassen);
  feld.addEventListener('pointercancel', loslassen);

  return { eingabe };
}
