// Rückmeldung bei Treffern: Bildschirm wackeln und Figur rot aufblitzen (Regeln ohne DOM, mit node testbar).
// Effekte sind { wackeln, blitz, versatzX, versatzY }:
//   wackeln = Stärke 0 … 1 (springt bei Treffer an, klingt linear ab); versatzX/Y = Verschiebung des Bildes in
//   ganzen Punkten für dieses Bild (max · wackeln² · Zufall, quadratisch: kräftiger Stoß, sanftes Ausklingen);
//   blitz = 1 … 0 (Anteil des roten Aufblitzens, 1 direkt nach dem Treffer).

export function erstelleEffekte() { return { wackeln: 0, blitz: 0, versatzX: 0, versatzY: 0 }; }

// Ein Treffer am Spieler: Wackeln dazu (nie über 1), Blitz von vorn.
export function loeseTrefferAus(effekte, wackelnEinstellung, blitzEinstellung) {
  effekte.wackeln = Math.min(1, effekte.wackeln + wackelnEinstellung.trefferStaerke);
  effekte.blitz = blitzEinstellung.dauer > 0 ? 1 : 0;
}

// Jedes Bild (in allen Zuständen, damit es auch auf der Ende-Tafel ausklingt).
export function aktualisiereEffekte(effekte, dt, zufall, wackelnEinstellung, blitzEinstellung) {
  if (effekte.wackeln === 0 && effekte.blitz === 0 && effekte.versatzX === 0 && effekte.versatzY === 0) return;   // Ruhe: nichts zu rechnen
  effekte.wackeln = Math.max(0, effekte.wackeln - dt * wackelnEinstellung.abklingen);
  effekte.blitz = blitzEinstellung.dauer > 0 ? Math.max(0, effekte.blitz - dt / blitzEinstellung.dauer) : 0;
  const weite = wackelnEinstellung.versatzMax * effekte.wackeln * effekte.wackeln;
  // Ganze Punkte: Canvas-Befehle mit Kommazahlen kosten in Chrome Speicher (Lernbuch Stufe 3).
  effekte.versatzX = Math.round(weite * (zufall() * 2 - 1));
  effekte.versatzY = Math.round(weite * (zufall() * 2 - 1));
}
