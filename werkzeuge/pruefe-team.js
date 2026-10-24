// Prüft, ob das Agent-Team in sich stimmig ist: node werkzeuge/pruefe-team.js
// Agents, Skill, Wissen, Büro-Daten, Pakete und Verweise. Läuft ohne Browser.
const fs = require("fs");
const path = require("path");

const REPO = path.resolve(__dirname, "..");
const lies = (datei) => fs.readFileSync(path.join(REPO, datei), "utf8");
const gibt = (datei) => fs.existsSync(path.join(REPO, datei));
let fehlerZahl = 0;
function pruefe(bedingung, text) {
  console.log(`${bedingung ? "OK   " : "FEHLER"} ${text}`);
  if (!bedingung) fehlerZahl++;
}

// Agents
const AGENTS = ["senior-owner", "leiter", "planer", "programmierer", "debugger", "techniker"];
for (const name of AGENTS) {
  const datei = `.claude/agents/${name}.md`;
  if (!gibt(datei)) { pruefe(false, `${datei} fehlt`); continue; }
  const text = lies(datei);
  const kopf = text.match(/^---\n([\s\S]*?)\n---\n/);
  pruefe(kopf && new RegExp(`^name: ${name}$`, "m").test(kopf[1]) && /^description: .{20,}/m.test(kopf[1]) && /^tools: /m.test(kopf[1]),
    `${name}: Kopf mit name, description, tools`);
  for (const teil of ["## Aufgabe", "## Macht nicht", "## Bekommt von / gibt an", "## Fertig, wenn", "## Testaufgabe", "## Für alle Agents"])
    pruefe(text.includes(teil), `${name}: Abschnitt „${teil.slice(3)}“`);
}

// Skill und Wissen
const SKILL = ".claude/skills/raft3d-programmierung/SKILL.md";
const skill = lies(SKILL);
pruefe(/^---\nname: raft3d-programmierung\ndescription: .+\n---/m.test(skill), "Skill: Kopf mit name und description");
for (const w of ["threejs-iphone.md", "spiel-wissen.md", "muster.md", "testen.md", "lernbuch.md"]) {
  pruefe(gibt(`.claude/skills/raft3d-programmierung/wissen/${w}`), `Wissen: ${w} vorhanden`);
  pruefe(skill.includes(`wissen/${w}`), `Skill verweist auf wissen/${w}`);
}

// Verweise auf Dateien in Agents, Skill, TEAM.md, CLAUDE.md
const quellen = [...AGENTS.map((a) => `.claude/agents/${a}.md`), SKILL, "TEAM.md", "CLAUDE.md"];
for (const quelle of quellen) {
  for (const [, ziel] of lies(quelle).matchAll(/`((?:\.claude|tests|spiel|buero|werkzeuge|berichte|pakete)\/[^`*<> ]+?\.(?:md|js|json|sh|html))`/g)) {
    if (/JJJJ|NN|<|…/.test(ziel)) continue;
    pruefe(gibt(ziel), `${quelle}: Verweis ${ziel} existiert`);
  }
}

// Büro-Daten
const STATUS = ["frei", "arbeitet", "wartet", "problem"];
const ARTEN = ["feature", "spielgefuehl", "technik", "version"];
const ANTWORTEN = ["offen", "freigegeben", "aendern", "spaeter"];
const STUFEN = ["idee", "geplant", "in-arbeit", "debugger", "fertig"];
for (const datei of ["buero/daten.json", "tests/buero-beispiel.json"]) {
  let d;
  try { d = JSON.parse(lies(datei)); } catch (e) { pruefe(false, `${datei}: gültiges JSON (${e.message})`); continue; }
  pruefe(typeof d.stand === "string" && Array.isArray(d.agents) && Array.isArray(d.freigaben) && Array.isArray(d.pakete), `${datei}: Grundaufbau`);
  const ids = new Set(d.agents.map((a) => a.id));
  pruefe(["lukas", ...AGENTS].every((a) => ids.has(a)), `${datei}: alle 7 Plätze`);
  pruefe(d.agents.every((a) => STATUS.includes(a.status) && a.name && a.rolle && Array.isArray(a.ergebnisse)), `${datei}: Agents mit gültigem Status`);
  const fIds = d.freigaben.map((f) => f.id);
  pruefe(new Set(fIds).size === fIds.length, `${datei}: Freigabe-IDs eindeutig`);
  pruefe(d.freigaben.every((f) => ARTEN.includes(f.art) && ANTWORTEN.includes(f.status) && f.titel && f.text && f.von && f.datum),
    `${datei}: Freigaben mit gültiger Art und Status`);
  const pIds = d.pakete.map((p) => p.id);
  pruefe(new Set(pIds).size === pIds.length, `${datei}: Paket-IDs eindeutig`);
  pruefe(d.pakete.every((p) => STUFEN.includes(p.stufe) && p.titel && (!p.agent || ids.has(p.agent))), `${datei}: Pakete mit gültiger Stufe und Agent`);
}

// Pakete
for (const datei of fs.readdirSync(path.join(REPO, "pakete")).filter((f) => /^\d\d-.*\.md$/.test(f))) {
  const text = lies(`pakete/${datei}`);
  for (const feld of ["Ziel:", "Gehört dazu:", "Gehört nicht dazu:", "Abhängig von:", "Fertig, wenn:", "Testaufgabe:", "Freigegeben:"])
    pruefe(text.includes(feld), `pakete/${datei}: Feld „${feld}“`);
}

console.log(fehlerZahl ? `\n${fehlerZahl} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
process.exit(fehlerZahl ? 1 : 0);
