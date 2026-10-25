// Scharfer Vollbild-Canvas. erstelleBildschirm(leinwand, maxRatio) gibt { ctx, breite, hoehe, pixelRatio, passeAn } zurück.
// breite/hoehe sind CSS-Punkte; gezeichnet wird ebenfalls in CSS-Punkten (setTransform übernimmt die Pixel-Ratio).
export function erstelleBildschirm(leinwand, maxRatio) {
  const ctx = leinwand.getContext('2d', { alpha: false });
  const bildschirm = { ctx, breite: 0, hoehe: 0, pixelRatio: 1, passeAn };

  function passeAn() {
    const pr = Math.min(window.devicePixelRatio || 1, maxRatio);
    const groesse = leinwand.getBoundingClientRect();   // tatsächliche CSS-Größe (100dvh beachtet die Safari-Leiste)
    bildschirm.breite = groesse.width;
    bildschirm.hoehe = groesse.height;
    bildschirm.pixelRatio = pr;
    leinwand.width = Math.round(groesse.width * pr);
    leinwand.height = Math.round(groesse.height * pr);
    ctx.setTransform(pr, 0, 0, pr, 0, 0);
  }

  passeAn();
  window.addEventListener('resize', passeAn);
  return bildschirm;
}
