// HTML-Anzeige über dem Canvas: Tafel (Titel und Ende) und Leiste (Punkte und Leben während des Spiels).
// erstelleAnzeige(texte) gibt { zeigeTitel(rekord), zeigeEnde(punkte, rekord), versteckeTafel(), zeigeLeiste(an),
//   aktualisiereLeiste(punkte, leben), zeigeTon(an) } zurück. Alles mit textContent (nie innerHTML: der Rekord kommt aus dem Speicher).
// Die Leiste schreibt nur, wenn sich eine Zahl geändert hat: kein neuer Text in jedem Bild.

function fuelle(vorlage, werte) { return vorlage.replace(/\{(\w+)\}/g, (_, name) => String(werte[name])); }

export function erstelleAnzeige(texte) {
  const tafel = document.getElementById('tafel');
  const [grossFeld, punkteZeile, rekordZeile, hinweisFeld] = ['tafel-gross', 'tafel-punkte', 'tafel-rekord', 'tafel-hinweis']
    .map((id) => document.getElementById(id));
  const leiste = document.getElementById('leiste');
  const punkteFeld = document.getElementById('leiste-punkte');
  const lebenFeld = document.getElementById('leiste-leben');
  const tonKnopf = document.getElementById('knopf-ton');
  let gezeigtePunkte = -1, gezeigteLeben = -1;

  // Leere Zeilen blendet stil.css aus (:empty).
  function zeigeTafel(art, gross, punkte, rekord, hinweis) {
    grossFeld.textContent = gross;
    punkteZeile.textContent = punkte;
    rekordZeile.textContent = rekord;
    hinweisFeld.textContent = hinweis;
    tafel.dataset.art = art;
    tafel.hidden = false;
  }

  return {
    zeigeTitel(rekord) { zeigeTafel('titel', texte.titel, '', fuelle(texte.rekord, { rekord }), ''); },
    zeigeEnde(punkte, rekord) {
      zeigeTafel('ende', texte.ende, fuelle(texte.punkteEnde, { punkte }), fuelle(texte.rekord, { rekord }), texte.neueRunde);
    },
    versteckeTafel() { tafel.hidden = true; },
    zeigeLeiste(an) { leiste.hidden = !an; },
    aktualisiereLeiste(punkte, leben) {
      if (punkte !== gezeigtePunkte) { punkteFeld.textContent = fuelle(texte.anzeigePunkte, { punkte }); gezeigtePunkte = punkte; }
      if (leben !== gezeigteLeben) { lebenFeld.textContent = fuelle(texte.anzeigeLeben, { leben }); gezeigteLeben = leben; }
    },
    // Ton-Knopf beschriften: zeigt, was gerade gilt („Ton an“ / „Ton aus“).
    zeigeTon(an) {
      tonKnopf.textContent = an ? texte.tonAn : texte.tonAus;
      tonKnopf.setAttribute('aria-pressed', String(an));
      tonKnopf.classList.toggle('aus', !an);
    },
  };
}
