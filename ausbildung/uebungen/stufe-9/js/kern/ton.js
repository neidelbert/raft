// Baustein „ton“: kurze Klänge per WebAudio, ganz ohne Ton-Dateien, erst nach der ersten Berührung.
// Wofür: Treffer, Einsammeln, Knöpfe. Browser erlauben Ton erst nach einer Berührung (iPhone: sonst stumm). Darum
//   legt erst wecke() den AudioContext an; vorher ist bereit = false und spiele() tut nichts. Safari hält den
//   AudioContext nach Anruf oder App-Wechsel an: Jede weitere Berührung weckt ihn wieder. Fehlt WebAudio, läuft das
//   Spiel stumm weiter. Jeder Klang braucht einen neuen Oszillator (WebAudio-Quellen spielen nur einmal): Das ist
//   in Ordnung bei Ereignissen, aber nie in jedem Bild. Gleicher Klang höchstens alle mindestAbstand Sekunden.
//   Kein Zugriff auf den Browser beim Laden (mit node und einem nachgebauten AudioContext testbar).
// Schnittstelle:
//   erstelleTon({ lautstaerke = 0.5, mindestAbstand = 0.05 }, klaenge, AudioKlasse) → ton
//     klaenge = { name: { frequenz (Hz), dauer (s), art ('square'|'triangle'|'sine'|'sawtooth'), laut (0–1),
//       gleiten (Hz bis zum Ende, + steigt, − fällt) } } (aus config).
//     AudioKlasse: nur für Tests; Standard ist window.AudioContext oder webkitAudioContext.
//   ton.bereit: true, sobald der AudioContext nach einer Berührung angelegt ist (eigener Merker: im Test-Chromium
//     läuft ein AudioContext auch ohne Berührung, dort sagt audio.state nichts).
//   ton.an: Ton-Einstellung (aus dem Spielstand setzen). ton.wecke(): bei Berührung aufrufen.
//   ton.verbinde(ziel = window) → trenne(): ruft wecke bei pointerdown, touchend und keydown (Fangphase) auf.
//     iPhone-Safari zählt je nach Version erst touchend als Erlaubnis, darum alle drei.
//   ton.spiele(name) → true, wenn der Klang gespielt wurde. Gibt es für name einen Puffer (Sound-Datei), wird er
//     gespielt, sonst der Klang aus klaenge (so ist der Code-Klang der Ersatz, wenn die Datei fehlt).
//   ton.audio: der AudioContext (null bis zur ersten Berührung), z. B. für dekodiereSounds aus bausteine/assets.js.
//   ton.setzePuffer(name, puffer, laut = 1): dekodierte Sound-Datei (AudioBuffer) unter name ablegen.
//     Puffer sind schnell und dürfen gleichzeitig mehrfach laufen (je Abspielen ein AudioBufferSourceNode).
// Beispiel:
//   import { erstelleTon } from './kern/ton.js';
//   const ton = erstelleTon(TON, KLAENGE);          // KLAENGE.treffer = { frequenz: 180, dauer: 0.18, art: 'square', laut: 0.25, gleiten: -110 }
//   ton.an = speicher.stand.ton;
//   ton.verbinde();
//   ton.spiele('treffer');
//   // mit Sound-Datei (bausteine/assets.js), nach dem Wecken:
//   dekodiereSounds(assets, ton.audio).then(() => ton.setzePuffer('explosion', assets.sounds.explosion.puffer, 0.8));

export function erstelleTon({ lautstaerke = 0.5, mindestAbstand = 0.05 } = {}, klaenge = {}, AudioKlasse = null) {
  const ton = { bereit: false, an: true, audio: null, wecke, spiele, verbinde, setzePuffer };
  let audio = null, gesamt = null;
  const zuletzt = {};   // name → audio.currentTime des letzten Klangs
  const puffer = {};    // name → { puffer: AudioBuffer, laut }

  function wecke() {
    if (!audio) {
      const Klasse = AudioKlasse || globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Klasse) return;
      try { audio = new Klasse(); } catch { return; }   // z. B. zu viele AudioContexts: stumm weiter
      gesamt = audio.createGain();
      gesamt.gain.value = lautstaerke;
      gesamt.connect(audio.destination);
      ton.audio = audio;
      ton.bereit = true;
    }
    if (audio.state !== 'running') {
      try { audio.resume()?.catch?.(() => {}); } catch { /* alter Safari ohne Promise: nächster Versuch beim nächsten Tipp */ }
    }
  }

  function verbinde(ziel = globalThis.window) {
    const arten = ['pointerdown', 'touchend', 'keydown'];
    for (const art of arten) ziel.addEventListener(art, wecke, { capture: true });
    return () => { for (const art of arten) ziel.removeEventListener(art, wecke, { capture: true }); };
  }

  function setzePuffer(name, p, laut = 1) { if (p) puffer[name] = { puffer: p, laut }; }

  function spielePuffer(eintrag, t) {
    const quelle = audio.createBufferSource(), verst = audio.createGain();
    quelle.buffer = eintrag.puffer;
    verst.gain.value = eintrag.laut;
    quelle.connect(verst).connect(gesamt);
    quelle.start(t);
    return true;
  }

  function spiele(name) {
    if (!ton.bereit || !ton.an) return false;
    const k = klaenge[name], p = puffer[name], t = audio.currentTime;
    if ((!k && !p) || t - (zuletzt[name] ?? -Infinity) < mindestAbstand) return false;
    zuletzt[name] = t;
    if (p) return spielePuffer(p, t);
    const osz = audio.createOscillator(), verst = audio.createGain();
    osz.type = k.art;
    osz.frequency.setValueAtTime(k.frequenz, t);
    if (k.gleiten) osz.frequency.exponentialRampToValueAtTime(Math.max(30, k.frequenz + k.gleiten), t + k.dauer);
    verst.gain.setValueAtTime(k.laut, t);
    verst.gain.exponentialRampToValueAtTime(0.0001, t + k.dauer);   // exponentiell geht nicht bis 0
    osz.connect(verst).connect(gesamt);
    osz.start(t);
    osz.stop(t + k.dauer);
    return true;
  }

  return ton;
}
