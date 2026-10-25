// Baustein „animation“: Rahmen-Animation (Spritesheet) mit Delta-Zeit, als Schleife oder einmal, und Zeichnen mit Anker.
// Wofür: Laufen, Explosion, drehende Münze aus einem Atlas (werkzeuge/atlas.js, geladen mit bausteine/assets.js).
//   Der Rahmen hängt von der vergangenen Zeit ab, nie von der Zahl gezeichneter Bilder: gleich schnell auf jedem
//   Gerät. Die Animationsdaten teilen sich alle Figuren; jede Figur hat nur einen kleinen Abspieler (zeit, index).
//   Einmalige Animationen bleiben auf dem letzten Rahmen stehen und melden genau einmal „fertig“ (dann entfernen).
//   Gezeichnet wird um den Anker (Fußpunkt): Rahmen mit verschiedenem Zuschnitt wackeln nicht, Spiegeln (Blick nach
//   links) dreht um den Fußpunkt. Keine neuen Objekte pro Bild. Kein Zugriff auf den Browser (mit node testbar).
// Schnittstelle:
//   animation = { rahmen: ['held-lauf-1', …], bps (Bilder pro Sekunde), schleife (bool) } (aus dem Atlas-JSON)
//   erstelleAbspieler(animation = null) → abspieler = { animation, zeit (s), index, fertig }
//   spieleAb(abspieler, animation, vonVorn = false): andere Animation → von vorn; dieselbe läuft weiter
//     (außer vonVorn, z. B. eine Explosion neu starten).
//   aktualisiereAnimation(abspieler, dt, tempo = 1) → true genau in dem Bild, in dem eine einmalige Animation fertig
//     wird. tempo: Faktor auf bps (z. B. Rennen 14 statt 10 bps: tempo = 14 / 10).
//   rahmenIndex(animation, zeit) → Index des Rahmens zu dieser Zeit (reine Rechnung).
//   rahmenName(abspieler) → Name des aktuellen Rahmens (oder '').
//   zeichneRahmen(ctx, rahmen, x, y, skala = 1, blick = 1): rahmen = { bild, x, y, b, h, ankerX, ankerY } (aus
//     assets.rahmen), (x, y) = Fußpunkt in Punkten, skala: Pixel → Punkte (Atlas doppelt aufgelöst: 0.5),
//     blick −1 spiegelt nach links. Gibt false zurück, wenn kein Rahmen da ist (dann nichts gezeichnet).
// Beispiel:
//   import { erstelleAbspieler, spieleAb, aktualisiereAnimation, rahmenName, zeichneRahmen } from './kern/animation.js';
//   const held = { x: 100, y: 400, blick: 1, abspieler: erstelleAbspieler() };
//   // in aktualisiere(dt):
//   spieleAb(held.abspieler, laeuft ? assets.animationen['held-lauf'] : holeAnimation(assets, 'held-steht'));
//   aktualisiereAnimation(held.abspieler, dt, HELD.bpsRennen / assets.animationen['held-lauf'].bps);
//   // in zeichne():
//   zeichneRahmen(ctx, assets.rahmen[rahmenName(held.abspieler)], held.x, held.y, 0.5, held.blick);

export function erstelleAbspieler(animation = null) {
  return { animation, zeit: 0, index: 0, fertig: false };
}

export function rahmenIndex(animation, zeit) {
  const anzahl = animation.rahmen.length;
  const schritt = Math.floor(zeit * animation.bps);
  return animation.schleife ? schritt % anzahl : Math.min(schritt, anzahl - 1);
}

export function spieleAb(abspieler, animation, vonVorn = false) {
  if (abspieler.animation === animation && !vonVorn) return;
  abspieler.animation = animation;
  abspieler.zeit = 0;
  abspieler.index = 0;
  abspieler.fertig = false;
}

export function aktualisiereAnimation(abspieler, dt, tempo = 1) {
  const a = abspieler.animation;
  if (!a || abspieler.fertig) return false;
  abspieler.zeit += dt * tempo;
  const dauer = a.rahmen.length / a.bps;
  if (a.schleife) {
    if (abspieler.zeit >= dauer) abspieler.zeit %= dauer;   // klein halten: keine Ungenauigkeit nach Stunden
  } else if (abspieler.zeit >= dauer) {
    abspieler.index = a.rahmen.length - 1;
    abspieler.fertig = true;
    return true;
  }
  abspieler.index = rahmenIndex(a, abspieler.zeit);
  return false;
}

export function rahmenName(abspieler) {
  return abspieler.animation ? abspieler.animation.rahmen[abspieler.index] : '';
}

export function zeichneRahmen(ctx, rahmen, x, y, skala = 1, blick = 1) {
  if (!rahmen) return false;
  const b = rahmen.b * skala, h = rahmen.h * skala;
  if (blick < 0) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(-1, 1);   // um den Fußpunkt spiegeln: Figur bleibt an derselben Stelle
    ctx.drawImage(rahmen.bild, rahmen.x, rahmen.y, rahmen.b, rahmen.h, -rahmen.ankerX * skala, -rahmen.ankerY * skala, b, h);
    ctx.restore();
  } else {
    // Ganze Punkte: scharf und in Chrome ohne neuen Speicher pro Aufruf (Lernbuch Stufe 3).
    ctx.drawImage(rahmen.bild, rahmen.x, rahmen.y, rahmen.b, rahmen.h,
      Math.round(x - rahmen.ankerX * skala), Math.round(y - rahmen.ankerY * skala), b, h);
  }
  return true;
}
