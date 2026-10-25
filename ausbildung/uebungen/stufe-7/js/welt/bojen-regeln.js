// Bojen-Regeln ohne Three.js (auch mit node testbar). Bojen liegen in festen Float64Arrays (keine Objekte pro Boje):
//   x, z = Lage in Metern; huepfZeit = Sekunden seit Beginn des Hüpfers, −1 = liegt ruhig;
//   beruehrt = 1, solange das Boot die Boje berührt (Uint8Array).
// erstelleBojen(einstellung, zufall) → { anzahl, x, z, huepfZeit, beruehrt, huepfer }  (huepfer zählt alle ausgelösten Hüpfer)

export function erstelleBojen({ anzahl, bereich, abstandMin, startFrei, versucheMax }, zufall) {
  const bojen = { anzahl, x: new Float64Array(anzahl), z: new Float64Array(anzahl), huepfZeit: new Float64Array(anzahl).fill(-1),
    beruehrt: new Uint8Array(anzahl), huepfer: 0 };
  for (let i = 0; i < anzahl; i++) {
    for (let versuch = 0; versuch < versucheMax; versuch++) {
      bojen.x[i] = (zufall() * 2 - 1) * bereich;
      bojen.z[i] = (zufall() * 2 - 1) * bereich;
      if (platzFrei(bojen, i, abstandMin, startFrei)) break;
    }
  }
  return bojen;
}

// Frei, wenn weit genug vom Start (0, 0) und von allen schon gesetzten Bojen.
function platzFrei(bojen, i, abstandMin, startFrei) {
  const x = bojen.x[i], z = bojen.z[i];
  if (x * x + z * z < startFrei * startFrei) return false;
  for (let j = 0; j < i; j++) {
    const dx = bojen.x[j] - x, dz = bojen.z[j] - z;
    if (dx * dx + dz * dz < abstandMin * abstandMin) return false;
  }
  return true;
}

// Fährt das Boot (Kreis um bx, bz) neu an eine Boje heran, beginnt sie zu hüpfen. Bleibt das Boot an ihr,
// hüpft sie nicht immer wieder: Erst nach dem Wegfahren zählt die nächste Berührung.
export function pruefeBeruehrung(bojen, bx, bz, bootRadius, bojeRadius) {
  const grenze = bootRadius + bojeRadius;
  for (let i = 0; i < bojen.anzahl; i++) {
    const dx = bojen.x[i] - bx, dz = bojen.z[i] - bz;
    const nah = dx * dx + dz * dz < grenze * grenze;
    if (nah && !bojen.beruehrt[i] && bojen.huepfZeit[i] < 0) { bojen.huepfZeit[i] = 0; bojen.huepfer++; }
    bojen.beruehrt[i] = nah ? 1 : 0;
  }
}

export function aktualisiereHuepfen(bojen, dt, dauer) {
  for (let i = 0; i < bojen.anzahl; i++) {
    if (bojen.huepfZeit[i] < 0) continue;
    bojen.huepfZeit[i] += dt;
    if (bojen.huepfZeit[i] >= dauer) bojen.huepfZeit[i] = -1;
  }
}

// Höhe über dem Wasser im Hüpfer, Bogen 0 → huepfHoehe → 0.
export function huepfHoehe(bojen, i, dauer, hoehe) {
  const zeit = bojen.huepfZeit[i];
  return zeit < 0 ? 0 : hoehe * Math.sin((Math.PI * zeit) / dauer);
}
