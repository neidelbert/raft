// Macht aus SVG-Zeichnungen PNG-Bilder für das Spiel: node werkzeuge/zeichner/render.js <spielordner>
// Quelle:  <spielordner>/grafik/quellen/<gruppe>/<name>.svg
// Ziel:    <spielordner>/grafik/<gruppe>/<name>.png (transparent, Größe aus grafik/groessen.json)
//          <spielordner>/grafik/kontaktbogen.png (alle Bilder auf einen Blick, zum Prüfen)
//          <spielordner>/grafik/grafik.json (Liste: Name, Datei, Breite, Höhe)
// Gerendert wird mit Chromium (Playwright), also genau so, wie ein Browser SVG zeichnet.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const ordner = path.resolve(process.argv[2] || ".");
const quellen = path.join(ordner, "grafik", "quellen");
const ziel = path.join(ordner, "grafik");
if (!fs.existsSync(quellen)) {
  console.error(`Kein Ordner ${quellen}`);
  process.exit(1);
}

// Standardgrößen je Gruppe (längste Kante in Pixeln, doppelt so groß wie angezeigt → scharf auf dem iPhone).
const STANDARD = { figuren: 256, gegner: 256, gegenstaende: 128, symbole: 128, boden: 512, effekte: 128, oberflaeche: 256 };
const groessenDatei = path.join(ziel, "groessen.json");
const eigene = fs.existsSync(groessenDatei) ? JSON.parse(fs.readFileSync(groessenDatei, "utf8")) : {};

function alleSvg(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? alleSvg(path.join(dir, e.name)) : e.name.endsWith(".svg") ? [path.join(dir, e.name)] : []);
}

function masse(svg) {
  const vb = svg.match(/viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/);
  if (!vb) throw new Error("SVG braucht ein viewBox-Attribut");
  return { w: Number(vb[1]), h: Number(vb[2]) };
}

(async () => {
  const dateien = alleSvg(quellen).sort();
  if (!dateien.length) { console.error("Keine SVG-Dateien gefunden."); process.exit(1); }
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
      const { w, h } = masse(svg);
      const kante = eigene[name] || eigene[gruppe] || STANDARD[gruppe] || 256;
      const faktor = kante / Math.max(w, h);
      const bw = Math.round(w * faktor), bh = Math.round(h * faktor);
      await seite.setViewportSize({ width: bw, height: bh });
      const sauber = svg.replace(/<svg\b([^>]*?)\s(width|height)="[^"]*"/g, "<svg$1").replace(/<svg\b([^>]*?)\s(width|height)="[^"]*"/g, "<svg$1");
      await seite.setContent(`<!doctype html><style>html,body{margin:0;background:transparent}svg{display:block;width:${bw}px;height:${bh}px}</style>${sauber}`);
      const ausgabe = path.join(ziel, `${name}.png`);
      fs.mkdirSync(path.dirname(ausgabe), { recursive: true });
      await seite.screenshot({ path: ausgabe, omitBackground: true, clip: { x: 0, y: 0, width: bw, height: bh } });
      liste.push({ name, datei: `grafik/${name}.png`, breite: bw, hoehe: bh });
      console.log(`OK     ${name}.png (${bw} × ${bh})`);
    } catch (e) {
      console.log(`FEHLER ${rel}: ${e.message}`);
      fehler++;
    }
  }

  // Kontaktbogen: alle Bilder auf Schachbrett (zeigt Transparenz) und auf Spielhintergrund.
  const zelle = 180;
  const spalten = Math.min(6, liste.length);
  const zeilen = Math.ceil(liste.length / spalten);
  const kacheln = liste.map((b) => {
    const daten = fs.readFileSync(path.join(ordner, b.datei)).toString("base64");
    return `<figure><img src="data:image/png;base64,${daten}"><figcaption>${b.name}</figcaption></figure>`;
  }).join("");
  await seite.setViewportSize({ width: spalten * zelle, height: zeilen * (zelle + 22) });
  await seite.setContent(`<!doctype html><style>
    body{margin:0;display:grid;grid-template-columns:repeat(${spalten},${zelle}px);font:12px sans-serif;background:#fff}
    figure{margin:0;width:${zelle}px;height:${zelle + 22}px;display:flex;flex-direction:column;align-items:center}
    img{width:${zelle - 20}px;height:${zelle - 20}px;object-fit:contain;margin-top:10px;
      background:conic-gradient(#ddd 25%,#f4f4f4 0 50%,#ddd 0 75%,#f4f4f4 0) 0 0/16px 16px}
    figcaption{height:22px;line-height:22px}</style>${kacheln}`);
  await seite.screenshot({ path: path.join(ziel, "kontaktbogen.png"), fullPage: true });
  await browser.close();

  fs.writeFileSync(path.join(ziel, "grafik.json"), JSON.stringify(liste, null, 2) + "\n");
  console.log(fehler ? `\n${fehler} Bild(er) fehlgeschlagen.` : `\n${liste.length} Bilder fertig, Kontaktbogen: grafik/kontaktbogen.png`);
  process.exit(fehler ? 1 : 0);
})();
