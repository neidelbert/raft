// Macht aus SVG-Zeichnungen PNG-Bilder für das Spiel: node <zeichner-skill>/render.js <spielordner>
// (Im Team-Repo liegt das Original in werkzeuge/zeichner/render.js; diese Kopie gehört zum Skill, damit er allein läuft.)
// Quelle:  <spielordner>/grafik/quellen/<gruppe>/<name>.svg
// Ziel:    <spielordner>/grafik/<gruppe>/<name>.png (transparent, längste Kante aus grafik/groessen.json, Schlüssel: Bild
//          „gegner/schleim-1“, Animation „gegner/schleim“ (alle Rahmen) oder Gruppe „gegner“; sonst Standard der Gruppe)
//          <spielordner>/grafik/kontaktbogen.png (alle Bilder auf einen Blick, Fußpunkt als rotes Kreuz)
//          <spielordner>/grafik/grafik.json (Liste: Name, Datei, Breite, Höhe, Fußpunkt „anker“ in PNG-Pixeln)
// Fußpunkt: im SVG-Kopf markieren, in viewBox-Einheiten: <svg viewBox="0 0 200 240" data-anker="100 230">.
//   render.js rechnet ihn in Pixel des PNG um ((x − viewBox-x) × Faktor, gerundet) und schreibt ihn als
//   "anker": [107, 245] in grafik.json. atlas.js (Skill game-programmierung) liest ihn dort. Niemand rechnet von Hand.
//   Ohne data-anker: kein Eintrag (Horsts Werkzeug nimmt dann die Bildmitte); für figuren/gegner gibt es eine Warnung.
// Aufräumen: Platzhalter-Bilder aus dem Gerüst (in grafik.json mit "platzhalter": true), für die es keine SVG gibt,
//   werden gelöscht. Andere PNGs ohne SVG-Quelle werden nur gemeldet (nicht gelöscht).
// Gerendert wird mit Chromium (Playwright), also genau so, wie ein Browser SVG zeichnet.
// Aus Code: const { leseMasse, ankerInPixeln } = require('./render.js');
const fs = require("fs");
const path = require("path");

// Standardgrößen je Gruppe (längste Kante in Pixeln, doppelt so groß wie angezeigt → scharf auf dem iPhone).
const STANDARD = { figuren: 256, gegner: 256, gegenstaende: 128, symbole: 128, boden: 512, effekte: 128, oberflaeche: 256 };
const MIT_FUSSPUNKT = new Set(["figuren", "gegner"]);   // hier fehlt ohne data-anker etwas Wichtiges

function alleSvg(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? alleSvg(path.join(dir, e.name)) : e.name.endsWith(".svg") ? [path.join(dir, e.name)] : []);
}

function allePng(dir, quellen) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const voll = path.join(dir, e.name);
    if (e.isDirectory()) return voll === quellen ? [] : allePng(voll, quellen);
    return e.name.endsWith(".png") ? [voll] : [];
  });
}

// viewBox (x, y, Breite, Höhe) und Fußpunkt aus dem Kopf des SVG. anker: [x, y] in viewBox-Einheiten oder null.
// Längste Kante in Pixeln: groessen.json mit Bildname („gegner/schleim-1“), Animationsname ohne Nummer („gegner/schleim“:
// gilt für alle Rahmen, so sind sie sicher gleich groß) oder Gruppe („gegner“); sonst Standard der Gruppe, sonst 256.
function kanteFuer(name, eigene) {
  const gruppe = name.split("/")[0], animation = name.replace(/-\d+$/, "");
  return eigene[name] || eigene[animation] || eigene[gruppe] || STANDARD[gruppe] || 256;
}

function leseMasse(svg) {
  const kopf = (svg.match(/<svg\b[^>]*>/) || [""])[0];
  const zahl = "(-?[\\d.]+)";
  const vb = kopf.match(new RegExp(`viewBox="\\s*${zahl}[\\s,]+${zahl}[\\s,]+${zahl}[\\s,]+${zahl}\\s*"`));
  if (!vb) throw new Error("SVG braucht ein viewBox-Attribut");
  const [x, y, w, h] = vb.slice(1).map(Number);
  const a = kopf.match(new RegExp(`data-anker="\\s*${zahl}[\\s,]+${zahl}\\s*"`));
  if (!a && /data-anker=/.test(kopf)) throw new Error('data-anker braucht zwei Zahlen: data-anker="x y" (viewBox-Einheiten)');
  const anker = a ? [Number(a[1]), Number(a[2])] : null;
  if (anker && (anker[0] < x || anker[0] > x + w || anker[1] < y || anker[1] > y + h)) throw new Error(`data-anker ${anker.join(" ")} liegt außerhalb der viewBox`);
  return { x, y, w, h, anker };
}

// Fußpunkt von viewBox-Einheiten in Pixel des fertigen PNG (faktor = Pixel pro viewBox-Einheit).
function ankerInPixeln(masse, faktor) {
  if (!masse.anker) return null;
  return [Math.round((masse.anker[0] - masse.x) * faktor), Math.round((masse.anker[1] - masse.y) * faktor)];
}

