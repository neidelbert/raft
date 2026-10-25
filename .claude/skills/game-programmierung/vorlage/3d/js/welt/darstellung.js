// Darstellung in 3D (Three.js 0.170.0): Renderer, Szene, Boden mit Kachel-Bild, Spieler-Modell oder Ersatz-Box,
// Kamera schräg von oben, die weich nachzieht.
// Schnittstelle (gleich wie in der 2D-Fassung, main.js kennt nur diese):
//   erstelleDarstellung(dokument, welt) → darstellung = {
//     art: '3d', pixelRatio, zeichenaufrufe (Zeichenaufrufe des letzten Bildes), modell ('glb' | 'ersatz' | ''),
//     ladeOptionen: Zusatz für ladeAssets (hier: ladeModell mit GLTFLoader), nimmAssets(assets), setzeStart(welt),
//     aktualisiere(dt, welt) (Kamera, jedes nicht pausierte Bild), zeichne(welt) (jedes Bild) }
//   Setzt welt.feld einmal (fester Boden). Keine neuen Objekte pro Bild (Vektoren einmal oben angelegt).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SPIEL } from '../config/spiel.js';
import { SPIELER, FELD, BODEN, KAMERA, LICHT, DREI } from '../config/welt.js';
import { setzeSpieler } from '../regeln/spieler.js';

export function erstelleDarstellung(dokument, welt) {
  const leinwand = dokument.getElementById('leinwand');
  const renderer = new THREE.WebGLRenderer({ canvas: leinwand, antialias: DREI.antialias });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, SPIEL.pixelRatioMax));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  leinwand.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    dokument.getElementById('hinweis-neu-laden').hidden = false;
  });

  const szene = new THREE.Scene();
  szene.background = new THREE.Color(DREI.hintergrund);
  szene.fog = new THREE.Fog(DREI.hintergrund, DREI.nebelNah, DREI.nebelFern);
  szene.add(new THREE.HemisphereLight(LICHT.himmel, LICHT.bodenLicht, LICHT.staerke));
  const sonne = new THREE.DirectionalLight(0xffffff, LICHT.sonne);
  sonne.position.set(...LICHT.sonneRichtung);
  szene.add(sonne);

  const bodenStoff = new THREE.MeshLambertMaterial({ color: BODEN.farbe });
  const boden = new THREE.Mesh(new THREE.PlaneGeometry(FELD.breite, FELD.tiefe), bodenStoff);
  boden.rotation.x = -Math.PI / 2;
  szene.add(boden);

  const halter = new THREE.Group();   // bewegt sich; Modell oder Box darin behalten ihre Lage
  const [b, h, t] = SPIELER.ersatzGroesse;
  const box = new THREE.Mesh(new THREE.BoxGeometry(b, h, t), new THREE.MeshLambertMaterial({ color: SPIELER.ersatzFarbe, flatShading: true }));
  box.position.y = h / 2;
  halter.add(box);
  const schatten = new THREE.Mesh(new THREE.CircleGeometry(SPIELER.schattenRadius, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: SPIELER.schattenDeckkraft, depthWrite: false }));
  schatten.rotation.x = -Math.PI / 2;
  schatten.position.y = 0.02;   // knapp über dem Boden, sonst flimmert er
  halter.add(schatten);
  szene.add(halter);

  const kamera = new THREE.PerspectiveCamera(KAMERA.sicht, 1, KAMERA.nah, KAMERA.fern);
  const f = welt.feld;
  f.minX = -FELD.breite / 2 + FELD.rand; f.maxX = FELD.breite / 2 - FELD.rand;
  f.minY = -FELD.tiefe / 2 + FELD.rand; f.maxY = FELD.tiefe / 2 - FELD.rand;

  function passeAn() {
    const breite = leinwand.clientWidth || window.innerWidth, hoehe = leinwand.clientHeight || window.innerHeight;
    renderer.setSize(breite, hoehe, false);   // false: CSS-Größe bleibt 100vw × 100dvh (Safari-Leiste)
    kamera.aspect = breite / hoehe;
    kamera.updateProjectionMatrix();
  }
  passeAn();
  window.addEventListener('resize', passeAn);

  function setzeKamera(w, anteil) {
    const p = kamera.position;
    p.x += (w.spieler.x - p.x) * anteil;
    p.y += (KAMERA.hoehe - p.y) * anteil;
    p.z += (w.spieler.y + KAMERA.abstand - p.z) * anteil;
    kamera.lookAt(p.x, 0, p.z - KAMERA.abstand);   // fester Blickwinkel, kein Zittern
  }
  setzeKamera(welt, 1);   // schon während des Ladens richtig ausgerichtet

  const lader = new GLTFLoader();
  const darstellung = {
    art: '3d',
    pixelRatio: renderer.getPixelRatio(),
    zeichenaufrufe: 0,
    modell: '',
    ladeOptionen: { ladeModell: (adresse) => lader.loadAsync(adresse) },
    nimmAssets(assets) {
      const bild = assets.bilder[BODEN.bild];   // Image oder 8 × 8-Ersatz in der Ersatzfarbe; ohne Manifest gar nichts
      if (bild) {
        const textur = new THREE.Texture(bild);
        textur.colorSpace = THREE.SRGBColorSpace;
        textur.wrapS = textur.wrapT = THREE.RepeatWrapping;
        textur.repeat.set(FELD.breite / BODEN.kachelMeter, FELD.tiefe / BODEN.kachelMeter);
        textur.needsUpdate = true;
        bodenStoff.map = textur;
        bodenStoff.color.set(0xffffff);
        bodenStoff.needsUpdate = true;
      }
      const modell = assets.modelle[SPIELER.modell]?.scene;
      if (modell) { halter.add(modell); box.visible = false; }
      darstellung.modell = modell ? 'glb' : 'ersatz';
    },
    setzeStart(w) {
      setzeSpieler(w.spieler, 0, 0);
      halter.position.set(0, 0, 0);
      setzeKamera(w, 1);   // gleich ans Ziel, kein Anflug
    },
    aktualisiere(dt, w) { setzeKamera(w, 1 - Math.exp(-KAMERA.nachziehen * dt)); },
    zeichne(w) {
      halter.position.set(w.spieler.x, 0, w.spieler.y);
      renderer.render(szene, kamera);
      darstellung.zeichenaufrufe = renderer.info.render.calls;
    },
  };
  return darstellung;
}
