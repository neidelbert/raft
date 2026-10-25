// Prüfung Stufe 2 (Ausbilder): node ausbildung/pruefungen/stufe-2.js
const t = require("../../werkzeuge/test-hilfe.js");

(async () => {
  const lauf = await t.starte({ ordner: "ausbildung/uebungen/stufe-2", port: 8920 });
  const { seite } = lauf;
  const sp = () => seite.evaluate(() => ({ ...window.spiel.spieler, e: { ...window.spiel.eingabe } }));
  try {
    const a = await sp();
    let cdp = await t.ziehe(seite, 100, 600, 160, 600, { halteMs: 500, loslassen: false });
    const b = await sp();
    t.pruefe(b.x > a.x + 40 && Math.abs(b.y - a.y) < 15, `nach rechts ziehen → Figur nach rechts (${(b.x - a.x).toFixed(0)})`);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await seite.waitForTimeout(100);
    const c = await sp(); await seite.waitForTimeout(400); const d = await sp();
    t.pruefe(Math.hypot(d.x - c.x, d.y - c.y) < 2 && d.e.x === 0 && d.e.y === 0, "Loslassen stoppt sofort");

    const e = await sp();
    cdp = await t.ziehe(seite, 100, 600, 100, 540, { halteMs: 400, loslassen: false });
    const f = await sp();
    t.pruefe(f.y < e.y - 30, `nach oben ziehen → Figur nach oben (${(e.y - f.y).toFixed(0)})`);
    // zweiter Finger auf Sprung-Knopf, während der erste noch zieht
    const k = await seite.evaluate(() => { const r = document.getElementById("knopf-sprung").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }; });
    t.pruefe(k.w >= 64 && k.h >= 64, `Sprung-Knopf mindestens 64 × 64 (${k.w.toFixed(0)} × ${k.h.toFixed(0)})`);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 100, y: 540, id: 1 }, { x: k.x, y: k.y, id: 2 }] });
    await seite.waitForTimeout(80);
    const g = await sp();
    t.pruefe(g.springt === true, "zweiter Finger auf Sprung-Knopf → Sprung");
    t.pruefe(g.e.y < -0.5, "Laufrichtung bleibt während des Sprungs erhalten");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [{ x: 100, y: 540, id: 1 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await seite.waitForTimeout(600);
    t.pruefe((await sp()).springt === false, "Sprung endet nach etwa 0,4 s");

    const h = await sp();
    await t.tippe(seite, 300, 400);
    await seite.waitForTimeout(300);
    const i = await sp();
    t.pruefe(Math.hypot(i.x - h.x, i.y - h.y) < 2, "Tippen rechts bewegt nichts");

    // schräg nicht schneller als gerade
    const tempo = async (dx, dy) => {
      const s = await sp();
      const z = await t.ziehe(seite, 100, 600, 100 + dx, 600 + dy, { schritte: 4, halteMs: 0, loslassen: false });
      const s1 = await sp(); const t1 = Date.now();
      await seite.waitForTimeout(500);
      const s2 = await sp(); const t2 = Date.now();
      await z.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await seite.waitForTimeout(100);
      return Math.hypot(s2.x - s1.x, s2.y - s1.y) / ((t2 - t1) / 1000);
    };
    const gerade = await tempo(0, -80);
    await seite.waitForTimeout(100);
    const schraeg = await tempo(-80, 80);
    t.pruefe(schraeg <= gerade * 1.1, `schräg nicht schneller (${schraeg.toFixed(0)} vs. ${gerade.toFixed(0)})`);

    const rand = await seite.evaluate(async () => {
      const s = window.spiel.spieler; return s.x >= 0 && s.y >= 0 && s.x <= innerWidth && s.y <= innerHeight;
    });
    // lange nach links ziehen → bleibt im Bild
    const z = await t.ziehe(seite, 150, 600, 60, 600, { halteMs: 3000, loslassen: false });
    const r = await sp();
    await z.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    t.pruefe(rand && r.x >= 0, `Figur bleibt im Bildschirm (x = ${r.x.toFixed(0)})`);

    const scroll = await seite.evaluate(() => ({ x: scrollX, y: scrollY, z: visualViewport ? visualViewport.scale : 1, ta: getComputedStyle(document.body).touchAction }));
    t.pruefe(scroll.x === 0 && scroll.y === 0 && scroll.z === 1, "Seite scrollt und zoomt nicht");
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
