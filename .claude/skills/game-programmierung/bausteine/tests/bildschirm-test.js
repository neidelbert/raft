// Test für bausteine/bildschirm.js: Rechnung ohne Browser, dann im Browser als iPhone 13 (Port 8881) und am PC (8886).
const h = require('./hilfe.js');
const b = require('./browser-hilfe.js');

async function regeln() {
  const { rechneLeinwand } = await h.lade('bildschirm.js');
  let r = rechneLeinwand(390, 844, 3, 2);
  h.pruefe(r.pixelRatio === 2 && r.pixelBreite === 780 && r.pixelHoehe === 1688, 'Gerät mit Pixel-Ratio 3 → 2, Canvas 780 × 1688');
  r = rechneLeinwand(390, 844, undefined, 2);
  h.pruefe(r.pixelRatio === 1 && r.pixelBreite === 390, 'ohne Angabe → Pixel-Ratio 1');
  r = rechneLeinwand(100.4, 50.6, 1.5, 2);
  h.pruefe(r.pixelRatio === 1.5 && r.pixelBreite === 151 && r.pixelHoehe === 76, 'Kommazahlen werden auf ganze Pixel gerundet');
}

const lies = (seite) => seite.evaluate(() => {
  const { breite, hoehe, pixelRatio, ctx } = window.probe.bildschirm, l = document.getElementById('leinwand');
  return { breite, hoehe, pixelRatio, w: l.width, h: l.height, a: ctx.getTransform().a, d: ctx.getTransform().d,
    innen: [innerWidth, innerHeight], groessen: window.probe.groessen };
});

async function alsIphone() {
  const lauf = await b.starteProbe('bildschirm', 8881);
  const { seite } = lauf;
  try {
    const geraet = await seite.evaluate(() => devicePixelRatio);
    let z = await lies(seite);
    h.pruefe(geraet === 3 && z.pixelRatio === 2, `iPhone 13 (Pixel-Ratio ${geraet}) → Pixel-Ratio ${z.pixelRatio}`);
    h.pruefe(z.breite === z.innen[0] && z.hoehe === z.innen[1], `Canvas füllt den Bildschirm (${z.breite} × ${z.hoehe} Punkte)`);
    h.pruefe(z.w === Math.round(z.breite * 2) && z.h === Math.round(z.hoehe * 2), `interne Größe = Größe × 2 (${z.w} × ${z.h})`);
    h.pruefe(z.a === 2 && z.d === 2, 'gezeichnet wird in CSS-Punkten (Transform × 2)');
    await seite.screenshot({ path: b.foto('bildschirm') });
    const vorher = z.groessen;
    await seite.setViewportSize({ width: 664, height: 390 });   // Handy gedreht
    await seite.waitForFunction((n) => window.probe.groessen > n, vorher);
    z = await lies(seite);
    h.pruefe(z.breite === 664 && z.hoehe === 390 && z.w === 1328 && z.h === 780 && z.a === 2,
      `gedreht (664 × 390): Canvas ${z.w} × ${z.h}, beiGroesse aufgerufen, Transform wieder × 2`);
    await seite.evaluate(() => window.probe.bildschirm.entferne());
    await seite.setViewportSize({ width: 390, height: 664 });
    await seite.waitForTimeout(200);
    z = await lies(seite);
    h.pruefe(z.breite === 664, 'entferne(): hört nicht mehr auf Größenänderungen');
    h.pruefe(lauf.fehler.length === 0, `keine Konsolenfehler ${lauf.fehler.join(' | ')}`);
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

async function amPc() {
  const lauf = await b.starteProbe('bildschirm', 8886, { geraet: 'Desktop Chrome' });
  try {
    const z = await lies(lauf.seite);
    h.pruefe(z.pixelRatio === 1 && z.w === Math.round(z.breite), `PC mit Pixel-Ratio 1 → Canvas ${z.w} Pixel breit (= Punkte)`);
  } catch (e) { h.pruefe(false, `Ablauf abgebrochen: ${e.message}`); }
  await lauf.ende();
}

(async () => {
  await regeln();
  await alsIphone();
  await amPc();
  h.ergebnis();
})();
