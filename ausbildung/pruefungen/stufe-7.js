// Prüfung Stufe 7 (Ausbilder): node ausbildung/pruefungen/stufe-7.js
const t = require("../../werkzeuge/test-hilfe.js");

(async () => {
  const lauf = await t.starte({ ordner: "ausbildung/uebungen/stufe-7", port: 8970 });
  const { seite } = lauf;
  const z = () => seite.evaluate(() => ({ b: { ...window.spiel.boot }, k: { x: window.spiel.kamera.x, y: window.spiel.kamera.y, z: window.spiel.kamera.z },
    calls: window.spiel.renderer.info.render.calls, pr: window.spiel.renderer.getPixelRatio() }));
  try {
    await seite.waitForTimeout(800);
    const a = await z();
    t.pruefe(a.pr <= 2, `Pixel-Ratio höchstens 2 (${a.pr})`);
    t.pruefe(a.calls > 0 && a.calls <= 20, `höchstens 20 Zeichenaufrufe (${a.calls})`);
    const abstand0 = Math.hypot(a.k.x - a.b.x, a.k.z - a.b.z);
    const cdp = await t.ziehe(seite, 100, 650, 100, 590, { halteMs: 1500, loslassen: false });
    const b = await z();
    t.pruefe(b.b.z < a.b.z - 1 && Math.abs(b.b.x - a.b.x) < 1, `Joystick oben → Boot fährt nach −z (${(b.b.z - a.b.z).toFixed(2)})`);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await seite.waitForTimeout(1200);
    const c = await z(); await seite.waitForTimeout(500); const d = await z();
    t.pruefe(Math.hypot(d.b.x - c.b.x, d.b.z - c.b.z) < 0.05, "Loslassen stoppt");
    const abstand1 = Math.hypot(d.k.x - d.b.x, d.k.z - d.b.z);
    t.pruefe(Math.abs(abstand1 - abstand0) < Math.max(1, abstand0 * 0.25), `Kamera folgt (Abstand ${abstand0.toFixed(1)} → ${abstand1.toFixed(1)})`);
    t.pruefe(d.k.y > 3, "Kamera schräg von oben");
    const bojen = await seite.evaluate(() => { let n = 0; window.spiel.szene?.traverse?.((o) => { if (o.isInstancedMesh) n += o.count; }); return n; });
    t.pruefe(bojen === 30 || bojen === 0, `30 Bojen als InstancedMesh (${bojen}, 0 = Szene nicht angegeben)`);
    await seite.screenshot({ path: "/tmp/stufe-7-pruefung.png" });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
