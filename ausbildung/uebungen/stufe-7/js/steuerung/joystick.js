// Aus Übung 2 kopiert (unverändert bis auf das Zeichnen: das macht in 3D joystick-anzeige.js mit HTML).
// Schwebender Joystick: erscheint, wo der Daumen im Feld (linke Bildschirmhälfte) aufsetzt.
// erstelleJoystick(feld, einstellung) gibt { eingabe, anzeige, loese } zurück:
//   eingabe = { x, y, aktiv }: Richtung -1…1 (y nach unten positiv), Länge höchstens 1.
//   anzeige = { mx, my, dx, dy }: Mitte und Daumen-Auslenkung in CSS-Punkten, nur zum Zeichnen.
//   loese() setzt alles zurück (z. B. wenn der Tab versteckt wird).
// Nur der erste Finger im Feld zählt; andere Finger (Sprung-Knopf) haben eigene pointerId und stören nicht.

// Reine Rechnung ohne DOM: Auslenkung (dx, dy) in Punkten → eingabe.x/y (Länge ≤ 1) und anzeige.dx/dy (≤ radius).
// Schreibt in die übergebenen Objekte, damit beim Ziehen keine neuen Objekte entstehen.
export function rechneEingabe(dx, dy, radius, totzone, eingabe, anzeige) {
  const laenge = Math.hypot(dx, dy);
  if (laenge > radius) { dx = (dx / laenge) * radius; dy = (dy / laenge) * radius; }   // nie über den Ring hinaus
  const imTotbereich = Math.min(laenge, radius) / radius < totzone;
  eingabe.x = imTotbereich ? 0 : dx / radius;
  eingabe.y = imTotbereich ? 0 : dy / radius;
  anzeige.dx = dx;
  anzeige.dy = dy;
}

export function erstelleJoystick(feld, { radius, totzone }) {
  const eingabe = { x: 0, y: 0, aktiv: false };
  const anzeige = { mx: 0, my: 0, dx: 0, dy: 0 };
  let finger = null;   // pointerId des Joystick-Fingers

  function bewege(e) {
    rechneEingabe(e.clientX - anzeige.mx, e.clientY - anzeige.my, radius, totzone, eingabe, anzeige);
  }

  // Loslassen, Abbruch durch Safari (pointercancel) und verlorener Finger: immer alle Werte zurück.
  function loese() {
    finger = null;
    eingabe.x = 0; eingabe.y = 0; eingabe.aktiv = false;
    anzeige.dx = 0; anzeige.dy = 0;
  }
  function losVonFinger(e) { if (e.pointerId === finger) loese(); }

  feld.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (finger !== null) return;            // zweiter Finger im Feld wird ignoriert
    finger = e.pointerId;
    try { feld.setPointerCapture(finger); } catch { /* Finger schon weg: los() kommt trotzdem */ }
    anzeige.mx = e.clientX;                 // schwebend: Mitte dort, wo der Daumen aufsetzt
    anzeige.my = e.clientY;
    eingabe.aktiv = true;
    bewege(e);
  });
  feld.addEventListener('pointermove', (e) => { if (e.pointerId === finger) bewege(e); });
  feld.addEventListener('pointerup', losVonFinger);
  feld.addEventListener('pointercancel', losVonFinger);
  feld.addEventListener('lostpointercapture', losVonFinger);

  return { eingabe, anzeige, loese };
}
