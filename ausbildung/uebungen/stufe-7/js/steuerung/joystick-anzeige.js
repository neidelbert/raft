// Joystick sichtbar machen (in 3D gibt es keinen 2D-Canvas, darum zwei HTML-Kreise über dem Bild).
// erstelleJoystickAnzeige(ring, daumen, einstellung) → aktualisiere(joystick), einmal pro Bild aufrufen.
// Ändert das HTML nur, wenn sich etwas bewegt hat (kein neuer Text pro Bild im Stillstand).
export function erstelleJoystickAnzeige(ring, daumen, { radius, knopfRadius }) {
  ring.style.width = ring.style.height = `${radius * 2}px`;
  daumen.style.width = daumen.style.height = `${knopfRadius * 2}px`;
  let sichtbar = false, letzteX = NaN, letzteY = NaN, letzteDx = NaN, letzteDy = NaN;

  return function aktualisiere({ eingabe, anzeige }) {
    if (eingabe.aktiv !== sichtbar) {
      sichtbar = eingabe.aktiv;
      ring.hidden = daumen.hidden = !sichtbar;
    }
    if (!sichtbar) return;
    const { mx, my, dx, dy } = anzeige;
    if (mx === letzteX && my === letzteY && dx === letzteDx && dy === letzteDy) return;
    letzteX = mx; letzteY = my; letzteDx = dx; letzteDy = dy;
    ring.style.transform = `translate(${mx - radius}px, ${my - radius}px)`;
    daumen.style.transform = `translate(${mx + dx - knopfRadius}px, ${my + dy - knopfRadius}px)`;
  };
}
