// Renderer, Szene, Licht und Größenänderung.
import * as THREE from 'three';
import { LEISTUNG } from '../config/leistung.js';
import { WELT } from '../config/welt.js';
import { KAMERA } from '../config/kamera.js';

export function erstelleBildschirm() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, LEISTUNG.pixelRatioMax));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = LEISTUNG.schatten;
  document.body.prepend(renderer.domElement);

  const szene = new THREE.Scene();
  szene.background = new THREE.Color(WELT.himmelFarbe);
  szene.fog = new THREE.Fog(WELT.himmelFarbe, WELT.nebelNah, WELT.nebelFern);

  const licht = WELT.licht;
  szene.add(new THREE.HemisphereLight(licht.himmelFarbe, licht.bodenFarbe, licht.umgebungStaerke));
  const sonne = new THREE.DirectionalLight(licht.sonneFarbe, licht.sonneStaerke);
  sonne.position.set(...licht.sonnePosition);
  szene.add(sonne);

  const kamera = new THREE.PerspectiveCamera(KAMERA.sichtfeld,
    window.innerWidth / window.innerHeight, KAMERA.nah, KAMERA.fern);

  window.addEventListener('resize', () => {
    kamera.aspect = window.innerWidth / window.innerHeight;
    kamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, szene, kamera };
}
