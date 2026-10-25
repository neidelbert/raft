// Quelle für assets/modelle/boot.glb: kleines Low-Poly-Segelboot (etwa 3 m lang, Bug zeigt nach −z).
// Erzeugen: node .claude/skills/game-programmierung/werkzeuge/modell.js ausbildung/uebungen/stufe-9 boot
// Ohne eigene Importe: Das Werkzeug übergibt THREE. Maße in Metern, Farben kräftig, flache Schattierung.
const FARBEN = { rumpf: 0xd8452e, deck: 0xc8915a, mast: 0x6b4a2b, segel: 0xf4efe2, flagge: 0xf2c230 };

export default function baueBoot(THREE) {
  const boot = new THREE.Group();
  boot.name = 'boot';
  const stoff = (farbe) => new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.8, flatShading: true });
  const teil = (name, form, farbe, x, y, z) => {
    const mesh = new THREE.Mesh(form, stoff(farbe));
    mesh.name = name;
    mesh.position.set(x, y, z);
    boot.add(mesh);
    return mesh;
  };

  // Rumpf: Kasten, dessen vordere Ecken zur Spitze zusammenlaufen (Bug).
  const rumpf = new THREE.BoxGeometry(1.2, 0.5, 3, 1, 1, 2);
  const lage = rumpf.attributes.position;
  for (let i = 0; i < lage.count; i++) {
    if (lage.getZ(i) < -1.4) lage.setX(i, 0);                     // Bug spitz
    if (lage.getY(i) < 0) lage.setX(i, lage.getX(i) * 0.7);      // Kiel schmaler als das Deck
  }
  rumpf.computeVertexNormals();
  teil('rumpf', rumpf, FARBEN.rumpf, 0, 0.25, 0);
  teil('deck', new THREE.BoxGeometry(1.0, 0.06, 1.6), FARBEN.deck, 0, 0.52, 0.5);
  teil('mast', new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), FARBEN.mast, 0, 1.7, 0);

  // Segel: Dreieck hinter dem Mast, von beiden Seiten sichtbar.
  const segel = new THREE.BufferGeometry();
  segel.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.7, 0.05, 0, 2.8, 0.05, 0, 0.7, 1.3], 3));
  segel.computeVertexNormals();
  const segelTeil = teil('segel', segel, FARBEN.segel, 0, 0, 0);
  segelTeil.material.side = THREE.DoubleSide;
  teil('flagge', new THREE.BoxGeometry(0.02, 0.18, 0.32), FARBEN.flagge, 0, 2.82, -0.16);
  return boot;
}
