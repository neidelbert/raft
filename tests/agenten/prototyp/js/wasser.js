import * as THREE from 'three';
import { KONFIGURATION } from './konfiguration.js';

const WASSER = KONFIGURATION.wasser;

// Wellenhöhe an einer Weltposition; auch das Floß nutzt sie.
export function wellenHoehe(x, z, zeit) {
  const k = (Math.PI * 2) / WASSER.wellenLaenge;
  const t = zeit * WASSER.wellenTempo;
  return WASSER.wellenHoehe * 0.5 * (Math.sin(x * k + t) + Math.sin(z * k * 0.8 + t * 1.3));
}

// Einfache Wasserfläche, die mit dem Floß mitwandert (endloser Ozean).
export function erstelleWasser(szene) {
  const geometrie = new THREE.PlaneGeometry(WASSER.groesse, WASSER.groesse, WASSER.segmente, WASSER.segmente);
  geometrie.rotateX(-Math.PI / 2);
  const material = new THREE.MeshLambertMaterial({ color: WASSER.farbe, flatShading: true });
  const netz = new THREE.Mesh(geometrie, material);
  szene.add(netz);

  const positionen = geometrie.attributes.position;
  const rasterAbstand = WASSER.groesse / WASSER.segmente;

  function aktualisiere(zeit, mitteX, mitteZ) {
    // Auf Rasterabstand einrasten, damit die Wellen beim Mitwandern nicht springen.
    netz.position.x = Math.round(mitteX / rasterAbstand) * rasterAbstand;
    netz.position.z = Math.round(mitteZ / rasterAbstand) * rasterAbstand;
    for (let i = 0; i < positionen.count; i++) {
      const x = positionen.getX(i) + netz.position.x;
      const z = positionen.getZ(i) + netz.position.z;
      positionen.setY(i, wellenHoehe(x, z, zeit));
    }
    positionen.needsUpdate = true;
    geometrie.computeVertexNormals();
  }

  function entferne() {
    szene.remove(netz);
    geometrie.dispose();
    material.dispose();
  }

  return { netz, aktualisiere, entferne };
}
