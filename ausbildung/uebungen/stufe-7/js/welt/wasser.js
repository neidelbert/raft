// Wasserfläche mit Wellen. erstelleWasser(einstellung, wellen, farbe) → { mesh, aktualisiere(mitteX, mitteZ, zeit) }.
// Die Fläche wandert mit dem Boot mit (in Schritten der Gitterweite, damit die Punkte immer auf denselben
// Weltstellen liegen und nichts flimmert). Die Höhe kommt aus welleHoehe an der Weltstelle, also schwimmen
// Boot und Bojen auf genau diesen Wellen. flatShading: keine Normalen-Neuberechnung pro Bild (Lernbuch).
import * as THREE from 'three';
import { welleHoehe, hoechsteWelle } from './wellen.js';

export function erstelleWasser({ groesse, segmente }, wellen, farbe) {
  const form = new THREE.PlaneGeometry(groesse, groesse, segmente, segmente);
  form.rotateX(-Math.PI / 2);
  form.deleteAttribute('uv');
  const lage = form.attributes.position;
  lage.setUsage(THREE.DynamicDrawUsage);
  const anzahl = lage.count;
  const grundX = new Float32Array(anzahl), grundZ = new Float32Array(anzahl);
  for (let i = 0; i < anzahl; i++) { grundX[i] = lage.getX(i); grundZ[i] = lage.getZ(i); }
  // Hülle einmal groß genug für die höchste Welle, dann muss sie nie neu berechnet werden.
  form.boundingSphere = new THREE.Sphere(new THREE.Vector3(), (groesse * Math.SQRT2) / 2 + hoechsteWelle(wellen));

  const mesh = new THREE.Mesh(form, new THREE.MeshLambertMaterial({ color: farbe, flatShading: true }));
  const schritt = groesse / segmente;
  const werte = lage.array;

  function aktualisiere(mitteX, mitteZ, zeit) {
    const sx = Math.round(mitteX / schritt) * schritt, sz = Math.round(mitteZ / schritt) * schritt;
    mesh.position.set(sx, 0, sz);
    for (let i = 0; i < anzahl; i++) werte[i * 3 + 1] = welleHoehe(wellen, grundX[i] + sx, grundZ[i] + sz, zeit);
    lage.needsUpdate = true;
  }

  return { mesh, aktualisiere };
}
