// Test für bausteine/animation.js (ohne Browser): Rahmen nach Zeit, Schleife, einmal mit „fertig“, Tempo,
// Zeichnen um den Anker und gespiegelt, kein neuer Speicher pro Bild. node animation-test.js
const h = require('./hilfe.js');

const LAUF = { rahmen: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6'], bps: 10, schleife: true };
const BUMM = { rahmen: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'], bps: 15, schleife: false };

// Nachgebauter Canvas-Kontext: schreibt drawImage, translate, scale, save, restore mit.
function erstelleCtx() {
  const ctx = { aufrufe: [] };
  for (const f of ['drawImage', 'translate', 'scale', 'save', 'restore']) ctx[f] = (...a) => ctx.aufrufe.push([f, ...a.filter((x) => typeof x === 'number')]);
  return ctx;
}

(async () => {
  const a = await h.lade('animation.js');
  const { erstelleAbspieler, spieleAb, aktualisiereAnimation, rahmenIndex, rahmenName, zeichneRahmen } = a;

  // Rahmen nach Zeit
  h.pruefe(rahmenIndex(LAUF, 0) === 0 && rahmenIndex(LAUF, 0.099) === 0 && rahmenIndex(LAUF, 0.1) === 1 && rahmenIndex(LAUF, 0.55) === 5, 'Rahmen = floor(zeit × bps): 0 s → 1., 0,1 s → 2., 0,55 s → 6.');
  h.pruefe(rahmenIndex(LAUF, 0.6) === 0 && rahmenIndex(LAUF, 0.75) === 1, 'Schleife: nach dem letzten Rahmen wieder der erste');
  h.pruefe(rahmenIndex(BUMM, 0.39) === 5 && rahmenIndex(BUMM, 5) === 5, 'einmal: bleibt auf dem letzten Rahmen');

  // Unabhängig von der Bildrate: 1 s mit 60 und mit 20 Bildern pro Sekunde → gleich viele Rahmenwechsel
  function wechselIn(sekunden, bilderProSekunde, tempo = 1) {
    const s = erstelleAbspieler(LAUF);
    let wechsel = 0, vorher = s.index;
    for (let i = 0; i < Math.round(sekunden * bilderProSekunde); i++) {
      aktualisiereAnimation(s, 1 / bilderProSekunde, tempo);
      if (s.index !== vorher) { wechsel++; vorher = s.index; }
    }
    return wechsel;
  }
  const w60 = wechselIn(3, 60), w20 = wechselIn(3, 20);
  h.pruefe(Math.abs(w60 - 30) <= 1 && Math.abs(w20 - 30) <= 1, `10 bps: in 3 s etwa 30 Rahmenwechsel, bei 60 und 20 Bildern/s (${w60}, ${w20})`);
  const schnell = wechselIn(3, 60, 1.4);
  h.pruefe(Math.abs(schnell - 42) <= 1, `tempo 1,4 (Rennen, 14 bps): in 3 s etwa 42 Wechsel (${schnell})`);

  // Einmal + fertig genau einmal
  const e = erstelleAbspieler(BUMM);
  let meldungen = 0, bilder = 0;
  while (bilder < 200) { bilder++; if (aktualisiereAnimation(e, 1 / 60)) meldungen++; if (e.fertig && bilder > 60) break; }
  h.pruefe(meldungen === 1 && e.fertig && e.index === 5 && rahmenName(e) === 'e6', `einmal: genau eine „fertig“-Meldung, steht auf dem letzten Rahmen (${meldungen})`);
  const bisFertig = erstelleAbspieler(BUMM);
  let zeit = 0;
  while (!aktualisiereAnimation(bisFertig, 1 / 60) && zeit < 2) zeit += 1 / 60;
  h.pruefe(Math.abs(zeit + 1 / 60 - 0.4) < 0.02, `einmal: fertig nach 6 / 15 bps = 0,4 s (${h.komma(zeit + 1 / 60, 3)} s)`);
  h.pruefe(aktualisiereAnimation(e, 1) === false && e.index === 5, 'nach fertig: keine weitere Meldung, bleibt stehen');

  // Abspielen und Wechseln
  const s = erstelleAbspieler();
  h.pruefe(rahmenName(s) === '' && aktualisiereAnimation(s, 0.1) === false, 'ohne Animation: leerer Name, kein Absturz');
  spieleAb(s, LAUF);
  aktualisiereAnimation(s, 0.25);
  spieleAb(s, LAUF);
  h.pruefe(s.index === 2, 'dieselbe Animation erneut → läuft weiter');
  spieleAb(s, BUMM);
  h.pruefe(s.zeit === 0 && s.index === 0 && rahmenName(s) === 'e1', 'andere Animation → von vorn');
  aktualisiereAnimation(s, 1);
  spieleAb(s, BUMM, true);
  h.pruefe(!s.fertig && s.index === 0, 'vonVorn: fertige Explosion startet neu');
  const lang = erstelleAbspieler(LAUF);
  for (let i = 0; i < 100000; i++) aktualisiereAnimation(lang, 0.1);
  h.pruefe(lang.zeit < 0.6 + 1e-9, `Schleife: zeit bleibt klein, auch nach langer Zeit (${lang.zeit.toFixed(3)} s)`);

  // Zeichnen um den Anker
  const bild = {}, rahmen = { bild, x: 10, y: 20, b: 100, h: 200, ankerX: 40, ankerY: 190 };
  let ctx = erstelleCtx();
  h.pruefe(zeichneRahmen(ctx, rahmen, 300, 500, 0.5, 1) === true, 'zeichneRahmen gibt true zurück');
  h.pruefe(JSON.stringify(ctx.aufrufe) === JSON.stringify([['drawImage', 10, 20, 100, 200, 280, 405, 50, 100]]),
    `Blick rechts: Ausschnitt aus dem Atlas, Fußpunkt (Anker × Skala) liegt auf (x, y) ${JSON.stringify(ctx.aufrufe)}`);
  ctx = erstelleCtx();
  zeichneRahmen(ctx, rahmen, 300, 500, 0.5, -1);
  const art = ctx.aufrufe.map((x) => x[0]).join();
  const zeichnung = ctx.aufrufe.find((x) => x[0] === 'drawImage');
  h.pruefe(art === 'save,translate,scale,drawImage,restore' && JSON.stringify(ctx.aufrufe[1]) === '["translate",300,500]' && JSON.stringify(ctx.aufrufe[2]) === '["scale",-1,1]',
    `Blick links: um den Fußpunkt gespiegelt (${art})`);
  h.pruefe(zeichnung[5] === -20 && zeichnung[6] === -95, 'Blick links: Anker liegt auf dem Fußpunkt (−ankerX × Skala, −ankerY × Skala)');
  ctx = erstelleCtx();
  h.pruefe(zeichneRahmen(ctx, undefined, 1, 1) === false && ctx.aufrufe.length === 0, 'fehlender Rahmen: nichts gezeichnet, kein Absturz');

  // Kein neuer Speicher pro Bild (Aktualisieren und Zeichnen, 20 Figuren)
  const figuren = Array.from({ length: 20 }, () => erstelleAbspieler(LAUF));
  const leer = { drawImage() {}, translate() {}, scale() {}, save() {}, restore() {} };
  const schritt = () => { for (const f of figuren) { aktualisiereAnimation(f, 0.016); zeichneRahmen(leer, rahmen, 100, 200, 0.5, 1); } };
  const angelegt = await h.angelegterSpeicher(schritt, 20000, /animation\.js/, 40000);
  h.pruefe(angelegt < 2000, `kein neuer Speicher pro Bild (${angelegt} Bytes in 20.000 Bildern mit 20 Figuren)`);
  h.ergebnis();
})();
