// PNG lesen und schreiben ohne Pakete (nur Node: zlib). Hilfe für atlas.js und die Werkzeug-Tests.
// Kann: 8 Bit pro Kanal, ohne Zeilensprung (Interlace), Farbarten Grau, RGB, Palette, Grau+Alpha, RGBA.
//   Das ist alles, was render.js des Zeichners und übliche Malprogramme schreiben. Anderes → klarer Fehler.
// Schnittstelle:
//   lesePng(buffer) → { breite, hoehe, daten: Uint8Array (RGBA, Zeile für Zeile) }
//   schreibePng({ breite, hoehe, daten }) → Buffer (RGBA, Filter „Sub“/„Up“ je Zeile, gut gepackt)
//   leeresBild(breite, hoehe) → { breite, hoehe, daten } (ganz durchsichtig)
// Aufruf-Beispiel:
//   const { lesePng, schreibePng } = require('./png.js');
//   const bild = lesePng(fs.readFileSync('held.png'));   fs.writeFileSync('kopie.png', schreibePng(bild));
const zlib = require('zlib');

const SIGNATUR = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const KANAELE = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };   // Farbart → Bytes pro Pixel (bei 8 Bit)

function leeresBild(breite, hoehe) {
  return { breite, hoehe, daten: new Uint8Array(breite * hoehe * 4) };
}

function lesePng(buffer) {
  if (!buffer.subarray(0, 8).equals(SIGNATUR)) throw new Error('keine PNG-Datei');
  let pos = 8, kopf = null, palette = null, transparenz = null;
  const teile = [];
  while (pos < buffer.length) {
    const laenge = buffer.readUInt32BE(pos), art = buffer.toString('latin1', pos + 4, pos + 8);
    const inhalt = buffer.subarray(pos + 8, pos + 8 + laenge);
    if (art === 'IHDR') kopf = { breite: inhalt.readUInt32BE(0), hoehe: inhalt.readUInt32BE(4), tiefe: inhalt[8], farbart: inhalt[9], zeilensprung: inhalt[12] };
    else if (art === 'PLTE') palette = inhalt;
    else if (art === 'tRNS') transparenz = inhalt;
    else if (art === 'IDAT') teile.push(inhalt);
    else if (art === 'IEND') break;
    pos += 12 + laenge;
  }
  if (!kopf) throw new Error('PNG ohne Kopf (IHDR)');
  const { breite, hoehe, tiefe, farbart, zeilensprung } = kopf;
  if (tiefe !== 8 || zeilensprung !== 0 || !(farbart in KANAELE)) {
    throw new Error(`PNG-Art nicht unterstützt (Tiefe ${tiefe}, Farbart ${farbart}, Zeilensprung ${zeilensprung}); bitte als 8-Bit-RGBA speichern`);
  }
  const bpp = KANAELE[farbart], zeile = breite * bpp;
  const roh = zlib.inflateSync(Buffer.concat(teile));
  const pixel = new Uint8Array(zeile * hoehe);
  for (let y = 0; y < hoehe; y++) {
    const filter = roh[y * (zeile + 1)], start = y * (zeile + 1) + 1;
    for (let i = 0; i < zeile; i++) {
      const a = i >= bpp ? pixel[y * zeile + i - bpp] : 0;            // links
      const b = y > 0 ? pixel[(y - 1) * zeile + i] : 0;                // oben
      const c = y > 0 && i >= bpp ? pixel[(y - 1) * zeile + i - bpp] : 0;   // oben links
      let wert = roh[start + i];
      if (filter === 1) wert += a;
      else if (filter === 2) wert += b;
      else if (filter === 3) wert += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); wert += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      pixel[y * zeile + i] = wert & 255;
    }
  }
  const bild = leeresBild(breite, hoehe), d = bild.daten;
  for (let i = 0, n = breite * hoehe; i < n; i++) {
    const q = i * bpp, z = i * 4;
    if (farbart === 6) { d[z] = pixel[q]; d[z + 1] = pixel[q + 1]; d[z + 2] = pixel[q + 2]; d[z + 3] = pixel[q + 3]; }
    else if (farbart === 2) { d[z] = pixel[q]; d[z + 1] = pixel[q + 1]; d[z + 2] = pixel[q + 2]; d[z + 3] = 255; }
    else if (farbart === 0) { d[z] = d[z + 1] = d[z + 2] = pixel[q]; d[z + 3] = 255; }
    else if (farbart === 4) { d[z] = d[z + 1] = d[z + 2] = pixel[q]; d[z + 3] = pixel[q + 1]; }
    else {   // Palette
      const p = pixel[q];
      d[z] = palette[p * 3]; d[z + 1] = palette[p * 3 + 1]; d[z + 2] = palette[p * 3 + 2];
      d[z + 3] = transparenz && p < transparenz.length ? transparenz[p] : 255;
    }
  }
  return bild;
}

// CRC32 für die PNG-Abschnitte.
const CRC_TABELLE = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
function crc32(buffer) {
  let c = -1;
  for (let i = 0; i < buffer.length; i++) c = CRC_TABELLE[(c ^ buffer[i]) & 255] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function abschnitt(art, inhalt) {
  const kopf = Buffer.alloc(8);
  kopf.writeUInt32BE(inhalt.length, 0);
  kopf.write(art, 4, 'latin1');
  const pruef = Buffer.alloc(4);
  pruef.writeUInt32BE(crc32(Buffer.concat([kopf.subarray(4), inhalt])), 0);
  return Buffer.concat([kopf, inhalt, pruef]);
}

function schreibePng({ breite, hoehe, daten }) {
  const zeile = breite * 4, roh = Buffer.alloc((zeile + 1) * hoehe);
  for (let y = 0; y < hoehe; y++) {
    // Filter „Up“ ab der zweiten Zeile, sonst „Sub“: einfach und packt Bilder mit Flächen gut.
    const filter = y === 0 ? 1 : 2, start = y * (zeile + 1);
    roh[start] = filter;
    for (let i = 0; i < zeile; i++) {
      const vorher = filter === 1 ? (i >= 4 ? daten[y * zeile + i - 4] : 0) : daten[(y - 1) * zeile + i];
      roh[start + 1 + i] = (daten[y * zeile + i] - vorher) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(breite, 0);
  ihdr.writeUInt32BE(hoehe, 4);
  ihdr[8] = 8; ihdr[9] = 6;   // 8 Bit, RGBA
  return Buffer.concat([SIGNATUR, abschnitt('IHDR', ihdr), abschnitt('IDAT', zlib.deflateSync(roh, { level: 9 })), abschnitt('IEND', Buffer.alloc(0))]);
}

module.exports = { lesePng, schreibePng, leeresBild };
