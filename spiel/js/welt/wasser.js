// Einfache Wasserfläche mit Wellen, wandert mit dem Floß mit (endloser Ozean).
import * as THREE from 'three';
import { WELT } from '../config/welt.js';

const WASSER = WELT.wasser;
const WELLENZAHL = (Math.PI * 2) / WASSER.wellenLaenge; // einmal vorab

// Wellenhöhe an einer Weltposition; auch das Floß nutzt sie.
export function wellenHoehe(x, z, zeit) {
  const t = zeit * WASSER.wellenTempo;
  // Zwei Sinuswellen, halbiert: Ausschlag höchstens ±wellenHoehe.
  return WASSER.wellenHoehe * 0.5 * (Math.sin(x * WELLENZAHL + t)
    + Math.sin(z * WELLENZAHL * WASSER.zweiteWelleLaenge + t * WASSER.zweiteWelleTempo));
}

export function erstelleWasser(szene, mitte) {
  const geometrie = new THREE.PlaneGeometry(WASSER.groesse, WASSER.groesse, WASSER.segmente, WASSER.segmente);
  geometrie.rotateX(-Math.PI / 2);
  // flatShading rechnet die Flächen-Normalen im Shader: kein computeVertexNormals pro Bild nötig.
  const material = new THREE.MeshLambertMaterial({ color: WASSER.farbe, flatShading: true });
  const netz = new THREE.Mesh(geometrie, material);
  netz.frustumCulled = false; // Fläche ist immer im Bild, Grenzen ändern sich mit den Wellen
  szene.add(netz);

  const positionen = geometrie.attributes.position;
  const rasterAbstand = WASSER.groesse / WASSER.segmente;

  function aktualisiere(dt, zeit) {
    // Auf Rasterabstand einrasten, damit die Wellen beim Mitwandern nicht springen.
    netz.position.x = Math.round(mitte.x / rasterAbstand) * rasterAbstand;
    netz.position.z = Math.round(mitte.z / rasterAbstand) * rasterAbstand;
    for (let i = 0; i < positionen.count; i++) {
      const x = positionen.getX(i) + netz.position.x;
      const z = positionen.getZ(i) + netz.position.z;
      positionen.setY(i, wellenHoehe(x, z, zeit));
    }
    positionen.needsUpdate = true;
  }

  function entferne() {
    szene.remove(netz);
    geometrie.dispose();
    material.dispose();
  }

  return { netz, aktualisiere, entferne };
}
