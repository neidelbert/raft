// Baustein „joystick“: schwebender Joystick für Touch (und Maus), erscheint dort, wo der Daumen aufsetzt.
// Wofür: Laufen und Fahren in 2D und 3D. Nur der erste Finger im Feld zählt; andere Finger (Knöpfe, zweiter Finger)
//   haben eine eigene pointerId und stören nicht. Loslassen, Abbruch durch Safari (pointercancel) und verlorener
//   Finger (lostpointercapture) setzen ALLE Werte zurück (Lernbuch: sonst läuft die Figur weiter).
//   Kein Zugriff auf den Browser beim Laden; rechneEingabe ist reine Rechnung (mit node testbar).
// Schnittstelle:
//   erstelleJoystick(feld, { radius = 50, totzone = 0.12 }) → { eingabe, anzeige, loese(), entferne() }
//     feld: Element, auf dem der Daumen aufsetzt (z. B. linke Bildschirmhälfte). CSS: touch-action: none.
//     radius: Punkte bis zum vollen Ausschlag. totzone: Anteil des Radius, unter dem die Eingabe 0 ist.
//     eingabe = { x, y, aktiv }: Richtung −1 … 1, y nach unten positiv, Länge höchstens 1 (schräg nicht schneller).
//     anzeige = { mx, my, dx, dy }: Mitte und Daumen-Auslenkung in CSS-Punkten (nur zum Zeichnen).
//     loese(): alles zurück, z. B. beim Verstecken des Tabs oder beim Zustandswechsel (der Finger kommt nie hoch).
//   rechneEingabe(dx, dy, radius, totzone, eingabe, anzeige): Auslenkung → eingabe und anzeige (schreibt hinein).
//   zeichneJoystick(ctx, joystick, { radius, knopfRadius, ringBreite, ringFarbe, knopfFarbe }): Ring und Daumen (2D).
// 3D: „oben“ (y = −1) heißt vom Bildschirm weg, also −z: z = eingabe.y. Anzeige dann mit zwei HTML-Kreisen.
// Beispiel:
//   import { erstelleJoystick, zeichneJoystick } from './steuerung/joystick.js';
//   const joystick = erstelleJoystick(document.getElementById('feld-joystick'), JOYSTICK);   // { radius, totzone } aus config
//   // in aktualisiere(dt):
//   spieler.x += joystick.eingabe.x * SPIELER.laufTempo * dt;
//   spieler.y += joystick.eingabe.y * SPIELER.laufTempo * dt;
//   // in zeichne():
//   zeichneJoystick(ctx, joystick, JOYSTICK);

export function rechneEingabe(dx, dy, radius, totzone, eingabe, anzeige) {
  const laenge = Math.sqrt(dx * dx + dy * dy);   // nicht Math.hypot: legt in Chrome pro Aufruf Speicher an
  if (laenge > radius) { dx = (dx / laenge) * radius; dy = (dy / laenge) * radius; }   // nie über den Ring hinaus
  const imTotbereich = Math.min(laenge, radius) / radius < totzone;
  eingabe.x = imTotbereich ? 0 : dx / radius;
  eingabe.y = imTotbereich ? 0 : dy / radius;
  anzeige.dx = dx;
  anzeige.dy = dy;
}

export function erstelleJoystick(feld, { radius = 50, totzone = 0.12 } = {}) {
  const eingabe = { x: 0, y: 0, aktiv: false };
  const anzeige = { mx: 0, my: 0, dx: 0, dy: 0 };
  let finger = null;   // pointerId des Joystick-Fingers

  function bewege(e) { rechneEingabe(e.clientX - anzeige.mx, e.clientY - anzeige.my, radius, totzone, eingabe, anzeige); }

  function loese() {
    finger = null;
    eingabe.x = 0; eingabe.y = 0; eingabe.aktiv = false;
    anzeige.dx = 0; anzeige.dy = 0;
  }
  function losVonFinger(e) { if (e.pointerId === finger) loese(); }

  function aufsetzen(e) {
    e.preventDefault();
    if (finger !== null) return;            // zweiter Finger im Feld wird ignoriert
    finger = e.pointerId;
    try { feld.setPointerCapture(finger); } catch { /* Finger schon weg: pointerup kommt trotzdem */ }
    anzeige.mx = e.clientX;                 // schwebend: Mitte dort, wo der Daumen aufsetzt
    anzeige.my = e.clientY;
    eingabe.aktiv = true;
    bewege(e);
  }
  function ziehen(e) { if (e.pointerId === finger) bewege(e); }

  const hoerer = [['pointerdown', aufsetzen], ['pointermove', ziehen], ['pointerup', losVonFinger],
    ['pointercancel', losVonFinger], ['lostpointercapture', losVonFinger]];
  for (const [art, f] of hoerer) feld.addEventListener(art, f);
  function entferne() { for (const [art, f] of hoerer) feld.removeEventListener(art, f); loese(); }

  return { eingabe, anzeige, loese, entferne };
}

// Ring und Daumen, nur solange der Joystick gehalten wird.
export function zeichneJoystick(ctx, joystick, { radius = 50, knopfRadius = 22, ringBreite = 3,
  ringFarbe = 'rgba(255,255,255,0.45)', knopfFarbe = 'rgba(255,255,255,0.7)' } = {}) {
  if (!joystick.eingabe.aktiv) return;
  const { mx, my, dx, dy } = joystick.anzeige;
  ctx.lineWidth = ringBreite;
  ctx.strokeStyle = ringFarbe;
  ctx.beginPath();
  ctx.arc(mx, my, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = knopfFarbe;
  ctx.beginPath();
  ctx.arc(mx + dx, my + dy, knopfRadius, 0, Math.PI * 2);
  ctx.fill();
}
