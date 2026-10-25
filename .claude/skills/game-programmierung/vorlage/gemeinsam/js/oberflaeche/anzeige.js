// HTML-Anzeige: Ladebildschirm mit Balken, Titel- und Ende-Tafel, Leiste (Punkte, Zeit), Ton-Knopf.
// Der Ladebildschirm steht schon im HTML (erscheint sofort, ohne Assets); hier wird er nur gesteuert.
// Texte nur über textContent (nie innerHTML). Die Leiste schreibt nur, wenn sich eine Zahl geändert hat
// (kein neuer Text in jedem Bild).
// erstelleAnzeige(dokument) → { fortschritt(anteil), zeigeTitel(rekord), zeigeSpiel(runde), aktualisiereLeiste(runde),
//   zeigeEnde(punkte, rekord), zeigeTon(an) }

export function erstelleAnzeige(dokument) {
  const hole = (id) => dokument.getElementById(id);
  const laden = hole('laden'), balken = hole('balken-fuellung'), titel = hole('titel'), ende = hole('ende'), leiste = hole('leiste');
  const knopfTon = hole('knopf-ton');
  const zuletzt = { punkte: -1, zeit: -1 };

  function zeigeNur(tafel) {
    for (const t of [laden, titel, ende]) t.hidden = t !== tafel;
    leiste.hidden = tafel !== null;
  }

  const anzeige = {
    fortschritt(anteil) {
      balken.style.transform = `scaleX(${anteil})`;
      laden.setAttribute('aria-valuenow', String(Math.round(anteil * 100)));
    },
    zeigeTitel(rekord) {
      hole('titel-rekord').textContent = `Rekord: ${rekord}`;
      zeigeNur(titel);
    },
    zeigeSpiel(runde) {
      zuletzt.punkte = -1;   // sofort die neuen Werte zeigen (Lernbuch Stufe 4)
      zuletzt.zeit = -1;
      anzeige.aktualisiereLeiste(runde);
      zeigeNur(null);
    },
    aktualisiereLeiste(runde) {
      const zeit = Math.ceil(runde.zeit);
      if (runde.punkte !== zuletzt.punkte) { zuletzt.punkte = runde.punkte; hole('leiste-punkte').textContent = `Punkte ${runde.punkte}`; }
      if (zeit !== zuletzt.zeit) { zuletzt.zeit = zeit; hole('leiste-zeit').textContent = `Zeit ${zeit}`; }
    },
    zeigeEnde(punkte, rekord) {
      hole('ende-punkte').textContent = `Punkte: ${punkte}`;
      hole('ende-rekord').textContent = `Rekord: ${rekord}`;
      zeigeNur(ende);
    },
    zeigeTon(an) {
      knopfTon.textContent = an ? 'Ton an' : 'Ton aus';
      knopfTon.setAttribute('aria-pressed', String(an));
    },
  };
  return anzeige;
}
