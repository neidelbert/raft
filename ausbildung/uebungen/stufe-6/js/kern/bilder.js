// Bilder laden. ladeBilder() liest grafik/grafik.json und gibt { name: Image } zurück.
// Fehlt die Liste oder ein Bild, gibt es nur eine Warnung; das Spiel zeichnet dann einen Ersatz.
export async function ladeBilder(listenDatei = 'grafik/grafik.json') {
  let liste = [];
  try {
    liste = await (await fetch(listenDatei)).json();
  } catch {
    console.warn(`Bilderliste fehlt: ${listenDatei}`);
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

// Eingefärbte Kopie eines Bildes (z. B. rot für das Aufblitzen bei Treffern). Einmal beim Start, nie pro Bild:
// Die Kopie ist ein Canvas in Bildgröße, nur die undurchsichtigen Teile werden mit `farbe` gefüllt.
export function faerbeEin(bild, farbe) {
  const kopie = document.createElement('canvas');
  kopie.width = bild.naturalWidth || bild.width;
  kopie.height = bild.naturalHeight || bild.height;
  const ctx = kopie.getContext('2d');
  ctx.drawImage(bild, 0, 0);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = farbe;
  ctx.fillRect(0, 0, kopie.width, kopie.height);
  return kopie;
}

// Bild aus der Liste holen. Fehlt es (Datei fehlt oder steht nicht in grafik.json), nur eine Warnung und null:
// Wer das Bild zeichnet, nimmt dann seinen Ersatz.
export function holeBild(bilder, name) {
  if (bilder[name]) return bilder[name];
  console.warn(`Bild „${name}“ fehlt, Ersatz wird gezeichnet`);
  return null;
}
