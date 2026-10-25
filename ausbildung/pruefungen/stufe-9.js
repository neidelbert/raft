// Prüfung Stufe 9 – Assets (Ausbilder): node ausbildung/pruefungen/stufe-9.js
const t = require("../../werkzeuge/test-hilfe.js");
const fs = require("fs"), path = require("path");
const ORDNER = "ausbildung/uebungen/stufe-9";
const SKILL = path.join(t.REPO, ".claude/skills/game-programmierung");
const echteFehler = (l) => l.fehler.filter((f) => !/Failed to load resource|net::ERR/.test(f));
const s = (seite) => seite.evaluate(() => JSON.parse(JSON.stringify(window.spiel)));
function alleDateien(d) { return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? alleDateien(path.join(d, e.name)) : [path.join(d, e.name)]); }

(async () => {
  for (const w of ["atlas.js", "sounds.js", "modell.js", "manifest.js"]) t.pruefe(fs.existsSync(path.join(SKILL, "werkzeuge", w)), `Werkzeug ${w} im Skill`);
  for (const b of ["assets.js", "animation.js"]) {
    t.pruefe(fs.existsSync(path.join(SKILL, "bausteine", b)), `Baustein ${b}`);
    t.pruefe(fs.readdirSync(path.join(SKILL, "bausteine", "tests")).some((d) => d.startsWith(b.replace(".js", ""))), `Test für ${b}`);
  }
  t.pruefe(fs.readFileSync(path.join(SKILL, "SKILL.md"), "utf8").includes("wissen/assets.md"), "Handbuch verweist auf wissen/assets.md");
  const dateien = alleDateien(path.join(t.REPO, ORDNER));
  t.pruefe(dateien.some((d) => d.endsWith(".m4a")) && dateien.some((d) => d.endsWith(".mp3")), "Sounds als .m4a und .mp3");
  t.pruefe(dateien.some((d) => d.endsWith(".glb")), "Modell als .glb");
  const manifest = dateien.find((d) => d.endsWith("assets.json"));
  t.pruefe(manifest && JSON.parse(fs.readFileSync(manifest, "utf8")).version !== undefined, "assets.json mit Version");

  // 1. Normaler Ablauf, Assets künstlich verzögert, damit der Ladebildschirm sichtbar ist
  let lauf = await t.starte({ ordner: ORDNER, port: 8990, pfad: "index.html?test=1&seed=3", routen: async (k) => {
    await k.route(/\.(png|webp|m4a|mp3|json)(\?|$)/, async (r) => { await new Promise((x) => setTimeout(x, 700)); r.continue(); });
  } });
  let { seite } = lauf;
  try {
    const a = await s(seite);
    t.pruefe(a.zustand === "laden" && a.fortschritt < 1, `Ladebildschirm vor den Assets (${a.zustand}, ${a.fortschritt})`);
    const verlauf = await seite.evaluate(() => new Promise((fertig) => {
      const w = []; const start = performance.now();
      (function schau() { w.push(window.spiel.fortschritt); window.spiel.zustand === "laden" && performance.now() - start < 15000 ? requestAnimationFrame(schau) : fertig(w); })();
    }));
    t.pruefe(verlauf.every((v, i) => i === 0 || v >= verlauf[i - 1]), "Fortschritt steigt nie zurück");
    const b = await s(seite);
    t.pruefe(b.fortschritt === 1 && b.zustand === "start", `Fortschritt 1, dann „start“ (${b.fortschritt}, ${b.zustand})`);
    t.pruefe(b.assets.ersetzt.length === 0 && b.assets.fehlend.length === 0 && b.assets.geladen.length >= 3, `alles geladen (${b.assets.geladen.length})`);
    t.pruefe(b.atlas.breite <= 2048 && b.atlas.hoehe <= 2048 && b.atlas.breite > 0, `Atlas höchstens 2048 × 2048 (${b.atlas.breite} × ${b.atlas.hoehe})`);
    const mitVersion = await seite.evaluate(() => performance.getEntriesByType("resource").filter((r) => /\/assets\//.test(r.name) && !/assets\.json/.test(r.name)));
    const alle = await seite.evaluate(() => performance.getEntriesByType("resource").map((r) => r.name).filter((n) => /\/assets\/.+\.(png|webp|m4a|mp3|glb)/.test(n)));
    t.pruefe(alle.length > 0 && alle.every((n) => /\?v=/.test(n)), `Asset-Adressen tragen ?v= (${alle.length})`);
    await t.tippe(seite, 195, 420);
    await seite.waitForFunction("window.spiel.zustand === 'laeuft'", null, { timeout: 3000 });
    t.pruefe(true, "Tippen → „laeuft“");

    const cdp = await t.ziehe(seite, 80, 600, 150, 600, { schritte: 4, loslassen: false });
    const rahmen = await seite.evaluate(() => new Promise((fertig) => {
      const r = new Set(); const start = performance.now();
      (function schau() { r.add(window.spiel.held.rahmen); performance.now() - start < 1200 ? requestAnimationFrame(schau) : fertig({ n: r.size, a: window.spiel.held.animation, b: window.spiel.held.blick }); })();
    }));
    t.pruefe(/lauf/.test(rahmen.a) && rahmen.n >= 3, `Lauf-Animation wechselt die Rahmen (${rahmen.a}, ${rahmen.n} verschiedene)`);
    t.pruefe(rahmen.b === 1, "Blick nach rechts");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await seite.waitForTimeout(300);
    t.pruefe(/steht/.test((await s(seite)).held.animation), "im Stand: held-steht");
    const c2 = await t.ziehe(seite, 150, 600, 80, 600, { schritte: 4, halteMs: 300, loslassen: false });
    t.pruefe((await s(seite)).held.blick === -1, "Blick nach links");
    await c2.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

    const vor = (await s(seite)).sounds;
    await seite.evaluate(() => window.spiel.test.explosion(250, 300));
    await seite.waitForTimeout(100);
    const w = await s(seite);
    t.pruefe(w.explosionen >= 1, "Explosion erscheint");
    t.pruefe(w.sounds.abgespielt > vor.abgespielt, "Explosion spielt einen Sound");
    t.pruefe(w.sounds.dekodiert >= 1, `Sounds dekodiert (${w.sounds.dekodiert})`);
    await seite.waitForTimeout(2500);
    t.pruefe((await s(seite)).explosionen === 0, "Explosion läuft einmal ab und verschwindet");
    await t.tippe(seite, 300, 350);
    await seite.waitForTimeout(100);
    t.pruefe((await s(seite)).explosionen >= 1, "Tippen rechts löst Explosion aus");
    await seite.screenshot({ path: "/tmp/stufe-9-pruefung.png" });
    t.pruefe(echteFehler(lauf).length === 0, `keine Konsolenfehler ${echteFehler(lauf).join(" | ")}`);
  } catch (e) { t.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();

  // 2. Eine Datei fehlt (Anfrage scheitert) und eine hängt für immer
  for (const [art, port, routen] of [
    ["fehlt", 8991, async (k) => { let erst = true; await k.route(/\.(png|webp)(\?|$)/, (r) => { if (erst) { erst = false; return r.abort(); } r.continue(); }); }],
    ["hängt", 8992, async (k) => { let erst = true; await k.route(/\.(m4a|mp3|png|webp)(\?|$)/, (r) => { if (erst) { erst = false; return; } r.continue(); }); }],
  ]) {
    try {
      lauf = await t.starte({ ordner: ORDNER, port, pfad: "index.html?test=1", routen });
      const ok = await lauf.seite.waitForFunction("window.spiel.zustand === 'start'", null, { timeout: 12000 }).then(() => true, () => false);
      const z = await s(lauf.seite);
      t.pruefe(ok && z.assets.ersetzt.length + z.assets.fehlend.length >= 1, `Datei ${art}: Ersatz, Seite startet (${z.zustand}, ersetzt ${z.assets.ersetzt.length})`);
      t.pruefe(echteFehler(lauf).length === 0, `Datei ${art}: keine Fehler ${echteFehler(lauf).join(" | ")}`);
      await lauf.ende();
    } catch (e) { t.pruefe(false, `Datei ${art}: Absturz (${e.message})`); }
  }

  // 3. Modell
  for (const [ohne, port] of [[false, 8993], [true, 8994]]) {
    try {
      lauf = await t.starte({ ordner: ORDNER, port, pfad: "modell.html", warteAuf: "window.modell && window.modell.bereit",
        routen: ohne ? async (k) => { await k.route(/\.glb(\?|$)/, (r) => r.fulfill({ status: 404, body: "" })); } : null });
      await lauf.seite.waitForTimeout(800);
      const m = await lauf.seite.evaluate(() => ({ ...window.modell }));
      if (!ohne) t.pruefe(!m.ersatz && m.dreiecke > 0, `Modell boot.glb geladen (${m.dreiecke} Dreiecke)`);
      else t.pruefe(m.ersatz === true, "ohne boot.glb: Ersatz-Box");
      t.pruefe(echteFehler(lauf).length === 0, `Modell${ohne ? " fehlt" : ""}: keine Fehler ${echteFehler(lauf).join(" | ")}`);
      await lauf.ende();
    } catch (e) { t.pruefe(false, `Modell-Seite: ${e.message}`); }
  }
  t.ergebnis();
})();
