// Baustein „bildschirm“: scharfer Vollbild-Canvas für 2D, Pixel-Ratio höchstens 2, folgt Größenänderungen.
// Wofür: jedes 2D-Spiel. Die interne Canvas-Größe ist CSS-Größe × Pixel-Ratio (sonst unscharf), aber höchstens × 2
//   (iPhones haben 3; × 3 kostet mehr als doppelt so viel Rechenzeit, sieht kaum besser aus). Gezeichnet wird danach
//   in CSS-Punkten. Die Größe kommt vom Canvas selbst (getBoundingClientRect), damit 100dvh und die Safari-Leiste
//   stimmen. Kein Zugriff auf den Browser beim Laden.
// Schnittstelle:
//   erstelleBildschirm(leinwand, { pixelRatioMax = 2, alpha = false, beiGroesse }) → bildschirm
//     leinwand: <canvas>, per CSS bildschirmfüllend (position: fixed; inset: 0; width: 100vw; height: 100dvh).
//     alpha = false: undurchsichtiger Canvas, zeichnet schneller. beiGroesse(bildschirm): beim Start und nach jeder Größenänderung
//       (danach neu zeichnen: Ändern der Canvas-Größe löscht das Bild).
//   bildschirm = { ctx, breite, hoehe, pixelRatio, passeAn(), entferne() }
//     breite, hoehe: CSS-Punkte. ctx ist so eingestellt, dass 1 Einheit = 1 CSS-Punkt.
//     Wer selbst setTransform aufruft (Kamera), multipliziert mit pixelRatio: ctx.setTransform(pr, 0, 0, pr, …).
//   rechneLeinwand(cssBreite, cssHoehe, geraeteRatio, maxRatio) → { pixelRatio, pixelBreite, pixelHoehe } (reine Rechnung).
// 3D: renderer.setPixelRatio(Math.min(devicePixelRatio, 2)) und renderer.setSize(innerWidth, innerHeight) bei resize
//   (siehe wissen/threejs-3d.md); dieser Baustein ist nur für Canvas 2D.
// Beispiel:
//   import { erstelleBildschirm } from './kern/bildschirm.js';
//   const bildschirm = erstelleBildschirm(document.getElementById('leinwand'), {
//     pixelRatioMax: SPIEL.pixelRatioMax,
//     beiGroesse: (b) => haltImBild(welt.spieler, b.breite, b.hoehe),
//   });
//   bildschirm.ctx.fillRect(0, 0, bildschirm.breite, bildschirm.hoehe);

export function rechneLeinwand(cssBreite, cssHoehe, geraeteRatio, maxRatio) {
  const pixelRatio = Math.min(geraeteRatio || 1, maxRatio);
  return { pixelRatio, pixelBreite: Math.round(cssBreite * pixelRatio), pixelHoehe: Math.round(cssHoehe * pixelRatio) };
}

export function erstelleBildschirm(leinwand, { pixelRatioMax = 2, alpha = false, beiGroesse = null } = {}) {
  const ctx = leinwand.getContext('2d', { alpha });
  const bildschirm = { ctx, breite: 0, hoehe: 0, pixelRatio: 1, passeAn, entferne };

  function passeAn() {
    const groesse = leinwand.getBoundingClientRect();
    const r = rechneLeinwand(groesse.width, groesse.height, window.devicePixelRatio, pixelRatioMax);
    bildschirm.breite = groesse.width;
    bildschirm.hoehe = groesse.height;
    bildschirm.pixelRatio = r.pixelRatio;
    leinwand.width = r.pixelBreite;     // setzt auch den ganzen Zeichenzustand zurück, daher danach setTransform
    leinwand.height = r.pixelHoehe;
    ctx.setTransform(r.pixelRatio, 0, 0, r.pixelRatio, 0, 0);
    if (beiGroesse) beiGroesse(bildschirm);
  }

  function entferne() { window.removeEventListener('resize', passeAn); }

  passeAn();
  window.addEventListener('resize', passeAn);   // Drehen, Safari-Leiste ein/aus
  return bildschirm;
}
