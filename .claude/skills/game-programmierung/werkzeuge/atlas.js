// Werkzeug „atlas“: packt die PNGs des Zeichners zu Sprite-Atlanten (PNG + JSON, Format siehe wissen/assets.md).
// Wofür: Viele kleine Bilder in einem großen: eine Anfrage statt vieler, beim Zeichnen nur ein Bild. Rahmen werden
//   auf den sichtbaren Teil zugeschnitten (durchsichtige Ränder weg), der Anker (Fußpunkt) wandert mit, darum wackelt
//   eine Animation nicht. Zwischen den Rahmen `abstand` Pixel (Standard 2), die mit den Randpixeln gefüllt sind
//   (Randverlängerung), sonst blitzen beim Skalieren Nachbarbilder durch. Höchstens `groesseMax` (2048) je Seite,
//   sonst mehrere Atlanten (<name>-2, <name>-3 …). Animationen entstehen aus Namen `<name>-<nr>` (nach Nummer sortiert).
//   Bilder unter `einzeln` (Boden-Kacheln, Hintergründe) werden nur nach assets/bilder/ kopiert, nicht gepackt.
// Aufruf:   node <skill>/werkzeuge/atlas.js <spielordner>
// Liest:    <spielordner>/assets/quellen/atlas.json, z. B.
//   { "grafik": "grafik/grafik.json",                     Liste des Zeichners (relativ zum Spielordner)
//     "abstand": 2, "groesseMax": 2048,
//     "atlanten": [{ "name": "spiel", "gruppen": ["figuren", "effekte"] }],   Gruppe = Teil vor dem „/“ im Namen
//     "einzeln": ["boden/wiese"],
//     "anker": { "figuren/held-*": [106, 245] },            Pixel im Originalbild; Standard: Bildmitte
//     "animationen": { "held-lauf": { "bps": 10, "schleife": true } } }   Standard: 10 bps, Schleife (mit Warnung)
// Schreibt: <spielordner>/assets/atlas/<name>.png und .json, <spielordner>/assets/bilder/<name>.png (einzeln).
//   Danach manifest.js aufrufen (neue Version und Größen in assets/assets.json).
// Aus Code: const { baueAtlanten, packe } = require('./atlas.js');
const fs = require('fs');
const path = require('path');
const { lesePng, schreibePng, leeresBild } = require('./png.js');

const STANDARD_ANIMATION = { bps: 10, schleife: true };

// Kleinster Rahmen um alle nicht ganz durchsichtigen Pixel (mindestens 1 × 1).
function sichtbarerTeil(bild) {
  const { breite, hoehe, daten } = bild;
  let x1 = breite, y1 = hoehe, x2 = -1, y2 = -1;
  for (let y = 0; y < hoehe; y++) for (let x = 0; x < breite; x++) {
    if (daten[(y * breite + x) * 4 + 3] === 0) continue;
    if (x < x1) x1 = x; if (x > x2) x2 = x; if (y < y1) y1 = y; if (y > y2) y2 = y;
  }
  if (x2 < 0) return { x: 0, y: 0, b: 1, h: 1 };
  return { x: x1, y: y1, b: x2 - x1 + 1, h: y2 - y1 + 1 };
}

// Regalweise packen (Shelf-Packing): nach Höhe sortiert, Zeile für Zeile. zellen: [{ b, h }] (Größe samt Rand).
// Gibt Seiten zurück: [{ breite, hoehe, plaetze: [{ index, x, y }] }]. Wählt die Breite mit der kleinsten Fläche.
function packe(zellen, groesseMax) {
  const reihenfolge = zellen.map((z, index) => ({ ...z, index })).sort((a, b) => b.h - a.h || b.b - a.b);
  for (const z of reihenfolge) if (z.b > groesseMax || z.h > groesseMax) throw new Error(`Bild ${z.b} × ${z.h} ist größer als ${groesseMax}`);
  const seiten = [];
  let rest = reihenfolge;
  while (rest.length) {
    let beste = null;
    for (let breite = 64; breite <= groesseMax; breite *= 2) {
      const versuch = regale(rest, breite, groesseMax);
      const flaeche = versuch.breite * versuch.hoehe;
      // Wer mehr unterbringt, gewinnt; bei gleich vielen die kleinere Fläche.
      if (!beste || versuch.plaetze.length > beste.plaetze.length || (versuch.plaetze.length === beste.plaetze.length && flaeche < beste.breite * beste.hoehe)) beste = versuch;
    }
    if (!beste.plaetze.length) throw new Error('Packen unmöglich');
    seiten.push(beste);
    const drin = new Set(beste.plaetze.map((p) => p.index));
    rest = rest.filter((z) => !drin.has(z.index));
  }
  return seiten;
}

