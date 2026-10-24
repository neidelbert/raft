// Start und Hauptschleife. Gerüst: zeigt nur einen leeren Bildschirm.
// Spielinhalte kommen mit den Paketen (ab Paket 01) in die Bereichsordner.
import * as THREE from 'three';
import { LEISTUNG } from './config/leistung.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, LEISTUNG.pixelRatioMax));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = LEISTUNG.schatten;
renderer.setClearColor(0x6fc3e8);
document.body.appendChild(renderer.domElement);

const szene = new THREE.Scene();
const kamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

window.addEventListener('resize', () => {
  kamera.aspect = window.innerWidth / window.innerHeight;
  kamera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Kleine Schnittstelle für Tests (liest nur).
window.spiel = { bereit: true, renderer, szene, kamera };

// Delta-Zeit (begrenzt auf LEISTUNG.deltaMax) kommt mit dem ersten bewegten Inhalt dazu.
renderer.setAnimationLoop(() => {
  renderer.render(szene, kamera);
});
