// Weiches Nachziehen der Kamera (reine Rechnung ohne Three.js; position ist ein THREE.Vector3 oder { x, y, z }).
// Unabhängig von der Bildrate: Der Anteil hängt über exp von dt ab, nicht von der Zahl der Bilder.
export function folgeKamera(position, zielX, zielY, zielZ, folgeTempo, dt) {
  const anteil = 1 - Math.exp(-folgeTempo * dt);
  position.x += (zielX - position.x) * anteil;
  position.y += (zielY - position.y) * anteil;
  position.z += (zielZ - position.z) * anteil;
}
