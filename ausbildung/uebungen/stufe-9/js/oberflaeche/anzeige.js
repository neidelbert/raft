// HTML-Anzeige: Ladebildschirm mit Balken, „Tippen zum Starten“, Ton-Knopf-Symbol (aus dem Atlas).
// Der Ladebildschirm steht schon im HTML (erscheint sofort, ohne Assets); hier wird er nur gesteuert.
import { TON_KNOPF } from '../config/steuerung.js';
import { zeichneRahmen } from '../kern/animation.js';

export function erstelleAnzeige(dokument) {
  const laden = dokument.getElementById('laden'), balken = dokument.getElementById('balken-fuellung');
  const start = dokument.getElementById('start'), symbol = dokument.getElementById('ton-symbol');
  const pr = 2;   // Symbol doppelt aufgelöst (wie der Atlas)
  symbol.width = TON_KNOPF.groesse * pr;
  symbol.height = TON_KNOPF.groesse * pr;
  const ctx = symbol.getContext('2d');

  return {
    fortschritt(anteil) {
      balken.style.transform = `scaleX(${anteil})`;
      laden.setAttribute('aria-valuenow', String(Math.round(anteil * 100)));
    },
    zeigeStart() { laden.hidden = true; start.hidden = false; },
    zeigeSpiel() { laden.hidden = true; start.hidden = true; },
    // Rahmen ton-an/ton-aus in den Knopf zeichnen, mittig und so groß wie der Knopf.
    zeigeTon(rahmen) {
      ctx.clearRect(0, 0, symbol.width, symbol.height);
      if (!rahmen) return;
      const skala = symbol.width / Math.max(rahmen.b, rahmen.h);
      zeichneRahmen(ctx, rahmen, symbol.width / 2 - (rahmen.b / 2 - rahmen.ankerX) * skala, symbol.height / 2 - (rahmen.h / 2 - rahmen.ankerY) * skala, skala, 1);
    },
  };
}
