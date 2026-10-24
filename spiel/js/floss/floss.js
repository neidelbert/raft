// Würfel als Floß: fährt in Joystick-Richtung, wippt auf den Wellen, dreht sich zur Fahrtrichtung.
// Wird in Paket 02 durch das Raster-Floß ersetzt.
import * as THREE from 'three';
import { FLOSS } from '../config/floss.js';
import { wellenHoehe } from '../welt/wasser.js';

export function erstelleFloss(szene, eingabe) {
  const gruppe = new THREE.Group();
  const geometrie = new THREE.BoxGeometry(FLOSS.groesse, FLOSS.hoehe, FLOSS.groesse);
  const material = new THREE.MeshLambertMaterial({ color: FLOSS.farbe });
  gruppe.add(new THREE.Mesh(geometrie, material));
  szene.add(gruppe);

  // Position auf der Wasseroberfläche ohne Wellen (y bleibt 0); Ziel für Kamera und Wasser.
  const position = new THREE.Vector3();
  let richtung = 0;

  function aktualisiere(dt, zeit) {
    if (eingabe.x !== 0 || eingabe.y !== 0) {
      // Oben auf dem Bildschirm = vom Betrachter weg = −z in der Welt.
      position.x += eingabe.x * FLOSS.tempo * dt;
      position.z -= eingabe.y * FLOSS.tempo * dt;
      const ziel = Math.atan2(-eingabe.x, eingabe.y);
      const unterschied = Math.atan2(Math.sin(ziel - richtung), Math.cos(ziel - richtung));
      richtung += unterschied * Math.min(1, FLOSS.drehTempo * dt);
    }
    gruppe.position.set(position.x, wellenHoehe(position.x, position.z, zeit), position.z);
    gruppe.rotation.set(
      Math.sin(zeit * FLOSS.schaukelTaktX) * FLOSS.schaukelStaerke,
      richtung,
      Math.cos(zeit * FLOSS.schaukelTaktZ) * FLOSS.schaukelStaerke,
    );
  }

  function entferne() {
    szene.remove(gruppe);
    geometrie.dispose();
    material.dispose();
  }

  return { gruppe, position, aktualisiere, entferne };
}
