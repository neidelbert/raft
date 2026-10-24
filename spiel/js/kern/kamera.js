// Vogelperspektive: Kamera schwebt über und hinter dem Ziel und zieht weich nach.
import * as THREE from 'three';
import { KAMERA } from '../config/kamera.js';

export function erstelleKameraFuehrung(kamera, ziel) {
  const versatz = new THREE.Vector3(0, KAMERA.hoehe, KAMERA.abstand);
  const sollPosition = new THREE.Vector3();

  kamera.position.copy(ziel).add(versatz);
  kamera.lookAt(ziel);

  function aktualisiere(dt) {
    sollPosition.copy(ziel).add(versatz);
    // Bildraten-unabhängiges Nachziehen.
    kamera.position.lerp(sollPosition, 1 - Math.exp(-KAMERA.nachziehen * dt));
    kamera.lookAt(kamera.position.x, ziel.y, kamera.position.z - KAMERA.abstand);
  }

  return { aktualisiere };
}
