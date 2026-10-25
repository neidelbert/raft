// Quelle für assets/modelle/spieler.glb: kleine Low-Poly-Figur (etwa 1,6 m hoch, Blick nach −z).
// Erzeugen (im Spielordner): node <skill>/werkzeuge/modell.js . spieler && node <skill>/werkzeuge/manifest.js .
// Solange es keine spieler.glb gibt, zeigt das Spiel die Ersatz-Box aus js/config/welt.js.
// Ohne eigene Importe: Das Werkzeug übergibt THREE. Maße in Metern, Farben kräftig, flache Schattierung.
const FARBEN = { koerper: 0xf2a541, kopf: 0xf6d2a8, augen: 0x2b1d2e };

export default function baueSpieler(THREE) {
  const figur = new THREE.Group();
  figur.name = 'spieler';
  const stoff = (farbe) => new THREE.MeshStandardMaterial({ color: farbe, roughness: 0.8, flatShading: true });
  const teil = (form, farbe, x, y, z) => {
    const mesh = new THREE.Mesh(form, stoff(farbe));
    mesh.position.set(x, y, z);
    figur.add(mesh);
    return mesh;
  };
  teil(new THREE.CylinderGeometry(0.3, 0.38, 1.0, 8), FARBEN.koerper, 0, 0.5, 0);
  teil(new THREE.IcosahedronGeometry(0.32, 1), FARBEN.kopf, 0, 1.3, 0);
  teil(new THREE.BoxGeometry(0.08, 0.1, 0.05), FARBEN.augen, -0.12, 1.36, -0.29);
  teil(new THREE.BoxGeometry(0.08, 0.1, 0.05), FARBEN.augen, 0.12, 1.36, -0.29);
  return figur;
}
