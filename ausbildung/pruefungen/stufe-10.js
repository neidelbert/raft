// Prüfung Stufe 10 – eigenständiger Skill (Ausbilder): node ausbildung/pruefungen/stufe-10.js
// Teil 2 (ein frischer Programmierer arbeitet nur mit dem Paket) macht der Ausbilder mit einem neuen Agenten.
const t = require("../../werkzeuge/test-hilfe.js");
const fs = require("fs"), path = require("path"), os = require("os");
const { execSync } = require("child_process");
const SKILL = path.join(t.REPO, ".claude/skills/game-programmierung");
const lauf = (befehl, cwd) => { try { return { ok: true, aus: execSync(befehl, { cwd, encoding: "utf8", timeout: 600000, stdio: ["ignore", "pipe", "pipe"] }) }; }
  catch (e) { return { ok: false, aus: (e.stdout || "") + (e.stderr || "") }; } };

for (const w of ["test-hilfe.js", "neues-spiel.js", "paket.js", "atlas.js", "sounds.js", "modell.js", "manifest.js"])
  t.pruefe(fs.existsSync(path.join(SKILL, "werkzeuge", w)), `Werkzeug ${w} im Skill`);
const handbuch = fs.readFileSync(path.join(SKILL, "SKILL.md"), "utf8");
t.pruefe(/Neues Spiel in 5 Schritten/i.test(handbuch.slice(0, 2500)), "„Neues Spiel in 5 Schritten“ oben im Handbuch");
t.pruefe(handbuch.includes("neues-spiel.js"), "Handbuch nennt neues-spiel.js");

// Verweise im Skill zeigen nicht nach außen (außer auf das Spiel selbst)
// Das Lernbuch ist Verlauf und darf erzählen, woher etwas kam; ../ ist nur ein Fehler, wenn es aus dem Skill hinausführt.
const texte = [path.join(SKILL, "SKILL.md"), ...fs.readdirSync(path.join(SKILL, "wissen")).filter((d) => d !== "lernbuch.md").map((d) => path.join(SKILL, "wissen", d))];
const aussen = [];
for (const d of texte) for (const [, ziel] of fs.readFileSync(d, "utf8").matchAll(/`((?:\.\.\/|\/home|ausbildung\/|tests\/alle-tests\.sh)[^`]*)`/g)) {
  if (ziel.startsWith("../") && path.resolve(path.dirname(d), ziel).startsWith(SKILL)) continue;
  aussen.push(`${path.basename(d)}: ${ziel}`);
}
t.pruefe(aussen.length === 0, `keine Verweise aus dem Skill hinaus ${aussen.slice(0, 5).join(" | ")}`);

// Gerüst in leerem Ordner, Test grün – 2D und 3D
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "geruest-"));
for (const [name, zusatz] of [["probe2d", ""], ["probe3d", " --3d"]]) {
  const ziel = path.join(tmp, name);
  const r = lauf(`node ${path.join(SKILL, "werkzeuge", "neues-spiel.js")} ${ziel}${zusatz}`, tmp);
  t.pruefe(r.ok && fs.existsSync(path.join(ziel, "index.html")), `Gerüst ${name} angelegt`);
  for (const d of ["stil.css", "js/main.js", "SCHULDEN.md", "LIESMICH.md"]) t.pruefe(fs.existsSync(path.join(ziel, d)), `${name}: ${d}`);
  const manifest = (function finde(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name);
    if (e.isDirectory()) { const x = finde(p); if (x) return x; } else if (e.name === "assets.json") return p; } return null; })(ziel);
  t.pruefe(Boolean(manifest), `${name}: assets.json`);
  const tests = fs.existsSync(path.join(ziel, "tests")) ? fs.readdirSync(path.join(ziel, "tests")).filter((d) => d.endsWith(".js")) : [];
  t.pruefe(tests.length >= 1, `${name}: eigener Test`);
  if (tests.length) {
    const r2 = lauf(`node ${path.join("tests", tests[0])}`, ziel);
    t.pruefe(r2.ok && /Alle Prüfungen bestanden/.test(r2.aus), `${name}: Test des Gerüsts grün ${r2.ok ? "" : r2.aus.split("\n").filter((z) => /FEHLER|Error/.test(z)).slice(0, 3).join(" | ")}`);
  }
}
fs.rmSync(tmp, { recursive: true, force: true });

// Paket
const r3 = lauf(`node ${path.join(SKILL, "werkzeuge", "paket.js")}`, t.REPO);
t.pruefe(r3.ok, "paket.js läuft");
for (const z of ["game-programmierung.zip", "zeichnen.zip", "INSTALLIEREN.md"]) t.pruefe(fs.existsSync(path.join(t.REPO, "dist", z)), `dist/${z}`);
if (fs.existsSync(path.join(t.REPO, "dist", "game-programmierung.zip"))) {
  const aus = fs.mkdtempSync(path.join(os.tmpdir(), "paket-"));
  lauf(`unzip -q ${path.join(t.REPO, "dist", "game-programmierung.zip")} -d ${aus}`, aus);
  const skillMd = (function finde(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name);
    if (e.isDirectory()) { const x = finde(p); if (x) return x; } else if (e.name === "SKILL.md") return p; } return null; })(aus);
  t.pruefe(Boolean(skillMd), "Zip enthält SKILL.md");
  if (skillMd) {
    const wurzel = path.dirname(skillMd);
    for (const d of ["bausteine/schleife.js", "bausteine/assets.js", "wissen/assets.md", "werkzeuge/neues-spiel.js", "werkzeuge/test-hilfe.js"])
      t.pruefe(fs.existsSync(path.join(wurzel, d)), `Zip enthält ${d}`);
    const groesse = fs.statSync(path.join(t.REPO, "dist", "game-programmierung.zip")).size;
    t.pruefe(groesse < 5 * 1024 * 1024, `Zip unter 5 MB (${(groesse / 1024).toFixed(0)} KB)`);
  }
  fs.rmSync(aus, { recursive: true, force: true });
}
t.pruefe(fs.existsSync(path.join(t.REPO, "ausbildung/uebungen/stufe-10/BERICHT.md")), "Bericht für Lukas");
t.ergebnis();
