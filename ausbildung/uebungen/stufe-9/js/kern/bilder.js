// Baustein „bilder“: Bilder des Zeichners laden; fehlt eines, gibt es einen Ersatz und das Spiel läuft weiter.
// Wofür: jedes Spiel mit grafik/grafik.json. Fehlt die Liste oder ein Bild, gibt es nur eine Warnung (console.warn),
//   keinen Fehler und keinen Absturz. Achtung: Fehlt eine Datei, die in grafik.json steht, meldet der Browser selbst
//   „Failed to load resource“ als Fehlerzeile; das lässt sich im Spielcode nicht verhindern (Lernbuch Stufe 6).
//   Ersatzbilder und eingefärbte Kopien entstehen einmal beim Start, nie pro Bild.
//   Kein Zugriff auf den Browser beim Laden.
// Schnittstelle:
//   ladeBilder(listenDatei = 'grafik/grafik.json') → Promise<{ name: Image }>, nur die geladenen Bilder.
//     grafik.json: [{ "name": "figuren/held", "datei": "grafik/figuren/held.png", "breite": 213, "hoehe": 256 }].
//     Wartet, bis jedes Bild geladen oder als fehlend erkannt ist (hängt nie).
//   holeBild(bilder, name) → Bild oder null (mit Warnung, die den Namen nennt).
//   ersatzBild(breite, hoehe, maler, aufloesung = 2) → Canvas: maler(ctx, breite, hoehe) zeichnet einmal in Punkten,
//     doppelt aufgelöst wie die Bilder des Zeichners. Danach wie ein Bild mit drawImage nutzbar.
//   faerbeEin(bild, farbe) → Canvas: Kopie, deren undurchsichtige Teile ganz in farbe sind (rotes Aufblitzen).
//   bildMasse(bild) → { breite, hoehe } in Pixeln (Image: naturalWidth, Canvas: width).
// Beispiel:
//   import { ladeBilder, holeBild, ersatzBild } from './kern/bilder.js';
//   const bilder = await ladeBilder();
//   const held = holeBild(bilder, 'figuren/held') || ersatzBild(48, 64, (ctx, b, h) => {
//     ctx.fillStyle = FARBEN.ersatz; ctx.beginPath(); ctx.arc(b / 2, h / 2, b / 2 - 2, 0, Math.PI * 2); ctx.fill();
//   });
//   ctx.drawImage(held, x - 24, y - 64, 48, 64);   // Fußpunkt als Bezug

export async function ladeBilder(listenDatei = 'grafik/grafik.json') {
  let liste = [];
  try {
    const antwort = await fetch(listenDatei);
    if (!antwort.ok) throw new Error(antwort.status);
    liste = await antwort.json();
    if (!Array.isArray(liste)) throw new Error('keine Liste');
  } catch {
    console.warn(`Bilderliste fehlt oder ist unlesbar: ${listenDatei}`);
    liste = [];
  }
  const bilder = {};
  await Promise.all(liste.map((eintrag) => new Promise((fertig) => {
    const bild = new Image();
    bild.onload = () => { bilder[eintrag.name] = bild; fertig(); };
    bild.onerror = () => { console.warn(`Bild fehlt: ${eintrag.datei}`); fertig(); };
    bild.src = eintrag.datei;
  })));
  return bilder;
}

export function holeBild(bilder, name) {
  if (bilder[name]) return bilder[name];
  console.warn(`Bild „${name}“ fehlt, Ersatz wird gezeichnet`);
  return null;
}

export function ersatzBild(breite, hoehe, maler, aufloesung = 2) {
  const leinwand = document.createElement('canvas');
  leinwand.width = Math.ceil(breite * aufloesung);
  leinwand.height = Math.ceil(hoehe * aufloesung);
  const ctx = leinwand.getContext('2d');
  ctx.scale(aufloesung, aufloesung);
  maler(ctx, breite, hoehe);
  return leinwand;
}

export function faerbeEin(bild, farbe) {
  const { breite, hoehe } = bildMasse(bild);
  const kopie = document.createElement('canvas');
  kopie.width = breite;
  kopie.height = hoehe;
  const ctx = kopie.getContext('2d');
  ctx.drawImage(bild, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';   // nur dort malen, wo das Bild schon etwas hat
  ctx.fillStyle = farbe;
  ctx.fillRect(0, 0, breite, hoehe);
  return kopie;
}

export function bildMasse(bild) {
  return { breite: bild.naturalWidth || bild.width, hoehe: bild.naturalHeight || bild.height };
}
