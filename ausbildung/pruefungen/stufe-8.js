// Prüfung Stufe 8 – der eigene Skill (Ausbilder): node ausbildung/pruefungen/stufe-8.js
const t = require("../../werkzeuge/test-hilfe.js");
const fs = require("fs"), path = require("path");
const { execSync } = require("child_process");

const SKILL = path.join(t.REPO, ".claude/skills/game-programmierung");
const BAUSTEINE = ["schleife", "bildschirm", "joystick", "knopf", "zufall", "speicher", "pool", "gitter", "partikel", "ton", "bilder", "zustaende"];
const lies = (p) => fs.readFileSync(p, "utf8");

const handbuch = lies(path.join(SKILL, "SKILL.md"));
for (const b of BAUSTEINE) {
  const datei = path.join(SKILL, "bausteine", `${b}.js`);
  if (!t.pruefe(fs.existsSync(datei), `Baustein ${b}.js vorhanden`)) continue;
  const text = lies(datei);
  const kopf = text.split("\n").slice(0, 25).join("\n");
  t.pruefe(/^\s*\/\//.test(text) && /Beispiel|Nutzung/i.test(kopf), `${b}.js: Kopfkommentar mit Zweck und Beispiel`);
  t.pruefe(/export\s+(function|const|class)/.test(text), `${b}.js: exportiert seine Schnittstelle`);
  t.pruefe(!/\bwindow\.spiel\b/.test(text.replace(/\/\/.*$/gm, "")), `${b}.js: liest window.spiel nicht`);
  t.pruefe(handbuch.includes(`bausteine/${b}.js`), `Handbuch verweist auf bausteine/${b}.js`);
}

// Logik-Bausteine selbst nachprüfen (unabhängig von Horsts Tests)
async function eigenePruefung() {
  const url = (b) => "file://" + path.join(SKILL, "bausteine", `${b}.js`);
  try {
    const z = await import(url("zufall"));
    const fz = Object.values(z).find((f) => typeof f === "function");
    const a = fz(42), b = fz(42);
    const fa = typeof a === "function" ? a : a.zahl || a.naechste || Object.values(a).find((f) => typeof f === "function");
    const fb = typeof b === "function" ? b : b.zahl || b.naechste || Object.values(b).find((f) => typeof f === "function");
    const ra = [fa(), fa(), fa()], rb = [fb(), fb(), fb()];
    t.pruefe(ra.every((x, i) => x === rb[i]) && ra.every((x) => x >= 0 && x < 1), "zufall: gleicher Seed → gleiche Folge, Werte 0 bis <1");
  } catch (e) { t.pruefe(false, `zufall nicht nutzbar: ${e.message}`); }
  try {
    const p = await import(url("pool"));
    const erstelle = Object.values(p).find((f) => typeof f === "function");
    const pool = erstelle(() => ({}), 3);
    const hole = pool.hole || pool.nimm, gib = pool.gib || pool.frei || pool.zurueck;
    const x = [hole(), hole(), hole(), hole()];
    t.pruefe(x[0] && x[1] && x[2] && !x[3], "pool: Grenze wird eingehalten, kein Absturz");
    gib(x[0]);
    t.pruefe(hole() === x[0], "pool: zurückgegebenes Objekt wird wiederverwendet");
  } catch (e) { t.pruefe(false, `pool nicht nutzbar: ${e.message}`); }
  try {
    global.localStorage = { d: { kaputt: "nicht{json" }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); }, removeItem(k) { delete this.d[k]; } };
    const s = await import(url("speicher"));
    const funcs = Object.entries(s).filter(([, f]) => typeof f === "function");
    t.pruefe(funcs.length >= 1, `speicher: Funktionen exportiert (${funcs.map(([n]) => n).join(", ")})`);
  } catch (e) { t.pruefe(false, `speicher nicht ladbar ohne Browser: ${e.message}`); }
}

(async () => {
  await eigenePruefung();
  const testOrdner = path.join(SKILL, "bausteine", "tests");
  t.pruefe(fs.existsSync(path.join(testOrdner, "alle.js")), "bausteine/tests/alle.js vorhanden");
  const tests = fs.existsSync(testOrdner) ? fs.readdirSync(testOrdner).filter((d) => d !== "alle.js" && /\.(m?js|html)$/.test(d)) : [];
  for (const b of BAUSTEINE) t.pruefe(tests.some((d) => d.includes(b)), `Test für ${b} vorhanden`);
  try {
    const aus = execSync(`node ${path.join(testOrdner, "alle.js")}`, { cwd: t.REPO, encoding: "utf8", timeout: 600000 });
    t.pruefe(/Alle Prüfungen bestanden/.test(aus), "Baustein-Tests grün");
  } catch (e) { t.pruefe(false, `Baustein-Tests rot: ${(e.stdout || "").split("\n").filter((z) => /FEHLER/.test(z)).slice(0, 5).join(" | ")}`); }
  try { execSync("node werkzeuge/pruefe-team.js", { cwd: t.REPO, stdio: "ignore" }); t.pruefe(true, "Team-Prüfung grün"); }
  catch { t.pruefe(false, "Team-Prüfung rot"); }
  t.pruefe(!fs.existsSync(path.join(t.REPO, "spiele")) || fs.readdirSync(path.join(t.REPO, "spiele")).length === 0, "kein Spiel angelegt");
  const bericht = path.join(t.REPO, "ausbildung/uebungen/stufe-8/BERICHT.md");
  t.pruefe(fs.existsSync(bericht) && lies(bericht).length > 800, "Bericht für Lukas vorhanden");
  const lernbuch = lies(path.join(SKILL, "wissen/lernbuch.md"));
  t.pruefe((lernbuch.match(/Stufe \d/g) || []).length >= 7, "Lernbuch enthält den Verlauf aller Stufen");
  t.ergebnis();
})();
