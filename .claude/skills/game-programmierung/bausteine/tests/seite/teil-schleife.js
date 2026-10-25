// Probe für schleife.js: zählt Spielzeit und Bilder, merkt das größte dt und wie oft „versteckt“ gemeldet wurde.
import { erstelleSchleife } from '../../schleife.js';

const probe = { bereit: false, zeit: 0, aktualisiert: 0, gezeichnet: 0, groessterDt: 0, versteckt: 0, schleife: null };
probe.schleife = erstelleSchleife({
  aktualisiere(dt) { probe.zeit += dt; probe.aktualisiert++; if (dt > probe.groessterDt) probe.groessterDt = dt; },
  zeichne() { probe.gezeichnet++; },
  deltaMax: 0.1,
  beiVersteckt() { probe.versteckt++; },
});
probe.schleife.starte();
window.probe = probe;
requestAnimationFrame(() => { probe.bereit = true; });
