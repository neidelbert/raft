// Modell-Seite: lädt boot.glb über das Manifest (bausteine/assets.js mit GLTFLoader) und zeigt es drehend.
// Fehlt das Modell oder lädt es nicht in der Zeitgrenze, steht eine Box in derselben Größe da (kein Absturz).
// window.modell = { bereit, ersatz, dreiecke } nur zum Lesen für Tests.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SPIEL, LADEN } from './config/spiel.js';
import { MODELL } from './config/modell.js';
import { ladeAssets } from './kern/assets.js';
import { erstelleSchleife } from './kern/schleife.js';

const modell = { bereit: false, ersatz: false, dreiecke: 0 };
window.modell = modell;

const renderer = new THREE.WebGLRenderer({ antialias: MODELL.antialias });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, SPIEL.pixelRatioMax));
document.body.appendChild(renderer.domElement);
const szene = new THREE.Scene();
szene.background = new THREE.Color(MODELL.himmel);
const k = MODELL.kamera, l = MODELL.licht;
const kamera = new THREE.PerspectiveCamera(k.sicht, 1, 0.1, 100);
kamera.position.set(k.x, k.y, k.z);
kamera.lookAt(0, k.blickY, 0);
szene.add(new THREE.HemisphereLight(l.himmel, l.boden, l.staerke));
const sonne = new THREE.DirectionalLight(0xffffff, l.sonne);
sonne.position.set(l.sonneX, l.sonneY, l.sonneZ);
szene.add(sonne);

function passeAn() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  kamera.aspect = window.innerWidth / window.innerHeight;
  kamera.updateProjectionMatrix();
}
passeAn();
window.addEventListener('resize', passeAn);
renderer.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault());

function zaehleDreiecke(objekt) {
  let n = 0;
  objekt.traverse((o) => { if (o.isMesh) n += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; });
  return n;
}

const lader = new GLTFLoader();
const assets = await ladeAssets(LADEN.manifest, { zeitgrenze: LADEN.zeitgrenze, arten: ['modelle'], ladeModell: (adresse) => lader.loadAsync(adresse) });
let boot = assets.modelle[MODELL.name]?.scene;
if (!boot) {
  const [b, h, t] = MODELL.ersatzGroesse;
  boot = new THREE.Mesh(new THREE.BoxGeometry(b, h, t), new THREE.MeshLambertMaterial({ color: MODELL.ersatzFarbe }));
  boot.position.y = h / 2;
  modell.ersatz = true;
}
const halter = new THREE.Group();   // dreht sich; das Modell behält seine eigene Lage
halter.add(boot);
szene.add(halter);
modell.dreiecke = zaehleDreiecke(halter);

const schleife = erstelleSchleife({
  aktualisiere(dt) { halter.rotation.y += MODELL.drehTempo * dt; },
  zeichne() { renderer.render(szene, kamera); },
  deltaMax: SPIEL.deltaMax,
});
schleife.starte();
requestAnimationFrame(() => { modell.bereit = true; });
