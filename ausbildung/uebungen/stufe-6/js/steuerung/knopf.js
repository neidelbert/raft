// Bildschirm-Knopf, der sofort beim Aufsetzen auslöst (nicht erst beim Loslassen wie click).
// erstelleKnopf(element, beimDruecken) – jeder Finger hat seine eigene pointerId, der Joystick bleibt unberührt.
export function erstelleKnopf(element, beimDruecken) {
  element.addEventListener('pointerdown', (e) => {
    e.preventDefault();      // kein Fokus, kein Doppeltipp-Zoom
    element.classList.add('gedrueckt');
    beimDruecken();
  });
  // Klick ohne Finger oder Maus (Tastatur Enter/Leertaste, element.click()): detail ist dann 0.
  // Echte Tipps haben detail ≥ 1 und wurden schon beim pointerdown ausgelöst.
  element.addEventListener('click', (e) => { if (e.detail === 0) beimDruecken(); });
  const loslassen = () => element.classList.remove('gedrueckt');
  element.addEventListener('pointerup', loslassen);
  element.addEventListener('pointercancel', loslassen);
  element.addEventListener('pointerleave', loslassen);
}
