// Prüfung Stufe 6 (Ausbilder): node ausbildung/pruefungen/stufe-6.js
const t = require("../../werkzeuge/test-hilfe.js");
const fs = require("fs"), path = require("path"), os = require("os");
const ORDNER = "ausbildung/uebungen/stufe-6";

(async () => {
  let lauf = await t.starte({ ordner: ORDNER, port: 8960, pfad: "index.html?test=1&seed=5" });
  let { seite } = lauf;
  try {
    await seite.evaluate(() => localStorage.clear());
    await seite.reload(); await seite.waitForFunction("window.spiel && window.spiel.bereit");
    t.pruefe(await seite.evaluate(() => window.spiel.ton.bereit) === false, "Ton erst nach der ersten Berührung");
    await t.tippe(seite, 195, 400);
    await seite.waitForTimeout(300);
    t.pruefe(await seite.evaluate(() => window.spiel.ton.bereit) === true, "nach erster Berührung Ton bereit");

    await seite.evaluate(() => window.spiel.test.schaden(1));
    const w = await seite.evaluate(() => new Promise((fertig) => {
      const werte = []; const start = performance.now();
      (function schau() { werte.push(window.spiel.effekte.wackeln); performance.now() - start < 1200 ? requestAnimationFrame(schau) : fertig(werte); })();
    }));
    t.pruefe(Math.max(...w) > 0, "Treffer lässt den Bildschirm wackeln");
    t.pruefe(w[w.length - 1] === 0, "Wackeln klingt in unter 1,2 s ab");

    const max = await seite.evaluate(() => window.spiel.effekte.partikelMax);
    let hoechst = 0;
    for (let i = 0; i < 20; i++) {
      await seite.evaluate(() => window.spiel.test.sammleStern());
      hoechst = Math.max(hoechst, await seite.evaluate(() => window.spiel.effekte.partikelAktiv));
    }
    t.pruefe(hoechst > 0 && hoechst <= max, `Partikel beim Einsammeln, nie über die Grenze (${hoechst}/${max})`);
    t.pruefe(await seite.evaluate(() => window.spiel.sterne) >= 20, "Sterne werden gezählt");
    await seite.waitForTimeout(1300);
    t.pruefe(await seite.evaluate(() => window.spiel.effekte.partikelAktiv) === 0, "Partikel nach etwa 1 s wieder weg");

    const k = await seite.evaluate(() => { const r = document.getElementById("knopf-ton").getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await t.tippe(seite, k.x, k.y);
    await seite.waitForTimeout(200);
    t.pruefe(await seite.evaluate(() => window.spiel.ton.an) === false, "Ton-Knopf schaltet aus");
    await seite.reload(); await seite.waitForFunction("window.spiel && window.spiel.bereit");
    t.pruefe(await seite.evaluate(() => window.spiel.ton.an) === false, "Ton-Einstellung bleibt nach Neuladen");
    t.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();

  // Ersatzbild: Kopie ohne stern.png
  const kopie = fs.mkdtempSync(path.join(os.tmpdir(), "stufe6-"));
  fs.cpSync(path.join(t.REPO, ORDNER), kopie, { recursive: true });
  const stern = (function finde(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name); if (e.isDirectory()) { const r = finde(p); if (r) return r; } else if (e.name === "stern.png") return p; } return null; })(kopie);
  t.pruefe(Boolean(stern), "stern.png vorhanden");
  if (stern) fs.rmSync(stern);
  try {
    lauf = await t.starte({ ordner: kopie, port: 8961, pfad: "index.html?test=1&seed=5" });
    seite = lauf.seite;
    await t.tippe(seite, 195, 400);
    await seite.evaluate(() => window.spiel.test.sammleStern());
    await seite.waitForTimeout(2500);
    const echteFehler = lauf.fehler.filter((f) => !/Failed to load resource|404/.test(f));
    t.pruefe(echteFehler.length === 0, `fehlendes Bild: keine Fehler, Spiel läuft ${echteFehler.join(" | ")}`);
    t.pruefe(await seite.evaluate(() => window.spiel.zustand) === "spiel", "Spiel läuft mit Ersatzbild weiter");
    await lauf.ende();
  } catch (e) { t.pruefe(false, `fehlendes Bild: Absturz (${e.message})`); }
  fs.rmSync(kopie, { recursive: true, force: true });
  t.ergebnis();
})();
