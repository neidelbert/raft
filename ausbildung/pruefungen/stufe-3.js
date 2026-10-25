// Prüfung Stufe 3 (Ausbilder): node ausbildung/pruefungen/stufe-3.js
const t = require("../../werkzeuge/test-hilfe.js");

(async () => {
  const lauf = await t.starte({ ordner: "ausbildung/uebungen/stufe-3", port: 8930, pfad: "index.html?test=1&seed=7" });
  const { seite } = lauf;
  try {
    t.pruefe(await seite.evaluate(() => typeof window.spiel.test?.fuelleGegner === "function"), "Test-Hilfe fuelleGegner mit ?test=1");
    await seite.evaluate(() => window.spiel.test.fuelleGegner(240));
    await seite.waitForTimeout(3000);
    const m = await seite.evaluate(() => ({ n: window.spiel.gegnerAktiv, ms: window.spiel.messung.schrittMs }));
    t.pruefe(m.n >= 200 && m.n <= 240, `240 Gegner gleichzeitig (aktiv: ${m.n})`);
    t.pruefe(m.ms < 4, `Spiel-Schritt mit vielen Gegnern unter 4 ms (${m.ms.toFixed(2)} ms)`);
    await seite.evaluate(() => window.spiel.test.fuelleGegner(500));
    await seite.waitForTimeout(300);
    t.pruefe(await seite.evaluate(() => window.spiel.gegnerAktiv) <= 240, "nie mehr als die Grenze");

    // Überlappung: mittlerer Abstand zum nächsten Nachbarn nicht winzig
    const dicht = await seite.evaluate(() => window.spiel.test.naechsterAbstand ? window.spiel.test.naechsterAbstand() : null);
    if (dicht !== null) t.pruefe(dicht > 4, `Gegner stapeln sich nicht (mittlerer Abstand ${dicht.toFixed(1)})`);

    // Leben: neu laden, ein Gegner direkt am Spieler
    await seite.goto("http://127.0.0.1:8930/index.html?test=1&seed=7");
    await seite.waitForFunction("window.spiel && window.spiel.bereit");
    const l0 = await seite.evaluate(() => window.spiel.spieler.leben);
    t.pruefe(l0 === 5, `Start mit 5 Leben (${l0})`);
    await seite.evaluate(() => window.spiel.test.fuelleGegner(30));
    const verlauf = await seite.evaluate(() => new Promise((fertig) => {
      const werte = []; const start = performance.now();
      (function schau() {
        const s = window.spiel.spieler; werte.push({ t: performance.now() - start, l: s.leben, u: s.unverwundbar });
        performance.now() - start < 6000 && s.leben > 0 ? requestAnimationFrame(schau) : fertig(werte);
      })();
    }));
    const verluste = [];
    for (let i = 1; i < verlauf.length; i++) if (verlauf[i].l < verlauf[i - 1].l) verluste.push({ t: verlauf[i].t, d: verlauf[i - 1].l - verlauf[i].l });
    t.pruefe(verluste.length >= 1, `Kollision kostet Leben (${verluste.length}-mal)`);
    t.pruefe(verluste.every((v) => v.d === 1), "jeweils genau 1 Leben");
    const abstaende = verluste.slice(1).map((v, i) => v.t - verluste[i].t);
    t.pruefe(abstaende.every((a) => a >= 950), `danach 1 s Schutz (kleinster Abstand ${abstaende.length ? Math.min(...abstaende).toFixed(0) : "–"} ms)`);
    t.pruefe(verlauf.some((v) => v.u), "unverwundbar wird angezeigt");
    await seite.screenshot({ path: "/tmp/stufe-3-pruefung.png" });
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
  t.ergebnis();
})();
