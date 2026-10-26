// Baustein „assets“: lädt alles aus assets/assets.json (Manifest von werkzeuge/manifest.js) mit Fortschritt,
// Zeitgrenze je Asset und Ersatz. Ein fehlendes oder hängendes Asset hält das Spiel nie an.
// Wofür: jedes Spiel mit Atlanten, Bildern, Sounds, Schriften oder Modellen. Jede Adresse bekommt ?v=<version>
//   (Safari nimmt sonst alte Dateien aus dem Zwischenspeicher); das Manifest selbst wird ohne Zwischenspeicher geholt.
//   Bilder werden vor dem Zurückgeben dekodiert (kein Ruckeln beim ersten Zeichnen). Sounds werden erst geladen
//   (Bytes) und nach der ersten Berührung dekodiert (dekodiereSounds), weil der AudioContext erst dann entsteht
//   (bausteine/ton.js). Abgespielt wird über ton.setzePuffer/ton.spiele: ein Ort für Ton an/aus und Abstand.
//   Fehlschläge: console.warn (kein Fehler). Nur die Browser-Zeile „Failed to load resource“ lässt sich nicht
//   verhindern (Lernbuch Stufe 6). Kein Zugriff auf den Browser beim Laden des Moduls (mit node testbar).
// Schnittstelle:
//   ladeAssets(adresse = 'assets/assets.json', optionen) → Promise<assets>, wird nie abgelehnt.
//     optionen: zeitgrenze (ms je Asset, auch fürs Manifest; Standard 8000), beiFortschritt(anteil 0…1),
//       ladeModell(adresse) → Promise<Modell> (z. B. GLTFLoader.loadAsync; ohne: Modelle werden übersprungen),
//       arten: nur diese Arten laden, z. B. ['modelle'] für eine 3D-Seite (Standard: alle),
//       ersatz(bekannt) → { rahmen: { name: rahmen }, animationen: { name: animation } }: nur aufgerufen, wenn ein Atlas
//         (oder das Manifest) fehlt; füllt nur Namen, die dann noch fehlen. bekannt = { rahmen: { name: { b, h, ankerX,
//         ankerY } }, animationen } listet alles aus den fehlenden Atlanten (aus dem Manifest, werkzeuge/manifest.js;
//         leer, wenn das Manifest fehlt): So bekommt jeder Rahmen (Figur, Gegner, Effekte) einen Ersatz in seiner Größe
//         mit seinem Fußpunkt, und die Animationen aus dem Manifest gelten weiter (sie zeigen dann auf die Ersatz-Rahmen).
//         umgebung: nur für Tests (fetch, ladeBild, kannAbspielen, ladeSchrift, erstelleLeinwand, warte).
//   assets = {
//     version, fortschritt (0…1, steigt nur), status: { geladen: [], ersetzt: [], fehlend: [] },
//       fehlend: Einträge, deren Datei nicht kam (404, Netz, Zeitgrenze, kaputt);
//       ersetzt: Namen, für die jetzt ein Ersatz gilt (Bild → Ersatzfarbe, Sound → Stille, Schrift → Systemschrift,
//       Modell → null, das Spiel zeigt eine Box; bei Atlanten die Rahmen-Namen aus ersatz()).
//     atlanten: { name: { bild, breite, hoehe } },
//     rahmen: { name: { bild, x, y, b, h, ankerX, ankerY } } (aus allen Atlanten; Anker = Fußpunkt im Rahmen),
//     animationen: { name: { rahmen: [rahmenName], bps, schleife } },
//     bilder: { name: Image oder Ersatz-Canvas (8 × 8 in der Ersatzfarbe, für createPattern geeignet) },
//     sounds: { name: { laut, bytes (ArrayBuffer bis zum Dekodieren), puffer (AudioBuffer) } }, dekodiert (Anzahl),
//     schriften: { name: true (geladen) | false (Systemschrift) }, modelle: { name: Modell | null },
//     ladeSpaeter(): Promise, lädt die Einträge aus „spaeter“ (ohne Fortschritt) }
//   dekodiereSounds(assets, audio) → Promise<Anzahl>: einmal nach der ersten Berührung (mehrfacher Aufruf ist harmlos).
//   holeAnimation(assets, name) → Animation; ein einzelner Rahmen gilt als Animation mit einem Rahmen; sonst null.
// Beispiel:
//   import { ladeAssets, dekodiereSounds } from './kern/assets.js';
//   const assets = await ladeAssets('assets/assets.json', { zeitgrenze: LADEN.zeitgrenze,
//     beiFortschritt: (a) => { balken.style.transform = `scaleX(${a})`; }, ersatz: () => baueErsatzRahmen() });
//   // beim Tippen zum Starten: ton.wecke(); dekodiereSounds(assets, ton.audio).then(() => {
//   //   for (const [name, s] of Object.entries(assets.sounds)) if (s.puffer) ton.setzePuffer(name, s.puffer, s.laut); });

