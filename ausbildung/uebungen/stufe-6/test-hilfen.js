// Hilfen für den Browser-Test von Übung 4 (test.js, test-browser-speicher.js).

const komma = (zahl, stellen = 2) => zahl.toFixed(stellen).replace('.', ',');

// Alles, was der Test liest, in einem Aufruf (Werte aus window.spiel und der Anzeige).
function lies(seite) {
  return seite.evaluate(() => {
    const s = window.spiel, sichtbar = (id) => !document.getElementById(id).hidden;
    return {
      bereit: s.bereit, zustand: s.zustand, punkte: s.punkte, rekord: s.rekord, leben: s.spieler.leben,
      x: s.spieler.x, y: s.spieler.y, unverwundbar: s.spieler.unverwundbar, gegner: s.gegnerAktiv, pausiert: s.pausiert,
      joystickAktiv: s.eingabe.aktiv, schrittMs: s.messung.schrittMs,
      typen: [typeof s.zustand, typeof s.punkte, typeof s.rekord, typeof s.spieler.leben, typeof s.test?.schaden].join(' '),
      zeit: s.test ? s.test.zeit() : undefined,
      tafel: document.getElementById('tafel').innerText.trim(), tafelSichtbar: sichtbar('tafel'),
      leiste: document.getElementById('leiste').innerText.replace(/\s+/g, ' ').trim(), leisteSichtbar: sichtbar('leiste'),
      gespeichert: (() => { try { return localStorage.getItem('uebung-4'); } catch { return 'gesperrt'; } })(),
      ersterGegner: s.test && s.gegnerAktiv ? JSON.stringify(s.test.gegnerPositionen()[0]) : '',
      iw: innerWidth, ih: innerHeight,
    };
  });
}

// Im Browser: jedes Bild Werte mitschreiben, ms lang.
function beobachte(ms) {
  return new Promise((fertig) => {
    const s = window.spiel, liste = [], start = performance.now();
    (function bild() {
      const jetzt = performance.now() - start;
      liste.push({ t: jetzt, zustand: s.zustand, punkte: s.punkte, leben: s.spieler.leben, x: s.spieler.x, gegner: s.gegnerAktiv,
        pausiert: s.pausiert, zeit: s.test.zeit(), ersterGegner: s.gegnerAktiv ? JSON.stringify(s.test.gegnerPositionen()[0]) : '' });
      if (jetzt < ms) requestAnimationFrame(bild); else fertig(liste);
    })();
  });
}

// Tab verstecken oder zeigen, wie Safari beim App-Wechsel (beide Felder plus Ereignis).
function versteckeTab(seite, an) {
  return seite.evaluate((versteckt) => {
    Object.defineProperty(document, 'hidden', { value: versteckt, configurable: true });
    Object.defineProperty(document, 'visibilityState', { value: versteckt ? 'hidden' : 'visible', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  }, an);
}

function bremseAn(seite) {   // langsames Gerät: jedes Bild 40 ms Rechenarbeit (≈ 20 Bilder/s), siehe Lernbuch Stufe 1
  return seite.evaluate(() => { window.bremse = true; (function b() { if (!window.bremse) return; const bis = performance.now() + 40; while (performance.now() < bis); requestAnimationFrame(b); })(); });
}

module.exports = { komma, lies, beobachte, versteckeTab, bremseAn };
