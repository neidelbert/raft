// Low-Poly-Modelle aus Grundformen. verschmelze(teile) macht aus [{ form, farbe }] eine einzige Geometrie
// mit Eckfarben (vertexColors): ein Modell = ein Zeichenaufruf, egal aus wie vielen Teilen es besteht.
// Die einzelnen Formen werden danach freigegeben (dispose).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const farbWert = new THREE.Color();   // einmal anlegen, nur beim Bauen benutzt

export function verschmelze(teile) {
  const formen = teile.map(({ form, farbe: hex }) => {
    // mergeGeometries braucht überall dieselbe Art (alle ohne Index) und dieselben Attribute.
    const ohneIndex = form.index ? form.toNonIndexed() : form;
    if (ohneIndex !== form) form.dispose();
    ohneIndex.deleteAttribute('uv');
    farbWert.set(hex);
    const anzahl = ohneIndex.attributes.position.count;
    const werte = new Float32Array(anzahl * 3);
    for (let i = 0; i < anzahl; i++) { werte[i * 3] = farbWert.r; werte[i * 3 + 1] = farbWert.g; werte[i * 3 + 2] = farbWert.b; }
    ohneIndex.setAttribute('color', new THREE.BufferAttribute(werte, 3));
    return ohneIndex;
  });
  const ganz = mergeGeometries(formen);
  for (const f of formen) f.dispose();
  return ganz;
}
