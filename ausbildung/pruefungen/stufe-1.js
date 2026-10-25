// Prüfung Stufe 1 (Ausbilder): node ausbildung/pruefungen/stufe-1.js
const t = require("../../werkzeuge/test-hilfe.js");

async function strecke(seite, ms) {
  // Summe der Wegstücke in Abtastschritten von 50 ms (Abprallen zählt mit).
  return seite.evaluate((dauer) => new Promise((fertig) => {
    let summe = 0, letzt = { x: window.spiel.ball.x, y: window.spiel.ball.y };
    const start = performance.now();
    const id = setInterval(() => {
      const b = window.spiel.ball; summe += Math.hypot(b.x - letzt.x, b.y - letzt.y); letzt = { x: b.x, y: b.y };
      if (performance.now() - start >= dauer) { clearInterval(id); fertig(summe * 1000 / (performance.now() - start)); }
    }, 50);
  }), ms);
}

(async () => {
  const lauf = await t.starte({ ordner: "ausbildung/uebungen/stufe-1", port: 8910 });
  const { seite } = lauf;
  try {
    const info = await seite.evaluate(() => {
      const c = document.querySelector("canvas"), s = window.spiel;
      return { pr: s.pixelRatio, cw: c.width, ch: c.height, bw: c.getBoundingClientRect().width, bh: c.getBoundingClientRect().height,
        iw: innerWidth, ih: innerHeight, breite: s.breite, hoehe: s.hoehe };
    });
    t.pruefe(info.pr <= 2 && info.pr >= 1, `Pixel-Ratio höchstens 2 (${info.pr})`);
    t.pruefe(Math.abs(info.bw - info.iw) <= 1 && Math.abs(info.bh - info.ih) <= 1, "Canvas füllt den Bildschirm");
    t.pruefe(Math.abs(info.cw - Math.round(info.iw * info.pr)) <= 1, `interne Breite = Breite × Pixel-Ratio (${info.cw})`);
    const tempo = await seite.evaluate(async () => (await import("./js/config/spiel.js")).SPIEL?.ballTempo ?? null);
    t.pruefe(typeof tempo === "number", `ballTempo in config/spiel.js (${tempo})`);
    // Last auf dem Testrechner kann die Bildrate unter 10 drücken, dann bremst die Deckelung auch ein richtiges Spiel.
    // Darum bis zu 3 Messungen, die beste zählt.
    const beste = async () => { let b = 0; for (let i = 0; i < 3; i++) { const v = await strecke(seite, 1500);
      if (Math.abs(v - tempo) < Math.abs(b - tempo)) b = v; if (Math.abs(b - tempo) / tempo < 0.25) break; } return b; };
    const v1 = await beste();
    t.pruefe(Math.abs(v1 - tempo) / tempo < 0.25, `Tempo stimmt (${v1.toFixed(0)} statt ${tempo} Punkte/s)`);
    const cdp = await seite.context().newCDPSession(seite);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const v2 = await beste();
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
    t.pruefe(Math.abs(v2 - tempo) / tempo < 0.25, `Tempo auch bei langsamem Gerät gleich (${v2.toFixed(0)})`);
    const raus = await seite.evaluate(() => new Promise((fertig) => {
      let schlecht = 0; const start = performance.now();
      (function schau() {
        const b = window.spiel.ball, s = window.spiel;
        if (b.x < b.r - 2 || b.y < b.r - 2 || b.x > s.breite - b.r + 2 || b.y > s.hoehe - b.r + 2) schlecht++;
        performance.now() - start < 3000 ? requestAnimationFrame(schau) : fertig(schlecht);
      })();
    }));
    t.pruefe(raus === 0, "Ball bleibt im Bildschirm (3 s)");
    const sprung = await seite.evaluate(() => new Promise((fertig) => {
      requestAnimationFrame(() => {
        const a = { x: window.spiel.ball.x, y: window.spiel.ball.y };
        const ende = performance.now() + 600; while (performance.now() < ende) {}   // Gerät hängt 0,6 s
        requestAnimationFrame(() => requestAnimationFrame(() => {
          const b = window.spiel.ball; fertig(Math.hypot(b.x - a.x, b.y - a.y));
        }));
      });
    }));
    t.pruefe(sprung < tempo * 0.1 * 2 + 25, `kein Sprung nach Hänger (${sprung.toFixed(0)} Punkte)`);
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
