// Test für render.js des Zeichners (Original werkzeuge/zeichner/render.js und Kopie .claude/skills/zeichnen/render.js):
// viewBox und Fußpunkt lesen, Fußpunkt in PNG-Pixel umrechnen, grafik.json mit "anker", Platzhalter des Gerüsts
// entfernen, fremde PNGs nur melden, Kontaktbogen; danach atlas.js (Skill game-programmierung) übernimmt den Fußpunkt.
// Beide Kopien müssen bis auf den Kopfkommentar gleich sein. node tests/zeichner/render-test.js
// Gegenprobe: RENDER=<kaputte Kopie von render.js> prüft nur diese Datei (muss rot werden).
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");

const REPO = path.resolve(__dirname, "..", "..");
const ORIGINAL = path.join(REPO, "werkzeuge", "zeichner", "render.js");
const KOPIE = path.join(REPO, ".claude", "skills", "zeichnen", "render.js");
const RENDER = process.env.RENDER ? [path.resolve(process.env.RENDER)] : [ORIGINAL, KOPIE];
const { baueAtlanten } = require(path.join(REPO, ".claude", "skills", "game-programmierung", "werkzeuge", "atlas.js"));
const { lesePng, schreibePng, leeresBild } = require(path.join(REPO, ".claude", "skills", "game-programmierung", "werkzeuge", "png.js"));

let fehlerZahl = 0;
function pruefe(b, text) { console.log(`${b ? "OK   " : "FEHLER"} ${text}`); if (!b) fehlerZahl++; return Boolean(b); }
const schreibe = (d, inhalt) => { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.writeFileSync(d, inhalt); };
const ohneKopf = (text) => text.replace(/^(\/\/.*\n)+/, "");

// Rechteck-Figur: Füße (unterer Rand der Fläche) genau beim Fußpunkt.
const HELD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240" data-anker="100 230"><rect x="60" y="20" width="80" height="210" fill="#f2a541"/></svg>';
const VERSCHOBEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -200 200 240" data-anker="0 30"><rect x="-40" y="-180" width="80" height="210" fill="#4fb3ff"/></svg>';
const MUENZE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="#f5c534"/></svg>';

function reineRechnung(datei) {
  const { leseMasse, ankerInPixeln, kanteFuer } = require(datei);
  const kurz = path.relative(REPO, datei);
  const m = leseMasse(HELD);
  pruefe(m.w === 200 && m.h === 240 && m.anker.join() === "100,230", `${kurz}: viewBox und data-anker gelesen`);
  pruefe(ankerInPixeln(m, 256 / 240).join() === "107,245", `${kurz}: Fußpunkt (100, 230) in 200 × 240 bei 256 px → [107, 245] (${ankerInPixeln(m, 256 / 240)})`);
  const v = leseMasse(VERSCHOBEN);
  pruefe(ankerInPixeln(v, 256 / 240).join() === "107,245", `${kurz}: viewBox mit Versatz (−100 −200) wird abgezogen (${ankerInPixeln(v, 256 / 240)})`);
  pruefe(leseMasse(MUENZE).anker === null && ankerInPixeln(leseMasse(MUENZE), 1) === null, `${kurz}: ohne data-anker kein Fußpunkt`);
  const fehler = (svg) => { try { leseMasse(svg); return ""; } catch (e) { return e.message; } };
  pruefe(/zwei Zahlen/.test(fehler('<svg viewBox="0 0 10 10" data-anker="5">')), `${kurz}: data-anker mit nur einer Zahl → klare Meldung`);
  pruefe(/außerhalb/.test(fehler('<svg viewBox="0 0 10 10" data-anker="5 20">')), `${kurz}: data-anker außerhalb der viewBox → klare Meldung`);
  const eigene = { "gegner/schleim": 176, gegner: 200, "gegner/boss-2": 300 };
  pruefe(kanteFuer("gegner/schleim-1", eigene) === 176 && kanteFuer("gegner/schleim-4", eigene) === 176 && kanteFuer("gegner/boss-1", eigene) === 200
    && kanteFuer("gegner/boss-2", eigene) === 300 && kanteFuer("effekte/funke", {}) === 128 && kanteFuer("neu/x", {}) === 256,
    `${kurz}: groessen.json nach Bild, Animation (ohne Nummer), Gruppe, sonst Standard`);
}

