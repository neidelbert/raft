// Prüft alle Bausteine gemeinsam (ohne Browser): Kopfkommentar, kein window.spiel, ohne Browser ladbar,
// Test vorhanden, Handbuch verweist darauf. node kopf-test.js
const fs = require('fs');
const path = require('path');
const h = require('./hilfe.js');

const BAUSTEINE = ['schleife', 'bildschirm', 'joystick', 'knopf', 'zufall', 'speicher', 'pool', 'gitter', 'partikel', 'ton', 'bilder', 'zustaende'];
const SKILL = path.join(__dirname, '..', '..', 'SKILL.md');

(async () => {
  const vorhanden = fs.readdirSync(h.ORDNER).filter((d) => d.endsWith('.js')).map((d) => d.slice(0, -3)).sort();
  h.pruefe(JSON.stringify(vorhanden) === JSON.stringify([...BAUSTEINE].sort()), `genau die 12 Bausteine vorhanden (${vorhanden.join(', ')})`);
  const skill = fs.readFileSync(SKILL, 'utf8');
  for (const name of BAUSTEINE) {
    const datei = path.join(h.ORDNER, `${name}.js`);
    if (!fs.existsSync(datei)) { h.pruefe(false, `${name}.js fehlt`); continue; }
    const text = fs.readFileSync(datei, 'utf8');
    const kopf = text.slice(0, text.search(/^(import|export|const|function)/m));
    h.pruefe(/Wofür:/.test(kopf) && /Schnittstelle:/.test(kopf) && /Beispiel:/.test(kopf), `${name}: Kopfkommentar mit Wofür, Schnittstelle, Beispiel`);
    h.pruefe(!/window\.spiel/.test(text), `${name}: ohne window.spiel`);
    h.pruefe(text.split('\n').length <= 300, `${name}: unter 300 Zeilen (${text.split('\n').length})`);
    let geladen = '';
    try { const modul = await h.lade(`${name}.js`); geladen = Object.keys(modul).join(', '); } catch (e) { geladen = ''; h.pruefe(false, `${name}: ${e.message}`); }
    h.pruefe(geladen.length > 0, `${name}: ohne Browser ladbar (kein DOM-Zugriff beim Laden): ${geladen}`);
    h.pruefe(fs.existsSync(path.join(__dirname, `${name}-test.js`)), `${name}: Test ${name}-test.js vorhanden`);
    h.pruefe(skill.includes(`bausteine/${name}.js`), `${name}: SKILL.md verweist auf bausteine/${name}.js`);
  }
  h.ergebnis();
})();
