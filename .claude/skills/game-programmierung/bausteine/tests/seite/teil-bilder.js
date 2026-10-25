// Probe für bilder.js: ?liste=<datei> wählt die Bilderliste; fehlt die Figur, wird ein Ersatz gezeichnet.
import { erstelleBildschirm } from '../../bildschirm.js';
import { ladeBilder, holeBild, ersatzBild, faerbeEin, bildMasse } from '../../bilder.js';

const liste = new URLSearchParams(location.search).get('liste') || 'grafik/grafik.json';
const bildschirm = erstelleBildschirm(document.getElementById('leinwand'));
const bilder = await ladeBilder(liste);
const geladen = holeBild(bilder, 'figuren/figur');
const figur = geladen || ersatzBild(60, 72, (ctx, b, h) => {
  ctx.fillStyle = '#e05a3a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(b / 2, h / 2, b / 2 - 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
});
const rot = faerbeEin(figur, '#ff0000');
const { ctx, breite, hoehe } = bildschirm;
ctx.fillStyle = '#203040'; ctx.fillRect(0, 0, breite, hoehe);
ctx.drawImage(figur, breite / 2 - 90, hoehe / 2 - 72, 60, 72);
ctx.drawImage(rot, breite / 2 + 30, hoehe / 2 - 72, 60, 72);

// Farbe eines Pixels der Kopie (Mitte und Ecke oben links), zum Prüfen von faerbeEin. Gelesen auf einer eigenen
// Leinwand mit willReadFrequently, sonst warnt Chrome beim zweiten getImageData.
const masse = bildMasse(rot);
const lese = document.createElement('canvas');
lese.width = masse.breite; lese.height = masse.hoehe;
const leseCtx = lese.getContext('2d', { willReadFrequently: true });
leseCtx.drawImage(rot, 0, 0);
function pixel(_, x, y) { return Array.from(leseCtx.getImageData(x, y, 1, 1).data); }
window.probe = {
  bereit: true,
  geladen: Object.keys(bilder),
  ersatz: !geladen,
  masse: bildMasse(figur),
  rotMitte: pixel(rot, masse.breite >> 1, masse.hoehe >> 1),
  rotEcke: pixel(rot, 0, 0),
};
