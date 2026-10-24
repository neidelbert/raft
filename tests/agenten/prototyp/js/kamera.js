import * as THREE from 'three';
import { KONFIGURATION } from './konfiguration.js';

const EINSTELLUNG = KONFIGURATION.kamera;

// Vogelperspektive: Kamera schwebt über und hinter dem Ziel und zieht weich nach.
export function erstelleKameraFuehrung(kamera, ziel) {
  const versatz = new THREE.Vector3(0, EINSTELLUNG.hoehe, EINSTELLUNG.abstand);
  const sollPosition = new THREE.Vector3();

  kamera.position.copy(ziel).add(versatz);
  kamera.lookAt(ziel);

  function aktualisiere(delta) {
    sollPosition.copy(ziel).add(versatz);
    // Bildraten-unabhängiges Nachziehen.
    kamera.position.lerp(sollPosition, 1 - Math.exp(-EINSTELLUNG.nachziehen * delta));
    kamera.lookAt(kamera.position.x, ziel.y, kamera.position.z - EINSTELLUNG.abstand);
  }

  return { aktualisiere };
}
