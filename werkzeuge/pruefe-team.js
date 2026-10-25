// Prüft, ob das Game-Team in sich stimmig ist: node werkzeuge/pruefe-team.js
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const lies = (d) => fs.readFileSync(path.join(REPO, d), "utf8");
const gibt = (d) => fs.existsSync(path.join(REPO, d));
let fehlerZahl = 0;
function pruefe(b, text) { console.log(`${b ? "OK   " : "FEHLER"} ${text}`); if (!b) fehlerZahl++; }

const AGENTS = { "spiel-leiter": null, horst: "game-programmierung", zeichner: "zeichnen", tester: null };
for (const [name, skill] of Object.entries(AGENTS)) {
  const datei = `.claude/agents/${name}.md`;
  if (!gibt(datei)) { pruefe(false, `${datei} fehlt`); continue; }
  const text = lies(datei);
  const kopf = text.match(/^---\n([\s\S]*?)\n---\n/);
  pruefe(kopf && new RegExp(`^name: ${name}$`, "m").test(kopf[1]) && /^description: .{30,}/m.test(kopf[1]) && /^tools: /m.test(kopf[1]), `${name}: Kopf vollständig`);
  if (skill) pruefe(new RegExp(`^skills: ${skill}$`, "m").test(kopf[1]), `${name}: lädt Skill ${skill}`);
  for (const teil of ["## Aufgabe", "## Macht nicht", "## Fertig, wenn", "## Testaufgabe", "## Für alle im Team"])
    pruefe(text.includes(teil), `${name}: Abschnitt „${teil.slice(3)}“`);
}

const SKILLS = {
  "game-programmierung": ["lernbuch.md", "haltung.md", "aufbau.md", "iphone-browser.md", "canvas-2d.md", "threejs-3d.md", "spielgefuehl.md", "grafik-und-sound.md", "testen.md"],
  zeichnen: ["stil.md", "svg-techniken.md"],
};
for (const [skill, dateien] of Object.entries(SKILLS)) {
  const pfad = `.claude/skills/${skill}/SKILL.md`;
  const text = lies(pfad);
  pruefe(new RegExp(`^---\\nname: ${skill}\\ndescription: .+\\n---`, "m").test(text), `Skill ${skill}: Kopf`);
  for (const d of dateien) {
    const voll = skill === "zeichnen" ? `.claude/skills/${skill}/${d}` : `.claude/skills/${skill}/wissen/${d}`;
    pruefe(gibt(voll), `Skill ${skill}: ${d} vorhanden`);
    pruefe(text.includes(d), `Skill ${skill} verweist auf ${d}`);
  }
}
for (const v of ["figur.svg", "gegner.svg", "gegenstand.svg", "boden.svg"])
  pruefe(/viewBox="/.test(lies(`.claude/skills/zeichnen/vorlagen/${v}`)), `Vorlage ${v} mit viewBox`);

// Verweise auf Dateien
const quellen = [...Object.keys(AGENTS).map((a) => `.claude/agents/${a}.md`), ...Object.keys(SKILLS).map((s) => `.claude/skills/${s}/SKILL.md`), "TEAM.md", "CLAUDE.md"];   // AUSBILDUNG.md nicht: Aufträge nennen Dateien, die erst noch entstehen
for (const q of quellen)
  for (const [, ziel] of lies(q).matchAll(/`((?:\.claude|tests|werkzeuge|ausbildung)\/[^`*<> ]+?\.(?:md|js|json|sh|svg))`/g)) {
    if (/JJJJ|NN|stufe-N|<|…|ausbildung\/uebungen\//.test(ziel)) continue;   // Übungsergebnisse entstehen erst beim Lernen
    pruefe(gibt(ziel), `${q}: Verweis ${ziel} existiert`);
  }

for (const w of ["test-hilfe.js", "zeichner/render.js"]) pruefe(gibt(`werkzeuge/${w}`), `Werkzeug ${w} vorhanden`);
console.log(fehlerZahl ? `\n${fehlerZahl} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
process.exit(fehlerZahl ? 1 : 0);
