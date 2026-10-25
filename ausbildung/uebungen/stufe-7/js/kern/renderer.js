// Renderer, Szene und Kamera. erstelleBuehne(einstellung) → { renderer, szene, kamera }.
// Pixel-Ratio höchstens pixelRatioMax, Größe folgt dem Fenster (Drehen, Safari-Leiste).
// Geht die Grafik verloren (iPhone im Hintergrund, zu wenig Speicher), erscheint ein Hinweis zum Neuladen.
import * as THREE from 'three';

export function erstelleBuehne({ spiel, farben, licht, nebel, kamera: k }, hinweis) {
  const renderer = new THREE.WebGLRenderer({ antialias: spiel.kantenglaettung, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, spiel.pixelRatioMax));
  renderer.shadowMap.enabled = false;   // keine echten Schatten (zu teuer auf dem iPhone)
  document.body.prepend(renderer.domElement);

  const szene = new THREE.Scene();
  szene.background = new THREE.Color(farben.himmel);
  szene.fog = new THREE.Fog(farben.himmel, nebel.nah, nebel.fern);
  szene.add(new THREE.HemisphereLight(farben.himmelLicht, farben.bodenLicht, licht.himmelStaerke));
  const sonne = new THREE.DirectionalLight(farben.sonne, licht.sonnenStaerke);
  sonne.position.set(...licht.sonnenRichtung);
  szene.add(sonne);

  const kamera = new THREE.PerspectiveCamera(k.sichtwinkel, 1, k.nah, k.fern);

  function passeAn() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, spiel.pixelRatioMax));
    renderer.setSize(window.innerWidth, window.innerHeight);
    kamera.aspect = window.innerWidth / window.innerHeight;
    kamera.updateProjectionMatrix();
  }
  passeAn();
  window.addEventListener('resize', passeAn);

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    hinweis.hidden = false;
  });

  return { renderer, szene, kamera };
}
