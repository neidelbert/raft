// Baustein „knopf“: Bildschirm-Knopf, der sofort beim Aufsetzen des Fingers auslöst.
// Wofür: Springen, Schießen, Ton an/aus, Pause. `click` käme erst beim Loslassen (fühlt sich träge an). Jeder Finger
//   hat seine eigene pointerId: Ein Knopf stört den Joystick-Finger nicht. Tastatur (Enter, Leertaste) und
//   element.click() lösen auch aus: Ihr click hat detail 0, echte Tipps (detail ≥ 1) zählen schon bei pointerdown,
//   so gibt es keinen Doppelauslöser (Lernbuch Stufe 2). Kein Zugriff auf den Browser beim Laden.
// Schnittstelle:
//   erstelleKnopf(element, beimDruecken) → { entferne() }
//     element: <button>, mindestens 48 × 48 Punkte, CSS touch-action: none. Solange gedrückt: Klasse „gedrueckt“
//       (für CSS, z. B. transform: scale(0.94)).
//     beimDruecken(): einmal pro Druck. Langes Halten löst nicht noch einmal aus.
//   Liegt der Knopf über einer „Tippen zum Starten“-Tafel, die pointerdown am window abfängt, muss der Fang-Handler
//   ihn ausnehmen: if (e.target.closest('#knopf-ton')) return;
// Beispiel:
//   import { erstelleKnopf } from './steuerung/knopf.js';
//   erstelleKnopf(document.getElementById('knopf-sprung'), () => starteSprung(welt.spieler));

export function erstelleKnopf(element, beimDruecken) {
  function aufsetzen(e) {
    e.preventDefault();      // kein Fokus-Sprung, kein Doppeltipp-Zoom, kein nachgeschobener Maus-Klick
    element.classList.add('gedrueckt');
    beimDruecken();
  }
  function ohneFinger(e) { if (e.detail === 0) beimDruecken(); }
  function loslassen() { element.classList.remove('gedrueckt'); }

  const hoerer = [['pointerdown', aufsetzen], ['click', ohneFinger], ['pointerup', loslassen],
    ['pointercancel', loslassen], ['pointerleave', loslassen]];
  for (const [art, f] of hoerer) element.addEventListener(art, f);
  return { entferne() { for (const [art, f] of hoerer) element.removeEventListener(art, f); loslassen(); } };
}
