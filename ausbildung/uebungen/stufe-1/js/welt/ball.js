// Ball-Regeln ohne DOM (auch mit node testbar).
// Ein Ball ist { x, y, r, vx, vy }: Mitte und Radius in Punkten, Geschwindigkeit in Punkten pro Sekunde.

// Neuer Ball in der Bildschirmmitte, schräg in eine zufällige der vier Richtungen.
export function erstelleBall({ breite, hoehe, radius, tempo, winkelMin, winkelMax, zufall }) {
  const grad = winkelMin + (winkelMax - winkelMin) * zufall();
  const winkel = (grad * Math.PI) / 180;
  const richtungX = zufall() < 0.5 ? -1 : 1;
  const richtungY = zufall() < 0.5 ? -1 : 1;
  return {
    x: breite / 2,
    y: hoehe / 2,
    r: radius,
    vx: Math.cos(winkel) * tempo * richtungX,
    vy: Math.sin(winkel) * tempo * richtungY,
  };
}

// Eine Achse bewegen und an [r, groesse - r] spiegeln. achse ist 'x' oder 'y', tempoAchse 'vx' oder 'vy'.
// Spiegeln statt nur Abschneiden, damit der Ball auch bei großen Zeitschritten keine Strecke verliert.
// Schreibt direkt in den Ball, damit pro Bild keine neuen Objekte entstehen.
function prallAchse(ball, achse, tempoAchse, groesse, dt) {
  const min = ball.r, max = groesse - ball.r;
  if (max <= min) { ball[achse] = groesse / 2; return; }   // Bildschirm kleiner als der Ball: in der Mitte halten
  let pos = ball[achse] + ball[tempoAchse] * dt;
  while (pos < min || pos > max) {                  // mehrfach, falls ein Schritt länger als die Strecke ist
    if (pos < min) { pos = 2 * min - pos; ball[tempoAchse] = Math.abs(ball[tempoAchse]); }
    else { pos = 2 * max - pos; ball[tempoAchse] = -Math.abs(ball[tempoAchse]); }
  }
  ball[achse] = pos;
}

export function bewegeBall(ball, dt, breite, hoehe) {
  prallAchse(ball, 'x', 'vx', breite, dt);
  prallAchse(ball, 'y', 'vy', hoehe, dt);
}

// Nach einer Größenänderung (Drehen, Safari-Leiste) den Ball zurück in den Bildschirm holen.
export function haltImBild(ball, breite, hoehe) {
  bewegeBall(ball, 0, breite, hoehe);
}

export function zeichneBall(ctx, ball, farbe) {
  ctx.fillStyle = farbe;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}