function regale(zellen, breite, hoeheMax) {
  const plaetze = [];
  let x = 0, y = 0, regalHoehe = 0, benutzteBreite = 0;
  for (const z of zellen) {
    if (z.b > breite) continue;
    if (x + z.b > breite) { y += regalHoehe; x = 0; regalHoehe = 0; }
    if (y + z.h > hoeheMax) continue;   // passt nicht mehr: kommt auf die nächste Seite
    plaetze.push({ index: z.index, x, y });
    x += z.b;
    regalHoehe = Math.max(regalHoehe, z.h);
    benutzteBreite = Math.max(benutzteBreite, x);
  }
  return { breite: Math.max(1, benutzteBreite), hoehe: Math.max(1, y + regalHoehe), plaetze };
}

// Rahmen (Ausschnitt quelle) nach (zx, zy) kopieren und rand Pixel nach außen verlängern.
function kopiereMitRand(ziel, bild, quelle, zx, zy, rand) {
  for (let y = -rand; y < quelle.h + rand; y++) {
    const qy = quelle.y + Math.min(Math.max(y, 0), quelle.h - 1);
    for (let x = -rand; x < quelle.b + rand; x++) {
      const qx = quelle.x + Math.min(Math.max(x, 0), quelle.b - 1);
      const q = (qy * bild.breite + qx) * 4, z = ((zy + y) * ziel.breite + zx + x) * 4;
      for (let k = 0; k < 4; k++) ziel.daten[z + k] = bild.daten[q + k];
    }
  }
}

function ankerFuer(name, anker, bild) {
  if (anker[name]) return anker[name];
  const passend = Object.keys(anker).filter((k) => k.endsWith('*') && name.startsWith(k.slice(0, -1))).sort((a, b) => b.length - a.length)[0];
  return passend ? anker[passend] : [bild.breite / 2, bild.hoehe / 2];
}

