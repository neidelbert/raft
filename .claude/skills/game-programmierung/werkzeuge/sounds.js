// Werkzeug „sounds“: berechnet Sound-Effekte aus Rezepten als WAV und wandelt sie mit ffmpeg in .m4a (AAC, für
// Safari) und .mp3 (Ersatz) um. Wofür: Effekte ohne Aufnahme, als Quelle änderbar, immer gleich laut.
//   Jeder Effekt: Wellenform (oder Rauschen) mit Frequenzverlauf, optional Tiefpass mit Verlauf, Hüllkurve.
//   Rauschen ist mit festem Startwert berechnet: Gleiches Rezept gibt dieselbe Datei (die Asset-Version bleibt gleich).
//   Spitze wird auf spitzeDb normalisiert (Standard −1 dB: Platz für die AAC-Umwandlung, kein Übersteuern).
//   Die Lautstärke im Spiel regelt "laut" im Manifest (manifest.json), nicht das Rezept.
// Aufruf:   node <skill>/werkzeuge/sounds.js <spielordner>
// Braucht:  ffmpeg (mit aac und libmp3lame). Fehlt es, bricht das Werkzeug mit einer Meldung ab (Rückgabewert 1).
// Liest:    <spielordner>/assets/quellen/sounds.json, z. B.
//   { "rate": 44100, "spitzeDb": -1, "kbps": 96,
//     "sounds": { "explosion": {
//        "dauer": 0.7,                         Sekunden
//        "welle": "sinus",                     sinus | rechteck | saege | dreieck | rauschen
//        "frequenz": [180, 40],                Hz am Anfang und am Ende (gleitet exponentiell)
//        "rauschen": 0.8,                      Anteil Rauschen 0 … 1 (bei welle „rauschen“ immer 1)
//        "tiefpass": [5000, 300],              optional: Grenzfrequenz Anfang und Ende in Hz (dumpfer werden)
//        "huelle": { "anschlag": 0.005, "halten": 0.05, "kurve": 2 } } } }
//          anschlag: Sekunden bis voll laut; halten: Sekunden voll laut; danach Abklingen bis 0 am Ende
//          (kurve 1 = gerade, 2 = schnell leiser werdend, 4 = sehr kurz).
// Schreibt: <spielordner>/assets/sounds/<name>.m4a und <name>.mp3. Danach manifest.js aufrufen.
// Aus Code: const { erzeugeSamples, schreibeWav, baueSounds } = require('./sounds.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const WELLEN = {
  sinus: (p) => Math.sin(p * 2 * Math.PI),
  rechteck: (p) => (p % 1 < 0.5 ? 1 : -1),
  saege: (p) => 2 * (p % 1) - 1,
  dreieck: (p) => 1 - 4 * Math.abs((p % 1) - 0.5),
};

// Startwert für das Rauschen aus dem Namen: jeder Sound rauscht anders, aber immer gleich.
function startwert(text) {
  let h = 2166136261;
  for (const z of text) h = Math.imul(h ^ z.codePointAt(0), 16777619);
  return h >>> 0;
}

function erzeugeSamples(rezept, rate = 44100, name = 'sound', spitzeDb = -1) {
  const { dauer, welle = 'sinus', frequenz = [440, 440], tiefpass = null, huelle = {} } = rezept;
  if (!(dauer > 0)) throw new Error(`${name}: dauer fehlt`);
  if (welle !== 'rauschen' && !WELLEN[welle]) throw new Error(`${name}: unbekannte welle „${welle}“`);
  const anteilRauschen = welle === 'rauschen' ? 1 : (rezept.rauschen || 0);
  const { anschlag = 0.005, halten = 0, kurve = 2 } = huelle;
  const n = Math.round(dauer * rate), samples = new Float32Array(n);
  let s = startwert(name), phase = 0, gefiltert = 0;
  for (let i = 0; i < n; i++) {
    const t = i / rate, anteil = i / n;
    const f = frequenz[0] * (frequenz[1] / frequenz[0]) ** anteil;   // exponentiell gleiten klingt natürlich
    phase += f / rate;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const rauschen = s / 2147483648 - 1;
    let wert = (welle === 'rauschen' ? 0 : WELLEN[welle](phase) * (1 - anteilRauschen)) + rauschen * anteilRauschen;
    if (tiefpass) {
      const grenze = tiefpass[0] * (tiefpass[1] / tiefpass[0]) ** anteil;
      gefiltert += (wert - gefiltert) * (1 - Math.exp((-2 * Math.PI * grenze) / rate));
      wert = gefiltert;
    }
    let lautheit;
    if (t < anschlag) lautheit = t / anschlag;
    else if (t < anschlag + halten) lautheit = 1;
    else lautheit = (1 - (t - anschlag - halten) / Math.max(1e-6, dauer - anschlag - halten)) ** kurve;
    samples[i] = wert * Math.max(0, lautheit);
  }
  let spitze = 0;
  for (let i = 0; i < n; i++) spitze = Math.max(spitze, Math.abs(samples[i]));
  const ziel = 10 ** (spitzeDb / 20);
  if (spitze > 0) for (let i = 0; i < n; i++) samples[i] *= ziel / spitze;
  return samples;
}

