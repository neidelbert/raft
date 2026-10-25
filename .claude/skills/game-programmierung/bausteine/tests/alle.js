// Alle Baustein-Tests nacheinander: node <skill>/bausteine/tests/alle.js
// Jeder Test läuft als eigener Prozess; die Ausgabe wird ganz gelesen (nie mit head abschneiden, Lernbuch Stufe 5).
// Ausführlich: ALLES=1 zeigt jede Prüfung. BAUSTEINE=<ordner> testet eine Kopie (siehe gegenprobe.js).
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const tests = fs.readdirSync(__dirname).filter((d) => d.endsWith('-test.js')).sort();
let fehler = 0, pruefungen = 0;
for (const test of tests) {
  const lauf = spawnSync(process.execPath, [path.join(__dirname, test)], { encoding: 'utf8', env: process.env, timeout: 240000 });
  const ausgabe = `${lauf.stdout || ''}${lauf.stderr || ''}`;
  const zeilen = ausgabe.split('\n');
  const ok = zeilen.filter((z) => z.startsWith('OK')).length, rot = zeilen.filter((z) => z.startsWith('FEHLER'));
  pruefungen += ok + rot.length;
  const bestanden = lauf.status === 0 && rot.length === 0 && /Alle Prüfungen bestanden\./.test(ausgabe);
  console.log(`${bestanden ? 'OK    ' : 'FEHLER'} ${test} (${ok + rot.length} Prüfungen)`);
  if (process.env.ALLES) console.log(zeilen.filter((z) => /^(OK|FEHLER)/.test(z)).map((z) => `       ${z}`).join('\n'));
  if (!bestanden) {
    fehler++;
    const grund = rot.length ? rot : zeilen.filter((z) => /Error|abgebrochen/.test(z)).slice(0, 5);
    for (const z of grund) console.log(`       ${z}`);
    if (lauf.error) console.log(`       ${lauf.error.message}`);
  }
}
console.log(`\n${tests.length} Tests, ${pruefungen} Prüfungen.`);
console.log(fehler ? `${fehler} Test(s) fehlgeschlagen.` : 'Alle Prüfungen bestanden.');
process.exit(fehler ? 1 : 0);
