// Boot-Modell (Low-Poly per Code). erstelleBoot(einstellung, modell, schattenFarbe) → { gruppe, setzeLage(…) }.
// Ein Modell aus fünf Teilen, zu einer Geometrie verschmolzen (1 Zeichenaufruf), dazu eine dunkle Kreisfläche
// als Schatten (1 Zeichenaufruf). Die Fahrregeln stehen in fahrt.js, hier nur das Aussehen.
import * as THREE from 'three';
import { verschmelze } from '../kern/formen.js';

function rumpfForm(m, massstab, hoehe) {
  const umriss = new THREE.Shape();
  // Shape liegt in x/y; nach rotateX(−90°) wird y zu −z. Darum z hier umdrehen.
  m.umriss.forEach(([x, z], i) => (i === 0 ? umriss.moveTo(x * massstab, -z * massstab) : umriss.lineTo(x * massstab, -z * massstab)));
  const form = new THREE.ExtrudeGeometry(umriss, { depth: hoehe, bevelEnabled: false });
  form.rotateX(-Math.PI / 2);
  return form;
}

function bauModell(farben, m) {
  const rumpf = rumpfForm(m, 1, m.rumpfHoehe);
  rumpf.translate(0, m.rumpfUnten, 0);
  const deck = rumpfForm(m, m.deckEinzug, m.deckDicke);
  deck.translate(0, m.rumpfUnten + m.rumpfHoehe, 0);
  const deckOben = m.rumpfUnten + m.rumpfHoehe + m.deckDicke;
  const kabine = new THREE.BoxGeometry(m.kabine.breite, m.kabine.hoehe, m.kabine.tiefe);
  kabine.translate(0, deckOben + m.kabine.hoehe / 2, m.kabine.z);
  const mast = new THREE.CylinderGeometry(m.mast.radius, m.mast.radius, m.mast.hoehe, m.mast.ecken);
  mast.translate(0, deckOben + m.mast.hoehe / 2, m.mast.z);
  const segel = new THREE.BoxGeometry(m.segel.breite, m.segel.hoehe, m.segel.tiefe);
  segel.translate(0, deckOben + m.mast.hoehe - m.segel.hoehe / 2, m.mast.z + m.segel.tiefe / 2 + m.mast.radius);
  return verschmelze([
    { form: rumpf, farbe: farben.rumpf }, { form: deck, farbe: farben.deck }, { form: kabine, farbe: farben.kabine },
    { form: mast, farbe: farben.mast }, { form: segel, farbe: farben.segel },
  ]);
}

export function erstelleBoot(einstellung, modell, schattenFarbe) {
  const gruppe = new THREE.Group();
  const koerper = new THREE.Mesh(bauModell(einstellung.farben, modell), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  const schattenForm = new THREE.CircleGeometry(einstellung.schattenRadius, modell.schattenEcken);
  schattenForm.rotateX(-Math.PI / 2);
  const schatten = new THREE.Mesh(schattenForm, new THREE.MeshBasicMaterial({
    color: schattenFarbe, transparent: true, opacity: einstellung.schattenDeckkraft, depthWrite: false,
  }));
  schatten.position.y = modell.schattenAbstand;
  gruppe.add(schatten, koerper);

  // Lage pro Bild: auf der Welle an (x, z), Bug in Fahrtrichtung, leichtes Schaukeln.
  function setzeLage(x, wasserHoehe, z, richtung, schaukelWinkel) {
    gruppe.position.set(x, wasserHoehe - einstellung.tiefgang, z);
    gruppe.rotation.y = richtung;
    koerper.rotation.z = schaukelWinkel;
  }

  return { gruppe, setzeLage };
}
