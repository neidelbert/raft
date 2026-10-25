// Bojen-Modell: eine Geometrie für alle 30 Bojen, gezeichnet als InstancedMesh (1 Zeichenaufruf).
// erstelleBojenModell(einstellung, modell, anzahl) → InstancedMesh.
// zeigeBojen(mesh, bojen, …) setzt pro Bild Höhe (Welle + Hüpfer) und leichtes Neigen jeder Boje.
// Regeln (Platz, Berührung, Hüpfen) stehen in bojen-regeln.js.
import * as THREE from 'three';
import { verschmelze } from '../kern/formen.js';
import { welleHoehe } from './wellen.js';
import { huepfHoehe } from './bojen-regeln.js';

const helfer = new THREE.Object3D();   // einmal anlegen, in der Schleife nur wiederverwenden

export function erstelleBojenModell({ farben }, m, anzahl) {
  const koerper = new THREE.CylinderGeometry(m.koerper.radiusOben, m.koerper.radiusUnten, m.koerper.hoehe, m.koerper.ecken);
  koerper.translate(0, m.koerper.hoehe / 2, 0);
  const streifen = new THREE.CylinderGeometry(m.streifen.radius, m.streifen.radius, m.streifen.hoehe, m.koerper.ecken);
  streifen.translate(0, m.koerper.hoehe - m.streifen.y, 0);
  const spitze = new THREE.ConeGeometry(m.spitze.radius, m.spitze.hoehe, m.spitze.ecken);
  spitze.translate(0, m.koerper.hoehe + m.spitze.hoehe / 2, 0);
  const form = verschmelze([
    { form: koerper, farbe: farben.koerper }, { form: streifen, farbe: farben.streifen }, { form: spitze, farbe: farben.spitze },
  ]);
  const mesh = new THREE.InstancedMesh(form, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }), anzahl);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;   // die Hülle der Instanzen würde nach dem Hüpfen nicht neu berechnet; 1 Aufruf kostet wenig
  return mesh;
}

export function zeigeBojen(mesh, bojen, wellen, zeit, einstellung, modell) {
  for (let i = 0; i < bojen.anzahl; i++) {
    const x = bojen.x[i], z = bojen.z[i];
    const wasser = welleHoehe(wellen, x, z, zeit);
    helfer.position.set(x, wasser - modell.tiefgang + huepfHoehe(bojen, i, einstellung.huepfDauer, einstellung.huepfHoehe), z);
    // Neigung wie die Wasseroberfläche (Gefälle über einen Meter): die Spitze kippt vom Wellenberg weg.
    const gefaelleX = welleHoehe(wellen, x + 1, z, zeit) - wasser;
    const gefaelleZ = welleHoehe(wellen, x, z + 1, zeit) - wasser;
    helfer.rotation.set(-gefaelleZ, 0, gefaelleX);
    helfer.updateMatrix();
    mesh.setMatrixAt(i, helfer.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
