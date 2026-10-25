// Test für bausteine/knopf.js: echter Touch, Maus und Tastatur im Browser (Port 8883).
const h = require('./hilfe.js');
const b = require('./browser-hilfe.js');

(async () => {
  const lauf = await b.starteProbe('knopf', 8883);
  const { seite } = lauf;
  const lies = () => seite.evaluate(() => ({
    druecke: window.probe.druecke, gedrueckt: document.getElementById('knopf').classList.contains('gedrueckt'),
    joystick: { ...window.probe.joystick.eingabe },
  }));
  try {
    const r = await seite.evaluate(() => { const k = document.getElementById('knopf').getBoundingClientRect(); return { x: k.x + k.width / 2, y: k.y + k.height / 2, b: k.width }; });
    h.pruefe(r.b >= 48, `Knopf ist ${r.b} Punkte groß (mindestens 48)`);
    let finger = await b.t.ziehe(seite, r.x, r.y, r.x + 1, r.y, { schritte: 1, loslassen: false });
    let z = await lies();
    h.pruefe(z.druecke === 1 && z.gedrueckt, 'Finger aufgesetzt → löst sofort aus (nicht erst beim Loslassen), Klasse „gedrueckt“');
    await seite.waitForTimeout(500);
    await b.touch(finger, 'touchEnd', []);
    await seite.waitForTimeout(50);
    z = await lies();
    h.pruefe(z.druecke === 1 && !z.gedrueckt, 'langes Halten und Loslassen → kein zweiter Auslöser, Klasse weg');
    await seite.touchscreen.tap(r.x, r.y);
    await seite.waitForTimeout(50);
    h.pruefe((await lies()).druecke === 2, 'Tippen → genau ein Auslöser (kein doppelter durch click)');
    await seite.mouse.click(r.x, r.y);
    await seite.waitForTimeout(50);
    h.pruefe((await lies()).druecke === 3, 'Mausklick → genau ein Auslöser');
    await seite.evaluate(() => document.getElementById('knopf').click());
    h.pruefe((await lies()).druecke === 4, 'element.click() (ohne Finger) → löst aus');
    await seite.focus('#knopf');
    await seite.keyboard.press('Enter');
    await seite.keyboard.press(' ');
    await seite.waitForTimeout(50);
    h.pruefe((await lies()).druecke === 6, 'Tastatur Enter und Leertaste → je ein Auslöser');

    finger = await b.t.ziehe(seite, r.x, r.y, r.x + 1, r.y, { schritte: 1, loslassen: false });
    await b.touch(finger, 'touchCancel', []);
    await seite.waitForTimeout(50);
    z = await lies();
    h.pruefe(z.druecke === 7 && !z.gedrueckt, 'Abbruch durch das System → Klasse „gedrueckt“ weg');

    // Zweiter Finger auf dem Knopf, während der erste den Joystick hält
    const cdp = await seite.context().newCDPSession(seite);
    const f1 = { id: 1, x: 80, y: 400 }, f2 = { id: 2, x: r.x, y: r.y };
    await b.touch(cdp, 'touchStart', [f1]);
    for (let i = 1; i <= 6; i++) { f1.x = 80 + i * 15; await b.touch(cdp, 'touchMove', [f1]); }
    const vorher = await lies();
    await b.touch(cdp, 'touchStart', [f1, f2]);
    z = await lies();
    h.pruefe(z.druecke === 8 && z.joystick.aktiv && z.joystick.x === vorher.joystick.x && z.joystick.y === vorher.joystick.y,
      `zweiter Finger auf dem Knopf löst aus, Joystick bleibt (${h.komma(z.joystick.x)} | ${h.komma(z.joystick.y)})`);
    await b.touch(cdp, 'touchEnd', [f2]);
    z = await lies();
    h.pruefe(z.joystick.aktiv && z.joystick.x > 0.99 && !z.gedrueckt, 'Knopf-Finger heben: Joystick läuft weiter');
    await b.touch(cdp, 'touchEnd', [f1]);
    z = await lies();
    h.pruefe(!z.joystick.aktiv && z.druecke === 8, 'Joystick-Finger heben: Joystick los, kein weiterer Auslöser');
    h.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  h.ergebnis();
})();
