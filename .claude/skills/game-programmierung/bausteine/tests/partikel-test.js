// Test für bausteine/partikel.js (ohne Browser): node partikel-test.js
const h = require('./hilfe.js');

const E = { tempoMin: 60, tempoMax: 190, dauerMin: 0.35, dauerMax: 0.6, reibung: 4, groesse: 6, farbe: '#ffd84a' };

(async () => {
  const { erstellePartikel, streuePartikel, aktualisierePartikel, zeichnePartikel } = await h.lade('partikel.js');
  const { erstelleZufall } = await h.lade('zufall.js');
  const zufall = erstelleZufall(42);
  const p = erstellePartikel(150);

  h.pruefe(streuePartikel(p, 100, 100, 18, E, zufall) === 18 && p.anzahl === 18, '18 Partikel ausgestreut');
  let hoechst = 0;
  for (let n = 0; n < 20; n++) { streuePartikel(p, 50, 50, 18, E, zufall); hoechst = Math.max(hoechst, p.anzahl); }
  h.pruefe(hoechst === 150 && p.anzahl === 150, `21-mal 18 Partikel → höchstens ${hoechst} (max 150)`);
  h.pruefe(streuePartikel(p, 0, 0, 5, E, zufall) === 0, 'Vorrat voll → 0 neue, kein Absturz');

  const tempo0 = Math.sqrt(p.vx[0] ** 2 + p.vy[0] ** 2);
  aktualisierePartikel(p, 0.1, E.reibung);
  const tempo1 = Math.sqrt(p.vx[0] ** 2 + p.vy[0] ** 2);
  h.pruefe(tempo0 >= E.tempoMin && tempo0 <= E.tempoMax && tempo1 < tempo0, `Start-Tempo im Bereich (${h.komma(tempo0, 0)}), wird langsamer (${h.komma(tempo1, 0)})`);

  const zeitBisLeer = (dt) => {
    p.leere(); streuePartikel(p, 0, 0, 150, E, zufall);
    let zeit = 0;
    while (p.anzahl > 0 && zeit < 5) { aktualisierePartikel(p, dt, E.reibung); zeit += dt; }
    return zeit;
  };
  const z60 = zeitBisLeer(1 / 60), z10 = zeitBisLeer(0.1);
  h.pruefe(z60 <= E.dauerMax + 0.02 && z60 >= E.dauerMin, `bei 60 Bildern/s nach ${h.komma(z60)} s alle weg (≤ dauerMax ${h.komma(E.dauerMax)})`);
  h.pruefe(z10 <= E.dauerMax + 0.1, `bei 10 Bildern/s nach ${h.komma(z10)} s alle weg`);

  p.leere(); streuePartikel(p, 0, 0, 10, E, zufall);
  aktualisierePartikel(p, 0.1, 50);
  h.pruefe(p.vx[0] === 0 && p.vy[0] === 0, 'sehr starke Reibung bremst auf 0, dreht die Richtung nie um');
  p.leere();
  h.pruefe(p.anzahl === 0, 'leere() → keine Partikel');

  // Zeichnen mit nachgebautem Canvas: ganze Punkte, Deckkraft zurück auf 1
  streuePartikel(p, 10.4, 20.6, 5, E, zufall);
  aktualisierePartikel(p, 0.05, E.reibung);
  const aufrufe = [];
  const ctx = { globalAlpha: 1, fillStyle: '', fillRect(x, y, b, hh) { aufrufe.push([x, y, b, hh, this.globalAlpha]); } };
  zeichnePartikel(ctx, p, E);
  h.pruefe(aufrufe.length === 5 && aufrufe.every((a) => a.slice(0, 4).every(Number.isInteger) && a[4] > 0 && a[4] < 1),
    'zeichnet jedes Partikel als Quadrat auf ganzen Punkten, halb durchsichtig');
  h.pruefe(ctx.globalAlpha === 1 && ctx.fillStyle === E.farbe, 'Deckkraft danach wieder 1, Farbe aus der Einstellung');

  // Kein neuer Speicher beim Streuen und Aktualisieren
  p.leere();
  const schritt = () => { streuePartikel(p, 100, 100, 6, E, zufall); aktualisierePartikel(p, 1 / 60, E.reibung); };
  // streuePartikel läuft nur einmal pro Bild und braucht länger, bis V8 es übersetzt: 40.000 Bilder aufwärmen.
  const angelegt = await h.angelegterSpeicher(schritt, 20000, /partikel\.js|pool\.js/, 40000);
  h.pruefe(angelegt / 20000 < 4, `20.000 Bilder: ${h.komma(angelegt / 20000, 1)} Byte neuer Speicher pro Bild (Ziel 0)`);
  h.ergebnis();
})();
