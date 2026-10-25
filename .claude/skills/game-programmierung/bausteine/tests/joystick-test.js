// Test für bausteine/joystick.js: Rechnung ohne Browser, dann echter Touch im Browser (Port 8882).
const h = require('./hilfe.js');
const b = require('./browser-hilfe.js');

async function regeln() {
  const { rechneEingabe } = await h.lade('joystick.js');
  const e = {}, a = {};
  rechneEingabe(100, 0, 50, 0.12, e, a);
  h.pruefe(e.x === 1 && e.y === 0 && a.dx === 50, 'weit nach rechts → x = 1, Daumen bleibt am Ring (50)');
  rechneEingabe(100, 100, 50, 0.12, e, a);
  h.pruefe(Math.abs(Math.sqrt(e.x * e.x + e.y * e.y) - 1) < 1e-9, 'schräg → Länge 1, nicht √2 (schräg nicht schneller)');
  rechneEingabe(0, -25, 50, 0.12, e, a);
  h.pruefe(e.x === 0 && e.y === -0.5, 'halb nach oben → y = −0,5 (y nach unten positiv)');
  rechneEingabe(5, 0, 50, 0.12, e, a);
  h.pruefe(e.x === 0 && e.y === 0 && a.dx === 5, 'in der Totzone → Eingabe 0, Daumen wird trotzdem gezeigt');
}

const lies = (seite) => seite.evaluate(() => {
  const { eingabe, anzeige } = window.probe.joystick;
  return { ...eingabe, ...anzeige };
});

async function imBrowser() {
  const lauf = await b.starteProbe('joystick', 8882);
  const { seite } = lauf;
  try {
    let finger = await b.t.ziehe(seite, 80, 400, 180, 400, { loslassen: false });
    let z = await lies(seite);
    h.pruefe(z.aktiv && z.x > 0.99 && Math.abs(z.y) < 0.01, `nach rechts ziehen → x = ${h.komma(z.x)}, y = ${h.komma(z.y)}`);
    h.pruefe(z.mx === 80 && z.my === 400, 'schwebend: Mitte dort, wo der Daumen aufsetzte');
    await b.bilder(seite, 2);
    await seite.screenshot({ path: b.foto('joystick') });
    await b.touch(finger, 'touchEnd', []);
    z = await lies(seite);
    h.pruefe(!z.aktiv && z.x === 0 && z.y === 0 && z.dx === 0 && z.dy === 0, 'Loslassen → alles 0, nicht aktiv');

    await b.t.ziehe(seite, 100, 500, 100, 380, { loslassen: false });
    z = await lies(seite);
    h.pruefe(z.y < -0.99 && Math.abs(z.x) < 0.01, `nach oben ziehen → y = ${h.komma(z.y)}`);
    finger = await b.t.ziehe(seite, 100, 400, 150, 350, { loslassen: false });
    z = await lies(seite);
    h.pruefe(Math.abs(Math.sqrt(z.x * z.x + z.y * z.y) - 1) < 0.01, 'neuer Finger nach dem Loslassen: schräg → Länge 1');
    await b.touch(finger, 'touchCancel', []);
    z = await lies(seite);
    h.pruefe(!z.aktiv && z.x === 0 && z.y === 0, 'Abbruch durch das System (pointercancel) → alles 0');

    // Jeder Weg zum Lösen einzeln: Ereignis nachgestellt mit der pointerId des liegenden Fingers.
    // (Beim echten Abbruch kommen pointercancel und lostpointercapture zusammen, einer allein fiele nicht auf.)
    await seite.evaluate(() => document.getElementById('feld-joystick').addEventListener('pointerdown', (e) => { window.__finger = e.pointerId; }));
    for (const art of ['pointercancel', 'lostpointercapture', 'pointerup']) {
      finger = await b.t.ziehe(seite, 80, 400, 180, 400, { schritte: 3, loslassen: false });
      await seite.evaluate((a) => document.getElementById('feld-joystick').dispatchEvent(new PointerEvent(a, { pointerId: window.__finger })), art);
      z = await lies(seite);
      h.pruefe(!z.aktiv && z.x === 0 && z.y === 0, `${art} allein setzt alles zurück`);
      await b.touch(finger, 'touchEnd', []);
    }
    finger = await b.t.ziehe(seite, 80, 400, 180, 400, { schritte: 3, loslassen: false });
    await seite.evaluate(() => document.getElementById('feld-joystick').dispatchEvent(new PointerEvent('pointerup', { pointerId: window.__finger + 99 })));
    z = await lies(seite);
    h.pruefe(z.aktiv && z.x > 0.99, 'Loslassen eines anderen Fingers lässt den Joystick aktiv');
    await b.touch(finger, 'touchEnd', []);

    // Zwei Finger im Feld: nur der erste zählt
    const cdp = await seite.context().newCDPSession(seite);
    const f1 = { id: 1, x: 80, y: 400 }, f2 = { id: 2, x: 100, y: 250 };
    await b.touch(cdp, 'touchStart', [f1]);
    f1.x = 160; await b.touch(cdp, 'touchMove', [f1]);
    await b.touch(cdp, 'touchStart', [f1, f2]);
    f2.y = 150; await b.touch(cdp, 'touchMove', [f1, f2]);
    z = await lies(seite);
    h.pruefe(z.x > 0.99 && Math.abs(z.y) < 0.01 && z.mx === 80, 'zweiter Finger im Feld ändert nichts');
    await b.touch(cdp, 'touchEnd', [f2]);
    z = await lies(seite);
    h.pruefe(z.aktiv && z.x > 0.99, 'Abheben des zweiten Fingers lässt den Joystick aktiv');
    await seite.evaluate(() => window.probe.joystick.loese());
    f1.x = 60; await b.touch(cdp, 'touchMove', [f1]);
    z = await lies(seite);
    h.pruefe(!z.aktiv && z.x === 0, 'loese() → alles 0; derselbe Finger steuert danach nicht mehr');
    await b.touch(cdp, 'touchEnd', [f1]);

    await b.t.ziehe(seite, 300, 400, 360, 400, { loslassen: false });
    z = await lies(seite);
    h.pruefe(!z.aktiv && z.x === 0, 'Ziehen in der rechten Hälfte (außerhalb des Felds) bewegt nichts');
    await seite.touchscreen.tap(300, 300);

    // Maus am PC (Zusatz)
    await seite.mouse.move(60, 300); await seite.mouse.down(); await seite.mouse.move(60, 400, { steps: 4 });
    z = await lies(seite);
    const mitMaus = z.aktiv && z.y > 0.99;
    await seite.mouse.up();
    z = await lies(seite);
    h.pruefe(mitMaus && !z.aktiv && z.y === 0, 'Maus: ziehen nach unten → y = 1, loslassen → 0');
    h.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  await regeln();
  await imBrowser();
  h.ergebnis();
})();