async function rendere(ordner) {
  const { chromium } = require("playwright");
  const quellen = path.join(ordner, "grafik", "quellen");
  const ziel = path.join(ordner, "grafik");
  if (!fs.existsSync(quellen)) throw new Error(`Kein Ordner ${quellen}`);
  const groessenDatei = path.join(ziel, "groessen.json");
  const eigene = fs.existsSync(groessenDatei) ? JSON.parse(fs.readFileSync(groessenDatei, "utf8")) : {};
  const listenDatei = path.join(ziel, "grafik.json");
  let alteListe = [];
  try { alteListe = JSON.parse(fs.readFileSync(listenDatei, "utf8")); } catch { alteListe = []; }

  const dateien = alleSvg(quellen).sort();
  if (!dateien.length) throw new Error("Keine SVG-Dateien gefunden.");
  const browser = await chromium.launch();
  const seite = await browser.newPage({ deviceScaleFactor: 1 });
  const liste = [];
  let fehler = 0;
  for (const datei of dateien) {
    const rel = path.relative(quellen, datei).replace(/\\/g, "/");
    const name = rel.replace(/\.svg$/, "");
    const gruppe = rel.split("/")[0];
    try {
      const svg = fs.readFileSync(datei, "utf8");
      const masse = leseMasse(svg);
      const kante = kanteFuer(name, eigene);
      const faktor = kante / Math.max(masse.w, masse.h);
      const bw = Math.round(masse.w * faktor), bh = Math.round(masse.h * faktor);
      await seite.setViewportSize({ width: bw, height: bh });
      const sauber = svg.replace(/<svg\b([^>]*?)\s(width|height)="[^"]*"/g, "<svg$1").replace(/<svg\b([^>]*?)\s(width|height)="[^"]*"/g, "<svg$1");
      await seite.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${bw}px;height:${bh}px}</style>${sauber}`);
      const ausgabe = path.join(ziel, `${name}.png`);
      fs.mkdirSync(path.dirname(ausgabe), { recursive: true });
      await seite.screenshot({ path: ausgabe, omitBackground: true, clip: { x: 0, y: 0, width: bw, height: bh } });
      const anker = ankerInPixeln(masse, faktor);
      liste.push({ name, datei: `grafik/${name}.png`, breite: bw, hoehe: bh, ...(anker ? { anker } : {}) });
      console.log(`OK     ${name}.png (${bw} × ${bh})${anker ? `, Fußpunkt ${anker.join(", ")}` : ""}`);
      if (!anker && MIT_FUSSPUNKT.has(gruppe)) console.log(`WARNUNG ${rel}: kein Fußpunkt (data-anker="x y" im <svg>), Horst nimmt sonst die Bildmitte`);
    } catch (e) {
      console.log(`FEHLER ${rel}: ${e.message}`);
      fehler++;
    }
  }

  // Aufräumen: Platzhalter des Gerüsts ohne SVG löschen, sonstige PNGs ohne Quelle melden.
  const neu = new Set(liste.map((b) => path.join(ordner, b.datei)));
  const platzhalter = new Set(alteListe.filter((b) => b && b.platzhalter).map((b) => path.join(ordner, b.datei)));
  for (const png of allePng(ziel, quellen)) {
    if (neu.has(png) || path.basename(png) === "kontaktbogen.png") continue;
    const rel = path.relative(ordner, png).replace(/\\/g, "/");
    if (platzhalter.has(png)) { fs.rmSync(png); console.log(`ENTFERNT ${rel} (Platzhalter des Gerüsts)`); }
    else console.log(`WARNUNG ${rel}: keine SVG-Quelle und nicht in grafik.json (löschen oder Quelle anlegen)`);
  }

  // Kontaktbogen: alle Bilder auf Schachbrett (zeigt Transparenz), Fußpunkt als rotes Kreuz.
  const zelle = 180, innen = zelle - 20;
  const spalten = Math.min(6, liste.length);
  const zeilen = Math.ceil(liste.length / spalten);
  const kacheln = liste.map((b) => {
    const daten = fs.readFileSync(path.join(ordner, b.datei)).toString("base64");
    const s = Math.min(innen / b.breite, innen / b.hoehe), links = (innen - b.breite * s) / 2, oben = (innen - b.hoehe * s) / 2;
    const kreuz = b.anker ? `<i style="left:${(links + b.anker[0] * s).toFixed(1)}px;top:${(oben + b.anker[1] * s).toFixed(1)}px"></i>` : "";
    return `<figure><div><img src="data:image/png;base64,${daten}">${kreuz}</div><figcaption>${b.name}</figcaption></figure>`;
  }).join("");
  await seite.setViewportSize({ width: spalten * zelle, height: zeilen * (zelle + 22) });
  await seite.setContent(`<!doctype html><style>
    body{margin:0;display:grid;grid-template-columns:repeat(${spalten},${zelle}px);font:12px sans-serif;background:#fff}
    figure{margin:0;width:${zelle}px;height:${zelle + 22}px;display:flex;flex-direction:column;align-items:center}
    div{position:relative;width:${innen}px;height:${innen}px;margin-top:10px;
      background:conic-gradient(#ddd 25%,#f4f4f4 0 50%,#ddd 0 75%,#f4f4f4 0) 0 0/16px 16px}
    img{width:${innen}px;height:${innen}px;object-fit:contain;display:block}
    i{position:absolute;width:11px;height:11px;margin:-5px 0 0 -5px;
      background:linear-gradient(#e0003c,#e0003c) center/11px 1px no-repeat,linear-gradient(#e0003c,#e0003c) center/1px 11px no-repeat}
    figcaption{height:22px;line-height:22px}</style>${kacheln}`);
  await seite.screenshot({ path: path.join(ziel, "kontaktbogen.png"), fullPage: true });
  await browser.close();

  fs.writeFileSync(listenDatei, JSON.stringify(liste, null, 2) + "\n");
  console.log(fehler ? `\n${fehler} Bild(er) fehlgeschlagen.` : `\n${liste.length} Bilder fertig, Kontaktbogen: grafik/kontaktbogen.png`);
  return { liste, fehler };
}

if (require.main === module) {
  rendere(path.resolve(process.argv[2] || "."))
    .then(({ fehler }) => process.exit(fehler ? 1 : 0))
    .catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { leseMasse, ankerInPixeln, kanteFuer, rendere, STANDARD };
