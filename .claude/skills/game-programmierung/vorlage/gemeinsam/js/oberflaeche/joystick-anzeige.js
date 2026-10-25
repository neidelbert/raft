// Joystick-Anzeige als zwei HTML-Kreise (Ring und Daumen), für 2D und 3D gleich.
// Liest nur joystick.eingabe.aktiv und joystick.anzeige (bausteine/joystick.js). Schreibt das Element nur, wenn sich
// etwas geändert hat (kein neuer Text in jedem Bild, solange der Daumen still liegt oder nichts gehalten wird).
// erstelleJoystickAnzeige(dokument, joystick, { radius, knopfRadius }) → { zeichne() }   zeichne(): einmal pro Bild

export function erstelleJoystickAnzeige(dokument, joystick, { radius, knopfRadius }) {
  const ring = dokument.getElementById('joystick-ring'), daumen = dokument.getElementById('joystick-daumen');
  ring.style.width = ring.style.height = `${radius * 2}px`;
  daumen.style.width = daumen.style.height = `${knopfRadius * 2}px`;
  const zuletzt = { aktiv: false, mx: NaN, my: NaN, dx: NaN, dy: NaN };

  return {
    zeichne() {
      const { aktiv } = joystick.eingabe, a = joystick.anzeige;
      if (aktiv !== zuletzt.aktiv) {
        zuletzt.aktiv = aktiv;
        ring.hidden = daumen.hidden = !aktiv;
      }
      if (!aktiv || (a.mx === zuletzt.mx && a.my === zuletzt.my && a.dx === zuletzt.dx && a.dy === zuletzt.dy)) return;
      zuletzt.mx = a.mx; zuletzt.my = a.my; zuletzt.dx = a.dx; zuletzt.dy = a.dy;
      ring.style.transform = `translate(${a.mx - radius}px, ${a.my - radius}px)`;
      daumen.style.transform = `translate(${a.mx + a.dx - knopfRadius}px, ${a.my + a.dy - knopfRadius}px)`;
    },
  };
}