// 16-Bit-Mono-WAV.
function schreibeWav(samples, rate = 44100) {
  const kopf = Buffer.alloc(44), daten = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) daten.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  kopf.write('RIFF', 0); kopf.writeUInt32LE(36 + daten.length, 4); kopf.write('WAVE', 8);
  kopf.write('fmt ', 12); kopf.writeUInt32LE(16, 16); kopf.writeUInt16LE(1, 20); kopf.writeUInt16LE(1, 22);
  kopf.writeUInt32LE(rate, 24); kopf.writeUInt32LE(rate * 2, 28); kopf.writeUInt16LE(2, 32); kopf.writeUInt16LE(16, 34);
  kopf.write('data', 36); kopf.writeUInt32LE(daten.length, 40);
  return Buffer.concat([kopf, daten]);
}

// ffmpeg ohne Zeitstempel und Kennungen in der Datei: gleiche Quelle → gleiche Datei.
function wandle(wav, ziel, codec, kbps) {
  const lauf = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-map_metadata', '-1', '-fflags', '+bitexact',
    '-flags:a', '+bitexact', '-c:a', codec, '-b:a', `${kbps}k`, ziel], { encoding: 'utf8' });
  if (lauf.error) throw new Error('ffmpeg nicht gefunden (installieren: apt install ffmpeg bzw. brew install ffmpeg)');
  if (lauf.status !== 0) throw new Error(`ffmpeg (${codec}) meldet: ${lauf.stderr.trim()}`);
}

function baueSounds(spielordner, { still = false } = {}) {
  const quelle = JSON.parse(fs.readFileSync(path.join(spielordner, 'assets', 'quellen', 'sounds.json'), 'utf8'));
  const { rate = 44100, spitzeDb = -1, kbps = 96, sounds = {} } = quelle;
  const ziel = path.join(spielordner, 'assets', 'sounds');
  fs.mkdirSync(ziel, { recursive: true });
  const arbeit = fs.mkdtempSync(path.join(os.tmpdir(), 'sounds-'));
  const ergebnis = [];
  try {
    for (const [name, rezept] of Object.entries(sounds)) {
      const wav = path.join(arbeit, `${name}.wav`);
      fs.writeFileSync(wav, schreibeWav(erzeugeSamples(rezept, rate, name, spitzeDb), rate));
      const dateien = [path.join(ziel, `${name}.m4a`), path.join(ziel, `${name}.mp3`)];
      wandle(wav, dateien[0], 'aac', kbps);
      wandle(wav, dateien[1], 'libmp3lame', kbps);
      ergebnis.push({ name, dateien });
      if (!still) console.log(`Sound ${name}: ${rezept.dauer} s → ${dateien.map((d) => `${path.basename(d)} (${fs.statSync(d).size} Bytes)`).join(', ')}`);
    }
  } finally {
    fs.rmSync(arbeit, { recursive: true, force: true });
  }
  return ergebnis;
}

if (require.main === module) {
  const ordner = process.argv[2];
  if (!ordner) { console.error('Aufruf: node sounds.js <spielordner>'); process.exit(1); }
  try { baueSounds(path.resolve(ordner)); } catch (e) { console.error(`Fehler: ${e.message}`); process.exit(1); }
}

module.exports = { erzeugeSamples, schreibeWav, baueSounds };
