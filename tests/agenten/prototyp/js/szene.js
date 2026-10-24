import * as THREE from 'three';
import { KONFIGURATION } from './konfiguration.js';

// Renderer, Szene, Licht und Größenanpassung.
export function erstelleSzene() {
  const einstellung = KONFIGURATION.grafik;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, einstellung.maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.prepend(renderer.domElement);

  const szene = new THREE.Scene();
  szene.background = new THREE.Color(einstellung.himmelFarbe);
  szene.fog = new THREE.Fog(einstellung.himmelFarbe, einstellung.nebelNah, einstellung.nebelFern);

  const licht = KONFIGURATION.licht;
  szene.add(new THREE.HemisphereLight(0xffffff, 0x225577, licht.umgebungStaerke));
  const sonne = new THREE.DirectionalLight(0xffffff, licht.sonneStaerke);
  sonne.position.set(...licht.sonnePosition);
  szene.add(sonne);

  const kamera = new THREE.PerspectiveCamera(KONFIGURATION.kamera.sichtfeld,
    window.innerWidth / window.innerHeight, 0.1, 200);

  window.addEventListener('resize', () => {
    kamera.aspect = window.innerWidth / window.innerHeight;
    kamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, szene, kamera };
}