const ENDUNG_ZU_TYP = { m4a: 'audio/mp4; codecs="mp4a.40.2"', mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav' };

function browserUmgebung() {
  return {
    fetch: (adresse, optionen) => globalThis.fetch(adresse, optionen),
    ladeBild(adresse, signal) {
      return new Promise((ja, nein) => {
        const bild = new Image();
        signal.addEventListener('abort', () => { bild.src = ''; nein(new Error('abgebrochen')); });
        bild.onload = () => (bild.decode ? bild.decode().catch(() => {}) : Promise.resolve()).then(() => ja(bild));
        bild.onerror = () => nein(new Error('Bild nicht ladbar'));
        bild.src = adresse;
      });
    },
    kannAbspielen(datei) {
      const typ = ENDUNG_ZU_TYP[datei.split('.').pop().toLowerCase()];
      return Boolean(typ && document.createElement('audio').canPlayType(typ));
    },
    async ladeSchrift(name, adresse) {
      const schrift = new FontFace(name, `url("${adresse}")`);
      await schrift.load();
      document.fonts.add(schrift);
    },
    erstelleLeinwand(farbe) {
      const leinwand = document.createElement('canvas');
      leinwand.width = 8; leinwand.height = 8;
      const ctx = leinwand.getContext('2d');
      ctx.fillStyle = farbe; ctx.fillRect(0, 0, 8, 8);
      return leinwand;
    },
    warte: (ms, f) => { const id = setTimeout(f, ms); return () => clearTimeout(id); },
  };
}

// Führt arbeit(signal) aus; nach ms wird abgebrochen und abgelehnt. Ein hängender Server blockiert so nie.
function mitZeitgrenze(u, ms, arbeit) {
  const steuerung = new AbortController();
  let stoppeUhr = null;
  const grenze = new Promise((_, nein) => {
    stoppeUhr = u.warte(ms, () => { steuerung.abort(); nein(new Error(`Zeitgrenze ${ms} ms überschritten`)); });
  });
  return Promise.race([arbeit(steuerung.signal), grenze]).finally(() => stoppeUhr());
}

async function holeDaten(u, adresse, signal, art) {
  const antwort = await u.fetch(adresse, { signal });
  if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
  return art === 'json' ? antwort.json() : antwort.arrayBuffer();
}

export function holeAnimation(assets, name) {
  if (assets.animationen[name]) return assets.animationen[name];
  if (!assets.rahmen[name]) return null;
  assets.animationen[name] = { rahmen: [name], bps: 1, schleife: true };   // einmal anlegen, dann wiederverwenden
  return assets.animationen[name];
}

export async function ladeAssets(adresse = 'assets/assets.json', { zeitgrenze = 8000, beiFortschritt = null,
  ladeModell = null, ersatz = null, arten = null, umgebung = null } = {}) {
  const u = { ...browserUmgebung(), ...umgebung };
  const basis = adresse.slice(0, adresse.lastIndexOf('/') + 1);
  const assets = {
    version: '', fortschritt: 0, status: { geladen: [], ersetzt: [], fehlend: [] },
    atlanten: {}, rahmen: {}, animationen: {}, bilder: {}, sounds: {}, dekodiert: 0, schriften: {}, modelle: {},
    ladeSpaeter: () => Promise.resolve(),
  };
  const melde = (anteil) => {
    if (anteil <= assets.fortschritt) return;   // nie zurück
    assets.fortschritt = anteil;
    if (beiFortschritt) beiFortschritt(anteil);
  };

  let manifest = null;
  try {
    manifest = await mitZeitgrenze(u, zeitgrenze, async (signal) => {
      const antwort = await u.fetch(adresse, { signal, cache: 'no-cache' });   // Einstieg: immer frisch
      if (!antwort.ok) throw new Error(`Status ${antwort.status}`);
      return antwort.json();
    });
  } catch (e) {
    console.warn(`Asset-Liste fehlt oder ist unlesbar: ${adresse} (${e.message}), alles mit Ersatz`);
    assets.status.fehlend.push(adresse);
  }
  const m = { version: '', atlanten: [], bilder: [], sounds: [], schriften: [], modelle: [], spaeter: [], ...manifest };
  assets.version = String(m.version);
  const voll = (datei) => `${basis}${datei}?v=${encodeURIComponent(assets.version)}`;

  // Lader je Art: (eintrag, signal) → Promise; werfen heißt fehlend.
  const LADER = {
    atlanten: async (e, signal) => {
      const [daten, bild] = await Promise.all([holeDaten(u, voll(e.daten), signal, 'json'), u.ladeBild(voll(e.bild), signal)]);
      assets.atlanten[e.name] = { bild, breite: daten.breite, hoehe: daten.hoehe };
      for (const [name, r] of Object.entries(daten.rahmen)) assets.rahmen[name] = { bild, ...r };
      Object.assign(assets.animationen, daten.animationen);
    },
    bilder: async (e, signal) => { assets.bilder[e.name] = await u.ladeBild(voll(e.datei), signal); },
    sounds: async (e, signal) => {
      const passend = e.dateien.filter((d) => u.kannAbspielen(d));
      if (!passend.length) throw new Error('kein abspielbares Format');
      let letzterFehler = null;
      for (const datei of passend) {   // erstes abspielbares Format; fehlt die Datei, das nächste
        try { assets.sounds[e.name] = { laut: e.laut ?? 1, bytes: await holeDaten(u, voll(datei), signal, 'bytes'), puffer: null }; return; }
        catch (f) { letzterFehler = f; if (signal.aborted) break; }
      }
      throw letzterFehler;
    },
    schriften: async (e) => { await u.ladeSchrift(e.name, voll(e.datei)); assets.schriften[e.name] = true; },
    modelle: async (e) => { assets.modelle[e.name] = await ladeModell(voll(e.datei)); },
  };
  const ERSATZ = {
    bilder: (e) => { assets.bilder[e.name] = u.erstelleLeinwand(e.ersatz || '#808080'); assets.status.ersetzt.push(e.name); },
    sounds: (e) => { assets.sounds[e.name] = { laut: e.laut ?? 1, bytes: null, puffer: null }; assets.status.ersetzt.push(e.name); },
    schriften: (e) => { assets.schriften[e.name] = false; assets.status.ersetzt.push(e.name); },
    modelle: (e) => { assets.modelle[e.name] = null; assets.status.ersetzt.push(e.name); },
  };

  async function ladeTeil(auswahl, mitFortschritt) {
    const aufgaben = [];
    for (const art of Object.keys(LADER)) {
      if ((art === 'modelle' && !ladeModell) || (arten && !arten.includes(art))) continue;   // 2D-Seite: keine Modelle
      for (const e of Array.isArray(m[art]) ? m[art] : []) if (auswahl(e)) aufgaben.push([art, e]);
    }
    let fertig = 0, atlasFehlt = !manifest;
    const fehlendeAtlanten = [];
    await Promise.all(aufgaben.map(async ([art, e]) => {
      try {
        await mitZeitgrenze(u, zeitgrenze, (signal) => LADER[art](e, signal));
        assets.status.geladen.push(e.name);
      } catch (f) {
        console.warn(`Asset „${e.name}“ fehlt (${f.message}), Ersatz wird benutzt`);
        assets.status.fehlend.push(e.name);
        if (art === 'atlanten') { atlasFehlt = true; fehlendeAtlanten.push(e); }
        else ERSATZ[art](e);
      }
      fertig++;
      if (mitFortschritt) melde(fertig / aufgaben.length);
    }));
    // Ersatz-Rahmen nur zeichnen lassen, wenn ein Atlas fehlt: Ersatz-Zeichnungen kosten Zeit und Speicher.
    if (ersatz && atlasFehlt) ergaenzeErsatz(fehlendeAtlanten);
  }

  function ergaenzeErsatz(fehlende) {
    const bekannt = { rahmen: {}, animationen: {} };
    for (const e of fehlende) {
      if (e.rahmen && typeof e.rahmen === 'object') Object.assign(bekannt.rahmen, e.rahmen);
      if (e.animationen && typeof e.animationen === 'object') Object.assign(bekannt.animationen, e.animationen);
    }
    const { rahmen = {}, animationen = {} } = ersatz(bekannt) || {};
    for (const [name, r] of Object.entries(rahmen)) {
      if (assets.rahmen[name]) continue;
      assets.rahmen[name] = r;
      assets.status.ersetzt.push(name);
    }
    // Animationen aus dem Manifest gelten weiter (zeigen auf die Ersatz-Rahmen); eigene aus ersatz() gehen vor.
    for (const [name, a] of Object.entries({ ...bekannt.animationen, ...animationen })) if (!assets.animationen[name]) assets.animationen[name] = a;
  }

  const spaeter = new Set(m.spaeter);
  await ladeTeil((e) => !spaeter.has(e.name), true);
  melde(1);
  assets.ladeSpaeter = () => ladeTeil((e) => spaeter.has(e.name), false);
  return assets;
}

const laufendeDekodierung = new WeakMap();   // assets → Promise, damit ein zweiter Aufruf auf den ersten wartet
export function dekodiereSounds(assets, audio) {
  if (!audio) return Promise.resolve(assets.dekodiert);
  const offen = Object.entries(assets.sounds).filter(([, s]) => s.bytes && !s.puffer);
  if (!offen.length) return laufendeDekodierung.get(assets) || Promise.resolve(assets.dekodiert);
  const dekodierung = Promise.all(offen.map(([name, s]) => {
    const bytes = s.bytes;
    s.bytes = null;   // decodeAudioData übernimmt die Bytes; ein zweiter Aufruf dekodiert nicht doppelt
    // Safari vor 14.1 kennt nur die Form mit Rückruf; beide Formen abdecken.
    return new Promise((ja, nein) => { const p = audio.decodeAudioData(bytes, ja, nein); if (p && p.then) p.then(ja, nein); })
      .then((puffer) => { s.puffer = puffer; assets.dekodiert++; })
      .catch((f) => {
        console.warn(`Sound „${name}“ lässt sich nicht dekodieren (${f && f.message}), Stille`);
        assets.status.fehlend.push(name);
        assets.status.ersetzt.push(name);
      });
  })).then(() => assets.dekodiert);
  laufendeDekodierung.set(assets, dekodierung);
  return dekodierung;
}
