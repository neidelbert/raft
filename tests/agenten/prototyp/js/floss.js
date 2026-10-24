import * as THREE from 'three';
import { KONFIGURATION } from './konfiguration.js';
import { wellenHoehe } from './wasser.js';

const FLOSS = KONFIGURATION.floss;

// Würfel als Floß: fährt in Joystick-Richtung, schaukelt auf den Wellen.
export function erstelleFloss(szene) {
  const geometrie = new THREE.BoxGeometry(FLOSS.groesse, FLOSS.hoehe, FLOSS.groesse);
  const material = new THREE.MeshLambertMaterial({ color: FLOSS.farbe });
  const netz = new THREE.Mesh(geometrie, material);
  szene.add(netz);

  const position = new THREE.Vector3(0, 0, 0);
  let richtung = 0;

  // eingabe.x: rechts positiv, eingabe.y: oben positiv (Bildschirm).
  function aktualisiere(delta, zeit, eingabe) {
    const staerke = Math.hypot(eingabe.x, eingabe.y);
    if (staerke > 0) {
      // Oben auf dem Bildschirm = vom Betrachter weg = -z in der Welt.
      position.x += eingabe.x * FLOSS.tempo * delta;
      position.z -= eingabe.y * FLOSS.tempo * delta;
      const ziel = Math.atan2(-eingabe.x, eingabe.y);
      let unterschied = ziel - richtung;
      unterschied = Math.atan2(Math.sin(unterschied), Math.cos(unterschied));
      richtung += unterschied * Math.min(1, FLOSS.drehTempo * delta);
    }
    netz.position.set(position.x, wellenHoehe(position.x, position.z, zeit), position.z);
    netz.rotation.set(
      Math.sin(zeit * 1.7) * FLOSS.schaukelStaerke,
      richtung,
      Math.cos(zeit * 1.3) * FLOSS.schaukelStaerke,
    );
  }

  function entferne() {
    szene.remove(netz);
    geometrie.dispose();
    material.dispose();
  }

  return { netz, position, aktualisiere, entferne };
}