function ganzerLauf(datei, basis) {
  const kurz = path.relative(REPO, datei);
  const spiel = path.join(basis, path.basename(path.dirname(datei)));
  schreibe(path.join(spiel, "grafik", "quellen", "figuren", "held.svg"), HELD);
  schreibe(path.join(spiel, "grafik", "quellen", "gegenstaende", "muenze.svg"), MUENZE);
  // Wie nach neues-spiel.js: Platzhalter-Bild mit Eintrag "platzhalter": true; dazu ein fremdes PNG ohne Quelle.
  const platzhalter = schreibePng(leeresBild(4, 4));
  schreibe(path.join(spiel, "grafik", "figuren", "figur.png"), platzhalter);
  schreibe(path.join(spiel, "grafik", "symbole", "alt.png"), platzhalter);
  schreibe(path.join(spiel, "grafik", "grafik.json"), JSON.stringify([{ name: "figuren/figur", datei: "grafik/figuren/figur.png", breite: 4, hoehe: 4, anker: [2, 3], platzhalter: true }]));
  const lauf = spawnSync(process.execPath, [datei, spiel], { encoding: "utf8", timeout: 60000 });
  if (!pruefe(lauf.status === 0, `${kurz}: läuft ohne Fehler ${lauf.stderr.trim()}`)) return;
  const liste = JSON.parse(fs.readFileSync(path.join(spiel, "grafik", "grafik.json"), "utf8"));
  const held = liste.find((b) => b.name === "figuren/held"), muenze = liste.find((b) => b.name === "gegenstaende/muenze");
  pruefe(held && held.breite === 213 && held.hoehe === 256 && JSON.stringify(held.anker) === "[107,245]", `${kurz}: grafik.json mit Fußpunkt in PNG-Pixeln (${JSON.stringify(held)})`);
  pruefe(muenze && !("anker" in muenze), `${kurz}: ohne data-anker kein "anker" in grafik.json`);
  const png = lesePng(fs.readFileSync(path.join(spiel, "grafik", "figuren", "held.png")));
  const deckt = (x, y) => png.daten[(y * png.breite + x) * 4 + 3] > 128;
  pruefe(deckt(107, 243) && !deckt(107, 247), `${kurz}: Fußpunkt liegt im PNG wirklich an den Füßen (Pixel darüber voll, darunter leer)`);
  pruefe(!fs.existsSync(path.join(spiel, "grafik", "figuren", "figur.png")) && /ENTFERNT grafik\/figuren\/figur\.png/.test(lauf.stdout), `${kurz}: Platzhalter des Gerüsts ohne SVG entfernt`);
  pruefe(fs.existsSync(path.join(spiel, "grafik", "symbole", "alt.png")) && /WARNUNG grafik\/symbole\/alt\.png/.test(lauf.stdout), `${kurz}: fremdes PNG ohne Quelle bleibt, mit Warnung`);
  pruefe(!/WARNUNG figuren\/held/.test(lauf.stdout) && fs.existsSync(path.join(spiel, "grafik", "kontaktbogen.png")), `${kurz}: Kontaktbogen da, keine Fußpunkt-Warnung für held`);

  // Weiter mit Horsts atlas.js: Der Fußpunkt aus grafik.json kommt im Atlas an (ohne Eintrag in atlas.json).
  schreibe(path.join(spiel, "assets", "quellen", "atlas.json"), JSON.stringify({ atlanten: [{ name: "spiel", gruppen: ["figuren", "gegenstaende"] }], anker: {} }));
  baueAtlanten(spiel, { still: true });
  const atlas = JSON.parse(fs.readFileSync(path.join(spiel, "assets", "atlas", "spiel.json"), "utf8"));
  const r = atlas.rahmen.held;
  // Zuschnitt: Rechteck beginnt bei x = 60 · 256/240 = 64 px, y = 20 · 256/240 ≈ 21 px; Anker wandert mit.
  pruefe(r && r.x >= 0 && Math.abs(r.ankerX - (107 - 64)) <= 1 && Math.abs(r.ankerY - r.h) <= 1, `${kurz} → atlas.js: Fußpunkt übernommen, sitzt am unteren Rand des Zuschnitts (ankerX ${r && r.ankerX}, ankerY ${r && r.ankerY}, h ${r && r.h})`);
  pruefe(Math.abs(atlas.rahmen.muenze.ankerX - atlas.rahmen.muenze.b / 2) <= 1, `${kurz} → atlas.js: ohne Fußpunkt Bildmitte`);
}

const basis = fs.mkdtempSync(path.join(os.tmpdir(), "render-test-"));
try {
  if (!process.env.RENDER) {
    pruefe(ohneKopf(fs.readFileSync(ORIGINAL, "utf8")) === ohneKopf(fs.readFileSync(KOPIE, "utf8")), "render.js: Kopie im Zeichner-Skill gleich dem Original (bis auf den Kopfkommentar)");
    for (const v of ["figur.svg", "gegner.svg"]) pruefe(/data-anker="[\d.]+ [\d.]+"/.test(fs.readFileSync(path.join(REPO, ".claude", "skills", "zeichnen", "vorlagen", v), "utf8")), `Vorlage ${v} mit Fußpunkt (data-anker)`);
    pruefe(/data-anker/.test(fs.readFileSync(path.join(REPO, ".claude", "skills", "zeichnen", "SKILL.md"), "utf8")), "Zeichner-Handbuch erklärt data-anker");
  }
  for (const datei of RENDER) { reineRechnung(datei); ganzerLauf(datei, basis); }
} catch (e) { pruefe(false, `Ablauf abgebrochen: ${e.stack}`); }
fs.rmSync(basis, { recursive: true, force: true });
console.log(fehlerZahl ? `\n${fehlerZahl} Prüfung(en) fehlgeschlagen.` : "\nAlle Prüfungen bestanden.");
process.exit(fehlerZahl ? 1 : 0);
