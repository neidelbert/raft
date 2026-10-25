// Prüfung Stufe 5 (Ausbilder): node ausbildung/pruefungen/stufe-5.js
const t = require("../../werkzeuge/test-hilfe.js");
const ORDNER = process.env.PRUEF_ORDNER || "ausbildung/uebungen/stufe-5";   // PRUEF_ORDNER: Gegenprobe mit der fehlerhaften Vorlage

// langsam = altes iPhone: etwa 20 Bilder pro Sekunde statt 60 (über der Deckelung von 0,1 s, damit Delta-Zeit voll wirkt).
async function tempo(seite, langsam) {
  if (langsam) await seite.evaluate(() => {
    window.__rafEcht = window.requestAnimationFrame;
    window.__bilder = [];
    window.requestAnimationFrame = (cb) => setTimeout(() => { const t = performance.now(); window.__bilder.push(t); cb(t); }, 40);
  });
  await seite.evaluate(() => window.spiel.test.setzeSpieler(200, 400));
  const k = await seite.evaluate(() => { const r = document.getElementById("joystick").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  const z = await t.ziehe(seite, k.x, k.y, k.x + 60, k.y, { schritte: 3, loslassen: false });
  const a = await seite.evaluate(() => ({ x: window.spiel.spieler.x, t: performance.now() }));
  await seite.waitForTimeout(400);
  const b = await seite.evaluate(() => ({ x: window.spiel.spieler.x, t: performance.now() }));
  await z.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  // Anteil der Zeit, die ein Spiel mit auf 0,1 s gedeckelter Delta-Zeit überhaupt rechnen darf
  // (ist der Testrechner gerade sehr langsam, wäre sonst auch ein richtiges Spiel „zu langsam“).
  let anteil = 1;
  if (langsam) anteil = await seite.evaluate(([von, bis]) => {
    const b = window.__bilder.filter((t) => t >= von - 200 && t <= bis + 200);
    let erlaubt = 0, gesamt = 0;
    for (let i = 1; i < b.length; i++) { const d = (b[i] - b[i - 1]) / 1000; erlaubt += Math.min(d, 0.1); gesamt += d; }
    return gesamt ? erlaubt / gesamt : 1;
  }, [a.t, b.t]);
  if (langsam) await seite.evaluate(() => { window.requestAnimationFrame = window.__rafEcht; });
  await seite.waitForTimeout(150);
  return (b.x - a.x) / ((b.t - a.t) / 1000) / anteil;
}

(async () => {
  let lauf = await t.starte({ ordner: ORDNER, port: 8950, pfad: "index.html?test=1" });
  let { seite } = lauf;
  try {
    const schnell = await tempo(seite, false);
    const langsam = await tempo(seite, true);
    t.pruefe(schnell > 50 && Math.abs(langsam - schnell) / schnell < 0.25, `gleiches Tempo auf langsamem Gerät (${langsam.toFixed(0)} vs. ${schnell.toFixed(0)})`);

    const k = await seite.evaluate(() => { const r = document.getElementById("joystick").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    let z = await t.ziehe(seite, k.x, k.y, 330, 250, { schritte: 10, loslassen: false });
    await z.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await seite.waitForTimeout(100);
    let a = await seite.evaluate(() => ({ ...window.spiel.spieler })); await seite.waitForTimeout(400);
    let b = await seite.evaluate(() => ({ ...window.spiel.spieler }));
    t.pruefe(Math.hypot(b.x - a.x, b.y - a.y) < 2, "Loslassen außerhalb des Joysticks stoppt");

    z = await t.ziehe(seite, k.x, k.y, k.x, k.y - 40, { schritte: 4, loslassen: false });
    await z.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
    await seite.waitForTimeout(100);
    a = await seite.evaluate(() => ({ ...window.spiel.spieler })); await seite.waitForTimeout(400);
    b = await seite.evaluate(() => ({ ...window.spiel.spieler }));
    t.pruefe(Math.hypot(b.x - a.x, b.y - a.y) < 2, "Abbruch durch das System (pointercancel) stoppt");

    await seite.reload();
    await seite.waitForFunction("window.spiel && window.spiel.bereit");
    const p0 = await seite.evaluate(() => window.spiel.punkte);
    await seite.evaluate(() => { window.spiel.test.setzePilze([[300, 300], [312, 300], [100, 150]]); window.spiel.test.setzeSpieler(306, 300); });
    await seite.waitForTimeout(300);
    const r = await seite.evaluate(() => ({ p: window.spiel.punkte, n: window.spiel.pilze.length,
      alt: window.spiel.pilze.filter((x) => (x.x === 300 || x.x === 312) && x.y === 300).length }));
    t.pruefe(r.alt === 0 && r.p - p0 === 2, `zwei berührte Pilze geben zwei Punkte (${r.p - p0})`);
    t.pruefe(r.n === 8, `wieder 8 Pilze (${r.n})`);
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();

  // privater Modus: Speicher wirft Fehler
  try {
    lauf = await t.starte({ ordner: ORDNER, port: 8951, initSkript: () => {
      const wirf = () => { throw new DOMException("QuotaExceededError", "QuotaExceededError"); };
      Object.defineProperty(window, "localStorage", { get: () => ({ getItem: wirf, setItem: wirf, removeItem: wirf }) });
    } });
    t.pruefe(lauf.fehler.length === 0, `startet im privaten Modus ${lauf.fehler.join(" | ")}`);
    await lauf.ende();
  } catch (e) { t.pruefe(false, `startet im privaten Modus nicht: ${e.message}`); }
  try {
    lauf = await t.starte({ ordner: ORDNER, port: 8952, initSkript: () => { try { localStorage.setItem("pilz-rekord", "kaputt{"); } catch {} } });
    t.pruefe(lauf.fehler.length === 0, `kaputter Speicherstand führt nicht zum Absturz ${lauf.fehler.join(" | ")}`);
    await lauf.ende();
  } catch (e) { t.pruefe(false, `kaputter Speicherstand: Absturz (${e.message})`); }

  const fs = require("fs"), path = require("path");
  const ordner = path.join(t.REPO, ORDNER);
  t.pruefe(fs.existsSync(path.join(ordner, "REVIEW.md")), "REVIEW.md vorhanden");
  t.pruefe(fs.existsSync(path.join(ordner, "BERICHT.md")), "BERICHT.md vorhanden");
  t.ergebnis();
})();
