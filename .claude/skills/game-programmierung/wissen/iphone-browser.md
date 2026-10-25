# iPhone und Safari

## Bildschirm
- Canvas scharf: interne Größe = CSS-Größe × Pixel-Ratio (höchstens 2):
  ```js
  const pr = Math.min(window.devicePixelRatio || 1, 2);
  leinwand.width = Math.round(innerWidth * pr); leinwand.height = Math.round(innerHeight * pr);
  ctx.setTransform(pr, 0, 0, pr, 0, 0);   // danach in CSS-Pixeln zeichnen
  ```
  Bei `resize` neu setzen (Drehen des Handys, Safari-Leiste ein/aus).
- Höhe `100dvh` statt `100vh`. Ränder mit `env(safe-area-inset-top/bottom/left/right)` (Notch, Home-Balken).
- Hochformat oder Querformat: im Auftrag festgelegt. Ist das Handy falsch herum, Hinweis „Bitte drehen“ statt kaputtem Bild.

## Touch
- Pointer-Events (`pointerdown/move/up/cancel`) für Touch und Maus. Jeder Finger hat eine `pointerId`.
- `element.setPointerCapture(e.pointerId)` beim Aufsetzen, damit Ziehen außerhalb weiterläuft.
- **Loslassen und `pointercancel` setzen alle Werte zurück** (x und y, gedrückt = false). Safari schickt `pointercancel`, wenn eine Systemgeste dazwischenkommt.
- `touch-action: none` auf allem, was man berührt, sonst scrollt oder zoomt Safari. `e.preventDefault()` in `pointerdown`.
- Tippflächen mindestens 48 × 48 Punkte, Abstand zum Rand mindestens 16 Punkte plus Safe-Area.
- Mehrere Finger: Joystick nimmt nur seinen ersten Finger. Knöpfe arbeiten unabhängig davon (eigene `pointerId`).
- Kein Hover, kein Rechtsklick, kein Doppeltipp als einzige Bedienung. Langes Drücken nur mit sichtbarer Anzeige.

## Joystick (bewährt)
```js
export function erstelleJoystick(feld, knopf, { radius = 50, totzone = 0.12 } = {}) {
  const eingabe = { x: 0, y: 0, aktiv: false };
  let id = null, mx = 0, my = 0;
  function setze(dx, dy) { knopf.style.transform = `translate(${dx}px, ${dy}px)`; }
  function bewege(e) {
    let dx = e.clientX - mx, dy = e.clientY - my;
    const l = Math.hypot(dx, dy);
    if (l > radius) { dx = (dx / l) * radius; dy = (dy / l) * radius; }
    setze(dx, dy);
    const st = Math.min(l, radius) / radius;
    eingabe.x = st < totzone ? 0 : dx / radius;
    eingabe.y = st < totzone ? 0 : dy / radius;      // 2D: y nach unten positiv
  }
  function los(e) { if (e.pointerId !== id) return; id = null; eingabe.x = 0; eingabe.y = 0; eingabe.aktiv = false; setze(0, 0); }
  feld.addEventListener('pointerdown', (e) => {
    if (id !== null) return; e.preventDefault(); id = e.pointerId; feld.setPointerCapture(id);
    const r = feld.getBoundingClientRect(); mx = r.left + r.width / 2; my = r.top + r.height / 2;
    eingabe.aktiv = true; bewege(e);
  });
  feld.addEventListener('pointermove', (e) => { if (e.pointerId === id) bewege(e); });
  feld.addEventListener('pointerup', los);
  feld.addEventListener('pointercancel', los);
  return eingabe;
}
```
Schwebender Joystick (erscheint dort, wo der Daumen aufsetzt) ist auf dem Handy oft angenehmer. Die Mitte wird dann beim `pointerdown` auf die Fingerposition gesetzt.

## Safari-Eigenheiten
- **Sound** erst nach der ersten Berührung: `AudioContext` beim ersten `pointerdown` anlegen oder mit `resume()` wecken.
- **Speichern** bei `visibilitychange` (versteckt) und `pagehide`. `beforeunload` kommt auf dem iPhone oft nicht.
- **localStorage** immer in `try/catch` (privater Modus). Grenze etwa 5 MB, eigenes Budget unter 1 MB.
- **Arbeitsspeicher** über etwa 150 MB: Safari lädt die Seite ohne Warnung neu. Bilder klein halten, keine riesigen Arrays.
- **Import-Maps** erst ab Safari 16.4. `structuredClone` ab 15.4. `navigator.vibrate` gibt es nicht.
- **Vollbild-API** gibt es auf dem iPhone nicht. „Zum Home-Bildschirm“ plus `apple-mobile-web-app-capable` ergibt fast Vollbild.
- **WebGL-Verlust** (3D): `webglcontextlost` abfangen, speichern, „Bitte neu laden“ zeigen.
- **Schriften:** Systemschrift (`-apple-system`). Eigene Schriften kosten Ladezeit.

## Leistung (Zielgerät iPhone ab etwa iPhone 11)
- 60 Bilder pro Sekunde anstreben, nie unter 30.
- In der Hauptschleife keine neuen Objekte, Arrays oder Strings bauen (`map`, `filter`, Template-Strings pro Gegner pro Bild vermeiden). Wiederverwenden.
- Bis etwa 240 Gegner gleichzeitig: Gitter für die Kollision (`canvas-2d.md`), Pool, nur Sichtbares zeichnen.
- Schwere Arbeit einmal vorab erledigen: Bilder vorbereiten, Formen vorrechnen, Text-Breiten zwischenspeichern.
