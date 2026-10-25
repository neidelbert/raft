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