function baueAtlanten(spielordner, { still = false } = {}) {
  const melde = (text) => { if (!still) console.log(text); };
  const quelle = JSON.parse(fs.readFileSync(path.join(spielordner, 'assets', 'quellen', 'atlas.json'), 'utf8'));
  const { abstand = 2, groesseMax = 2048, atlanten = [], einzeln = [], anker = {}, animationen = {} } = quelle;
  const rand = Math.floor(abstand / 2), luecke = abstand - 2 * rand;   // Randverlängerung je Seite, Rest bleibt leer
  const liste = JSON.parse(fs.readFileSync(path.join(spielordner, quelle.grafik || 'grafik/grafik.json'), 'utf8'));
  const datei = (eintrag) => path.join(spielordner, eintrag.datei);   // render.js schreibt Pfade relativ zum Spielordner
  const zielAtlas = path.join(spielordner, 'assets', 'atlas'), zielBilder = path.join(spielordner, 'assets', 'bilder');
  fs.mkdirSync(zielAtlas, { recursive: true });
  const ergebnis = { atlanten: [], bilder: [] };

  for (const name of einzeln) {
    const eintrag = liste.find((e) => e.name === name);
    if (!eintrag) throw new Error(`einzeln: „${name}“ steht nicht in ${quelle.grafik}`);
    fs.mkdirSync(zielBilder, { recursive: true });
    const ziel = path.join(zielBilder, path.basename(eintrag.datei));
    fs.copyFileSync(datei(eintrag), ziel);
    ergebnis.bilder.push(ziel);
    melde(`Bild ${name} → ${path.relative(spielordner, ziel)}`);
  }

  for (const atlas of atlanten) {
    const eintraege = liste.filter((e) => atlas.gruppen.includes(e.name.split('/')[0]) && !einzeln.includes(e.name));
    const rahmen = eintraege.map((e) => {
      const bild = lesePng(fs.readFileSync(datei(e)));
      const kurz = e.name.split('/').pop();
      const [ax, ay] = ankerFuer(e.name, anker, bild);
      return { kurz, bild, teil: sichtbarerTeil(bild), ax, ay };
    });
    const doppelt = rahmen.map((r) => r.kurz).filter((k, i, alle) => alle.indexOf(k) !== i);
    if (doppelt.length) throw new Error(`Rahmen-Namen doppelt: ${doppelt.join(', ')}`);

    // Alte Ausgaben dieses Atlas (auch frühere Zusatzseiten) entfernen.
    for (const d of fs.readdirSync(zielAtlas)) if (new RegExp(`^${atlas.name}(-\\d+)?\\.(png|json)$`).test(d)) fs.rmSync(path.join(zielAtlas, d));

    const zellen = rahmen.map((r) => ({ b: r.teil.b + 2 * rand + luecke, h: r.teil.h + 2 * rand + luecke }));
    const seiten = packe(zellen, groesseMax);
    const folgen = {};   // Animationen: name → [{ nr, kurz }]
    for (const r of rahmen) {
      const m = r.kurz.match(/^(.*)-(\d+)$/);
      if (m) (folgen[m[1]] ||= []).push({ nr: Number(m[2]), kurz: r.kurz });
    }
    seiten.forEach((seite, s) => {
      const name = s === 0 ? atlas.name : `${atlas.name}-${s + 1}`;
      const bild = leeresBild(seite.breite, seite.hoehe);
      const daten = { bild: `${name}.png`, breite: seite.breite, hoehe: seite.hoehe, rahmen: {}, animationen: {} };
      for (const { index, x, y } of seite.plaetze) {
        const r = rahmen[index], zx = x + rand, zy = y + rand;
        kopiereMitRand(bild, r.bild, r.teil, zx, zy, rand);
        daten.rahmen[r.kurz] = { x: zx, y: zy, b: r.teil.b, h: r.teil.h, ankerX: r.ax - r.teil.x, ankerY: r.ay - r.teil.y };
      }
      for (const [anim, teile] of Object.entries(folgen)) {
        if (!teile.some((t) => daten.rahmen[t.kurz])) continue;
        if (!animationen[anim]) console.warn(`Warnung: Animation „${anim}“ ohne Eintrag in atlas.json, nehme ${STANDARD_ANIMATION.bps} bps mit Schleife`);
        const { bps, schleife } = { ...STANDARD_ANIMATION, ...animationen[anim] };
        daten.animationen[anim] = { rahmen: teile.sort((a, b) => a.nr - b.nr).map((t) => t.kurz), bps, schleife };
      }
      fs.writeFileSync(path.join(zielAtlas, `${name}.png`), schreibePng(bild));
      fs.writeFileSync(path.join(zielAtlas, `${name}.json`), `${JSON.stringify(daten, null, 1)}\n`);
      ergebnis.atlanten.push({ name, breite: seite.breite, hoehe: seite.hoehe, rahmen: seite.plaetze.length });
      melde(`Atlas ${name}: ${seite.breite} × ${seite.hoehe} px, ${seite.plaetze.length} Rahmen, ${Object.keys(daten.animationen).length} Animationen`);
    });
  }
  return ergebnis;
}

if (require.main === module) {
  const ordner = process.argv[2];
  if (!ordner) { console.error('Aufruf: node atlas.js <spielordner>'); process.exit(1); }
  try { baueAtlanten(path.resolve(ordner)); } catch (e) { console.error(`Fehler: ${e.message}`); process.exit(1); }
}

module.exports = { baueAtlanten, packe, sichtbarerTeil };
