// Probe für ton.js: ein Klang „piep“, Ton wird bei der ersten Berührung geweckt.
import { erstelleTon } from '../../ton.js';

const ton = erstelleTon({ lautstaerke: 0.5, mindestAbstand: 0.05 },
  { piep: { frequenz: 880, dauer: 0.1, art: 'triangle', laut: 0.3, gleiten: 440 } });
ton.verbinde(window);
window.probe = { bereit: true, ton, spiele: () => ton.spiele('piep') };
