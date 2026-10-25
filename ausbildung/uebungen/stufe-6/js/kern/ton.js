// Ton per WebAudio, ganz ohne Ton-Dateien. Browser erlauben Ton erst nach einer Berührung (iPhone: sonst stumm).
// erstelleTon(einstellung, klaenge) gibt { bereit, an, wecke(), spiele(name) } zurück:
//   wecke(): bei jeder Berührung aufrufen. Legt beim ersten Mal den AudioContext an (dann bereit = true) und weckt
//     ihn wieder auf, falls Safari ihn angehalten hat (Anruf, App-Wechsel). Ohne WebAudio bleibt bereit = false.
//   spiele(name): Klang aus klaenge spielen, nur wenn bereit und an. Gleicher Klang höchstens alle mindestAbstand s.
//   an: Ton-Einstellung (steht im Spielstand, main.js setzt sie).
// Jeder Klang braucht einen neuen Oszillator: WebAudio-Quellen spielen nur einmal. Das passiert nur bei
// Ereignissen (Treffer, Stern), nie in jedem Bild.
export function erstelleTon(einstellung, klaenge) {
  const ton = { bereit: false, an: true, wecke, spiele };
  let audio = null, gesamt = null;
  const zuletzt = {};   // name → audio.currentTime des letzten Klangs

  function wecke() {
    if (!audio) {
      const Klasse = window.AudioContext || window.webkitAudioContext;
      if (!Klasse) return;
      try { audio = new Klasse(); } catch { return; }   // z. B. zu viele AudioContexts: Spiel läuft stumm weiter
      gesamt = audio.createGain();
      gesamt.gain.value = einstellung.lautstaerke;
      gesamt.connect(audio.destination);
      ton.bereit = true;
    }
    if (audio.state !== 'running') {
      try { audio.resume()?.catch?.(() => {}); } catch { /* alter Safari ohne Promise: nächster Versuch beim nächsten Tipp */ }
    }
  }

  function spiele(name) {
    if (!ton.bereit || !ton.an) return;
    const k = klaenge[name], t = audio.currentTime;
    if (!k || t - (zuletzt[name] ?? -Infinity) < einstellung.mindestAbstand) return;
    zuletzt[name] = t;
    const osz = audio.createOscillator(), verst = audio.createGain();
    osz.type = k.art;
    osz.frequency.setValueAtTime(k.frequenz, t);
    if (k.gleiten) osz.frequency.exponentialRampToValueAtTime(Math.max(30, k.frequenz + k.gleiten), t + k.dauer);
    verst.gain.setValueAtTime(k.laut, t);
    verst.gain.exponentialRampToValueAtTime(0.0001, t + k.dauer);   // exponentiell geht nicht bis 0, daher 0,0001
    osz.connect(verst).connect(gesamt);
    osz.start(t);
    osz.stop(t + k.dauer);
  }

  return ton;
}
